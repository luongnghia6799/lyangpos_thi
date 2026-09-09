use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::{Row, SqlitePool};

use crate::error::AppError;


pub async fn ping() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "message": "pong",
        "engine": "rust-axum",
        "version": "0.1.0"
    }))
}

pub async fn heartbeat() -> impl IntoResponse {
    Json(json!({
        "status": "ok"
    }))
}

pub async fn db_stats(State(pool): State<SqlitePool>) -> Result<impl IntoResponse, AppError> {
    let orders_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM \"order\"")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let details_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM order_detail")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let products_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM product")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let vouchers_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM cash_voucher")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let partners_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM partner")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let db_path = super::backup::resolve_backup_dir().parent().unwrap_or(std::path::Path::new(".")).join("easypos.db");
    let db_size_mb = if db_path.exists() {
        let meta = std::fs::metadata(&db_path);
        match meta {
            Ok(m) => ((m.len() as f64) / (1024.0 * 1024.0) * 100.0).round() / 100.0,
            Err(_) => 0.0,
        }
    } else {
        0.0
    };

    Ok(Json(json!({
        "orders": orders_count,
        "order_details": details_count,
        "products": products_count,
        "vouchers": vouchers_count,
        "partners": partners_count,
        "db_size_mb": db_size_mb
    })))
}

pub async fn optimize_db(State(pool): State<SqlitePool>) -> Result<impl IntoResponse, AppError> {
    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE);").execute(&pool).await?;
    sqlx::query("PRAGMA incremental_vacuum;").execute(&pool).await?;
    sqlx::query("VACUUM;").execute(&pool).await?;
    sqlx::query("PRAGMA optimize;").execute(&pool).await?;

    Ok(Json(json!({
        "message": "Tối ưu hóa dữ liệu thành công!"
    })))
}

pub async fn clean_ram(State(pool): State<SqlitePool>) -> Result<impl IntoResponse, AppError> {
    sqlx::query("PRAGMA shrink_memory;").execute(&pool).await?;

    #[cfg(target_os = "windows")]
    unsafe {
        use std::ffi::c_void;
        #[link(name = "kernel32")]
        extern "system" {
            fn GetCurrentProcess() -> *mut c_void;
            fn SetProcessWorkingSetSize(hProcess: *mut c_void, dwMinimumWorkingSetSize: usize, dwMaximumWorkingSetSize: usize) -> i32;
        }
        #[link(name = "psapi")]
        extern "system" {
            fn EmptyWorkingSet(hProcess: *mut c_void) -> i32;
        }
        let handle = GetCurrentProcess();
        EmptyWorkingSet(handle);
        SetProcessWorkingSetSize(handle, usize::MAX, usize::MAX);
    }

    Ok(Json(json!({
        "message": "Dọn dẹp RAM backend thành công!"
    })))
}

pub async fn repair_backend(State(pool): State<SqlitePool>) -> Result<impl IntoResponse, AppError> {
    // 1. Link orphaned batches if any
    let _ = sqlx::query(
        "UPDATE stock_batch SET product_id = (SELECT id FROM product WHERE product.name = stock_batch.batch_code) WHERE product_id IS NULL"
    ).execute(&pool).await;

    // 2. Recalculate average costs for all products based on remaining batches
    let products = sqlx::query("SELECT id FROM product").fetch_all(&pool).await?;
    for row in products {
        use sqlx::Row;
        let pid: i64 = row.get("id");
        let avg_cost: Option<f64> = sqlx::query_scalar(
            "SELECT SUM(cost_price * remaining_quantity) / SUM(remaining_quantity) FROM stock_batch WHERE product_id = ? AND remaining_quantity > 0"
        )
        .bind(pid)
        .fetch_optional(&pool)
        .await
        .unwrap_or(None);

        if let Some(cost) = avg_cost {
            let _ = sqlx::query("UPDATE product SET cost_price = ? WHERE id = ?")
                .bind(cost)
                .bind(pid)
                .execute(&pool)
                .await;
        }
    }

    Ok(Json(json!({
        "message": "Sửa lỗi và vá dữ liệu kho thành công!"
    })))
}

