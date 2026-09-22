import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { History, ShoppingBag, Clock, X, ChevronRight, Package, Calendar, Eye, EyeOff, BookOpen, Edit, Trash2, ReceiptText, Wallet, RotateCcw, Search } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber, removeAccents, cn } from '../../lib/utils';
import Portal from '../widgets/Portal';
import OrderEditPopup from '../modals/OrderEditPopup';
import QuickVoucherModal from '../modals/QuickVoucherModal';
import QuickDebtModal from '../modals/QuickDebtModal';

export default function POSHistoryPanel({ partner, isOpen, onClose, onAddToCart, onViewOrder, onEditOrder, onDeleteOrder, onEditVoucher, onDeleteVoucher, context = 'POS', defaultType = 'Sale' }) {
    const [orders, setOrders] = useState([]);
    const [boughtProducts, setBoughtProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('invoices'); // invoices, products
    const [filterType, setFilterType] = useState('all'); // all, cash, debt
    const [editingOrder, setEditingOrder] = useState(null);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [editingDebtVoucher, setEditingDebtVoucher] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showInfo, setShowInfo] = useState(true);
    const [rangeMode, setRangeMode] = useState('all'); // all, latest, custom
    const isPurchaseContext = context === 'Purchase' || defaultType === 'Purchase';
    const [startReceiptId, setStartReceiptId] = useState('');
    const [endReceiptId, setEndReceiptId] = useState('');
    const [includeOtherOrders, setIncludeOtherOrders] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');

    const receiptVouchers = orders.filter(o => o.is_voucher && o.type === 'Receipt');

    useEffect(() => {
        if (isOpen && partner) {
            setOrders([]);
            setPage(1);
            setHasMore(true);
            setRangeMode('all');
            setStartReceiptId('');
            setEndReceiptId('');
            setOrderSearch('');
            setProductSearch('');
            fetchHistory(1, includeOtherOrders);
        }
    }, [isOpen, partner]);

    // Live Sync for History Panel
    useEffect(() => {
        const syncChannel = new BroadcastChannel("pos_data_sync");
        syncChannel.onmessage = (e) => {
            if (isOpen && partner && (e.data.type === "ORDER_SAVED" || e.data.type === "PARTNER_UPDATED")) {
                console.log("History Panel Sync Refreshing...");
                setOrders([]);
                setPage(1);
                setHasMore(true);
                fetchHistory(1, includeOtherOrders);
            }
        };
        return () => syncChannel.close();
    }, [isOpen, partner, includeOtherOrders]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (rangeMode === 'custom' && receiptVouchers.length >= 2) {
            if (!startReceiptId) setStartReceiptId(receiptVouchers[0].id);
            if (!endReceiptId) setEndReceiptId(receiptVouchers[1].id);
        } else if (rangeMode === 'custom' && receiptVouchers.length === 1) {
            if (!startReceiptId) setStartReceiptId(receiptVouchers[0].id);
            if (!endReceiptId) setEndReceiptId(receiptVouchers[0].id);
        }
    }, [rangeMode, receiptVouchers, startReceiptId, endReceiptId]);

    const fetchHistory = async (pageToFetch = 1, incOther = includeOtherOrders) => {
        setLoading(true);
        try {
            const limit = 20;
            let orderEndpoint = '';
            if (isPurchaseContext) {
                orderEndpoint = incOther
                    ? `/api/orders?partner_id=${partner.id}&limit=${limit}&page=${pageToFetch}`
                    : `/api/orders?partner_id=${partner.id}&limit=${limit}&page=${pageToFetch}&type=Purchase`;
            } else {
                orderEndpoint = incOther
                    ? `/api/orders?partner_id=${partner.id}&limit=${limit}&page=${pageToFetch}`
                    : `/api/orders?partner_id=${partner.id}&limit=${limit}&page=${pageToFetch}&type=Sale`;
            }
            const [ordersRes, vouchersRes] = await Promise.all([
                axios.get(orderEndpoint),
                axios.get(`/api/vouchers?partner_id=${partner.id}`)
            ]);

            const newOrders = ordersRes.data.items || ordersRes.data || [];
            const vouchers = vouchersRes.data || [];

            const mappedVouchers = vouchers
                .filter(v => v.source !== 'auto')
                .map(v => ({
                    ...v,
                    id: `v_${v.id}`,
                    raw_id: v.id,
                    is_voucher: true,
                    display_id: v.type === 'DebtIncrease' ? `GN-${v.id}` : (v.type === 'Receipt' ? `PT-${v.id}` : `PC-${v.id}`),
                    date: v.date,
                    time: formatDate(v.date, 'HH:mm'),
                    total_amount: v.amount,
                    payment_method: v.type === 'DebtIncrease' ? 'Debt' : (v.type === 'Receipt' ? 'PT' : 'PC'),
                    type: v.type,
                    note: v.note,
                    details: []
                }));

            setOrders(prev => {
                const combined = pageToFetch === 1
                    ? [...newOrders.map(o => ({...o, time: formatDate(o.date, 'HH:mm')})), ...mappedVouchers]
                    : [...prev, ...newOrders.map(o => ({...o, time: formatDate(o.date, 'HH:mm')}))];
                return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
            });

            if (newOrders.length < limit) setHasMore(false);

            if (pageToFetch === 1) {
                const productMap = {};
                newOrders.forEach(order => {
                    order.details && order.details.forEach(detail => {
                        if (!productMap[detail.product_id]) {
                            productMap[detail.product_id] = {
                                id: detail.product_id,
                                name: detail.product_name,
                                unit: detail.product_unit,
                                price: detail.price,
                                total_qty: 0,
                                last_price: detail.price,
                                last_date: order.date
                            };
                        }
                        productMap[detail.product_id].total_qty += detail.quantity;
                        if (new Date(order.date) > new Date(productMap[detail.product_id].last_date)) {
                            productMap[detail.product_id].last_date = order.date;
                            productMap[detail.product_id].last_price = detail.price;
                        }
                    });
                });
                setBoughtProducts(Object.values(productMap).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi')));
            }
        } catch (err) {
            console.error("Error fetching POS history:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        let list = [...boughtProducts].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
        if (!productSearch.trim()) return list;
        const q = removeAccents(productSearch.toLowerCase().trim());
        return list.filter(p => removeAccents((p.name || '').toLowerCase()).includes(q));
    }, [boughtProducts, productSearch]);

    const notifyPartnerUpdated = () => {
        try {
            const syncChannel = new BroadcastChannel('pos_data_sync');
            syncChannel.postMessage({ type: 'PARTNER_UPDATED', partnerId: partner?.id });
            syncChannel.close();
            window.dispatchEvent(new CustomEvent('pos_data_sync', { detail: { type: 'PARTNER_UPDATED', partnerId: partner?.id } }));
        } catch (e) {
            console.error("Error broadcasting sync:", e);
        }
    };

    const handleDeleteVoucher = async (item) => {
        if (onDeleteVoucher) {
            onDeleteVoucher(item);
            return;
        }
        const vId = item.raw_id || String(item.id).replace(/^v_/, '');
        const label = item.display_id || item.id;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa phiếu "${label}" không? Số dư công nợ của khách sẽ được cập nhật lại.`)) {
            return;
        }
        try {
            setLoading(true);
            await axios.delete(`/api/vouchers/${vId}`);
            notifyPartnerUpdated();
            await fetchHistory(1);
        } catch (err) {
            console.error("Lỗi khi xóa phiếu thu/chi:", err);
            alert("Lỗi khi xóa phiếu: " + (err.response?.data?.message || err.message || "Vui lòng thử lại"));
        } finally {
            setLoading(false);
        }
    };

    const handleEditVoucher = (item) => {
        if (onEditVoucher) {
            onEditVoucher(item);
            return;
        }
        const vId = item.raw_id || String(item.id).replace(/^v_/, '');
        const voucherData = {
            ...item,
            id: vId,
            amount: item.total_amount !== undefined ? item.total_amount : item.amount,
            date: item.date,
            type: item.type,
            note: item.note || ''
        };
        if (item.type === 'DebtIncrease') {
            setEditingDebtVoucher(voucherData);
        } else {
            setEditingVoucher(voucherData);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage);
    };

    const matchesOrderSearch = (order, query) => {
        if (!query) return true;
        const cleanQ = query.toLowerCase().trim();
        if (!cleanQ) return true;

        // 1. Tìm kiếm theo ngày
        if (order.date) {
            const dObj = new Date(order.date);
            if (!isNaN(dObj.getTime())) {
                const day = String(dObj.getDate()).padStart(2, '0');
                const month = String(dObj.getMonth() + 1).padStart(2, '0');
                const year = String(dObj.getFullYear());
                const shortYear = year.slice(-2);

                const qSlash = cleanQ.replace(/[\.\-]/g, '/');
                const dateVariants = [
                    `${day}/${month}/${year}`,
                    `${day}/${month}/${shortYear}`,
                    `${day}/${month}`,
                    `${day}-${month}-${year}`,
                    `${day}-${month}-${shortYear}`,
                    `${day}-${month}`,
                    `${day}.${month}.${year}`,
                    `${day}.${month}.${shortYear}`,
                    `${day}.${month}`,
                    day,
                    order.date.toLowerCase()
                ];

                if (dateVariants.some(d => d.includes(qSlash) || d.includes(cleanQ))) {
                    return true;
                }
            }
        }

        if (order.time && order.time.toLowerCase().includes(cleanQ)) {
            return true;
        }

        // 2. Tìm kiếm theo số tiền
        const amount = Math.abs(order.total_amount !== undefined ? order.total_amount : (order.total || 0));
        const amountStr = Math.round(amount).toString();
        const formattedVn = Number(amount).toLocaleString('vi-VN');
        const formattedEn = Number(amount).toLocaleString('en-US');

        const numOnly = cleanQ.replace(/[^0-9]/g, '');
        if (numOnly && amountStr.includes(numOnly)) {
            return true;
        }
        if (formattedVn.includes(cleanQ) || formattedEn.includes(cleanQ)) {
            return true;
        }

        // Hỗ trợ gõ tắt tiền (VD: 430k, 17tr, 17m, 1.5tr)
        if (/^[0-9]+([.,][0-9]+)?(k|tr|m|c)$/i.test(cleanQ)) {
            let mult = 1000;
            let numPart = cleanQ;
            if (cleanQ.endsWith('k')) {
                mult = 1000;
                numPart = cleanQ.slice(0, -1);
            } else if (cleanQ.endsWith('tr') || cleanQ.endsWith('m')) {
                mult = 1000000;
                numPart = cleanQ.endsWith('tr') ? cleanQ.slice(0, -2) : cleanQ.slice(0, -1);
            } else if (cleanQ.endsWith('c')) {
                mult = 100000;
                numPart = cleanQ.slice(0, -1);
            }
            const val = parseFloat(numPart.replace(',', '.'));
            if (!isNaN(val)) {
                const target = Math.round(val * mult);
                if (amount === target || amountStr.startsWith(target.toString())) {
                    return true;
                }
            }
        }

        // 3. Tìm theo mã đơn hoặc ghi chú
        const displayId = (order.display_id || '').toLowerCase();
        const rawId = String(order.raw_id || order.id || '').toLowerCase();
        const note = (order.note || '').toLowerCase();
        if (displayId.includes(cleanQ) || rawId.includes(cleanQ) || note.includes(cleanQ)) {
            return true;
        }

        // 4. Tìm theo tên sản phẩm có trong đơn
        if (order.details && Array.isArray(order.details)) {
            const normQ = removeAccents(cleanQ);
            if (order.details.some(d => removeAccents((d.product_name || '').toLowerCase()).includes(normQ))) {
                return true;
            }
        }

        return false;
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[99999] flex justify-end font-sans">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <m.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 32, stiffness: 260 }}
                            className="relative w-full max-w-[450px] h-full bg-[#fcfbf9] dark:bg-[#071510]/95 backdrop-blur-2xl shadow-[-20px_0_60px_rgba(0,0,0,0.15)] dark:shadow-[0_0_100px_rgba(0,0,0,0.85)] flex flex-col border-l border-stone-200 dark:border-white/10 text-stone-900 dark:text-white transition-colors"
                        >
                        {/* Header */}
                        <div className="p-5 border-b border-stone-200 dark:border-white/10 relative overflow-hidden group bg-white/70 dark:bg-transparent transition-colors">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.04] dark:opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-700 text-stone-900 dark:text-white">
                                <History size={100} />
                            </div>
                            
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 bg-emerald-50 dark:bg-white/10 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-white/10 shadow-2xs">
                                        <History size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[14px] text-stone-900 dark:text-white uppercase tracking-tighter leading-none mb-1">Lịch sử GD</h3>
                                        <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                            {partner?.name || '---'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowInfo(!showInfo)}
                                        className="w-9 h-9 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white/60 dark:hover:text-white rounded-xl transition-all border border-stone-200 dark:border-white/10 shadow-2xs"
                                        title={showInfo ? "Chế độ riêng tư" : "Hiện thông tin chi tiết"}
                                    >
                                        {showInfo ? <Eye size={16} strokeWidth={2.5} /> : <EyeOff size={16} strokeWidth={2.5} />}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-9 h-9 flex items-center justify-center bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 dark:bg-white/10 dark:hover:bg-rose-500/20 dark:text-white/60 dark:hover:text-rose-400 rounded-xl transition-all hover:rotate-90 border border-stone-200 dark:border-white/10 shadow-2xs"
                                    >
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-3 gap-2 bg-stone-100/60 dark:bg-transparent border-b border-stone-200/60 dark:border-transparent transition-colors">
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2",
                                    activeTab === 'invoices' ? "bg-emerald-600 border-emerald-600 dark:border-white/10 text-white shadow-md shadow-emerald-600/20" : "bg-white dark:bg-white/5 border-stone-200 dark:border-white/5 text-stone-500 dark:text-white/50 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-white/10"
                                )}
                            >
                                <Clock size={14} strokeWidth={3} /> Hóa đơn
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2",
                                    activeTab === 'products' ? "bg-emerald-600 border-emerald-600 dark:border-white/10 text-white shadow-md shadow-emerald-600/20" : "bg-white dark:bg-white/5 border-stone-200 dark:border-white/5 text-stone-500 dark:text-white/50 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-white/10"
                                )}
                            >
                                <ShoppingBag size={14} strokeWidth={3} /> Sản phẩm
                            </button>
                        </div>

                        {/* Filters */}
                        <AnimatePresence>
                            {activeTab === 'invoices' && (
                                <m.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="px-5 pb-3 pt-2 flex flex-col gap-2 border-b border-stone-200/80 dark:border-white/5 bg-stone-50/50 dark:bg-transparent transition-colors"
                                >
                                    {/* Filters Row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex gap-1.5">
                                            {[
                                                { id: 'all', label: 'Tất cả' },
                                                { id: 'cash', label: 'Tiền mặt' },
                                                { id: 'debt', label: 'Công nợ' }
                                            ].map((f) => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setFilterType(f.id)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border shadow-2xs",
                                                        filterType === f.id ? "bg-emerald-700 text-white border-emerald-700 dark:bg-white/20 dark:border-white/40 dark:text-white" : "bg-white dark:bg-transparent border-stone-200 dark:border-white/5 text-stone-500 dark:text-white/30 hover:text-stone-900 dark:hover:text-white/60 hover:border-stone-300"
                                                    )}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => {
                                                const next = !includeOtherOrders;
                                                setIncludeOtherOrders(next);
                                                setOrders([]);
                                                setPage(1);
                                                setHasMore(true);
                                                fetchHistory(1, next);
                                            }}
                                            className={cn(
                                                "px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 shadow-2xs",
                                                includeOtherOrders
                                                    ? (isPurchaseContext
                                                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-400"
                                                        : "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-300")
                                                    : "bg-white dark:bg-transparent border-stone-200 dark:border-white/5 text-stone-500 dark:text-white/30 hover:text-stone-900 dark:hover:text-white/60"
                                            )}
                                            title={isPurchaseContext ? "Bật/Tắt hiển thị các đơn bán hàng cho đối tác này" : "Bật/Tắt hiển thị các đơn nhập hàng từ đối tác này"}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", includeOtherOrders ? (isPurchaseContext ? "bg-emerald-500 animate-pulse" : "bg-indigo-500 animate-pulse") : "bg-stone-300 dark:bg-white/20")} />
                                            {isPurchaseContext
                                                ? (includeOtherOrders ? "Kèm Đơn Bán" : "+ Đơn Bán")
                                                : (includeOtherOrders ? "Kèm Đơn Nhập" : "+ Đơn Nhập")}
                                        </button>
                                    </div>

                                    {/* Payment Range Mode */}
                                    <div className="flex gap-2 bg-stone-100 dark:bg-white/[0.02] p-1 rounded-lg border border-stone-200 dark:border-white/5">
                                        {[
                                            { id: 'all', label: 'Hiện Full' },
                                            { id: 'latest', label: 'Trả gần nhất → Nay' },
                                            { id: 'custom', label: 'Tùy chọn' }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setRangeMode(m.id)}
                                                className={cn(
                                                    "flex-1 py-1 rounded-md text-[7px] font-black uppercase tracking-wider transition-all border",
                                                    rangeMode === m.id ? "bg-white dark:bg-emerald-500/20 border-stone-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 shadow-2xs" : "bg-transparent border-transparent text-stone-500 dark:text-white/40 hover:text-stone-900 dark:hover:text-white/70"
                                                )}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Search Input for Invoices (by date, amount, code) */}
                                    <div className="relative mt-0.5">
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-white/40 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Tìm ngày (21/09), số tiền (430k, 17tr), mã đơn..."
                                            value={orderSearch}
                                            onChange={(e) => setOrderSearch(e.target.value)}
                                            className="w-full bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-[11px] font-bold text-stone-800 dark:text-white placeholder-stone-400 dark:placeholder-white/30 outline-none focus:border-emerald-500 focus:bg-emerald-50/20 dark:focus:bg-white/10 transition-all shadow-2xs"
                                        />
                                        {orderSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setOrderSearch('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white p-0.5 rounded-full transition-colors"
                                                title="Xóa tìm kiếm"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Custom Dropdowns */}
                                    {rangeMode === 'custom' && (
                                        <div className="flex gap-2 items-center mt-1 bg-stone-100 dark:bg-white/5 p-2 rounded-lg border border-stone-200 dark:border-white/5">
                                            <div className="flex-1 flex flex-col gap-0.5">
                                                <span className="text-[7px] text-stone-500 dark:text-white/40 uppercase font-black">Từ lần trả</span>
                                                <select
                                                    value={startReceiptId}
                                                    onChange={(e) => setStartReceiptId(e.target.value)}
                                                    className="w-full bg-white dark:bg-[#022c22] border border-stone-300 dark:border-white/10 text-stone-800 dark:text-white text-[9px] rounded p-1 font-bold outline-none focus:border-emerald-500"
                                                >
                                                    <option value="">-- Chọn --</option>
                                                    {receiptVouchers.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.display_id} ({formatDate(v.date, 'DD/MM HH:mm')})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <span className="text-[8px] text-stone-400 dark:text-white/30 font-bold self-end mb-1.5">→</span>
                                            <div className="flex-1 flex flex-col gap-0.5">
                                                <span className="text-[7px] text-stone-500 dark:text-white/40 uppercase font-black">Đến lần trả</span>
                                                <select
                                                    value={endReceiptId}
                                                    onChange={(e) => setEndReceiptId(e.target.value)}
                                                    className="w-full bg-white dark:bg-[#022c22] border border-stone-300 dark:border-white/10 text-stone-800 dark:text-white text-[9px] rounded p-1 font-bold outline-none focus:border-emerald-500"
                                                >
                                                    <option value="">-- Chọn --</option>
                                                    {receiptVouchers.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.display_id} ({formatDate(v.date, 'DD/MM HH:mm')})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </m.div>
                            )}
                        </AnimatePresence>

                        {/* Main Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6 space-y-3">
                            {loading && page === 1 ? (
                                <div className="flex flex-col items-center justify-center py-32">
                                    <div className="w-10 h-10 border-[3px] border-stone-200 dark:border-white/10 border-t-emerald-500 rounded-full animate-spin mb-6" />
                                    <span className="font-black text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em]">Đang nạp dữ liệu...</span>
                                </div>
                            ) : activeTab === 'invoices' ? (
                                orders.length === 0 ? (
                                    <div className="text-center py-40 text-stone-400 dark:text-white/20">
                                        <History size={60} strokeWidth={1} className="mx-auto mb-8 opacity-40" />
                                        <p className="font-black uppercase text-[10px] tracking-[0.4em]">Trống trải...</p>
                                    </div>
                                ) : (() => {
                                    let displayOrders = [...orders];

                                    if (rangeMode === 'latest') {
                                        const latestReceiptIdx = displayOrders.findIndex(o => o.is_voucher && o.type === 'Receipt');
                                        if (latestReceiptIdx !== -1) {
                                            displayOrders = displayOrders.slice(0, latestReceiptIdx + 1);
                                        }
                                    } else if (rangeMode === 'custom' && startReceiptId && endReceiptId) {
                                        const idxA = displayOrders.findIndex(o => o.id === startReceiptId);
                                        const idxB = displayOrders.findIndex(o => o.id === endReceiptId);
                                        if (idxA !== -1 && idxB !== -1) {
                                            const minIdx = Math.min(idxA, idxB);
                                            const maxIdx = Math.max(idxA, idxB);
                                            displayOrders = displayOrders.slice(minIdx, maxIdx + 1);
                                        }
                                    }

                                    const filteredOrders = displayOrders.filter(o => {
                                        if (filterType === 'cash' && (o.is_voucher || o.payment_method === 'Debt')) return false;
                                        if (filterType === 'debt' && !(o.payment_method === 'Debt' || (o.is_voucher && o.type === 'DebtIncrease'))) return false;
                                        if (orderSearch.trim() && !matchesOrderSearch(o, orderSearch)) return false;
                                        return true;
                                    });

                                    if (filteredOrders.length === 0) {
                                        return (
                                            <div className="text-center py-28 text-stone-400 dark:text-white/40 space-y-2">
                                                <Search size={36} className="mx-auto opacity-30" />
                                                <p className="text-xs font-bold uppercase tracking-wider">
                                                    Không tìm thấy đơn nào khớp "{orderSearch}"
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setOrderSearch('')}
                                                    className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 underline hover:opacity-80"
                                                >
                                                    Xóa tìm kiếm
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="relative pl-7 space-y-2 pt-4">
                                            <div className="absolute left-[13px] top-4 bottom-4 w-px bg-stone-200 dark:bg-white/10" />
                                            {filteredOrders.map((order, idx) => (
                                                <div key={order.id || idx} className="relative">
                                                    <div className={cn(
                                                        "absolute left-[-22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 z-10",
                                                        order.type === 'Purchase' ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" : (order.type === 'DebtIncrease' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : (order.type === 'Receipt' ? "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" : (order.type === 'Payment' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]")))
                                                    )} />
                                                    <div
                                                        className={cn(
                                                            "p-3 rounded-2xl border transition-all group flex flex-col cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-md backdrop-blur-sm",
                                                            order.type === 'Purchase'
                                                                ? "bg-white hover:bg-indigo-50/40 border-indigo-200 hover:border-indigo-400 dark:bg-gradient-to-br dark:from-indigo-950/60 dark:via-slate-900/70 dark:to-indigo-950/40 dark:border-indigo-500/40 dark:hover:border-indigo-400"
                                                                : (order.type === 'DebtIncrease'
                                                                    ? "bg-white hover:bg-amber-50/40 border-amber-200 hover:border-amber-400 dark:bg-gradient-to-br dark:from-amber-950/50 dark:via-slate-900/70 dark:to-amber-950/30 dark:border-amber-500/40 dark:hover:border-amber-400"
                                                                    : (order.type === 'Receipt'
                                                                        ? "bg-white hover:bg-teal-50/40 border-teal-200 hover:border-teal-400 dark:bg-gradient-to-br dark:from-teal-950/50 dark:via-slate-900/70 dark:to-teal-950/30 dark:border-teal-500/40 dark:hover:border-teal-400"
                                                                        : (order.type === 'Payment'
                                                                            ? "bg-white hover:bg-rose-50/40 border-rose-200 hover:border-rose-400 dark:bg-gradient-to-br dark:from-rose-950/50 dark:via-slate-900/70 dark:to-rose-950/30 dark:border-rose-500/40 dark:hover:border-rose-400"
                                                                            : "bg-white hover:bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-slate-900/70 dark:to-emerald-950/20 dark:border-emerald-500/35 dark:hover:border-emerald-400")))
                                                        )}
                                                        onClick={(e) => {
                                                            if (!order.is_voucher) {
                                                                setEditingOrder(order);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                                                                    order.type === 'Purchase'
                                                                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30"
                                                                        : (order.type === 'DebtIncrease'
                                                                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                                                                            : (order.type === 'Receipt'
                                                                                ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30"
                                                                                : (order.type === 'Payment'
                                                                                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                                                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30")))
                                                                )}>
                                                                    {order.type === 'Purchase' ? <Package size={14} strokeWidth={2.5} /> : (order.type === 'DebtIncrease' ? <BookOpen size={14} strokeWidth={2.5} /> : (order.is_voucher ? <ReceiptText size={14} strokeWidth={2.5} /> : (showInfo ? <Eye size={14} strokeWidth={2.5} /> : <EyeOff size={14} strokeWidth={2.5} />)))}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className={cn(
                                                                        "text-[12px] font-black uppercase tracking-wide leading-none mb-1 truncate pr-2 flex items-center gap-1",
                                                                        order.type === 'Purchase'
                                                                            ? "text-indigo-800 dark:text-indigo-200 font-extrabold"
                                                                            : (order.type === 'DebtIncrease'
                                                                                ? "text-amber-800 dark:text-amber-200 font-extrabold"
                                                                                : (order.type === 'Receipt'
                                                                                    ? "text-teal-800 dark:text-teal-200 font-extrabold"
                                                                                    : (order.type === 'Payment'
                                                                                        ? "text-rose-800 dark:text-rose-200 font-extrabold"
                                                                                        : "text-emerald-900 dark:text-emerald-100 font-extrabold")))
                                                                    )}>
                                                                        {order.type === 'Receipt' && <Wallet size={12} className="shrink-0" />}
                                                                        {showInfo ? (order.is_voucher ? (order.type === 'DebtIncrease' ? 'Ghi nợ' : (order.type === 'Receipt' ? `Thu tiền #${order.id.split('_')[1]}` : `Chi tiền #${order.id.split('_')[1]}`)) : (order.display_id ? `#${order.display_id}` : `#${order.id}`)) : '********'}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-black text-stone-400 dark:text-white/40 tabular-nums uppercase">{showInfo ? order.time : '--:--'}</span>
                                                                        {order.type === 'Purchase' ? (
                                                                            <div className={cn(
                                                                                "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
                                                                                (order.total_amount || 0) < 0 ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/25 dark:text-purple-200 dark:border-purple-400/40" : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/40"
                                                                            )}>
                                                                                {(order.total_amount || 0) < 0 ? 'TRẢ NCC' : 'NHẬP'}
                                                                            </div>
                                                                        ) : (!order.is_voucher && (
                                                                            <div className={cn(
                                                                                "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
                                                                                (order.total_amount || 0) < 0 ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/25 dark:text-purple-200 dark:border-purple-400/40" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/40"
                                                                            )}>
                                                                                {(order.total_amount || 0) < 0 ? 'TRẢ HÀNG' : 'BÁN'}
                                                                            </div>
                                                                        ))}
                                                                        <div className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight border", order.payment_method === 'Debt' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30")}>
                                                                            {order.payment_method === 'Debt' ? 'NỢ' : 'T.MẶT'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-2 shrink-0">
                                                                <div className={cn(
                                                                    "text-[15px] font-black tracking-tighter tabular-nums text-right leading-none drop-shadow-2xs",
                                                                    order.type === 'Purchase'
                                                                        ? "text-indigo-700 dark:text-indigo-300"
                                                                        : (order.type === 'DebtIncrease'
                                                                            ? "text-amber-700 dark:text-amber-300"
                                                                            : (order.type === 'Receipt'
                                                                                ? "text-teal-700 dark:text-teal-300"
                                                                                : (order.type === 'Payment'
                                                                                    ? "text-rose-700 dark:text-rose-300"
                                                                                    : "text-emerald-700 dark:text-emerald-300")))
                                                                )}>
                                                                    {formatNumber(order.total_amount || order.total)}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            if (order.is_voucher) {
                                                                                handleEditVoucher(order);
                                                                            } else {
                                                                                onEditOrder && onEditOrder(order);
                                                                            }
                                                                        }} 
                                                                        className="p-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-500 hover:text-emerald-700 rounded-lg transition-all border border-stone-200 hover:border-emerald-300 dark:bg-white/10 dark:hover:bg-emerald-500/30 dark:text-white/60 dark:hover:text-emerald-300 dark:border-white/10 dark:hover:border-emerald-400/40 shadow-xs"
                                                                        title={order.is_voucher ? "Sửa phiếu thu/chi" : "Nạp đơn ra giỏ hàng để sửa"}
                                                                    >
                                                                        <Edit size={12} strokeWidth={2.5} />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            if (order.is_voucher) {
                                                                                handleDeleteVoucher(order);
                                                                            } else {
                                                                                onDeleteOrder && onDeleteOrder(order.id);
                                                                            }
                                                                        }} 
                                                                        className="p-1.5 bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 rounded-lg transition-all border border-stone-200 hover:border-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/30 dark:text-white/50 dark:hover:text-rose-300 dark:border-rose-500/20 shadow-xs"
                                                                        title={order.is_voucher ? "Xóa phiếu thu/chi" : "Xóa đơn hàng"}
                                                                    >
                                                                        <Trash2 size={12} strokeWidth={2.5} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* MINI CHIPS PREVIEW */}
                                                        {showInfo && order.details && order.details.length > 0 && (
                                                            <div className="border-t border-stone-100 dark:border-white/10 mt-2.5 pt-2 flex flex-wrap gap-1">
                                                                {order.details.slice(0, 3).map((d, dIdx) => (
                                                                    <div 
                                                                        key={dIdx} 
                                                                        className={cn(
                                                                            "px-1.5 py-0.5 border rounded-md text-[8px] font-black uppercase flex items-center gap-1 transition-all",
                                                                            order.type === 'Purchase'
                                                                                ? "bg-indigo-50/70 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-200 dark:hover:bg-indigo-500/25"
                                                                                : "bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
                                                                        )}
                                                                    >
                                                                        <span className="truncate max-w-[70px]">{d.product_name}</span>
                                                                        <div className={cn("w-px h-1.5", order.type === 'Purchase' ? "bg-indigo-300 dark:bg-indigo-500/40" : "bg-emerald-300 dark:bg-emerald-500/40")} />
                                                                        <span className={cn(order.type === 'Purchase' ? "text-indigo-700 dark:text-indigo-300" : "text-emerald-700 dark:text-emerald-300")}>{formatNumber(d.quantity)}</span>
                                                                    </div>
                                                                ))}
                                                                {order.details.length > 3 && (
                                                                    <div className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 dark:bg-white/5 dark:border-white/10 rounded-md text-[8px] font-black text-stone-500 dark:text-white/40 uppercase tracking-tighter">
                                                                        +{order.details.length - 3} món
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {hasMore && (
                                                <button onClick={loadMore} disabled={loading} className="w-full py-3 rounded-xl border border-stone-200 dark:border-white/5 text-stone-400 dark:text-white/30 text-[8px] font-black uppercase tracking-[0.4em] hover:bg-stone-100 dark:hover:bg-white/5 hover:text-stone-700 dark:hover:text-white transition-all active:scale-[0.98]">
                                                    {loading ? "Đang truy xuất..." : "Tải thêm"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="space-y-2.5">
                                    {/* Search input for products */}
                                    {boughtProducts.length > 0 && (
                                        <div className="relative mb-2">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-white/40" />
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm sản phẩm (A - Z)..."
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                className="w-full bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-white/30 outline-none focus:border-emerald-500 focus:bg-emerald-50/20 dark:focus:bg-white/10 transition-all shadow-2xs"
                                            />
                                            {productSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setProductSearch('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white p-1 rounded-full transition-colors"
                                                    title="Xóa tìm kiếm"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {boughtProducts.length === 0 ? (
                                        <div className="text-center py-40 text-stone-400 dark:text-white/20">
                                            <Package size={60} strokeWidth={1} className="mx-auto mb-8 opacity-40" />
                                            <p className="font-black uppercase text-[10px] tracking-[0.4em]">Trống trải...</p>
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-20 text-stone-400 dark:text-white/40 space-y-2">
                                            <Search size={32} className="mx-auto opacity-30" />
                                            <p className="text-xs font-bold uppercase tracking-wider">
                                                Không tìm thấy sản phẩm nào khớp "{productSearch}"
                                            </p>
                                        </div>
                                    ) : (
                                        filteredProducts.map((p) => (
                                            <div key={p.id} className="bg-white dark:bg-white/[0.04] p-3 rounded-xl border border-stone-200 dark:border-white/5 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-colors flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/[0.08] shadow-2xs">
                                                <div className="flex-1 min-w-0 pr-3">
                                                    <div className="font-black text-[12px] text-stone-900 dark:text-white uppercase truncate mb-1" title={p.name}>{p.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/5 tabular-nums">Tổng {formatNumber(p.total_qty)} {p.unit}</span>
                                                        <span className="text-[9px] font-black text-stone-400 dark:text-white/20 tabular-nums">Giá cuối: {formatNumber(p.last_price)}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => onAddToCart(p)} className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg shadow-2xs flex items-center justify-center transition-all border border-emerald-200 dark:border-emerald-500/5 active:scale-90">
                                                    <PlusIcon size={14} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
        <AnimatePresence>
            {editingOrder && (
                <OrderEditPopup
                    order={editingOrder}
                    partner={partner || editingOrder.partner}
                    onClose={() => setEditingOrder(null)}
                    onSave={() => {
                        setEditingOrder(null);
                        fetchHistory(1);
                    }}
                />
            )}
        </AnimatePresence>
        <AnimatePresence>
            {editingVoucher && (
                <QuickVoucherModal
                    isOpen={!!editingVoucher}
                    initialData={editingVoucher}
                    partner={partner}
                    onClose={() => setEditingVoucher(null)}
                    onSave={() => {
                        setEditingVoucher(null);
                        notifyPartnerUpdated();
                        fetchHistory(1);
                    }}
                />
            )}
        </AnimatePresence>
        <AnimatePresence>
            {editingDebtVoucher && (
                <QuickDebtModal
                    isOpen={!!editingDebtVoucher}
                    initialData={editingDebtVoucher}
                    partner={partner}
                    onClose={() => setEditingDebtVoucher(null)}
                    onSave={() => {
                        setEditingDebtVoucher(null);
                        notifyPartnerUpdated();
                        fetchHistory(1);
                    }}
                />
            )}
        </AnimatePresence>
    </Portal>
    );
}

const PlusIcon = ({ size, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
