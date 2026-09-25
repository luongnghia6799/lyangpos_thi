#[cfg(test)]
mod tests {
    use backend_rust::utils::{normalize_date_sqlite, remove_accents};

    #[test]
    fn test_remove_accents() {
        assert_eq!(remove_accents("Thuốc trừ sâu"), "thuoc tru sau");
        assert_eq!(remove_accents("LƯƠNG TRỌNG NGHĨA"), "luong trong nghia");
        assert_eq!(remove_accents("Đồng Tháp"), "dong thap");
        assert_eq!(remove_accents("CANXIBO GA3"), "canxibo ga3");
    }

    #[test]
    fn test_normalize_date() {
        assert_eq!(normalize_date_sqlite("26/02/2026"), "2026-02-26");
        assert_eq!(normalize_date_sqlite("5/3/26"), "2026-03-05");
        assert_eq!(normalize_date_sqlite("2026-05-10"), "2026-05-10");
        assert_eq!(normalize_date_sqlite(""), "9999-12-31");
    }

    #[test]
    fn test_fifo_profit_calculation_logic() {
        // Giả lập 2 lô hàng nhập: Lô 1 (10 cái giá 50k), Lô 2 (20 cái giá 60k)
        let mut batch1_qty: f64 = 10.0;
        let batch1_cost: f64 = 50_000.0;
        let mut batch2_qty: f64 = 20.0;
        let batch2_cost: f64 = 60_000.0;

        // Bán 15 cái giá 80k:
        // Cần lấy: 10 cái từ Lô 1 (cost 50k) + 5 cái từ Lô 2 (cost 60k)
        let sale_qty: f64 = 15.0;
        let sale_price: f64 = 80_000.0;

        let mut rem: f64 = sale_qty;
        let mut total_cost: f64 = 0.0;

        // Lấy từ batch 1
        let take1: f64 = rem.min(batch1_qty);
        batch1_qty -= take1;
        total_cost += take1 * batch1_cost;
        rem -= take1;

        // Lấy từ batch 2
        let take2: f64 = rem.min(batch2_qty);
        batch2_qty -= take2;
        total_cost += take2 * batch2_cost;
        rem -= take2;

        assert_eq!(rem, 0.0);
        assert_eq!(batch1_qty, 0.0);
        assert_eq!(batch2_qty, 15.0);

        // Tổng giá vốn: 10 * 50k + 5 * 60k = 500k + 300k = 800k
        assert_eq!(total_cost, 800_000.0);

        // Giá vốn bình quân đơn hàng: 800k / 15 = 53,333.33
        let avg_cost: f64 = total_cost / sale_qty;
        assert_eq!((avg_cost * 100.0).round() / 100.0, 53333.33);

        // Doanh thu: 15 * 80k = 1,200k
        let revenue: f64 = sale_qty * sale_price;
        assert_eq!(revenue, 1_200_000.0);

        // Lợi nhuận: 1,200k - 800k = 400k
        let profit: f64 = revenue - total_cost;
        assert_eq!(profit, 400_000.0);
    }

    #[test]
    fn test_inventory_conversion_unit_cost_calculation() {
        // Xẻ lẻ 1 bao phân 50kg (giá vốn bao = 500,000) thành 50 túi 1kg
        let source_qty: f64 = 1.0;
        let source_cost: f64 = 500_000.0;
        let dest_actual_qty: f64 = 48.0; // Hao hụt 2kg, thực nhận 48 túi

        let total_source_cost = source_qty * source_cost;
        assert_eq!(total_source_cost, 500_000.0);

        // Giá vốn mới của 1 túi lẻ sau hao hụt = 500,000 / 48 = 10,416.67
        let new_dest_cost = total_source_cost / dest_actual_qty;
        assert_eq!((new_dest_cost * 100.0).round() / 100.0, 10416.67);
    }

    #[test]
    fn test_inventory_audit_discrepancy_logic() {
        let system_stock: f64 = 100.0;
        let actual_stock_surplus: f64 = 105.0; // Thừa 5 cái
        let actual_stock_deficit: f64 = 92.0;  // Hụt 8 cái

        let discrepancy_surplus = actual_stock_surplus - system_stock;
        assert_eq!(discrepancy_surplus, 5.0);

        let discrepancy_deficit = actual_stock_deficit - system_stock;
        assert_eq!(discrepancy_deficit, -8.0);
    }

