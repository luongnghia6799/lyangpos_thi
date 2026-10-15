use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use chrono::{Datelike, Local, NaiveDateTime};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Row, SqlitePool};
use std::path::PathBuf;

use crate::error::AppError;
use crate::routes::backup::resolve_backup_dir;
use crate::routes::partner::recalculate_partner_debt_internal;
use crate::utils::get_app_base_dir;

#[derive(Debug, Deserialize)]
pub struct ArchivePreviewQuery {
    pub year: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct ArchiveYearDto {
    pub year: i32,
    pub opening_cash: Option<f64>,
    pub opening_note: Option<String>,
}

fn resolve_db_path() -> PathBuf {
    get_app_base_dir().join("easypos.db")
}

/// GET /api/archive-preview?year=2025
pub async fn preview_archive(
    State(pool): State<SqlitePool>,
    Query(params): Query<ArchivePreviewQuery>,
) -> Result<impl IntoResponse, AppError> {
    let target_year = params.year.unwrap_or_else(|| Local::now().year() - 1);
    let cutoff_date = format!("{}-12-31 23:59:59", target_year);

    // 1. Count orders up to cutoff
    let orders_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM \"order\" WHERE date <= ?"
    )
    .bind(&cutoff_date)
    .fetch_one(&pool)
    .await?;

    // 2. Count order details
    let order_details_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM order_detail WHERE order_id IN (SELECT id FROM \"order\" WHERE date <= ?)"
    )
    .bind(&cutoff_date)
    .fetch_one(&pool)
    .await?;

    // 3. Count vouchers up to cutoff
    let vouchers_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM cash_voucher WHERE date <= ?"
    )
    .bind(&cutoff_date)
    .fetch_one(&pool)
    .await?;

    // 4. Partner debts summary
    let debt_row = sqlx::query(
        "SELECT \
            COUNT(*) as partners_count, \
            CAST(COALESCE(SUM(CASE WHEN debt_balance > 0 THEN debt_balance ELSE 0 END), 0) AS REAL) as total_receivable, \
            CAST(COALESCE(SUM(CASE WHEN debt_balance < 0 THEN -debt_balance ELSE 0 END), 0) AS REAL) as total_payable \
         FROM partner WHERE debt_balance != 0 AND debt_balance IS NOT NULL"
    )
    .fetch_one(&pool)
    .await?;

    let partners_with_debt: i64 = debt_row.get("partners_count");
    let total_receivable: f64 = debt_row.get("total_receivable");
    let total_payable: f64 = debt_row.get("total_payable");

    // 5. Current cash fund balance up to cutoff date
    let cash_balance: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(CASE WHEN type = 'Receipt' THEN amount ELSE -amount END), 0) AS REAL) \
         FROM cash_voucher WHERE date <= ?"
    )
    .bind(&cutoff_date)
    .fetch_one(&pool)
    .await?;

    // 6. Current DB file size
    let db_path = resolve_db_path();
    let current_db_size_mb = std::fs::metadata(&db_path)
        .map(|m| (m.len() as f64) / (1024.0 * 1024.0))
        .unwrap_or(0.0);

    Ok(Json(json!({
        "year": target_year,
        "cutoff_date": cutoff_date,
        "orders_count": orders_count,
        "order_details_count": order_details_count,
        "vouchers_count": vouchers_count,
        "partners_with_debt": partners_with_debt,
        "total_receivable": total_receivable,
        "total_payable": total_payable,
        "calculated_cash_balance": cash_balance,
        "current_db_size_mb": (current_db_size_mb * 100.0).round() / 100.0
    })))
}

