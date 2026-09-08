use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let target_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(target_url).await?;

    println!("=== CHI TIẾT CÁC ĐƠN HÀNG NGÀY 06/09/2026 CÓ LỢI NHUẬN ÂM HOẶC BẤT THƯỜNG ===");

    let orders_with_cost: Vec<(i64, Option<String>, Option<String>, Option<f64>, Option<f64>)> = sqlx::query_as(
        "SELECT o.id, o.display_id, o.date, CAST(o.total_amount AS REAL), \
                CAST(SUM(od.quantity * COALESCE(od.cost_price, p.cost_price, od.price)) AS REAL) as cost \
         FROM \"order\" o \
         JOIN order_detail od ON o.id = od.order_id \
         LEFT JOIN product p ON p.id = od.product_id \
         WHERE o.type = 'Sale' AND o.date LIKE '2026-09-06%' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY o.id \
         ORDER BY (CAST(o.total_amount AS REAL) - cost) ASC"
    ).fetch_all(&pool).await?;

    println!("Top các đơn hàng có lợi nhuận âm (Giá bán < Giá vốn):");
    for (id, disp, dt, tot, cost) in orders_with_cost.iter().take(15) {
        let t = tot.unwrap_or(0.0);
        let c = cost.unwrap_or(0.0);
        let p = t - c;
        if p < 0.0 {
            println!("- Đơn ID {:<6} ({:<12}) | Doanh thu: {:>10.0} | Giá vốn: {:>10.0} | LỢI NHUẬN: {:>10.0} | Ngày: {:?}",
                id, disp.as_deref().unwrap_or(""), t, c, p, dt);

            // In chi tiết các mặt hàng trong đơn này
            let items: Vec<(i64, String, Option<f64>, Option<f64>, Option<f64>, Option<f64>)> = sqlx::query_as(
                "SELECT od.product_id, p.name, CAST(od.quantity AS REAL), CAST(od.price AS REAL), \
                        CAST(od.cost_price AS REAL), CAST(p.cost_price AS REAL) \
                 FROM order_detail od \
                 LEFT JOIN product p ON p.id = od.product_id \
                 WHERE od.order_id = $1"
            ).bind(id).fetch_all(&pool).await?;
            for it in items {
                println!("    + SP {}: {:<30} | Qty: {:<4?} | Giá bán: {:<8?} | od.cost: {:<8?} | p.cost: {:?}", 
                    it.0, it.1, it.2, it.3, it.4, it.5);
            }
        }
    }

    Ok(())
}
