import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    Landmark, Search, Plus, ArrowUpRight, ArrowDownLeft,
    MoreHorizontal, Trash2, Edit3, History, CreditCard,
    DollarSign, Calendar, Filter, Download, ChevronRight,
    RefreshCcw, CheckCircle, X, Wallet, User, FileText
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

import Portal from '../../components/Portal';

export default function BankManager() {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'Deposit', 'Withdrawal'

    // Modals
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

    // Forms
    const [accountForm, setAccountForm] = useState({
        bank_name: '',
        account_number: '',
        account_holder: '',
        balance: 0
    });

    const [transactionForm, setTransactionForm] = useState({
        account_id: '',
        amount: 0,
        type: 'Deposit', // 'Deposit', 'Withdrawal'
        note: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0]);
        }
    }, [accounts]);

    useEffect(() => {
        if (selectedAccount) {
            fetchTransactions(selectedAccount.id);
        }
    }, [selectedAccount]);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get('/api/bank-accounts');
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTransactions = async (accountId) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/bank-transactions', { params: { account_id: accountId } });
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [txPage, setTxPage] = useState(1);
    const txItemsPerPage = 15;

    useEffect(() => {
        setTxPage(1);
    }, [searchTerm, filterType, selectedAccount]);

    const filteredTransactions = React.useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.partner_name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || t.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [transactions, searchTerm, filterType]);

    const paginatedTransactions = React.useMemo(() => {
        const startIndex = (txPage - 1) * txItemsPerPage;
        return filteredTransactions.slice(startIndex, startIndex + txItemsPerPage);
    }, [filteredTransactions, txPage]);

    const handleSaveAccount = async () => {
        if (!accountForm.bank_name || !accountForm.account_number) {
            setToast({ message: "Vui lòng nhập tên ngân hàng và số tài khoản", type: "error" });
            return;
        }
        try {
            if (modalMode === 'add') {
                await axios.post('/api/bank-accounts', accountForm);
                setToast({ message: "Đã thêm tài khoản thành công!", type: "success" });
            } else {
                await axios.put(`/api/bank-accounts/${selectedAccount.id}`, accountForm);
                setToast({ message: "Đã cập nhật tài khoản!", type: "success" });
            }
            fetchAccounts();
            setShowAccountModal(false);
            setAccountForm({ bank_name: '', account_number: '', account_holder: '', balance: 0 });
        } catch (err) {
            setToast({ message: "Lỗi khi lưu tài khoản", type: "error" });
        }
    };

    const handleDeleteAccount = (id) => {
        setConfirm({
            title: "Xác nhận xóa tài khoản",
            message: "Xóa tài khoản này sẽ xóa toàn bộ lịch sử giao dịch liên quan. Bạn có chắc chắn muốn thực hiện?",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/bank-accounts/${id}`);
                    setAccounts(accounts.filter(a => a.id !== id));
                    if (selectedAccount?.id === id) setSelectedAccount(null);
                    setToast({ message: "Đã xóa tài khoản", type: "success" });
                } catch (err) {
                    setToast({ message: "Lỗi khi xóa tài khoản", type: "error" });
                }
                setConfirm(null);
            },
            type: "danger"
        });
    };

    const broadcastUpdate = () => {
        const syncChannel = new BroadcastChannel('pos_data_sync');
        syncChannel.postMessage({ type: 'PARTNER_UPDATED' });
        syncChannel.close();
    };

    const handleRecordTransaction = async () => {
        if (!transactionForm.amount || !transactionForm.account_id) {
            setToast({ message: "Vui lòng nhập số tiền và chọn tài khoản", type: "error" });
            return;
        }
        try {
            await axios.post('/api/bank-transactions', transactionForm);
            setToast({ message: "Đã ghi nhận giao dịch!", type: "success" });
            fetchAccounts();
            if (selectedAccount?.id === parseInt(transactionForm.account_id)) {
                fetchTransactions(selectedAccount.id);
            }
            broadcastUpdate();
            setShowTransactionModal(false);
            setTransactionForm({ ...transactionForm, amount: 0, note: '' });
        } catch (err) {
            setToast({ message: "Lỗi khi thực hiện giao dịch", type: "error" });
        }
    };

    return (
        <div className="pt-2 px-4 pb-4 w-full transition-colors font-sans">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-4 md:px-0">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                            <Landmark className="text-primary" size={32} />
                            TÀI KHOẢN NGÂN HÀNG
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Quản lý dòng tiền và các tài khoản ngân hàng của bạn</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                setModalMode('add');
                                setAccountForm({ bank_name: '', account_number: '', account_holder: '', balance: 0 });
                                setShowAccountModal(true);
                            }}
                            className="px-5 py-2.5 bg-transparent text-[#8b6f47] dark:text-[#d4a574] font-black rounded-xl border border-border hover:bg-[#d4a574]/10 transition-all flex items-center gap-2 shadow-none text-xs uppercase tracking-wider"
                        >
                            <Plus size={16} /> THÊM TÀI KHOẢN
                        </button>
                        <button
                            onClick={() => {
                                setTransactionForm({ ...transactionForm, account_id: selectedAccount?.id || accounts[0]?.id || '' });
                                setShowTransactionModal(true);
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white font-black rounded-xl shadow-none hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-2 text-xs uppercase tracking-wider"
                        >
                            <RefreshCcw size={16} /> LẬP GIAO DỊCH
                        </button>
                    </div>
                </div>

                {/* Account Slider/Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <AnimatePresence mode="popLayout">
                        {accounts.map((acc) => (
                            <m.div
                                key={acc.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => setSelectedAccount(acc)}
                                className={cn(
                                    "relative p-4 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group border",
                                    selectedAccount?.id === acc.id
                                        ? "bg-[#2d5016]/5 dark:bg-[#4a7c59]/5 border-[#2d5016] dark:border-[#4a7c59] shadow-none"
                                        : "bg-transparent border-border hover:border-primary/40 shadow-none"
                                )}
                            >
                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                selectedAccount?.id === acc.id ? "bg-[#2d5016] text-white" : "bg-primary/10 text-primary"
                                            )}>
                                                <CreditCard size={16} />
                                            </div>
                                            <div>
                                                <h3 className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider",
                                                    selectedAccount?.id === acc.id ? "text-primary" : "text-slate-400"
                                                )}>{acc.bank_name}</h3>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModalMode('edit');
                                                    setAccountForm({ ...acc });
                                                    setShowAccountModal(true);
                                                }}
                                                className="p-1 bg-transparent hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteAccount(acc.id);
                                                }}
                                                className="p-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-md text-rose-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-border">
                                        <div>
                                            <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-white leading-none">{acc.account_number}</p>
                                            <p className="text-[9px] font-black uppercase opacity-60 text-slate-500 mt-1 leading-none">{acc.account_holder || 'CHƯA CẬP NHẬT TÊN'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5 leading-none">Số dư</p>
                                            <p className="text-lg font-black tracking-tight tabular-nums text-[#2d5016] dark:text-[#4a7c59] leading-none">
                                                {formatNumber(acc.balance)} <span className="text-xs font-bold">đ</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Transactions Section */}
                {selectedAccount && (
                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-transparent border border-border p-6 rounded-[2rem] shadow-none"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Lịch sử giao dịch</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase">Bản liệt kê các thay đổi số dư gần đây</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <select
                                    className="px-4 py-2 bg-transparent border border-border rounded-xl outline-none font-bold text-xs transition-all text-[#8b6f47] dark:text-white"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">Tất cả loại giao dịch</option>
                                    <option value="Deposit">Nạp tiền / Thu hộ</option>
                                    <option value="Withdrawal">Rút tiền / Chi hộ</option>
                                </select>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Tìm theo ghi chú, đối tác..."
                                        className="pl-9 pr-4 py-2 bg-transparent border border-border focus:border-primary rounded-xl outline-none font-bold text-xs w-64 transition-all text-[#8b6f47] dark:text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b-2 border-slate-50 dark:border-slate-800">
                                    <th className="px-6 py-4 text-left font-black">Thời gian</th>
                                    <th className="px-6 py-4 text-left font-black">Phân loại</th>
                                    <th className="px-6 py-4 text-left font-black">Ghi chú</th>
                                    <th className="px-6 py-4 text-right font-black">Số tiền (đ)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCcw size={40} className="animate-spin text-blue-500/20" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-transparent rounded-full text-slate-200">
                                                    <Search size={60} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Không tìm thấy giao dịch phù hợp</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTransactions.map((t, idx) => (
                                        <m.tr
                                            key={t.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-transparent/50 dark:hover:bg-slate-800/30 transition-colors group"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-transparent rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800 dark:text-slate-200">{formatDate(t.date).split(' ')[0]}</div>
                                                        <div className="text-[10px] font-bold text-slate-400">{formatDate(t.date).split(' ')[1]}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                                    t.type === 'Deposit'
                                                        ? "bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                        : "bg-rose-100/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                                )}>
                                                    {t.type === 'Deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                    {t.type === 'Deposit' ? 'Nạp tiền' : 'Rút tiền'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-bold text-slate-600 dark:text-slate-400 max-w-md truncate">
                                                    {t.note || 'Không có ghi chú'}
                                                    {t.partner_name && (
                                                        <span className="ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-md text-[9px] uppercase font-black">
                                                            {t.partner_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right tabular-nums">
                                                <div className={cn(
                                                    "text-lg font-black tracking-tight",
                                                    t.type === 'Deposit' ? "text-emerald-600" : "text-rose-600"
                                                )}>
                                                    {t.type === 'Deposit' ? '+' : '-'}{formatNumber(t.amount)}
                                                </div>
                                            </td>
                                        </m.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        </div>

                        {/* Pagination controls */}
                        {(() => {
                            const totalItems = filteredTransactions.length;
                            const totalPages = Math.ceil(totalItems / txItemsPerPage);
                            const startIndex = (txPage - 1) * txItemsPerPage;
                            if (totalPages <= 1) return null;
                            return (
                                <div className="p-4 border-t border-border flex items-center justify-between bg-transparent mt-4">
                                    <div className="text-[10px] font-bold text-slate-405 uppercase">
                                        Hiển thị {startIndex + 1} - {Math.min(startIndex + txItemsPerPage, totalItems)} của {totalItems} giao dịch
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={txPage === 1}
                                            onClick={() => setTxPage(p => Math.max(1, p - 1))}
                                            className="px-3 py-1.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-30 hover:bg-primary/5 dark:hover:bg-slate-800 transition-all text-primary dark:text-[#d4a574]"
                                        >
                                            Trước
                                        </button>
                                        <span className="px-3 py-1.5 text-[10px] font-black text-primary dark:text-[#d4a574]">
                                            Trang {txPage} / {totalPages}
                                        </span>
                                        <button
                                            disabled={txPage === totalPages}
                                            onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                                            className="px-3 py-1.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-30 hover:bg-primary/5 dark:hover:bg-slate-800 transition-all text-primary dark:text-[#d4a574]"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </m.div>
                )}

            {/* Account Modal */}
            <Portal>
                <AnimatePresence>
                    {showAccountModal && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                            <m.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-transparent w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border-2 border-blue-500/20"
                            >
                                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-900">
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg">
                                            <Landmark size={20} />
                                        </div>
                                        {modalMode === 'add' ? 'Thêm tài khoản mới' : 'Cập nhật tài khoản'}
                                    </h2>
                                    <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-transparent rounded-xl transition-all"><X size={24} /></button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên ngân hàng</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 bg-transparent border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all shadow-inner"
                                            placeholder="VD: Vietcombank, Techcombank..."
                                            value={accountForm.bank_name}
                                            onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số tài khoản</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 bg-transparent border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all shadow-inner"
                                            placeholder="0123456789..."
                                            value={accountForm.account_number}
                                            onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chủ tài khoản</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 bg-transparent border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all shadow-inner"
                                            placeholder="NGUYEN VAN A..."
                                            value={accountForm.account_holder}
                                            onChange={(e) => setAccountForm({ ...accountForm, account_holder: e.target.value })}
                                        />
                                    </div>
                                    {modalMode === 'add' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số dư khởi tạo</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full p-4 pr-16 bg-transparent border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-black text-2xl text-right dark:text-white transition-all shadow-inner"
                                                    placeholder="0"
                                                    value={formatNumber(accountForm.balance)}
                                                    onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value.replace(/,/g, '')) || 0 })}
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">đ</span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSaveAccount}
                                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                                    >
                                        XÁC NHẬN LƯU
                                    </button>
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Transaction Modal */}
            <Portal>
                <AnimatePresence>
                    {showTransactionModal && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                            <m.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-transparent w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border-2 border-blue-500/20"
                            >
                                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-900">
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg">
                                            <RefreshCcw size={20} />
                                        </div>
                                        Lập giao dịch ngân hàng
                                    </h2>
                                    <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-transparent rounded-xl transition-all"><X size={24} /></button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="p-2 bg-transparent rounded-3xl flex border-2 border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => setTransactionForm({ ...transactionForm, type: 'Deposit' })}
                                            className={cn(
                                                "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all gap-2 flex items-center justify-center",
                                                transactionForm.type === 'Deposit' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <ArrowDownLeft size={16} /> NẠP TIỀN
                                        </button>
                                        <button
                                            onClick={() => setTransactionForm({ ...transactionForm, type: 'Withdrawal' })}
                                            className={cn(
                                                "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all gap-2 flex items-center justify-center",
                                                transactionForm.type === 'Withdrawal' ? "bg-white dark:bg-slate-700 text-rose-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <ArrowUpRight size={16} /> RÚT TIỀN
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn tài khoản</label>
                                            <select
                                                className="w-full p-4 bg-transparent border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white appearance-none transition-all shadow-inner"
                                                value={transactionForm.account_id}
                                                onChange={(e) => setTransactionForm({ ...transactionForm, account_id: e.target.value })}
                                            >
                                                <option value="">Chọn một tài khoản...</option>
                                                {accounts.map(a => (
                                                    <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số tiền giao dịch</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className={cn(
                                                        "w-full p-6 pr-16 bg-transparent border-2 border-transparent focus:border-blue-500 rounded-3xl outline-none font-black text-4xl text-right transition-all shadow-inner",
                                                        transactionForm.type === 'Deposit' ? "text-emerald-600" : "text-rose-600"
                                                    )}
                                                    placeholder="0"
                                                    value={formatNumber(transactionForm.amount)}
                                                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value.replace(/,/g, '')) || 0 })}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">đ</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung ghi chú</label>
                                            <textarea
                                                className="w-full p-4 bg-transparent border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all shadow-inner h-24 resize-none"
                                                placeholder="Ghi chú thêm về giao dịch này..."
                                                value={transactionForm.note}
                                                onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleRecordTransaction}
                                        className={cn(
                                            "w-full py-6 text-white rounded-[2.5rem] font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase tracking-widest",
                                            transactionForm.type === 'Deposit' ? "bg-emerald-600 shadow-emerald-500/20" : "bg-rose-600 shadow-rose-500/20"
                                        )}
                                    >
                                        XÁC NHẬN GIAO DỊCH
                                    </button>
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {confirm && (
                <ConfirmModal
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onClose={() => setConfirm(null)}
                    type={confirm.type}
                />
            )}
            </div>
        </div>
    );
}
