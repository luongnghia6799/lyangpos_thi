use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{Row, SqlitePool};
use std::time::Duration;

use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MisaConfig {
    pub api_url: Option<String>,
    pub app_id: Option<String>,
    pub access_code: Option<String>,
    pub org_company_code: Option<String>,
    pub branch_id: Option<String>,
    pub stock_code: Option<String>,
}

pub async fn get_misa_config(State(pool): State<SqlitePool>) -> Result<impl IntoResponse, AppError> {
    let rows = sqlx::query(
        "SELECT setting_key, setting_value FROM app_setting WHERE setting_key IN \
         ('misa_api_url', 'misa_app_id', 'misa_access_code', 'misa_org_company_code', 'misa_branch_id', 'misa_stock_code')"
    )
    .fetch_all(&pool)
    .await?;

    let mut config = MisaConfig::default();
    config.api_url = Some("https://actapp.misa.vn".to_string());

    for r in rows {
        let k: String = r.get("setting_key");
        let v: Option<String> = r.get("setting_value");
        match k.as_str() {
            "misa_api_url" => {
                if let Some(val) = v {
                    if !val.trim().is_empty() {
                        config.api_url = Some(val);
                    }
                }
            }
            "misa_app_id" => config.app_id = v,
            "misa_access_code" => config.access_code = v,
            "misa_org_company_code" => config.org_company_code = v,
            "misa_branch_id" => config.branch_id = v,
            "misa_stock_code" => config.stock_code = v,
            _ => {}
        }
    }

    Ok(Json(config))
}

pub async fn save_misa_config(
    State(pool): State<SqlitePool>,
    Json(payload): Json<MisaConfig>,
) -> Result<impl IntoResponse, AppError> {
    let entries = [
        ("misa_api_url", payload.api_url.unwrap_or_else(|| "https://actapp.misa.vn".into())),
        ("misa_app_id", payload.app_id.unwrap_or_default()),
        ("misa_access_code", payload.access_code.unwrap_or_default()),
        ("misa_org_company_code", payload.org_company_code.unwrap_or_default()),
        ("misa_branch_id", payload.branch_id.unwrap_or_default()),
        ("misa_stock_code", payload.stock_code.unwrap_or_default()),
    ];

    for (k, v) in entries {
        sqlx::query(
            "INSERT INTO app_setting (setting_key, setting_value) VALUES (?, ?) \
             ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value"
        )
        .bind(k)
        .bind(v)
        .execute(&pool)
        .await?;
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Đã lưu cấu hình kết nối MISA thành công!"
    })))
}

async fn get_effective_config(pool: &SqlitePool, override_cfg: Option<MisaConfig>) -> Result<MisaConfig, AppError> {
    let mut cfg = MisaConfig::default();
    cfg.api_url = Some("https://actapp.misa.vn".to_string());

    let rows = sqlx::query(
        "SELECT setting_key, setting_value FROM app_setting WHERE setting_key IN \
         ('misa_api_url', 'misa_app_id', 'misa_access_code', 'misa_org_company_code', 'misa_branch_id', 'misa_stock_code')"
    )
    .fetch_all(pool)
    .await?;

    for r in rows {
        let k: String = r.get("setting_key");
        let v: Option<String> = r.get("setting_value");
        match k.as_str() {
            "misa_api_url" => {
                if let Some(val) = v {
                    if !val.trim().is_empty() {
                        cfg.api_url = Some(val);
                    }
                }
            }
            "misa_app_id" => cfg.app_id = v,
            "misa_access_code" => cfg.access_code = v,
            "misa_org_company_code" => cfg.org_company_code = v,
            "misa_branch_id" => cfg.branch_id = v,
            "misa_stock_code" => cfg.stock_code = v,
            _ => {}
        }
    }

    if let Some(ov) = override_cfg {
        if let Some(u) = ov.api_url {
            if !u.trim().is_empty() {
                cfg.api_url = Some(u);
            }
        }
        if let Some(a) = ov.app_id {
            if !a.trim().is_empty() {
                cfg.app_id = Some(a);
            }
        }
        if let Some(ac) = ov.access_code {
            if !ac.trim().is_empty() {
                cfg.access_code = Some(ac);
            }
        }
        if let Some(o) = ov.org_company_code {
            if !o.trim().is_empty() {
                cfg.org_company_code = Some(o);
            }
        }
        if let Some(b) = ov.branch_id {
            cfg.branch_id = Some(b);
        }
        if let Some(s) = ov.stock_code {
            cfg.stock_code = Some(s);
        }
    }

    Ok(cfg)
}

