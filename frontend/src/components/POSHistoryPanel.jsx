import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { History, ShoppingBag, Clock, X, ChevronRight, Package, Calendar, Eye, EyeOff, BookOpen, Edit, Trash2, ReceiptText, Wallet, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber, cn } from '../lib/utils';
import Portal from './Portal';
import OrderEditPopup from './OrderEditPopup';

export default function POSHistoryPanel({ partner, isOpen, onClose, onAddToCart, onViewOrder, onEditOrder, onDeleteOrder, onEditVoucher, onDeleteVoucher, context = 'POS', defaultType = 'Sale' }) {
    const [orders, setOrders] = useState([]);
    const [boughtProducts, setBoughtProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('invoices'); // invoices, products
    const [filterType, setFilterType] = useState('all'); // all, cash, debt
    const [editingOrder, setEditingOrder] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showInfo, setShowInfo] = useState(true);
    const [rangeMode, setRangeMode] = useState('all'); // all, latest, custom
    const isPurchaseContext = context === 'Purchase' || defaultType === 'Purchase';
    const [startReceiptId, setStartReceiptId] = useState('');
    const [endReceiptId, setEndReceiptId] = useState('');
    const [includeOtherOrders, setIncludeOtherOrders] = useState(false);

    const receiptVouchers = orders.filter(o => o.is_voucher && o.type === 'Receipt');

    useEffect(() => {
        if (isOpen && partner) {
            setOrders([]);
            setPage(1);
            setHasMore(true);
            setRangeMode('all');
            setStartReceiptId('');
            setEndReceiptId('');
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

            const mappedVouchers = vouchers.map(v => ({
                id: `v_${v.id}`,
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
                setBoughtProducts(Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty));
            }
        } catch (err) {
            console.error("Error fetching POS history:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage);
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
                            className="relative w-full max-w-[450px] h-full bg-slate-950/95 dark:bg-[#071510]/95 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.85)] flex flex-col border-l border-[#8b6f47]/30 dark:border-white/10"
                        >
                        {/* Header */}
                        <div className="p-5 border-b border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-700 text-white">
                                <History size={100} />
                            </div>
                            
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 border border-white/10">
                                        <History size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[14px] text-white uppercase tracking-tighter leading-none mb-1">Lịch sử GD</h3>
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                            {partner?.name || '---'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowInfo(!showInfo)}
                                        className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-xl transition-all border border-white/10 shadow-lg"
                                        title={showInfo ? "Chế độ riêng tư" : "Hiện thông tin chi tiết"}
                                    >
                                        {showInfo ? <Eye size={16} strokeWidth={2.5} /> : <EyeOff size={16} strokeWidth={2.5} />}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 rounded-xl transition-all hover:rotate-90 border border-white/10 shadow-lg"
                                    >
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-3 gap-2">
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2",
                                    activeTab === 'invoices' ? "bg-emerald-500 border-white/10 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <Clock size={14} strokeWidth={3} /> Hóa đơn
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2",
                                    activeTab === 'products' ? "bg-emerald-500 border-white/10 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10"
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
                                    className="px-5 pb-3 flex flex-col gap-2 border-b border-white/5"
                                >
                                    {/* Filters Row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'all', label: 'Tất cả' },
                                                { id: 'cash', label: 'Tiền mặt' },
                                                { id: 'debt', label: 'Công nợ' }
                                            ].map((f) => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setFilterType(f.id)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border",
                                                        filterType === f.id ? "bg-white/20 border-white/40 text-white" : "bg-transparent border-white/5 text-white/30 hover:text-white/60"
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
                                                "px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5",
                                                includeOtherOrders
                                                    ? (isPurchaseContext
                                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm"
                                                        : "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm")
                                                    : "bg-transparent border-white/5 text-white/30 hover:text-white/60"
                                            )}
                                            title={isPurchaseContext ? "Bật/Tắt hiển thị các đơn bán hàng cho đối tác này" : "Bật/Tắt hiển thị các đơn nhập hàng từ đối tác này"}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full", includeOtherOrders ? (isPurchaseContext ? "bg-emerald-400 animate-pulse" : "bg-indigo-400 animate-pulse") : "bg-white/20")} />
                                            {isPurchaseContext
                                                ? (includeOtherOrders ? "Kèm Đơn Bán" : "+ Đơn Bán")
                                                : (includeOtherOrders ? "Kèm Đơn Nhập" : "+ Đơn Nhập")}
                                        </button>
                                    </div>

                                    {/* Payment Range Mode */}
                                    <div className="flex gap-2 bg-white/[0.02] p-1 rounded-lg border border-white/5">
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
                                                    rangeMode === m.id ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5" : "bg-transparent border-white/5 text-white/40 hover:text-white/70"
                                                )}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Dropdowns */}
                                    {rangeMode === 'custom' && (
                                        <div className="flex gap-2 items-center mt-1 bg-white/5 p-2 rounded-lg border border-white/5">
                                            <div className="flex-1 flex flex-col gap-0.5">
                                                <span className="text-[7px] text-white/40 uppercase font-black">Từ lần trả</span>
                                                <select
                                                    value={startReceiptId}
                                                    onChange={(e) => setStartReceiptId(e.target.value)}
                                                    className="w-full bg-[#022c22] border border-white/10 text-white text-[9px] rounded p-1 font-bold outline-none focus:border-emerald-500/50"
                                                >
                                                    <option value="">-- Chọn --</option>
                                                    {receiptVouchers.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.display_id} ({formatDate(v.date, 'DD/MM HH:mm')})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <span className="text-[8px] text-white/30 font-bold self-end mb-1.5">→</span>
                                            <div className="flex-1 flex flex-col gap-0.5">
                                                <span className="text-[7px] text-white/40 uppercase font-black">Đến lần trả</span>
                                                <select
                                                    value={endReceiptId}
                                                    onChange={(e) => setEndReceiptId(e.target.value)}
                                                    className="w-full bg-[#022c22] border border-white/10 text-white text-[9px] rounded p-1 font-bold outline-none focus:border-emerald-500/50"
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
                                    <div className="w-10 h-10 border-[3px] border-white/10 border-t-emerald-500 rounded-full animate-spin mb-6" />
                                    <span className="font-black text-[10px] text-emerald-400 uppercase tracking-[0.4em]">Đang nạp dữ liệu...</span>
                                </div>
                            ) : activeTab === 'invoices' ? (
                                orders.length === 0 ? (
                                    <div className="text-center py-40 opacity-20">
                                        <History size={60} strokeWidth={1} className="mx-auto mb-8 text-white" />
                                        <p className="font-black uppercase text-[10px] tracking-[0.4em] text-white">Trống trải...</p>
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
                                        if (filterType === 'all') return true;
                                        if (filterType === 'cash') return o.payment_method !== 'Debt';
                                        if (filterType === 'debt') return o.payment_method === 'Debt';
                                        return true;
                                    });

                                    return (
                                        <div className="relative pl-7 space-y-2 pt-4">
                                            <div className="absolute left-[13px] top-4 bottom-4 w-px bg-white/10" />
                                            {filteredOrders.map((order, idx) => (
                                                <div key={order.id || idx} className="relative">
                                                    <div className={cn(
                                                        "absolute left-[-22px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-slate-950 z-10",
                                                        order.type === 'Purchase' ? "bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.9)]" : (order.type === 'DebtIncrease' ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)]" : (order.type === 'Receipt' ? "bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.9)]" : (order.type === 'Payment' ? "bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]" : "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]")))
                                                    )} />
                                                    <div
                                                        className={cn(
                                                            "p-3 rounded-2xl border transition-all group flex flex-col cursor-pointer relative overflow-hidden backdrop-blur-sm",
                                                            order.type === 'Purchase'
                                                                ? "bg-gradient-to-br from-indigo-950/60 via-slate-900/70 to-indigo-950/40 border-indigo-500/40 hover:border-indigo-400 hover:from-indigo-950/80 shadow-[0_4px_25px_rgba(99,102,241,0.12)]"
                                                                : (order.type === 'DebtIncrease'
                                                                    ? "bg-gradient-to-br from-amber-950/50 via-slate-900/70 to-amber-950/30 border-amber-500/40 hover:border-amber-400 shadow-[0_4px_25px_rgba(245,158,11,0.12)]"
                                                                    : (order.type === 'Receipt'
                                                                        ? "bg-gradient-to-br from-teal-950/50 via-slate-900/70 to-teal-950/30 border-teal-500/40 hover:border-teal-400 shadow-[0_4px_25px_rgba(20,184,166,0.12)]"
                                                                        : (order.type === 'Payment'
                                                                            ? "bg-gradient-to-br from-rose-950/50 via-slate-900/70 to-rose-950/30 border-rose-500/40 hover:border-rose-400 shadow-[0_4px_25px_rgba(244,63,94,0.12)]"
                                                                            : "bg-gradient-to-br from-emerald-950/40 via-slate-900/70 to-emerald-950/20 border-emerald-500/35 hover:border-emerald-400 shadow-[0_4px_25px_rgba(16,185,129,0.08)]")))
                                                        )}
                                                        onClick={(e) => {
                                                            if (!order.is_voucher) {
                                                                setEditingOrder(order);
                                                                if (onViewOrder) onViewOrder(order);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner border",
                                                                    order.type === 'Purchase'
                                                                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                                                        : (order.type === 'DebtIncrease'
                                                                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                                                            : (order.type === 'Receipt'
                                                                                ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                                                                                : (order.type === 'Payment'
                                                                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                                                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30")))
                                                                )}>
                                                                    {order.type === 'Purchase' ? <Package size={14} strokeWidth={2.5} /> : (order.type === 'DebtIncrease' ? <BookOpen size={14} strokeWidth={2.5} /> : (order.is_voucher ? <ReceiptText size={14} strokeWidth={2.5} /> : (showInfo ? <Eye size={14} strokeWidth={2.5} /> : <EyeOff size={14} strokeWidth={2.5} />)))}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className={cn(
                                                                        "text-[12px] font-black uppercase tracking-wide leading-none mb-1 truncate pr-2 flex items-center gap-1",
                                                                        order.type === 'Purchase'
                                                                            ? "text-indigo-200 font-extrabold"
                                                                            : (order.type === 'DebtIncrease'
                                                                                ? "text-amber-200 font-extrabold"
                                                                                : (order.type === 'Receipt'
                                                                                    ? "text-teal-200 font-extrabold"
                                                                                    : (order.type === 'Payment'
                                                                                        ? "text-rose-200 font-extrabold"
                                                                                        : "text-emerald-100 font-extrabold")))
                                                                    )}>
                                                                        {order.type === 'Receipt' && <Wallet size={12} className="shrink-0" />}
                                                                        {showInfo ? (order.is_voucher ? (order.type === 'DebtIncrease' ? 'Ghi nợ' : (order.type === 'Receipt' ? `Thu tiền #${order.id.split('_')[1]}` : `Chi tiền #${order.id.split('_')[1]}`)) : (order.display_id ? `#${order.display_id}` : `#${order.id}`)) : '********'}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-black text-white/40 tabular-nums uppercase">{showInfo ? order.time : '--:--'}</span>
                                                                        {order.type === 'Purchase' ? (
                                                                            <div className={cn(
                                                                                "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
                                                                                (order.total_amount || 0) < 0 ? "bg-purple-500/25 text-purple-200 border-purple-400/40" : "bg-indigo-500/25 text-indigo-200 border-indigo-400/40"
                                                                            )}>
                                                                                {(order.total_amount || 0) < 0 ? 'TRẢ NCC' : 'NHẬP'}
                                                                            </div>
                                                                        ) : (!order.is_voucher && (
                                                                            <div className={cn(
                                                                                "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
                                                                                (order.total_amount || 0) < 0 ? "bg-purple-500/25 text-purple-200 border-purple-400/40" : "bg-emerald-500/25 text-emerald-200 border-emerald-400/40"
                                                                            )}>
                                                                                {(order.total_amount || 0) < 0 ? 'TRẢ HÀNG' : 'BÁN'}
                                                                            </div>
                                                                        ))}
                                                                        <div className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight border", order.payment_method === 'Debt' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30")}>
                                                                            {order.payment_method === 'Debt' ? 'NỢ' : 'T.MẶT'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-2 shrink-0">
                                                                <div className={cn(
                                                                    "text-[15px] font-black tracking-tighter tabular-nums text-right leading-none drop-shadow-md",
                                                                    order.type === 'Purchase'
                                                                        ? "text-indigo-300"
                                                                        : (order.type === 'DebtIncrease'
                                                                            ? "text-amber-300"
                                                                            : (order.type === 'Receipt'
                                                                                ? "text-teal-300"
                                                                                : (order.type === 'Payment'
                                                                                    ? "text-rose-300"
                                                                                    : "text-emerald-300")))
                                                                )}>
                                                                    {formatNumber(order.total_amount || order.total)}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            if (order.is_voucher) {
                                                                                onEditVoucher && onEditVoucher(order);
                                                                            } else {
                                                                                onEditOrder && onEditOrder(order);
                                                                            }
                                                                        }} 
                                                                        className="p-1.5 bg-white/10 hover:bg-emerald-500/30 text-white/60 hover:text-emerald-300 rounded-lg transition-all border border-white/10 hover:border-emerald-400/40 shadow-sm"
                                                                        title="Nạp đơn ra giỏ hàng để sửa"
                                                                    >
                                                                        <Edit size={12} strokeWidth={2.5} />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            if (order.is_voucher) {
                                                                                onDeleteVoucher && onDeleteVoucher(order);
                                                                            } else {
                                                                                onDeleteOrder && onDeleteOrder(order.id);
                                                                            }
                                                                        }} 
                                                                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 text-white/50 hover:text-rose-300 rounded-lg transition-all border border-rose-500/20 shadow-sm"
                                                                        title="Xóa đơn hàng"
                                                                    >
                                                                        <Trash2 size={12} strokeWidth={2.5} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* MINI CHIPS PREVIEW */}
                                                        {showInfo && order.details && order.details.length > 0 && (
                                                            <div className="border-t border-white/10 mt-2.5 pt-2 flex flex-wrap gap-1">
                                                                {order.details.slice(0, 3).map((d, dIdx) => (
                                                                    <div 
                                                                        key={dIdx} 
                                                                        className={cn(
                                                                            "px-1.5 py-0.5 border rounded-md text-[8px] font-black uppercase flex items-center gap-1 transition-all",
                                                                            order.type === 'Purchase'
                                                                                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/25"
                                                                                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25"
                                                                        )}
                                                                    >
                                                                        <span className="truncate max-w-[70px]">{d.product_name}</span>
                                                                        <div className={cn("w-px h-1.5", order.type === 'Purchase' ? "bg-indigo-500/40" : "bg-emerald-500/40")} />
                                                                        <span className={cn(order.type === 'Purchase' ? "text-indigo-300" : "text-emerald-300")}>{formatNumber(d.quantity)}</span>
                                                                    </div>
                                                                ))}
                                                                {order.details.length > 3 && (
                                                                    <div className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-black text-white/40 uppercase tracking-tighter">
                                                                        +{order.details.length - 3} món
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {hasMore && (
                                                <button onClick={loadMore} disabled={loading} className="w-full py-3 rounded-xl border border-white/5 text-white/30 text-[8px] font-black uppercase tracking-[0.4em] hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]">
                                                    {loading ? "Đang truy xuất..." : "Tải thêm"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                boughtProducts.length === 0 ? (
                                    <div className="text-center py-40 opacity-20">
                                        <Package size={60} strokeWidth={1} className="mx-auto mb-8 text-white" />
                                        <p className="font-black uppercase text-[10px] tracking-[0.4em] text-white">Trống trải...</p>
                                    </div>
                                ) : boughtProducts.map((p) => (
                                    <div key={p.id} className="bg-white/[0.04] p-3 rounded-xl border border-white/5 hover:border-emerald-500/40 transition-colors flex items-center justify-between hover:bg-white/[0.08]">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <div className="font-black text-[12px] text-white uppercase truncate mb-1" title={p.name}>{p.name}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-500/5 tabular-nums">Tổng {formatNumber(p.total_qty)} {p.unit}</span>
                                                <span className="text-[9px] font-black text-white/20 tabular-nums">Giá cuối: {formatNumber(p.last_price)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => onAddToCart(p)} className="w-8 h-8 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg shadow-lg flex items-center justify-center transition-all border border-emerald-500/5 active:scale-90">
                                            <PlusIcon size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))
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
    </Portal>
    );
}

const PlusIcon = ({ size, strokeWidth }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
