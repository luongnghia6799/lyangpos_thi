use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let pool_d = SqlitePoolOptions::new().connect("sqlite://D:/LyangPOS/easypos_backup_merge.db").await?;
    let pool_e = SqlitePoolOptions::new().connect("sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos_before_merge.db").await?;

    println!("=== SO SÁNH TẤT CẢ ĐƠN HÀNG NGÀY 06/09/2026 GIỮA FILE D VÀ FILE E ===");

    let d_orders: Vec<(i64, Option<String>, Option<String>, Option<f64>, Option<String>)> = sqlx::query_as(
        "SELECT id, display_id, date, CAST(total_amount AS REAL), type FROM \"order\" WHERE date LIKE '2026-09-06%' ORDER BY id ASC"
    ).fetch_all(&pool_d).await?;

    let e_orders: Vec<(i64, Option<String>, Option<String>, Option<f64>, Option<String>)> = sqlx::query_as(
        "SELECT id, display_id, date, CAST(total_amount AS REAL), type FROM \"order\" WHERE date LIKE '2026-09-06%' ORDER BY id ASC"
    ).fetch_all(&pool_e).await?;

    println!("- File D có: {} đơn (từ ID {} đến ID {})", d_orders.len(), d_orders.first().map(|x| x.0).unwrap_or(0), d_orders.last().map(|x| x.0).unwrap_or(0));
    println!("- File E có: {} đơn (từ ID {} đến ID {})", e_orders.len(), e_orders.first().map(|x| x.0).unwrap_or(0), e_orders.last().map(|x| x.0).unwrap_or(0));

    // File D có các đơn ID từ 43539 đến 43590 (52 đơn) mà file E không có.
    // Đối với các đơn ID 43438 -> 43538 (101 đơn cùng tồn tại cả 2 bên):
    println!("\nKiểm tra 101 đơn cùng tồn tại:");
    let mut diff_count = 0;
    for e in &e_orders {
        if let Some(d) = d_orders.iter().find(|x| x.0 == e.0) {
            if e.1 != d.1 || e.3 != d.3 || e.2 != d.2 {
                diff_count += 1;
                println!("  [KHÁC NHAU] ID {}: File D={:?}, total={:?} vs File E={:?}, total={:?}", e.0, d.1, d.3, e.1, e.3);
            }
        }
    }
    println!("=> Tổng số đơn bị khác nhau giữa D và E: {}", diff_count);

    Ok(())
}