    #[test]
    fn test_remote_scan_queue_fifo_processing() {
        let mut queue: Vec<(&str, bool)> = vec![
            ("893001", false),
            ("893002", false),
            ("893003", false),
        ];

        // Pop earliest unprocessed scan
        let first_unprocessed = queue.iter_mut().find(|x| !x.1);
        assert!(first_unprocessed.is_some());
        let item = first_unprocessed.unwrap();
        assert_eq!(item.0, "893001");
        item.1 = true;

        // Pop next
        let second_unprocessed = queue.iter_mut().find(|x| !x.1);
        assert!(second_unprocessed.is_some());
        let item2 = second_unprocessed.unwrap();
        assert_eq!(item2.0, "893002");
        item2.1 = true;

        // Remaining
        let remaining: Vec<&str> = queue.iter().filter(|x| !x.1).map(|x| x.0).collect();
        assert_eq!(remaining, vec!["893003"]);
    }

    #[tokio::test]
    async fn test_edge_tts_fetch() {
        let result = backend_rust::routes::tts::fetch_edge_tts_rust("181000", "vi-VN-HoaiMyNeural", "+0%", "+0Hz").await;
        println!("Edge TTS Result: {:?}", result.as_ref().map(|b| b.len()));
        if let Err(ref e) = result {
            println!("Edge TTS Error detail: {:?}", e);
        }
        assert!(result.is_ok(), "Edge TTS should return valid audio bytes");
    }

    #[tokio::test]
    async fn test_active_ingredient_scan_and_compatibility() {
        use sqlx::sqlite::SqlitePoolOptions;
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory sqlite pool");

        // Khởi tạo schema và tri thức hoạt chất
        backend_rust::db::ensure_schema(&pool).await.expect("Failed to ensure schema");
        backend_rust::routes::active_ingredient::init_active_ingredient_knowledge(&pool)
            .await
            .expect("Failed to init active ingredient knowledge");

        // Thêm sản phẩm giả lập vào kho
        sqlx::query(
            "INSERT INTO product (id, name, active_ingredient, stock, sale_price, unit) VALUES 
             (1, 'Thuốc trừ sâu Radiant 60SC', 'Spinetoram 60g/l', 15.0, 120000.0, 'Chai'),
             (2, 'Confidor 100SL', 'Imidacloprid 100g/l', 20.0, 85000.0, 'Chai'),
             (3, 'Amistar Top 325SC', 'Azoxystrobin 200g/l + Difenoconazole 125g/l', 10.0, 250000.0, 'Chai'),
             (4, 'TAKIWA BMC', 'Metaflumizone', 110.0, 220000.0, 'Chai')"
        )
        .execute(&pool)
        .await
        .expect("Failed to insert sample products");

        // Quét câu hỏi về bọ trĩ
        let result = backend_rust::routes::active_ingredient::scan_query_and_find_compatible_options(
            &pool,
            "Vườn ớt bị bọ trĩ nặng kháng thuốc cần phối hợp thuốc gì"
        )
        .await
        .expect("Scan query failed");

        // Kiểm tra kết quả
        assert!(!result.matched_targets.is_empty(), "Should match bọ trĩ active ingredients");
        assert!(!result.compatible_synergies.is_empty(), "Should have compatible synergies");
        assert!(!result.all_usable_products.is_empty(), "Should retrieve usable products from warehouse");
        
        let found_radiant = result.all_usable_products.iter().any(|p| p.name.contains("Radiant"));
        assert!(found_radiant, "Should propose Radiant (Spinetoram) for bọ trĩ");

        let found_amistar = result.all_usable_products.iter().any(|p| p.name.contains("Amistar"));
        assert!(!found_amistar, "Thuốc bệnh Amistar Top TUYỆT ĐỐI KHÔNG ĐƯỢC đề xuất khi hỏi về bọ trĩ");

        // Quét câu hỏi về sâu xanh (phải đề xuất Metaflumizone / TAKIWA BMC)
        let res_sau_xanh = backend_rust::routes::active_ingredient::scan_query_and_find_compatible_options(
            &pool,
            "Có thuốc nào trị sâu xanh ăn lá không"
        )
        .await
        .expect("Scan sau xanh query failed");

        let found_takiwa = res_sau_xanh.all_usable_products.iter().any(|p| p.name.contains("TAKIWA BMC"));
        assert!(found_takiwa, "Thuốc TAKIWA BMC (Metaflumizone) PHẢI ĐƯỢC đề xuất khi hỏi về sâu xanh");

        // Quét câu hỏi về bệnh thán thư
        let res_disease = backend_rust::routes::active_ingredient::scan_query_and_find_compatible_options(
            &pool,
            "Thanh long bị thán thư cành và nứt đốm nâu"
        )
        .await
        .expect("Scan disease query failed");

        let found_amistar_in_disease = res_disease.all_usable_products.iter().any(|p| p.name.contains("Amistar"));
        assert!(found_amistar_in_disease, "Thuốc bệnh Amistar Top PHẢI ĐƯỢC đề xuất khi hỏi về thán thư");

        let found_radiant_in_disease = res_disease.all_usable_products.iter().any(|p| p.name.contains("Radiant"));
        assert!(!found_radiant_in_disease, "Thuốc sâu Radiant TUYỆT ĐỐI KHÔNG ĐƯỢC đề xuất khi hỏi về bệnh thán thư");
    }

