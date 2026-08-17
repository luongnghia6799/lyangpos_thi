import logging
from sqlalchemy import text, inspect

logger = logging.getLogger(__name__)

def ensure_schema(engine):
    """
    Hệ thống tự động kiểm tra và cập nhật cấu trúc Database (Auto-Migration).
    Đảm bảo mọi cột trong models.py đều có mặt trong database thực tế.
    """
    inspector = inspect(engine)
    
    # Định nghĩa cấu trúc các cột/bảng quan trọng cần kiểm tra
    # Cấu trúc: 'tên_bảng': [('tên_cột', 'loại_dữ_liệu', 'giá_trị_mặc_định')]
    schema_definition = {
        'product': [
            ('code', 'TEXT', 'NULL'),
            ('unit', 'VARCHAR(20)', "'Cái'"),
            ('secondary_unit', 'VARCHAR(20)', 'NULL'),
            ('multiplier', 'FLOAT', '1'),
            ('cost_price', 'FLOAT', '0'),
            ('sale_price', 'FLOAT', '0'),
            ('stock', 'FLOAT', '0'),
            ('expiry_date', 'VARCHAR(50)', 'NULL'),
            ('active_ingredient', 'VARCHAR(255)', 'NULL'),
            ('brand', 'VARCHAR(100)', 'NULL'),
            ('is_combo', 'BOOLEAN', '0'),
            ('is_active', 'BOOLEAN', '1'),
            ('latest_audit', 'DATETIME', 'NULL'),
            ('category_id', 'INTEGER', 'NULL'),
            ('accounting_price', 'FLOAT', '0'),
            ('accounting_stock', 'FLOAT', '0'),
            ('latest_cost_price', 'FLOAT', '0'),
            ('bulk_quantity', 'FLOAT', 'NULL'),
            ('bulk_price', 'FLOAT', 'NULL'),
            ('alias', 'VARCHAR(100)', 'NULL'),
            ('min_stock', 'FLOAT', '0'),
        ],
        'partner': [
            ('is_customer', 'BOOLEAN', '1'),
            ('is_supplier', 'BOOLEAN', '0'),
            ('cccd', 'VARCHAR(20)', 'NULL'),
            ('phone', 'VARCHAR(20)', 'NULL'),
            ('address', 'VARCHAR(200)', 'NULL'),
            ('debt_balance', 'FLOAT', '0'),
        ],
        'order': [
            ('display_id', 'VARCHAR(50)', 'NULL'),
            ('status', 'VARCHAR(20)', "'Pending'"),
            ('shipping_status', 'VARCHAR(20)', 'NULL'),
            ('shipping_address', 'VARCHAR(500)', 'NULL'),
            ('shipping_phone', 'VARCHAR(50)', 'NULL'),
            ('delivery_date', 'DATETIME', 'NULL'),
            ('cash_given', 'FLOAT', '0'),
            ('amount_paid', 'FLOAT', '0'),
            ('old_debt', 'FLOAT', '0'),
            ('created_by', 'VARCHAR(100)', 'NULL'),
            ('is_duplicate_checked', 'BOOLEAN', '0'),
            ('is_consignment', 'BOOLEAN', '0'),
            ('is_invoiced', 'BOOLEAN', '0'),
            ('invoice_no', 'VARCHAR(100)', 'NULL'),
            ('invoice_date', 'DATETIME', 'NULL'),
            ('invoice_note', 'VARCHAR(500)', 'NULL'),
        ],
        'order_detail': [
            ('product_name_override', 'VARCHAR(200)', 'NULL'),
            ('shipped_quantity', 'FLOAT', '0'),
            ('cost_price', 'FLOAT', 'NULL'),
            ('is_invoiced', 'BOOLEAN', '0'),
            ('invoiced_quantity', 'FLOAT', '0'),
            ('invoice_no', 'VARCHAR(100)', 'NULL'),
        ],
        'cash_voucher': [
            ('source', 'VARCHAR(50)', "'manual'"),
            ('order_id', 'INTEGER', 'NULL'),
            ('type', 'VARCHAR(50)', "'Payment'"),
        ],
        'event': [
            ('gift_types', 'VARCHAR(200)', 'NULL'),
            ('icon', 'VARCHAR(50)', 'NULL'),
        ],
        'event_log': [
            ('gift_type', 'VARCHAR(50)', 'NULL'),
            ('note', 'VARCHAR(200)', 'NULL'),
        ],
        'inventory_audit': [
            ('status', 'VARCHAR(20)', "'Completed'"),
        ],
        'inventory_conversion': [
            ('cost_price_at_conversion', 'FLOAT', 'NULL'),
            ('user_id', 'INTEGER', 'NULL'),
            ('note', 'VARCHAR(500)', 'NULL'),
        ],
        'bank_account': [
            ('account_holder', 'VARCHAR(100)', 'NULL'),
            ('balance', 'FLOAT', '0'),
        ],
        'bank_transaction': [
            ('type', 'VARCHAR(20)', 'NULL'),
            ('partner_id', 'INTEGER', 'NULL'),
            ('order_id', 'INTEGER', 'NULL'),
        ],
        'accounting_template': [
            ('name', 'VARCHAR(100)', 'NULL'),
            ('file_path', 'VARCHAR(255)', 'NULL'),
            ('start_row', 'INTEGER', '1'),
            ('is_active', 'BOOLEAN', '1'),
            ('created_at', 'DATETIME', 'NULL'),
        ],
        'accounting_mapping': [
            ('template_id', 'INTEGER', 'NULL'),
            ('column_letter', 'VARCHAR(5)', 'NULL'),
            ('header_name', 'VARCHAR(100)', 'NULL'),
            ('source_type', 'VARCHAR(20)', 'NULL'),
            ('source_value', 'VARCHAR(100)', 'NULL'),
        ]
    }

    try:
        with engine.begin() as conn:
            for table_name, columns in schema_definition.items():
                # Kiểm tra xem bảng có tồn tại không
                if table_name not in inspector.get_table_names():
                    # Nếu bảng chưa có, SQLAlchemy db.create_all() sẽ lo phần tạo bảng mới.
                    # Migration manager chỉ lo việc thêm cột cho bảng ĐÃ CÓ.
                    continue
                
                # Lấy danh sách cột hiện tại của bảng
                existing_columns = [c['name'] for c in inspector.get_columns(table_name)]
                
                for col_name, col_type, col_default in columns:
                    if col_name not in existing_columns:
                        try:
                            logger.info(f"Migration: Phat hien thieu cot '{col_name}' trong bang '{table_name}'. Dang them...")
                            
                            alter_cmd = f'ALTER TABLE "{table_name}" ADD COLUMN {col_name} {col_type}'
                            if col_default is not None:
                                alter_cmd += f' DEFAULT {col_default}'
                            
                            conn.execute(text(alter_cmd))
                            logger.info(f"✅ Da them cot '{col_name}' vao bang '{table_name}' thanh cong.")
                        except Exception as inner_e:
                            logger.error(f"❌ Loi khi them cot '{col_name}' vao bang '{table_name}': {inner_e}")
                            
            # Seed categories after migration
            seed_categories(engine)
            
            # Link orphaned stock batches that were not associated with their purchase orders
            try:
                link_orphaned_stock_batches(conn)
            except Exception as e:
                logger.error(f"❌ Loi khi lien ket orphaned stock batches: {e}")
                            
            # Logic đặc biệt: Historical cost locking cho OrderDetail (nếu cần)
            try:
                # Kiểm tra xem có bản ghi nào bị NULL cost_price không
                conn.execute(text("""
                    UPDATE order_detail 
                    SET cost_price = (
                        SELECT cost_price FROM product WHERE product.id = order_detail.product_id
                    )
                    WHERE cost_price IS NULL AND product_id IS NOT NULL
                """))
                
                # Khắc phục lỗi lưu giá vốn = 0đ do bug FIFO cũ
                conn.execute(text("""
                    UPDATE order_detail
                    SET cost_price = (
                        SELECT cost_price 
                        FROM product 
                        WHERE product.id = order_detail.product_id
                    )
                    WHERE cost_price = 0.0 
                      AND product_id IS NOT NULL 
                      AND EXISTS (
                          SELECT 1 
                          FROM product 
                          WHERE product.id = order_detail.product_id 
                            AND product.cost_price > 0.0
                      )
                """))
            except:
                pass

    except Exception as e:
        logger.error(f"❌ Loi nghiem trong trong qua trinh Migration: {e}")

