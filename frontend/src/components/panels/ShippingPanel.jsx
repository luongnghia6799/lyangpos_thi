import React, { useState, useEffect } from 'react';
import Portal from '../widgets/Portal';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    Truck, X, Clock, CheckCircle2, MapPin, Phone, Calendar, Search,
    ExternalLink, PackageSearch, RefreshCcw, Plus, Minus, Check, ChevronDown,
    ChevronUp, AlertCircle, ShoppingBag, ArrowUpRight, ArrowRight, User
} from 'lucide-react';
import { formatDate, formatNumber, cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function ShippingPanel({ isOpen, onClose, onViewOrder }) {
    const queryClient = useQueryClient();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Shipping'); // Shipping, Delivered, all
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [inlineExpandedOrderId, setInlineExpandedOrderId] = useState(null); // Accordion inline item list
    const [updatingQty, setUpdatingQty] = useState(null); // { detailId, value }
    const [confirmingShipCancel, setConfirmingShipCancel] = useState(null); // orderId
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA')); // Local YYYY-MM-DD

    useEffect(() => {
        if (isOpen) {
            fetchShippingOrders();
        }
    }, [isOpen, filterDate]);

    // Listen to ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (expandedOrderId) {
                    setExpandedOrderId(null);
                } else if (confirmingShipCancel) {
                    setConfirmingShipCancel(null);
                } else if (isOpen) {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, expandedOrderId, confirmingShipCancel, onClose]);

    const fetchShippingOrders = async () => {
        setLoading(true);
        try {
            // Fetch all orders that are currently 'Shipping'
            const shippingRes = await axios.get(`/api/orders?shipping_status=Shipping&limit=100&sort_by=date&sort_order=desc`);
            const shippingData = shippingRes.data.items || shippingRes.data || [];

            // Fetch 'Delivered' orders for the specific filtered date
            const [year, month, day] = filterDate.split('-');
            const deliveredRes = await axios.get(`/api/orders?shipping_status=Delivered&delivered_year=${year}&delivered_month=${month}&delivered_day=${day}&limit=100&sort_by=date&sort_order=desc`);
            const deliveredData = deliveredRes.data.items || deliveredRes.data || [];

            // Combine them
            setOrders([...shippingData, ...deliveredData]);
        } catch (err) {
            console.error("Error fetching shipping orders:", err);
            toast.error("Không thể tải danh sách giao hàng.");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.patch(`/api/orders/${orderId}/shipping-status`, { shipping_status: newStatus });
            // Update local state
            if (newStatus === null) {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                setConfirmingShipCancel(null);
                toast.success("Đã gỡ đơn khỏi danh sách giao hàng.");
            } else {
                setOrders(prev => prev.map(o => o.id === orderId ? {
                    ...o,
                    shipping_status: newStatus,
                    details: o.details?.map(d => ({
                        ...d,
                        shipped_quantity: newStatus === 'Delivered' ? d.quantity : 0
                    }))
                } : o));
                toast.success(newStatus === 'Delivered' ? "Đã giao hàng thành công & trừ tồn kho!" : "Đã hoàn tác trạng thái & hoàn lại tồn kho.");
            }
            queryClient.invalidateQueries(['shippingSummary']);
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['posHistory']);
            try {
                const bc = new BroadcastChannel('pos_data_sync');
                bc.postMessage({ type: 'SYNC_ORDERS' });
                bc.postMessage({ type: 'SYNC_PRODUCTS' });
                bc.close();
            } catch (e) { }
        } catch (err) {
            console.error("Error updating shipping status:", err);
            toast.error("Không thể cập nhật trạng thái.");
        }
    };

    const updateItemShippedQty = async (detail, newQty) => {
        const clampedQty = Math.max(0, Math.min(detail.quantity, Number(newQty) || 0));
        const loadingToast = toast.loading("Đang cập nhật...");
        try {
            const res = await axios.patch(`/api/order-details/${detail.id}/shipped-quantity`, { shipped_quantity: clampedQty });
            const { order_shipping_status } = res.data;

            setOrders(prev => prev.map(o => {
                if (o.details?.some(d => d.id === detail.id)) {
                    const newDetails = o.details.map(d => d.id === detail.id ? { ...d, shipped_quantity: clampedQty } : d);
                    return { ...o, details: newDetails, shipping_status: order_shipping_status };
                }
                return o;
            }));
            setUpdatingQty(null);
            queryClient.invalidateQueries(['shippingSummary']);
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['posHistory']);
            try {
                const bc = new BroadcastChannel('pos_data_sync');
                bc.postMessage({ type: 'SYNC_ORDERS' });
                bc.postMessage({ type: 'SYNC_PRODUCTS' });
                bc.close();
            } catch (e) { }
            toast.success("Cập nhật số lượng & tồn kho thành công!", { id: loadingToast });
        } catch (err) {
            console.error("Error updating item shipped qty:", err);
            toast.error("Không thể cập nhật số lượng.", { id: loadingToast });
        }
    };

    const shippingCount = orders.filter(o => o.shipping_status === 'Shipping').length;
    const deliveredCount = orders.filter(o => o.shipping_status === 'Delivered').length;

    const filteredOrders = orders.filter(o =>
        (activeTab === 'all' || o.shipping_status === activeTab) &&
        (o.display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.shipping_phone?.includes(searchTerm) ||
            o.shipping_address?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[500000] flex justify-end font-sans">
                        {/* Backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
                        />

                        {/* Slide-out Drawer */}
                        <m.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 28, stiffness: 260 }}
                            className="relative w-full max-w-[620px] h-full bg-[#fbfbf9] dark:bg-[#151914] flex flex-col border-l border-black/10 dark:border-white/10 shadow-2xl text-slate-800 dark:text-slate-100 select-none"
                        >
                            {/* Header */}
                            <div className="p-4 px-5 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/20 backdrop-blur-md flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                                        <Truck size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                                QUẢN LÝ GIAO HÀNG
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                {shippingCount} ĐANG GIAO
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider">
                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                {deliveredCount} ĐÃ GIAO
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-9 h-9 flex items-center justify-center rounded-2xl bg-black/[0.03] dark:bg-white/5 hover:bg-rose-500 hover:text-white text-slate-400 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                                    title="Đóng (Esc)"
                                >
                                    <X size={17} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Search & Tabs Filter Bar */}
                            <div className="p-4 space-y-3 bg-[#fbfbf9] dark:bg-[#151914] border-b border-black/5 dark:border-white/10">
                                <div className="flex gap-2.5">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Tìm mã đơn, tên khách, SĐT, địa chỉ..."
                                            className="w-full h-10.5 pl-10 pr-9 bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-2xl text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative w-38 group">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                                        <input
                                            type="date"
                                            className="w-full h-10.5 pl-9 pr-2 bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-2xl text-[11px] font-black uppercase text-slate-800 dark:text-white outline-none transition-all shadow-2xs"
                                            value={filterDate}
                                            onChange={(e) => setFilterDate(e.target.value)}
                                            title="Lọc ngày nhận hàng"
                                        />
                                    </div>
                                </div>

                                <div className="flex bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] gap-1.5">
                                    {[
                                        { label: `Đang giao (${shippingCount})`, value: 'Shipping', icon: Clock },
                                        { label: `Đã giao (${deliveredCount})`, value: 'Delivered', icon: CheckCircle2 },
                                        { label: `Tất cả (${orders.length})`, value: 'all', icon: Truck }
                                    ].map(tab => {
                                        const isActive = activeTab === tab.value;
                                        return (
                                            <button
                                                key={tab.value}
                                                type="button"
                                                onClick={() => setActiveTab(tab.value)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                                    isActive
                                                        ? "bg-white dark:bg-white/10 text-emerald-800 dark:text-emerald-300 shadow-sm border border-black/[0.04] dark:border-white/10"
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                )}
                                            >
                                                <tab.icon size={13} strokeWidth={2.5} />
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Order Cards List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3.5 bg-transparent">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-28 text-emerald-600 dark:text-emerald-400">
                                        <div className="w-10 h-10 border-3 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                                        <span className="font-black text-xs uppercase tracking-[0.2em]">Đang nạp đơn giao hàng...</span>
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="text-center py-24 text-slate-400 dark:text-slate-500">
                                        <Truck size={48} className="mx-auto mb-3 opacity-25 text-emerald-600 dark:text-emerald-400" />
                                        <p className="font-black uppercase text-xs tracking-widest">Không có đơn hàng nào</p>
                                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                                            {searchTerm ? "Thử đổi từ khóa tìm kiếm" : "Các đơn tích chọn 'Giao hàng tận nơi' sẽ xuất hiện tại đây"}
                                        </p>
                                    </div>
                                ) : (
                                    filteredOrders.map((order, idx) => {
                                        const isDelivered = order.shipping_status === 'Delivered';
                                        const packedCount = order.details?.reduce((acc, d) => acc + (d.shipped_quantity || 0), 0) || 0;
                                        const totalCount = order.details?.reduce((acc, d) => acc + (d.quantity || 0), 0) || 0;
                                        const packedPct = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
                                        const isInlineOpen = inlineExpandedOrderId === order.id;

                                        return (
                                            <m.div
                                                key={order.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className={cn(
                                                    "rounded-3xl border transition-all group/card flex flex-col relative overflow-hidden bg-white dark:bg-[#181d17] p-4 gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-black/20",
                                                    isDelivered
                                                        ? "border-blue-500/20 hover:border-blue-500/40"
                                                        : "border-black/[0.05] dark:border-white/[0.06] hover:border-emerald-500/30"
                                                )}
                                            >
                                                {/* Card Header Top Row */}
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                                            isDelivered
                                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                        )}>
                                                            {isDelivered ? <CheckCircle2 size={19} strokeWidth={2.5} /> : <Truck size={19} strokeWidth={2.5} />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={cn(
                                                                    "text-sm font-black uppercase tracking-tight truncate",
                                                                    isDelivered ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                                                                )}>
                                                                    #{order.display_id || order.id}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                                                    {isDelivered ? (order.delivery_date ? formatDate(order.delivery_date) : formatDate(order.date)) : formatDate(order.date)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex items-center gap-1 text-xs font-black text-slate-700 dark:text-slate-200 truncate">
                                                                    <User size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                    <span>{order.partner_name || 'Khách bán lẻ'}</span>
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                                    packedPct === 100
                                                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                                        : packedPct > 0
                                                                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                                                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                                                                )}>
                                                                    Bốc {packedCount}/{totalCount} ({packedPct}%)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Total Amount & Fast Cancel */}
                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        <div className="text-right">
                                                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                                                                TỔNG ĐƠN
                                                            </div>
                                                            <div className={cn(
                                                                "text-base font-black tracking-tight tabular-nums mt-0.5",
                                                                isDelivered ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                                                            )}>
                                                                {formatNumber(order.total_amount)}<span className="text-xs font-bold ml-0.5">đ</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmingShipCancel(order.id);
                                                            }}
                                                            className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                                                            title="Gỡ khỏi danh sách giao hàng"
                                                        >
                                                            <X size={14} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Shipping Address & Phone Box - Borderless Minimal Theme */}
                                                <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-white/[0.03] p-2.5 px-3.5 rounded-2xl text-xs">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <MapPin size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                                            {order.shipping_address || <span className="italic text-slate-400 font-normal">Chưa có địa chỉ</span>}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 sm:border-l sm:border-black/5 dark:sm:border-white/5 sm:pl-3">
                                                        <Phone size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                                        <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">
                                                            {order.shipping_phone ? (
                                                                <a href={`tel:${order.shipping_phone}`} className="hover:underline">
                                                                    {order.shipping_phone}
                                                                </a>
                                                            ) : (
                                                                <span className="italic text-slate-400 font-normal">Không có SĐT</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Inline Product Items List Accordion */}
                                                {isInlineOpen && order.details && order.details.length > 0 && (
                                                    <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-3 space-y-2 border border-black/[0.02] dark:border-white/[0.03]">
                                                        <div className="flex justify-between items-center px-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                            <span>Hàng cần giao ({order.details.length} món)</span>
                                                            <span>Đã bốc / Đặt</span>
                                                        </div>
                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                            {order.details.map(d => {
                                                                const itemDone = (d.shipped_quantity || 0) >= d.quantity;
                                                                return (
                                                                    <div
                                                                        key={d.id}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors",
                                                                            itemDone
                                                                                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                                                                                : "bg-white dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 shadow-2xs"
                                                                        )}
                                                                    >
                                                                        <div className="min-w-0 flex-1 truncate pr-2">
                                                                            <span>{d.product_name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className={cn(
                                                                                "font-black tabular-nums",
                                                                                itemDone ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"
                                                                            )}>
                                                                                {d.shipped_quantity || 0} / {d.quantity} {d.unit || d.product_unit || ''}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateItemShippedQty(d, itemDone ? 0 : d.quantity)}
                                                                                className={cn(
                                                                                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                                                                    itemDone
                                                                                        ? "bg-emerald-500 text-white"
                                                                                        : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white"
                                                                                )}
                                                                                title={itemDone ? "Đặt về 0" : "Bốc đủ"}
                                                                            >
                                                                                <Check size={12} strokeWidth={3} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions Row */}
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedOrderId(order.id)}
                                                        className="flex-1 h-10 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-500/20 active:scale-98"
                                                    >
                                                        <PackageSearch size={14} /> Bốc hàng ({packedCount}/{totalCount})
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setInlineExpandedOrderId(isInlineOpen ? null : order.id)}
                                                        className={cn(
                                                            "h-10 px-3 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer",
                                                            isInlineOpen
                                                                ? "bg-emerald-600 text-white"
                                                                : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                                                        )}
                                                        title="Xem/Ẩn nhanh danh sách sản phẩm"
                                                    >
                                                        <ShoppingBag size={14} />
                                                        {isInlineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>

                                                    {/* Nút Mở OrderEditPopup sửa đơn hàng */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onViewOrder?.(order);
                                                        }}
                                                        className="h-10 px-3 bg-slate-100 dark:bg-white/5 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center transition-all cursor-pointer group shadow-2xs"
                                                        title="Chỉnh sửa đơn hàng (OrderEditPopup)"
                                                    >
                                                        <ExternalLink size={15} className="group-hover:scale-110 transition-transform" />
                                                    </button>

                                                    {!isDelivered ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateStatus(order.id, 'Delivered')}
                                                            className="flex-1 h-10 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-98"
                                                        >
                                                            <CheckCircle2 size={14} strokeWidth={2.5} /> XONG (ĐÃ GIAO)
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateStatus(order.id, 'Shipping')}
                                                            className="flex-1 h-10 px-3 bg-slate-100 dark:bg-white/10 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                                                        >
                                                            <RefreshCcw size={13} strokeWidth={2.5} /> HOÀN TÁC GIAO
                                                        </button>
                                                    )}
                                                </div>
                                            </m.div>
                                        );
                                    })
                                )}
                            </div>
                        </m.div>

                        {/* Packing Modal (Gọn gàng, tone sang trọng LyangPOS) */}
                        <AnimatePresence>
                            {expandedOrderId && (
                                <div className="fixed inset-0 z-[600000] flex items-center justify-center p-4">
                                    <m.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setExpandedOrderId(null)}
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    />
                                    <m.div
                                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                                        className="relative w-full max-w-xl bg-white dark:bg-[#181d17] rounded-3xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 text-slate-800 dark:text-slate-100 flex flex-col max-h-[85vh]"
                                    >
                                        {(() => {
                                            const order = orders.find(o => o.id === expandedOrderId);
                                            if (!order) return null;
                                            const totalItemQty = order.details?.reduce((acc, d) => acc + d.quantity, 0) || 0;
                                            const totalShippedQty = order.details?.reduce((acc, d) => acc + (d.shipped_quantity || 0), 0) || 0;
                                            const progress = totalItemQty > 0 ? Math.round((totalShippedQty / totalItemQty) * 100) : 0;

                                            return (
                                                <>
                                                    {/* Header */}
                                                    <div className="p-5 border-b border-black/5 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex justify-between items-center shrink-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                                                                <PackageSearch size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                    BỐC HÀNG #{order.display_id || order.id}
                                                                </h4>
                                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                    {order.partner_name || 'Khách lẻ'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (progress === 100) {
                                                                        updateStatus(order.id, 'Shipping');
                                                                    } else {
                                                                        updateStatus(order.id, 'Delivered');
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95",
                                                                    progress === 100
                                                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
                                                                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                                                                )}
                                                            >
                                                                {progress === 100 ? "Đặt lại 0%" : "Bốc đủ 100%"}
                                                            </button>
                                                            <div className="text-right">
                                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiến độ</div>
                                                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{progress}%</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Items List */}
                                                    <div className="overflow-y-auto p-4 space-y-2.5 flex-1 custom-scrollbar">
                                                        {order.details?.map(detail => {
                                                            const isDone = (detail.shipped_quantity || 0) >= detail.quantity;
                                                            const currentShipped = detail.shipped_quantity || 0;
                                                            return (
                                                                <div
                                                                    key={detail.id}
                                                                    className={cn(
                                                                        "flex items-center gap-3 p-3.5 rounded-2xl transition-all",
                                                                        isDone
                                                                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                                                                            : "bg-slate-50 dark:bg-white/[0.03] text-slate-800 dark:text-slate-100 shadow-2xs"
                                                                    )}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={cn(
                                                                            "text-sm font-black uppercase tracking-tight truncate",
                                                                            isDone ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-100"
                                                                        )}>
                                                                            {detail.product_name}
                                                                        </div>
                                                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                                                            Đã bốc: <span className={cn("font-black", isDone ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white")}>{currentShipped}</span> / {detail.quantity} {detail.unit || detail.product_unit || ''}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        {/* Direct Stepper */}
                                                                        <div className="flex items-center bg-white dark:bg-black/20 rounded-xl overflow-hidden p-0.5 shadow-2xs">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateItemShippedQty(detail, Math.max(0, currentShipped - 1))}
                                                                                className="w-7.5 h-7.5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 rounded-lg transition-colors font-bold select-none cursor-pointer"
                                                                                title="Giảm 1"
                                                                            >
                                                                                <Minus size={13} />
                                                                            </button>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={detail.quantity}
                                                                                step="any"
                                                                                className="w-14 h-7.5 bg-transparent text-center font-black text-xs text-slate-800 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                value={updatingQty?.detailId === detail.id ? updatingQty.value : currentShipped}
                                                                                onFocus={() => setUpdatingQty({ detailId: detail.id, value: currentShipped })}
                                                                                onChange={(e) => setUpdatingQty({ detailId: detail.id, value: e.target.value })}
                                                                                onBlur={() => {
                                                                                    if (updatingQty?.detailId === detail.id) {
                                                                                        updateItemShippedQty(detail, parseFloat(updatingQty.value) || 0);
                                                                                    }
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        updateItemShippedQty(detail, parseFloat(updatingQty?.value) || 0);
                                                                                        e.target.blur();
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateItemShippedQty(detail, Math.min(detail.quantity, currentShipped + 1))}
                                                                                className="w-7.5 h-7.5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 rounded-lg transition-colors font-bold select-none cursor-pointer"
                                                                                title="Tăng 1"
                                                                            >
                                                                                <Plus size={13} />
                                                                            </button>
                                                                        </div>

                                                                        {/* Check Button */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateItemShippedQty(detail, isDone ? 0 : detail.quantity)}
                                                                            className={cn(
                                                                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer active:scale-95",
                                                                                isDone
                                                                                    ? "bg-emerald-600 text-white shadow-emerald-600/25"
                                                                                    : "bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-emerald-500 hover:text-white"
                                                                            )}
                                                                            title={isDone ? "Bỏ chọn (về 0)" : "Bốc đủ số lượng"}
                                                                        >
                                                                            <CheckCircle2 size={18} strokeWidth={2.5} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="p-4 border-t border-black/5 dark:border-white/10 bg-slate-50 dark:bg-black/20 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedOrderId(null)}
                                                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                                                        >
                                                            Hoàn tất & Đóng
                                                        </button>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </m.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Confirmation Cancel Modal */}
                        <AnimatePresence>
                            {confirmingShipCancel && (
                                <div className="fixed inset-0 z-[600000] flex items-center justify-center p-4">
                                    <m.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setConfirmingShipCancel(null)}
                                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    />
                                    <m.div
                                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                                        className="relative w-full max-w-sm bg-white dark:bg-[#181d17] rounded-3xl p-6 shadow-2xl overflow-hidden border border-rose-500/20 text-slate-800 dark:text-slate-100"
                                    >
                                        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-4 mx-auto">
                                            <AlertCircle size={28} />
                                        </div>
                                        <h3 className="text-base font-black text-center uppercase tracking-tight mb-2">
                                            Gỡ đơn khỏi danh sách giao?
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium leading-relaxed mb-6">
                                            Đơn hàng vẫn được lưu lại trong lịch sử bán hàng và không bị xóa.
                                        </p>
                                        <div className="flex gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmingShipCancel(null)}
                                                className="flex-1 h-10.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                                            >
                                                Bỏ qua
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateStatus(confirmingShipCancel, null)}
                                                className="flex-1 h-10.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-rose-500/25 transition-all cursor-pointer active:scale-95"
                                            >
                                                Gỡ ngay
                                            </button>
                                        </div>
                                    </m.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