pub async fn shutdown(State(pool): State<SqlitePool>) -> impl IntoResponse {
    tokio::spawn(async move {
        let _ = sqlx::query("PRAGMA wal_checkpoint(TRUNCATE);").execute(&pool).await;
        let _ = sqlx::query("PRAGMA optimize;").execute(&pool).await;
        tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
        std::process::exit(0);
    });

    Json(json!({
        "message": "Server is shutting down..."
    }))
}

// --- Weather Endpoint (/api/weather) ---
#[derive(Debug, serde::Deserialize)]
pub struct WeatherQuery {
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub city: Option<String>,
}

pub async fn get_weather(Query(q): Query<WeatherQuery>) -> impl IntoResponse {
    let lat = q.latitude.unwrap_or(21.0285);
    let lon = q.longitude.unwrap_or(105.8542);
    let city = q.city.unwrap_or_else(|| "Vị trí của tôi".into());

    Json(json!({
        "status": "success",
        "latitude": lat,
        "longitude": lon,
        "city": city,
        "temp": 28,
        "desc": "Trời quang",
        "weathercode": 0
    }))
}

// --- Fonts & Logos ---
pub async fn list_fonts() -> impl IntoResponse {
    let fonts_dir = std::path::Path::new("uploads/fonts");
    let mut fonts = Vec::new();
    if let Ok(entries) = std::fs::read_dir(fonts_dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".ttf") || name.ends_with(".otf") || name.ends_with(".woff") || name.ends_with(".woff2") {
                    fonts.push(name.to_string());
                }
            }
        }
    }
    Json(fonts)
}

pub async fn upload_logo(
    mut multipart: axum::extract::Multipart,
) -> Result<impl IntoResponse, AppError> {
    let logos_dir = std::path::Path::new("uploads/logos");
    let _ = tokio::fs::create_dir_all(logos_dir).await;

    let mut saved_filename = String::new();
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::Internal(anyhow::anyhow!(e.to_string())))? {
        let file_name = field.file_name().unwrap_or("logo.png").to_string();
        let timestamp = chrono::Utc::now().timestamp();
        saved_filename = format!("{}_{}", timestamp, file_name);
        let path = logos_dir.join(&saved_filename);
        let data = field.bytes().await.map_err(|e| AppError::Internal(anyhow::anyhow!(e.to_string())))?;
        tokio::fs::write(path, data).await.map_err(|e| AppError::Internal(anyhow::anyhow!(e.to_string())))?;
        break;
    }

    Ok(Json(json!({
        "url": format!("/uploads/logos/{}", saved_filename)
    })))
}

pub async fn normalize_uom_endpoint(State(pool): State<SqlitePool>) -> Result<impl IntoResponse, AppError> {
    // Normalizes unit / secondary unit in SQLite
    let _ = sqlx::query("UPDATE product SET unit = LOWER(TRIM(unit)) WHERE unit IS NOT NULL").execute(&pool).await;
    Ok(Json(json!({"message": "Chuẩn hóa đơn vị tính thành công!"})))
}

pub async fn get_history_active_filters(
    State(pool): State<SqlitePool>,
    Query(params): Query<serde_json::Value>,
) -> Result<impl IntoResponse, AppError> {
    let order_type = params.get("type").and_then(|v| v.as_str()).unwrap_or("Sale");
    let partners: Vec<crate::models::partner::Partner> = sqlx::query_as(
        "SELECT id, name, type, \
         CAST(is_customer AS BOOLEAN) as is_customer, \
         CAST(is_supplier AS BOOLEAN) as is_supplier, \
         cccd, phone, address, \
         CAST(debt_balance AS REAL) as debt_balance \
         FROM partner p \
         JOIN \"order\" o ON o.partner_id = p.id \
         WHERE o.type = ?"
    )
    .bind(order_type)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let products: Vec<crate::models::product::Product> = sqlx::query_as(
        "SELECT DISTINCT p.id, p.name, p.code, p.unit, p.secondary_unit, \
                CAST(p.multiplier AS REAL) as multiplier, \
                CAST(p.cost_price AS REAL) as cost_price, \
                CAST(p.sale_price AS REAL) as sale_price, \
                CAST(p.stock AS REAL) as stock, \
                p.expiry_date, p.active_ingredient, p.brand, \
                CAST(p.is_combo AS BOOLEAN) as is_combo, \
                CAST(p.is_active AS BOOLEAN) as is_active, \
                p.category_id, \
                CAST(p.accounting_price AS REAL) as accounting_price, \
                CAST(p.accounting_stock AS REAL) as accounting_stock, \
                CAST(p.bulk_quantity AS REAL) as bulk_quantity, \
                CAST(p.bulk_price AS REAL) as bulk_price \
         FROM product p \
         JOIN order_detail od ON od.product_id = p.id \
         JOIN \"order\" o ON o.id = od.order_id \
         WHERE o.type = ?"
    )
    .bind(order_type)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    Ok(Json(json!({
        "partners": partners,
        "products": products
    })))
}