pub async fn test_misa_connection(
    State(pool): State<SqlitePool>,
    Json(payload): Json<Option<MisaConfig>>,
) -> Result<impl IntoResponse, AppError> {
    let cfg = get_effective_config(&pool, payload).await?;

    let app_id = cfg.app_id.clone().unwrap_or_default();
    let access_code = cfg.access_code.clone().unwrap_or_default();
    let org_company_code = cfg.org_company_code.clone().unwrap_or_default();
    let base_url = cfg
        .api_url
        .unwrap_or_else(|| "https://actapp.misa.vn".into())
        .trim_end_matches('/')
        .to_string();

    if app_id.trim().is_empty() || access_code.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Vui lòng nhập đầy đủ App ID và Access Code của MISA".into(),
        ));
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::BadRequest(format!("Lỗi khởi tạo HTTP client: {}", e)))?;

    let connect_url = format!("{}/api/oauth/actopen/connect", base_url);
    let req_body = json!({
        "app_id": app_id.trim(),
        "access_code": access_code.trim(),
        "org_company_code": org_company_code.trim()
    });

    let resp = client
        .post(&connect_url)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| {
            AppError::BadRequest(format!(
                "Không thể kết nối đến server MISA ({}): {}",
                connect_url, e
            ))
        })?;

    let status = resp.status();
    let json_res: Value = resp
        .json()
        .await
        .map_err(|e| AppError::BadRequest(format!("Lỗi đọc phản hồi từ MISA: {}", e)))?;

    let is_success = json_res
        .get("Success")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    if is_success {
        Ok(Json(json!({
            "success": true,
            "message": "Kết nối MISA AMIS Kế toán thành công!",
            "data": json_res
        })))
    } else {
        let err_msg = json_res
            .get("ErrorMessage")
            .and_then(|v| v.as_str())
            .or_else(|| json_res.get("ErrorCode").and_then(|v| v.as_str()))
            .unwrap_or("Xác thực MISA thất bại. Vui lòng kiểm tra lại App ID, Access Code hoặc Org Company Code.");
        Err(AppError::BadRequest(format!(
            "MISA từ chối kết nối (HTTP {}): {}",
            status, err_msg
        )))
    }
}

