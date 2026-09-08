use sqlx::sqlite::SqlitePoolOptions;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let target_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(target_url).await?;

    println!("=== TEST API /api/dashboard-stats CHO NGÀY HÔM QUA (06/09/2026) VÀ HÔM NAY (07/09/2026) ===");

    for dt_str in &["2026-09-06", "2026-09-07"] {
        let parsed = NaiveDate::parse_from_str(dt_str, "%Y-%m-%d")?;
        let s = NaiveDateTime::new(parsed, NaiveTime::from_hms_opt(0, 0, 0).unwrap());
        let e = s + chrono::Duration::days(1);

        let rev: Option<f64> = sqlx::query_scalar(
            "SELECT CAST(SUM(total_amount) AS REAL) FROM \"order\" \
             WHERE type = 'Sale' AND date >= ? AND date < ? AND display_id NOT IN ('NODAU', '#NODAU')"
        ).bind(s).bind(e).fetch_one(&pool).await?;

        let cash_rev: Option<f64> = sqlx::query_scalar(
            "SELECT CAST(SUM(amount_paid) AS REAL) FROM \"order\" \
             WHERE type = 'Sale' AND date >= ? AND date < ? AND display_id NOT IN ('NODAU', '#NODAU')"
        ).bind(s).bind(e).fetch_one(&pool).await?;

        let cost: Option<f64> = sqlx::query_scalar(
            "SELECT CAST(SUM(od.quantity * COALESCE(od.cost_price, p.cost_price, od.price)) AS REAL) \
             FROM order_detail od \
             JOIN \"order\" o ON o.id = od.order_id \
             LEFT JOIN product p ON p.id = od.product_id \
             WHERE o.type = 'Sale' AND o.date >= ? AND o.date < ? AND o.display_id NOT IN ('NODAU', '#NODAU')"
        ).bind(s).bind(e).fetch_one(&pool).await?;

        let order_count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM \"order\" WHERE type = 'Sale' AND date >= ? AND date < ? AND display_id NOT IN ('NODAU', '#NODAU')"
        ).bind(s).bind(e).fetch_one(&pool).await?;

        let r = rev.unwrap_or(0.0);
        let cr = cash_rev.unwrap_or(0.0);
        let c = cost.unwrap_or(0.0);
        let p = r - c;

        println!("--------------------------------------------------");
        println!("📅 NGÀY: {}", dt_str);
        println!("- Số đơn bán hàng (Sale): {} đơn", order_count.0);
        println!("- Doanh thu (Revenue)   : {:>15.2} đ", r);
        println!("- Tiền mặt thu (Cash)   : {:>15.2} đ", cr);
        println!("- Doanh thu nợ (Debt)   : {:>15.2} đ", r - cr);
        println!("- Giá vốn hàng bán (Cost): {:>14.2} đ", c);
        println!("- Lợi nhuận gộp (Profit): {:>15.2} đ", p);
    }
    println!("--------------------------------------------------");

    Ok(())
}