def seed_categories(engine):
    """Khoi tao cac danh muc mac dinh neu chua co"""
    from sqlalchemy import text
    categories = [
        ('Thuốc trừ sâu', 'SprayCan'),
        ('Phân bón', 'Sprout'),
        ('Hạt giống', 'Leaf'),
        ('Dụng cụ', 'Hammer'),
        ('Khác', 'Package')
    ]
    with engine.begin() as conn:
        try:
            res = conn.execute(text("SELECT COUNT(*) FROM category"))
            if res.scalar() == 0:
                logger.info("Seed: Dang khoi tao danh muc mac dinh...")
                for name, icon in categories:
                    conn.execute(text("INSERT INTO category (name, icon) VALUES (:name, :icon)"), {"name": name, "icon": icon})
                logger.info("✅ Da khoi tao danh muc mac dinh thanh cong.")
        except Exception as e:
            logger.error(f"❌ Loi khi seed category: {e}")

def initialize_stock_batches(engine):
    """Khoi tao StockBatch cho cac san pham cu de dam bao tinh nang FIFO hoat dong"""
    from datetime import datetime
    with engine.begin() as conn:
        try:
            res = conn.execute(text("SELECT COUNT(*) FROM stock_batch"))
            if res.scalar() == 0:
                logger.info("Migration: Khoi tao StockBatches cho ton kho hien tai...")
                products = conn.execute(text("SELECT id, stock, cost_price FROM product WHERE stock > 0")).fetchall()
                for p_id, p_stock, p_cost in products:
                    conn.execute(text("""
                        INSERT INTO stock_batch (product_id, original_quantity, current_quantity, cost_price, created_at)
                        VALUES (:p_id, :qty, :qty, :cost, :dt)
                    """), {"p_id": p_id, "qty": p_stock, "cost": p_cost or 0, "dt": datetime.now()})
                logger.info(f"✅ Da tao batch ban dau cho {len(products)} san pham.")
        except Exception as e:
            logger.error(f"Loi khoi tao StockBatch: {e}")

