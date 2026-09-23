use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{Row, SqlitePool};

use crate::error::AppError;

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String, // "user" or "model" / "assistant"
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct AiConsultRequest {
    pub message: String,
    pub history: Option<Vec<ChatMessage>>,
    pub images: Option<Vec<String>>,
    pub api_key: Option<String>,
    pub mode: Option<String>, // "crop_doctor" | "app_analytics" | "general_assistant"
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ProductContext {
    pub id: i64,
    pub name: String,
    pub code: Option<String>,
    pub unit: Option<String>,
    pub sale_price: Option<f64>,
    pub stock: Option<f64>,
    pub active_ingredient: Option<String>,
    pub brand: Option<String>,
}

async fn build_app_analytics_context(pool: &SqlitePool, user_query: Option<&str>) -> String {
    let mut ctx = String::from("=== BÁO CÁO & DỮ LIỆU SỐ LIỆU THỜI GIAN THỰC TỪ PHẦN MỀM LYANGPOS ===\n\n");

    let now = chrono::Local::now();
    let today_str = now.format("%Y-%m-%d").to_string();
    let month_prefix = now.format("%Y-%m").to_string();

    // 1. Doanh thu, Lợi nhuận & Đơn hàng hôm nay
    let today_sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND date(date) = date(?) AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&today_str)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let today_orders_count = today_sales.0;
    let today_rev = today_sales.1.unwrap_or(0.0);
    let today_paid = today_sales.2.unwrap_or(0.0);
    let today_debt = today_rev - today_paid;

    // Lợi nhuận hôm nay
    let today_profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND date(o.date) = date(?) AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&today_str)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    // Doanh thu & Lợi nhuận tháng này
    let month_sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND strftime('%Y-%m', date) = ? AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&month_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let month_orders_count = month_sales.0;
    let month_rev = month_sales.1.unwrap_or(0.0);
    let month_paid = month_sales.2.unwrap_or(0.0);

    let month_profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND strftime('%Y-%m', o.date) = ? AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&month_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    // Tổng quan toàn thời gian từ trước đến nay (All-time)
    let all_time_sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let all_time_profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    let all_time_rev = all_time_sales.1.unwrap_or(0.0);
    let all_time_profit_margin = if all_time_rev > 0.0 { (all_time_profit / all_time_rev) * 100.0 } else { 0.0 };
    let month_profit_margin = if month_rev > 0.0 { (month_profit / month_rev) * 100.0 } else { 0.0 };

    ctx.push_str(&format!(
        "1. TỔNG QUAN DOANH THU & LỢI NHUẬN GỘP:\n\
         - Hôm nay ({}): {} đơn hàng | Doanh thu: {:.}đ | Lợi nhuận gộp: {:.}đ | Thực thu tiền mặt: {:.}đ | Nợ mới: {:.}đ\n\
         - Tháng này ({}): {} đơn hàng | Doanh thu: {:.}đ | Lợi nhuận gộp: {:.}đ (Tỷ suất: {:.1}%) | Thực thu: {:.}đ\n\
         - TỔNG TOÀN THỜI GIAN (LỊCH SỬ TỪ TRƯỚC ĐẾN NAY): {} đơn bán hàng | Tổng doanh thu: {:.}đ | Tổng lợi nhuận gộp: {:.}đ (Tỷ suất: {:.1}%) | Đã thu: {:.}đ\n\n",
        today_str, today_orders_count, today_rev, today_profit, today_paid, today_debt,
        month_prefix, month_orders_count, month_rev, month_profit, month_profit_margin, month_paid,
        all_time_sales.0, all_time_rev, all_time_profit, all_time_profit_margin, all_time_sales.2.unwrap_or(0.0)
    ));

    // Lịch sử doanh thu 7 ngày gần nhất
    if let Ok(recent_days) = sqlx::query(
        "SELECT date(date) as day, COUNT(*) as cnt, \
                CAST(COALESCE(SUM(total_amount), 0) AS REAL) as rev, \
                CAST(COALESCE(SUM(amount_paid), 0) AS REAL) as paid \
         FROM \"order\" WHERE type = 'Sale' AND display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY date(date) ORDER BY date(date) DESC LIMIT 7"
    )
    .fetch_all(pool)
    .await {
        if !recent_days.is_empty() {
            ctx.push_str("LỊCH SỬ DOANH THU 7 NGÀY GẦN ĐÂY:\n");
            for r in recent_days {
                let day: String = r.try_get("day").unwrap_or_default();
                let cnt: i64 = r.try_get("cnt").unwrap_or(0);
                let rev: f64 = r.try_get("rev").unwrap_or(0.0);
                let paid: f64 = r.try_get("paid").unwrap_or(0.0);
                ctx.push_str(&format!("  * Ngày {}: {} đơn | Doanh thu: {:.}đ | Đã thu: {:.}đ\n", day, cnt, rev, paid));
            }
            ctx.push('\n');
        }
    }

    // Lịch sử doanh thu các tháng trong quá khứ (12 tháng gần nhất)
    if let Ok(recent_months) = sqlx::query(
        "SELECT strftime('%Y-%m', date) as m, COUNT(*) as cnt, \
                CAST(COALESCE(SUM(total_amount), 0) AS REAL) as rev, \
                CAST(COALESCE(SUM(amount_paid), 0) AS REAL) as paid \
         FROM \"order\" WHERE type = 'Sale' AND display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY m ORDER BY m DESC LIMIT 12"
    )
    .fetch_all(pool)
    .await {
        if !recent_months.is_empty() {
            ctx.push_str("LỊCH SỬ DOANH THU CÁC THÁNG TRONG QUÁ KHỨ (12 THÁNG GẦN NHẤT):\n");
            for r in recent_months {
                let m: String = r.try_get("m").unwrap_or_default();
                let cnt: i64 = r.try_get("cnt").unwrap_or(0);
                let rev: f64 = r.try_get("rev").unwrap_or(0.0);
                let paid: f64 = r.try_get("paid").unwrap_or(0.0);
                let debt = rev - paid;
                ctx.push_str(&format!("  * Tháng {}: {} đơn | Doanh thu: {:.}đ | Đã thu: {:.}đ | Nợ: {:.}đ\n", m, cnt, rev, paid, debt));
            }
            ctx.push('\n');
        }
    }

    // TOP SẢN PHẨM MANG LẠI LỢI NHUẬN CAO NHẤT (TOÀN THỜI GIAN)
    if let Ok(top_profits) = sqlx::query(
        "SELECT COALESCE(od.product_name_override, p.name) as name, p.unit, \
                CAST(SUM(od.quantity) AS REAL) as total_qty, \
                CAST(SUM(od.quantity * od.price) AS REAL) as total_rev, \
                CAST(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))) AS REAL) as total_profit \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY od.product_id \
         ORDER BY total_profit DESC LIMIT 15"
    )
    .fetch_all(pool)
    .await {
        if !top_profits.is_empty() {
            ctx.push_str("TOP SẢN PHẨM MANG LẠI LỢI NHUẬN CAO NHẤT (TOÀN THỜI GIAN):\n");
            for (idx, r) in top_profits.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_else(|_| "Sản phẩm".to_string());
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                let qty: f64 = r.try_get("total_qty").unwrap_or(0.0);
                let rev: f64 = r.try_get("total_rev").unwrap_or(0.0);
                let profit: f64 = r.try_get("total_profit").unwrap_or(0.0);
                let margin = if rev > 0.0 { (profit / rev) * 100.0 } else { 0.0 };
                ctx.push_str(&format!(
                    "  {}. {}: Lợi nhuận: {:.}đ (Tỷ suất: {:.1}%) | Đã bán: {} {} | Doanh số: {:.}đ\n",
                    idx + 1, name, profit, margin, qty, unit, rev
                ));
            }
            ctx.push('\n');
        }
    }

    // Top 10 sản phẩm bán chạy nhất theo số lượng trong lịch sử
    if let Ok(top_sellers) = sqlx::query(
        "SELECT COALESCE(od.product_name_override, p.name) as name, p.unit, \
                CAST(SUM(od.quantity) AS REAL) as total_qty, \
                CAST(SUM(od.quantity * od.price) AS REAL) as total_rev, \
                CAST(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))) AS REAL) as total_profit \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY od.product_id \
         ORDER BY total_qty DESC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !top_sellers.is_empty() {
            ctx.push_str("TOP 10 SẢN PHẨM BÁN CHẠY NHẤT LỊCH SỬ (THEO SỐ LƯỢNG BÁN):\n");
            for (idx, r) in top_sellers.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_else(|_| "Sản phẩm".to_string());
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                let qty: f64 = r.try_get("total_qty").unwrap_or(0.0);
                let rev: f64 = r.try_get("total_rev").unwrap_or(0.0);
                let profit: f64 = r.try_get("total_profit").unwrap_or(0.0);
                ctx.push_str(&format!("  {}. {}: Đã bán {} {} | Doanh số: {:.}đ | Lợi nhuận: {:.}đ\n", idx + 1, name, qty, unit, rev, profit));
            }
            ctx.push('\n');
        }
    }

    // 2. Tồn kho & Sản phẩm
    let total_prods: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM product WHERE is_active = 1")
        .fetch_one(pool)
        .await
        .unwrap_or(0);

    let out_of_stock: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM product WHERE is_active = 1 AND stock <= 0")
        .fetch_one(pool)
        .await
        .unwrap_or(0);

    ctx.push_str(&format!(
        "2. KHO HÀNG & SẢN PHẨM HIỆN TẠI:\n\
         - Tổng số mặt hàng đang kinh doanh: {}\n\
         - Số mặt hàng hết tồn kho (≤ 0): {}\n",
        total_prods, out_of_stock
    ));

    // Hàng sắp hết kho (stock <= min_stock AND min_stock > 0)
    if let Ok(low_stocks) = sqlx::query(
        "SELECT name, stock, min_stock, unit FROM product \
         WHERE is_active = 1 AND min_stock > 0 AND stock <= min_stock \
         ORDER BY stock ASC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !low_stocks.is_empty() {
            ctx.push_str("- Mặt hàng cảnh báo sắp hết (Tồn ≤ Mức tối thiểu):\n");
            for r in low_stocks {
                let name: String = r.try_get("name").unwrap_or_default();
                let stock: f64 = r.try_get("stock").unwrap_or(0.0);
                let min_s: f64 = r.try_get("min_stock").unwrap_or(0.0);
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                ctx.push_str(&format!("  + {}: Tồn {} {} (Mức báo: {})\n", name, stock, unit, min_s));
            }
        }
    }

    // Hàng cận hạn sử dụng
    if let Ok(exp_rows) = sqlx::query(
        "SELECT name, expiry_date, stock, unit FROM product \
         WHERE is_active = 1 AND expiry_date IS NOT NULL AND expiry_date != '' \
         ORDER BY expiry_date ASC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !exp_rows.is_empty() {
            ctx.push_str("- Hạn dùng sản phẩm gần nhất (Hạn dùng/Quá hạn):\n");
            for r in exp_rows {
                let name: String = r.try_get("name").unwrap_or_default();
                let exp: String = r.try_get("expiry_date").unwrap_or_default();
                let stock: f64 = r.try_get("stock").unwrap_or(0.0);
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                ctx.push_str(&format!("  + {}: Hạn dùng {} | Tồn: {} {}\n", name, exp, stock, unit));
            }
        }
    }
    ctx.push('\n');

    // 3. Khách hàng & Công nợ (Phải thu & Phải trả chi tiết)
    let total_customers: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partner WHERE is_customer = 1 OR type = 'Customer'"
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let customer_debt_stats: (i64, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(debt_balance) AS REAL) FROM partner \
         WHERE (is_customer = 1 OR type = 'Customer') AND debt_balance > 0"
    )
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0)));

    let total_customer_debt = customer_debt_stats.1.unwrap_or(0.0);
    let count_customer_debtors = customer_debt_stats.0;

    let total_suppliers: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partner WHERE is_supplier = 1 OR type = 'Supplier'"
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    // Công nợ phải trả NCC (debt_balance < 0 là nợ cửa hàng nợ nhà cung cấp)
    let supplier_debt_stats: (i64, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(ABS(debt_balance)) AS REAL) FROM partner \
         WHERE (is_supplier = 1 OR type = 'Supplier') AND debt_balance < 0"
    )
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0)));

    let total_supplier_debt = supplier_debt_stats.1.unwrap_or(0.0);
    let count_supplier_debtors = supplier_debt_stats.0;

    ctx.push_str(&format!(
        "3. ĐỐI TÁC & CÔNG NỢ (PHẢI THU & PHẢI TRẢ CHI TIẾT):\n\
         - KHÁCH HÀNG (CÔNG NỢ PHẢI THU - KHÁCH NỢ CỬA HÀNG):\n\
           * Tổng số khách hàng: {}\n\
           * Số khách hàng hiện đang có nợ: {} khách\n\
           * TỔNG CÔNG NỢ PHẢI THU TỪ KHÁCH HÀNG: {:.}đ\n\
         - NHÀ CUNG CẤP (CÔNG NỢ PHẢI TRẢ - CỬA HÀNG NỢ NHÀ CUNG CẤP):\n\
           * Tổng số nhà cung cấp: {}\n\
           * Số nhà cung cấp cửa hàng đang nợ: {} nhà cung cấp\n\
           * TỔNG CÔNG NỢ PHẢI TRẢ NHÀ CUNG CẤP: {:.}đ\n\n",
        total_customers, count_customer_debtors, total_customer_debt,
        total_suppliers, count_supplier_debtors, total_supplier_debt
    ));

    // Top khách hàng nợ nhiều nhất (15 khách hàng)
    if let Ok(debtors) = sqlx::query(
        "SELECT name, phone, debt_balance FROM partner \
         WHERE (is_customer = 1 OR type = 'Customer') AND debt_balance > 0 \
         ORDER BY debt_balance DESC LIMIT 15"
    )
    .fetch_all(pool)
    .await {
        if !debtors.is_empty() {
            ctx.push_str("DANH SÁCH TOP KHÁCH HÀNG ĐANG CÓ NỢ CAO NHẤT (CÔNG NỢ PHẢI THU):\n");
            for (idx, r) in debtors.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let phone: String = r.try_get("phone").unwrap_or_else(|_| "".to_string());
                let debt: f64 = r.try_get("debt_balance").unwrap_or(0.0);
                let phone_str = if phone.trim().is_empty() { "Chưa có SĐT".to_string() } else { phone.trim().to_string() };
                ctx.push_str(&format!("  {}. {} (SĐT: {}): {:.}đ\n", idx + 1, name, phone_str, debt));
            }
            ctx.push('\n');
        }
    }

    // Top nhà cung cấp cửa hàng đang nợ nhiều nhất (10 nhà cung cấp)
    if let Ok(supp_debtors) = sqlx::query(
        "SELECT name, phone, debt_balance FROM partner \
         WHERE (is_supplier = 1 OR type = 'Supplier') AND debt_balance < 0 \
         ORDER BY debt_balance ASC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !supp_debtors.is_empty() {
            ctx.push_str("DANH SÁCH TOP NHÀ CUNG CẤP CỬA HÀNG ĐANG NỢ NHIỀU NHẤT (CÔNG NỢ PHẢI TRẢ):\n");
            for (idx, r) in supp_debtors.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let phone: String = r.try_get("phone").unwrap_or_else(|_| "".to_string());
                let raw_debt: f64 = r.try_get("debt_balance").unwrap_or(0.0);
                let debt = raw_debt.abs();
                let phone_str = if phone.trim().is_empty() { "Chưa có SĐT".to_string() } else { phone.trim().to_string() };
                ctx.push_str(&format!("  {}. {} (SĐT: {}): {:.}đ\n", idx + 1, name, phone_str, debt));
            }
            ctx.push('\n');
        }
    }

    // 4. Thu chi tiền mặt từ cash_voucher
    let cash_in_today: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(amount), 0) AS REAL) FROM cash_voucher \
         WHERE type = 'Receipt' AND date(date) = date(?)"
    )
    .bind(&today_str)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    let cash_out_today: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(amount), 0) AS REAL) FROM cash_voucher \
         WHERE type = 'Payment' AND date(date) = date(?)"
    )
    .bind(&today_str)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    let cash_in_month: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(amount), 0) AS REAL) FROM cash_voucher \
         WHERE type = 'Receipt' AND strftime('%Y-%m', date) = ?"
    )
    .bind(&month_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    let cash_out_month: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(amount), 0) AS REAL) FROM cash_voucher \
         WHERE type = 'Payment' AND strftime('%Y-%m', date) = ?"
    )
    .bind(&month_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    ctx.push_str(&format!(
        "4. THU CHI TIỀN MẶT NGOÀI ĐƠN HÀNG (PHIẾU THU/CHI):\n\
         - Hôm nay ({}): Thu ngoài {:.}đ | Chi ngoài {:.}đ\n\
         - Tháng này ({}): Thu ngoài {:.}đ | Chi ngoài {:.}đ\n\n",
        today_str, cash_in_today, cash_out_today,
        month_prefix, cash_in_month, cash_out_month
    ));

    // 5. Lịch sử nhập hàng (Purchase Orders)
    let all_time_purchases: (i64, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL) FROM \"order\" WHERE type = 'Purchase'"
    )
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0)));

    let month_purchases: (i64, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL) FROM \"order\" WHERE type = 'Purchase' AND strftime('%Y-%m', date) = ?"
    )
    .bind(&month_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0)));

    ctx.push_str(&format!(
        "5. LỊCH SỬ NHẬP HÀNG TỪ NHÀ CUNG CẤP:\n\
         - Nhập hàng tháng này ({}): {} đơn nhập | Tổng tiền: {:.}đ\n\
         - Tổng tiền nhập hàng toàn thời gian: {} đơn nhập | {:.}đ\n\n",
        month_prefix, month_purchases.0, month_purchases.1.unwrap_or(0.0),
        all_time_purchases.0, all_time_purchases.1.unwrap_or(0.0)
    ));

    // 6. Tra cứu bổ sung theo câu hỏi người dùng (nếu có hỏi đối tác hoặc sản phẩm cụ thể)
    if let Some(q) = user_query {
        let q_clean = q.trim();
        if !q_clean.is_empty() {
            let q_norm = crate::utils::remove_accents(q_clean).to_lowercase();
            if let Ok(partners) = sqlx::query("SELECT id, name, phone, debt_balance, type, is_customer, is_supplier FROM partner LIMIT 1000").fetch_all(pool).await {
                for p in partners {
                    let p_name: String = p.try_get("name").unwrap_or_default();
                    let p_phone: String = p.try_get("phone").unwrap_or_default();
                    let p_name_norm = crate::utils::remove_accents(&p_name).to_lowercase();

                    let phone_matched = !p_phone.is_empty() && q_clean.contains(&p_phone);
                    let name_matched = !p_name_norm.is_empty() && p_name_norm.len() >= 3 && q_norm.contains(&p_name_norm);

                    if phone_matched || name_matched {
                        let p_id: i64 = p.try_get("id").unwrap_or(0);
                        let p_debt: f64 = p.try_get("debt_balance").unwrap_or(0.0);
                        let p_type: String = p.try_get("type").unwrap_or_default();
                        let is_cust: bool = p.try_get("is_customer").unwrap_or(false);
                        let is_supp: bool = p.try_get("is_supplier").unwrap_or(false);
                        let role_desc = if is_cust && is_supp {
                            "Khách hàng & Nhà cung cấp"
                        } else if is_supp {
                            "Nhà cung cấp"
                        } else {
                            "Khách hàng"
                        };
                        let debt_desc = if p_debt > 0.0 {
                            format!("Khách đang nợ cửa hàng {:.}đ (Phải thu)", p_debt)
                        } else if p_debt < 0.0 {
                            format!("Cửa hàng đang nợ đối tác {:.}đ (Phải trả)", p_debt.abs())
                        } else {
                            "Đã thanh toán hết nợ (0đ)".to_string()
                        };

                        ctx.push_str(&format!("★ CHI TIẾT LỊCH SỬ ĐỐI TÁC TRONG CÂU HỎI [{} - SĐT: {}]:\n", p_name, if p_phone.is_empty() { "---" } else { &p_phone }));
                        ctx.push_str(&format!("  - Phân loại: {} ({}) | Tình trạng công nợ: {}\n", role_desc, p_type, debt_desc));

                        if let Ok(orders) = sqlx::query(
                            "SELECT id, date, total_amount, amount_paid, display_id FROM \"order\" \
                             WHERE partner_id = ? ORDER BY date DESC LIMIT 6"
                        )
                        .bind(p_id)
                        .fetch_all(pool)
                        .await {
                            if !orders.is_empty() {
                                ctx.push_str("  - 6 đơn hàng gần nhất của đối tác này:\n");
                                for ord in orders {
                                    let o_date: String = ord.try_get("date").unwrap_or_default();
                                    let o_tot: f64 = ord.try_get("total_amount").unwrap_or(0.0);
                                    let o_paid: f64 = ord.try_get("amount_paid").unwrap_or(0.0);
                                    let o_code: String = ord.try_get("display_id").unwrap_or_default();
                                    ctx.push_str(&format!("    + Đơn [{}] lúc {}: Tổng {:.}đ | Đã trả {:.}đ\n", o_code, o_date, o_tot, o_paid));
                                }
                            }
                        }
                        ctx.push('\n');
                        break;
                    }
                }
            }

            // Tra cứu thêm nếu người dùng hỏi về lợi nhuận hoặc doanh số của 1 sản phẩm cụ thể
            if let Ok(products_found) = sqlx::query(
                "SELECT p.id, p.name, p.unit, \
                        CAST(COALESCE(SUM(od.quantity), 0) AS REAL) as total_qty, \
                        CAST(COALESCE(SUM(od.quantity * od.price), 0) AS REAL) as total_rev, \
                        CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) as total_profit \
                 FROM product p \
                 LEFT JOIN order_detail od ON od.product_id = p.id \
                 LEFT JOIN \"order\" o ON od.order_id = o.id AND o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
                 WHERE p.is_active = 1 \
                 GROUP BY p.id LIMIT 1000"
            ).fetch_all(pool).await {
                for prod in products_found {
                    let prod_name: String = prod.try_get("name").unwrap_or_default();
                    let prod_name_norm = crate::utils::remove_accents(&prod_name).to_lowercase();
                    if prod_name_norm.len() >= 3 && q_norm.contains(&prod_name_norm) {
                        let unit: String = prod.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                        let qty: f64 = prod.try_get("total_qty").unwrap_or(0.0);
                        let rev: f64 = prod.try_get("total_rev").unwrap_or(0.0);
                        let profit: f64 = prod.try_get("total_profit").unwrap_or(0.0);
                        let margin = if rev > 0.0 { (profit / rev) * 100.0 } else { 0.0 };

                        ctx.push_str(&format!("★ CHI TIẾT SẢN PHẨM TRONG CÂU HỎI [{}]:\n", prod_name));
                        ctx.push_str(&format!("  - Đã bán: {} {}\n", qty, unit));
                        ctx.push_str(&format!("  - Tổng doanh thu: {:.}đ\n", rev));
                        ctx.push_str(&format!("  - Tổng lợi nhuận gộp: {:.}đ (Tỷ suất lợi nhuận: {:.1}%)\n\n", profit, margin));
                        break;
                    }
                }
            }
        }
    }

    ctx
}

