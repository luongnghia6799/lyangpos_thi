import sys
import os
import unittest
from datetime import datetime, timedelta

# Ensure backend folder is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, recalculate_partner_debt_internal, calculate_partner_ledger, get_partner_debt_cycles
from models import Partner, Order, OrderDetail, CashVoucher, BankAccount, BankTransaction, Product, Category

class LyangPOSDebtTestSuite(unittest.TestCase):
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
        # Clean up database before each test
        db.session.query(BankTransaction).delete()
        db.session.query(BankAccount).delete()
        db.session.query(CashVoucher).delete()
        db.session.query(OrderDetail).delete()
        db.session.query(Order).delete()
        db.session.query(Partner).delete()
        db.session.query(Product).delete()
        db.session.query(Category).delete()
        db.session.commit()

        # Create dummy category & product
        self.cat = Category(name="Mac dinh")
        db.session.add(self.cat)
        db.session.commit()

        self.prod = Product(name="San pham A", category_id=self.cat.id, sale_price=100000, cost_price=70000, stock=100)
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
            display_id=display_id or f"ORD_{order_type}_{int(datetime.now().timestamp())}",
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
            account = BankAccount(account_number="123456789", bank_name="MBBank", balance=10000000)
            db.session.add(account)
            db.session.commit()

        tx = BankTransaction(
            partner_id=partner_id,
            account_id=account.id,
            type=tx_type, # 'Deposit' (Tiền vào / Thu) or 'Withdrawal' (Tiền ra / Chi)
            amount=amount,
            note=note,
            order_id=order_id,
            date=date
        )
        db.session.add(tx)
        db.session.commit()
        recalculate_partner_debt_internal(partner_id)
        return tx

    # ==================== TEST SCENARIOS ====================

    def test_tc01_sale_debt(self):
        """TC-01: Khach hang mua no (Sale on Debt) -> debt_balance > 0 (Khach no)"""
        partner = Partner(name="Khach Hang A", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        self.create_order(partner.id, 'Sale', 1000000, payment_method='Debt')
        db.session.refresh(partner)

        self.assertEqual(partner.debt_balance, 1000000, "Khach mua no 1.000.000d thi debt_balance phai bang +1.000.000d")
        print("[PASS] TC-01: Khach mua no 1.000.000d -> Du no: +1.000.000d (KHACH NO)")

    def test_tc02_sale_debt_with_receipt(self):
        """TC-02: Khach mua no va thanh toan mot phan qua Phieu Thu & Ngan hang"""
        partner = Partner(name="Khach Hang B", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # Mua no 1tr
        self.create_order(partner.id, 'Sale', 1000000, payment_method='Debt')
        # Tra tien mat 400k
        self.create_voucher(partner.id, 'Receipt', 400000, note="Thu tien mat")
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 600000, "Sau khi thu 400k, du no phai con 600k")

        # Tra chuyen khoan 200k
        self.create_bank_tx(partner.id, 'Deposit', 200000, note="Thu chuyen khoan")
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 400000, "Sau khi thu them 200k qua NH, du no phai con 400k")
        print("[PASS] TC-02: Khach tra no dan qua Phieu thu + Chuyen khoan -> Du no: +400.000d (KHACH NO)")

    def test_tc03_sale_return(self):
        """TC-03: Khach tra hang (Sale Return - Don am) -> Giam no khach"""
        partner = Partner(name="Khach Hang C", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # Mua no 1tr
        self.create_order(partner.id, 'Sale', 1000000, payment_method='Debt')
        # Tra hang 300k (don Sale co total_amount = -300k)
        self.create_order(partner.id, 'Sale', -300000, payment_method='Debt')
        db.session.refresh(partner)

        self.assertEqual(partner.debt_balance, 700000, "Khach no 1tr, tra hang 300k -> Du no con 700k")
        print("[PASS] TC-03: Khach tra lai hang 300k -> Du no giam con: +700.000d (KHACH NO)")

    def test_tc04_sale_return_exceeding_debt(self):
        """TC-04: Khach tra hang lon hon so no -> debt_balance < 0 (Minh no lai khach)"""
        partner = Partner(name="Khach Hang D", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # Mua no 500k
        self.create_order(partner.id, 'Sale', 500000, payment_method='Debt')
        # Tra hang 800k
        self.create_order(partner.id, 'Sale', -800000, payment_method='Debt')
        db.session.refresh(partner)

        self.assertEqual(partner.debt_balance, -300000, "Khach no 500k, tra hang 800k -> Minh no khach 300k")
        print("[PASS] TC-04: Tra hang vuot qua no -> Du no: -300.000d (MINH NO KHACH)")

    def test_tc05_purchase_debt(self):
        """TC-05: Nhap hang no tu Nha Cung Cap -> debt_balance < 0 (Minh no NCC)"""
        partner = Partner(name="Nha Cung Cap X", type="Supplier", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # Nhap no 5tr
        self.create_order(partner.id, 'Purchase', 5000000, payment_method='Debt')
        db.session.refresh(partner)

        self.assertEqual(partner.debt_balance, -5000000, "Nhap no 5tr -> debt_balance = -5.000.000d")
        print("[PASS] TC-05: Nhap hang no NCC 5.000.000d -> Du no: -5.000.000d (MINH NO NCC)")

    def test_tc06_purchase_debt_with_payment(self):
        """TC-06: Chi tien tra no NCC qua Phieu Chi & Chuyen khoan"""
        partner = Partner(name="Nha Cung Cap Y", type="Supplier", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # Nhap no 5tr
        self.create_order(partner.id, 'Purchase', 5000000, payment_method='Debt')
        # Chi tra tien mat 2tr
        self.create_voucher(partner.id, 'Payment', 2000000, note="Chi tra tien mat cho NCC")
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, -3000000, "Sau khi chi tra 2tr, con no NCC 3tr")

        # Chi tra chuyen khoan 1tr
        self.create_bank_tx(partner.id, 'Withdrawal', 1000000, note="Chi chuyen khoan cho NCC")
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, -2000000, "Sau khi chi them 1tr qua NH, con no NCC 2tr")
        print("[PASS] TC-06: Chi tra tien no cho NCC -> Du no: -2.000.000d (MINH NO NCC)")

    def test_tc07_purchase_return(self):
        """TC-07: Xuat tra hang lai cho NCC (Purchase Return - Don nhap am)"""
        partner = Partner(name="Nha Cung Cap Z", type="Supplier", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # Nhap no 3tr
        self.create_order(partner.id, 'Purchase', 3000000, payment_method='Debt')
        # Tra hang lai cho NCC tri gia 1tr (don Purchase co total_amount = -1tr)
        self.create_order(partner.id, 'Purchase', -1000000, payment_method='Debt')
        db.session.refresh(partner)

        self.assertEqual(partner.debt_balance, -2000000, "No NCC 3tr, tra hang 1tr -> Con no NCC 2tr")

        # Tra hang tiep 2tr -> Het no
        self.create_order(partner.id, 'Purchase', -2000000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 0, "Tra het hang no -> debt_balance = 0d (HET NO)")
        print("[PASS] TC-07: Xuat tra lai hang cho NCC -> Du no ve 0d (HET NO)")

    def test_tc08_two_way_partner_reconciliation(self):
        """TC-08: Doi tac 2 chieu (Vua Mua vua Ban no - Can tru cong no)"""
        partner = Partner(name="Doi Tac 2 Chieu E", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # 1. Ban no cho doi tac: 2.000.000d
        self.create_order(partner.id, 'Sale', 2000000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 2000000, "Ban no 2tr -> Khach no 2tr")

        # 2. Nhap no tu doi tac: 3.500.000d
        self.create_order(partner.id, 'Purchase', 3500000, payment_method='Debt')
        db.session.refresh(partner)
        # debt_balance = 2tr - 3.5tr = -1.5tr
        self.assertEqual(partner.debt_balance, -1500000, "Can tru 2tr ban - 3.5tr nhap -> Minh no doi tac 1.5tr")

        # 3. Chi tra no 1.500.000d
        self.create_voucher(partner.id, 'Payment', 1500000, note="Tat toan no 2 chieu")
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 0, "Sau khi chi tra 1.5tr -> debt_balance = 0d")
        print("[PASS] TC-08: Doi tac 2 chieu can tru cong no tu dong & chinh xac!")

    def test_tc09_opening_balance_and_order_deletion(self):
        """TC-09: No dau ky (#NODAU) ket hop Sua / Xoa don hang no"""
        partner = Partner(name="Khach Hang F", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        # No dau ky: 500k (tuong duong 1 don Sale #NODAU hoac op_bal)
        nodau_order = self.create_order(partner.id, 'Sale', 500000, payment_method='Debt', display_id='#NODAU')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 500000, "No dau ky 500k -> Du no 500k")

        # Phat sinh don ban no moi 300k
        new_order = self.create_order(partner.id, 'Sale', 300000, payment_method='Debt')
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 800000, "500k + 300k = 800k")

        # Xoa don 300k (mo phong huy don)
        db.session.delete(new_order)
        db.session.commit()
        recalculate_partner_debt_internal(partner.id)
        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 500000, "Sau khi xoa don 300k -> Du no quay lai dung 500k")
        print("[PASS] TC-09: No dau ky + Xoa don no cap nhat hoan hao!")

    def test_tc10_partner_ledger_consistency(self):
        """TC-10: Kiem tra tinh lien tuc cua So No Chi Tiet (Partner Ledger running balance)"""
        now = datetime.now()
        partner = Partner(name="Khach Hang G", type="Customer", debt_balance=0)
        db.session.add(partner)
        db.session.commit()

        t1 = now - timedelta(days=5)
        t2 = now - timedelta(days=4)
        t3 = now - timedelta(days=3)
        t4 = now - timedelta(days=2)

        self.create_order(partner.id, 'Sale', 1000000, payment_method='Debt', date=t1)
        self.create_voucher(partner.id, 'Receipt', 400000, note="Thu lan 1", date=t2)
        self.create_order(partner.id, 'Sale', -200000, payment_method='Debt', date=t3) # Tra hang
        self.create_voucher(partner.id, 'Receipt', 400000, note="Thu lan 2", date=t4)

        db.session.refresh(partner)
        self.assertEqual(partner.debt_balance, 0, "1000k - 400k - 200k - 400k = 0d")

        # Tinh so no
        ledger_entries, balance, p = calculate_partner_ledger(partner.id)
        
        # Verify running balance (ledger_entries is newest to oldest)
        self.assertEqual(len(ledger_entries), 4)
        # Oldest item (t1) had balance 1tr
        self.assertEqual(ledger_entries[3]['running_balance'], 1000000)
        # t2 had balance 600k
        self.assertEqual(ledger_entries[2]['running_balance'], 600000)
        # t3 (return -200k) had balance 400k
        self.assertEqual(ledger_entries[1]['running_balance'], 400000)
        # t4 (receipt 400k) had balance 0k
        self.assertEqual(ledger_entries[0]['running_balance'], 0)
        self.assertEqual(balance, 0)
        print("[PASS] TC-10: So no chi tiet (Partner Ledger) tinh luy ke running balance khop 100%!")

if __name__ == '__main__':
    unittest.main()