pub async fn save_and_open_tauri(Json(data): Json<serde_json::Value>) -> impl IntoResponse {
    use base64::prelude::*;
    let filename = data.get("filename").and_then(|v| v.as_str()).unwrap_or("export.xlsx");
    let base64_data = data.get("base64_data").and_then(|v| v.as_str()).unwrap_or("");

    if let Ok(bytes) = BASE64_STANDARD.decode(base64_data) {
        let downloads_dir = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .map(|p| std::path::PathBuf::from(p).join("Downloads"))
            .unwrap_or_else(|_| std::path::PathBuf::from("."));
        let file_path = downloads_dir.join(filename);
        let _ = tokio::fs::write(&file_path, bytes).await;
        let _ = open::that(&file_path);
        return Json(json!({"success": true, "path": file_path.to_string_lossy()})).into_response();
    }

    Json(json!({"success": false, "error": "Invalid base64 data"})).into_response()
}


pub async fn open_external_chrome(Json(data): Json<serde_json::Value>) -> impl IntoResponse {
    let url = data.get("url").and_then(|v| v.as_str()).unwrap_or("http://localhost:5002");
    let _ = open::that(url);
    Json(json!({"success": true}))
}

pub async fn scan_purchase_invoice(
    State(pool): State<SqlitePool>,
    Json(data): Json<serde_json::Value>,
) -> Result<impl IntoResponse, AppError> {
    let mut api_key = data.get("api_key").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();

    if api_key.is_empty() {
        if let Ok(row) = sqlx::query("SELECT setting_value FROM app_setting WHERE setting_key = 'gemini_api_key'")
            .fetch_optional(&pool)
            .await
        {
            if let Some(r) = row {
                if let Ok(val) = r.try_get::<String, _>("setting_value") {
                    api_key = val.trim_matches('"').trim().to_string();
                }
            }
        }
    }

    if api_key.is_empty() {
        return Ok(Json(json!([])));
    }

    let raw_images = match data.get("images").and_then(|v| v.as_array()) {
        Some(imgs) => imgs,
        None => return Ok(Json(json!([]))),
    };

    if raw_images.is_empty() {
        return Ok(Json(json!([])));
    }

    let mut parts: Vec<serde_json::Value> = Vec::new();
    let prompt = r#"Bạn là chuyên gia bóc tách hóa đơn bán lẻ, hóa đơn VAT, phiếu xuất kho và toa hàng tại Việt Nam.
Hãy quan sát kỹ từng dòng của bảng sản phẩm trong hình ảnh hóa đơn từ TRÊN XUỐNG DƯỚI (đúng 100% theo thứ tự xuất hiện trên hóa đơn) và bóc tách danh sách sản phẩm.

QUY TẮC BẮT BUỘC:
1. GIỮ NGUYÊN THỨ TỰ: Các mặt hàng trong mảng JSON phải đúng theo thứ tự dòng từ trên xuống dưới của hóa đơn gốc.
2. PHÂN BIỆT RÕ CỘT SỐ LƯỢNG VÀ CÁC CỘT KHÁC:
   - "quantity" (Số lượng): Lấy chính xác số lượng hàng ghi ở cột "Số lượng" (SL / Qty / Số lượng xuất). Không được nhầm lẫn số thứ tự (STT), số lô/hạn dùng, quy cách đóng gói (ví dụ 10 vỉ/hộp thì không lấy 10 trừ khi khách mua 10 hộp), đơn giá hay mã sản phẩm sang số lượng.
   - Nếu có phép nhân hoặc số lượng là số lẻ (vd: 0.5, 1.5, 2.5), lấy đúng giá trị số thực.
3. CỘT ĐƠN VỊ TÍNH ("unit"): Lấy đúng tên đơn vị tính ghi trên hóa đơn (Hộp, Chai, Gói, Vỉ, Tuýp, Viên, Thùng, Kg, Lọ, Cái,...).
4. CỘT ĐƠN GIÁ ("price"): Lấy đơn giá của 1 đơn vị tính (trước hoặc sau thuế tùy hóa đơn).
5. CỘT THÀNH TIỀN ("total"): Thành tiền tương ứng của dòng đó (quantity * price).

Định dạng trả về DUY NHẤT một chuỗi JSON (mảng array of objects), KHÔNG kèm bất kỳ markdown giải thích nào:
[
  {"product_name": "Tên sản phẩm 1", "quantity": 2, "unit": "Hộp", "price": 45000, "total": 90000},
  {"product_name": "Tên sản phẩm 2", "quantity": 10, "unit": "Chai", "price": 12000, "total": 120000}
]

Nếu ảnh không có dòng sản phẩm nào hoặc không đọc được, trả về: []"#;

    parts.push(json!({
        "text": prompt
    }));

    for img_val in raw_images {
        if let Some(data_url) = img_val.as_str() {
            let (mime_type, base64_data) = if let Some(idx) = data_url.find(";base64,") {
                let mime = data_url[5..idx].to_string();
                let b64 = &data_url[idx + 8..];
                (mime, b64)
            } else {
                ("image/jpeg".to_string(), data_url)
            };

            parts.push(json!({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64_data
                }
            }));
        }
    }

    let request_body = json!({
        "contents": [
            {
                "parts": parts
            }
        ],
        "generationConfig": {
            "temperature": 0.1
        }
    });

    let client = reqwest::Client::new();
    // Use gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
    let models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let mut response_text = String::new();

    for model in models {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, api_key
        );

        let res = client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await;

        if let Ok(resp) = res {
            if resp.status().is_success() {
                if let Ok(gemini_res) = resp.json::<serde_json::Value>().await {
                    if let Some(text) = gemini_res
                        .get("candidates")
                        .and_then(|c| c.get(0))
                        .and_then(|c0| c0.get("content"))
                        .and_then(|cnt| cnt.get("parts"))
                        .and_then(|p| p.get(0))
                        .and_then(|p0| p0.get("text"))
                        .and_then(|t| t.as_str())
                    {
                        response_text = text.trim().to_string();
                        break;
                    }
                }
            } else {
                tracing::warn!("Gemini API error with model {}: status {}", model, resp.status());
            }
        }
    }

    if response_text.is_empty() {
        return Ok(Json(json!([])));
    }

    // Clean up potential markdown formatting: ```json ... ``` or extract JSON array substring
    let mut cleaned_json = response_text.trim();
    if let Some(start_idx) = cleaned_json.find('[') {
        if let Some(end_idx) = cleaned_json.rfind(']') {
            if end_idx >= start_idx {
                cleaned_json = &cleaned_json[start_idx..=end_idx];
            }
        }
    } else if cleaned_json.starts_with("```json") {
        cleaned_json = cleaned_json.strip_prefix("```json").unwrap_or(cleaned_json);
        if cleaned_json.ends_with("```") {
            cleaned_json = cleaned_json.strip_suffix("```").unwrap_or(cleaned_json);
        }
        cleaned_json = cleaned_json.trim();
    } else if cleaned_json.starts_with("```") {
        cleaned_json = cleaned_json.strip_prefix("```").unwrap_or(cleaned_json);
        if cleaned_json.ends_with("```") {
            cleaned_json = cleaned_json.strip_suffix("```").unwrap_or(cleaned_json);
        }
        cleaned_json = cleaned_json.trim();
    }

    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(cleaned_json) {
        if parsed.is_array() {
            return Ok(Json(parsed));
        }
    }

    // Fallback if it returned an object with items key
    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(cleaned_json) {
        if let Some(items) = parsed.get("items").or_else(|| parsed.get("products")) {
            if items.is_array() {
                return Ok(Json(items.clone()));
            }
        }
    }

    Ok(Json(json!([])))
}


