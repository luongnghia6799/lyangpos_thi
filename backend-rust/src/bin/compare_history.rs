use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let db_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(db_url).await?;

    println!("=== SO SÁNH TRÙNG LẶP ĐƠN HÀNG GIỮA E: VÀ BACKUP TRƯỚC KHI MERGE ===");

    sqlx::query("ATTACH DATABASE 'E:/vibe/LyangPOS/LyangPOS - Copy/easypos_before_merge.db' AS before_merge;")
        .execute(&pool)
        .await?;

    sqlx::query("ATTACH DATABASE 'D:/LyangPOS/easypos_backup_merge.db' AS d_backup;")
        .execute(&pool)
        .await?;

    // Đếm số đơn của ngày 06/09/2026 trong DB trước khi merge
    let before_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM before_merge.\"order\" WHERE date LIKE '2026-09-06%'"
    ).fetch_one(&pool).await?;

    let current_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM main.\"order\" WHERE date LIKE '2026-09-06%'"
    ).fetch_one(&pool).await?;

    let d_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM d_backup.\"order\" WHERE date LIKE '2026-09-06%'"
    ).fetch_one(&pool).await?;

    println!("- Số đơn ngày 06/09/2026 trên file E trước khi merge: {}", before_count.0);
    println!("- Số đơn ngày 06/09/2026 trên file D gốc: {}", d_count.0);
    println!("- Số đơn ngày 06/09/2026 hiện tại trong file đã gộp: {}", current_count.0);

    // Kiểm tra các đơn cùng ID giữa 2 file (ngày 06/09/2026)
    let same_id_diff_order: Vec<(i64, Option<String>, Option<f64>, Option<String>, Option<f64>)> = sqlx::query_as(
        "SELECT e.id, e.display_id, CAST(e.total_amount AS REAL), d.display_id, CAST(d.total_amount AS REAL) \
         FROM before_merge.\"order\" e \
         JOIN d_backup.\"order\" d ON e.id = d.id \
         WHERE e.date LIKE '2026-09-06%' OR d.date LIKE '2026-09-06%'"
    ).fetch_all(&pool).await?;

    println!("\nKiểm tra các đơn cùng ID giữa 2 file (ngày 06/09/2026): Tổng {}", same_id_diff_order.len());
    let mut diff_count = 0;
    for (id, e_disp, e_tot, d_disp, d_tot) in &same_id_diff_order {
        if e_disp != d_disp || e_tot != d_tot {
            diff_count += 1;
            println!("  [KHÁC NHAU] ID: {} | File E: disp={:?}, total={:?} vs File D: disp={:?}, total={:?}", id, e_disp, e_tot, d_disp, d_tot);
        }
    }
    if diff_count == 0 {
        println!("  => 100% tất cả các đơn có cùng ID đều GIỐNG NHAU HOÀN TOÀN giữa file D và E!");
    }

    // Kiểm tra doanh thu ngày 06/09/2026
    // 1. Theo file E trước khi merge
    let (rev_e, cash_e): (Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) FROM before_merge.\"order\" WHERE type = 'Sale' AND date LIKE '2026-09-06%' AND display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool).await?;

    // 2. Theo file D
    let (rev_d, cash_d): (Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) FROM d_backup.\"order\" WHERE type = 'Sale' AND date LIKE '2026-09-06%' AND display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool).await?;

    // 3. Theo file hiện tại
    let (rev_cur, cash_cur): (Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) FROM main.\"order\" WHERE type = 'Sale' AND date LIKE '2026-09-06%' AND display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool).await?;

    println!("\n=== SO SÁNH DOANH THU SALE NGÀY 06/09/2026 ===");
    println!("- File E trước merge (100 đơn): Doanh thu = {:?}, Đã thanh toán = {:?}", rev_e, cash_e);
    println!("- File D gốc (152 đơn)        : Doanh thu = {:?}, Đã thanh toán = {:?}", rev_d, cash_d);
    println!("- File hiện tại (152 đơn)     : Doanh thu = {:?}, Đã thanh toán = {:?}", rev_cur, cash_cur);

    // Tính lợi nhuận
    let cost_cur: Option<f64> = sqlx::query_scalar(
        "SELECT CAST(SUM(od.quantity * COALESCE(od.cost_price, p.cost_price, od.price)) AS REAL) \
         FROM main.order_detail od \
         JOIN main.\"order\" o ON o.id = od.order_id \
         LEFT JOIN main.product p ON p.id = od.product_id \
         WHERE o.type = 'Sale' AND o.date LIKE '2026-09-06%' AND o.display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool).await?;

    let profit_cur = rev_cur.unwrap_or(0.0) - cost_cur.unwrap_or(0.0);
    println!("- Giá vốn ngày 06/09/2026: {:?}", cost_cur);
    println!("- Lợi nhuận gộp ngày 06/09/2026: {}", profit_cur);

    Ok(())
}
