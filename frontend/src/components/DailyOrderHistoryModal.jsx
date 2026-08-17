import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    History, Clock, Search, X, SquarePen, Trash2, Eye, User, FileText,
    Calendar, RefreshCcw, ShoppingBag, Printer, Package,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import Portal from './Portal';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import { formatCurrency, formatNumber, formatDate, getLocalDateString, cn } from '../lib/utils';

// Custom sleek tooltip component replacing native browser titles
const ActionTooltip = ({ text, children, position = "top", className = "" }) => (
    <div className={cn("relative group/tip flex items-center justify-center", className)}>
        {children}
        <div className={cn(
            "absolute pointer-events-none px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-2xl border border-white/10 dark:border-white/20 transition-all duration-150 opacity-0 group-hover/tip:opacity-100 z-[999999]",
            "bg-slate-900/95 text-white dark:bg-[#2a2723] dark:text-[#f3ede2]",
            position === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2 translate-y-1 group-hover/tip:translate-y-0",
            position === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2 -translate-y-1 group-hover/tip:translate-y-0",
            position === "bottom-left" && "top-full mt-2 right-0 -translate-y-1 group-hover/tip:translate-y-0",
            position === "bottom-right" && "top-full mt-2 left-0 -translate-y-1 group-hover/tip:translate-y-0",
            position === "left" && "right-full mr-2 top-1/2 -translate-y-1/2 translate-x-1 group-hover/tip:translate-x-0",
            position === "right" && "left-full ml-2 top-1/2 -translate-y-1/2 -translate-x-1 group-hover/tip:translate-x-0"
        )}>
            {text}
        </div>
    </div>
);

