use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let pool_d = SqlitePoolOptions::new().connect("sqlite://D:/LyangPOS/easypos_backup_merge.db").await?;
    let pool_e = SqlitePoolOptions::new().connect("sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos_before_merge.db").await?;

    println!("=== CHI TIẾT CÁC ĐƠN ID 43514 -> 43538 Ở 2 FILE ===");
    for oid in 43514..=43538 {
        let d: (i64, Option<String>, Option<String>, Option<f64>) = sqlx::query_as(
            "SELECT id, display_id, date, CAST(total_amount AS REAL) FROM \"order\" WHERE id = $1"
        ).bind(oid).fetch_one(&pool_d).await?;

        let e: (i64, Option<String>, Option<String>, Option<f64>) = sqlx::query_as(
            "SELECT id, display_id, date, CAST(total_amount AS REAL) FROM \"order\" WHERE id = $1"
        ).bind(oid).fetch_one(&pool_e).await?;

        println!("ID {}: File D={:?} | {:?} | {:>10?} đ   vs   File E={:?} | {:?} | {:>10?} đ",
            oid, d.1.as_deref().unwrap_or(""), d.2.as_deref().unwrap_or(""), d.3,
            e.1.as_deref().unwrap_or(""), e.2.as_deref().unwrap_or(""), e.3);
    }

    Ok(())
}
