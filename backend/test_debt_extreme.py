import sys
import os
import unittest
import random
from datetime import datetime, timedelta

# Ensure backend folder is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, recalculate_partner_debt_internal, calculate_partner_ledger, create_opening_balance_order
from models import Partner, Order, OrderDetail, CashVoucher, BankAccount, BankTransaction, Product, Category

class LyangPOSDebtExtremeTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        cls.ctx = app.app_context()
        cls.ctx.push()
        db.create_all()

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.ctx.pop()

    def setUp(self):
        db.session.query(BankTransaction).delete()
        db.session.query(BankAccount).delete()
        db.session.query(CashVoucher).delete()
        db.session.query(OrderDetail).delete()
        db.session.query(Order).delete()
        db.session.query(Partner).delete()
        db.session.query(Product).delete()
        db.session.query(Category).delete()
        db.session.commit()

        self.cat = Category(name="DanhMuc")
        db.session.add(self.cat)
        db.session.commit()

        self.prod = Product(name="SP Test", category_id=self.cat.id, sale_price=100000, cost_price=70000, stock=1000)
        db.session.add(self.prod)
        db.session.commit()

    def create_order(self, partner_id, order_type, total_amount, payment_method='Debt', display_id=None, date=None):
        if date is None:
            date = datetime.now()
        order = Order(
            partner_id=partner_id,
            type=order_type, # 'Sale' or 'Purchase'
            total_amount=total_amount,
            amount_paid=0 if payment_method == 'Debt' else total_amount,
            payment_method=payment_method,
            display_id=display_id or f"ORD_{order_type}_{int(datetime.now().timestamp() * 1000)}",
            date=date,
            status='Completed'
        )
        db.session.add(order)
        db.session.commit()
        recalculate_partner_debt_internal(partner_id)
        return order

    def create_voucher(self, partner_id, voucher_type, amount, note="", source="manual", date=None):
        if date is None:
            date = datetime.now()
        voucher = CashVoucher(
            partner_id=partner_id,
            type=voucher_type, # 'Receipt' (Thu) or 'Payment' (Chi) or 'DebtIncrease'
            amount=amount,
            note=note,
            source=source,
            date=date
        )
        db.session.add(voucher)
        db.session.commit()
        recalculate_partner_debt_internal(partner_id)
        return voucher

    def create_bank_tx(self, partner_id, tx_type, amount, note="", order_id=None, date=None):
        if date is None:
            date = datetime.now()
        account = BankAccount.query.first()
        if not account:
            account = BankAccount(account_number="999999999", bank_name="Vietcombank", balance=50000000)
            db.session.add(account)
            db.session.commit()

        tx = BankTransaction(
            partner_id=partner_id,
            account_id=account.id,
            type=tx_type, # 'Deposit' (Thu) or 'Withdrawal' (Chi)
            amount=amount,
            note=note,
            order_id=order_id,
            date=date
        )
        db.session.add(tx)
        db.session.commit()
        recalculate_partner_debt_internal(partner_id)
        return tx

    # ==================== EXTREME TEST CASES ====================

    def test_extreme_01_customer_overpayment_and_reconsumption(self):
        """EXT-01: Khách trả tiền thừa (Overpayment) -> Thành Mình Nợ Khách -> Khách mua trừ dần về 0"""
        partner = Partner(name="Khách Hàng Overpay", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # 1. Khách mua nợ 500k
        self.create_order(partner.id, 'Sale', 500000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 500000)

        # 2. Khách đưa 1.000.000đ (trả thừa 500k)
        self.create_voucher(partner.id, 'Receipt', 1000000, note="Khách đưa dư 500k")
        db.session.refresh(partner)
        # Số dư phải là -500.000đ (Mình nợ khách 500k)
        self.assertEqual(partner.debt_balance, -500000, "Trả thừa 500k thì debt_balance phải là -500.000đ")

        # 3. Khách quay lại mua đơn hàng 300k (ghi nợ để trừ vào số tiền thừa)
        self.create_order(partner.id, 'Sale', 300000, payment_method='Debt')
        db.session.refresh(partner)
        # -500k + 300k = -200k (Mình còn nợ khách 200k)
        self.assertEqual(partner.debt_balance, -200000, "Sau khi mua 300k, còn dư -200.000đ")

        # 4. Khách mua tiếp 200k ghi nợ -> Vừa vặn hết nợ
        self.create_order(partner.id, 'Sale', 200000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 0, "Sau khi mua thêm 200k, debt_balance = 0đ (Hết nợ)")
        print("[PASS] EXT-01: Khach tra tien thua (Overpayment) -> Minh no khach -> Mua tru dan ve 0d thanh cong!")

    def test_extreme_02_supplier_over_return_and_refund(self):
        """EXT-02: Trả hàng lỗi cho NCC vượt quá số nợ -> NCC nợ lại mình -> NCC hoàn tiền mặt/chuyển khoản"""
        partner = Partner(name="NCC Over-return", type="Supplier", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # 1. Nhập nợ 1.000.000đ từ NCC
        self.create_order(partner.id, 'Purchase', 1000000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, -1000000)

        # 2. Phát hiện lô hàng lỗi, xuất trả lại 1.500.000đ (gồm cả hàng cũ đợt trước)
        self.create_order(partner.id, 'Purchase', -1500000, payment_method='Debt')
        db.session.refresh(partner)
        # -1.000.000 - (-1.500.000) = +500.000đ (NCC nợ lại mình 500k)
        self.assertEqual(partner.debt_balance, 500000, "Trả hàng vượt nợ thì debt_balance phải là +500.000đ (NCC nợ mình)")

        # 3. NCC chuyển khoản trả lại tiền thừa 500k cho shop (Deposit)
        self.create_bank_tx(partner.id, 'Deposit', 500000, note="NCC hoàn tiền hàng lỗi")
        db.session.refresh(partner)
        # 500k - 500k = 0đ
        self.assertEqual(partner.debt_balance, 0, "NCC hoàn tiền thì số dư trở về 0đ (Hết nợ)")
        print("[PASS] EXT-02: Tra hang NCC vuot no -> NCC no lai shop -> NCC hoan tien ve 0d thanh cong!")

    def test_extreme_03_cash_orders_isolation(self):
        """EXT-03: Đơn hàng tiền mặt (Cash) và Voucher tự động tuyệt đối KHÔNG làm lệch công nợ"""
        partner = Partner(name="Khách Cash Isolation", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # 1. Khách có sẵn nợ 700.000đ
        self.create_order(partner.id, 'Sale', 700000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 700000)

        # 2. Khách mua liên tiếp 3 đơn tiền mặt (Cash) tổng cộng 5.000.000đ
        # Mỗi đơn tiền mặt tạo ra 1 voucher Receipt với source='auto'
        o1 = self.create_order(partner.id, 'Sale', 2000000, payment_method='Cash')
        self.create_voucher(partner.id, 'Receipt', 2000000, note="Thu tự động từ đơn bán Cash", source="auto")

        o2 = self.create_order(partner.id, 'Sale', 1500000, payment_method='Cash')
        self.create_voucher(partner.id, 'Receipt', 1500000, note="Thu tự động từ đơn bán Cash", source="auto")

        o3 = self.create_order(partner.id, 'Sale', 1500000, payment_method='Cash')
        self.create_voucher(partner.id, 'Receipt', 1500000, note="Thu tự động từ đơn bán Cash", source="auto")

        # Recalculate
        recalculate_partner_debt_internal(partner.id)
        db.session.refresh(partner)

        # Dư nợ vẫn PHẢI CHÍNH XÁC là 700.000đ, không bị ảnh hưởng bởi 5tr tiền mặt
        self.assertEqual(partner.debt_balance, 700000, "Đơn Cash và voucher auto không được thay đổi debt_balance")
        print("[PASS] EXT-03: Don hang tien mat (Cash) va voucher auto hoan toan khong anh huong cong no!")

    def test_extreme_04_modify_opening_balance_multiple_times(self):
        """EXT-04: Sửa nợ đầu kỳ nhiều lần (Dương -> Âm -> 0 -> Dương)"""
        partner = Partner(name="Khách Nợ Đầu Kỳ Biến Động", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # Bước 1: Khởi tạo nợ đầu kỳ +1.000.000đ (Khách nợ mình)
        create_opening_balance_order(partner.id, 1000000)
        recalculate_partner_debt_internal(partner.id)
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 1000000)

        # Bước 2: Sửa nợ đầu kỳ thành -800.000đ (Đổi thành Mình nợ khách)
        create_opening_balance_order(partner.id, -800000)
        recalculate_partner_debt_internal(partner.id)
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, -800000)

        # Bước 3: Sửa nợ đầu kỳ về 0đ (Xóa nợ đầu kỳ)
        create_opening_balance_order(partner.id, 0)
        recalculate_partner_debt_internal(partner.id)
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 0)

        # Bước 4: Đặt lại nợ đầu kỳ +2.500.000đ
        create_opening_balance_order(partner.id, 2500000)
        recalculate_partner_debt_internal(partner.id)
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 2500000)
        print("[PASS] EXT-04: Thay doi No dau ky lien tuc (Duong <-> Am <-> 0) cap nhat chinh xac tuyet doi!")

    def test_extreme_05_flip_order_type_sale_purchase(self):
        """EXT-05: Đổi loại đơn hàng từ Bán (Sale) sang Nhập (Purchase)"""
        partner = Partner(name="Đối Tác Đổi Đơn", type="Both", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # 1. Tạo đơn Sale nợ 1.200.000đ -> Khách nợ 1.2tr
        order = self.create_order(partner.id, 'Sale', 1200000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 1200000)

        # 2. Nhân viên tạo nhầm, sửa đơn Sale thành đơn Nhập hàng (Purchase) 1.200.000đ
        order.type = 'Purchase'
        db.session.commit()
        recalculate_partner_debt_internal(partner.id)
        db.session.refresh(partner)

        # Dư nợ phải đổi ngay từ +1.200.000đ thành -1.200.000đ
        self.assertEqual(partner.debt_balance, -1200000, "Đổi từ Sale sang Purchase thì debt_balance phải đổi từ +1.2tr sang -1.2tr")
        print("[PASS] EXT-05: Chuyen doi loai don hang (Sale <-> Purchase) cap nhat dau cong no lap tuc!")

    def test_extreme_06_stress_100_random_transactions(self):
        """EXT-06: STRESS TEST - 100 Giao dịch ngẫu nhiên đan xen liên tục"""
        partner = Partner(name="Đối Tác Stress Test 100", type="Both", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        random.seed(42) # Fixed seed for reproducible test
        expected_balance = 0
        now = datetime.now() - timedelta(days=200)

        tx_types = ['SALE_DEBT', 'PURCHASE_DEBT', 'SALE_RETURN', 'PURCHASE_RETURN', 'RECEIPT_CASH', 'PAYMENT_CASH', 'BANK_DEPOSIT', 'BANK_WITHDRAWAL']

        for i in range(100):
            tx_choice = random.choice(tx_types)
            amount = random.randint(10, 500) * 10000 # 100k -> 5tr
            tx_date = now + timedelta(days=i)

            if tx_choice == 'SALE_DEBT':
                self.create_order(partner.id, 'Sale', amount, payment_method='Debt', date=tx_date)
                expected_balance += amount
            elif tx_choice == 'PURCHASE_DEBT':
                self.create_order(partner.id, 'Purchase', amount, payment_method='Debt', date=tx_date)
                expected_balance -= amount
            elif tx_choice == 'SALE_RETURN':
                self.create_order(partner.id, 'Sale', -amount, payment_method='Debt', date=tx_date)
                expected_balance -= amount
            elif tx_choice == 'PURCHASE_RETURN':
                self.create_order(partner.id, 'Purchase', -amount, payment_method='Debt', date=tx_date)
                expected_balance += amount
            elif tx_choice == 'RECEIPT_CASH':
                self.create_voucher(partner.id, 'Receipt', amount, note=f"Thu tien {i}", date=tx_date)
                expected_balance -= amount
            elif tx_choice == 'PAYMENT_CASH':
                self.create_voucher(partner.id, 'Payment', amount, note=f"Chi tien {i}", date=tx_date)
                expected_balance += amount
            elif tx_choice == 'BANK_DEPOSIT':
                self.create_bank_tx(partner.id, 'Deposit', amount, note=f"NH Thu {i}", date=tx_date)
                expected_balance -= amount
            elif tx_choice == 'BANK_WITHDRAWAL':
                self.create_bank_tx(partner.id, 'Withdrawal', amount, note=f"NH Chi {i}", date=tx_date)
                expected_balance += amount

        # Kiểm tra số dư cuối cùng
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, expected_balance, f"Debt balance ({partner.debt_balance}) phải khớp với expected_balance ({expected_balance})")

        # Kiểm tra Sổ Nợ Chi Tiết (Ledger running balance qua 100 giao dịch)
        ledger_entries, balance, p = calculate_partner_ledger(partner.id)
        self.assertEqual(len(ledger_entries), 100)
        self.assertEqual(balance, expected_balance)
        # Entry mới nhất (index 0) phải có running_balance == expected_balance
        self.assertEqual(ledger_entries[0]['running_balance'], expected_balance)

        print(f"[PASS] EXT-06: STRESS TEST 100 giao dich dan xen: So du cuoi cung ({format(expected_balance, ',')}d) va So no luy ke 100/100 dong khop 100%!")

if __name__ == '__main__':
    unittest.main()
