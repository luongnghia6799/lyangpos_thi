use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let pool_d = SqlitePoolOptions::new().connect("sqlite://D:/LyangPOS/easypos_backup_merge.db").await?;
    let pool_e = SqlitePoolOptions::new().connect("sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos_before_merge.db").await?;

    println!("=== KIỂM TRA 12 ĐƠN HÀNG TRONG BẢN GỐC TRƯỚC KHI GỘP ===");

    for oid in 43527..=43538 {
        let d_order: Option<(i64, Option<String>, Option<f64>, Option<f64>)> = sqlx::query_as(
            "SELECT id, display_id, CAST(total_amount AS REAL), CAST(amount_paid AS REAL) FROM \"order\" WHERE id = $1"
        ).bind(oid).fetch_optional(&pool_d).await?;

        let e_order: Option<(i64, Option<String>, Option<f64>, Option<f64>)> = sqlx::query_as(
            "SELECT id, display_id, CAST(total_amount AS REAL), CAST(amount_paid AS REAL) FROM \"order\" WHERE id = $1"
        ).bind(oid).fetch_optional(&pool_e).await?;

        println!("ID {}: File D={:?} vs File E={:?}", oid, d_order, e_order);
    }

    Ok(())
}
