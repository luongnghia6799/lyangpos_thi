import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';
import CustomDatePicker from '../../components/CustomDatePicker';
import { Search, Plus, Wallet, History, FileText, Trash2, ArrowUpRight, ArrowDownLeft, X, Coins, Calendar, User, RefreshCcw, CheckCircle, Printer, Sparkles, ArrowRight, RotateCcw, Check, Banknote, Building2, ShoppingBag, Receipt, ChevronRight, ChevronLeft, Filter, AlertCircle, Eye, CheckSquare, Square, Phone, MapPin } from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, formatDebt } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { DEFAULT_SETTINGS } from '../../lib/settings';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import Portal from '../../components/Portal';
import { usePartnerData } from '../../queries/useProductData';
import { useQueryClient } from '@tanstack/react-query';
import PartnerEditModal from '../../components/PartnerEditModal';

export default function CashVoucher() {
    const { data: partnersData } = usePartnerData();
    const queryClient = useQueryClient();
    const partners = Array.isArray(partnersData) 
        ? partnersData 
        : (Array.isArray(partnersData?.items) 
            ? partnersData.items 
            : (Array.isArray(partnersData?.partners) 
                ? partnersData.partners 
                : []));
    const [vouchers, setVouchers] = useState([]);
    const [bankTransactions, setBankTransactions] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [lastVoucher, setLastVoucher] = useState(null);
    const [completedVoucher, setCompletedVoucher] = useState(null);
    const [voucherToPrint, setVoucherToPrint] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        partner_id: '',
        amount: 0,
        note: '',
        date: new Date().toISOString().slice(0, 10),
        type: 'Receipt', // Default to 'Receipt' (Phiếu Thu)
        payment_method: 'Cash', // 'Cash' or 'Bank'
        account_id: '' // For bank transaction
    });

    const [partnerSearch, setPartnerSearch] = useState('');
    const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, type }
    const [dateFilter, setDateFilter] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate(), quarter: '' });
    const [activeMainTab, setActiveMainTab] = useState('fund'); // 'fund', 'cash_ledger', 'bank_ledger'
    const [showQuickAddPartner, setShowQuickAddPartner] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');
    const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
    const partnerInputRef = useRef(null);
    const amountInputRef = useRef(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [fundPage, setFundPage] = useState(1);
    const [fundItemsPerPage] = useState(15);

    useEffect(() => {
        setFundPage(1);
    }, [dateFilter, activeMainTab, ledgerSearchQuery]);

    useEffect(() => {
        if (isPartnerDropdownOpen && activeSuggestionIndex >= 0) {
            const activeEl = document.querySelector('.dropdown-item.active');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            }
        }
    }, [activeSuggestionIndex, isPartnerDropdownOpen]);

    useEffect(() => {
        fetchSettings();
        fetchBankAccounts();

        // Data Sync Channel
        const syncChannel = new BroadcastChannel('pos_data_sync');
        syncChannel.onmessage = (e) => {
            if (e.data.type === 'PARTNER_UPDATED') {
                queryClient.invalidateQueries({ queryKey: ['partners'] });
            }
        };

        return () => {
            syncChannel.close();
        };
    }, []);

    const broadcastUpdate = () => {
        const syncChannel = new BroadcastChannel('pos_data_sync');
        syncChannel.postMessage({ type: 'PARTNER_UPDATED' });
        syncChannel.close();
    };

    useEffect(() => {
        if (activeMainTab === 'fund') {
            fetchVouchers('manual');
            fetchBankTransactions();
        } else if (activeMainTab === 'cash_ledger') {
            fetchVouchers('all');
        } else if (activeMainTab === 'bank_ledger') {
            fetchBankTransactions();
        }
    }, [dateFilter, activeMainTab]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsPartnerDropdownOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);



    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/print-templates?module=CashVoucher');
            const data = res.data;
            if (data && data.length > 0) {
                const defaultTemplate = data.find(t => t.is_default) || data[0];
                if (defaultTemplate) {
                    try {
                        const config = JSON.parse(defaultTemplate.config);
                        setSettings(prev => ({ ...prev, ...config }));
                    } catch (e) {
                        console.error("Error parsing template config", e);
                    }
                }
            } else {
                const oldRes = await axios.get('/api/settings');
                if (Object.keys(oldRes.data).length > 0) {
                    setSettings(prev => ({ ...prev, ...oldRes.data }));
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchBankAccounts = async () => {
        try {
            const res = await axios.get('/api/bank-accounts');
            setBankAccounts(res.data || []);
            if (res.data && res.data.length > 0) {
                setFormData(prev => ({ ...prev, account_id: String(res.data[0].id) }));
            }
        } catch (err) {
            console.error("Fetch bank accounts error:", err);
        }
    };

    const fetchVouchers = async (source = 'manual') => {
        setLoading(true);
        try {
            const params = {
                year: dateFilter.year || undefined,
                month: dateFilter.month || undefined,
                day: dateFilter.day || undefined,
                quarter: dateFilter.quarter || undefined,
                source: source === 'all' ? undefined : source
            };
            const voucherRes = await axios.get('/api/vouchers', { params });
            if (voucherRes.data && Array.isArray(voucherRes.data)) {
                const sorted = voucherRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setVouchers(sorted);
            } else {
                setVouchers([]);
            }
        } catch (err) {
            console.error("Fetch vouchers error:", err);
            setVouchers([]);
            setToast({ message: "Lỗi khi tải dữ liệu quỹ", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const fetchBankTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                year: dateFilter.year || undefined,
                month: dateFilter.month || undefined,
                day: dateFilter.day || undefined,
                quarter: dateFilter.quarter || undefined
            };
            const res = await axios.get('/api/bank-transactions', { params });
            if (res.data && Array.isArray(res.data)) {
                const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setBankTransactions(sorted);
            } else {
                setBankTransactions([]);
            }
        } catch (err) {
            console.error("Fetch bank transactions error:", err);
            setBankTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintVoucher = (v) => {
        if (!v) return;
        setVoucherToPrint(v);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const handleSave = async () => {
        if (!formData.amount || formData.amount <= 0) {
            setToast({ message: "Vui lòng nhập số tiền hợp lệ", type: "error" });
            return;
        }
        if (formData.payment_method === 'Bank' && !formData.account_id) {
            setToast({ message: "Vui lòng chọn tài khoản ngân hàng", type: "error" });
            return;
        }
        setLoading(true);
        try {
            let createdData = null;
            const currentSelectedPartner = selectedPartner;
            const oldDebt = currentSelectedPartner ? (currentSelectedPartner.debt_balance || 0) : 0;
            const enteredAmount = parseFloat(formData.amount) || 0;
            const isRec = formData.type === 'Receipt';
            const expectedNewDebt = isRec ? oldDebt - enteredAmount : oldDebt + enteredAmount;

            if (formData.payment_method === 'Cash') {
                const res = await axios.post('/api/vouchers', {
                    partner_id: formData.partner_id || null,
                    amount: formData.amount,
                    note: formData.note,
                    type: formData.type,
                    date: formData.date || undefined
                });
                createdData = res.data;
                fetchVouchers();
            } else {
                const res = await axios.post('/api/bank-transactions', {
                    account_id: parseInt(formData.account_id),
                    amount: formData.amount,
                    type: isRec ? 'Deposit' : 'Withdrawal',
                    note: formData.note,
                    date: formData.date || undefined,
                    partner_id: formData.partner_id ? parseInt(formData.partner_id) : null
                });
                createdData = res.data;
                fetchBankTransactions();
                fetchBankAccounts();
            }
            await queryClient.invalidateQueries({ queryKey: ['partners'] });
            broadcastUpdate();
            
            // Set completed voucher to display and stay on screen for user to review!
            const chosenAccount = bankAccounts.find(a => String(a.id) === String(formData.account_id));
            const voucherId = createdData?.id || Date.now();
            const voucherCode = isRec 
                ? (formData.payment_method === 'Bank' ? `NT-${voucherId}` : `PT-${voucherId}`)
                : (formData.payment_method === 'Bank' ? `CT-${voucherId}` : `PC-${voucherId}`);

            setCompletedVoucher({
                id: voucherId,
                code: voucherCode,
                partner: currentSelectedPartner,
                partner_id: currentSelectedPartner?.id,
                partner_name: currentSelectedPartner?.name || 'Khách lẻ / Không định danh',
                partner_phone: currentSelectedPartner?.phone,
                amount: enteredAmount,
                type: formData.type,
                payment_method: formData.payment_method,
                account: chosenAccount,
                note: formData.note,
                old_debt: oldDebt,
                new_debt: expectedNewDebt,
                created_at: new Date()
            });

            setToast({ message: `Đã lưu phiếu ${isRec ? 'thu' : 'chi'} thành công!`, type: "success" });
        } catch (err) {
            setToast({ message: "Lỗi khi tạo phiếu", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(prev => ({
            ...prev,
            partner_id: '',
            amount: 0,
            note: '',
            date: new Date().toISOString().slice(0, 10),
            account_id: bankAccounts.length > 0 ? String(bankAccounts[0].id) : ''
        }));
        setPartnerSearch('');
        setLastVoucher(null);
        setCompletedVoucher(null);
    };

    const handleDeleteVoucher = (id, source) => {
        if (source === 'auto') return;
        setConfirm({
            title: "Xác nhận xóa phiếu",
            message: "Xóa phiếu này sẽ hoàn tác thay đổi công nợ của đối tác. Bạn có chắc chắn muốn thực hiện?",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/vouchers/${id}`);
                    fetchVouchers('all');
                    await queryClient.invalidateQueries({ queryKey: ['partners'] });
                    broadcastUpdate();
                    setToast({ message: "Đã xóa phiếu thành công", type: "success" });
                } catch (err) {
                    setToast({ message: "Lỗi khi xóa phiếu: " + (err.response?.data?.error || err.message), type: "error" });
                }
                setConfirm(null);
            },
            type: "danger"
        });
    };

    const handleDeleteBankTransaction = (id) => {
        setConfirm({
            title: "Xác nhận xóa giao dịch",
            message: "Xóa giao dịch này sẽ hoàn tác thay đổi số dư và công nợ của đối tác. Bạn có chắc chắn muốn thực hiện?",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/bank-transactions/${id}`);
                    fetchBankTransactions();
                    fetchBankAccounts();
                    await queryClient.invalidateQueries({ queryKey: ['partners'] });
                    broadcastUpdate();
                    setToast({ message: "Đã xóa giao dịch thành công", type: "success" });
                } catch (err) {
                    setToast({ message: "Lỗi khi xóa giao dịch: " + (err.response?.data?.error || err.message), type: "error" });
                }
                setConfirm(null);
            },
            type: "danger"
        });
    };

    const renderTimeCell = (dateString) => {
        if (!dateString) return '-';
        const formatted = formatDate(dateString); // "HH:mm:ss DD/MM/YYYY" or similar format
        // Split space or detect time vs date parts. Let's make a custom parser or match HH:mm:ss and DD/MM/YYYY
        // Lyang formatDate usually returns: "HH:mm:ss DD/MM/YYYY" or "HH:mm DD/MM/YYYY"
        const parts = formatted.split(' ');
        if (parts.length >= 2) {
            const timePart = parts[0];
            const datePart = parts.slice(1).join(' ');
            return (
                <div className="flex flex-col">
                    <span className="font-black text-gray-900 dark:text-emerald-100">{timePart}</span>
                    <span className="font-medium text-slate-400 text-[10px]">{datePart}</span>
                </div>
            );
        }
        return <span className="font-medium">{formatted}</span>;
    };

    const filteredVouchers = vouchers.filter(v => {
        if (!ledgerSearchQuery) return true;
        const q = ledgerSearchQuery.toLowerCase();
        const displayId = (v.type === 'Receipt' ? `PT-${v.id}` : `PC-${v.id}`).toLowerCase();
        const partner = (v.partner_name || '').toLowerCase();
        const note = (v.note || '').toLowerCase();
        return displayId.includes(q) || partner.includes(q) || note.includes(q);
    });

    const filteredBankTransactions = bankTransactions.filter(t => {
        if (!ledgerSearchQuery) return true;
        const q = ledgerSearchQuery.toLowerCase();
        const displayId = (t.type === 'Deposit' ? `NT-${t.id}` : `CT-${t.id}`).toLowerCase();
        const partner = (t.partner_name || '').toLowerCase();
        const note = (t.note || '').toLowerCase();
        const bank = (t.bank_name || '').toLowerCase();
        return displayId.includes(q) || partner.includes(q) || note.includes(q) || bank.includes(q);
    });

    const selectedPartner = Array.isArray(partners) ? partners.find(p => p.id === parseInt(formData.partner_id)) : null;
    const isReceipt = formData.type === 'Receipt';

    return (
        <div className="pt-1 px-3 pb-2 w-full transition-colors h-[calc(100vh-25px)] overflow-hidden flex flex-col font-sans relative">
            <div className="flex-none flex flex-col no-print">
                {/* Top Bar / Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 relative z-10">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tight flex items-center gap-2.5 pt-1 pb-0.5 leading-relaxed">
                            <Wallet className="text-primary shrink-0" size={28} />
                            {activeMainTab === 'bank_ledger' ? "SỔ CHI TIẾT NGÂN HÀNG" : activeMainTab === 'cash_ledger' ? "SỔ CHI TIẾT TIỀN MẶT" : "QUẢN LÝ QUỸ & TÀI KHOẢN"}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                {activeMainTab === 'bank_ledger' ? "Xem và theo dõi dòng tiền chuyển khoản ngân hàng" : activeMainTab === 'cash_ledger' ? "Xem và theo dõi dòng tiền mặt chạy vào két" : "Xem và quản lý ngân sách thu chi"}
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-transparent p-1 rounded-2xl border border-border shadow-none">
                        <button
                            onClick={() => setActiveMainTab('fund')}
                            className={cn("px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300", activeMainTab === 'fund' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-sm" : "text-[#8b6f47] hover:bg-[#d4a574]/10")}
                        >
                            TẠO PHIẾU
                        </button>
                        <button
                            onClick={() => setActiveMainTab('cash_ledger')}
                            className={cn("px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300", activeMainTab === 'cash_ledger' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-sm" : "text-[#8b6f47] hover:bg-[#d4a574]/10")}
                        >
                            SỔ TIỀN MẶT
                        </button>
                        <button
                            onClick={() => setActiveMainTab('bank_ledger')}
                            className={cn("px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300", activeMainTab === 'bank_ledger' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-sm" : "text-[#8b6f47] hover:bg-[#d4a574]/10")}
                        >
                            SỔ NGÂN HÀNG
                        </button>
                    </div>
                </div>

                {/* Filter and Tool Bar (Visible when on Ledger tabs) */}
                {activeMainTab !== 'fund' && (
                    <div className="flex flex-wrap items-center justify-end gap-3 mb-3 px-1 relative z-50">
                        {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-transparent p-1 rounded-2xl shadow-none border border-border">
                            <div className="flex items-center px-2.5 py-1 bg-gradient-to-r from-[#2d5016]/10 to-[#4a7c59]/10 rounded-xl border border-[#d4a574]/20">
                                <Calendar size={13} className="text-[#2d5016] dark:text-[#4a7c59] mr-1.5" />
                                <span className="text-[9px] font-black text-[#2d5016] dark:text-[#d4a574] uppercase tracking-wider">KỲ LỌC</span>
                            </div>

                            <div className="flex items-center gap-1.5 px-1 h-7">
                                <CustomSelect
                                    className="border-0 p-0 min-w-[65px]"
                                    value={dateFilter.year}
                                    onChange={(e) => setDateFilter({ ...dateFilter, year: e.target.value })}
                                    options={[
                                        { value: '', label: 'Tất cả năm' },
                                        { value: '2024', label: '2024' },
                                        { value: '2025', label: '2025' },
                                        { value: '2026', label: '2026' }
                                    ]}
                                />
                                <span className="text-slate-300 text-xs font-bold">/</span>
                                <CustomSelect
                                    className="border-0 p-0 min-w-[65px]"
                                    value={dateFilter.month}
                                    onChange={(e) => setDateFilter({ ...dateFilter, month: e.target.value })}
                                    options={[
                                        { value: '', label: 'Cả năm' },
                                        ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Thg ${i + 1}` }))
                                    ]}
                                />
                                <span className="text-slate-300 text-xs font-bold">/</span>
                                <CustomSelect
                                    className="border-0 p-0 min-w-[65px]"
                                    value={dateFilter.day}
                                    onChange={(e) => setDateFilter({ ...dateFilter, day: e.target.value })}
                                    options={[
                                        { value: '', label: 'Cả tháng' },
                                        ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `Ngày ${i + 1}` }))
                                    ]}
                                />
                            </div>

                            <button
                                onClick={() => setDateFilter({ year: '', month: '', day: '', quarter: '' })}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                title="Xóa lọc"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto px-1 py-1 md:px-2 flex flex-col items-center text-emerald-950 dark:text-emerald-50 w-full font-sans">
                {activeMainTab === 'fund' && (
                    <div className="w-full max-w-7xl space-y-6">
                        {completedVoucher ? (
                            /* SUCCESS VIEW - GIỮ LẠI PHIẾU VỪA TẠO ĐỂ XEM & IN */
                            <m.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                            >
                                <div className="lg:col-span-8 bg-white/60 dark:bg-slate-900/60 border border-primary/30 p-6 md:p-8 rounded-3xl space-y-6 relative overflow-hidden backdrop-blur-md shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                                <CheckCircle size={24} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Giao dịch hoàn tất</div>
                                                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                    ĐÃ LẬP PHIẾU {completedVoucher.type === 'Receipt' ? 'THU' : 'CHI'} THÀNH CÔNG
                                                </h2>
                                            </div>
                                        </div>
                                        <span className="px-3.5 py-1 rounded-xl font-mono text-sm font-black bg-primary/10 text-primary border border-primary/20">
                                            {completedVoucher.code}
                                        </span>
                                    </div>

                                    {/* Detailed breakdown */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Đối tác giao dịch</span>
                                            <div className="text-sm font-black text-gray-900 dark:text-emerald-100 flex items-center gap-2">
                                                {completedVoucher.partner_id && (
                                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">#{completedVoucher.partner_id}</span>
                                                )}
                                                {completedVoucher.partner_name}
                                            </div>
                                            <div className="text-xs font-bold text-slate-400">{completedVoucher.partner_phone || 'Không có số điện thoại'}</div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phương thức thanh toán</span>
                                            <div className="text-sm font-black text-gray-900 dark:text-emerald-100 flex items-center gap-2">
                                                {completedVoucher.payment_method === 'Cash' ? <Coins size={16} className="text-amber-500" /> : <Building2 size={16} className="text-blue-500" />}
                                                {completedVoucher.payment_method === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản Ngân hàng'}
                                            </div>
                                            {completedVoucher.account && (
                                                <div className="text-xs font-bold text-slate-400">{completedVoucher.account.bank_name} - {completedVoucher.account.account_number}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Live Debt Transition Box */}
                                    <div className="p-5 rounded-2xl bg-emerald-500/10 dark:bg-slate-900/80 border border-emerald-500/25 space-y-3.5">
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                                            <span>Diễn biến công nợ đối tác</span>
                                            <span className="font-mono text-[11px]">{formatDate(completedVoucher.created_at)}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2.5 text-center">
                                            <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-border">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Nợ cũ</div>
                                                <div className="text-sm md:text-base font-black font-mono text-slate-700 dark:text-slate-200 mt-0.5">
                                                    {formatDebt(completedVoucher.old_debt)}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-border">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {completedVoucher.type === 'Receipt' ? 'Đã thu (-)' : 'Đã chi (+)'}
                                                </div>
                                                <div className={cn("text-sm md:text-base font-black font-mono mt-0.5", completedVoucher.type === 'Receipt' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                                    {completedVoucher.type === 'Receipt' ? '-' : '+'} {formatNumber(completedVoucher.amount)} đ
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-xl border font-mono",
                                                completedVoucher.new_debt === 0 
                                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                                                    : completedVoucher.new_debt > 0 
                                                        ? "bg-blue-500/20 border-blue-500/40 text-blue-800 dark:text-blue-200"
                                                        : "bg-purple-500/20 border-purple-500/40 text-purple-800 dark:text-purple-200"
                                            )}>
                                                <div className="text-[9px] font-bold uppercase tracking-tight opacity-75">Dư nợ mới</div>
                                                <div className="text-sm md:text-base font-black mt-0.5">
                                                    {formatDebt(completedVoucher.new_debt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {completedVoucher.note && (
                                        <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border text-xs">
                                            <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] block mb-0.5">Ghi chú phiếu:</span>
                                            <span className="font-bold text-gray-800 dark:text-emerald-100">{completedVoucher.note}</span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-1">
                                        <button
                                            onClick={() => handlePrintVoucher(completedVoucher)}
                                            className="flex-1 min-w-[160px] py-3.5 px-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
                                        >
                                            <Printer size={16} /> In Phiếu Thu/Chi
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCompletedVoucher(null);
                                                resetForm();
                                            }}
                                            className="flex-1 min-w-[160px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-sm active:scale-95"
                                        >
                                            <Plus size={16} /> Tạo Phiếu Tiếp Theo
                                        </button>
                                        <button
                                            onClick={() => setActiveMainTab(completedVoucher.payment_method === 'Cash' ? 'cash_ledger' : 'bank_ledger')}
                                            className="py-3.5 px-5 rounded-2xl border border-border hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                        >
                                            <History size={16} /> Xem Sổ Quỹ
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side in Success View: Summary info */}
                                <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
                                    <div className="text-white p-6 md:p-7 rounded-3xl bg-gradient-to-br from-[#2d5016] to-[#4a7c59] flex flex-col justify-between relative overflow-hidden h-full min-h-[300px] shadow-sm">
                                        <div className="absolute -bottom-10 -right-10 opacity-10">
                                            <Coins size={220} />
                                        </div>
                                        <div className="relative z-10 space-y-5">
                                            <div>
                                                <div className="text-[10px] font-black opacity-75 uppercase tracking-[0.25em] mb-1.5">Tồn Quỹ Tiền Mặt Sau Giao Dịch</div>
                                                <div className="text-3xl md:text-4xl font-black tracking-tighter font-mono">
                                                    {formatNumber(
                                                        vouchers.filter(v => v.type === 'Receipt').reduce((sum, v) => sum + v.amount, 0) -
                                                        vouchers.filter(v => v.type === 'Payment').reduce((sum, v) => sum + v.amount, 0)
                                                    )} đ
                                                </div>
                                            </div>
                                            <div className="pt-5 border-t border-white/20 space-y-2.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="opacity-75 uppercase font-bold text-[10px]">Mã phiếu:</span>
                                                    <span className="font-mono font-black">{completedVoucher.code}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        ) : (
                            /* INPUT FORM VIEW */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Fund Tab UI */}
                                <div className="lg:col-span-7 bg-white/70 dark:bg-slate-900/70 border border-border/90 p-6 md:p-7 rounded-3xl space-y-4 relative overflow-hidden backdrop-blur-xl shadow-sm">
                                    <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
                                        <Wallet size={200} className="text-[#4a7c59]" />
                                    </div>

                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={cn("w-9 h-9 rounded-2xl text-white flex items-center justify-center shadow-sm shrink-0", isReceipt ? "bg-gradient-to-br from-[#2d5016] to-[#4a7c59]" : "bg-gradient-to-br from-rose-700 to-rose-600")}>
                                            {isReceipt ? <ArrowDownLeft size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-black text-[#2d5016] dark:text-[#4ade80] uppercase tracking-tight">
                                            Lập Phiếu Thu / Chi Quỹ
                                        </h2>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        {/* Transaction Type & Date Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            <div className="md:col-span-8 space-y-1.5">
                                                <label className="text-[11px] font-black text-[#2d5016]/80 dark:text-emerald-400/80 uppercase tracking-wider ml-0.5">
                                                    Loại giao dịch
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 p-1 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-border/80 shadow-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, type: 'Receipt' }))}
                                                        className={cn(
                                                            "py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
                                                            isReceipt
                                                                ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-sm scale-[1.01]"
                                                                : "text-muted-foreground hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 hover:text-foreground"
                                                        )}
                                                    >
                                                        <ArrowDownLeft size={16} className={isReceipt ? "text-emerald-300" : "text-emerald-600"} />
                                                        <span>Thu Tiền</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, type: 'Payment' }))}
                                                        className={cn(
                                                            "py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
                                                            !isReceipt
                                                                ? "bg-gradient-to-r from-rose-700 to-rose-600 text-white shadow-sm scale-[1.01]"
                                                                : "text-muted-foreground hover:bg-rose-50/50 dark:hover:bg-slate-800/50 hover:text-foreground"
                                                        )}
                                                    >
                                                        <ArrowUpRight size={16} className={!isReceipt ? "text-rose-300" : "text-rose-600"} />
                                                        <span>Chi Tiền</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="md:col-span-4 space-y-1.5">
                                                <label className="text-[11px] font-black text-[#2d5016]/80 dark:text-emerald-400/80 uppercase tracking-wider ml-0.5 flex items-center gap-1">
                                                    <Calendar size={13} className="text-[#2d5016] dark:text-emerald-400" />
                                                    Ngày giao dịch
                                                </label>
                                                <div className="h-[46px] flex items-center">
                                                    <CustomDatePicker
                                                        value={formData.date || new Date().toISOString().slice(0, 10)}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                        className="py-2.5 px-3 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Partner selector */}
                                        <div className="space-y-1.5" onBlur={() => setTimeout(() => setIsPartnerDropdownOpen(false), 200)}>
                                            <div className="flex justify-between items-center">
                                                <label className="text-[11px] font-black text-[#2d5016]/80 dark:text-emerald-400/80 uppercase tracking-wider ml-0.5">Đối tác</label>
                                                {selectedPartner && (
                                                    <span className={cn("text-xs font-black px-2.5 py-0.5 rounded-full border", selectedPartner.debt_balance > 0 ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" : selectedPartner.debt_balance < 0 ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20")}>
                                                        Nợ cũ: {formatDebt(selectedPartner.debt_balance)}
                                                    </span>
                                                )}
                                            </div>

                                            {selectedPartner ? (
                                                <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:via-slate-800/60 dark:to-transparent border border-emerald-600/30 dark:border-emerald-500/30 rounded-2xl relative shadow-xs">
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2d5016] to-[#4a7c59] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                                                            {selectedPartner.name ? selectedPartner.name.charAt(0).toUpperCase() : 'P'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-black text-foreground text-sm sm:text-base flex items-center gap-2 truncate">
                                                                <span className="truncate">{selectedPartner.name}</span>
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 shrink-0">#{selectedPartner.id}</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-2 truncate">
                                                                {selectedPartner.phone ? (
                                                                    <span className="flex items-center gap-1 shrink-0"><Phone size={11} className="opacity-70" /> {selectedPartner.phone}</span>
                                                                ) : <span className="opacity-70">Chưa có SĐT</span>}
                                                                {selectedPartner.address && (
                                                                    <span className="flex items-center gap-1 truncate opacity-80"><MapPin size={11} className="opacity-70" /> {selectedPartner.address}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, partner_id: '', amount: 0, note: '' }));
                                                            setPartnerSearch('');
                                                            setSelectedOrderIds(new Set());
                                                            setTimeout(() => {
                                                                if (partnerInputRef.current) partnerInputRef.current.focus();
                                                            }, 100);
                                                        }}
                                                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all shrink-0 ml-2"
                                                        title="Đổi đối tác khác"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <User className="absolute left-4 top-3.5 text-emerald-500/50" size={20} />
                                                    <input
                                                        type="text"
                                                        className="input-premium w-full py-3 px-4 font-bold text-base rounded-2xl"
                                                        style={{ paddingLeft: '2.8rem' }}
                                                        placeholder="Tìm tên, SĐT hoặc #ID đối tác..."
                                                        ref={partnerInputRef}
                                                        value={partnerSearch}
                                                        onChange={(e) => {
                                                            setPartnerSearch(e.target.value);
                                                            setIsPartnerDropdownOpen(true);
                                                            setActiveSuggestionIndex(0);
                                                        }}
                                                        onFocus={() => {
                                                            setIsPartnerDropdownOpen(true);
                                                            setActiveSuggestionIndex(0);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            const filtered = partners
                                                                .filter(p => {
                                                                    if (!partnerSearch) return true;
                                                                    const search = partnerSearch.toLowerCase();
                                                                    const searchId = parseInt(partnerSearch.replace('#', ''));
                                                                    const matchesId = !isNaN(searchId) && p.id === searchId;
                                                                    return matchesId || (p.name || "").toLowerCase().includes(search) || (p.phone && p.phone.includes(search));
                                                                })
                                                                .sort((a, b) => {
                                                                    if (!partnerSearch) return (a.name || "").localeCompare(b.name || "", 'vi', { sensitivity: 'base' });
                                                                    const searchId = parseInt(partnerSearch.replace('#', ''));
                                                                    if (!isNaN(searchId)) {
                                                                        if (a.id === searchId) return -1;
                                                                        if (b.id === searchId) return 1;
                                                                    }
                                                                    return (a.name || "").localeCompare(b.name || "", 'vi', { sensitivity: 'base' });
                                                                })
                                                                .slice(0, 30);

                                                            if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setActiveSuggestionIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
                                                            } else if (e.key === 'ArrowUp') {
                                                                e.preventDefault();
                                                                setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
                                                            } else if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const targetIdx = activeSuggestionIndex >= 0 && activeSuggestionIndex < filtered.length ? activeSuggestionIndex : 0;
                                                                if (filtered.length > 0 && targetIdx < filtered.length) {
                                                                    const selected = filtered[targetIdx];
                                                                    const autoType = (selected.debt_balance < 0) ? 'Payment' : 'Receipt';
                                                                    setFormData({ ...formData, partner_id: String(selected.id), type: autoType });
                                                                    setPartnerSearch('');
                                                                    setIsPartnerDropdownOpen(false);
                                                                    if (amountInputRef.current) amountInputRef.current.focus();
                                                                }
                                                            } else if (e.key === 'Escape') {
                                                                setIsPartnerDropdownOpen(false);
                                                            }
                                                        }}
                                                    />

                                                    {/* AUTOCOMPLETE DROPDOWN */}
                                                    {isPartnerDropdownOpen && (
                                                        <div 
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl z-50 max-h-[380px] overflow-hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60 transition-all animate-in fade-in zoom-in-95 duration-150"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                        >
                                                            <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                                                                {partners
                                                                    .filter(p => {
                                                                        if (!partnerSearch) return true;
                                                                        const search = partnerSearch.toLowerCase();
                                                                        const searchId = parseInt(partnerSearch.replace('#', ''));
                                                                        const matchesId = !isNaN(searchId) && p.id === searchId;
                                                                        return matchesId || (p.name || "").toLowerCase().includes(search) || (p.phone && p.phone.includes(search));
                                                                    })
                                                                    .sort((a, b) => {
                                                                        if (!partnerSearch) return (a.name || "").localeCompare(b.name || "", 'vi', { sensitivity: 'base' });
                                                                        const searchId = parseInt(partnerSearch.replace('#', ''));
                                                                        if (!isNaN(searchId)) {
                                                                            if (a.id === searchId) return -1;
                                                                            if (b.id === searchId) return 1;
                                                                        }
                                                                        return (a.name || "").localeCompare(b.name || "", 'vi', { sensitivity: 'base' });
                                                                    })
                                                                    .slice(0, 30)
                                                                    .map((p, idx) => (
                                                                        <div
                                                                            key={p.id}
                                                                            className={cn(
                                                                                "flex justify-between items-center px-4 py-3 transition-all relative cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800/80",
                                                                                activeSuggestionIndex === idx && "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                                                                            )}
                                                                            onClick={() => {
                                                                                const autoType = (p.debt_balance < 0) ? 'Payment' : 'Receipt';
                                                                                setFormData({ ...formData, partner_id: String(p.id), type: autoType });
                                                                                setPartnerSearch('');
                                                                                setIsPartnerDropdownOpen(false);
                                                                                if (amountInputRef.current) amountInputRef.current.focus();
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-3.5 min-w-0">
                                                                                <div className={cn(
                                                                                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                                                                                    activeSuggestionIndex === idx ? "bg-white/20 border-white/20" : "bg-slate-100 dark:bg-slate-800 border-transparent"
                                                                                )}>
                                                                                    <User size={18} />
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className={cn(
                                                                                            "font-black text-sm truncate",
                                                                                            activeSuggestionIndex === idx ? "text-white" : "text-slate-900 dark:text-white"
                                                                                        )}>
                                                                                            {p.name}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className={cn(
                                                                                        "flex items-center gap-3 text-xs tracking-tight transition-colors font-medium",
                                                                                        activeSuggestionIndex === idx ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                                                                                    )}>
                                                                                        {p.phone ? (
                                                                                            <span className="flex items-center gap-1 shrink-0">
                                                                                                <Phone size={12} strokeWidth={2.5} className="opacity-70" />
                                                                                                {p.phone}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="italic opacity-60">Chưa có SĐT</span>
                                                                                        )}
                                                                                        {p.address && (
                                                                                            <span className="flex items-center gap-1 truncate max-w-[220px]">
                                                                                                <MapPin size={12} strokeWidth={2.5} className="opacity-60" />
                                                                                                {p.address}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment method selector */}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-[#2d5016]/80 dark:text-emerald-400/80 uppercase tracking-wider ml-0.5">Hình thức thanh toán</label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                                                    className={cn(
                                                        "flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all duration-200 flex items-center justify-center gap-2",
                                                        formData.payment_method === 'Cash'
                                                            ? "bg-[#2d5016] text-white border-transparent shadow-sm"
                                                            : "bg-white/80 dark:bg-slate-800/80 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                                    )}
                                                >
                                                    <Coins size={16} /> Tiền mặt
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, payment_method: 'Bank' })}
                                                    className={cn(
                                                        "flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all duration-200 flex items-center justify-center gap-2",
                                                        formData.payment_method === 'Bank'
                                                            ? "bg-[#2d5016] text-white border-transparent shadow-sm"
                                                            : "bg-white/80 dark:bg-slate-800/80 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                                    )}
                                                >
                                                    <Building2 size={16} /> Ngân hàng
                                                </button>
                                            </div>
                                        </div>

                                        {formData.payment_method === 'Bank' && (
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-black text-[#2d5016]/80 dark:text-emerald-400/80 uppercase tracking-wider ml-0.5">Tài khoản nhận/chi</label>
                                                <CustomSelect
                                                    className="w-full"
                                                    value={formData.account_id}
                                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                                    options={bankAccounts.map(acc => ({
                                                        value: String(acc.id),
                                                        label: `${acc.bank_name} - ${acc.account_number} (${acc.account_holder})`
                                                    }))}
                                                />
                                            </div>
                                        )}

                                        {/* Amount input */}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-[#2d5016]/80 dark:text-emerald-400/80 uppercase tracking-wider ml-0.5">Số tiền giao dịch (đ)</label>
                                            <div className="relative flex items-center">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center pointer-events-none">
                                                    <Coins size={17} />
                                                </div>
                                                <input
                                                    type="text"
                                                    ref={amountInputRef}
                                                    className="w-full py-3.5 bg-white dark:bg-slate-900 border-2 border-primary/25 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-black font-mono text-2xl text-right rounded-2xl text-[#2d5016] dark:text-emerald-300 shadow-inner outline-none"
                                                    style={{ paddingLeft: '3.5rem', paddingRight: '2.5rem' }}
                                                    placeholder="0"
                                                    value={formData.amount === 0 ? '' : formatNumber(formData.amount)}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                                                        setFormData({ ...formData, amount: val });
                                                    }}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-primary/70 text-lg pointer-events-none select-none">đ</span>
                                            </div>
                                        </div>

                                        {/* REAL-TIME DEBT FORECAST BOX */}
                                        {selectedPartner && (
                                            (() => {
                                                const oldDebt = selectedPartner.debt_balance || 0;
                                                const enteredAmount = parseFloat(formData.amount) || 0;
                                                const expectedNewDebt = isReceipt ? oldDebt - enteredAmount : oldDebt + enteredAmount;
                                                return (
                                                    <div className="p-3.5 rounded-3xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-600/20 dark:border-emerald-500/20 space-y-2.5 shadow-xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400">
                                                                <Sparkles size={14} className="text-amber-500" />
                                                                Đối soát công nợ dự kiến
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/20">
                                                                Thời gian thực
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            {/* Old Debt */}
                                                            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-center items-center">
                                                                <div className="text-[9.5px] font-black text-muted-foreground uppercase tracking-wider">Nợ cũ</div>
                                                                <div className="text-xs sm:text-sm font-black font-mono mt-1 text-foreground">
                                                                    {formatDebt(oldDebt)}
                                                                </div>
                                                            </div>

                                                            {/* Transaction Amount */}
                                                            <div className="bg-white dark:bg-slate-900/90 p-2.5 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-center items-center">
                                                                <div className="text-[9.5px] font-black text-muted-foreground uppercase tracking-wider">
                                                                    {isReceipt ? 'Thu (-)' : 'Chi (+)'}
                                                                </div>
                                                                <div className={cn("text-xs sm:text-sm font-black font-mono mt-1", isReceipt ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                                                    {isReceipt ? '-' : '+'} {formatNumber(formData.amount)} đ
                                                                </div>
                                                            </div>

                                                            {/* Remaining Debt */}
                                                            <div className={cn(
                                                                "p-2.5 rounded-2xl border font-mono shadow-xs flex flex-col justify-center items-center",
                                                                expectedNewDebt === 0 
                                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                                                                    : expectedNewDebt > 0
                                                                        ? "bg-[#2d5016]/10 border-[#2d5016]/25 dark:border-emerald-500/30 text-[#2d5016] dark:text-[#4ade80]"
                                                                        : "bg-purple-500/15 border-purple-500/30 text-purple-800 dark:text-purple-300"
                                                            )}>
                                                                <div className="text-[9.5px] font-black uppercase tracking-wider opacity-80">Còn lại</div>
                                                                <div className="text-xs sm:text-sm font-black mt-1">
                                                                    {formatDebt(expectedNewDebt)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Summary Notice */}
                                                        <div className="py-2 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-600/15 dark:border-emerald-500/20 text-center text-xs font-bold shadow-xs">
                                                            {expectedNewDebt === 0 ? (
                                                                <span className="text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                                                                    ✨ Sau khi {isReceipt ? 'thu' : 'chi'}, đối tác sẽ <b className="font-black">hết sạch nợ (0 đ)</b>
                                                                </span>
                                                            ) : expectedNewDebt > 0 ? (
                                                                <span className="text-[#2d5016] dark:text-[#4ade80] flex items-center justify-center gap-1.5">
                                                                    📌 Sau khi {isReceipt ? 'thu' : 'chi'}, đối tác còn nợ: <b className="font-mono font-black">{formatNumber(expectedNewDebt)} đ</b>
                                                                </span>
                                                            ) : (
                                                                <span className="text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1.5">
                                                                    💡 Sau khi {isReceipt ? 'thu' : 'chi'}, đối tác dư tiền: <b className="font-mono font-black">{formatNumber(Math.abs(expectedNewDebt))} đ</b>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-[#2d5016]/80 dark:text-emerald-400/80 uppercase tracking-wider ml-0.5">Ghi chú phiếu</label>
                                            <textarea
                                                className="w-full p-3.5 bg-white dark:bg-slate-900 border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm min-h-[75px] rounded-2xl resize-none outline-none text-foreground placeholder:text-muted-foreground/60"
                                                placeholder="Ghi chú chi tiết mục đích thu/chi quỹ..."
                                                value={formData.note}
                                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                            />
                                        </div>

                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className={cn(
                                                "w-full text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 uppercase tracking-[0.15em] relative overflow-hidden group/btn cursor-pointer",
                                                isReceipt
                                                    ? "bg-gradient-to-r from-[#2d5016] via-[#3a6820] to-[#4a7c59] hover:brightness-110"
                                                    : "bg-gradient-to-r from-[#8b6f47] via-[#a38053] to-[#d4a574] hover:brightness-110"
                                            )}
                                        >
                                            {loading ? <RefreshCcw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                            <span>{loading ? 'ĐANG XỬ LÝ...' : `XÁC NHẬN PHIẾU ${isReceipt ? 'THU' : 'CHI'}`}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Live Preview & Partner / Fund Status */}
                                <div className="lg:col-span-5 flex flex-col min-h-0 space-y-4">
                                    {/* Top Partner Balance Banner or Fund Stats */}
                                    {selectedPartner ? (
                                        <div className={cn(
                                            "text-white p-5 rounded-3xl shadow-sm transition-all duration-500 relative overflow-hidden shrink-0",
                                            isReceipt ? "bg-gradient-to-br from-emerald-600 via-[#2d5016] to-[#065f46]" : "bg-gradient-to-br from-amber-700 via-[#8b6f47] to-amber-900"
                                        )}>
                                            <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                                                <Wallet size={160} />
                                            </div>
                                            <div className="relative z-10 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="text-[10px] font-black opacity-75 uppercase tracking-[0.25em] mb-1">Dư nợ đối tác hiện tại</div>
                                                        <div className="text-2xl md:text-3xl font-black tracking-tight font-mono">{formatDebt(selectedPartner.debt_balance)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="px-2 py-0.5 bg-white/20 text-white rounded-lg text-xs font-mono font-bold">#{selectedPartner.id}</span>
                                                        <div className="text-xs font-bold font-mono opacity-90 mt-1">{selectedPartner.phone || 'Chưa có SĐT'}</div>
                                                    </div>
                                                </div>

                                                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex justify-between items-center text-xs">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Dự kiến sau thu/chi:</span>
                                                    <span className="font-mono font-black text-sm">
                                                        {formatDebt(
                                                            isReceipt 
                                                                ? (selectedPartner.debt_balance || 0) - (parseFloat(formData.amount) || 0)
                                                                : (selectedPartner.debt_balance || 0) + (parseFloat(formData.amount) || 0)
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-white p-5 rounded-3xl shadow-sm bg-gradient-to-br from-[#2d5016] to-[#4a7c59] flex flex-col justify-between relative overflow-hidden shrink-0">
                                            <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
                                                <Coins size={160} />
                                            </div>
                                            <div className="relative z-10 space-y-3">
                                                <div>
                                                    <div className="text-[10px] font-black opacity-75 uppercase tracking-[0.25em] mb-1">Tồn Quỹ Tiền Mặt</div>
                                                    <div className="text-2xl md:text-3xl font-black tracking-tighter font-mono">
                                                        {formatNumber(
                                                            vouchers.filter(v => v.type === 'Receipt').reduce((sum, v) => sum + v.amount, 0) -
                                                            vouchers.filter(v => v.type === 'Payment').reduce((sum, v) => sum + v.amount, 0)
                                                        )} đ
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20 text-xs">
                                                    <div>
                                                        <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-0.5">Tổng Thu Kỳ Lọc</p>
                                                        <p className="text-sm font-black text-emerald-300">+{formatNumber(vouchers.filter(v => v.type === 'Receipt').reduce((sum, v) => sum + v.amount, 0))} đ</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-0.5">Tổng Chi Kỳ Lọc</p>
                                                        <p className="text-sm font-black text-rose-300">-{formatNumber(vouchers.filter(v => v.type === 'Payment').reduce((sum, v) => sum + v.amount, 0))} đ</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* LIVE PREVIEW VOUCHER SLIP */}
                                    <div className="flex-1 flex flex-col min-h-0 bg-white/80 dark:bg-slate-900/80 border border-border/90 p-5 md:p-6 rounded-3xl backdrop-blur-md shadow-sm space-y-4 overflow-y-auto custom-scrollbar">
                                        {/* Header with Live Badge */}
                                        <div className="flex justify-between items-start pb-3 border-b border-border/80 shrink-0">
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-[#2d5016] dark:text-[#4ade80] tracking-wider">
                                                    {settings?.shop_name || 'LYANG POS'}
                                                </h4>
                                                <p className="text-[10.5px] text-muted-foreground line-clamp-1">{settings?.shop_address || 'Hệ thống Quản lý Bán hàng'}</p>
                                                <p className="text-[10.5px] text-muted-foreground font-mono">SĐT: {settings?.shop_phone || '---'}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Live Preview
                                                </span>
                                                <span className="text-[9.5px] font-mono text-muted-foreground">Mẫu số: 01-TT</span>
                                            </div>
                                        </div>

                                        {/* Voucher Title */}
                                        <div className="text-center py-1 space-y-1">
                                            <h3 className={cn(
                                                "text-lg md:text-xl font-black uppercase tracking-wider",
                                                isReceipt ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                                            )}>
                                                {isReceipt ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN'}
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground italic">
                                                {formData.payment_method === 'Cash' 
                                                    ? '(Phương thức: Tiền mặt)' 
                                                    : `(Phương thức: Chuyển khoản ${bankAccounts.find(b => b.id.toString() === formData.account_id?.toString())?.bank_name || 'Ngân hàng'})`}
                                            </p>
                                            <p className="text-[10px] font-mono text-muted-foreground">
                                                Ngày: {formatDate(new Date())}
                                            </p>
                                        </div>

                                        {/* Voucher Fields */}
                                        <div className="space-y-2.5 text-xs font-medium bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-border/60">
                                            <div className="flex justify-between items-center py-1 border-b border-border/40">
                                                <span className="text-muted-foreground">{isReceipt ? 'Họ tên người nộp:' : 'Họ tên người nhận:'}</span>
                                                <span className="font-bold text-foreground uppercase tracking-wide">
                                                    {selectedPartner ? selectedPartner.name : 'Khách lẻ / Khác'}
                                                </span>
                                            </div>

                                            {selectedPartner && (
                                                <div className="flex justify-between items-center py-1 border-b border-border/40">
                                                    <span className="text-muted-foreground">Số điện thoại:</span>
                                                    <span className="font-mono font-bold text-foreground">
                                                        {selectedPartner.phone || '---'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start py-1 border-b border-border/40 gap-3">
                                                <span className="text-muted-foreground shrink-0">{isReceipt ? 'Lý do nộp:' : 'Lý do chi:'}</span>
                                                <span className="text-right text-foreground italic font-normal line-clamp-2">
                                                    {formData.note || (isReceipt ? 'Thu tiền bán hàng / thanh toán công nợ' : 'Chi tiền nhập hàng / quỹ chi tiêu')}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center py-2 border-b border-border/60">
                                                <span className="text-muted-foreground font-bold">{isReceipt ? 'Số tiền thu:' : 'Số tiền chi:'}</span>
                                                <span className={cn(
                                                    "text-xl font-black font-mono tracking-tight",
                                                    isReceipt ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                                                )}>
                                                    {formatNumber(formData.amount || 0)} VNĐ
                                                </span>
                                            </div>

                                            {selectedPartner && (
                                                <div className="pt-1 flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                                                    <span>Nợ trước: <b className="text-foreground">{formatDebt(selectedPartner.debt_balance)}</b></span>
                                                    <span>➜</span>
                                                    <span>Nợ sau: <b className={isReceipt ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                                                        {formatDebt(
                                                            isReceipt 
                                                                ? (selectedPartner.debt_balance || 0) - (parseFloat(formData.amount) || 0)
                                                                : (selectedPartner.debt_balance || 0) + (parseFloat(formData.amount) || 0)
                                                        )}
                                                    </b></span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 3 Signatures */}
                                        <div className="grid grid-cols-3 text-center pt-2 text-[10.5px] text-muted-foreground">
                                            <div>
                                                <p className="font-bold text-foreground">{isReceipt ? 'Người nộp tiền' : 'Người nhận tiền'}</p>
                                                <p className="italic text-[9px] text-muted-foreground mt-0.5">(Ký, họ tên)</p>
                                                <div className="h-8"></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">Người lập phiếu</p>
                                                <p className="italic text-[9px] text-muted-foreground mt-0.5">(Ký, họ tên)</p>
                                                <div className="h-8"></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">Thủ quỹ</p>
                                                <p className="italic text-[9px] text-muted-foreground mt-0.5">(Ký, họ tên)</p>
                                                <div className="h-8"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeMainTab === 'cash_ledger' && (
                    <div className="w-full max-w-full px-1 space-y-4">
                        {/* Sổ Chi Tiết Tiền Mặt (Full Width Table) */}
                        <div className="bg-transparent border border-border p-3 rounded-2xl shadow-none flex flex-col relative overflow-hidden w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase flex items-center gap-2 tracking-[0.4em] ml-1 mt-1">
                                        <History size={15} className="text-[#4a7c59]" /> SỔ CHI TIẾT TIỀN MẶT
                                    </h3>
                                    <div className="relative mt-2">
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm phiếu, đối tác, ghi chú..."
                                            value={ledgerSearchQuery}
                                            onChange={e => setLedgerSearchQuery(e.target.value)}
                                            className="pl-8 pr-3 py-1 bg-transparent border border-border rounded-xl text-xs focus:outline-none focus:border-primary text-gray-900 dark:text-emerald-50 placeholder-slate-400 w-64"
                                        />
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 mt-2">
                                    Tổng cộng: {filteredVouchers.length} bản ghi
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                                    <thead className="bg-transparent border-b border-border text-[10px] font-black tracking-widest text-muted uppercase">
                                        <tr>
                                            <th className="w-40 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Thời gian</th>
                                            <th className="w-24 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Mã phiếu</th>
                                            <th className="p-4 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Đối tác</th>
                                            <th className="w-32 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Loại phiếu</th>
                                            <th className="w-96 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Ghi chú / Nguồn</th>
                                            <th className="w-36 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Số tiền</th>
                                            <th className="w-16 py-3 px-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredVouchers.length > 0 ? (
                                            (() => {
                                                const startIndex = (fundPage - 1) * fundItemsPerPage;
                                                const paginated = filteredVouchers.slice(startIndex, startIndex + fundItemsPerPage);
                                                return paginated.map((v) => (
                                                    <tr key={v.id} className="group hover:bg-[#2d5016]/5 dark:hover:bg-slate-800/40 transition-all">
                                                        <td className="py-3 px-4 text-xs tabular-nums">
                                                            {renderTimeCell(v.date)}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-black text-primary dark:text-[#d4a574]">
                                                            {v.type === 'Receipt' ? `PT-${v.id}` : `PC-${v.id}`}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-black uppercase text-gray-900 dark:text-emerald-50">
                                                            {v.partner_name === 'Khác' ? 'Khách lẻ' : v.partner_name}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                                v.type === 'Receipt' 
                                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" 
                                                                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800"
                                                            )}>
                                                                {v.type === 'Receipt' ? 'PHIẾU THU' : 'PHIẾU CHI'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-bold text-slate-400">
                                                            <div className="flex flex-col">
                                                                <span className="truncate max-w-lg" title={v.note}>{v.note || '-'}</span>
                                                                {v.source === 'auto' && (
                                                                    <span className="text-[7px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">
                                                                        Tự động {v.order_display_id ? `(Đơn #${v.order_display_id})` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={cn(
                                                            "py-3 px-4 text-right text-sm font-black tabular-nums",
                                                            v.type === 'Receipt' ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {v.type === 'Receipt' ? '+' : '-'}{formatNumber(v.amount)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            {v.source !== 'auto' && (
                                                                <button
                                                                    onClick={() => handleDeleteVoucher(v.id, v.source)}
                                                                    className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                    title="Xóa phiếu"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ));
                                            })()
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="p-16 text-center text-slate-400 font-bold uppercase text-[10px]">
                                                    Không có dữ liệu thu chi phù hợp
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {vouchers.length > 0 && (
                                        <tfoot>
                                            <tr>
                                                <td colSpan="7" className="py-2 pt-4 px-0">
                                                    <div className="bg-slate-50/80 dark:bg-slate-900/40 border border-border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-black">
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">TỔNG CỘNG HỢP KỲ</span>
                                                        <div className="flex gap-6 text-[9px] font-black uppercase tracking-wider">
                                                            <span className="text-emerald-600">Tổng Thu: +{formatNumber(vouchers.filter(v => v.type === 'Receipt').reduce((sum, v) => sum + v.amount, 0))} đ</span>
                                                            <span className="text-rose-600">Tổng Chi: -{formatNumber(vouchers.filter(v => v.type === 'Payment').reduce((sum, v) => sum + v.amount, 0))} đ</span>
                                                        </div>
                                                        <div className="text-right text-sm font-black tabular-nums">
                                                            {(() => {
                                                                const totalReceipts = vouchers.filter(v => v.type === 'Receipt').reduce((sum, v) => sum + v.amount, 0);
                                                                const totalPayments = vouchers.filter(v => v.type === 'Payment').reduce((sum, v) => sum + v.amount, 0);
                                                                const netCash = totalReceipts - totalPayments;
                                                                return (
                                                                    <span className={cn(netCash >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                                        Tồn: {formatNumber(netCash)} đ
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            {filteredVouchers.length > fundItemsPerPage && (
                                <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-border">
                                    <button
                                        disabled={fundPage === 1}
                                        onClick={() => setFundPage(prev => Math.max(1, prev - 1))}
                                        className="px-3 py-1 bg-transparent border border-border hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-xs font-bold text-slate-400">
                                        Trang {fundPage} / {Math.ceil(filteredVouchers.length / fundItemsPerPage)}
                                    </span>
                                    <button
                                        disabled={fundPage >= Math.ceil(filteredVouchers.length / fundItemsPerPage)}
                                        onClick={() => setFundPage(prev => Math.min(Math.ceil(filteredVouchers.length / fundItemsPerPage), prev + 1))}
                                        className="px-3 py-1 bg-transparent border border-border hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeMainTab === 'bank_ledger' && (
                    <div className="w-full max-w-full px-1 space-y-4">
                        {/* Sổ Chi Tiết Ngân Hàng */}
                        <div className="bg-transparent border border-border p-3 rounded-2xl shadow-none flex flex-col relative overflow-hidden w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase flex items-center gap-2 tracking-[0.4em] ml-1 mt-1">
                                        <History size={15} className="text-[#4a7c59]" /> SỔ CHI TIẾT NGÂN HÀNG
                                    </h3>
                                    <div className="relative mt-2">
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm GD, đối tác, ghi chú..."
                                            value={ledgerSearchQuery}
                                            onChange={e => setLedgerSearchQuery(e.target.value)}
                                            className="pl-8 pr-3 py-1 bg-transparent border border-border rounded-xl text-xs focus:outline-none focus:border-primary text-gray-900 dark:text-emerald-50 placeholder-slate-400 w-64"
                                        />
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 mt-2">
                                    Tổng cộng: {filteredBankTransactions.length} bản ghi
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                                    <thead className="bg-transparent border-b border-border text-[10px] font-black tracking-widest text-muted uppercase">
                                        <tr>
                                            <th className="w-40 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Thời gian</th>
                                            <th className="w-24 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Mã GD</th>
                                            <th className="p-4 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Tài khoản</th>
                                            <th className="p-4 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Đối tác</th>
                                            <th className="w-32 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Loại giao dịch</th>
                                            <th className="w-96 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Ghi chú</th>
                                            <th className="w-36 py-3 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Số tiền</th>
                                            <th className="w-16 py-3 px-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredBankTransactions.length > 0 ? (
                                            (() => {
                                                const startIndex = (fundPage - 1) * fundItemsPerPage;
                                                const paginated = filteredBankTransactions.slice(startIndex, startIndex + fundItemsPerPage);
                                                return paginated.map((t) => (
                                                    <tr key={t.id} className="group hover:bg-[#2d5016]/5 dark:hover:bg-slate-800/40 transition-all">
                                                        <td className="py-3 px-4 text-xs font-medium text-slate-500 tabular-nums">
                                                            {formatDate(t.date)}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-black text-primary dark:text-[#d4a574]">
                                                            {t.type === 'Deposit' ? `NT-${t.id}` : `CT-${t.id}`}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-black text-gray-900 dark:text-emerald-50">
                                                            {t.bank_name}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-black uppercase text-gray-900 dark:text-emerald-50">
                                                            {t.partner_name === 'Khác' || !t.partner_name ? 'Khách lẻ' : t.partner_name}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                                                                t.type === 'Deposit' 
                                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" 
                                                                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800"
                                                            )}>
                                                                {t.type === 'Deposit' ? 'TIỀN VÀO' : 'TIỀN RA'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-xs font-bold text-slate-400 truncate" title={t.note}>
                                                            {t.note || '-'}
                                                        </td>
                                                        <td className={cn(
                                                            "py-3 px-4 text-right text-sm font-black tabular-nums",
                                                            t.type === 'Deposit' ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {t.type === 'Deposit' ? '+' : '-'}{formatNumber(t.amount)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button
                                                                onClick={() => handleDeleteBankTransaction(t.id)}
                                                                className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                title="Xóa giao dịch"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="p-16 text-center text-slate-400 font-bold uppercase text-[10px]">
                                                    Không có dữ liệu giao dịch ngân hàng phù hợp
                                                </td>
                                            </tr>
                                        )}
                                        {filteredBankTransactions.length > 0 && (
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="8" className="py-2 pt-4 px-0">
                                                        <div className="bg-slate-50/80 dark:bg-slate-900/40 border border-border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-black">
                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">TỔNG CỘNG HỢP KỲ</span>
                                                            <div className="flex gap-6 text-[9px] font-black uppercase tracking-wider">
                                                                <span className="text-emerald-600">Tổng Thu: +{formatNumber(filteredBankTransactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0))} đ</span>
                                                                <span className="text-rose-600">Tổng Chi: -{formatNumber(filteredBankTransactions.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0))} đ</span>
                                                            </div>
                                                            <div className="text-right text-sm font-black tabular-nums">
                                                                {(() => {
                                                                    const totalReceipts = filteredBankTransactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
                                                                    const totalPayments = filteredBankTransactions.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);
                                                                    const netBank = totalReceipts - totalPayments;
                                                                    return (
                                                                        <span className={cn(netBank >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                                            Tồn: {formatNumber(netBank)} đ
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredBankTransactions.length > fundItemsPerPage && (
                                <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-border">
                                    <button
                                        disabled={fundPage === 1}
                                        onClick={() => setFundPage(prev => Math.max(1, prev - 1))}
                                        className="px-3 py-1 bg-transparent border border-border hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-xs font-bold text-slate-400">
                                        Trang {fundPage} / {Math.ceil(filteredBankTransactions.length / fundItemsPerPage)}
                                    </span>
                                    <button
                                        disabled={fundPage >= Math.ceil(filteredBankTransactions.length / fundItemsPerPage)}
                                        onClick={() => setFundPage(prev => Math.min(Math.ceil(filteredBankTransactions.length / fundItemsPerPage), prev + 1))}
                                        className="px-3 py-1 bg-transparent border border-border hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <PartnerEditModal
                isOpen={showQuickAddPartner}
                partner={{ name: quickAddName, is_customer: true, is_supplier: false }}
                onClose={() => setShowQuickAddPartner(false)}
                onSave={(newPartner) => {
                    queryClient.invalidateQueries({ queryKey: ['partners'] });
                    setShowQuickAddPartner(false);
                    if (newPartner) {
                        setFormData({ ...formData, partner_id: newPartner.id.toString() });
                        setPartnerSearch('');
                        setTimeout(() => amountInputRef.current?.focus(), 100);
                    }
                }}
            />

            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {confirm && (
                <ConfirmModal
                    isOpen={!!confirm}
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                    type={confirm.type}
                />
            )}

            {/* PRINTABLE VOUCHER TEMPLATE */}
            {voucherToPrint && (
                <div id="voucher-print-section" className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[999999]">
                    <style type="text/css" media="print">
                        {`
                            @page { size: auto; margin: 10mm; }
                            body { -webkit-print-color-adjust: exact; font-family: 'Times New Roman', serif; }
                            .no-print { display: none !important; }
                        `}
                    </style>
                    <div className="max-w-[650px] mx-auto border-2 border-black p-6 space-y-4">
                        <div className="flex justify-between items-start border-b border-black pb-3">
                            <div>
                                <h2 className="font-bold text-base uppercase">{settings?.shop_name || 'LYANG POS'}</h2>
                                <p className="text-xs">{settings?.shop_address || 'Hệ thống Quản lý Bán hàng LyangPOS'}</p>
                                <p className="text-xs">SĐT: {settings?.shop_phone || '---'}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="font-bold text-xs uppercase">Mẫu số: 01-TT</h3>
                                <p className="text-xs text-gray-600">Mã phiếu: <b>{voucherToPrint.code || (voucherToPrint.type === 'Receipt' ? `PT-${voucherToPrint.id}` : `PC-${voucherToPrint.id}`)}</b></p>
                                <p className="text-xs text-gray-600">Ngày lập: {formatDate(voucherToPrint.created_at || new Date())}</p>
                            </div>
                        </div>

                        <div className="text-center py-2">
                            <h1 className="text-2xl font-black uppercase tracking-wider">
                                {voucherToPrint.type === 'Receipt' ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN'}
                            </h1>
                            <p className="text-xs italic">
                                {voucherToPrint.payment_method === 'Cash' ? '(Phương thức: Tiền mặt)' : `(Phương thức: Chuyển khoản ${voucherToPrint.account?.bank_name || ''})`}
                            </p>
                        </div>

                        <div className="space-y-2.5 text-sm">
                            <div className="flex"><span className="w-48 font-semibold">{voucherToPrint.type === 'Receipt' ? 'Họ tên người nộp:' : 'Họ tên người nhận:'}</span> <span className="font-bold uppercase">{voucherToPrint.partner_name || 'Khách lẻ'} {voucherToPrint.partner_id ? `(#${voucherToPrint.partner_id})` : ''}</span></div>
                            <div className="flex"><span className="w-48 font-semibold">Số điện thoại:</span> <span>{voucherToPrint.partner_phone || '---'}</span></div>
                            <div className="flex"><span className="w-48 font-semibold">Lý do {voucherToPrint.type === 'Receipt' ? 'nộp' : 'chi'}:</span> <span>{voucherToPrint.note || 'Thanh toán công nợ / Quỹ'}</span></div>
                            <div className="flex items-baseline"><span className="w-48 font-semibold">Số tiền {voucherToPrint.type === 'Receipt' ? 'thu' : 'chi'}:</span> <span className="text-lg font-black">{formatNumber(voucherToPrint.amount)} VNĐ</span></div>
                            {voucherToPrint.old_debt !== undefined && (
                                <div className="flex bg-gray-100 p-2.5 rounded text-xs justify-between font-mono mt-2">
                                    <span>Dư nợ trước: <b>{formatDebt(voucherToPrint.old_debt)}</b></span>
                                    <span>Dư nợ sau {voucherToPrint.type === 'Receipt' ? 'thu' : 'chi'}: <b>{formatDebt(voucherToPrint.new_debt)}</b></span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 text-center pt-8 text-xs font-semibold">
                            <div>
                                <p className="font-bold">{voucherToPrint.type === 'Receipt' ? 'Người nộp tiền' : 'Người nhận tiền'}</p>
                                <p className="italic text-[10px] text-gray-500 mt-1">(Ký, họ tên)</p>
                            </div>
                            <div>
                                <p className="font-bold">Người lập phiếu</p>
                                <p className="italic text-[10px] text-gray-500 mt-1">(Ký, họ tên)</p>
                            </div>
                            <div>
                                <p className="font-bold">Thủ quỹ</p>
                                <p className="italic text-[10px] text-gray-500 mt-1">(Ký, họ tên)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
