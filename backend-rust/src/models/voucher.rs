use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CashVoucher {
    pub id: i64,
    pub partner_id: Option<i64>,
    pub amount: f64,
    pub date: Option<NaiveDateTime>,
    pub note: Option<String>,
    pub r#type: Option<String>,
    pub source: Option<String>,
    pub order_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashVoucherResponse {
    pub id: i64,
    pub partner_id: Option<i64>,
    pub partner_name: String,
    pub amount: f64,
    pub date: String,
    pub note: Option<String>,
    pub r#type: String,
    pub source: String,
    pub order_id: Option<i64>,
    pub order_display_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct VoucherQueryDto {
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub partner_id: Option<i64>,
    pub source: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub year: Option<i32>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub month: Option<u32>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub day: Option<u32>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub quarter: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateVoucherDto {
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub partner_id: Option<i64>,
    #[serde(deserialize_with = "crate::utils::number_or_string_f64")]
    pub amount: f64,
    pub note: Option<String>,
    pub r#type: Option<String>,
    pub source: Option<String>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub order_id: Option<i64>,
    pub date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateVoucherDto {
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub partner_id: Option<i64>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub amount: Option<f64>,
    pub note: Option<String>,
    pub r#type: Option<String>,
    pub date: Option<String>,
}