fn is_advanced_active(name: &str) -> bool {
    let lower = name.to_lowercase();
    let advanced_keywords = [
        "spinetoram", "radiant", "flupyrimin", "sulfoxaflor", "broflanilide", "incipio",
        "chlorfenapyr", "cyantraniliprole", "benevia", "minecto", "chlorantraniliprole", 
        "virtako", "prevathon", "flonicamid", "teppeki", "spirotetramat", "movento", 
        "spirodiclofen", "envidor", "spiromesifen", "oberon", "fenpyroximate", "ortus", 
        "lufenuron", "match", "pyriproxyfen", "admiral", "tolfenpyrad", "afidopyropen", 
        "metaflumizone", "flubendiamide", "takumi", "diafenthiuron", "pegasus",
        "pydiflumetofen", "miravis", "fluxapyroxad", "sercadis", "fluopyram", "luna", 
        "oxathiapiprolin", "zorvec", "pyraclostrobin", "cabrio", "mandipropamid", "revus", 
        "fenamidone", "metiram", "polyram", "boscalid", "cantus", "kresoxim", "cyazofamid",
        "trifloxystrobin", "nativo", "fludioxonil", "sedaxane", "dinotefuran", "clothianidin",
        "hymexazol", "tachigaren", "chitosan", "ningnanmycin", "kasugamycin", "streptomycin"
    ];
    advanced_keywords.iter().any(|&k| lower.contains(k))
}

