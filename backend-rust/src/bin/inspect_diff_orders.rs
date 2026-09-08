use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let target_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(target_url).await?;

    println!("=== CHI TIẾT CỦA 12 ĐƠN HÀNG LỆCH TIỀN ===");

    let order_ids = vec![43527, 43528, 43529, 43530, 43531, 43532, 43533, 43534, 43535, 43536, 43537, 43538];

    for oid in order_ids {
        let o: (i64, Option<String>, Option<String>, Option<f64>, Option<f64>, Option<f64>, Option<String>) = sqlx::query_as(
            "SELECT id, display_id, date, CAST(total_amount AS REAL), CAST(amount_paid AS REAL), CAST(old_debt AS REAL), note \
             FROM \"order\" WHERE id = $1"
        ).bind(oid).fetch_one(&pool).await?;

        println!("--------------------------------------------------");
        println!("ĐƠN ID {}: Mã {}, Ngày: {:?}, Note: {:?}", o.0, o.1.as_deref().unwrap_or(""), o.2, o.6);
        println!("  o.total_amount = {:?}, o.amount_paid = {:?}, o.old_debt = {:?}", o.3, o.4, o.5);

        let details: Vec<(i64, Option<i64>, Option<String>, Option<f64>, Option<f64>, Option<f64>)> = sqlx::query_as(
            "SELECT id, product_id, product_name_override, CAST(quantity AS REAL), CAST(price AS REAL), CAST(cost_price AS REAL) \
             FROM order_detail WHERE order_id = $1"
        ).bind(oid).fetch_all(&pool).await?;

        println!("  Các sản phẩm trong đơn:");
        let mut sum_od = 0.0;
        for d in details {
            let p_name: Option<String> = if let Some(pid) = d.1 {
                sqlx::query_scalar("SELECT name FROM product WHERE id = $1").bind(pid).fetch_optional(&pool).await?
            } else {
                None
            };
            let name = d.2.or(p_name).unwrap_or_else(|| "Unknown".into());
            let line_total = d.3.unwrap_or(0.0) * d.4.unwrap_or(0.0);
            sum_od += line_total;
            println!("    - SP {:<3}: {:<30} | Qty: {:<4?} | Giá: {:<8?} | Thành tiền: {:<10.0}", d.1.unwrap_or(0), name, d.3, d.4, line_total);
        }
        println!("  => SUM(od) = {:.0} đ (Khác o.total_amount: {:.0} đ)", sum_od, o.3.unwrap_or(0.0));
    }

    Ok(())
}