pub async fn sync_misa_inventory(
    State(pool): State<SqlitePool>,
    Json(payload): Json<Option<MisaConfig>>,
) -> Result<impl IntoResponse, AppError> {
    let cfg = get_effective_config(&pool, payload).await?;

    let app_id = cfg.app_id.clone().unwrap_or_default();
    let access_code = cfg.access_code.clone().unwrap_or_default();
    let org_company_code = cfg.org_company_code.clone().unwrap_or_default();
    let branch_id = cfg.branch_id.clone().filter(|s| !s.trim().is_empty());
    let filter_stock = cfg.stock_code.clone().filter(|s| !s.trim().is_empty());
    let base_url = cfg
        .api_url
        .unwrap_or_else(|| "https://actapp.misa.vn".into())
        .trim_end_matches('/')
        .to_string();

    if app_id.trim().is_empty() || access_code.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Vui lòng cấu hình App ID và Access Code trước khi lấy tồn kho MISA".into(),
        ));
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| AppError::BadRequest(format!("Lỗi tạo HTTP client: {}", e)))?;

    // 1. Connect to get token
    let connect_url = format!("{}/api/oauth/actopen/connect", base_url);
    let connect_resp = client
        .post(&connect_url)
        .json(&json!({
            "app_id": app_id.trim(),
            "access_code": access_code.trim(),
            "org_company_code": org_company_code.trim()
        }))
        .send()
        .await
        .map_err(|e| AppError::BadRequest(format!("Lỗi kết nối MISA: {}", e)))?;

    let connect_json: Value = connect_resp
        .json()
        .await
        .map_err(|e| AppError::BadRequest(format!("Lỗi đọc token từ MISA: {}", e)))?;

    let is_success = connect_json
        .get("Success")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    if !is_success {
        let msg = connect_json
            .get("ErrorMessage")
            .and_then(|v| v.as_str())
            .unwrap_or("Không thể xác thực với MISA");
        return Err(AppError::BadRequest(format!("Lỗi đăng nhập MISA: {}", msg)));
    }

    let token = if let Some(s) = connect_json.get("Data").and_then(|v| v.as_str()) {
        s.to_string()
    } else if let Some(s) = connect_json
        .get("Data")
        .and_then(|d| d.get("access_token"))
        .and_then(|v| v.as_str())
    {
        s.to_string()
    } else {
        return Err(AppError::BadRequest(
            "Không tìm thấy access_token trong phản hồi của MISA".into(),
        ));
    };

    // 2. Fetch inventory balance with pagination
    let inventory_url = format!("{}/apir/sync/actopen/get_list_inventory_balance", base_url);
    let mut all_items: Vec<Value> = Vec::new();
    let mut skip = 0;
    let take = 500;

    loop {
        let body = json!({
            "app_id": app_id.trim(),
            "branch_id": branch_id,
            "skip": skip,
            "take": take,
            "last_sync_time": Value::Null
        });

        let inv_resp = client
            .post(&inventory_url)
            .header("X-MISA-AccessToken", &token)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::BadRequest(format!("Lỗi truy vấn tồn kho MISA: {}", e)))?;

        let inv_json: Value = inv_resp
            .json()
            .await
            .map_err(|e| AppError::BadRequest(format!("Lỗi đọc dữ liệu tồn kho từ MISA: {}", e)))?;

        let success = inv_json
            .get("Success")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        if !success {
            let msg = inv_json
                .get("ErrorMessage")
                .and_then(|v| v.as_str())
                .unwrap_or("Lỗi lấy danh sách tồn kho");
            return Err(AppError::BadRequest(format!("MISA báo lỗi: {}", msg)));
        }

        let data_arr = match inv_json.get("Data").and_then(|v| v.as_array()) {
            Some(arr) => arr.clone(),
            None => break,
        };

        let fetch_count = data_arr.len();
        if fetch_count == 0 {
            break;
        }

        for item in data_arr {
            let item_stock_code = item.get("StockCode").and_then(|v| v.as_str()).unwrap_or("");
            if let Some(ref target_stock) = filter_stock {
                if !target_stock.is_empty() && item_stock_code != target_stock {
                    continue;
                }
            }

            let code = item
                .get("InventoryItemCode")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            let name = item
                .get("InventoryItemName")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            let unit = item
                .get("UnitName")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            let stock = item.get("Quantity").and_then(|v| v.as_f64()).unwrap_or(0.0);
            let amount = item.get("Amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
            let stock_name = item
                .get("StockName")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let price = if stock != 0.0 {
                (amount / stock).round()
            } else {
                0.0
            };

            all_items.push(json!({
                "code": code,
                "name": name,
                "stock": stock,
                "unit": unit,
                "price": price,
                "amount": amount,
                "stock_code": item_stock_code,
                "stock_name": stock_name
            }));
        }

        if fetch_count < take {
            break;
        }

        skip += take;
        if skip > 50000 {
            break; // Guard against infinite loop
        }
    }

    Ok(Json(json!({
        "success": true,
        "total_count": all_items.len(),
        "items": all_items
    })))
}