fn extract_active_ingredients(raw: &str) -> Vec<String> {
    let mut results = Vec::new();
    for part in raw.split(|c| c == '+' || c == ',' || c == ';' || c == '/') {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }
        let mut clean_words = Vec::new();
        for word in trimmed.split_whitespace() {
            if word.chars().next().map_or(false, |c| c.is_ascii_digit()) {
                break;
            }
            clean_words.push(word);
        }
        let clean_name = if clean_words.is_empty() {
            trimmed.to_string()
        } else {
            clean_words.join(" ")
        };
        let c_trimmed = clean_name.trim();
        if !c_trimmed.is_empty() && !results.iter().any(|x: &String| x.eq_ignore_ascii_case(c_trimmed)) {
            results.push(c_trimmed.to_string());
        }
    }
    results
}

pub async fn consult_ai(
    State(pool): State<SqlitePool>,
    Json(payload): Json<AiConsultRequest>,
) -> Result<impl IntoResponse, AppError> {
    let raw_mode = payload.mode.as_deref().unwrap_or("crop_doctor");
    let mut api_keys: Vec<String> = Vec::new();

    // 1. Thêm key từ payload (nếu có)
    if let Some(ref k) = payload.api_key {
        let trimmed = k.trim();
        if !trimmed.is_empty() {
            for part in trimmed.split(|c| c == ',' || c == '\n' || c == ';') {
                let p = part.trim();
                if !p.is_empty() && !api_keys.contains(&p.to_string()) {
                    api_keys.push(p.to_string());
                }
            }
        }
    }

    // 2. Lấy danh sách các key từ database app_setting (gemini_api_key, gemini_api_key_2, gemini_api_key_3)
    let setting_keys = ["gemini_api_key", "gemini_api_key_2", "gemini_api_key_3"];
    for sk in setting_keys {
        if let Ok(row) = sqlx::query("SELECT setting_value FROM app_setting WHERE setting_key = ?")
            .bind(sk)
            .fetch_optional(&pool)
            .await
        {
            if let Some(r) = row {
                if let Ok(val) = r.try_get::<String, _>("setting_value") {
                    let cleaned = val.trim_matches('"').trim();
                    for part in cleaned.split(|c| c == ',' || c == '\n' || c == ';') {
                        let p = part.trim();
                        if !p.is_empty() && !api_keys.contains(&p.to_string()) {
                            api_keys.push(p.to_string());
                        }
                    }
                }
            }
        }
    }

    if api_keys.is_empty() {
        return Ok(Json(json!({
            "error": "missing_api_key",
            "reply": "⚠️ Bạn chưa cấu hình **Gemini API Key** trong phần Cài Đặt. Vui lòng vào **Cài đặt -> Tích hợp AI** hoặc nhập API Key để sử dụng tính năng Trợ lý AI.",
            "recommended_products": []
        })));
    }

    let mut products: Vec<ProductContext> = Vec::new();

    // Kiểm tra nếu câu hỏi liên quan đến số liệu, công nợ, lợi nhuận, doanh thu...
    let user_msg_lower = payload.message.to_lowercase();
    let is_analytics_question = user_msg_lower.contains("nợ")
        || user_msg_lower.contains("công nợ")
        || user_msg_lower.contains("lợi nhuận")
        || user_msg_lower.contains("lãi")
        || user_msg_lower.contains("lời")
        || user_msg_lower.contains("doanh thu")
        || user_msg_lower.contains("đối tác")
        || user_msg_lower.contains("nhà cung cấp")
        || user_msg_lower.contains("khách hàng")
        || user_msg_lower.contains("bán chạy")
        || user_msg_lower.contains("thu chi")
        || user_msg_lower.contains("tiền mặt")
        || user_msg_lower.contains("tồn kho")
        || user_msg_lower.contains("sắp hết")
        || user_msg_lower.contains("hết hạn")
        || user_msg_lower.contains("cận date");

    // Nếu người dùng đang ở tab crop_doctor nhưng hỏi rõ ràng về công nợ, lợi nhuận, doanh thu... thì tự động chuyển sang mode app_analytics!
    let mode = if raw_mode == "crop_doctor" && is_analytics_question && !user_msg_lower.contains("bệnh") && !user_msg_lower.contains("sâu") && !user_msg_lower.contains("xịt") && !user_msg_lower.contains("phun") && !user_msg_lower.contains("liều") {
        "app_analytics"
    } else {
        raw_mode
    };

    // 3. Xây dựng System Instruction dựa theo từng Mode
    let system_instruction = match mode {
        "app_analytics" => {
            let analytics_context = build_app_analytics_context(&pool, Some(&payload.message)).await;
            format!(
                r#"Bạn là LyangAI - Trợ lý Kế toán & Phân tích Kinh doanh (Business Intelligence Analyst) cao cấp tích hợp trong phần mềm quản lý bán hàng LyangPOS.
Nhiệm vụ của bạn là giải đáp chính xác, khách quan và trực quan mọi thắc mắc của chủ cửa hàng về tình hình kinh doanh, doanh thu, đơn hàng, công nợ, tồn kho, mặt hàng sắp hết hoặc cận date dựa trên dữ liệu thời gian thực được cung cấp dưới đây.

★★★ DỮ LIỆU THỐNG KÊ THỜI GIAN THỰC TỪ PHẦN MỀM:
{}

★★★ QUY TẮC TRẢ LỜI:
1. Trả lời dựa trên các con số thực tế được thống kê ở trên. Khi người dùng hỏi số liệu cụ thể (doanh thu hôm nay, ai nợ nhiều nhất, hàng nào sắp hết, sản phẩm nào lợi nhuận nhất...), hãy nêu rõ con số kèm định dạng tiền tệ VNĐ (ví dụ: 1.500.000đ).
2. Định dạng câu trả lời bằng Markdown sinh động: dùng biểu tượng emoji (📊, 💰, ⚠️, 📦, 💳), in đậm số liệu quan trọng, trình bày gạch đầu dòng rõ ràng.
3. Nếu người dùng hỏi lời khuyên kinh doanh (ví dụ: "Có nên nhập thêm hàng X không?", "Làm sao giảm công nợ?"), hãy đưa ra phân tích sắc bén, lời khuyên thực tế phù hợp với quy mô cửa hàng vật tư / bán lẻ.
4. Ở chế độ này KHÔNG bắt buộc xuất khối recommended_products trừ khi người dùng hỏi về sản phẩm cụ thể.
"#,
                analytics_context
            )
        },
        "general_assistant" => {
            let mut prompt = r#"Bạn là LyangAI - Trợ lý AI Đa Năng Thông Minh (tương tự như Google Gemini / ChatGPT) tích hợp trong hệ thống phần mềm LyangPOS.
Bạn có khả năng hỗ trợ người dùng giải đáp, sáng tạo và thực hiện MỌI YÊU CẦU:
- Soạn thảo văn bản, tin nhắn Zalo/SMS gửi khách hàng, thông báo khuyến mãi, lời chúc mừng, email giao dịch.
- Giải đáp kiến thức khoa học, kỹ thuật nông nghiệp nói chung, canh tác cây trồng, phân bón, đất đai, thời tiết.
- Tính toán, phân tích, lập kế hoạch công việc, mẹo vặt cuộc sống và quản lý cửa hàng.
- Trả lời tự nhiên, thông minh, súc tích, chuyên nghiệp với định dạng Markdown rõ ràng, bắt mắt.
- Không bị gò bó vào danh mục thuốc hay số liệu nội bộ cửa hàng, trừ khi người dùng chủ động yêu cầu.
"#.to_string();
            if is_analytics_question {
                let analytics_context = build_app_analytics_context(&pool, Some(&payload.message)).await;
                prompt.push_str(&format!("\n\n★★★ DỮ LIỆU SỐ LIỆU KINH DOANH THỜI GIAN THỰC ĐỂ TRẢ LỜI CÂU HỎI:\n{}\n", analytics_context));
            }
            prompt
        },
        _ => {
            // Mode 1: Cố vấn thuốc BVTV & Cây trồng (Mặc định)
            products = match sqlx::query_as::<_, ProductContext>(
                r#"
                SELECT id, name, code, unit, 
                       CAST(sale_price AS REAL) as sale_price, 
                       CAST(stock AS REAL) as stock, 
                       active_ingredient, brand
                FROM product
                WHERE is_active = 1
                ORDER BY 
                    CASE WHEN active_ingredient IS NOT NULL AND TRIM(active_ingredient) != '' THEN 0 ELSE 1 END,
                    stock DESC,
                    name ASC
                LIMIT 1000
                "#
            )
            .fetch_all(&pool)
            .await
            {
                Ok(prods) => prods,
                Err(e) => {
                    tracing::error!("Lỗi truy vấn danh mục sản phẩm cho AI: {}", e);
                    Vec::new()
                },
            };

            let mut unique_advanced_actives: Vec<String> = Vec::new();
            let mut unique_common_actives: Vec<String> = Vec::new();
            let mut all_unique_actives: Vec<String> = Vec::new();

            for p in &products {
                if let Some(ref act) = p.active_ingredient {
                    let extracted = extract_active_ingredients(act);
                    for item in extracted {
                        let item_clean = item.trim();
                        if item_clean.is_empty() {
                            continue;
                        }
                        if !all_unique_actives.iter().any(|x| x.eq_ignore_ascii_case(item_clean)) {
                            all_unique_actives.push(item_clean.to_string());
                        }
                        if is_advanced_active(item_clean) {
                            if !unique_advanced_actives.iter().any(|x| x.eq_ignore_ascii_case(item_clean)) {
                                unique_advanced_actives.push(item_clean.to_string());
                            }
                        } else {
                            if !unique_common_actives.iter().any(|x| x.eq_ignore_ascii_case(item_clean)) {
                                unique_common_actives.push(item_clean.to_string());
                            }
                        }
                    }
                }
            }

            let advanced_actives_str = if unique_advanced_actives.is_empty() {
                String::from("(Kho chưa có hoặc chưa điền hoạt chất thế hệ mới)")
            } else {
                unique_advanced_actives.join(", ")
            };

            let common_actives_str = if unique_common_actives.is_empty() {
                String::from("(Chưa có hoạt chất phổ thông)")
            } else {
                unique_common_actives.join(", ")
            };

            let store_actives_str = if all_unique_actives.is_empty() {
                String::from("(Chưa có dữ liệu hoạt chất trong kho)")
            } else {
                all_unique_actives.join(", ")
            };

            let mut product_kb = String::from("DANH MỤC SẢN PHẨM & HOẠT CHẤT ĐANG KINH DOANH TẠI CỬA HÀNG:\n");
            if products.is_empty() {
                product_kb.push_str("(Hiện chưa có sản phẩm nào trong cơ sở dữ liệu)\n");
            } else {
                for p in &products {
                    let active = p.active_ingredient.as_deref().unwrap_or("Chưa có");
                    let brand = p.brand.as_deref().unwrap_or("");
                    let unit = p.unit.as_deref().unwrap_or("");
                    let price = p.sale_price.unwrap_or(0.0);
                    let stock = p.stock.unwrap_or(0.0);
                    let code = p.code.as_deref().unwrap_or("");

                    let is_prod_advanced = p.active_ingredient.as_ref().map_or(false, |act| is_advanced_active(act));
                    let tag_str = if is_prod_advanced {
                        "[🌟 TẦNG 1: CÔNG NGHỆ MỚI]"
                    } else if p.active_ingredient.as_ref().map_or(false, |act| !act.trim().is_empty()) {
                        "[🌾 TẦNG 2: PHỔ THÔNG]"
                    } else {
                        "[CHƯA RÕ HOẠT CHẤT]"
                    };

                    product_kb.push_str(&format!(
                        "- [ID:{}] Tên: {} | Mã: {} | Hoạt chất: {} | Đơn vị: {} | Giá: {:.}đ | Tồn kho: {} | Hãng: {} | Phân loại: {}\n",
                        p.id, p.name, code, active, unit, price, stock, brand, tag_str
                    ));
                }
            }

            let mut base_prompt = format!(
                r#"Bạn là LyangAI - Chuyên gia Cố vấn Nông nghiệp & Dược học Cây trồng cao cấp (Plant Protection & Agronomy AI Expert) tích hợp trong phần mềm quản lý bán hàng LyangPOS.

★★★ CHIẾN LƯỢC TƯ VẤN PHÂN TẦNG BẮT BUỘC (TUÂN THỦ 100%):
Khi người dùng hỏi về bệnh hại, sâu hại, bọ trĩ, rầy rệp hoặc chăm sóc cây trồng, bạn TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ đưa ra các hoạt chất quen thuộc cũ (như chỉ chăm chăm nói Mancozeb, Difenoconazole, Abamectin...).
BẮT BUỘC bạn phải quét qua TOÀN BỘ DANH SÁCH HOẠT CHẤT TRONG KHO (đặc biệt là NHÓM THẾ HỆ MỚI) và trình bày câu trả lời theo **CHIẾN LƯỢC TƯ VẤN PHÂN TẦNG RÕ RÀNG**:

---
### 🌿 CẤU TRÚC BÀI TƯ VẤN BẮT BUỘC:

1. **CHẨN ĐOÁN & NGUYÊN NHÂN CỐT LÕI (Ngắn gọn)**:
   - Tên bệnh/sâu hại, nguyên nhân (nấm, vi khuẩn, côn trùng chích hút, bọ trĩ kháng thuốc...).

2. **🚀 TẦNG 1: GIẢI PHÁP ĐẶC TRỊ CÔNG NGHỆ MỚI / CHỐNG KHÁNG THUỐC (Ưu tiên số 1 từ kho)**:
   - **Mục tiêu**: Dập dịch cấp tốc, bẻ gãy tính lờn thuốc của sâu/nấm, bảo vệ đọt non/bông/trái an toàn.
   - **Hành động bắt buộc**: Bạn PHẢI rà soát trong danh sách [🌟 NHÓM HOẠT CHẤT THẾ HỆ MỚI / TIÊN TIẾN TRONG KHO] để chọn ra hoạt chất đặc trị mạnh nhất có sẵn trong kho.
     * Ví dụ:
       - Trừ nấm/bệnh phổ mới (SDHI, Carboxamide, CAA...): Pydiflumetofen (Miravis Duo), Fluxapyroxad (Sercadis), Fluopyram (Luna), Oxathiapiprolin (Zorvec), Pyraclostrobin (Cabrio Top), Mandipropamid (Revus), Metiram (Polyram), Boscalid, Cyazofamid...
       - Trừ sâu/bọ trĩ/rầy/nhện phổ mới (Spinosyn, Diamide, Pyrrole, Ketoenol, Pyropene...): Spinetoram (Radiant), Flupyrimin, Sulfoxaflor (Transform), Broflanilide (Incipio), Chlorfenapyr, Cyantraniliprole (Benevia), Chlorantraniliprole (Virtako), Flonicamid (Teppeki), Spirotetramat (Movento), Spirodiclofen (Envidor), Fenpyroximate (Ortus), Lufenuron, Pyriproxyfen...
   - **Phân tích cơ chế vượt trội**: Giải thích vì sao hoạt chất này diệt dứt điểm (tác động vào thụ thể mới lạ, ức chế enzyme tế bào, hiệu lực lưu dẫn kéo dài, tính mát êm cây không làm teo đọt, không rụng hoa, không lem vỏ trái).
   - **Sản phẩm cụ thể trong kho**: Chỉ định rõ Tên sản phẩm, Hoạt chất, Giá bán và Tồn kho từ danh mục kho.
   - **Liều pha cụ thể**: Nêu rõ liều cho bình 16L, 25L hoặc phuy 200L (Ví dụ: 20-25ml/bình 25L hoặc 1 chai/phuy 200L) và thời điểm phun tốt nhất.

3. **🌾 TẦNG 2: GIẢI PHÁP PHỔ THÔNG / TIẾT KIỆM CHI PHÍ (Giải pháp kinh tế & Phòng ngừa từ kho)**:
   - **Mục tiêu**: Tiết kiệm chi phí mùa vụ, phun phòng ngừa định kỳ đón đọt/sau mưa khi áp lực sâu bệnh chưa bùng phát nặng.
   - **Hành động**: Nhặt các sản phẩm chứa hoạt chất kinh điển, giá rẻ hơn có sẵn trong kho (như Mancozeb, Difenoconazole, Azoxystrobin, Hexaconazole, Metalaxyl, Abamectin, Thiamethoxam, Imidacloprid, Validamycin, Carbendazim, Copper Oxychloride...).
   - **Sản phẩm cụ thể trong kho**: Chỉ định rõ Tên sản phẩm, Hoạt chất, Giá bán và Tồn kho từ danh mục kho.
   - **Liều pha cụ thể**: Nêu rõ liều cho bình 16L, 25L hoặc phuy 200L.

4. **🔄 CHIẾN THUẬT PHỐI TRỘN & LUÂN PHIÊN (Bí kíp nhà nghề)**:
   - Hướng dẫn luân phiên cữ phun: Cữ 1 dập dịch bằng Tầng 1 (công nghệ mới), cữ 2 (cách 5-7 ngày) đổi sang Tầng 2 hoặc luân chuyển nhóm gốc thuốc khác để sâu bệnh không kịp thích nghi tạo kháng thể.
   - Nguyên tắc phối trộn an toàn: Thứ tự pha (Bột WP/WG -> Huyền phù SC -> Nhũ dầu EC -> Phân bón lá/Dưỡng), không pha chung với vôi/gốc đồng kiềm mạnh nếu chưa kiểm tra tương thích.

---
### 📦 DỮ LIỆU ĐỐI CHIẾU TRONG KHO CỬA HÀNG:

🌟 **NHÓM HOẠT CHẤT THẾ HỆ MỚI / TIÊN TIẾN TRONG KHO (BẮT BUỘC DÙNG CHO TẦNG 1 NẾU PHÙ HỢP)**:
{}

🌾 **NHÓM HOẠT CHẤT PHỔ THÔNG / KINH ĐIỂN TRONG KHO (DÙNG CHO TẦNG 2)**:
{}

📚 **TOÀN BỘ HOẠT CHẤT CÓ TRONG KHO**:
{}

{}

QUY TẮC BẮT BUỘC VỀ DỮ LIỆU ĐỀ XUẤT (JSON BLOCK):
Ở CUỐI CÙNG CỦA CÂU TRẢ LỜI, nếu câu hỏi về tư vấn thuốc/bệnh, bạn BẮT BUỘC phải đối chiếu và chọn ra từ 2 đến 6 sản phẩm phù hợp nhất đại diện cho CẢ TẦNG 1 VÀ TẦNG 2 có trong kho hàng phía trên để xuất ra khối JSON code block theo đúng mẫu sau:
```recommended_products
[
  {{
    "id": 123,
    "name": "Tên sản phẩm đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm",
    "dosage": "Liều dùng: 20-25ml/bình 25L (hoặc 1 chai/phuy 200L)",
    "tier": "Tầng 1 (Công nghệ mới)",
    "sale_price": 185000,
    "unit": "Chai",
    "stock": 15
  }},
  {{
    "id": 456,
    "name": "Tên sản phẩm đúng theo kho",
    "active_ingredient": "Hoạt chất của sản phẩm",
    "dosage": "Liều dùng: 30ml/bình 25L",
    "tier": "Tầng 2 (Phổ thông)",
    "sale_price": 95000,
    "unit": "Chai",
    "stock": 30
  }}
]
```
Nếu không có sản phẩm phù hợp trong kho hoặc câu hỏi về số liệu/kinh doanh/công nợ/lợi nhuận, xuất:
```recommended_products
[]
```
"#,
                advanced_actives_str,
                common_actives_str,
                store_actives_str,
                product_kb
            );

            if is_analytics_question {
                let analytics_context = build_app_analytics_context(&pool, Some(&payload.message)).await;
                base_prompt = format!(
                    "★★★ LƯU Ý ĐẶC BIỆT QUAN TRỌNG: Người dùng đang hỏi về số liệu kinh doanh, công nợ, lợi nhuận hoặc doanh số. BẮT BUỘC trả lời chính xác bằng các con số thực tế trong hệ thống dưới đây trước tiên:\n{}\n\n{}",
                    analytics_context,
                    base_prompt
                );
            }

            base_prompt
        }
    };

    // 5. Xây dựng nội dung gửi tới Gemini API
    let mut contents: Vec<serde_json::Value> = Vec::new();

    // Lịch sử chat (nếu có)
    if let Some(history) = payload.history {
        for msg in history {
            let role = if msg.role == "user" { "user" } else { "model" };
            contents.push(json!({
                "role": role,
                "parts": [
                    { "text": msg.text }
                ]
            }));
        }
    }

    // Lượt chat hiện tại của User
    let mut current_user_parts: Vec<serde_json::Value> = Vec::new();
    current_user_parts.push(json!({
        "text": payload.message
    }));

    // Thêm hình ảnh nếu có
    if let Some(images) = payload.images {
        for img_val in images {
            if !img_val.is_empty() {
                let (mime_type, base64_data) = if let Some(idx) = img_val.find(";base64,") {
                    let mime = img_val[5..idx].to_string();
                    let b64 = &img_val[idx + 8..];
                    (mime, b64)
                } else {
                    ("image/jpeg".to_string(), img_val.as_str())
                };

                current_user_parts.push(json!({
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_data
                    }
                }));
            }
        }
    }

    contents.push(json!({
        "role": "user",
        "parts": current_user_parts
    }));

    let request_body = json!({
        "systemInstruction": {
            "parts": [
                { "text": system_instruction }
            ]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": if mode == "app_analytics" { 0.2 } else if mode == "general_assistant" { 0.6 } else { 0.4 },
            "maxOutputTokens": 65536,
        }
    });

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(18))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    let models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
    ];
    let mut reply_text = String::new();
    let mut error_msg = String::new();

    // Vòng lặp xoay vòng fallback qua từng API Key và từng Model
    'key_loop: for (k_idx, key) in api_keys.iter().enumerate() {
        for model in models {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                model, key
            );

            let res = client
                .post(&url)
                .header("Content-Type", "application/json")
                .json(&request_body)
                .send()
                .await;

            match res {
                Ok(resp) => {
                    if resp.status().is_success() {
                        if let Ok(gemini_res) = resp.json::<serde_json::Value>().await {
                            if let Some(text) = gemini_res
                                .get("candidates")
                                .and_then(|c| c.get(0))
                                .and_then(|c0| c0.get("content"))
                                .and_then(|cnt| cnt.get("parts"))
                                .and_then(|p| p.get(0))
                                .and_then(|p0| p0.get("text"))
                                .and_then(|t| t.as_str())
                            {
                                reply_text = text.trim().to_string();
                                break 'key_loop;
                            }
                        }
                    } else {
                        let status = resp.status();
                        let err_text = resp.text().await.unwrap_or_default();
                        error_msg = format!("Key #{}: Model {} lỗi (status {}): {}", k_idx + 1, model, status, err_text);
                        tracing::warn!("{}", error_msg);
                    }
                }
                Err(e) => {
                    error_msg = format!("Key #{}: Lỗi kết nối Gemini API ({})", k_idx + 1, e);
                    tracing::warn!("{}", error_msg);
                }
            }
        }
    }

    if reply_text.is_empty() {
        return Ok(Json(json!({
            "error": "gemini_api_failed",
            "reply": format!("❌ Không thể kết nối hoặc nhận phản hồi từ Gemini API (đã thử {} key). Chi tiết: {}", api_keys.len(), error_msg),
            "recommended_products": []
        })));
    }

    // 6. Bóc tách khối recommended_products JSON nếu có
    let mut recommended_products: Vec<serde_json::Value> = Vec::new();
    let mut clean_reply = reply_text.clone();

    if let Some(start_tag) = reply_text.find("```recommended_products") {
        let after_start = &reply_text[start_tag + 23..];
        if let Some(end_tag) = after_start.find("```") {
            let json_str = after_start[..end_tag].trim();
            if let Ok(parsed) = serde_json::from_str::<Vec<serde_json::Value>>(json_str) {
                recommended_products = parsed;
            }
            // Xóa khối code khỏi nội dung chat hiển thị cho đẹp
            let full_block_end = start_tag + 23 + end_tag + 3;
            let mut stripped = reply_text[..start_tag].trim_end().to_string();
            if full_block_end < reply_text.len() {
                stripped.push_str(&reply_text[full_block_end..]);
            }
            clean_reply = stripped;
        }
    } else if let Some(start_tag) = reply_text.find("```json") {
        let after_start = &reply_text[start_tag + 7..];
        if let Some(end_tag) = after_start.find("```") {
            let json_str = after_start[..end_tag].trim();
            if let Ok(parsed) = serde_json::from_str::<Vec<serde_json::Value>>(json_str) {
                if !parsed.is_empty() && parsed[0].get("id").is_some() {
                    recommended_products = parsed;
                    let full_block_end = start_tag + 7 + end_tag + 3;
                    let mut stripped = reply_text[..start_tag].trim_end().to_string();
                    if full_block_end < reply_text.len() {
                        stripped.push_str(&reply_text[full_block_end..]);
                    }
                    clean_reply = stripped;
                }
            }
        }
    }

    // Fallback tự động nếu AI nhắc tới tên sản phẩm có trong kho
    if recommended_products.is_empty() && !products.is_empty() {
        let reply_lower = clean_reply.to_lowercase();
        for p in &products {
            if p.name.len() >= 4 && reply_lower.contains(&p.name.to_lowercase()) {
                recommended_products.push(json!({
                    "id": p.id,
                    "name": p.name,
                    "active_ingredient": p.active_ingredient.as_deref().unwrap_or(""),
                    "dosage": "Theo hướng dẫn bao bì / liều khuyến nghị trên",
                    "sale_price": p.sale_price.unwrap_or(0.0),
                    "unit": p.unit.as_deref().unwrap_or(""),
                    "stock": p.stock.unwrap_or(0.0)
                }));
                if recommended_products.len() >= 4 {
                    break;
                }
            }
        }
    }

    Ok(Json(json!({
        "reply": clean_reply,
        "recommended_products": recommended_products
    })))
}
