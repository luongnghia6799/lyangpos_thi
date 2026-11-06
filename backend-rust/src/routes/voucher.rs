use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Datelike;
use serde::Deserialize;
use serde_json::json;
use sqlx::{Row, SqlitePool};
use std::collections::HashMap;

use crate::error::AppError;
use crate::models::partner::Partner;
use crate::models::voucher::{CashVoucher, CashVoucherResponse, CreateVoucherDto, UpdateVoucherDto, VoucherQueryDto};
use crate::routes::partner::recalculate_partner_debt_internal;

pub async fn get_vouchers(
    State(pool): State<SqlitePool>,
    Query(params): Query<VoucherQueryDto>,
) -> Result<impl IntoResponse, AppError> {
    let partners: Vec<Partner> = sqlx::query_as(
        "SELECT id, name, type, \
         CAST(is_customer AS BOOLEAN) as is_customer, \
         CAST(is_supplier AS BOOLEAN) as is_supplier, \
         cccd, phone, address, \
         CAST(debt_balance AS REAL) as debt_balance FROM partner"
    )
    .fetch_all(&pool)
    .await?;

    let partner_map: HashMap<i64, String> = partners.into_iter().map(|p| (p.id, p.name)).collect();

    // Fetch orders display_id map
    let orders_rows = sqlx::query("SELECT id, display_id FROM \"order\"")
        .fetch_all(&pool)
        .await?;

    let mut order_map: HashMap<i64, String> = HashMap::new();
    for row in orders_rows {
        let oid: i64 = row.get("id");
        let disp: Option<String> = row.get("display_id");
        order_map.insert(oid, disp.unwrap_or_else(|| oid.to_string()));
    }

    let vouchers: Vec<CashVoucher> = sqlx::query_as(
        "SELECT id, partner_id, CAST(amount AS REAL) as amount, date, note, type, source, order_id \
         FROM cash_voucher ORDER BY date DESC"
    )
    .fetch_all(&pool)
    .await?;

    let mut response_list = Vec::new();

    for v in vouchers {
        // Filter partner
        if let Some(p_id) = params.partner_id {
            if p_id == 0 {
                if v.partner_id.is_some() {
                    continue;
                }
            } else if v.partner_id != Some(p_id) {
                continue;
            }
        }

        // Filter source
        if let Some(ref src) = params.source {
            if v.source.as_deref() != Some(src) {
                continue;
            }
        }

        // Filter date/time
        if let Some(ref dt) = v.date {
            let v_year = dt.date().year();
            let v_month = dt.date().month();
            let v_day = dt.date().day();

            if let Some(y) = params.year {
                if v_year != y {
                    continue;
                }
            }
            if let Some(m) = params.month {
                if v_month != m {
                    continue;
                }
            }
            if let Some(d) = params.day {
                if v_day != d {
                    continue;
                }
            }
            if let Some(q) = params.quarter {
                let in_q = match q {
                    1 => (1..=3).contains(&v_month),
                    2 => (4..=6).contains(&v_month),
                    3 => (7..=9).contains(&v_month),
                    4 => (10..=12).contains(&v_month),
                    _ => true,
                };
                if !in_q {
                    continue;
                }
            }

            if let Some(ref sd) = params.start_date {
                let sd_parsed = if sd.len() <= 10 {
                    chrono::NaiveDate::parse_from_str(sd, "%Y-%m-%d")
                        .ok()
                        .and_then(|d| d.and_hms_opt(0, 0, 0))
                } else {
                    chrono::NaiveDateTime::parse_from_str(sd, "%Y-%m-%dT%H:%M:%S").ok()
                };
                if let Some(sd_dt) = sd_parsed {
                    if *dt < sd_dt {
                        continue;
                    }
                }
            }

            if let Some(ref ed) = params.end_date {
                let ed_parsed = if ed.len() <= 10 {
                    chrono::NaiveDate::parse_from_str(ed, "%Y-%m-%d")
                        .ok()
                        .and_then(|d| d.and_hms_opt(23, 59, 59))
                } else {
                    chrono::NaiveDateTime::parse_from_str(ed, "%Y-%m-%dT%H:%M:%S").ok()
                };
                if let Some(ed_dt) = ed_parsed {
                    if *dt > ed_dt {
                        continue;
                    }
                }
            }
        } else if params.year.is_some() || params.month.is_some() || params.day.is_some() || params.quarter.is_some() || params.start_date.is_some() || params.end_date.is_some() {
            // If date is null but user specified a date filter, exclude it
            continue;
        }

        let partner_name = if let Some(pid) = v.partner_id {
            partner_map.get(&pid).cloned().unwrap_or_else(|| "Khác".into())
        } else {
            "Khác".into()
        };

        let order_disp = v.order_id.and_then(|oid| order_map.get(&oid).cloned());

        let date_str = v.date
            .map(|dt| dt.format("%Y-%m-%dT%H:%M:%S").to_string())
            .unwrap_or_default();

        response_list.push(CashVoucherResponse {
            id: v.id,
            partner_id: v.partner_id,
            partner_name,
            amount: v.amount,
            date: date_str,
            note: v.note,
            r#type: v.r#type.unwrap_or_else(|| "Payment".into()),
            source: v.source.unwrap_or_else(|| "manual".into()),
            order_id: v.order_id,
            order_display_id: order_disp,
        });
    }

    Ok(Json(response_list))
}

