use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let target_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(target_url).await?;

    let total_orders: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM \"order\"")
        .fetch_one(&pool)
        .await?;

    let total_order_details: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM order_detail")
        .fetch_one(&pool)
        .await?;

    let total_cash_vouchers: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM cash_voucher")
        .fetch_one(&pool)
        .await?;

    println!("==================================================");
    println!("🎉 DỮ LIỆU ĐÃ ĐƯỢC GỘP XONG:");
    println!("- Tổng số đơn hàng (order): {}", total_orders.0);
    println!("- Tổng chi tiết đơn (order_detail): {}", total_order_details.0);
    println!("- Tổng phiếu thu/chi (cash_voucher): {}", total_cash_vouchers.0);
    println!("==================================================");

    Ok(())
}
