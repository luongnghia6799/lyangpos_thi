use sqlx::sqlite::SqlitePoolOptions;
use sqlx::Row;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let d_url = "sqlite://D:/LyangPOS/easypos.db";
    let e_url = "sqlite://E:/vibe/LyangPOS/LyangPOS - Copy/easypos.db";

    println!("=== D:/LyangPOS/easypos.db ===");
    if let Ok(pool_d) = SqlitePoolOptions::new().connect(d_url).await {
        let row = sqlx::query("SELECT max(date) as md, count(*) as cnt FROM \"order\"").fetch_one(&pool_d).await?;
        let md: Option<String> = row.get("md");
        let cnt: i64 = row.get("cnt");
        println!("Orders: max_date = {:?}, count = {}", md, cnt);

        let row_today = sqlx::query("SELECT count(*) as cnt FROM \"order\" WHERE date LIKE '2026-09-06%'").fetch_one(&pool_d).await?;
        let cnt_today: i64 = row_today.get("cnt");
        println!("Orders today (2026-09-06): {}", cnt_today);
    } else {
        println!("Failed to connect to D drive");
    }

    println!("=== E:/vibe/LyangPOS/LyangPOS - Copy/easypos.db ===");
    if let Ok(pool_e) = SqlitePoolOptions::new().connect(e_url).await {
        let row = sqlx::query("SELECT max(date) as md, count(*) as cnt FROM \"order\"").fetch_one(&pool_e).await?;
        let md: Option<String> = row.get("md");
        let cnt: i64 = row.get("cnt");
        println!("Orders: max_date = {:?}, count = {}", md, cnt);

        let row_today = sqlx::query("SELECT count(*) as cnt FROM \"order\" WHERE date LIKE '2026-09-06%'").fetch_one(&pool_e).await?;
        let cnt_today: i64 = row_today.get("cnt");
        println!("Orders today (2026-09-06): {}", cnt_today);
    } else {
        println!("Failed to connect to E drive");
    }

    Ok(())
}
