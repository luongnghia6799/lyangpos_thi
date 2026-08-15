import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';
import { Search, Plus, Wallet, History, FileText, Trash2, ArrowUpRight, ArrowDownLeft, X, Coins, Calendar, User, RefreshCcw, CheckCircle } from 'lucide-react';
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
    const partners = partnersData || [];
    const [vouchers, setVouchers] = useState([]);
    const [bankTransactions, setBankTransactions] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [lastVoucher, setLastVoucher] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        partner_id: '',
        amount: 0,
        note: '',
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
            if (formData.payment_method === 'Cash') {
                await axios.post('/api/vouchers', {
                    partner_id: formData.partner_id || null,
                    amount: formData.amount,
                    note: formData.note,
                    type: formData.type
                });
                fetchVouchers();
            } else {
                await axios.post('/api/bank-transactions', {
                    account_id: parseInt(formData.account_id),
                    amount: formData.amount,
                    type: formData.type === 'Receipt' ? 'Deposit' : 'Withdrawal',
                    note: formData.note,
                    partner_id: formData.partner_id ? parseInt(formData.partner_id) : null
                });
                fetchBankTransactions();
                fetchBankAccounts();
            }
            await queryClient.invalidateQueries({ queryKey: ['partners'] });
            broadcastUpdate();
            resetForm();
            setToast({ message: "Đã lưu phiếu thành công!", type: "success" });
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
            account_id: bankAccounts.length > 0 ? String(bankAccounts[0].id) : ''
        }));
        setPartnerSearch('');
        setLastVoucher(null);
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

    const selectedPartner = partners.find(p => p.id === parseInt(formData.partner_id));
    const isReceipt = formData.type === 'Receipt';

    return (
        <div className="pt-2 px-4 pb-2 w-full transition-colors h-[calc(100vh-30px)] overflow-hidden flex flex-col font-sans relative">
            <div className="flex-none flex flex-col no-print">
                {/* Top Bar / Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                            <Wallet className="text-primary shrink-0" size={32} />
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

                    <div className="flex bg-transparent p-1.5 rounded-[2rem] border border-border shadow-none">
                        <button
                            onClick={() => setActiveMainTab('fund')}
                            className={cn("px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black tracking-widest uppercase transition-all duration-300", activeMainTab === 'fund' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none" : "text-[#8b6f47] hover:bg-[#d4a574]/10")}
                        >
                            TẠO PHIẾU
                        </button>
                        <button
                            onClick={() => setActiveMainTab('cash_ledger')}
                            className={cn("px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black tracking-widest uppercase transition-all duration-300", activeMainTab === 'cash_ledger' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none" : "text-[#8b6f47] hover:bg-[#d4a574]/10")}
                        >
                            SỔ TIỀN MẶT
                        </button>
                        <button
                            onClick={() => setActiveMainTab('bank_ledger')}
                            className={cn("px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black tracking-widest uppercase transition-all duration-300", activeMainTab === 'bank_ledger' ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none" : "text-[#8b6f47] hover:bg-[#d4a574]/10")}
                        >
                            SỔ NGÂN HÀNG
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-4 md:px-0 relative z-50">
                    {/* Left side: Sub-tabs (only for fund) */}
                    <div className="flex-1 min-w-[280px]">
                        {activeMainTab === 'fund' && (
                            <div className="inline-flex p-1 bg-transparent rounded-2xl border border-border shadow-none overflow-hidden">
                                 <button
                                    onClick={() => setFormData({ ...formData, type: 'Receipt' })}
                                    className={cn(
                                        "px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 uppercase tracking-widest duration-300",
                                        isReceipt ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none scale-[1.01]" : "text-[#8b6f47] hover:bg-[#d4a574]/10"
                                    )}
                                >
                                    <ArrowDownLeft size={16} className={isReceipt ? "animate-bounce" : ""} /> PHIẾU THU
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, type: 'Payment' })}
                                    className={cn(
                                        "px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 uppercase tracking-widest duration-300",
                                        !isReceipt ? "bg-gradient-to-r from-[#8b6f47] to-[#d4a574] text-white shadow-none scale-[1.01]" : "text-[#8b6f47] hover:bg-[#d4a574]/10"
                                    )}
                                >
                                    <ArrowUpRight size={16} className={!isReceipt ? "animate-bounce" : ""} /> PHIẾU CHI
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right side: Date Filter */}
                    <div className="flex items-center gap-2 bg-transparent p-1.5 rounded-2xl shadow-none border border-border">
                        <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-[#2d5016]/10 to-[#4a7c59]/10 rounded-xl border border-[#d4a574]/20">
                            <Calendar size={14} className="text-[#2d5016] dark:text-[#4a7c59] mr-1.5" />
                            <span className="text-[9px] font-black text-[#2d5016] dark:text-[#d4a574] uppercase tracking-wider">KỲ LỌC</span>
                        </div>

                        <div className="flex items-center gap-1.5 px-2 h-8">
                            <CustomSelect
                                className="border-0 p-0 min-w-[70px]"
                                value={dateFilter.day}
                                onChange={e => setDateFilter({ ...dateFilter, day: e.target.value })}
                                options={[
                                    { value: "", label: "Ngày" },
                                    ...[...Array(31)].map((_, i) => ({ value: String(i + 1), label: String(i + 1) }))
                                ]}
                            />
                            <span className="text-[#d4a574]/40 font-bold text-xs">/</span>
                            <CustomSelect
                                className="border-0 p-0 min-w-[80px]"
                                value={dateFilter.month}
                                onChange={e => setDateFilter({ ...dateFilter, month: e.target.value })}
                                options={[
                                    { value: "", label: "Tháng" },
                                    ...[...Array(12)].map((_, i) => ({ value: String(i + 1), label: String(i + 1) }))
                                ]}
                            />
                            <span className="text-[#d4a574]/40 font-bold text-xs">/</span>
                            <CustomSelect
                                className="border-0 p-0 min-w-[70px]"
                                value={dateFilter.quarter}
                                onChange={e => setDateFilter({ ...dateFilter, quarter: e.target.value })}
                                options={[
                                    { value: "", label: "Quý" },
                                    { value: "1", label: "Q1" },
                                    { value: "2", label: "Q2" },
                                    { value: "3", label: "Q3" },
                                    { value: "4", label: "Q4" }
                                ]}
                            />
                            <span className="text-[#d4a574]/40 font-bold text-xs">/</span>
                            <CustomSelect
                                className="border-0 p-0 min-w-[80px]"
                                value={dateFilter.year}
                                onChange={e => setDateFilter({ ...dateFilter, year: e.target.value })}
                                options={[
                                    { value: "", label: "Năm" },
                                    ...[...Array(5)].map((_, i) => {
                                        const y = new Date().getFullYear() - i;
                                        return { value: String(y), label: String(y) };
                                    })
                                ]}
                            />
                        </div>

                        <button
                            onClick={() => {
                                const today = new Date();
                                setDateFilter({
                                    year: today.getFullYear().toString(),
                                    month: (today.getMonth() + 1).toString(),
                                    day: today.getDate().toString(),
                                    quarter: ''
                                });
                            }}
                            className="px-3 py-1.5 bg-[#2d5016] text-white text-[9px] font-black uppercase rounded-xl hover:bg-[#4a7c59] transition-all shadow-none tracking-wider"
                        >
                            Hôm nay
                        </button>
                        <button
                            onClick={() => setDateFilter({ year: '', month: '', day: '', quarter: '' })}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                            title="Xóa lọc"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 flex flex-col items-center text-emerald-950 dark:text-emerald-50 w-full font-sans">
                {activeMainTab === 'fund' && (
                    <div className="w-full max-w-6xl space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Fund Tab UI */}
                            <div className="bg-transparent border border-border p-10 rounded-[3rem] space-y-8 relative overflow-hidden group shadow-none">
                                <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:rotate-12 group-hover:scale-110">
                                    <Wallet size={240} className="text-[#4a7c59]" />
                                </div>

                                <h2 className="text-3xl font-black text-[#2d5016] dark:text-[#4a7c59] flex items-center gap-4 uppercase tracking-tighter relative z-10">
                                    <div className={cn("p-1.5 rounded-xl text-white shadow-none", isReceipt ? "bg-[#2d5016]" : "bg-[#8b6f47]")}>
                                        <Plus size={24} />
                                    </div>
                                    Tạo {isReceipt ? 'Phiếu Thu' : 'Phiếu Chi'} Mới
                                </h2>

                                <div className="space-y-6 relative z-10">
                                    <div className="space-y-2" onBlur={() => setTimeout(() => setIsPartnerDropdownOpen(false), 200)}>
                                        <label className="text-[10px] font-black text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-[0.2em] ml-1">Đối tác</label>
                                        <div className="relative">
                                            <User className="absolute left-5 top-5 text-emerald-500/50" size={24} />
                                            <input
                                                type="text"
                                                className="input-premium w-full p-5 font-black text-lg"
                                                style={{ paddingLeft: '3.5rem' }}
                                                ref={partnerInputRef}
                                                placeholder="Gõ để tìm tên đối tác..."
                                                value={selectedPartner ? `#${selectedPartner.id} ${selectedPartner.name}` : partnerSearch}
                                                onChange={(e) => {
                                                    setPartnerSearch(e.target.value);
                                                    if (formData.partner_id) setFormData({ ...formData, partner_id: '' });
                                                    setIsPartnerDropdownOpen(true);
                                                    setActiveSuggestionIndex(-1);
                                                }}
                                                onFocus={() => {
                                                    setIsPartnerDropdownOpen(true);
                                                    setActiveSuggestionIndex(-1);
                                                }}
                                                onKeyDown={(e) => {
                                                    const filtered = partners
                                                        .filter(p => {
                                                            const searchId = parseInt(partnerSearch);
                                                            const matchesId = !isNaN(searchId) && p.id === searchId;
                                                            return matchesId || (p.name || "").toLowerCase().includes(partnerSearch.toLowerCase()) || p.phone?.includes(partnerSearch);
                                                        })
                                                        .sort((a, b) => {
                                                            const searchId = parseInt(partnerSearch);
                                                            if (!isNaN(searchId)) {
                                                                if (a.id === searchId) return -1;
                                                                if (b.id === searchId) return 1;
                                                            }
                                                            return (a.name || "").localeCompare(b.name || "", 'vi', { sensitivity: 'base' });
                                                        })
                                                        .slice(0, 30);

                                                    if (isPartnerDropdownOpen && !selectedPartner && filtered.length > 0) {
                                                        if (e.key === 'ArrowDown') {
                                                            e.preventDefault();
                                                            setActiveSuggestionIndex(prev => 
                                                                prev < filtered.length - 1 ? prev + 1 : 0
                                                            );
                                                        } else if (e.key === 'ArrowUp') {
                                                            e.preventDefault();
                                                            setActiveSuggestionIndex(prev => 
                                                                prev > 0 ? prev - 1 : filtered.length - 1
                                                            );
                                                        } else if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const activeIndex = activeSuggestionIndex >= 0 && activeSuggestionIndex < filtered.length ? activeSuggestionIndex : 0;
                                                            const chosen = filtered[activeIndex];
                                                            if (chosen) {
                                                                setFormData({ ...formData, partner_id: String(chosen.id) });
                                                                setPartnerSearch('');
                                                                setIsPartnerDropdownOpen(false);
                                                                if (amountInputRef.current) amountInputRef.current.focus();
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                            {isPartnerDropdownOpen && !formData.partner_id && (
                                                <div className="absolute z-[9999] w-full mt-2 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-xl max-h-60 overflow-y-auto no-scrollbar">
                                                    {partners
                                                        .filter(p => {
                                                            const searchId = parseInt(partnerSearch);
                                                            const matchesId = !isNaN(searchId) && p.id === searchId;
                                                            return matchesId || (p.name || "").toLowerCase().includes(partnerSearch.toLowerCase()) || p.phone?.includes(partnerSearch);
                                                        })
                                                        .sort((a, b) => {
                                                            const searchId = parseInt(partnerSearch);
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
                                                                    "p-4 cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-border dropdown-item",
                                                                    activeSuggestionIndex === idx && "bg-emerald-50/70 dark:bg-slate-800"
                                                                )}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, partner_id: String(p.id) });
                                                                    setPartnerSearch('');
                                                                    setIsPartnerDropdownOpen(false);
                                                                    if (amountInputRef.current) amountInputRef.current.focus();
                                                                }}
                                                            >
                                                                <div>
                                                                    <div className="font-black text-gray-900 dark:text-emerald-50 flex items-center gap-2">
                                                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">#{p.id}</span>
                                                                        {p.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-405 font-bold mt-0.5">{p.phone || 'Không có SĐT'}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nợ hiện tại</div>
                                                                    <div className={cn("text-xs font-black", p.debt_balance > 0 ? "text-blue-600" : p.debt_balance < 0 ? "text-red-650" : "text-slate-400")}>
                                                                        {formatDebt(p.debt_balance)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {partners.filter(p => (p.name || "").toLowerCase().includes(partnerSearch.toLowerCase()) || p.phone?.includes(partnerSearch)).length === 0 && (
                                                        <div className="p-6 text-center text-gray-400 text-xs font-bold space-y-3">
                                                            <div>Không tìm thấy đối tác "{partnerSearch}"</div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setQuickAddName(partnerSearch);
                                                                    setShowQuickAddPartner(true);
                                                                    setIsPartnerDropdownOpen(false);
                                                                }}
                                                                className="px-4 py-2 bg-[#2d5016] text-white text-[9px] font-black uppercase rounded-lg hover:bg-[#4a7c59] transition-all"
                                                            >
                                                                + Thêm Nhanh Đối Tác
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedPartner && (
                                        <div className="flex items-center justify-between p-4 bg-emerald-50/30 dark:bg-slate-800/30 border border-border rounded-2xl relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-sm uppercase">
                                                    {selectedPartner.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-800 dark:text-emerald-50 uppercase tracking-tight">{selectedPartner.name}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold">{selectedPartner.phone || 'Chưa cung cấp SĐT'}</div>
                                                </div>
                                            </div>
                                            <button
                                                title="Đổi đối tác"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-[0.2em] ml-1">Hình thức thanh toán</label>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                                                className={cn(
                                                    "flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all duration-300",
                                                    formData.payment_method === 'Cash'
                                                        ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white border-transparent"
                                                        : "bg-transparent text-gray-500 border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                Tiền mặt
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, payment_method: 'Bank' })}
                                                className={cn(
                                                    "flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all duration-300",
                                                    formData.payment_method === 'Bank'
                                                        ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white border-transparent"
                                                        : "bg-transparent text-gray-500 border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                Ngân hàng
                                            </button>
                                        </div>
                                    </div>

                                    {formData.payment_method === 'Bank' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-[0.2em] ml-1">Tài khoản nhận/chi</label>
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

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-[0.2em] ml-1">Số tiền giao dịch (đ)</label>
                                        <div className="relative">
                                            <Coins className="absolute left-5 top-5 text-emerald-500/50" size={24} />
                                            <input
                                                type="text"
                                                ref={amountInputRef}
                                                className="input-premium w-full p-5 font-black text-xl text-right pr-14"
                                                placeholder="0"
                                                value={formData.amount === 0 ? '' : formatNumber(formData.amount)}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                                                    setFormData({ ...formData, amount: val });
                                                }}
                                            />
                                            <span className="absolute right-5 top-5 font-black text-slate-400 text-lg">đ</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-[0.2em] ml-1">Ghi chú phiếu</label>
                                        <textarea
                                            className="input-premium w-full p-5 font-bold text-sm min-h-[100px] resize-none"
                                            placeholder="Ghi chú chi tiết mục đích thu/chi quỹ..."
                                            value={formData.note}
                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className={cn(
                                            "w-full bg-gradient-to-r text-white py-6 rounded-[2.5rem] font-black text-xl flex flex-col items-center justify-center transition-all shadow-none active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] relative overflow-hidden group/btn",
                                            isReceipt
                                                ? "from-[#2d5016] to-[#4a7c59]"
                                                : "from-[#8b6f47] to-[#d4a574]"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                                        <div className="relative z-10 flex items-center gap-4">
                                            {loading ? <RefreshCcw className="animate-spin" size={24} /> : <CheckCircle size={24} />}
                                            {loading ? 'ĐANG XỬ LÝ...' : `XÁC NHẬN PHIẾU ${isReceipt ? 'THU' : 'CHI'}`}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Info & Stats */}
                            <div className="space-y-8 flex flex-col justify-between">
                                {selectedPartner ? (
                                    <m.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "text-white p-10 rounded-[3.5rem] shadow-none transition-all duration-700 flex flex-col justify-between relative overflow-hidden h-full min-h-[350px]",
                                            isReceipt ? "bg-gradient-to-br from-emerald-500 to-[#065f46]" : "bg-gradient-to-br from-rose-500 to-rose-900"
                                        )}
                                    >
                                        <div className="absolute -bottom-10 -right-10 opacity-10">
                                            <Wallet size={240} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="text-[10px] font-black opacity-60 uppercase tracking-[0.5em] mb-3">Số dư công nợ hiện tại</div>
                                            <div className="text-4xl font-black tracking-tighter mb-8 font-mono">{formatDebt(selectedPartner.debt_balance)}</div>
                                            <div className="pt-8 border-t border-white/20 flex flex-col gap-2">
                                                <div className="font-black text-xl uppercase tracking-tighter flex items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 bg-white/20 text-white rounded-lg text-sm border border-white/20 shadow-lg">#{selectedPartner.id}</span>
                                                    {selectedPartner.name}
                                                </div>
                                                <div className="text-sm font-bold opacity-60 tracking-widest">{selectedPartner.phone || 'CHƯA CẬP NHẬT SỐ ĐIỆN THOẠI'}</div>
                                            </div>
                                        </div>
                                    </m.div>
                                ) : (
                                    <div className="text-white p-10 rounded-[3.5rem] shadow-none bg-gradient-to-br from-[#2d5016] to-[#4a7c59] flex flex-col justify-between relative overflow-hidden h-full min-h-[350px]">
                                        <div className="absolute -bottom-10 -right-10 opacity-10">
                                            <Coins size={240} />
                                        </div>
                                        <div className="relative z-10 space-y-6">
                                            <div>
                                                <div className="text-[10px] font-black opacity-75 uppercase tracking-[0.3em] mb-2">Tồn Quỹ Tiền Mặt</div>
                                                <div className="text-4xl font-black tracking-tighter font-mono">
                                                    {formatNumber(
                                                        vouchers.filter(v => v.type === 'Receipt').reduce((sum, v) => sum + v.amount, 0) -
                                                        vouchers.filter(v => v.type === 'Payment').reduce((sum, v) => sum + v.amount, 0)
                                                    )} đ
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/25">
                                                <div>
                                                    <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-1">Tổng Thu Kỳ Lọc</p>
                                                    <p className="text-xl font-black text-emerald-300">+{formatNumber(vouchers.filter(v => v.type === 'Receipt').reduce((sum, v) => sum + v.amount, 0))} đ</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-1">Tổng Chi Kỳ Lọc</p>
                                                    <p className="text-xl font-black text-rose-300">-{formatNumber(vouchers.filter(v => v.type === 'Payment').reduce((sum, v) => sum + v.amount, 0))} đ</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeMainTab === 'cash_ledger' && (
                    <div className="w-full max-w-full px-4 space-y-8">
                        {/* Sổ Chi Tiết Tiền Mặt (Full Width Table) */}
                        <div className="bg-transparent border border-border p-4 rounded-2xl shadow-none flex flex-col relative overflow-hidden w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase flex items-center gap-2 tracking-[0.4em] ml-2 mt-2">
                                        <History size={16} className="text-[#4a7c59]" /> SỔ CHI TIẾT TIỀN MẶT
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
                    <div className="w-full max-w-full px-4 space-y-8">
                        {/* Sổ Chi Tiết Ngân Hàng */}
                        <div className="bg-transparent border border-border p-4 rounded-2xl shadow-none flex flex-col relative overflow-hidden w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase flex items-center gap-2 tracking-[0.4em] ml-2 mt-2">
                                        <History size={16} className="text-[#4a7c59]" /> SỔ CHI TIẾT NGÂN HÀNG
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
        </div>
    );
}
