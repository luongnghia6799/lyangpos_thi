use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let target_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(target_url).await?;

    println!("=== SO SÁNH CÁCH TÍNH CỦA BÁO CÁO KINH DOANH VS DASHBOARD ===");

    // 1. Cách tính của Báo cáo kinh doanh (Report Products):
    // SUM(od.quantity * od.price)
    // SUM(od.quantity * unit_cost) trong đó unit_cost = od.cost_price.or(p.cost_price).unwrap_or(od.price)
    let rep_sql = "SELECT od.id as detail_id, od.product_id, od.product_name_override, \
                          CAST(od.quantity AS REAL) as quantity, CAST(od.price AS REAL) as price, \
                          CAST(od.cost_price AS REAL) as cost_price, \
                          p.name as product_name, CAST(p.cost_price AS REAL) as default_cost_price \
                   FROM order_detail od \
                   JOIN \"order\" o ON o.id = od.order_id \
                   LEFT JOIN product p ON p.id = od.product_id \
                   WHERE o.type = 'Sale' \
                     AND strftime('%Y', o.date) = '2026' \
                     AND strftime('%m', o.date) = '09' \
                     AND strftime('%d', o.date) = '06'";

    let rows = sqlx::query(rep_sql).fetch_all(&pool).await?;

    let mut rep_rev = 0.0;
    let mut rep_cost = 0.0;
    for r in &rows {
        use sqlx::Row;
        let qty: f64 = r.get("quantity");
        let price: f64 = r.get("price");
        let detail_cost: Option<f64> = r.get("cost_price");
        let default_cost: Option<f64> = r.get("default_cost_price");

        let unit_cost = detail_cost.or(default_cost).unwrap_or(price);
        rep_rev += qty * price;
        rep_cost += qty * unit_cost;
    }
    let rep_profit = rep_rev - rep_cost;

    println!("📊 1. KẾT QUẢ TỪ BÁO CÁO KINH DOANH (trang trong ảnh):");
    println!("   - Tổng doanh thu (SUM od.quantity * od.price): {:>15.2} đ", rep_rev);
    println!("   - Tổng giá vốn  (SUM od.quantity * unit_cost): {:>15.2} đ", rep_cost);
    println!("   - Tổng lợi nhuận                             : {:>15.2} đ", rep_profit);
    println!("   - Số sản phẩm bán ra                         : {} dòng", rows.len());

    // 2. Cách tính hiện tại của Dashboard:
    // Doanh thu = SUM(o.total_amount)
    // Giá vốn = SUM(od.quantity * COALESCE(od.cost_price, p.cost_price, od.price))
    let dash_rev: Option<f64> = sqlx::query_scalar(
        "SELECT CAST(SUM(total_amount) AS REAL) FROM \"order\" \
         WHERE type = 'Sale' AND date >= '2026-09-06 00:00:00' AND date < '2026-09-07 00:00:00' AND display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool).await?;

    let dash_cost: Option<f64> = sqlx::query_scalar(
        "SELECT CAST(SUM(od.quantity * COALESCE(od.cost_price, p.cost_price, od.price)) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON o.id = od.order_id \
         LEFT JOIN product p ON p.id = od.product_id \
         WHERE o.type = 'Sale' AND o.date >= '2026-09-06 00:00:00' AND o.date < '2026-09-07 00:00:00' AND o.display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool).await?;

    println!("\n📉 2. KẾT QUẢ HIỆN TẠI TỪ DASHBOARD (/api/dashboard-stats):");
    println!("   - Tổng doanh thu (SUM o.total_amount)        : {:>15.2} đ", dash_rev.unwrap_or(0.0));
    println!("   - Tổng giá vốn                               : {:>15.2} đ", dash_cost.unwrap_or(0.0));
    println!("   - Tổng lợi nhuận                             : {:>15.2} đ", dash_rev.unwrap_or(0.0) - dash_cost.unwrap_or(0.0));

    // Tìm xem tại sao SUM(o.total_amount) = 88.389.500 đ mà SUM(od.quantity * od.price) = 95.764.500 đ
    // Chênh lệch: 7.375.000 đ
    println!("\n🔍 3. TÌM NGUYÊN NHÂN LỆCH GIỮA TỔNG ĐƠN VÀ CHI TIẾT TỪNG MÓN:");
    let diff_orders: Vec<(i64, Option<String>, Option<f64>, Option<f64>)> = sqlx::query_as(
        "SELECT o.id, o.display_id, CAST(o.total_amount AS REAL) as total_amount, \
                CAST(SUM(od.quantity * od.price) AS REAL) as detail_total \
         FROM \"order\" o \
         JOIN order_detail od ON o.id = od.order_id \
         WHERE o.type = 'Sale' AND o.date LIKE '2026-09-06%' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY o.id \
         HAVING ABS(total_amount - detail_total) > 1.0"
    ).fetch_all(&pool).await?;

    println!("   Số đơn có total_amount khác với SUM(od.quantity * od.price): {} đơn", diff_orders.len());
    for (id, disp, tot, dtot) in diff_orders {
        println!("   - Đơn ID {:<6} ({:<12}): o.total_amount = {:>10?} đ vs SUM(od) = {:>10?} đ (Lệch: {:>10.0} đ)",
            id, disp.as_deref().unwrap_or(""), tot, dtot, dtot.unwrap_or(0.0) - tot.unwrap_or(0.0));
    }

    Ok(())
}