def link_orphaned_stock_batches(conn):
    """
    Finds StockBatch records that have purchase_order_id IS NULL, and matches/links them
    to their corresponding Purchase order based on product_id, quantity, price, and date.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import text
    
    # Get all orphaned stock batches
    orphaned = conn.execute(text("""
        SELECT id, product_id, original_quantity, cost_price, created_at 
        FROM stock_batch 
        WHERE purchase_order_id IS NULL
    """)).fetchall()
    
    if not orphaned:
        return
        
    logger.info(f"Migration: Found {len(orphaned)} orphaned StockBatch records. Attempting to link...")
    linked_count = 0
    
    for b_id, p_id, qty, cost, created_at_str in orphaned:
        # Parse created_at if it's a string, SQLite might store it as a string
        if isinstance(created_at_str, str):
            try:
                # Common SQLite datetime formats
                if '.' in created_at_str:
                    b_date = datetime.strptime(created_at_str.split('+')[0], "%Y-%m-%d %H:%M:%S.%f")
                else:
                    b_date = datetime.strptime(created_at_str.split('+')[0], "%Y-%m-%d %H:%M:%S")
            except Exception:
                continue
        else:
            b_date = created_at_str
        
        # Look for a matching Purchase order and order detail created at a similar time
        # Range: +/- 10 minutes
        min_date = b_date - timedelta(minutes=10)
        max_date = b_date + timedelta(minutes=10)
        
        # Check for direct product matches
        match = conn.execute(text("""
            SELECT o.id 
            FROM "order" o
            JOIN order_detail od ON o.id = od.order_id
            WHERE o.type = 'Purchase'
              AND od.product_id = :p_id
              AND ABS(od.quantity - :qty) < 0.001
              AND ABS(od.price - :cost) < 0.001
              AND o.date BETWEEN :min_date AND :max_date
            ORDER BY ABS(strftime('%s', o.date) - strftime('%s', :b_date)) ASC
            LIMIT 1
        """), {
            "p_id": p_id,
            "qty": qty,
            "cost": cost,
            "min_date": min_date,
            "max_date": max_date,
            "b_date": b_date
        }).fetchone()
        
        if match:
            order_id = match[0]
            conn.execute(text("""
                UPDATE stock_batch 
                SET purchase_order_id = :order_id 
                WHERE id = :b_id
            """), {"order_id": order_id, "b_id": b_id})
            linked_count += 1
            continue
            
        # 2. If no direct match, check by product_id and date proximity (ignoring price/qty because they might have been edited)
        match_relaxed = conn.execute(text("""
            SELECT o.id 
            FROM "order" o
            JOIN order_detail od ON o.id = od.order_id
            WHERE o.type = 'Purchase'
              AND od.product_id = :p_id
              AND o.date BETWEEN :min_date AND :max_date
            ORDER BY ABS(strftime('%s', o.date) - strftime('%s', :b_date)) ASC
            LIMIT 1
        """), {
            "p_id": p_id,
            "min_date": min_date,
            "max_date": max_date,
            "b_date": b_date
        }).fetchone()
        
        if match_relaxed:
            order_id = match_relaxed[0]
            conn.execute(text("""
                UPDATE stock_batch 
                SET purchase_order_id = :order_id 
                WHERE id = :b_id
            """), {"order_id": order_id, "b_id": b_id})
            linked_count += 1
    
    if linked_count > 0:
        logger.info(f"✅ Successfully linked {linked_count} orphaned StockBatch records to their orders.")
        
    # Run cleanup of duplicate batches for the same order
    try:
        cleanup_duplicate_batches(conn)
    except Exception as e:
        logger.error(f"❌ Error during cleanup_duplicate_batches: {e}")

def cleanup_duplicate_batches(conn):
    """
    For each purchase order, if there are multiple StockBatches for the same product,
    but the order only has one detail for that product, keep only the batch that matches
    the current order detail's price, and delete the duplicates.
    """
    from sqlalchemy import text
    
    # Find all orders that have duplicate batches for the same product
    dup_records = conn.execute(text("""
        SELECT purchase_order_id, product_id, COUNT(*) 
        FROM stock_batch 
        WHERE purchase_order_id IS NOT NULL 
        GROUP BY purchase_order_id, product_id 
        HAVING COUNT(*) > 1
    """)).fetchall()
    
    if not dup_records:
        return
        
    logger.info(f"Migration: Found {len(dup_records)} products with duplicate batches in the same purchase order. Cleaning up...")
    deleted_count = 0
    
    for order_id, p_id, count in dup_records:
        # Get all order details for this product in this order
        details = conn.execute(text("""
            SELECT price, quantity 
            FROM order_detail 
            WHERE order_id = :order_id AND product_id = :p_id
        """), {"order_id": order_id, "p_id": p_id}).fetchall()
        
        if not details:
            # If the product was deleted from the order completely, we should delete ALL batches for this product in this order!
            conn.execute(text("""
                DELETE FROM stock_batch 
                WHERE purchase_order_id = :order_id AND product_id = :p_id
            """), {"order_id": order_id, "p_id": p_id})
            deleted_count += count
            continue
            
        # Get all batches for this product in this order
        batches = conn.execute(text("""
            SELECT id, cost_price, original_quantity 
            FROM stock_batch 
            WHERE purchase_order_id = :order_id AND product_id = :p_id
            ORDER BY id ASC
        """), {"order_id": order_id, "p_id": p_id}).fetchall()
        
        if len(batches) <= len(details):
            # Not actually duplicate batches, each corresponds to a separate order detail line
            continue
            
        # Find which batches to keep
        kept_batch_ids = set()
        matched_details = [False] * len(details)
        
        # 1st pass: Match by exact price and quantity
        for b_id, b_price, b_qty in batches:
            for i, (det_price, det_qty) in enumerate(details):
                if not matched_details[i] and abs(b_price - det_price) < 0.001 and abs(b_qty - det_qty) < 0.001:
                    kept_batch_ids.add(b_id)
                    matched_details[i] = True
                    break
                    
        # 2nd pass: Match by exact price only
        for b_id, b_price, b_qty in batches:
            if b_id in kept_batch_ids:
                continue
            for i, (det_price, det_qty) in enumerate(details):
                if not matched_details[i] and abs(b_price - det_price) < 0.001:
                    kept_batch_ids.add(b_id)
                    matched_details[i] = True
                    break
                    
        # 3rd pass: Keep most recent batches for remaining details
        for b_id, b_price, b_qty in reversed(batches):
            if len(kept_batch_ids) >= len(details):
                break
            if b_id not in kept_batch_ids:
                kept_batch_ids.add(b_id)
                
        # Delete the ones not kept
        for b_id, b_price, b_qty in batches:
            if b_id not in kept_batch_ids:
                conn.execute(text("""
                    DELETE FROM stock_batch WHERE id = :b_id
                """), {"b_id": b_id})
                deleted_count += 1
                
    if deleted_count > 0:
        logger.info(f"✅ Successfully deleted {deleted_count} duplicate/orphaned StockBatch records.")
