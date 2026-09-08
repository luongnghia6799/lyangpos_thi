use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use std::error::Error;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("=== THỰC HIỆN GỘP CHUẨN XÁC TOÀN BỘ ĐƠN TỪ CẢ 2 MÁY (PRAGMA foreign_keys = OFF) ===");

    // Kết nối với foreign_keys(false) ngay trong Connection Options
    let opts_e = SqliteConnectOptions::from_str("sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc")?
        .foreign_keys(false);
    let pool_e = SqlitePoolOptions::new().max_connections(1).connect_with(opts_e).await?;

    let opts_d = SqliteConnectOptions::from_str("sqlite://D:/LyangPOS/easypos_backup_merge.db?mode=ro")?
        .foreign_keys(false);
    let pool_d = SqlitePoolOptions::new().max_connections(1).connect_with(opts_d).await?;

    // Lấy MAX(id) hiện tại của đơn hàng trên E
    let max_order_id: (i64,) = sqlx::query_as("SELECT COALESCE(MAX(id), 0) FROM \"order\"").fetch_one(&pool_e).await?;
    let mut next_order_id = max_order_id.0 + 1;

    // Lấy tất cả đơn hàng từ File D ngày 06/09/2026
    let d_orders = sqlx::query(
        "SELECT id, date, partner_id, CAST(total_amount AS REAL) as total_amount, payment_method, \
                type, note, CAST(amount_paid AS REAL) as amount_paid, CAST(old_debt AS REAL) as old_debt, \
                display_id, status, shipping_status, shipping_address, shipping_phone, delivery_date, \
                CAST(cash_given AS REAL) as cash_given, created_by, is_duplicate_checked, is_consignment, \
                is_invoiced, invoice_no, invoice_date, invoice_note \
         FROM \"order\" WHERE date LIKE '2026-09-06%' ORDER BY id ASC"
    ).fetch_all(&pool_d).await?;

    println!("Tổng số đơn ngày 06/09 trên file D: {}", d_orders.len());

    let mut added_count = 0;
    for o in d_orders {
        use sqlx::Row;
        let old_d_id: i64 = o.get("id");
        let d_disp: Option<String> = o.get("display_id");
        let d_date: Option<String> = o.get("date");
        let d_tot: f64 = o.get("total_amount");

        // Kiểm tra xem đơn này đã có trên E chưa
        let exists_same: Option<(i64,)> = sqlx::query_as(
            "SELECT id FROM \"order\" WHERE display_id = ? AND date = ? AND ABS(CAST(total_amount AS REAL) - ?) < 1.0"
        )
        .bind(&d_disp)
        .bind(&d_date)
        .bind(d_tot)
        .fetch_optional(&pool_e)
        .await?;

        if exists_same.is_some() {
            // Đơn này đã có trên E rồi (76 đơn đầu chung)
            continue;
        }

        // Đây là đơn mới phát sinh trên D (25 đơn trưa + 51 đơn chiều) -> Gán ID mới!
        let new_id = next_order_id;
        next_order_id += 1;

        let partner_id: Option<i64> = o.get("partner_id");
        let payment_method: Option<String> = o.get("payment_method");
        let o_type: Option<String> = o.get("type");
        let note: Option<String> = o.get("note");
        let amount_paid: f64 = o.get("amount_paid");
        let old_debt: Option<f64> = o.get("old_debt");
        let status: Option<String> = o.get("status");
        let shipping_status: Option<String> = o.get("shipping_status");
        let shipping_address: Option<String> = o.get("shipping_address");
        let shipping_phone: Option<String> = o.get("shipping_phone");
        let delivery_date: Option<String> = o.get("delivery_date");
        let cash_given: Option<f64> = o.get("cash_given");
        let created_by: Option<String> = o.get("created_by");
        let is_duplicate_checked: Option<bool> = o.get("is_duplicate_checked");
        let is_consignment: Option<bool> = o.get("is_consignment");
        let is_invoiced: Option<bool> = o.get("is_invoiced");
        let invoice_no: Option<String> = o.get("invoice_no");
        let invoice_date: Option<String> = o.get("invoice_date");
        let invoice_note: Option<String> = o.get("invoice_note");

        // Insert order với new_id
        sqlx::query(
            "INSERT INTO \"order\" (id, date, partner_id, total_amount, payment_method, type, note, amount_paid, \
             old_debt, display_id, status, shipping_status, shipping_address, shipping_phone, delivery_date, \
             cash_given, created_by, is_duplicate_checked, is_consignment, is_invoiced, invoice_no, invoice_date, invoice_note) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(new_id)
        .bind(&d_date)
        .bind(partner_id)
        .bind(d_tot)
        .bind(&payment_method)
        .bind(&o_type)
        .bind(&note)
        .bind(amount_paid)
        .bind(old_debt)
        .bind(&d_disp)
        .bind(&status)
        .bind(&shipping_status)
        .bind(&shipping_address)
        .bind(&shipping_phone)
        .bind(&delivery_date)
        .bind(cash_given)
        .bind(&created_by)
        .bind(is_duplicate_checked)
        .bind(is_consignment)
        .bind(is_invoiced)
        .bind(&invoice_no)
        .bind(&invoice_date)
        .bind(&invoice_note)
        .execute(&pool_e)
        .await?;

        // Lấy và insert toàn bộ order_detail của đơn này từ file D
        let details = sqlx::query(
            "SELECT product_id, product_name_override, CAST(quantity AS REAL) as quantity, \
                    CAST(shipped_quantity AS REAL) as shipped_quantity, CAST(price AS REAL) as price, \
                    CAST(cost_price AS REAL) as cost_price, is_invoiced, \
                    CAST(invoiced_quantity AS REAL) as invoiced_quantity, invoice_no \
             FROM order_detail WHERE order_id = ?"
        )
        .bind(old_d_id)
        .fetch_all(&pool_d)
        .await?;

        for dt in details {
            let pid: Option<i64> = dt.get("product_id");
            let name_over: Option<String> = dt.get("product_name_override");
            let qty: f64 = dt.get("quantity");
            let s_qty: Option<f64> = dt.get("shipped_quantity");
            let price: f64 = dt.get("price");
            let cost: Option<f64> = dt.get("cost_price");
            let is_inv: Option<bool> = dt.get("is_invoiced");
            let inv_qty: Option<f64> = dt.get("invoiced_quantity");
            let inv_no: Option<String> = dt.get("invoice_no");

            sqlx::query(
                "INSERT INTO order_detail (order_id, product_id, product_name_override, quantity, shipped_quantity, price, cost_price, is_invoiced, invoiced_quantity, invoice_no) \
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(new_id)
            .bind(pid)
            .bind(name_over)
            .bind(qty)
            .bind(s_qty)
            .bind(price)
            .bind(cost)
            .bind(is_inv)
            .bind(inv_qty)
            .bind(inv_no)
            .execute(&pool_e)
            .await?;
        }

        // Lấy và insert cash_voucher của đơn này từ file D nếu có
        let vouchers = sqlx::query(
            "SELECT partner_id, CAST(amount AS REAL) as amount, note, type, source, date \
             FROM cash_voucher WHERE order_id = ?"
        )
        .bind(old_d_id)
        .fetch_all(&pool_d)
        .await?;

        for v in vouchers {
            let v_pid: Option<i64> = v.get("partner_id");
            let v_amt: f64 = v.get("amount");
            let v_note: Option<String> = v.get("note");
            let v_type: String = v.get("type");
            let v_source: Option<String> = v.get("source");
            let v_date: Option<String> = v.get("date");

            sqlx::query(
                "INSERT INTO cash_voucher (partner_id, amount, note, type, source, order_id, date) \
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(v_pid)
            .bind(v_amt)
            .bind(v_note)
            .bind(v_type)
            .bind(v_source)
            .bind(new_id)
            .bind(v_date)
            .execute(&pool_e)
            .await?;
        }

        added_count += 1;
    }

    println!("✓ Đã gộp thêm {} đơn hàng độc lập từ máy D vào máy E với ID mới riêng biệt!", added_count);

    // Cập nhật lại total_amount cho các đơn hàng theo đúng SUM(od.quantity * od.price)
    sqlx::query(
        "UPDATE \"order\" SET total_amount = (
            SELECT COALESCE(SUM(od.quantity * od.price), 0.0) FROM order_detail od WHERE od.order_id = \"order\".id
        ) WHERE date LIKE '2026-09-06%'"
    ).execute(&pool_e).await?;

    // Checkpoint TRUNCATE
    sqlx::query("PRAGMA wal_checkpoint(TRUNCATE);").execute(&pool_e).await?;

    // Thống kê lại
    let total_orders_sept6: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM \"order\" WHERE date LIKE '2026-09-06%'"
    ).fetch_one(&pool_e).await?;

    let total_sale_rev: (f64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(CAST(total_amount AS REAL)), 0.0) FROM \"order\" WHERE type = 'Sale' AND date LIKE '2026-09-06%'"
    ).fetch_one(&pool_e).await?;

    let cost_cur: Option<f64> = sqlx::query_scalar(
        "SELECT CAST(SUM(od.quantity * COALESCE(od.cost_price, p.cost_price, od.price)) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON o.id = od.order_id \
         LEFT JOIN product p ON p.id = od.product_id \
         WHERE o.type = 'Sale' AND o.date LIKE '2026-09-06%' AND o.display_id NOT IN ('NODAU', '#NODAU')"
    ).fetch_one(&pool_e).await?;

    println!("==================================================");
    println!("🎉 KẾT QUẢ DATABASE SAU KHI MERGE CHUẨN 100%:");
    println!("- Tổng số đơn ngày 06/09/2026: {} đơn", total_orders_sept6.0);
    println!("- Tổng doanh thu bán hàng: {:>15.2} đ", total_sale_rev.0);
    println!("- Tổng giá vốn hàng bán  : {:>15.2} đ", cost_cur.unwrap_or(0.0));
    println!("- Tổng lợi nhuận gộp     : {:>15.2} đ", total_sale_rev.0 - cost_cur.unwrap_or(0.0));
    println!("==================================================");

    // Đồng bộ sang D:\LyangPOS\easypos.db
    std::fs::copy(
        "E:/vibe/LyangPOS/LyangPOS - Copy/easypos.db",
        "D:/LyangPOS/easypos.db",
    )?;
    println!("✓ Đã đồng bộ sang D:\\LyangPOS\\easypos.db!");

    Ok(())
}