#[derive(Debug, Deserialize)]
pub struct ReconcileFundDto {
    pub actual_balance: f64,
    pub date: Option<String>,
    pub note: Option<String>,
}

pub async fn create_voucher(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateVoucherDto>,
) -> Result<impl IntoResponse, AppError> {
    if payload.amount <= 0.0 {
        return Err(AppError::BadRequest("Số tiền phải lớn hơn 0".into()));
    }

    let v_type = payload.r#type.unwrap_or_else(|| "Payment".to_string());
    let source = payload.source.unwrap_or_else(|| "manual".to_string());

    let now = chrono::Local::now();
    let current_time_str = now.format("%H:%M:%S").to_string();
    let date_str = payload.date.as_deref().unwrap_or("");
    let formatted_date = if !date_str.is_empty() {
        if date_str.len() <= 10 {
            format!("{} {}", date_str, current_time_str)
        } else {
            date_str.replace('T', " ")
        }
    } else {
        now.format("%Y-%m-%d %H:%M:%S").to_string()
    };

    let res = sqlx::query(
        "INSERT INTO cash_voucher (partner_id, amount, note, type, source, order_id, date) \
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(payload.partner_id)
    .bind(payload.amount)
    .bind(payload.note.as_deref())
    .bind(&v_type)
    .bind(&source)
    .bind(payload.order_id)
    .bind(&formatted_date)
    .execute(&pool)
    .await?;

    let new_id = res.last_insert_rowid();

    if let Some(pid) = payload.partner_id {
        recalculate_partner_debt_internal(&pool, pid).await?;
    }

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "id": new_id,
            "status": "success",
            "message": "Tạo phiếu thu/chi thành công"
        })),
    ))
}

pub async fn reconcile_fund(
    State(pool): State<SqlitePool>,
    Json(payload): Json<ReconcileFundDto>,
) -> Result<impl IntoResponse, AppError> {
    let current_balance: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(CASE WHEN type = 'Receipt' THEN amount ELSE -amount END), 0) AS REAL) FROM cash_voucher"
    )
    .fetch_one(&pool)
    .await?;

    let diff = payload.actual_balance - current_balance;
    let date_str = payload.date.as_deref().unwrap_or("");
    let formatted_date = if !date_str.is_empty() {
        if date_str.len() <= 10 {
            format!("{} 12:00:00", date_str)
        } else {
            date_str.replace('T', " ")
        }
    } else {
        chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
    };

    if diff.abs() < 0.001 {
        return Ok(Json(json!({
            "status": "success",
            "message": "Số dư thực tế đã khớp hoàn toàn với sổ quỹ (không chênh lệch)",
            "current_balance": current_balance,
            "actual_balance": payload.actual_balance,
            "difference": 0.0
        })));
    }

    let (v_type, amount, default_note) = if diff > 0.0 {
        ("Receipt", diff, "Khai báo / Kiểm kê quỹ - Điều chỉnh tăng số dư tiền mặt (Thừa quỹ)")
    } else {
        ("Payment", -diff, "Khai báo / Kiểm kê quỹ - Điều chỉnh giảm số dư tiền mặt (Thiếu quỹ)")
    };

    let final_note = payload.note.filter(|n| !n.trim().is_empty()).unwrap_or_else(|| default_note.to_string());

    let res = sqlx::query(
        "INSERT INTO cash_voucher (partner_id, amount, note, type, source, date) \
         VALUES (NULL, ?, ?, ?, 'opening_balance', ?)"
    )
    .bind(amount)
    .bind(&final_note)
    .bind(v_type)
    .bind(&formatted_date)
    .execute(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "voucher_id": res.last_insert_rowid(),
        "message": format!("Đã điều chỉnh quỹ thành công về mức thực tế {} đ", payload.actual_balance),
        "previous_balance": current_balance,
        "actual_balance": payload.actual_balance,
        "difference": diff,
        "type": v_type
    })))
}

