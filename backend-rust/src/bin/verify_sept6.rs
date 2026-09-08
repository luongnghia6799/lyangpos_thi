use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let target_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(target_url).await?;

    println!("=== KIỂM TRA TOÀN BỘ ĐƠN HÀNG NGÀY 06/09/2026 TRONG DATABASE HIỆN TẠI ===");

    // Lấy tất cả đơn hàng ngày 06/09/2026
    let orders: Vec<(i64, Option<String>, Option<String>, Option<f64>, Option<f64>, Option<String>)> = sqlx::query_as(
        "SELECT id, display_id, date, CAST(total_amount AS REAL), CAST(amount_paid AS REAL), type \
         FROM \"order\" \
         WHERE date LIKE '2026-09-06%' \
         ORDER BY id ASC"
    ).fetch_all(&pool).await?;

    println!("Tổng số đơn ngày 06/09/2026: {}", orders.len());

    let mut total_sale_rev = 0.0;
    let mut total_purchase_rev = 0.0;
    let mut sale_count = 0;
    let mut purchase_count = 0;

    for o in &orders {
        let typ = o.5.as_deref().unwrap_or("");
        let tot = o.3.unwrap_or(0.0);
        if typ == "Sale" {
            sale_count += 1;
            total_sale_rev += tot;
        } else if typ == "Purchase" {
            purchase_count += 1;
            total_purchase_rev += tot;
        }
    }

    println!("- Số đơn Bán Hàng (Sale): {} đơn | Doanh thu: {:.2}", sale_count, total_sale_rev);
    println!("- Số đơn Nhập Hàng (Purchase): {} đơn | Tiền nhập: {:.2}", purchase_count, total_purchase_rev);

    // Tính giá vốn của các đơn Sale ngày 06/09/2026
    let cost: Option<f64> = sqlx::query_scalar(
        "SELECT CAST(SUM(od.quantity * COALESCE(od.cost_price, p.cost_price, od.price)) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON o.id = od.order_id \
         LEFT JOIN product p ON p.id = od.product_id \
         WHERE o.type = 'Sale' AND o.date LIKE '2026-09-06%' AND o.display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool).await?;

    let profit = total_sale_rev - cost.unwrap_or(0.0);
    println!("- Tổng giá vốn hàng bán: {:.2}", cost.unwrap_or(0.0));
    println!("- Lợi nhuận gộp: {:.2}", profit);

    // Kiểm tra xem có đơn hàng nào bị trùng display_id giữa 2 đơn Sale không
    let dup_sales: Vec<(String, i64)> = sqlx::query_as(
        "SELECT display_id, COUNT(*) as cnt \
         FROM \"order\" \
         WHERE date LIKE '2026-09-06%' AND type = 'Sale' \
         GROUP BY display_id HAVING cnt > 1"
    ).fetch_all(&pool).await?;

    println!("\nKiểm tra trùng display_id giữa các đơn Sale ngày 06/09/2026:");
    if dup_sales.is_empty() {
        println!("=> KHÔNG CÓ đơn Sale nào bị trùng mã display_id trong ngày 06/09/2026!");
    } else {
        for (disp, cnt) in dup_sales {
            println!("! Bị trùng: {} ({} lần)", disp, cnt);
        }
    }

    // Kiểm tra order_detail của các đơn ngày 06/09/2026 có bị trùng lặp không
    let dup_od: Vec<(i64, i64, i64)> = sqlx::query_as(
        "SELECT od.order_id, od.product_id, COUNT(*) as cnt \
         FROM order_detail od \
         JOIN \"order\" o ON o.id = od.order_id \
         WHERE o.date LIKE '2026-09-06%' \
         GROUP BY od.order_id, od.product_id HAVING cnt > 1"
    ).fetch_all(&pool).await?;

    println!("\nKiểm tra trùng dòng chi tiết đơn hàng (order_detail) ngày 06/09/2026:");
    if dup_od.is_empty() {
        println!("=> KHÔNG CÓ dòng chi tiết đơn hàng nào bị trùng lặp!");
    } else {
        for (oid, pid, cnt) in dup_od {
            println!("! Bị trùng order_id: {}, product_id: {} ({} lần)", oid, pid, cnt);
        }
    }

    // In chi tiết danh sách tất cả các đơn ngày 06/09/2026
    println!("\n=== DANH SÁCH CHI TIẾT TẤT CẢ ĐƠN HÀNG NGÀY 06/09/2026 ===");
    for (id, disp, dt, tot, paid, typ) in &orders {
        println!("ID: {:<6} | {:<15} | Type: {:<8} | Date: {:<22} | Total: {:<12?} | Paid: {:?}", 
            id, disp.as_deref().unwrap_or(""), typ.as_deref().unwrap_or(""), dt.as_deref().unwrap_or(""), tot, paid);
    }

    Ok(())
}
