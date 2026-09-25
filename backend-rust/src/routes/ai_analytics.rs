use chrono::{Datelike, Duration, Local, NaiveDate};
use sqlx::{Row, SqlitePool};

async fn get_day_sales_and_profit(pool: &SqlitePool, d_str: &str) -> (i64, f64, f64, f64) {
    let sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND date(date) = date(?) AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(d_str)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND date(o.date) = date(?) AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(d_str)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    (sales.0, sales.1.unwrap_or(0.0), sales.2.unwrap_or(0.0), profit)
}

async fn get_month_sales_and_profit(pool: &SqlitePool, m_str: &str) -> (i64, f64, f64, f64) {
    let sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND strftime('%Y-%m', date) = ? AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(m_str)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND strftime('%Y-%m', o.date) = ? AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(m_str)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    (sales.0, sales.1.unwrap_or(0.0), sales.2.unwrap_or(0.0), profit)
}

async fn get_range_sales_and_profit(
    pool: &SqlitePool,
    start_d: &str,
    end_d: &str,
) -> (i64, f64, f64, f64, i64, f64) {
    let sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND date(date) >= date(?) AND date(date) <= date(?) AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(start_d)
    .bind(end_d)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND date(o.date) >= date(?) AND date(o.date) <= date(?) AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(start_d)
    .bind(end_d)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    let purchase: (i64, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL) \
         FROM \"order\" WHERE type = 'Purchase' AND date(date) >= date(?) AND date(date) <= date(?) AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(start_d)
    .bind(end_d)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0)));

    (
        sales.0,
        sales.1.unwrap_or(0.0),
        sales.2.unwrap_or(0.0),
        profit,
        purchase.0,
        purchase.1.unwrap_or(0.0),
    )
}

#[derive(Debug, Clone, PartialEq)]
pub struct DetectedPeriod {
    pub label: String,
    pub start_d: String,
    pub end_d: String,
    pub is_quarter_or_year: bool,
}

pub fn detect_query_period(q_norm: &str, today: &NaiveDate) -> Option<DetectedPeriod> {
    // 1. Detect year mentioned in query (e.g. 2022..2028)
    let mut target_year = today.year();
    let years = [2022, 2023, 2024, 2025, 2026, 2027, 2028];
    for y in years {
        if q_norm.contains(&y.to_string()) {
            target_year = y;
            break;
        }
    }
    let is_last_year_mentioned = q_norm.contains("nam ngoai")
        || q_norm.contains("nam truoc")
        || q_norm.contains("nam vua qua")
        || q_norm.contains("nam roi");
    if is_last_year_mentioned {
        target_year = today.year() - 1;
    }

    // 2. Detect Quarter (Quý 1..4, Quý I..IV, Q1..Q4, Quý này, Quý trước)
    let is_q1 = q_norm.contains("quy 1") || q_norm.contains("quy i ") || q_norm.ends_with("quy i") || q_norm.contains("q1");
    let is_q2 = q_norm.contains("quy 2") || q_norm.contains("quy ii ") || q_norm.ends_with("quy ii") || q_norm.contains("q2");
    let is_q3 = q_norm.contains("quy 3") || q_norm.contains("quy iii ") || q_norm.ends_with("quy iii") || q_norm.contains("q3");
    let is_q4 = q_norm.contains("quy 4") || q_norm.contains("quy iv ") || q_norm.ends_with("quy iv") || q_norm.contains("q4");

    let is_this_quarter = q_norm.contains("quy nay") || q_norm.contains("quy hien tai");
    let is_last_quarter = q_norm.contains("quy truoc") || q_norm.contains("quy vua qua") || q_norm.contains("quy vua roi") || q_norm.contains("quy roi");

    let curr_q = (today.month() - 1) / 3 + 1;

    let target_quarter = if is_q1 {
        Some(1)
    } else if is_q2 {
        Some(2)
    } else if is_q3 {
        Some(3)
    } else if is_q4 {
        Some(4)
    } else if is_this_quarter {
        Some(curr_q)
    } else if is_last_quarter {
        if curr_q == 1 {
            target_year = today.year() - 1;
            Some(4)
        } else {
            Some(curr_q - 1)
        }
    } else {
        None
    };

    if let Some(q) = target_quarter {
        let (s_month, e_month, e_day) = match q {
            1 => ("01", "03", "31"),
            2 => ("04", "06", "30"),
            3 => ("07", "09", "30"),
            _ => ("10", "12", "31"),
        };
        return Some(DetectedPeriod {
            label: format!("Quý {} năm {}", q, target_year),
            start_d: format!("{}-{}-01", target_year, s_month),
            end_d: format!("{}-{}-{}", target_year, e_month, e_day),
            is_quarter_or_year: true,
        });
    }

    // 3. Detect Full Year (Cả năm, năm nay, năm ngoái, năm 2024/2025/2026...)
    let is_year_query = q_norm.contains("nam nay")
        || is_last_year_mentioned
        || years.iter().any(|y| q_norm.contains(&format!("nam {}", y)) || q_norm.contains(&y.to_string()))
        || (q_norm.contains("ca nam") || q_norm.contains("trong nam"));

    if is_year_query && !q_norm.contains("thang") && !q_norm.contains("tuan") && !q_norm.contains("ngay") {
        return Some(DetectedPeriod {
            label: format!("Cả năm {}", target_year),
            start_d: format!("{}-01-01", target_year),
            end_d: format!("{}-12-31", target_year),
            is_quarter_or_year: true,
        });
    }

    // 4. Detect Specific Month
    for m in 1..=12 {
        let m_patterns = [
            format!("thang {}", m),
            format!("thang {:02}", m),
            format!("t{}/", m),
            format!("thang {}/", m),
        ];
        if m_patterns.iter().any(|pat| q_norm.contains(pat)) {
            let last_day = match m {
                1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
                4 | 6 | 9 | 11 => 30,
                2 => if (target_year % 4 == 0 && target_year % 100 != 0) || target_year % 400 == 0 { 29 } else { 28 },
                _ => 30,
            };
            return Some(DetectedPeriod {
                label: format!("Tháng {} năm {}", m, target_year),
                start_d: format!("{}-{:02}-01", target_year, m),
                end_d: format!("{}-{:02}-{:02}", target_year, m, last_day),
                is_quarter_or_year: false,
            });
        }
    }

    // 5. Relative Dates (Hôm qua, Hôm nay, Tuần này, Tuần trước, Tháng này, Tháng trước)
    if q_norm.contains("hom qua") {
        let yest = *today - Duration::days(1);
        let y_str = yest.format("%Y-%m-%d").to_string();
        return Some(DetectedPeriod {
            label: "Hôm qua".to_string(),
            start_d: y_str.clone(),
            end_d: y_str,
            is_quarter_or_year: false,
        });
    }

    if q_norm.contains("hom nay") {
        let t_str = today.format("%Y-%m-%d").to_string();
        return Some(DetectedPeriod {
            label: "Hôm nay".to_string(),
            start_d: t_str.clone(),
            end_d: t_str,
            is_quarter_or_year: false,
        });
    }

    let weekday_offset = today.weekday().num_days_from_monday() as i64;
    let this_week_start = *today - Duration::days(weekday_offset);
    if q_norm.contains("tuan nay") {
        return Some(DetectedPeriod {
            label: "Tuần này".to_string(),
            start_d: this_week_start.format("%Y-%m-%d").to_string(),
            end_d: today.format("%Y-%m-%d").to_string(),
            is_quarter_or_year: false,
        });
    }

    if q_norm.contains("tuan truoc") {
        let last_week_start = this_week_start - Duration::days(7);
        let last_week_end = this_week_start - Duration::days(1);
        return Some(DetectedPeriod {
            label: "Tuần trước".to_string(),
            start_d: last_week_start.format("%Y-%m-%d").to_string(),
            end_d: last_week_end.format("%Y-%m-%d").to_string(),
            is_quarter_or_year: false,
        });
    }

    if q_norm.contains("thang truoc") {
        let (last_m_yr, last_m_mo) = if today.month() == 1 {
            (today.year() - 1, 12)
        } else {
            (today.year(), today.month() - 1)
        };
        let last_day = match last_m_mo {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 => if (last_m_yr % 4 == 0 && last_m_yr % 100 != 0) || last_m_yr % 400 == 0 { 29 } else { 28 },
            _ => 30,
        };
        return Some(DetectedPeriod {
            label: "Tháng trước".to_string(),
            start_d: format!("{:04}-{:02}-01", last_m_yr, last_m_mo),
            end_d: format!("{:04}-{:02}-{:02}", last_m_yr, last_m_mo, last_day),
            is_quarter_or_year: false,
        });
    }

    if q_norm.contains("thang nay") {
        let last_day = match today.month() {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 => if (today.year() % 4 == 0 && today.year() % 100 != 0) || today.year() % 400 == 0 { 29 } else { 28 },
            _ => 30,
        };
        return Some(DetectedPeriod {
            label: "Tháng này".to_string(),
            start_d: format!("{:04}-{:02}-01", today.year(), today.month()),
            end_d: format!("{:04}-{:02}-{:02}", today.year(), today.month(), last_day),
            is_quarter_or_year: false,
        });
    }

    None
}

