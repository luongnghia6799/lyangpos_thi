import os
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone, timedelta

def utc_now():
    # Returns naive datetime in VN Time (UTC+7) if on Cloud, else system time
    if os.environ.get('DATABASE_URL') and 'postgres' in os.environ.get('DATABASE_URL'):
        utc = datetime.now(timezone.utc)
        return utc.astimezone(timezone(timedelta(hours=7))).replace(tzinfo=None)
    return datetime.now()

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='User') # 'Admin', 'User'
    created_at = db.Column(db.DateTime, default=utc_now)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'display_name': self.display_name,
            'role': self.role
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50)) # Tên icon từ Lucide (vd: SprayCan, Sprout)
    
    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon': self.icon
        }

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50)) # Mã combo / Mã SP
    unit = db.Column(db.String(20), nullable=True)
    secondary_unit = db.Column(db.String(20)) # Quy cách phụ (vd: Thùng)
    multiplier = db.Column(db.Float, default=1) # VD: 1 thùng = 20 chai
    cost_price = db.Column(db.Float, default=0)
    sale_price = db.Column(db.Float, default=0)
    stock = db.Column(db.Float, default=0) # Changed from Integer to Float for weight/retail
    expiry_date = db.Column(db.String(50)) # Hạn sử dụng
    active_ingredient = db.Column(db.String(255)) # Hoạt chất
    brand = db.Column(db.String(100)) # Hãng / Thương hiệu
    is_combo = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    latest_audit = db.Column(db.DateTime) # Track the last time this product was audited
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    
    # Accounting fields
    accounting_price = db.Column(db.Float, default=0)
    accounting_stock = db.Column(db.Float, default=0)
    latest_cost_price = db.Column(db.Float, default=0)
    
    # Volume Pricing fields
    bulk_quantity = db.Column(db.Float, nullable=True)
    bulk_price = db.Column(db.Float, nullable=True)
    alias = db.Column(db.String(100), nullable=True)
    min_stock = db.Column(db.Float, default=0) # Mức tồn kho tối thiểu cảnh báo cần nhập hàng
    def to_dict(self):
        # Calculate average cost from active batches for UI/Estimation
        active_batches = [b for b in self.batches if b.current_quantity > 0]
        ui_cost_price = self.cost_price
        if active_batches:
            total_qty = sum(b.current_quantity for b in active_batches)
            if total_qty > 0:
                ui_cost_price = sum(b.current_quantity * b.cost_price for b in active_batches) / total_qty

        # Latest stock entry info (Most recent batch)
        latest_entry = None
        # Use stored latest_cost_price if available, else fallback to dynamic avg cost
        latest_cost = self.latest_cost_price or ui_cost_price
        
        # We still look at recent_batch for the date/entry info
        recent_batch = StockBatch.query.filter_by(product_id=self.id).order_by(StockBatch.created_at.desc()).first()
        if recent_batch:
            # Only update if the batch has a valid price, or if our current latest_cost is 0
            if (recent_batch.cost_price and recent_batch.cost_price > 0) or not latest_cost:
                latest_cost = recent_batch.cost_price
            latest_entry = {
                'date': recent_batch.created_at.strftime('%d/%m/%Y'),
                'quantity': recent_batch.original_quantity or 0
            }

        # Final fallback to self.cost_price if it's still 0 but we have a static cost price
        if not latest_cost:
            latest_cost = self.cost_price

        d = {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'unit': self.unit,
            'secondary_unit': self.secondary_unit,
            'multiplier': self.multiplier,
            'cost_price': ui_cost_price,
            'latest_cost_price': latest_cost,
            'sale_price': self.sale_price,
            'stock': self.stock,
            'min_stock': self.min_stock if self.min_stock is not None else 0,
            'expiry_date': self.expiry_date,
            'active_ingredient': self.active_ingredient,
            'brand': self.brand,
            'is_combo': self.is_combo,
            'is_active': self.is_active,
            'current_stock': self.stock,
            'latest_audit': self.latest_audit.isoformat() if self.latest_audit else None,
            'latest_stock_entry': latest_entry,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else 'Chưa phân loại',
            'category_icon': self.category.icon if self.category else 'Package', # Icon mặc định
            'accounting_price': self.accounting_price or 0,
            'accounting_stock': self.accounting_stock or 0,
            'bulk_quantity': self.bulk_quantity,
            'bulk_price': self.bulk_price,
            'alias': self.alias
        }
        
        if self.is_combo and hasattr(self, 'combo_items') and self.combo_items:
            # Dynamically calculate for combos based on component costs
            total_cost = 0
            total_latest_cost = 0
            stocks = []
            for item in self.combo_items:
                if item.product:
                    # Component average cost
                    c_batches = [b for b in item.product.batches if b.current_quantity > 0]
                    c_cost = item.product.cost_price
                    if c_batches:
                        c_total_q = sum(b.current_quantity for b in c_batches)
                        if c_total_q > 0:
                            c_cost = sum(b.current_quantity * b.cost_price for b in c_batches) / c_total_q
                    
                    # Component latest cost
                    cl_cost = item.product.cost_price
                    if item.product.batches:
                        cl_cost = item.product.batches[-1].cost_price

                    total_cost += (c_cost or 0) * (item.quantity or 0)
                    total_latest_cost += (cl_cost or 0) * (item.quantity or 0)
                    stocks.append((item.product.stock or 0) // (item.quantity or 1))
            
            d['cost_price'] = total_cost
            d['latest_cost_price'] = total_latest_cost
            d['stock'] = min(stocks) if stocks else 0
            d['current_stock'] = d['stock']
            
        return d

class ComboItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    combo_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)

    combo = db.relationship('Product', foreign_keys=[combo_id], backref=db.backref('combo_items', cascade='all, delete-orphan'))
    product = db.relationship('Product', foreign_keys=[product_id])

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name,
            'quantity': self.quantity
        }




