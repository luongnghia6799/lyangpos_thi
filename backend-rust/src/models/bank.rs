use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BankAccount {
    pub id: i64,
    pub bank_name: String,
    pub account_number: String,
    pub account_holder: Option<String>,
    pub balance: Option<f64>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BankTransaction {
    pub id: i64,
    pub account_id: i64,
    pub amount: f64,
    pub date: Option<NaiveDateTime>,
    pub r#type: Option<String>,
    pub note: Option<String>,
    pub partner_id: Option<i64>,
    pub order_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankAccountResponse {
    pub id: i64,
    pub bank_name: String,
    pub account_number: String,
    pub account_holder: Option<String>,
    pub balance: f64,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankTransactionResponse {
    pub id: i64,
    pub account_id: i64,
    pub bank_name: String,
    pub amount: f64,
    pub date: String,
    pub r#type: String,
    pub note: Option<String>,
    pub partner_name: Option<String>,
    pub order_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBankAccountDto {
    pub bank_name: String,
    pub account_number: String,
    pub account_holder: Option<String>,
    pub balance: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBankAccountDto {
    pub bank_name: Option<String>,
    pub account_number: Option<String>,
    pub account_holder: Option<String>,
    pub balance: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBankTransactionDto {
    #[serde(deserialize_with = "crate::utils::number_or_string_i64")]
    pub account_id: i64,
    #[serde(deserialize_with = "crate::utils::number_or_string_f64")]
    pub amount: f64,
    pub r#type: String,
    pub note: Option<String>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub partner_id: Option<i64>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub order_id: Option<i64>,
    pub date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BankTransactionQueryDto {
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub account_id: Option<i64>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub partner_id: Option<i64>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub year: Option<i32>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub month: Option<u32>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub day: Option<u32>,
    #[serde(default, deserialize_with = "crate::utils::empty_string_as_none")]
    pub quarter: Option<u32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}