fn extract_significant_keywords(q_norm: &str) -> Vec<String> {
    let stopwords = [
        "anh", "chi", "em", "chu", "bac", "co", "ong", "ba", "khach", "hang", "doi", "tac",
        "con", "chau", "nha", "cung", "cap", "ncc", "hai", "chieu",
        "mua", "ban", "no", "cong", "tien", "bao", "nhieu", "may", "don", "san", "pham",
        "thuoc", "phan", "ton", "kho", "gia", "von", "lai", "loi", "nhap", "xuat",
        "kiem", "tra", "tim", "xem", "cho", "hoi", "cua", "trong", "ngay", "thang", "nam", "quy", "q1", "q2", "q3", "q4",
        "hom", "nay", "qua", "tat", "ca", "cac", "la", "gi", "ai", "sao", "nao", "co", "hay",
        "khong", "duoc", "nhung", "mot", "va", "voi", "ve", "tinh", "hinh", "giup",
        "toi", "minh", "nay", "kia", "do", "nhu", "the", "doanh", "thu", "chi", "nhuan",
        "so", "lieu", "bao", "cao", "thong", "ke", "ra", "roi", "chua", "ha", "nhi", "a",
        "da", "oi", "eii", "ad", "admin", "chat", "bot", "ai",
        "chai", "goi", "can", "bao", "thung", "lit", "gam", "kg", "ml", "lo", "vien", "hop",
        "cuon", "cay", "met", "chiec", "tam", "binh", "phuy"
    ];
    let words: Vec<&str> = q_norm.split_whitespace().collect();
    let mut significant = Vec::new();
    for w in words {
        let clean: String = w.chars().filter(|c| c.is_alphanumeric()).collect();
        if clean.len() >= 2 && !stopwords.contains(&clean.as_str()) {
            significant.push(clean);
        }
    }
    significant
}

