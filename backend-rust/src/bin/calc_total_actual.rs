use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let pool_d = SqlitePoolOptions::new().connect("sqlite://D:/LyangPOS/easypos_backup_merge.db").await?;
    let pool_e = SqlitePoolOptions::new().connect("sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos_before_merge.db").await?;

    println!("=== TÍNH TỔNG SỐ ĐƠN VÀ DOANH THU CỦA CẢ 2 NGUỒN (KHÔNG BỎ SÓT ĐƠN NÀO) ===");

    // Đơn từ ID 43438 đến 43513 (76 đơn giống nhau cả 2 bên)
    let common_rev: (f64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(CAST(total_amount AS REAL)), 0.0) FROM \"order\" \
         WHERE type = 'Sale' AND id >= 43438 AND id <= 43513"
    ).fetch_one(&pool_d).await?;

    // 25 đơn trên File D (từ 43514 đến 43538 lúc 09h31 -> 10h38)
    let d_25_rev: (f64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(CAST(total_amount AS REAL)), 0.0) FROM \"order\" \
         WHERE type = 'Sale' AND id >= 43514 AND id <= 43538"
    ).fetch_one(&pool_d).await?;

    // 25 đơn trên File E (từ 43514 đến 43538 lúc chiều 15h52 -> 17h07)
    let e_25_rev: (f64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(CAST(total_amount AS REAL)), 0.0) FROM \"order\" \
         WHERE type = 'Sale' AND id >= 43514 AND id <= 43538"
    ).fetch_one(&pool_e).await?;

    // 52 đơn tiếp theo trên File D (từ 43539 đến 43590)
    let d_rest_rev: (f64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(CAST(total_amount AS REAL)), 0.0) FROM \"order\" \
         WHERE type = 'Sale' AND id >= 43539"
    ).fetch_one(&pool_d).await?;

    let total_all_orders = 76 + 25 + 25 + (152 - 101);
    let total_all_rev = common_rev.0 + d_25_rev.0 + e_25_rev.0 + d_rest_rev.0;

    println!("- 76 đơn đầu chung (sáng): {:>15.2} đ", common_rev.0);
    println!("- 25 đơn file D (buổi trưa): {:>15.2} đ", d_25_rev.0);
    println!("- 25 đơn file E (buổi chiều): {:>14.2} đ", e_25_rev.0);
    println!("- 51 đơn file D (buổi chiều): {:>14.2} đ", d_rest_rev.0);
    println!("--------------------------------------------------");
    println!("⭐ TỔNG CỘNG THỰC TẾ:");
    println!("- Tổng số đơn: {} đơn", total_all_orders);
    println!("- Tổng doanh thu: {:>15.2} đ", total_all_rev);

    Ok(())
}
