use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let pool_d = SqlitePoolOptions::new().connect("sqlite://D:/LyangPOS/easypos_backup_merge.db").await?;
    let pool_e = SqlitePoolOptions::new().connect("sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos_before_merge.db").await?;

    println!("=== TÌM TẤT CẢ CÁC ĐƠN KHÁC NHAU GIỮA FILE D VÀ FILE E TRƯỚC KHI GỘP ===");

    let d_orders: Vec<(i64, Option<String>, Option<String>, Option<f64>)> = sqlx::query_as(
        "SELECT id, display_id, date, CAST(total_amount AS REAL) FROM \"order\" WHERE date LIKE '2026-09-06%' ORDER BY id ASC"
    ).fetch_all(&pool_d).await?;

    let e_orders: Vec<(i64, Option<String>, Option<String>, Option<f64>)> = sqlx::query_as(
        "SELECT id, display_id, date, CAST(total_amount AS REAL) FROM \"order\" WHERE date LIKE '2026-09-06%' ORDER BY id ASC"
    ).fetch_all(&pool_e).await?;

    // 1. Các đơn trùng ID nhưng khác nội dung (date, total_amount, chi tiết)
    let mut conflict_orders = Vec::new();
    for e in &e_orders {
        if let Some(d) = d_orders.iter().find(|x| x.0 == e.0) {
            // Xem details của e và d có giống nhau không
            let d_details_cnt: (i64,) = sqlx::query_as("SELECT count(*) FROM order_detail WHERE order_id = $1").bind(d.0).fetch_one(&pool_d).await?;
            let e_details_cnt: (i64,) = sqlx::query_as("SELECT count(*) FROM order_detail WHERE order_id = $1").bind(e.0).fetch_one(&pool_e).await?;

            if e.3 != d.3 || e.2 != d.2 || d_details_cnt.0 != e_details_cnt.0 {
                conflict_orders.push((e.0, d.1.clone(), d.2.clone(), d.3, e.1.clone(), e.2.clone(), e.3));
            }
        }
    }

    println!("Tổng số đơn bị đè / xung đột ID giữa 2 file: {} đơn", conflict_orders.len());
    for (id, d_disp, d_dt, d_tot, e_disp, e_dt, e_tot) in &conflict_orders {
        println!("- ID {}: D ({}, lúc {})={:?} đ vs E ({}, lúc {})={:?} đ", id, d_disp.as_deref().unwrap_or(""), d_dt.as_deref().unwrap_or(""), d_tot, e_disp.as_deref().unwrap_or(""), e_dt.as_deref().unwrap_or(""), e_tot);
    }

    Ok(())
}