class Partner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False, default='Customer') # Deprecated but kept for compat
    is_customer = db.Column(db.Boolean, default=True)
    is_supplier = db.Column(db.Boolean, default=False)
    cccd = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    debt_balance = db.Column(db.Float, default=0)

    def to_dict(self):
        # We find the opening balance order value if it exists
        opening_order = next((o for o in self.orders if o.display_id in ['#NODAU', 'NODAU']), None)
        opening_bal = 0
        if opening_order:
            opening_bal = opening_order.total_amount if opening_order.type == 'Sale' else -opening_order.total_amount

        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'is_customer': self.is_customer,
            'is_supplier': self.is_supplier,
            'cccd': self.cccd,
            'phone': self.phone,
            'address': self.address,
            'debt_balance': self.debt_balance,
            'opening_balance': opening_bal
        }

class CashVoucher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=utc_now, index=True)
    note = db.Column(db.String(500))
    type = db.Column(db.String(50), default='Payment', index=True) # Payment to Supplier, Expense, etc.
    source = db.Column(db.String(50), default='manual', index=True) # 'manual' or 'settlement'
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
    
    partner = db.relationship('Partner', backref=db.backref('vouchers', lazy='selectin'))
    order = db.relationship('Order', foreign_keys=[order_id])

    def to_dict(self):
        return {
            'id': self.id,
            'partner_id': self.partner_id,
            'partner_name': self.partner.name if self.partner else 'Khác',
            'amount': self.amount,
            'date': self.date.isoformat(),
            'note': self.note,
            'type': self.type,
            'source': self.source,
            'order_id': self.order_id,
            'order_display_id': self.order.display_id if self.order else None
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=utc_now, index=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=True, index=True)
    total_amount = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(50)) # 'Cash', 'Debt', etc.
    type = db.Column(db.String(20), index=True) # 'Sale' or 'Purchase'
    note = db.Column(db.String(500))
    amount_paid = db.Column(db.Float, default=0)
    old_debt = db.Column(db.Float, default=0)
    display_id = db.Column(db.String(50), index=True)
    status = db.Column(db.String(20), default='Pending', index=True) # 'Pending', 'Completed'
    shipping_status = db.Column(db.String(20), index=True) # 'Pending', 'Shipping', 'Delivered'
    shipping_address = db.Column(db.String(500))
    shipping_phone = db.Column(db.String(50))
    delivery_date = db.Column(db.DateTime, index=True)
    cash_given = db.Column(db.Float, default=0)
    created_by = db.Column(db.String(100), nullable=True) # ID/Name of person who created this order
    is_duplicate_checked = db.Column(db.Boolean, default=False) # Mark as manually verified
    is_consignment = db.Column(db.Boolean, default=False) # New column
    
    partner = db.relationship('Partner', backref=db.backref('orders', lazy='selectin'))
    details = db.relationship('OrderDetail', backref='order', cascade='all, delete-orphan', lazy='selectin')

    def to_dict(self):
        p_dict = {
            'id': self.partner.id,
            'name': self.partner.name,
            'phone': self.partner.phone,
            'address': self.partner.address,
            'debt_balance': self.partner.debt_balance
        } if self.partner else None

        default_partner = 'Nhà cung cấp vãng lai' if self.type == 'Purchase' else 'Khách Lẻ'

        return {
            'id': self.id,
            'display_id': self.display_id or str(self.id),
            'date': self.date.isoformat(),
            'partner_id': self.partner_id,
            'partner_name': self.partner.name if self.partner else default_partner,
            'partner_address': self.partner.address if self.partner else '',
            'partner_phone': self.partner.phone if self.partner else '',
            'partner': p_dict,
            'total_amount': self.total_amount,
            'amount_paid': self.amount_paid,
            'payment_method': self.payment_method,
            'type': self.type,
            'note': self.note,
            'old_debt': self.old_debt,
            'status': self.status,
            'shipping_status': self.shipping_status,
            'shipping_address': self.shipping_address,
            'shipping_phone': self.shipping_phone,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'cash_given': self.cash_given or 0,
            'created_by': self.created_by,
            'is_consignment': self.is_consignment,
            'details': [d.to_dict() for d in self.details]
        }

