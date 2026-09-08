use sqlx::sqlite::SqlitePoolOptions;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let db_url = "sqlite://E:/vibe/LyangPOS/LyangPOS%20-%20Copy/easypos.db?mode=rwc";
    let pool = SqlitePoolOptions::new().connect(db_url).await?;

    println!("=== CHI TIẾT TRÙNG LẶP DISPLAY_ID NGÀY 06/09/26 VÀ 05/09/26 ===");

    let sept6_dup: Vec<(String, i64)> = sqlx::query_as(
        "SELECT display_id, COUNT(*) as cnt FROM \"order\" WHERE display_id LIKE '%.06/09/26%' OR display_id LIKE '%.05/09/26%' GROUP BY display_id HAVING cnt > 1"
    ).fetch_all(&pool).await?;

    println!("Số mã display_id bị trùng trong ngày 05 & 06/09/2026: {}", sept6_dup.len());
    for (disp, cnt) in &sept6_dup {
        println!("- DisplayID trùng: {} (xuất hiện {} lần)", disp, cnt);
        let rows: Vec<(i64, Option<String>, Option<String>, Option<f64>, Option<String>)> = sqlx::query_as(
            "SELECT id, display_id, date, CAST(total_amount AS REAL), type FROM \"order\" WHERE display_id = $1"
        ).bind(disp).fetch_all(&pool).await?;
        for r in rows {
            println!("    -> ID: {}, Date: {:?}, Total: {:?}, Type: {:?}", r.0, r.2, r.3, r.4);
        }
    }

    // Kiểm tra tất cả display_id bị trùng trong DB
    let all_dup: Vec<(String, i64)> = sqlx::query_as(
        "SELECT display_id, COUNT(*) as cnt FROM \"order\" WHERE display_id IS NOT NULL AND display_id != '' AND display_id != '#NODAU' GROUP BY display_id HAVING cnt > 1"
    ).fetch_all(&pool).await?;

    println!("\nTổng số display_id bị trùng trong toàn bộ DB (trừ #NODAU): {}", all_dup.len());
    for (disp, cnt) in all_dup.iter().take(20) {
        println!("  - {}: {} lần", disp, cnt);
    }

    Ok(())
}