    #[test]
    fn test_detect_period_quarters_years_months() {
        use backend_rust::routes::ai_analytics::detect_query_period;
        use chrono::NaiveDate;

        let today = NaiveDate::from_ymd_opt(2026, 9, 24).unwrap();

        // 1. Quý 1 năm 2026
        let p_q1 = detect_query_period("bao cao doanh thu quy 1 nam 2026", &today).unwrap();
        assert_eq!(p_q1.label, "Quý 1 năm 2026");
        assert_eq!(p_q1.start_d, "2026-01-01");
        assert_eq!(p_q1.end_d, "2026-03-31");
        assert!(p_q1.is_quarter_or_year);

        // 2. Q2
        let p_q2 = detect_query_period("tong ket q2", &today).unwrap();
        assert_eq!(p_q2.label, "Quý 2 năm 2026");
        assert_eq!(p_q2.start_d, "2026-04-01");
        assert_eq!(p_q2.end_d, "2026-06-30");

        // 3. Quý này (tháng 9 là Q3)
        let p_curr_q = detect_query_period("tinh hinh quy nay the nao", &today).unwrap();
        assert_eq!(p_curr_q.label, "Quý 3 năm 2026");
        assert_eq!(p_curr_q.start_d, "2026-07-01");
        assert_eq!(p_curr_q.end_d, "2026-09-30");

        // 4. Quý trước (tháng 9 -> Quý 2)
        let p_last_q = detect_query_period("so sanh voi quy truoc", &today).unwrap();
        assert_eq!(p_last_q.label, "Quý 2 năm 2026");
        assert_eq!(p_last_q.start_d, "2026-04-01");
        assert_eq!(p_last_q.end_d, "2026-06-30");

        // 5. Cả năm 2025
        let p_2025 = detect_query_period("tong doanh thu ca nam 2025", &today).unwrap();
        assert_eq!(p_2025.label, "Cả năm 2025");
        assert_eq!(p_2025.start_d, "2025-01-01");
        assert_eq!(p_2025.end_d, "2025-12-31");
        assert!(p_2025.is_quarter_or_year);

        // 6. Năm ngoái
        let p_last_year = detect_query_period("nam ngoai ban duoc bao nhieu tien", &today).unwrap();
        assert_eq!(p_last_year.label, "Cả năm 2025");
        assert_eq!(p_last_year.start_d, "2025-01-01");
        assert_eq!(p_last_year.end_d, "2025-12-31");

        // 7. Tháng 8 năm 2025
        let p_m8 = detect_query_period("thang 8/2025 loi nhuan bao nhieu", &today).unwrap();
        assert!(!p_m8.is_quarter_or_year);
    }