class OrderDetail(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=True, index=True)
    product_name_override = db.Column(db.String(200)) # To store custom spec/name
    quantity = db.Column(db.Integer, nullable=False)
    shipped_quantity = db.Column(db.Float, default=0)
    price = db.Column(db.Float, nullable=False)
    cost_price = db.Column(db.Float) # Locked average cost at sale time

    product = db.relationship('Product', lazy='selectin')

    def to_dict(self):
        p_dict = self.product.to_dict() if self.product else {}
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name_override or (self.product.name if self.product else 'Sản phẩm đã xóa'),
            'unit': self.product.unit if self.product else 'ĐV',
            'product_unit': self.product.unit if self.product else 'ĐV',
            'secondary_unit': self.product.secondary_unit if self.product else '',
            'multiplier': self.product.multiplier if self.product else 1,
            'quantity': self.quantity,
            'shipped_quantity': self.shipped_quantity or 0,
            'price': self.price,
            'unit_price': self.price,
            'total_price': self.quantity * self.price,
            'cost_price': self.cost_price if self.cost_price is not None else p_dict.get('cost_price', 0), # FIFO cost if available, else current cost
            'latest_cost_price': p_dict.get('latest_cost_price', 0),
            'stock': p_dict.get('current_stock', 0),
            'active_ingredient': p_dict.get('active_ingredient', ''),
            'specification': p_dict.get('specification', ''),
            'is_combo': self.product.is_combo if self.product else False,
            'combo_items': [ci.to_dict() for ci in self.product.combo_items] if (self.product and self.product.is_combo) else []
        }

class StockBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False, index=True)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True, index=True)
    original_quantity = db.Column(db.Float, nullable=False)
    current_quantity = db.Column(db.Float, nullable=False)
    cost_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, index=True)

    product = db.relationship('Product', backref=db.backref('batches', cascade='all, delete-orphan', order_by='StockBatch.created_at'))
    purchase_order = db.relationship('Order')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'purchase_order_id': self.purchase_order_id,
            'original_quantity': self.original_quantity,
            'current_quantity': self.current_quantity,
            'cost_price': self.cost_price,
            'created_at': self.created_at.isoformat()
        }
class CustomerPrice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    
    partner = db.relationship('Partner', backref=db.backref('custom_prices', cascade='all, delete-orphan'))
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'partner_id': self.partner_id,
            'product_id': self.product_id,
            'price': self.price
        }

class AppSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(50), unique=True, nullable=False)
    setting_value = db.Column(db.Text)

    def to_dict(self):
        return {
            'key': self.setting_key,
            'value': self.setting_value
        }

class PrintTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(50), nullable=False) # 'Sale', 'Purchase', 'History', 'CashVoucher'
    is_default = db.Column(db.Boolean, default=False)
    config = db.Column(db.Text) # JSON string of all settings
    content_config = db.Column(db.Text) # JSON string of what to show/hide

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'module': self.module,
            'is_default': self.is_default,
            'config': self.config,
            'content_config': self.content_config
        }
class BankAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bank_name = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(50), nullable=False)
    account_holder = db.Column(db.String(100))
    balance = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=utc_now)

    def to_dict(self):
        return {
            'id': self.id,
            'bank_name': self.bank_name,
            'account_number': self.account_number,
            'account_holder': self.account_holder,
            'balance': self.balance,
            'created_at': self.created_at.isoformat()
        }

class BankTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('bank_account.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=utc_now, index=True)
    type = db.Column(db.String(20)) # 'Deposit', 'Withdrawal', 'Transfer'
    note = db.Column(db.String(500))
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=True) # Optional link to partner
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
    
    account = db.relationship('BankAccount', backref=db.backref('transactions', cascade='all, delete-orphan'))
    partner = db.relationship('Partner')
    order = db.relationship('Order')

    def to_dict(self):
        return {
            'id': self.id,
            'account_id': self.account_id,
            'bank_name': self.account.bank_name,
            'amount': self.amount,
            'date': self.date.isoformat(),
            'type': self.type,
            'note': self.note,
            'partner_name': self.partner.name if self.partner else None,
            'order_id': self.order_id
        }

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.DateTime, default=utc_now)
    is_active = db.Column(db.Boolean, default=True)
    gift_types = db.Column(db.String(200)) # Comma separated types: "Via,Bánh,Tiền"
    icon = db.Column(db.String(50)) # Lucide icon name

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'date': self.date.isoformat(),
            'is_active': self.is_active,
            'gift_types': self.gift_types,
            'icon': self.icon
        }

class EventLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    partner_id = db.Column(db.Integer, db.ForeignKey('partner.id'), nullable=False)
    completed_at = db.Column(db.DateTime, default=utc_now)
    note = db.Column(db.String(200))
    gift_type = db.Column(db.String(50)) # The specific gift given
    
    event = db.relationship('Event', backref=db.backref('logs', cascade='all, delete-orphan'))
    partner = db.relationship('Partner', backref=db.backref('event_logs', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'partner_id': self.partner_id,
            'completed_at': self.completed_at.isoformat(),
            'note': self.note,
            'gift_type': self.gift_type
        }
class InventoryAudit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=utc_now, index=True)
    note = db.Column(db.String(500))
    status = db.Column(db.String(20), default='Completed') # 'Completed', 'Draft'
    
    details = db.relationship('InventoryAuditDetail', backref='audit', cascade='all, delete-orphan', lazy='selectin')

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'note': self.note,
            'status': self.status,
            'details': [d.to_dict() for d in self.details]
        }

class InventoryAuditDetail(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    audit_id = db.Column(db.Integer, db.ForeignKey('inventory_audit.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False, index=True)
    system_stock = db.Column(db.Float, default=0)
    actual_stock = db.Column(db.Float, default=0)
    discrepancy = db.Column(db.Float, default=0)

    product = db.relationship('Product', lazy='selectin')

    def to_dict(self):
        return {
            'id': self.id,
            'audit_id': self.audit_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else 'Sản phẩm đã xóa',
            'unit': self.product.unit if self.product else '',
            'secondary_unit': self.product.secondary_unit if self.product else None,
            'multiplier': self.product.multiplier if (self.product and self.product.multiplier) else 1,
            'system_stock': self.system_stock,
            'actual_stock': self.actual_stock,
            'discrepancy': self.discrepancy
        }

class InventoryConversion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=utc_now, index=True)
    source_product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    dest_product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    source_qty = db.Column(db.Float, nullable=False) # Số bao xuất
    multiplier = db.Column(db.Float, nullable=False) # Tỷ lệ quy đổi tại thời điểm đó
    dest_qty_expected = db.Column(db.Float, nullable=False) # Dự kiến (qty * mult)
    dest_qty_actual = db.Column(db.Float, nullable=False) # Thực nhận (sau hao hụt)
    cost_price_at_conversion = db.Column(db.Float) # Giá vốn của 1 đơn vị nguồn
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    note = db.Column(db.String(500))

    source_product = db.relationship('Product', foreign_keys=[source_product_id])
    dest_product = db.relationship('Product', foreign_keys=[dest_product_id])
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'source_product_id': self.source_product_id,
            'source_product_name': self.source_product.name if self.source_product else 'N/A',
            'dest_product_id': self.dest_product_id,
            'dest_product_name': self.dest_product.name if self.dest_product else 'N/A',
            'source_qty': self.source_qty,
            'multiplier': self.multiplier,
            'dest_qty_expected': self.dest_qty_expected,
            'dest_qty_actual': self.dest_qty_actual,
            'cost_price_at_conversion': self.cost_price_at_conversion,
            'note': self.note,
            'user_display_name': self.user.display_name if self.user else 'Hệ thống'
        }

class AccountingTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    file_path = db.Column(db.String(255)) # Path to the .xlsx file
    start_row = db.Column(db.Integer, default=1) # Row where data starts
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=utc_now)
    
    mappings = db.relationship('AccountingMapping', backref='template', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'file_path': self.file_path,
            'start_row': self.start_row,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'mappings': [m.to_dict() for m in self.mappings]
        }

class AccountingMapping(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('accounting_template.id'), nullable=False)
    column_letter = db.Column(db.String(5), nullable=False) # A, B, C...
    header_name = db.Column(db.String(100)) # e.g. "Tên sản phẩm"
    source_type = db.Column(db.String(20), nullable=False) # 'field', 'static', 'index'
    source_value = db.Column(db.String(100)) # 'code', 'product_name', 'price', etc. or static text

    def to_dict(self):
        return {
            'id': self.id,
            'column_letter': self.column_letter,
            'header_name': self.header_name,
            'source_type': self.source_type,
            'source_value': self.source_value
        }

class RemoteScanQueue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(255), nullable=False)
    is_processed = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=utc_now, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'barcode': self.barcode,
            'is_processed': self.is_processed,
            'created_at': self.created_at.isoformat()
        }