/// POST /api/archive-year
pub async fn execute_archive(
    State(pool): State<SqlitePool>,
    Json(payload): Json<ArchiveYearDto>,
) -> Result<impl IntoResponse, AppError> {
    if payload.year < 2000 || payload.year > 2100 {
        return Err(AppError::BadRequest("Năm chốt sổ không hợp lệ".into()));
    }

    let cutoff_date = format!("{}-12-31 23:59:59", payload.year);
    let next_year_start = format!("{}-01-01 00:00:00", payload.year + 1);

    // 1. Truncate WAL checkpoint to merge data before backing up
    let _ = sqlx::query("PRAGMA wal_checkpoint(TRUNCATE);").execute(&pool).await;

    // 2. Create archive backup file in backup dir
    let backup_dir = resolve_backup_dir();
    let db_path = resolve_db_path();
    if !db_path.exists() {
        return Err(AppError::NotFound("Không tìm thấy file database easypos.db".into()));
    }

    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let archive_filename = format!("easypos_archive_{}_{}.db", payload.year, timestamp);
    let archive_path = backup_dir.join(&archive_filename);

    tokio::fs::copy(&db_path, &archive_path)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Lỗi sao lưu trước khi chốt sổ: {}", e)))?;

    // 3. Collect partner debt balances to rollover
    let partners = sqlx::query(
        "SELECT id, name, CAST(debt_balance AS REAL) as debt FROM partner WHERE debt_balance != 0 AND debt_balance IS NOT NULL"
    )
    .fetch_all(&pool)
    .await?;

    // 4. Calculate cash balance to rollover
    let cash_to_rollover: f64 = if let Some(custom_cash) = payload.opening_cash {
        custom_cash
    } else {
        sqlx::query_scalar(
            "SELECT CAST(COALESCE(SUM(CASE WHEN type = 'Receipt' THEN amount ELSE -amount END), 0) AS REAL) \
             FROM cash_voucher WHERE date <= ?"
        )
        .bind(&cutoff_date)
        .fetch_one(&pool)
        .await?
    };

    // 5. Execute Archival Deletions & Rollover in an atomic Transaction
    let mut tx = pool.begin().await?;

    // A. Delete order details
    let details_del = sqlx::query(
        "DELETE FROM order_detail WHERE order_id IN (SELECT id FROM \"order\" WHERE date <= ?)"
    )
    .bind(&cutoff_date)
    .execute(&mut *tx)
    .await?;

    // B. Delete orders
    let orders_del = sqlx::query(
        "DELETE FROM \"order\" WHERE date <= ?"
    )
    .bind(&cutoff_date)
    .execute(&mut *tx)
    .await?;

    // C. Delete old cash vouchers
    let vouchers_del = sqlx::query(
        "DELETE FROM cash_voucher WHERE date <= ?"
    )
    .bind(&cutoff_date)
    .execute(&mut *tx)
    .await?;

    // D. Delete old bank transactions
    let _ = sqlx::query(
        "DELETE FROM bank_transaction WHERE date <= ?"
    )
    .bind(&cutoff_date)
    .execute(&mut *tx)
    .await;

    // E. Delete old inventory audits
    let _ = sqlx::query(
        "DELETE FROM inventory_audit_detail WHERE audit_id IN (SELECT id FROM inventory_audit WHERE date <= ?)"
    )
    .bind(&cutoff_date)
    .execute(&mut *tx)
    .await;

    let _ = sqlx::query("DELETE FROM inventory_audit WHERE date <= ?")
        .bind(&cutoff_date)
        .execute(&mut *tx)
        .await;

    let _ = sqlx::query("DELETE FROM inventory_conversion WHERE date <= ?")
        .bind(&cutoff_date)
        .execute(&mut *tx)
        .await;

    // F. Delete old logs & queues
    let _ = sqlx::query("DELETE FROM event_log WHERE completed_at <= ?")
        .bind(&cutoff_date)
        .execute(&mut *tx)
        .await;

    let _ = sqlx::query("DELETE FROM remote_scan_queue WHERE created_at <= ?")
        .bind(&cutoff_date)
        .execute(&mut *tx)
        .await;

    // G. Insert Rollover Opening Debt for partners
    let mut partner_ids_to_recalc = Vec::new();
    for p in partners {
        let p_id: i64 = p.get("id");
        let debt: f64 = p.get("debt");
        partner_ids_to_recalc.push(p_id);

        if debt > 0.0 {
            // Khách nợ mình -> DebtIncrease
            let note = format!("Số dư nợ đầu kỳ năm {} (kết chuyển từ năm {})", payload.year + 1, payload.year);
            sqlx::query(
                "INSERT INTO cash_voucher (partner_id, amount, note, type, source, date) \
                 VALUES (?, ?, ?, 'DebtIncrease', 'opening_balance', ?)"
            )
            .bind(p_id)
            .bind(debt)
            .bind(note)
            .bind(&next_year_start)
            .execute(&mut *tx)
            .await?;
        } else if debt < 0.0 {
            // Mình nợ nhà cung cấp / khách đặt cọc trước -> DebtDecrease
            let note = format!("Số dư nợ đầu kỳ năm {} (kết chuyển từ năm {})", payload.year + 1, payload.year);
            sqlx::query(
                "INSERT INTO cash_voucher (partner_id, amount, note, type, source, date) \
                 VALUES (?, ?, ?, 'DebtDecrease', 'opening_balance', ?)"
            )
            .bind(p_id)
            .bind(-debt)
            .bind(note)
            .bind(&next_year_start)
            .execute(&mut *tx)
            .await?;
        }
    }

    // H. Insert Rollover Opening Cash Fund
    if cash_to_rollover.abs() > 0.001 {
        let note = payload.opening_note.unwrap_or_else(|| {
            format!("Số dư quỹ tiền mặt đầu kỳ năm {} (kết chuyển từ năm {})", payload.year + 1, payload.year)
        });
        let (v_type, amount) = if cash_to_rollover > 0.0 {
            ("Receipt", cash_to_rollover)
        } else {
            ("Payment", -cash_to_rollover)
        };

        sqlx::query(
            "INSERT INTO cash_voucher (partner_id, amount, note, type, source, date) \
             VALUES (NULL, ?, ?, ?, 'opening_balance', ?)"
        )
        .bind(amount)
        .bind(note)
        .bind(v_type)
        .bind(&next_year_start)
        .execute(&mut *tx)
        .await?;
    }

    // Commit Transaction
    tx.commit().await?;

    // 6. Recalculate debt balances for affected partners to sync state
    for pid in partner_ids_to_recalc {
        let _ = recalculate_partner_debt_internal(&pool, pid).await;
    }

    // 7. Vacuum database to reclaim unused pages and shrink DB file
    let _ = sqlx::query("VACUUM;").execute(&pool).await;

    // 8. Measure new DB size
    let new_db_size_mb = std::fs::metadata(&db_path)
        .map(|m| (m.len() as f64) / (1024.0 * 1024.0))
        .unwrap_or(0.0);

    Ok(Json(json!({
        "status": "success",
        "message": format!("Đã chốt sổ và lưu trữ năm {} thành công!", payload.year),
        "archive_file": archive_filename,
        "archived_orders_count": orders_del.rows_affected(),
        "archived_details_count": details_del.rows_affected(),
        "archived_vouchers_count": vouchers_del.rows_affected(),
        "opening_cash_balance": cash_to_rollover,
        "new_db_size_mb": (new_db_size_mb * 100.0).round() / 100.0
    })))
}

/// GET /api/archives
pub async fn list_archives() -> Result<impl IntoResponse, AppError> {
    let backup_dir = resolve_backup_dir();
    let mut archives = Vec::new();

    if let Ok(mut entries) = tokio::fs::read_dir(&backup_dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            let path = entry.path();
            if path.is_file() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with("easypos_archive_") && name.ends_with(".db") {
                        if let Ok(meta) = entry.metadata().await {
                            let size_mb = (meta.len() as f64) / (1024.0 * 1024.0);
                            let mtime = meta.modified().ok()
                                .map(|t| chrono::DateTime::<Local>::from(t).format("%Y-%m-%d %H:%M:%S").to_string())
                                .unwrap_or_default();
                            archives.push(json!({
                                "file_name": name,
                                "size_mb": (size_mb * 100.0).round() / 100.0,
                                "modified_at": mtime,
                                "path": path.to_string_lossy()
                            }));
                        }
                    }
                }
            }
        }
    }

    // Sort by file name descending (newest first)
    archives.sort_by(|a, b| {
        b["file_name"].as_str().unwrap_or("").cmp(a["file_name"].as_str().unwrap_or(""))
    });

    Ok(Json(archives))
}