    #[tokio::test]
    async fn test_shipping_stock_deduct_and_restore_fifo() {
        use sqlx::sqlite::SqlitePoolOptions;
        use backend_rust::routes::order::{deduct_product_stock_fifo, restore_product_stock_fifo};

        let pool = SqlitePoolOptions::new()
            .connect("sqlite::memory:")
            .await
            .unwrap();

        // Create minimal schema for product and stock_batch
        sqlx::query(
            "CREATE TABLE product (
                id INTEGER PRIMARY KEY,
                name TEXT,
                code TEXT,
                unit TEXT,
                secondary_unit TEXT,
                multiplier REAL,
                cost_price REAL,
                sale_price REAL,
                stock REAL,
                expiry_date TEXT,
                active_ingredient TEXT,
                brand TEXT,
                is_combo BOOLEAN,
                is_active BOOLEAN,
                latest_audit TEXT,
                category_id INTEGER,
                accounting_price REAL,
                accounting_stock REAL,
                latest_cost_price REAL,
                bulk_quantity REAL,
                bulk_price REAL,
                alias TEXT,
                min_stock REAL
            );"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE stock_batch (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                purchase_order_id INTEGER,
                original_quantity REAL,
                current_quantity REAL,
                cost_price REAL,
                created_at DATETIME
            );"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE combo_item (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                combo_id INTEGER,
                product_id INTEGER,
                quantity REAL
            );"
        )
        .execute(&pool)
        .await
        .unwrap();

        // Insert initial product with stock = 30
        sqlx::query(
            "INSERT INTO product (id, name, stock, cost_price, is_combo) VALUES (1, 'Thuốc Test', 30.0, 10000.0, 0)"
        )
        .execute(&pool)
        .await
        .unwrap();

        // Insert 2 batches: batch 1 (10 units, cost 10k), batch 2 (20 units, cost 12k)
        sqlx::query(
            "INSERT INTO stock_batch (id, product_id, purchase_order_id, original_quantity, current_quantity, cost_price, created_at)
             VALUES (1, 1, 1, 10.0, 10.0, 10000.0, '2026-01-01 00:00:00')"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO stock_batch (id, product_id, purchase_order_id, original_quantity, current_quantity, cost_price, created_at)
             VALUES (2, 1, 2, 20.0, 20.0, 12000.0, '2026-01-02 00:00:00')"
        )
        .execute(&pool)
        .await
        .unwrap();

        // 1. Initial State: stock is 30.0, batches 10.0 and 20.0
        // Simulating Shipping order: stock is NOT deducted yet.
        let mut conn = pool.acquire().await.unwrap();

        // 2. Deliver 15 units from Shipping Panel
        deduct_product_stock_fifo(&mut conn, 1, 15.0).await.unwrap();

        let stock: f64 = sqlx::query_scalar("SELECT stock FROM product WHERE id = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(stock, 15.0);

        let b1_curr: f64 = sqlx::query_scalar("SELECT current_quantity FROM stock_batch WHERE id = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        let b2_curr: f64 = sqlx::query_scalar("SELECT current_quantity FROM stock_batch WHERE id = 2")
            .fetch_one(&pool)
            .await
            .unwrap();
        // Batch 1 (10 units) depleted, Batch 2 took 5 units -> 15 units remaining
        assert_eq!(b1_curr, 0.0);
        assert_eq!(b2_curr, 15.0);

        // 3. User reverts order back to Shipping (undo)
        restore_product_stock_fifo(&mut conn, 1, 15.0).await.unwrap();

        let stock_restored: f64 = sqlx::query_scalar("SELECT stock FROM product WHERE id = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(stock_restored, 30.0);

        let b1_restored: f64 = sqlx::query_scalar("SELECT current_quantity FROM stock_batch WHERE id = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        let b2_restored: f64 = sqlx::query_scalar("SELECT current_quantity FROM stock_batch WHERE id = 2")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(b1_restored, 10.0);
        assert_eq!(b2_restored, 20.0);
    }
}