pub async fn build_app_analytics_context(pool: &SqlitePool, user_query: Option<&str>) -> String {
    let mut ctx = String::from("=== HỆ THỐNG SỐ LIỆU TÀI CHÍNH & VẬN HÀNH THỜI GIAN THỰC LYANGPOS ===\n\n");

    let now = chrono::Local::now();
    let today = now.date_naive();
    let today_str = today.format("%Y-%m-%d").to_string();
    let yesterday = today - Duration::days(1);
    let yesterday_str = yesterday.format("%Y-%m-%d").to_string();

    let month_prefix = today.format("%Y-%m").to_string();
    let this_year_prefix = today.format("%Y").to_string();

    let (last_m_yr, last_m_mo) = if today.month() == 1 {
        (today.year() - 1, 12)
    } else {
        (today.year(), today.month() - 1)
    };
    let last_month_prefix = format!("{:04}-{:02}", last_m_yr, last_m_mo);

    let weekday_offset = today.weekday().num_days_from_monday() as i64;
    let this_week_start = today - Duration::days(weekday_offset);
    let this_week_str = this_week_start.format("%Y-%m-%d").to_string();
    let tomorrow_str = (today + Duration::days(1)).format("%Y-%m-%d").to_string();

    let last_week_start = this_week_start - Duration::days(7);
    let last_week_start_str = last_week_start.format("%Y-%m-%d").to_string();

    // 1. TÀI CHÍNH ĐA CHU KỲ (Hôm nay, Hôm qua, Tuần này, Tuần trước, Tháng này, Tháng trước, Năm nay, Toàn thời gian)
    let today_stats = get_day_sales_and_profit(pool, &today_str).await;
    let yest_stats = get_day_sales_and_profit(pool, &yesterday_str).await;
    let month_stats = get_month_sales_and_profit(pool, &month_prefix).await;
    let last_month_stats = get_month_sales_and_profit(pool, &last_month_prefix).await;

    // Tuần này
    let this_week_sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND date(date) >= date(?) AND date(date) < date(?) AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&this_week_str)
    .bind(&tomorrow_str)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let this_week_profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND date(o.date) >= date(?) AND date(o.date) < date(?) AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&this_week_str)
    .bind(&tomorrow_str)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    // Tuần trước
    let last_week_sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND date(date) >= date(?) AND date(date) < date(?) AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&last_week_start_str)
    .bind(&this_week_str)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let last_week_profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND date(o.date) >= date(?) AND date(o.date) < date(?) AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&last_week_start_str)
    .bind(&this_week_str)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    // Năm nay
    let year_sales: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) \
         FROM \"order\" WHERE type = 'Sale' AND strftime('%Y', date) = ? AND display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&this_year_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or((0, Some(0.0), Some(0.0)));

    let year_profit: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND strftime('%Y', o.date) = ? AND o.display_id NOT IN ('NODAU', '#NODAU')"
    )
    .bind(&this_year_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    // Toàn thời gian
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
    let all_time_paid = all_time_sales.2.unwrap_or(0.0);
    let all_time_margin = if all_time_rev > 0.0 { (all_time_profit / all_time_rev) * 100.0 } else { 0.0 };
    let aov = if all_time_sales.0 > 0 { all_time_rev / (all_time_sales.0 as f64) } else { 0.0 };

    let today_margin = if today_stats.1 > 0.0 { (today_stats.3 / today_stats.1) * 100.0 } else { 0.0 };
    let yest_margin = if yest_stats.1 > 0.0 { (yest_stats.3 / yest_stats.1) * 100.0 } else { 0.0 };
    let month_margin = if month_stats.1 > 0.0 { (month_stats.3 / month_stats.1) * 100.0 } else { 0.0 };
    let last_month_margin = if last_month_stats.1 > 0.0 { (last_month_stats.3 / last_month_stats.1) * 100.0 } else { 0.0 };
    let year_rev = year_sales.1.unwrap_or(0.0);
    let year_margin = if year_rev > 0.0 { (year_profit / year_rev) * 100.0 } else { 0.0 };

    let mom_rev_growth = if last_month_stats.1 > 0.0 {
        ((month_stats.1 - last_month_stats.1) / last_month_stats.1) * 100.0
    } else {
        0.0
    };

    // Ngày bán hàng gần nhất có đơn trong cơ sở dữ liệu
    let last_active_day: Option<String> = sqlx::query_scalar(
        "SELECT date(date) FROM \"order\" WHERE type = 'Sale' AND display_id NOT IN ('NODAU', '#NODAU') ORDER BY date DESC LIMIT 1"
    )
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    let mut last_active_day_str = String::new();
    if let Some(ref lad) = last_active_day {
        if lad != &today_str {
            let lad_stats = get_day_sales_and_profit(pool, lad).await;
            let lad_margin = if lad_stats.1 > 0.0 { (lad_stats.3 / lad_stats.1) * 100.0 } else { 0.0 };
            last_active_day_str = format!(
                "  * NGÀY BÁN HÀNG GẦN NHẤT CÓ ĐƠN ({}): {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ (Tỷ suất: {:.1}%) | Thực thu: {:.}đ | Nợ mới: {:.}đ\n",
                lad, lad_stats.0, lad_stats.1, lad_stats.3, lad_margin, lad_stats.2, lad_stats.1 - lad_stats.2
            );
        }
    }

    ctx.push_str(&format!(
        "1. TỔNG QUAN TÀI CHÍNH & HIỆU QUẢ KINH DOANH ĐA CHU KỲ:\n\
         - Hôm nay ({}): {} đơn hàng | Doanh thu: {:.}đ | Lợi nhuận gộp: {:.}đ ({:.1}%) | Thực thu tiền: {:.}đ | Nợ phát sinh: {:.}đ\n\
         {}\
         - Hôm qua ({}): {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ ({:.1}%) | Thực thu: {:.}đ\n\
         - Tuần này (Từ {}): {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ | Thực thu: {:.}đ\n\
         - Tuần trước: {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ | Thực thu: {:.}đ\n\
         - Tháng này ({}): {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ (Biên lãi: {:.1}%) | Thực thu: {:.}đ | Nợ: {:.}đ (Tăng trưởng so tháng trước: {:.1}%)\n\
         - Tháng trước ({}): {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ (Biên lãi: {:.1}%) | Thực thu: {:.}đ | Nợ: {:.}đ\n\
         - Năm nay ({}): {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ ({:.1}%) | Thực thu: {:.}đ\n\
         - TOÀN THỜI GIAN (LỊCH SỬ TỔNG HỢP): {} đơn bán hàng | TỔNG DOANH THU: {:.}đ | TỔNG LỢI NHUẬN GỘP: {:.}đ (Biên lãi: {:.1}%) | Đã thu: {:.}đ | Giá trị TB/đơn (AOV): {:.}đ\n\n",
        today_str, today_stats.0, today_stats.1, today_stats.3, today_margin, today_stats.2, today_stats.1 - today_stats.2,
        last_active_day_str,
        yesterday_str, yest_stats.0, yest_stats.1, yest_stats.3, yest_margin, yest_stats.2,
        this_week_str, this_week_sales.0, this_week_sales.1.unwrap_or(0.0), this_week_profit, this_week_sales.2.unwrap_or(0.0),
        last_week_sales.0, last_week_sales.1.unwrap_or(0.0), last_week_profit, last_week_sales.2.unwrap_or(0.0),
        month_prefix, month_stats.0, month_stats.1, month_stats.3, month_margin, month_stats.2, month_stats.1 - month_stats.2, mom_rev_growth,
        last_month_prefix, last_month_stats.0, last_month_stats.1, last_month_stats.3, last_month_margin, last_month_stats.2, last_month_stats.1 - last_month_stats.2,
        this_year_prefix, year_sales.0, year_rev, year_profit, year_margin, year_sales.2.unwrap_or(0.0),
        all_time_sales.0, all_time_rev, all_time_profit, all_time_margin, all_time_paid, aov
    ));

    // Bổ sung các quý trong năm hiện tại
    let mut quarters_str = String::new();
    for q in 1..=4 {
        let (s_month, e_month, e_day) = match q {
            1 => ("01", "03", "31"),
            2 => ("04", "06", "30"),
            3 => ("07", "09", "30"),
            _ => ("10", "12", "31"),
        };
        let q_start = format!("{}-{}-01", this_year_prefix, s_month);
        let q_end = format!("{}-{}-{}", this_year_prefix, e_month, e_day);
        let q_stat = get_range_sales_and_profit(pool, &q_start, &q_end).await;
        if q_stat.0 > 0 || q_stat.4 > 0 {
            let q_margin = if q_stat.1 > 0.0 { (q_stat.3 / q_stat.1) * 100.0 } else { 0.0 };
            quarters_str.push_str(&format!(
                "  * Quý {}/{}: {} đơn bán | Doanh số: {:.}đ | Lãi gộp: {:.}đ ({:.1}%) | Thực thu: {:.}đ | Nhập hàng: {:.}đ ({} đơn nhập)\n",
                q, this_year_prefix, q_stat.0, q_stat.1, q_stat.3, q_margin, q_stat.2, q_stat.5, q_stat.4
            ));
        }
    }

    // Bổ sung tổng kết từng năm trong lịch sử
    let mut years_summary_str = String::new();
    if let Ok(years_rows) = sqlx::query(
        "SELECT strftime('%Y', o.date) as yr, \
                COUNT(DISTINCT CASE WHEN o.type = 'Sale' THEN o.id END) as sale_cnt, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN o.total_amount ELSE 0 END), 0) AS REAL) as rev, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN o.amount_paid ELSE 0 END), 0) AS REAL) as paid, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0)) ELSE 0 END), 0) AS REAL) as profit, \
                COUNT(DISTINCT CASE WHEN o.type = 'Purchase' THEN o.id END) as pur_cnt, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Purchase' THEN o.total_amount ELSE 0 END), 0) AS REAL) as pur_tot \
         FROM \"order\" o \
         LEFT JOIN order_detail od ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.display_id NOT IN ('NODAU', '#NODAU') AND o.date IS NOT NULL \
         GROUP BY yr ORDER BY yr DESC"
    ).fetch_all(pool).await {
        for r in years_rows {
            let yr: String = r.try_get("yr").unwrap_or_default();
            if yr.is_empty() { continue; }
            let s_cnt: i64 = r.try_get("sale_cnt").unwrap_or(0);
            let s_rev: f64 = r.try_get("rev").unwrap_or(0.0);
            let s_paid: f64 = r.try_get("paid").unwrap_or(0.0);
            let s_profit: f64 = r.try_get("profit").unwrap_or(0.0);
            let p_cnt: i64 = r.try_get("pur_cnt").unwrap_or(0);
            let p_tot: f64 = r.try_get("pur_tot").unwrap_or(0.0);
            let y_margin = if s_rev > 0.0 { (s_profit / s_rev) * 100.0 } else { 0.0 };
            years_summary_str.push_str(&format!(
                "  * Năm {}: {} đơn bán | Doanh số: {:.}đ | Lãi gộp: {:.}đ ({:.1}%) | Thực thu: {:.}đ | Tiền nhập hàng: {:.}đ ({} đơn nhập)\n",
                yr, s_cnt, s_rev, s_profit, y_margin, s_paid, p_tot, p_cnt
            ));
        }
    }

    if !quarters_str.is_empty() {
        ctx.push_str(&format!("- HIỆU SUẤT THEO QUÝ NĂM {}:\n{}", this_year_prefix, quarters_str));
    }
    if !years_summary_str.is_empty() {
        ctx.push_str(&format!("- TỔNG KẾT KINH DOANH TỪNG NĂM TRONG LỊCH SỬ:\n{}\n", years_summary_str));
    }

    // 2. KHO HÀNG & ĐỊNH GIÁ VỐN LƯU ĐỘNG (INVENTORY VALUATION & HEALTH)
    let inv_stats: (i64, i64, f64, f64, f64) = sqlx::query_as(
        "SELECT COUNT(*) as total_prods, \
                CAST(COALESCE(SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END), 0) AS INTEGER) as out_of_stock, \
                CAST(COALESCE(SUM(CASE WHEN stock > 0 THEN stock ELSE 0 END), 0) AS REAL) as total_stock_units, \
                CAST(COALESCE(SUM(CASE WHEN stock > 0 THEN stock * COALESCE(cost_price, 0) ELSE 0 END), 0) AS REAL) as total_cost_val, \
                CAST(COALESCE(SUM(CASE WHEN stock > 0 THEN stock * COALESCE(sale_price, 0) ELSE 0 END), 0) AS REAL) as total_retail_val \
         FROM product WHERE is_active = 1"
    )
    .fetch_one(pool)
    .await
    .unwrap_or((0, 0, 0.0, 0.0, 0.0));

    let total_cost_val = inv_stats.3;
    let total_retail_val = inv_stats.4;
    let potential_profit = total_retail_val - total_cost_val;
    let potential_margin = if total_retail_val > 0.0 { (potential_profit / total_retail_val) * 100.0 } else { 0.0 };

    ctx.push_str(&format!(
        "2. ĐỊNH GIÁ KHO HÀNG & VỐN LƯU ĐỘNG HIỆN TẠI:\n\
         - Tổng số mặt hàng đang kinh doanh: {} mã | Hết tồn kho (≤ 0): {} mã\n\
         - Tổng số lượng sản phẩm đang có trong kho: {:.0} đơn vị\n\
         - TỔNG VỐN LƯU ĐỘNG ĐANG NẰM TRONG KHO (THEO GIÁ VỐN): {:.}đ\n\
         - TỔNG GIÁ TRỊ BÁN ƯỚC TÍNH CỦA KHO HÀNG (THEO GIÁ BÁN): {:.}đ\n\
         - LỢI NHUẬN TIỀM NĂNG TRONG KHO: {:.}đ (Biên lãi dự kiến: {:.1}%)\n\n",
        inv_stats.0, inv_stats.1, inv_stats.2, total_cost_val, total_retail_val, potential_profit, potential_margin
    ));

    // Top 10 mặt hàng đọng vốn nhiều nhất (Giam vốn kho cao nhất)
    if let Ok(top_capital) = sqlx::query(
        "SELECT name, unit, stock, cost_price, sale_price, CAST(stock * cost_price AS REAL) as cap_val \
         FROM product \
         WHERE is_active = 1 AND stock > 0 AND cost_price > 0 \
         ORDER BY cap_val DESC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !top_capital.is_empty() {
            ctx.push_str("TOP 10 MẶT HÀNG ĐANG GIAM VỐN LỚN NHẤT TRONG KHO (VỐN TỒN CAO NHẤT):\n");
            for (idx, r) in top_capital.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                let stock: f64 = r.try_get("stock").unwrap_or(0.0);
                let cost: f64 = r.try_get("cost_price").unwrap_or(0.0);
                let cap: f64 = r.try_get("cap_val").unwrap_or(0.0);
                ctx.push_str(&format!("  {}. {}: Vốn đọng {:.}đ (Tồn: {} {} x Giá vốn: {:.}đ)\n", idx + 1, name, cap, stock, unit, cost));
            }
            ctx.push('\n');
        }
    }

    // Top 10 mặt hàng bán chậm / tồn kho đọng lâu (Tồn nhiều nhưng 60 ngày qua bán ít)
    if let Ok(slow_moving) = sqlx::query(
        "SELECT p.name, p.unit, p.stock, p.cost_price, CAST(p.stock * p.cost_price AS REAL) as cap_val, \
                CAST(COALESCE(SUM(od.quantity), 0) AS REAL) as recent_sold \
         FROM product p \
         LEFT JOIN order_detail od ON od.product_id = p.id \
         LEFT JOIN \"order\" o ON od.order_id = o.id AND o.type = 'Sale' AND date(o.date) >= date('now', '-60 days') \
         WHERE p.is_active = 1 AND p.stock >= 5 AND p.cost_price > 0 \
         GROUP BY p.id \
         HAVING recent_sold < 3 \
         ORDER BY cap_val DESC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !slow_moving.is_empty() {
            ctx.push_str("CẢNH BÁO: TOP MẶT HÀNG BÁN CHẬM / Ế ẨM ĐỌNG VỐN (60 NGÀY QUA BÁN < 3 ĐƠN VỊ):\n");
            for (idx, r) in slow_moving.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                let stock: f64 = r.try_get("stock").unwrap_or(0.0);
                let cap: f64 = r.try_get("cap_val").unwrap_or(0.0);
                let sold: f64 = r.try_get("recent_sold").unwrap_or(0.0);
                ctx.push_str(&format!("  * {}. {}: Đọng vốn {:.}đ | Tồn {} {} | 60 ngày qua chỉ bán: {} {}\n", idx + 1, name, cap, stock, unit, sold, unit));
            }
            ctx.push('\n');
        }
    }

    // Hàng sắp hết kho & Hàng cận hạn sử dụng
    if let Ok(low_stocks) = sqlx::query(
        "SELECT name, stock, min_stock, unit FROM product \
         WHERE is_active = 1 AND min_stock > 0 AND stock <= min_stock \
         ORDER BY stock ASC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !low_stocks.is_empty() {
            ctx.push_str("MẶT HÀNG CẢNH BÁO SẮP HẾT (TỒN KHO ≤ MỨC TỐI THIỂU CẦN NHẬP THÊM):\n");
            for r in low_stocks {
                let name: String = r.try_get("name").unwrap_or_default();
                let stock: f64 = r.try_get("stock").unwrap_or(0.0);
                let min_s: f64 = r.try_get("min_stock").unwrap_or(0.0);
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                ctx.push_str(&format!("  * {}: Còn tồn {} {} (Mức báo động: {})\n", name, stock, unit, min_s));
            }
            ctx.push('\n');
        }
    }

    if let Ok(exp_rows) = sqlx::query(
        "SELECT name, expiry_date, stock, unit FROM product \
         WHERE is_active = 1 AND expiry_date IS NOT NULL AND expiry_date != '' \
         ORDER BY expiry_date ASC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !exp_rows.is_empty() {
            ctx.push_str("MẶT HÀNG CẬN DATE / QUÁ HẠN SỬ DỤNG GẦN NHẤT:\n");
            for r in exp_rows {
                let name: String = r.try_get("name").unwrap_or_default();
                let exp: String = r.try_get("expiry_date").unwrap_or_default();
                let stock: f64 = r.try_get("stock").unwrap_or(0.0);
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                ctx.push_str(&format!("  * {}: Hạn dùng {} | Tồn kho: {} {}\n", name, exp, stock, unit));
            }
            ctx.push('\n');
        }
    }

    // 3. TOP SẢN PHẨM HIỆU SUẤT CAO NHẤT (Lợi nhuận cao nhất & Bán chạy nhất)
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
            ctx.push_str("3. TOP 15 SẢN PHẨM MANG LẠI LỢI NHUẬN GỘP CAO NHẤT (TOÀN THỜI GIAN):\n");
            for (idx, r) in top_profits.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_else(|_| "Sản phẩm".to_string());
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                let qty: f64 = r.try_get("total_qty").unwrap_or(0.0);
                let rev: f64 = r.try_get("total_rev").unwrap_or(0.0);
                let profit: f64 = r.try_get("total_profit").unwrap_or(0.0);
                let margin = if rev > 0.0 { (profit / rev) * 100.0 } else { 0.0 };
                ctx.push_str(&format!(
                    "  {}. {}: Lợi nhuận: {:.}đ (Biên lãi: {:.1}%) | Đã bán: {} {} | Doanh số: {:.}đ\n",
                    idx + 1, name, profit, margin, qty, unit, rev
                ));
            }
            ctx.push('\n');
        }
    }

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
            ctx.push_str("TOP 10 SẢN PHẨM BÁN ĐƯỢC NHIỀU SỐ LƯỢNG NHẤT (BÁN CHẠY NHẤT LỊCH SỬ):\n");
            for (idx, r) in top_sellers.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_else(|_| "Sản phẩm".to_string());
                let unit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                let qty: f64 = r.try_get("total_qty").unwrap_or(0.0);
                let rev: f64 = r.try_get("total_rev").unwrap_or(0.0);
                let profit: f64 = r.try_get("total_profit").unwrap_or(0.0);
                ctx.push_str(&format!("  {}. {}: Đã bán {} {} | Doanh thu: {:.}đ | Lợi nhuận: {:.}đ\n", idx + 1, name, qty, unit, rev, profit));
            }
            ctx.push('\n');
        }
    }

    // Doanh thu theo Danh mục sản phẩm (Category Breakdown)
    if let Ok(cat_stats) = sqlx::query(
        "SELECT COALESCE(c.name, 'Chưa phân loại') as cat_name, \
                CAST(COALESCE(SUM(od.quantity * od.price), 0) AS REAL) as cat_rev, \
                CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) as cat_profit \
         FROM order_detail od \
         JOIN \"order\" o ON od.order_id = o.id AND o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         LEFT JOIN product p ON od.product_id = p.id \
         LEFT JOIN category c ON p.category_id = c.id \
         GROUP BY c.id \
         ORDER BY cat_rev DESC LIMIT 8"
    )
    .fetch_all(pool)
    .await {
        if !cat_stats.is_empty() {
            ctx.push_str("CƠ CẤU DOANH THU & LỢI NHUẬN THEO NGÀNH HÀNG / DANH MỤC:\n");
            for (idx, r) in cat_stats.into_iter().enumerate() {
                let cat: String = r.try_get("cat_name").unwrap_or_default();
                let rev: f64 = r.try_get("cat_rev").unwrap_or(0.0);
                let profit: f64 = r.try_get("cat_profit").unwrap_or(0.0);
                let margin = if rev > 0.0 { (profit / rev) * 100.0 } else { 0.0 };
                ctx.push_str(&format!("  * {}. Danh mục {}: Doanh số {:.}đ | Lãi: {:.}đ (Biên lãi: {:.1}%)\n", idx + 1, cat, rev, profit, margin));
            }
            ctx.push('\n');
        }
    }

    // 4. KHÁCH HÀNG, NHÀ CUNG CẤP, ĐỐI TÁC 2 CHIỀU & CÔNG NỢ
    let total_cust_only: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partner WHERE (is_customer = 1 OR type = 'Customer') AND NOT (is_supplier = 1 OR type = 'Supplier')"
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let total_supp_only: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partner WHERE (is_supplier = 1 OR type = 'Supplier') AND NOT (is_customer = 1 OR type = 'Customer')"
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let total_both: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM partner WHERE (is_customer = 1 OR type = 'Customer') AND (is_supplier = 1 OR type = 'Supplier')"
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
        "4. ĐỐI TÁC, KHÁCH HÀNG VIP, NHÀ CUNG CẤP & CÔNG NỢ TOÀN HỆ THỐNG:\n\
         - Đối tác CHỈ LÀ KHÁCH HÀNG: {} đối tác\n\
         - Đối tác CHỈ LÀ NHÀ CUNG CẤP: {} đối tác\n\
         - ĐỐI TÁC 2 CHIỀU (VỪA LÀ KHÁCH HÀNG VỪA LÀ NHÀ CUNG CẤP): {} đối tác\n\
         - CÔNG NỢ PHẢI THU (Khách/Đối tác nợ cửa hàng): {} đối tác nợ | Tổng nợ cần thu: {:.}đ\n\
         - CÔNG NỢ PHẢI TRẢ (Cửa hàng nợ NCC/Đối tác): {} đối tác | Tổng nợ cần trả: {:.}đ\n\n",
        total_cust_only, total_supp_only, total_both,
        count_customer_debtors, total_customer_debt,
        count_supplier_debtors, total_supplier_debt
    ));

    // DANH SÁCH ĐỐI TÁC 2 CHIỀU (VỪA LÀ KHÁCH HÀNG VỪA LÀ NHÀ CUNG CẤP)
    if let Ok(both_rows) = sqlx::query(
        "SELECT p.id, p.name, p.phone, p.debt_balance, \
                COUNT(DISTINCT CASE WHEN o.type = 'Sale' THEN o.id END) as sale_cnt, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN o.total_amount ELSE 0 END), 0) AS REAL) as total_sold, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN o.amount_paid ELSE 0 END), 0) AS REAL) as sold_paid, \
                COUNT(DISTINCT CASE WHEN o.type = 'Purchase' THEN o.id END) as pur_cnt, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Purchase' THEN o.total_amount ELSE 0 END), 0) AS REAL) as total_purchased, \
                CAST(COALESCE(SUM(CASE WHEN o.type = 'Purchase' THEN o.amount_paid ELSE 0 END), 0) AS REAL) as pur_paid \
         FROM partner p \
         LEFT JOIN \"order\" o ON o.partner_id = p.id AND o.display_id NOT IN ('NODAU', '#NODAU') \
         WHERE (p.is_customer = 1 OR p.type = 'Customer') AND (p.is_supplier = 1 OR p.type = 'Supplier') \
         GROUP BY p.id \
         ORDER BY (total_sold + total_purchased) DESC LIMIT 15"
    ).fetch_all(pool).await {
        if !both_rows.is_empty() {
            ctx.push_str("★ DANH SÁCH ĐỐI TÁC 2 CHIỀU TIÊU BIỂU (VỪA LÀ KHÁCH HÀNG VỪA LÀ NHÀ CUNG CẤP):\n");
            for (idx, r) in both_rows.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let phone: String = r.try_get("phone").unwrap_or_else(|_| "".to_string());
                let phone_str = if phone.trim().is_empty() { "Chưa có SĐT".to_string() } else { phone.trim().to_string() };
                let debt: f64 = r.try_get("debt_balance").unwrap_or(0.0);
                let s_cnt: i64 = r.try_get("sale_cnt").unwrap_or(0);
                let s_sold: f64 = r.try_get("total_sold").unwrap_or(0.0);
                let p_cnt: i64 = r.try_get("pur_cnt").unwrap_or(0);
                let p_purchased: f64 = r.try_get("total_purchased").unwrap_or(0.0);
                let debt_status = if debt > 0.0 {
                    format!("Đối tác còn nợ tiệm {:.}đ (Cần thu)", debt)
                } else if debt < 0.0 {
                    format!("Tiệm còn nợ đối tác {:.}đ (Cần trả)", debt.abs())
                } else {
                    "Đã bù trừ cân bằng (0đ)".to_string()
                };
                ctx.push_str(&format!(
                    "  {}. {} (SĐT: {}):\n\
                       + Chiều Bán hàng (Họ mua): {} đơn | Doanh số: {:.}đ\n\
                       + Chiều Nhập hàng (Họ bán cho tiệm): {} đơn | Tiền hàng nhập: {:.}đ\n\
                       + Dư nợ ròng sau bù trừ 2 chiều: {}\n",
                    idx + 1, name, phone_str, s_cnt, s_sold, p_cnt, p_purchased, debt_status
                ));
            }
            ctx.push('\n');
        }
    }

    // TOP 15 KHÁCH HÀNG VIP CHI TIÊU CAO NHẤT (Doanh số mua cao nhất)
    if let Ok(top_vip) = sqlx::query(
        "SELECT p.id, p.name, p.phone, p.debt_balance, \
                COUNT(DISTINCT o.id) as order_count, \
                CAST(COALESCE(SUM(o.total_amount), 0) AS REAL) as total_spent, \
                MAX(o.date) as last_order_date \
         FROM partner p \
         JOIN \"order\" o ON o.partner_id = p.id AND o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY p.id \
         ORDER BY total_spent DESC LIMIT 15"
    )
    .fetch_all(pool)
    .await {
        if !top_vip.is_empty() {
            ctx.push_str("TOP 15 KHÁCH HÀNG VIP CHI TIÊU NHIỀU TIỀN NHẤT LỊCH SỬ (DOANH THU MANG LẠI LỚN NHẤT):\n");
            for (idx, r) in top_vip.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let phone: String = r.try_get("phone").unwrap_or_else(|_| "".to_string());
                let spent: f64 = r.try_get("total_spent").unwrap_or(0.0);
                let ord_cnt: i64 = r.try_get("order_count").unwrap_or(0);
                let debt: f64 = r.try_get("debt_balance").unwrap_or(0.0);
                let phone_str = if phone.trim().is_empty() { "Chưa có SĐT".to_string() } else { phone.trim().to_string() };
                let debt_status = if debt > 0.0 {
                    format!("Hiện đang nợ {:.}đ", debt)
                } else if debt < 0.0 {
                    format!("Có số dư trả trước {:.}đ", debt.abs())
                } else {
                    "Không nợ (0đ)".to_string()
                };
                ctx.push_str(&format!(
                    "  {}. {} (SĐT: {}): Đã mua {:.}đ ({} đơn) | Tình trạng nợ: {}\n",
                    idx + 1, name, phone_str, spent, ord_cnt, debt_status
                ));
            }
            ctx.push('\n');
        }
    }

    // TOP 15 KHÁCH HÀNG ĐANG CÓ DƯ NỢ CAO NHẤT (Phải thu)
    if let Ok(debtors) = sqlx::query(
        "SELECT name, phone, debt_balance FROM partner \
         WHERE (is_customer = 1 OR type = 'Customer') AND debt_balance > 0 \
         ORDER BY debt_balance DESC LIMIT 15"
    )
    .fetch_all(pool)
    .await {
        if !debtors.is_empty() {
            ctx.push_str("DANH SÁCH TOP 15 KHÁCH HÀNG NỢ NHIỀU TIỀN NHẤT (CÔNG NỢ CẦN THU HỒI):\n");
            for (idx, r) in debtors.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let phone: String = r.try_get("phone").unwrap_or_else(|_| "".to_string());
                let debt: f64 = r.try_get("debt_balance").unwrap_or(0.0);
                let phone_str = if phone.trim().is_empty() { "Chưa có SĐT".to_string() } else { phone.trim().to_string() };
                ctx.push_str(&format!("  {}. {} (SĐT: {}): Đang nợ {:.}đ\n", idx + 1, name, phone_str, debt));
            }
            ctx.push('\n');
        }
    }

    // TOP 10 NHÀ CUNG CẤP CỬA HÀNG ĐANG NỢ NHIỀU NHẤT (Phải trả)
    if let Ok(supp_debtors) = sqlx::query(
        "SELECT name, phone, debt_balance FROM partner \
         WHERE (is_supplier = 1 OR type = 'Supplier') AND debt_balance < 0 \
         ORDER BY debt_balance ASC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !supp_debtors.is_empty() {
            ctx.push_str("DANH SÁCH TOP 10 NHÀ CUNG CẤP CỬA HÀNG ĐANG NỢ NHIỀU NHẤT (CÔNG NỢ PHẢI TRẢ):\n");
            for (idx, r) in supp_debtors.into_iter().enumerate() {
                let name: String = r.try_get("name").unwrap_or_default();
                let phone: String = r.try_get("phone").unwrap_or_else(|_| "".to_string());
                let raw_debt: f64 = r.try_get("debt_balance").unwrap_or(0.0);
                let debt = raw_debt.abs();
                let phone_str = if phone.trim().is_empty() { "Chưa có SĐT".to_string() } else { phone.trim().to_string() };
                ctx.push_str(&format!("  {}. {} (SĐT: {}): Cửa hàng nợ {:.}đ\n", idx + 1, name, phone_str, debt));
            }
            ctx.push('\n');
        }
    }

    // 5. PHƯƠNG THỨC THANH TOÁN & DÒNG TIỀN QUỸ
    if let Ok(pay_methods) = sqlx::query(
        "SELECT COALESCE(payment_method, 'Chưa ghi') as method, \
                COUNT(*) as cnt, \
                CAST(SUM(total_amount) AS REAL) as tot, \
                CAST(SUM(amount_paid) AS REAL) as paid \
         FROM \"order\" \
         WHERE type = 'Sale' AND display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY payment_method ORDER BY tot DESC"
    )
    .fetch_all(pool)
    .await {
        if !pay_methods.is_empty() {
            ctx.push_str("5. PHÂN BỔ PHƯƠNG THỨC THANH TOÁN TOÀN BỘ ĐƠN HÀNG:\n");
            for r in pay_methods {
                let method: String = r.try_get("method").unwrap_or_default();
                let cnt: i64 = r.try_get("cnt").unwrap_or(0);
                let tot: f64 = r.try_get("tot").unwrap_or(0.0);
                let paid: f64 = r.try_get("paid").unwrap_or(0.0);
                ctx.push_str(&format!("  * Hình thức {}: {} đơn | Doanh số: {:.}đ | Đã thanh toán: {:.}đ | Nợ: {:.}đ\n", method, cnt, tot, paid, tot - paid));
            }
            ctx.push('\n');
        }
    }

    // Thu chi ngoài đơn hàng (phiếu thu / phiếu chi)
    let cash_in_month: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(amount), 0) AS REAL) FROM cash_voucher WHERE type = 'Receipt' AND strftime('%Y-%m', date) = ?"
    )
    .bind(&month_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    let cash_out_month: f64 = sqlx::query_scalar(
        "SELECT CAST(COALESCE(SUM(amount), 0) AS REAL) FROM cash_voucher WHERE type = 'Payment' AND strftime('%Y-%m', date) = ?"
    )
    .bind(&month_prefix)
    .fetch_one(pool)
    .await
    .unwrap_or(0.0);

    ctx.push_str(&format!(
        "THU CHI TIỀN MẶT NGOÀI ĐƠN HÀNG (PHIẾU THU/CHI) THÁNG NÀY:\n\
         - Tổng tiền thu ngoài: {:.}đ | Tổng tiền chi ngoài: {:.}đ\n\n",
        cash_in_month, cash_out_month
    ));

    // Lịch sử nhập hàng
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
        "LỊCH SỬ NHẬP HÀNG TỪ NHÀ CUNG CẤP:\n\
         - Nhập hàng tháng này ({}): {} đơn nhập | Tổng tiền nhập: {:.}đ\n\
         - Tổng nhập hàng toàn thời gian: {} đơn nhập | {:.}đ\n\n",
        month_prefix, month_purchases.0, month_purchases.1.unwrap_or(0.0),
        all_time_purchases.0, all_time_purchases.1.unwrap_or(0.0)
    ));

    // 6. CHUỖI THỜI GIAN CHI TIẾT (14 ngày & 12 tháng gần nhất KÈM LỢI NHUẬN GỘP)
    if let Ok(recent_days) = sqlx::query(
        "SELECT date(o.date) as day, COUNT(DISTINCT o.id) as cnt, \
                CAST(COALESCE(SUM(o.total_amount), 0) AS REAL) as rev, \
                CAST(COALESCE(SUM(o.amount_paid), 0) AS REAL) as paid, \
                CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) as profit \
         FROM \"order\" o \
         LEFT JOIN order_detail od ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY day ORDER BY day DESC LIMIT 14"
    )
    .fetch_all(pool)
    .await {
        if !recent_days.is_empty() {
            ctx.push_str("6. LỊCH SỬ KINH DOANH 14 NGÀY GẦN ĐÂY (CHI TIẾT DOANH THU & LỢI NHUẬN GỘP TỪNG NGÀY):\n");
            for r in recent_days {
                let day: String = r.try_get("day").unwrap_or_default();
                let cnt: i64 = r.try_get("cnt").unwrap_or(0);
                let rev: f64 = r.try_get("rev").unwrap_or(0.0);
                let paid: f64 = r.try_get("paid").unwrap_or(0.0);
                let profit: f64 = r.try_get("profit").unwrap_or(0.0);
                let margin = if rev > 0.0 { (profit / rev) * 100.0 } else { 0.0 };
                ctx.push_str(&format!(
                    "  * Ngày {}: {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ ({:.1}%) | Thực thu: {:.}đ | Nợ: {:.}đ\n",
                    day, cnt, rev, profit, margin, paid, rev - paid
                ));
            }
            ctx.push('\n');
        }
    }

    if let Ok(recent_months) = sqlx::query(
        "SELECT strftime('%Y-%m', o.date) as m, COUNT(DISTINCT o.id) as cnt, \
                CAST(COALESCE(SUM(o.total_amount), 0) AS REAL) as rev, \
                CAST(COALESCE(SUM(o.amount_paid), 0) AS REAL) as paid, \
                CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) as profit \
         FROM \"order\" o \
         LEFT JOIN order_detail od ON od.order_id = o.id \
         LEFT JOIN product p ON od.product_id = p.id \
         WHERE o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         GROUP BY m ORDER BY m DESC LIMIT 12"
    )
    .fetch_all(pool)
    .await {
        if !recent_months.is_empty() {
            ctx.push_str("LỊCH SỬ KINH DOANH 12 THÁNG QUA (DOANH THU, LỢI NHUẬN GỘP VÀ CÔNG NỢ TỪNG THÁNG):\n");
            for r in recent_months {
                let m: String = r.try_get("m").unwrap_or_default();
                let cnt: i64 = r.try_get("cnt").unwrap_or(0);
                let rev: f64 = r.try_get("rev").unwrap_or(0.0);
                let paid: f64 = r.try_get("paid").unwrap_or(0.0);
                let profit: f64 = r.try_get("profit").unwrap_or(0.0);
                let margin = if rev > 0.0 { (profit / rev) * 100.0 } else { 0.0 };
                let debt = rev - paid;
                ctx.push_str(&format!(
                    "  * Tháng {}: {} đơn | Doanh thu: {:.}đ | Lãi gộp: {:.}đ ({:.1}%) | Thực thu: {:.}đ | Nợ: {:.}đ\n",
                    m, cnt, rev, profit, margin, paid, debt
                ));
            }
            ctx.push('\n');
        }
    }

    // 10 ĐƠN HÀNG MỚI NHẤT VỪA PHÁT SINH
    if let Ok(recent_orders) = sqlx::query(
        "SELECT o.id, o.display_id, o.date, o.total_amount, o.amount_paid, COALESCE(p.name, 'Khách lẻ') as partner_name, o.payment_method \
         FROM \"order\" o \
         LEFT JOIN partner p ON o.partner_id = p.id \
         WHERE o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
         ORDER BY o.date DESC LIMIT 10"
    )
    .fetch_all(pool)
    .await {
        if !recent_orders.is_empty() {
            ctx.push_str("10 ĐƠN BÁN HÀNG GẦN ĐÂY NHẤT VỪA GIAO DỊCH:\n");
            for r in recent_orders {
                let code: String = r.try_get("display_id").unwrap_or_default();
                let d: String = r.try_get("date").unwrap_or_default();
                let tot: f64 = r.try_get("total_amount").unwrap_or(0.0);
                let paid: f64 = r.try_get("amount_paid").unwrap_or(0.0);
                let cust: String = r.try_get("partner_name").unwrap_or_default();
                let pm: String = r.try_get("payment_method").unwrap_or_default();
                ctx.push_str(&format!("  * Đơn [{}] lúc {} - Khách: {} | Tiền: {:.}đ (Trả: {:.}đ, PT: {})\n", code, d, cust, tot, paid, pm));
            }
            ctx.push('\n');
        }
    }

    // 7. TRUY VẤN ĐỘC LẬP THEO CÂU HỎI NGƯỜI DÙNG (SMART CONTEXT-AWARE RETRIEVAL)
    if let Some(q) = user_query {
        let q_clean = q.trim();
        if !q_clean.is_empty() {
            let q_norm = crate::utils::remove_accents(q_clean).to_lowercase();
            let keywords = extract_significant_keywords(&q_norm);

            // A. NHẬN DIỆN THỜI GIAN / KỲ KINH DOANH CỤ THỂ ĐƯỢC HỎI (Hôm qua, Tuần, Tháng, Quý, Năm...)
            if let Some(period) = detect_query_period(&q_norm, &today) {
                let (sales_cnt, sales_rev, sales_paid, p_profit, pur_cnt, pur_tot) =
                    get_range_sales_and_profit(pool, &period.start_d, &period.end_d).await;
                let p_margin = if sales_rev > 0.0 { (p_profit / sales_rev) * 100.0 } else { 0.0 };
                let p_debt = sales_rev - sales_paid;

                ctx.push_str(&format!(
                    "★★★ THỐNG KÊ CHI TIẾT ĐÚNG KỲ ĐƯỢC HỎI [{} (Từ {} đến {})]:\n\
                     - BÁN HÀNG: {} đơn | Doanh thu: {:.}đ | Lợi nhuận gộp: {:.}đ (Biên lãi: {:.1}%) | Thực thu: {:.}đ | Nợ phát sinh: {:.}đ\n\
                     - NHẬP HÀNG: {} đơn nhập từ NCC | Tổng giá trị hàng nhập: {:.}đ\n\
                     - CHÊNH LỆCH DOANH SỐ / NHẬP HÀNG: {:.}đ\n",
                    period.label, period.start_d, period.end_d,
                    sales_cnt, sales_rev, p_profit, p_margin, sales_paid, p_debt,
                    pur_cnt, pur_tot,
                    sales_rev - pur_tot
                ));

                // Nếu là Quý hoặc Năm hoặc khoảng thời gian nhiều tháng: xuất diễn biến từng tháng
                if period.is_quarter_or_year {
                    if let Ok(monthly_rows) = sqlx::query(
                        "SELECT strftime('%Y-%m', o.date) as m, \
                                COUNT(DISTINCT CASE WHEN o.type = 'Sale' THEN o.id END) as s_cnt, \
                                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN o.total_amount ELSE 0 END), 0) AS REAL) as s_rev, \
                                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN o.amount_paid ELSE 0 END), 0) AS REAL) as s_paid, \
                                CAST(COALESCE(SUM(CASE WHEN o.type = 'Sale' THEN od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0)) ELSE 0 END), 0) AS REAL) as s_profit, \
                                COUNT(DISTINCT CASE WHEN o.type = 'Purchase' THEN o.id END) as p_cnt, \
                                CAST(COALESCE(SUM(CASE WHEN o.type = 'Purchase' THEN o.total_amount ELSE 0 END), 0) AS REAL) as p_tot \
                         FROM \"order\" o \
                         LEFT JOIN order_detail od ON od.order_id = o.id \
                         LEFT JOIN product p ON od.product_id = p.id \
                         WHERE date(o.date) >= date(?) AND date(o.date) <= date(?) AND o.display_id NOT IN ('NODAU', '#NODAU') \
                         GROUP BY m ORDER BY m ASC"
                    )
                    .bind(&period.start_d)
                    .bind(&period.end_d)
                    .fetch_all(pool)
                    .await {
                        if !monthly_rows.is_empty() {
                            ctx.push_str("  - DIỄN BIẾN THEO TỪNG THÁNG TRONG KỲ NÀY:\n");
                            for r in monthly_rows {
                                let m: String = r.try_get("m").unwrap_or_default();
                                let sc: i64 = r.try_get("s_cnt").unwrap_or(0);
                                let sr: f64 = r.try_get("s_rev").unwrap_or(0.0);
                                let sp: f64 = r.try_get("s_paid").unwrap_or(0.0);
                                let pf: f64 = r.try_get("s_profit").unwrap_or(0.0);
                                let mg = if sr > 0.0 { (pf / sr) * 100.0 } else { 0.0 };
                                let pc: i64 = r.try_get("p_cnt").unwrap_or(0);
                                let pt: f64 = r.try_get("p_tot").unwrap_or(0.0);
                                ctx.push_str(&format!(
                                    "    + Tháng {}: Bán {} đơn | Doanh thu: {:.}đ | Lãi: {:.}đ ({:.1}%) | Thu: {:.}đ | Nhập {} đơn: {:.}đ\n",
                                    m, sc, sr, pf, mg, sp, pc, pt
                                ));
                            }
                        }
                    }
                }

                // Top 10 sản phẩm bán chạy nhất trong kỳ này
                if let Ok(period_prods) = sqlx::query(
                    "SELECT COALESCE(od.product_name_override, p.name) as name, p.unit, \
                            CAST(SUM(od.quantity) AS REAL) as qty, \
                            CAST(SUM(od.quantity * od.price) AS REAL) as rev \
                     FROM order_detail od \
                     JOIN \"order\" o ON od.order_id = o.id \
                     LEFT JOIN product p ON od.product_id = p.id \
                     WHERE o.type = 'Sale' AND date(o.date) >= date(?) AND date(o.date) <= date(?) AND o.display_id NOT IN ('NODAU', '#NODAU') \
                     GROUP BY od.product_id ORDER BY rev DESC LIMIT 10"
                )
                .bind(&period.start_d)
                .bind(&period.end_d)
                .fetch_all(pool)
                .await {
                    if !period_prods.is_empty() {
                        ctx.push_str("  - Top 10 sản phẩm bán chạy nhất kỳ này:\n");
                        for (idx, r) in period_prods.into_iter().enumerate() {
                            let pname: String = r.try_get("name").unwrap_or_default();
                            let punit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                            let pqty: f64 = r.try_get("qty").unwrap_or(0.0);
                            let prev: f64 = r.try_get("rev").unwrap_or(0.0);
                            ctx.push_str(&format!("    {}. {}: {} {} | Doanh số: {:.}đ\n", idx + 1, pname, pqty, punit, prev));
                        }
                    }
                }

                // Top 5 mặt hàng sinh lãi nhiều nhất trong kỳ
                if let Ok(top_profit_prods) = sqlx::query(
                    "SELECT COALESCE(od.product_name_override, p.name) as name, p.unit, \
                            CAST(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))) AS REAL) as profit, \
                            CAST(SUM(od.quantity * od.price) AS REAL) as rev \
                     FROM order_detail od \
                     JOIN \"order\" o ON od.order_id = o.id \
                     LEFT JOIN product p ON od.product_id = p.id \
                     WHERE o.type = 'Sale' AND date(o.date) >= date(?) AND date(o.date) <= date(?) AND o.display_id NOT IN ('NODAU', '#NODAU') \
                     GROUP BY od.product_id ORDER BY profit DESC LIMIT 5"
                )
                .bind(&period.start_d)
                .bind(&period.end_d)
                .fetch_all(pool)
                .await {
                    if !top_profit_prods.is_empty() {
                        ctx.push_str("  - Top 5 sản phẩm sinh lãi gộp nhiều nhất kỳ này:\n");
                        for (idx, r) in top_profit_prods.into_iter().enumerate() {
                            let pname: String = r.try_get("name").unwrap_or_default();
                            let punit: String = r.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                            let pf: f64 = r.try_get("profit").unwrap_or(0.0);
                            let rev: f64 = r.try_get("rev").unwrap_or(0.0);
                            let mg = if rev > 0.0 { (pf / rev) * 100.0 } else { 0.0 };
                            ctx.push_str(&format!("    {}. {}: Lãi gộp {:.}đ (Biên lãi: {:.1}%)\n", idx + 1, pname, pf, mg));
                        }
                    }
                }

                // Top 5 khách hàng mua nhiều nhất trong kỳ
                if let Ok(top_custs) = sqlx::query(
                    "SELECT COALESCE(p.name, 'Khách lẻ') as cust_name, COALESCE(p.phone, '') as phone, \
                            COUNT(o.id) as cnt, \
                            CAST(SUM(o.total_amount) AS REAL) as tot, \
                            CAST(SUM(o.amount_paid) AS REAL) as paid \
                     FROM \"order\" o \
                     LEFT JOIN partner p ON o.partner_id = p.id \
                     WHERE o.type = 'Sale' AND date(o.date) >= date(?) AND date(o.date) <= date(?) AND o.display_id NOT IN ('NODAU', '#NODAU') \
                     GROUP BY o.partner_id ORDER BY tot DESC LIMIT 5"
                )
                .bind(&period.start_d)
                .bind(&period.end_d)
                .fetch_all(pool)
                .await {
                    if !top_custs.is_empty() {
                        ctx.push_str("  - Top 5 khách hàng mua nhiều nhất kỳ này:\n");
                        for (idx, r) in top_custs.into_iter().enumerate() {
                            let cname: String = r.try_get("cust_name").unwrap_or_default();
                            let cphone: String = r.try_get("phone").unwrap_or_default();
                            let cnt: i64 = r.try_get("cnt").unwrap_or(0);
                            let tot: f64 = r.try_get("tot").unwrap_or(0.0);
                            let paid: f64 = r.try_get("paid").unwrap_or(0.0);
                            let phone_disp = if cphone.is_empty() { "".to_string() } else { format!(" ({})", cphone) };
                            ctx.push_str(&format!("    {}. {}{}: Mua {} đơn | {:.}đ (Đã trả {:.}đ, Nợ: {:.}đ)\n", idx + 1, cname, phone_disp, cnt, tot, paid, tot - paid));
                        }
                    }
                }

                // Top 5 nhà cung cấp đã nhập hàng trong kỳ
                if let Ok(top_supps) = sqlx::query(
                    "SELECT COALESCE(p.name, 'NCC Vãng lai') as supp_name, COALESCE(p.phone, '') as phone, \
                            COUNT(o.id) as cnt, \
                            CAST(SUM(o.total_amount) AS REAL) as tot, \
                            CAST(SUM(o.amount_paid) AS REAL) as paid \
                     FROM \"order\" o \
                     LEFT JOIN partner p ON o.partner_id = p.id \
                     WHERE o.type = 'Purchase' AND date(o.date) >= date(?) AND date(o.date) <= date(?) AND o.display_id NOT IN ('NODAU', '#NODAU') \
                     GROUP BY o.partner_id ORDER BY tot DESC LIMIT 5"
                )
                .bind(&period.start_d)
                .bind(&period.end_d)
                .fetch_all(pool)
                .await {
                    if !top_supps.is_empty() {
                        ctx.push_str("  - Top Nhà cung cấp đã nhập hàng trong kỳ này:\n");
                        for (idx, r) in top_supps.into_iter().enumerate() {
                            let sname: String = r.try_get("supp_name").unwrap_or_default();
                            let sphone: String = r.try_get("phone").unwrap_or_default();
                            let cnt: i64 = r.try_get("cnt").unwrap_or(0);
                            let tot: f64 = r.try_get("tot").unwrap_or(0.0);
                            let paid: f64 = r.try_get("paid").unwrap_or(0.0);
                            let phone_disp = if sphone.is_empty() { "".to_string() } else { format!(" ({})", sphone) };
                            ctx.push_str(&format!("    {}. {}{}: Nhập {} đơn | Tiền hàng: {:.}đ (Đã trả: {:.}đ, Nợ: {:.}đ)\n", idx + 1, sname, phone_disp, cnt, tot, paid, tot - paid));
                        }
                    }
                }
                ctx.push('\n');
            }

            // B. TÌM KIẾM ĐỐI TÁC THÔNG MINH (FUZZY TOKEN SEARCH THEO TỪ KHÓA)
            if !keywords.is_empty() || q_clean.chars().any(|c| c.is_ascii_digit()) {
                if let Ok(partners) = sqlx::query(
                    "SELECT id, name, phone, debt_balance, type, is_customer, is_supplier FROM partner"
                ).fetch_all(pool).await {
                    let mut matched_partners = Vec::new();

                    for p in partners {
                        let p_name: String = p.try_get("name").unwrap_or_default();
                        let p_phone: String = p.try_get("phone").unwrap_or_default();
                        let p_name_norm = crate::utils::remove_accents(&p_name).to_lowercase();

                        let phone_matched = !p_phone.is_empty() && q_clean.contains(&p_phone);
                        let name_full_match = !p_name_norm.is_empty() && q_norm.contains(&p_name_norm);
                        let token_match = keywords.iter().any(|kw| {
                            kw.len() >= 3 && p_name_norm.split_whitespace().any(|part| part == kw || part.starts_with(kw))
                        });

                        if phone_matched || name_full_match || token_match {
                            matched_partners.push(p);
                            if matched_partners.len() >= 3 {
                                break;
                            }
                        }
                    }

                    if !matched_partners.is_empty() {
                        ctx.push_str("★★★ KẾT QUẢ ĐỐI TÁC TRÙNG KHỚP VỚI CÂU HỎI:\n");
                        for p in matched_partners {
                            let p_id: i64 = p.try_get("id").unwrap_or(0);
                            let p_name: String = p.try_get("name").unwrap_or_default();
                            let p_phone: String = p.try_get("phone").unwrap_or_default();
                            let p_debt: f64 = p.try_get("debt_balance").unwrap_or(0.0);
                            let p_type: String = p.try_get("type").unwrap_or_default();
                            let is_cust: bool = p.try_get("is_customer").unwrap_or(false);
                            let is_supp: bool = p.try_get("is_supplier").unwrap_or(false);

                            let is_both = (is_cust || p_type == "Customer") && (is_supp || p_type == "Supplier");
                            let role_desc = if is_both {
                                "VỪA LÀ KHÁCH HÀNG, VỪA LÀ NHÀ CUNG CẤP (GIAO DỊCH 2 CHIỀU)"
                            } else if is_supp || p_type == "Supplier" {
                                "NHÀ CUNG CẤP"
                            } else {
                                "KHÁCH HÀNG"
                            };

                            let debt_desc = if p_debt > 0.0 {
                                format!("Đối tác nợ cửa hàng {:.}đ (Cần thu)", p_debt)
                            } else if p_debt < 0.0 {
                                format!("Cửa hàng nợ đối tác {:.}đ (Cần trả)", p_debt.abs())
                            } else {
                                "Đã cấn trừ cân bằng (0đ dư nợ)".to_string()
                            };

                            // Tổng tiền đã mua (Sale)
                            let spent_stat: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
                                "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) FROM \"order\" WHERE partner_id = ? AND type = 'Sale' AND display_id NOT IN ('NODAU', '#NODAU')"
                            )
                            .bind(p_id)
                            .fetch_one(pool)
                            .await
                            .unwrap_or((0, Some(0.0), Some(0.0)));

                            // Tổng tiền đã nhập (Purchase)
                            let purchase_stat: (i64, Option<f64>, Option<f64>) = sqlx::query_as(
                                "SELECT COUNT(*), CAST(SUM(total_amount) AS REAL), CAST(SUM(amount_paid) AS REAL) FROM \"order\" WHERE partner_id = ? AND type = 'Purchase' AND display_id NOT IN ('NODAU', '#NODAU')"
                            )
                            .bind(p_id)
                            .fetch_one(pool)
                            .await
                            .unwrap_or((0, Some(0.0), Some(0.0)));

                            let sale_tot = spent_stat.1.unwrap_or(0.0);
                            let sale_paid = spent_stat.2.unwrap_or(0.0);
                            let pur_tot = purchase_stat.1.unwrap_or(0.0);
                            let pur_paid = purchase_stat.2.unwrap_or(0.0);

                            if is_both {
                                ctx.push_str(&format!(
                                    "★ ĐỐI TÁC 2 CHIỀU [{} - SĐT: {}]:\n\
                                       - Phân loại: {}\n\
                                       - Tình trạng công nợ ròng (sau cấn trừ bù trừ 2 chiều): {}\n\
                                       - CHIỀU BÁN CHO HỌ (Khách mua): {} đơn | Tổng tiền bán: {:.}đ | Đã thu: {:.}đ | Nợ tiền mua: {:.}đ\n\
                                       - CHIỀU NHẬP CỦA HỌ (Tiệm nhập NCC): {} đơn | Tổng tiền nhập: {:.}đ | Đã trả họ: {:.}đ | Nợ tiền nhập: {:.}đ\n",
                                    p_name, if p_phone.is_empty() { "---" } else { &p_phone },
                                    role_desc, debt_desc,
                                    spent_stat.0, sale_tot, sale_paid, sale_tot - sale_paid,
                                    purchase_stat.0, pur_tot, pur_paid, pur_tot - pur_paid
                                ));
                            } else if is_supp || p_type == "Supplier" {
                                ctx.push_str(&format!(
                                    "★ NHÀ CUNG CẤP [{} - SĐT: {}]:\n\
                                       - Phân loại: {}\n\
                                       - Tình trạng nợ: {}\n\
                                       - Lịch sử nhập hàng: {} đơn nhập | Tổng giá trị hàng nhập: {:.}đ | Đã trả: {:.}đ | Nợ tiền nhập: {:.}đ\n",
                                    p_name, if p_phone.is_empty() { "---" } else { &p_phone },
                                    role_desc, debt_desc,
                                    purchase_stat.0, pur_tot, pur_paid, pur_tot - pur_paid
                                ));
                            } else {
                                ctx.push_str(&format!(
                                    "★ KHÁCH HÀNG [{} - SĐT: {}]:\n\
                                       - Phân loại: {}\n\
                                       - Tình trạng nợ: {}\n\
                                       - Lịch sử mua hàng: {} đơn đã mua | Tổng chi tiêu: {:.}đ | Đã thanh toán: {:.}đ | Nợ tiền mua: {:.}đ\n",
                                    p_name, if p_phone.is_empty() { "---" } else { &p_phone },
                                    role_desc, debt_desc,
                                    spent_stat.0, sale_tot, sale_paid, sale_tot - sale_paid
                                ));
                            }

                            // 5 đơn hàng gần nhất (gồm cả Bán hàng và Nhập hàng)
                            if let Ok(orders) = sqlx::query(
                                "SELECT id, type, date, total_amount, amount_paid, display_id FROM \"order\" \
                                 WHERE partner_id = ? ORDER BY date DESC LIMIT 5"
                            )
                            .bind(p_id)
                            .fetch_all(pool)
                            .await {
                                if !orders.is_empty() {
                                    ctx.push_str("  - 5 giao dịch gần đây nhất:\n");
                                    for ord in orders {
                                        let o_type: String = ord.try_get("type").unwrap_or_else(|_| "Sale".to_string());
                                        let o_date: String = ord.try_get("date").unwrap_or_default();
                                        let o_tot: f64 = ord.try_get("total_amount").unwrap_or(0.0);
                                        let o_paid: f64 = ord.try_get("amount_paid").unwrap_or(0.0);
                                        let o_code: String = ord.try_get("display_id").unwrap_or_default();
                                        let type_tag = if o_type == "Sale" { "[BÁN HÀNG - Khách mua]" } else { "[NHẬP HÀNG - Tiệm nhập]" };
                                        ctx.push_str(&format!("    + {} Đơn [{}] lúc {}: {:.}đ (Đã trả {:.}đ, Nợ: {:.}đ)\n", type_tag, o_code, o_date, o_tot, o_paid, o_tot - o_paid));
                                    }
                                }
                            }
                            ctx.push('\n');
                        }
                    }
                }
            }

            // C. TÌM KIẾM SẢN PHẨM THÔNG MINH (FUZZY TOKEN SEARCH THEO TỪ KHÓA)
            if !keywords.is_empty() {
                if let Ok(products_found) = sqlx::query(
                    "SELECT p.id, p.name, p.unit, p.stock, p.cost_price, p.sale_price, p.active_ingredient, \
                            CAST(COALESCE(SUM(od.quantity), 0) AS REAL) as total_qty, \
                            CAST(COALESCE(SUM(od.quantity * od.price), 0) AS REAL) as total_rev, \
                            CAST(COALESCE(SUM(od.quantity * (od.price - COALESCE(od.cost_price, p.cost_price, 0))), 0) AS REAL) as total_profit \
                     FROM product p \
                     LEFT JOIN order_detail od ON od.product_id = p.id \
                     LEFT JOIN \"order\" o ON od.order_id = o.id AND o.type = 'Sale' AND o.display_id NOT IN ('NODAU', '#NODAU') \
                     WHERE p.is_active = 1 \
                     GROUP BY p.id"
                ).fetch_all(pool).await {
                    let mut matched_prods = Vec::new();

                    for prod in products_found {
                        let prod_name: String = prod.try_get("name").unwrap_or_default();
                        let prod_active: String = prod.try_get("active_ingredient").unwrap_or_default();
                        let prod_name_norm = crate::utils::remove_accents(&prod_name).to_lowercase();
                        let prod_active_norm = crate::utils::remove_accents(&prod_active).to_lowercase();

                        let full_match = prod_name_norm.len() >= 3 && q_norm.contains(&prod_name_norm);
                        let token_match = keywords.iter().any(|kw| {
                            kw.len() >= 3 && (prod_name_norm.contains(kw) || prod_active_norm.contains(kw))
                        });

                        if full_match || token_match {
                            matched_prods.push(prod);
                            if matched_prods.len() >= 4 {
                                break;
                            }
                        }
                    }

                    if !matched_prods.is_empty() {
                        ctx.push_str("★★★ KẾT QUẢ SẢN PHẨM TRÙNG KHỚP VỚI CÂU HỎI:\n");
                        for prod in matched_prods {
                            let prod_id: i64 = prod.try_get("id").unwrap_or(0);
                            let prod_name: String = prod.try_get("name").unwrap_or_default();
                            let unit: String = prod.try_get("unit").unwrap_or_else(|_| "cái".to_string());
                            let stock: f64 = prod.try_get("stock").unwrap_or(0.0);
                            let cost: f64 = prod.try_get("cost_price").unwrap_or(0.0);
                            let price: f64 = prod.try_get("sale_price").unwrap_or(0.0);
                            let qty: f64 = prod.try_get("total_qty").unwrap_or(0.0);
                            let rev: f64 = prod.try_get("total_rev").unwrap_or(0.0);
                            let profit: f64 = prod.try_get("total_profit").unwrap_or(0.0);
                            let margin = if rev > 0.0 { (profit / rev) * 100.0 } else { 0.0 };

                            ctx.push_str(&format!(
                                "★ SẢN PHẨM [{}]:\n\
                                   - Giá vốn: {:.}đ | Giá bán: {:.}đ | Tồn kho hiện tại: {} {}\n\
                                   - Toàn thời gian: Đã bán {} {} | Doanh số: {:.}đ | Lợi nhuận gộp: {:.}đ (Biên lãi: {:.1}%)\n",
                                prod_name, cost, price, stock, unit, qty, unit, rev, profit, margin
                            ));

                            // 3 đơn gần nhất bán sản phẩm này
                            if let Ok(rec_details) = sqlx::query(
                                "SELECT o.display_id, o.date, od.quantity, od.price, COALESCE(p.name, 'Khách lẻ') as cust_name \
                                 FROM order_detail od \
                                 JOIN \"order\" o ON od.order_id = o.id \
                                 LEFT JOIN partner p ON o.partner_id = p.id \
                                 WHERE od.product_id = ? AND o.type = 'Sale' \
                                 ORDER BY o.date DESC LIMIT 3"
                            )
                            .bind(prod_id)
                            .fetch_all(pool)
                            .await {
                                if !rec_details.is_empty() {
                                    ctx.push_str("  - 3 đơn gần đây nhất bán món này:\n");
                                    for r in rec_details {
                                        let c: String = r.try_get("display_id").unwrap_or_default();
                                        let d: String = r.try_get("date").unwrap_or_default();
                                        let q: f64 = r.try_get("quantity").unwrap_or(0.0);
                                        let pr: f64 = r.try_get("price").unwrap_or(0.0);
                                        let kn: String = r.try_get("cust_name").unwrap_or_default();
                                        ctx.push_str(&format!("    + Đơn [{}] ngày {} - Khách: {} | Mua {} {} giá {:.}đ\n", c, d, kn, q, unit, pr));
                                    }
                                }
                            }
                            ctx.push('\n');
                        }
                    }
                }
            }
        }
    }

    ctx
}