pub async fn get_fund_summary(
    State(pool): State<SqlitePool>,
) -> Result<impl IntoResponse, AppError> {
    let row = sqlx::query(
        "SELECT \
            CAST(COALESCE(SUM(CASE WHEN type = 'Receipt' THEN amount ELSE 0 END), 0) AS REAL) as total_receipts, \
            CAST(COALESCE(SUM(CASE WHEN type = 'Payment' THEN amount ELSE 0 END), 0) AS REAL) as total_payments, \
            CAST(COALESCE(SUM(CASE WHEN type = 'Receipt' THEN amount ELSE -amount END), 0) AS REAL) as net_cash \
         FROM cash_voucher"
    )
    .fetch_one(&pool)
    .await?;

    let net_cash: f64 = row.get("net_cash");
    let total_receipts: f64 = row.get("total_receipts");
    let total_payments: f64 = row.get("total_payments");

    Ok(Json(json!({
        "net_cash": net_cash,
        "total_receipts": total_receipts,
        "total_payments": total_payments
    })))
}



pub async fn update_voucher(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateVoucherDto>,
) -> Result<impl IntoResponse, AppError> {
    let existing = sqlx::query_as::<_, CashVoucher>(
        "SELECT id, partner_id, CAST(amount AS REAL) as amount, date, note, type, source, order_id \
         FROM cash_voucher WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    let existing = existing.ok_or_else(|| AppError::NotFound("Phiếu không tồn tại".into()))?;

    let amount = payload.amount.unwrap_or(existing.amount);
    let note = payload.note.or(existing.note);
    let v_type = payload.r#type.or(existing.r#type).unwrap_or_else(|| "Payment".into());

    let formatted_date = if let Some(ref d_str) = payload.date {
        let trimmed = d_str.trim();
        if trimmed.is_empty() {
            existing.date.map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
        } else if trimmed.len() <= 10 {
            let time_part = existing.date
                .map(|dt| dt.format("%H:%M:%S").to_string())
                .unwrap_or_else(|| chrono::Local::now().format("%H:%M:%S").to_string());
            Some(format!("{} {}", trimmed, time_part))
        } else {
            Some(trimmed.replace('T', " "))
        }
    } else {
        existing.date.map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
    };

    let new_partner_id = payload.partner_id.or(existing.partner_id);

    sqlx::query("UPDATE cash_voucher SET amount = ?, note = ?, type = ?, date = ?, partner_id = ? WHERE id = ?")
        .bind(amount)
        .bind(note.as_deref())
        .bind(&v_type)
        .bind(formatted_date)
        .bind(new_partner_id)
        .bind(id)
        .execute(&pool)
        .await?;

    if let Some(pid) = existing.partner_id {
        recalculate_partner_debt_internal(&pool, pid).await?;
    }
    if let Some(pid) = new_partner_id {
        if Some(pid) != existing.partner_id {
            recalculate_partner_debt_internal(&pool, pid).await?;
        }
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Cập nhật phiếu thành công"
    })))
}

pub async fn delete_voucher(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    let existing = sqlx::query_as::<_, CashVoucher>(
        "SELECT id, partner_id, CAST(amount AS REAL) as amount, date, note, type, source, order_id \
         FROM cash_voucher WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;

    let existing = existing.ok_or_else(|| AppError::NotFound("Phiếu không tồn tại".into()))?;

    sqlx::query("DELETE FROM cash_voucher WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await?;

    if let Some(pid) = existing.partner_id {
        recalculate_partner_debt_internal(&pool, pid).await?;
    }

    Ok(Json(json!({
        "message": "Deleted successfully"
    })))
}