export default function DailyOrderHistoryModal({
    isOpen,
    onClose,
    onEditOrder,
    onDeleteOrder,
    onPrintOrder,
    type = 'Sale',
    settings: propSettings
}) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);

    // Reset selectedDate to current local date whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedDate(getLocalDateString());
        }
    }, [isOpen]);

    const fetchDailyOrders = async () => {
        setLoading(true);
        try {
            const parts = selectedDate.split('-');
            let year, month, day;
            if (parts.length === 3) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            } else {
                const d = new Date(selectedDate);
                year = d.getFullYear();
                month = d.getMonth() + 1;
                day = d.getDate();
            }

            // Fetch FULL list of orders for the selected day (no limit parameter returns all)
            const res = await axios.get('/api/orders', {
                params: {
                    type,
                    year,
                    month,
                    day
                }
            });
            const items = res.data.items || res.data || [];
            setOrders(Array.isArray(items) ? items : []);
            setCurrentPage(1);
        } catch (err) {
            console.error('Error fetching daily orders:', err);
            try {
                const res2 = await axios.get(`/api/orders?type=${type}&limit=500&page=1`);
                const items2 = res2.data.items || res2.data || [];
                const filtered = items2.filter(o => {
                    if (!o.date) return false;
                    const od = getLocalDateString(o.date);
                    return od === selectedDate;
                });
                setOrders(filtered);
                setCurrentPage(1);
            } catch (e2) {
                console.error(e2);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDailyOrders();
        }
    }, [isOpen, selectedDate]);

    // Live Sync via BroadcastChannel
    useEffect(() => {
        if (!isOpen) return;
        const channel = new BroadcastChannel('pos_data_sync');
        channel.onmessage = (e) => {
            if (e.data && (e.data.type === 'ORDER_SAVED' || e.data.type === 'PARTNER_UPDATED')) {
                fetchDailyOrders();
            }
        };
        return () => channel.close();
    }, [isOpen, selectedDate]);

    // Keyboard ESC to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedPaymentMethod, pageSize]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (selectedPaymentMethod !== 'ALL' && order.payment_method !== selectedPaymentMethod) {
                return false;
            }
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const idMatch = (order.id?.toString() || '').includes(term) || (order.display_id?.toString() || '').includes(term);
            const defaultPartnerName = type === 'Purchase' ? 'ncc vãng lai' : 'khách lẻ';
            const currentPartnerName = order.partner_name || order.partner?.name || defaultPartnerName;
            const partnerMatch = currentPartnerName.toLowerCase().includes(term);
            const phoneMatch = (order.partner_phone || order.partner?.phone || '').includes(term);
            const noteMatch = (order.note || '').toLowerCase().includes(term);
            const productMatch = order.details && order.details.some(d => (d.product_name || '').toLowerCase().includes(term));
            return idMatch || partnerMatch || phoneMatch || noteMatch || productMatch;
        });
    }, [orders, selectedPaymentMethod, searchTerm, type]);

    const stats = useMemo(() => {
        const totalAmount = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const cashAmount = filteredOrders.filter(o => o.payment_method === 'Cash').reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const debtAmount = filteredOrders.filter(o => o.payment_method === 'Debt').reduce((sum, o) => sum + ((o.total_amount || 0) - (o.amount_paid || 0)), 0);
        const transferAmount = filteredOrders.filter(o => o.payment_method === 'Transfer').reduce((sum, o) => sum + (o.total_amount || 0), 0);
        return {
            count: filteredOrders.length,
            totalAmount,
            cashAmount,
            debtAmount,
            transferAmount
        };
    }, [filteredOrders]);

    // Pagination computations
    const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage, pageSize]);

    const pageNumbers = useMemo(() => {
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }, [currentPage, totalPages]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[500000] flex items-center justify-center p-3 md:p-6 bg-black/40 backdrop-blur-md overflow-y-auto font-sans no-print"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <m.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-[#fbf9f4]/95 dark:bg-[#1a1c1e]/95 backdrop-blur-2xl w-full max-w-4xl max-h-[92vh] rounded-[2rem] border border-[#8b6f47]/30 dark:border-white/10 flex flex-col relative z-10 overflow-hidden shadow-2xl text-slate-900 dark:text-slate-100"
                >
                    {/* Header */}
                    <div className="p-5 flex items-center justify-between border-b border-[#8b6f47]/15 dark:border-white/10 bg-transparent shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 rounded-2xl flex items-center justify-center border border-[#8b6f47]/20 dark:border-white/10 text-[#8b6f47] dark:text-[#d4a574] shrink-0">
                                <History size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-[#2d5016] dark:text-[#d4a574] uppercase tracking-wide leading-tight flex items-center gap-2">
                                    {type === 'Purchase' ? "Lịch sử nhập hàng trong ngày" : "Lịch sử hóa đơn trong ngày"}
                                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 font-black">
                                        {stats.count} đơn
                                    </span>
                                </h3>
                                <p className="text-[#8b6f47]/70 dark:text-[#d4a574]/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                    {type === 'Purchase' ? "Toàn bộ danh sách đơn nhập hàng & Phân trang tiện lợi" : "Toàn bộ danh sách đơn hàng & Phân trang tiện lợi"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Custom Date Picker */}
                            <CustomDatePicker
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />

                            <ActionTooltip text="Tải lại danh sách" position="bottom">
                                <button
                                    onClick={fetchDailyOrders}
                                    disabled={loading}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 dark:border-white/10 transition-colors active:scale-95"
                                >
                                    <RefreshCcw size={15} className={cn(loading && "animate-spin text-primary")} />
                                </button>
                            </ActionTooltip>

                            <ActionTooltip text="Đóng (ESC)" position="bottom-left">
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 border border-[#8b6f47]/20 dark:border-white/10 transition-colors active:scale-95"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </ActionTooltip>
                        </div>
                    </div>

                    {/* Summary Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4 px-5 bg-transparent border-b border-[#8b6f47]/15 dark:border-white/10 shrink-0">
                        <div className="p-3 px-3.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-[#8b6f47]/20 dark:border-white/10 flex flex-col justify-between shadow-xs">
                            <span className="text-[9px] font-black text-[#8b6f47]/80 dark:text-[#d4a574]/80 uppercase tracking-widest">
                                {type === 'Purchase' ? "Tổng tiền nhập" : "Tổng doanh thu"}
                            </span>
                            <span className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                                {formatCurrency(stats.totalAmount)}
                            </span>
                        </div>
                        <div className="p-3 px-3.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-[#8b6f47]/20 dark:border-white/10 flex flex-col justify-between shadow-xs">
                            <span className="text-[9px] font-black text-[#8b6f47]/80 dark:text-[#d4a574]/80 uppercase tracking-widest">
                                {type === 'Purchase' ? "Đã trả tiền mặt" : "Tiền mặt"}
                            </span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                                {formatCurrency(stats.cashAmount)}
                            </span>
                        </div>
                        <div className="p-3 px-3.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-[#8b6f47]/20 dark:border-white/10 flex flex-col justify-between shadow-xs">
                            <span className="text-[9px] font-black text-rose-700/80 dark:text-rose-300/80 uppercase tracking-widest">
                                {type === 'Purchase' ? "Nợ NCC phát sinh" : "Nợ phát sinh"}
                            </span>
                            <span className="text-base font-black text-rose-600 dark:text-rose-400 tabular-nums mt-1">
                                {formatCurrency(stats.debtAmount)}
                            </span>
                        </div>
                        <div className="p-3 px-3.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-[#8b6f47]/20 dark:border-white/10 flex flex-col justify-between shadow-xs">
                            <span className="text-[9px] font-black text-blue-700/80 dark:text-blue-300/80 uppercase tracking-widest">
                                Chuyển khoản
                            </span>
                            <span className="text-base font-black text-blue-600 dark:text-blue-400 tabular-nums mt-1">
                                {formatCurrency(stats.transferAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="p-4 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#8b6f47]/15 dark:border-white/10 bg-transparent shrink-0">
                        {/* Payment Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                            {[
                                { key: 'ALL', label: 'Tất cả' },
                                { key: 'Cash', label: 'Tiền mặt' },
                                { key: 'Debt', label: type === 'Purchase' ? 'Nợ NCC' : 'Ghi nợ' },
                                { key: 'Transfer', label: 'Chuyển khoản' }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => setSelectedPaymentMethod(filter.key)}
                                    className={cn(
                                        "px-3 py-1 rounded-xl text-xs font-black transition-all shrink-0 tracking-wider",
                                        selectedPaymentMethod === filter.key
                                            ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                                            : "bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 dark:border-white/10"
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input & Page Size */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={type === 'Purchase' ? "Tìm NCC, mã đơn, SP..." : "Tìm khách, mã đơn, SP..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-7 py-1.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[#8b6f47]/25 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-foreground placeholder:text-slate-400 shadow-xs"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black uppercase text-[#8b6f47]/80 dark:text-[#d4a574]/80 whitespace-nowrap">Hiển thị:</span>
                                <CustomSelect
                                    value={pageSize}
                                    onChange={(val) => {
                                        setPageSize(Number(val));
                                        setCurrentPage(1);
                                    }}
                                    options={[
                                        { value: 10, label: '10' },
                                        { value: 20, label: '20' },
                                        { value: 50, label: '50' },
                                        { value: 100, label: '100' }
                                    ]}
                                    className="h-8 min-w-[76px] bg-black/[0.03] dark:bg-white/[0.04] border border-[#8b6f47]/25 dark:border-white/10 rounded-xl px-2.5 text-xs font-black text-[#8b6f47] dark:text-[#d4a574]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Orders List Content */}
                    <div className="flex-1 overflow-y-auto p-4 px-5 space-y-2.5 bg-transparent">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                <RefreshCcw size={28} className="animate-spin text-primary" />
                                <p className="text-xs font-bold uppercase tracking-wider">{type === 'Purchase' ? "Đang tải danh sách đơn nhập..." : "Đang tải danh sách hóa đơn..."}</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground/60">
                                <ShoppingBag size={44} strokeWidth={1.5} />
                                <p className="text-xs font-bold uppercase tracking-widest">{type === 'Purchase' ? "Không có đơn nhập nào phù hợp" : "Không có hóa đơn nào phù hợp"}</p>
                            </div>
                        ) : (
                            paginatedOrders.map((order) => {
                                const orderTime = order.date
                                    ? new Date(order.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--';
                                const defaultPartnerName = type === 'Purchase' ? 'NCC vãng lai' : 'Khách bán lẻ';
                                const partnerName = order.partner_name || order.partner?.name || defaultPartnerName;
                                const partnerPhone = order.partner_phone || order.partner?.phone;

                                return (
                                    <div
                                        key={order.id}
                                        className="p-3.5 px-4 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-[#8b6f47]/5 dark:hover:bg-white/[0.06] rounded-2xl border border-[#8b6f47]/20 dark:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs group"
                                    >
                                        {/* Left: Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-black text-xs text-[#8b6f47] dark:text-[#d4a574] bg-[#8b6f47]/10 px-2 py-0.5 rounded-lg border border-[#8b6f47]/20">
                                                    #{order.display_id || order.id}
                                                </span>
                                                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                                    <Clock size={12} /> {orderTime}
                                                </span>
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border",
                                                    (order.total_amount || 0) < 0
                                                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                                        : order.payment_method === 'Debt'
                                                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                            : order.payment_method === 'Transfer'
                                                                ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                                                : "bg-primary/10 text-primary border-primary/20"
                                                )}>
                                                    {(order.total_amount || 0) < 0 ? (type === 'Purchase' ? 'Trả NCC' : 'Trả hàng') : (order.payment_method === 'Debt' ? 'Ghi nợ' : (order.payment_method === 'Transfer' ? 'Chuyển khoản' : 'Tiền mặt'))}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 py-0.5">
                                                <span className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-slate-100 truncate max-w-[260px] inline-block py-0.5 leading-normal">
                                                    {partnerName}
                                                </span>
                                                {partnerPhone && (
                                                    <span className="text-[11px] font-medium text-muted-foreground">
                                                        - {partnerPhone}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Products Preview */}
                                            {order.details && order.details.length > 0 && (
                                                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                                    {order.details.slice(0, 3).map((d, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] font-bold bg-black/[0.03] dark:bg-white/[0.05] border border-[#8b6f47]/15 dark:border-white/10 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-300 truncate max-w-[170px]"
                                                        >
                                                            {d.product_name} <span className="font-bold text-primary">x{d.quantity}</span>
                                                        </span>
                                                    ))}
                                                    {order.details.length > 3 && (
                                                        <span className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574]">
                                                            +{order.details.length - 3} món khác
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {order.note && (
                                                <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1 italic truncate">
                                                    Ghi chú: {order.note}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Total & Action Buttons */}
                                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/30">
                                            <div className="text-right">
                                                <span className="text-[9px] font-black uppercase text-[#8b6f47]/70 dark:text-[#d4a574]/70 block leading-none">Tổng tiền</span>
                                                <span className="text-base font-black text-[#2d5016] dark:text-emerald-400 tabular-nums leading-tight">
                                                    {formatCurrency(order.total_amount)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {/* View Details Button */}
                                                <ActionTooltip text="Xem chi tiết đơn hàng">
                                                    <button
                                                        onClick={() => setSelectedDetailOrder(order)}
                                                        className="p-2 bg-blue-500/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl border border-blue-500/20 transition-all active:scale-95 flex items-center justify-center"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                </ActionTooltip>

                                                {/* Print Invoice Button */}
                                                {onPrintOrder && (
                                                    <ActionTooltip text={type === 'Purchase' ? "In Phiếu Nhập Hàng" : "In Hóa Đơn Bán Hàng"}>
                                                        <button
                                                            onClick={() => onPrintOrder(order, 'Sale')}
                                                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl border border-emerald-500/20 transition-all active:scale-95"
                                                        >
                                                            <Printer size={15} />
                                                        </button>
                                                    </ActionTooltip>
                                                )}

                                                {/* Print Delivery Slip Button */}
                                                {onPrintOrder && type === 'Sale' && (
                                                    <ActionTooltip text="In Phiếu Xuất Kho">
                                                        <button
                                                            onClick={() => onPrintOrder(order, 'Delivery')}
                                                            className="p-2 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl border border-amber-500/20 transition-all active:scale-95"
                                                        >
                                                            <Package size={15} />
                                                        </button>
                                                    </ActionTooltip>
                                                )}

                                                {/* Primary Edit / Load Order Button */}
                                                <ActionTooltip text="Sửa / Nạp ra giỏ">
                                                    <button
                                                        onClick={() => {
                                                            const enrichedOrder = {
                                                                ...order,
                                                                partner: order.partner || (order.partner_id ? {
                                                                    id: order.partner_id,
                                                                    name: order.partner_name,
                                                                    phone: order.partner_phone,
                                                                    address: order.partner_address
                                                                } : null)
                                                            };
                                                            onEditOrder(enrichedOrder);
                                                            onClose();
                                                        }}
                                                        className="p-2 bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center transition-all active:scale-95"
                                                    >
                                                        <SquarePen size={15} strokeWidth={2.5} />
                                                    </button>
                                                </ActionTooltip>

                                                {/* Delete Button */}
                                                {onDeleteOrder && (
                                                    <ActionTooltip text="Hủy đơn hàng">
                                                        <button
                                                            onClick={() => onDeleteOrder(order)}
                                                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl border border-rose-500/20 transition-all active:scale-95"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </ActionTooltip>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Bar & Footer */}
                    <div className="p-3.5 px-5 bg-transparent border-t border-[#8b6f47]/15 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-[#8b6f47]/80 dark:text-[#d4a574]/80 shrink-0">
                        <div className="flex items-center gap-2">
                            <span>
                                Hiển thị <strong className="text-foreground">{filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> - <strong className="text-foreground">{Math.min(currentPage * pageSize, filteredOrders.length)}</strong> trên tổng <strong className="text-primary font-bold">{filteredOrders.length}</strong> đơn
                            </span>
                        </div>

                        {/* Pagination Navigation Buttons */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#8b6f47]/15 border border-[#8b6f47]/20 dark:border-white/10 disabled:opacity-30 disabled:pointer-events-none text-[#8b6f47] dark:text-[#d4a574] transition-all"
                                    title="Trang đầu"
                                >
                                    <ChevronsLeft size={14} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#8b6f47]/15 border border-[#8b6f47]/20 dark:border-white/10 disabled:opacity-30 disabled:pointer-events-none text-[#8b6f47] dark:text-[#d4a574] transition-all"
                                    title="Trang trước"
                                >
                                    <ChevronLeft size={14} />
                                </button>

                                {pageNumbers.map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition-all",
                                            currentPage === page
                                                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                                                : "bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#8b6f47]/15 border border-[#8b6f47]/20 dark:border-white/10 text-[#8b6f47] dark:text-[#d4a574]"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#8b6f47]/15 border border-[#8b6f47]/20 dark:border-white/10 disabled:opacity-30 disabled:pointer-events-none text-[#8b6f47] dark:text-[#d4a574] transition-all"
                                    title="Trang sau"
                                >
                                    <ChevronRight size={14} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#8b6f47]/15 border border-[#8b6f47]/20 dark:border-white/10 disabled:opacity-30 disabled:pointer-events-none text-[#8b6f47] dark:text-[#d4a574] transition-all"
                                    title="Trang cuối"
                                >
                                    <ChevronsRight size={14} />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#8b6f47]/15 rounded-xl border border-[#8b6f47]/25 dark:border-white/10 font-black text-xs uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574] transition-all active:scale-95"
                        >
                            Đóng
                        </button>
                    </div>
                </m.div>
            </div>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedDetailOrder && (
                    <div
                        className="fixed inset-0 z-[600000] flex items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-md overflow-y-auto no-print"
                        onClick={(e) => e.target === e.currentTarget && setSelectedDetailOrder(null)}
                    >
                        <m.div
                            initial={{ scale: 0.92, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 15 }}
                            className="bg-[#fbf9f4] dark:bg-[#1a1c1e] w-full max-w-2xl rounded-[2rem] border border-[#8b6f47]/30 dark:border-white/10 flex flex-col relative z-10 overflow-hidden shadow-2xl text-slate-900 dark:text-slate-100 my-auto"
                        >
                            {/* Modal Header */}
                            <div className="p-4 px-6 flex items-center justify-between border-b border-[#8b6f47]/15 dark:border-white/10 bg-transparent shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 rounded-2xl flex items-center justify-center border border-[#8b6f47]/20 dark:border-white/10 text-[#8b6f47] dark:text-[#d4a574] shrink-0">
                                        <FileText size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-[#2d5016] dark:text-[#d4a574] uppercase tracking-wide leading-tight flex items-center gap-2">
                                            {type === 'Purchase' ? 'Chi tiết đơn nhập hàng' : 'Chi tiết hóa đơn'} #{selectedDetailOrder.display_id || selectedDetailOrder.id}
                                            <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                ĐANG XEM
                                            </span>
                                        </h3>
                                        <p className="text-[#8b6f47]/70 dark:text-[#d4a574]/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                            {selectedDetailOrder.date ? formatDate(selectedDetailOrder.date) : 'Hôm nay'}
                                        </p>
                                    </div>
                                </div>

                                <ActionTooltip text="Đóng (ESC)" position="bottom-left">
                                    <button
                                        onClick={() => setSelectedDetailOrder(null)}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 border border-[#8b6f47]/20 dark:border-white/10 transition-colors active:scale-95"
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </ActionTooltip>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 md:p-6 overflow-y-auto max-h-[75vh] space-y-4 custom-scrollbar">
                                {/* Info Cards Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/15 dark:border-white/10">
                                        <span className="text-[9px] font-black text-[#8b6f47]/70 dark:text-[#d4a574]/70 uppercase tracking-widest block">
                                            {type === 'Purchase' ? 'Nhà cung cấp' : 'Khách hàng'}
                                        </span>
                                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase truncate block mt-1">
                                            {selectedDetailOrder.partner_name || selectedDetailOrder.partner?.name || (type === 'Purchase' ? 'NCC vãng lai' : 'Khách lẻ')}
                                        </span>
                                        {selectedDetailOrder.partner_phone && (
                                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                                                {selectedDetailOrder.partner_phone}
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/15 dark:border-white/10">
                                        <span className="text-[9px] font-black text-[#8b6f47]/70 dark:text-[#d4a574]/70 uppercase tracking-widest block">
                                            Thời gian lập
                                        </span>
                                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 tabular-nums block mt-1">
                                            {selectedDetailOrder.date ? new Date(selectedDetailOrder.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                                            {selectedDetailOrder.date ? new Date(selectedDetailOrder.date).toLocaleDateString('vi-VN') : ''}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/15 dark:border-white/10">
                                        <span className="text-[9px] font-black text-[#8b6f47]/70 dark:text-[#d4a574]/70 uppercase tracking-widest block">
                                            Phương thức
                                        </span>
                                        <span className={cn(
                                            "inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-lg border",
                                            selectedDetailOrder.payment_method === 'Debt'
                                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                                                : selectedDetailOrder.payment_method === 'Transfer'
                                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                        )}>
                                            {selectedDetailOrder.payment_method === 'Debt' ? 'Ghi nợ' : (selectedDetailOrder.payment_method === 'Transfer' ? 'Chuyển khoản' : 'Tiền mặt')}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/15 dark:border-white/10">
                                        <span className="text-[9px] font-black text-[#8b6f47]/70 dark:text-[#d4a574]/70 uppercase tracking-widest block">
                                            Người tạo
                                        </span>
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase truncate block mt-1 flex items-center gap-1">
                                            <User size={12} />
                                            {selectedDetailOrder.created_by || 'Admin'}
                                        </span>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="rounded-2xl border border-[#8b6f47]/20 dark:border-white/10 overflow-hidden shadow-xs">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-black/[0.03] dark:bg-white/[0.04] border-b border-[#8b6f47]/15 dark:border-white/10 text-[9px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574] tracking-wider">
                                                <th className="py-2.5 px-3.5">#</th>
                                                <th className="py-2.5 px-3.5">Sản phẩm</th>
                                                <th className="py-2.5 px-2.5 text-center">ĐVT</th>
                                                <th className="py-2.5 px-3 text-right">SL</th>
                                                <th className="py-2.5 px-3 text-right">Đơn giá</th>
                                                <th className="py-2.5 px-3.5 text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#8b6f47]/10 dark:divide-white/5 text-xs">
                                            {(selectedDetailOrder.details || []).map((item, idx) => {
                                                const qty = item.quantity || 1;
                                                const unitPrice = item.price !== undefined ? item.price : (item.unit_price || 0);
                                                const lineTotal = qty * unitPrice;
                                                return (
                                                    <tr key={idx} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-2.5 px-3.5 font-bold text-slate-400 text-[10px] tabular-nums">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="py-2.5 px-3.5 font-black text-slate-900 dark:text-slate-100">
                                                            {item.product_name || item.product?.name || 'Sản phẩm'}
                                                        </td>
                                                        <td className="py-2.5 px-2.5 text-center font-bold text-slate-600 dark:text-slate-400 text-[11px]">
                                                            {item.unit || item.product?.unit || 'Cái'}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-black text-[#2d5016] dark:text-emerald-400 tabular-nums">
                                                            {qty}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                                            {formatCurrency(unitPrice)}
                                                        </td>
                                                        <td className="py-2.5 px-3.5 text-right font-black text-slate-900 dark:text-slate-100 tabular-nums">
                                                            {formatCurrency(lineTotal)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Order Note if available */}
                                {selectedDetailOrder.note && (
                                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold italic">
                                        <strong className="font-black not-italic uppercase tracking-wide mr-1.5">Ghi chú:</strong>
                                        {selectedDetailOrder.note}
                                    </div>
                                )}

                                {/* Total Summary */}
                                <div className="p-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-[#8b6f47]/20 dark:border-white/10 flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]">
                                        Tổng tiền thanh toán
                                    </span>
                                    <span className="text-xl font-black text-[#2d5016] dark:text-emerald-400 tabular-nums">
                                        {formatCurrency(selectedDetailOrder.total_amount)}
                                    </span>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="p-4 px-6 border-t border-[#8b6f47]/15 dark:border-white/10 bg-transparent flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    {onPrintOrder && (
                                        <button
                                            onClick={() => {
                                                onPrintOrder(selectedDetailOrder, 'Sale');
                                            }}
                                            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl border border-emerald-500/25 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5"
                                        >
                                            <Printer size={15} />
                                            <span>In hóa đơn</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            const enrichedOrder = {
                                                ...selectedDetailOrder,
                                                partner: selectedDetailOrder.partner || (selectedDetailOrder.partner_id ? {
                                                    id: selectedDetailOrder.partner_id,
                                                    name: selectedDetailOrder.partner_name,
                                                    phone: selectedDetailOrder.partner_phone,
                                                    address: selectedDetailOrder.partner_address
                                                } : null)
                                            };
                                            onEditOrder(enrichedOrder);
                                            setSelectedDetailOrder(null);
                                            onClose();
                                        }}
                                        className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 transition-all active:scale-95 flex items-center gap-1.5"
                                    >
                                        <SquarePen size={15} strokeWidth={2.5} />
                                        <span>Nạp ra giỏ (Sửa)</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => setSelectedDetailOrder(null)}
                                    className="px-4 py-2 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#8b6f47]/15 rounded-xl border border-[#8b6f47]/25 dark:border-white/10 font-black text-xs uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574] transition-all active:scale-95"
                                >
                                    Đóng
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
