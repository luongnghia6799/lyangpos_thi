import React, { useState, useEffect } from 'react';
import Portal from './Portal';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Truck, X, Clock, CheckCircle2, MapPin, Phone, Calendar, Search, ExternalLink, PackageSearch, RefreshCcw } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '../lib/utils';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function ShippingPanel({ isOpen, onClose, onViewOrder }) {
    const queryClient = useQueryClient();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Shipping'); // Shipping, Delivered
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [updatingQty, setUpdatingQty] = useState(null); // { detailId, value }
    const [confirmingShipCancel, setConfirmingShipCancel] = useState(null); // orderId
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA')); // Local YYYY-MM-DD

    useEffect(() => {
        if (isOpen) {
            fetchShippingOrders();
        }
    }, [isOpen, filterDate]);

    const fetchShippingOrders = async () => {
        setLoading(true);
        try {
            // Fetch all orders that are currently 'Shipping'
            const shippingRes = await axios.get(`/api/orders?shipping_status=Shipping&limit=100&sort_by=date&sort_order=desc`);
            const shippingData = shippingRes.data.items || shippingRes.data;

            // Fetch 'Delivered' orders for the specific filtered date
            const [year, month, day] = filterDate.split('-');
            const deliveredRes = await axios.get(`/api/orders?shipping_status=Delivered&delivered_year=${year}&delivered_month=${month}&delivered_day=${day}&limit=100&sort_by=date&sort_order=desc`);
            const deliveredData = deliveredRes.data.items || deliveredRes.data;

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
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, shipping_status: newStatus } : o));
                toast.success(newStatus === 'Delivered' ? "Đã giao hàng thành công!" : "Đã hoàn tác trạng thái.");
            }
            queryClient.invalidateQueries(['shippingSummary']);
        } catch (err) {
            console.error("Error updating shipping status:", err);
            toast.error("Không thể cập nhật trạng thái.");
        }
    };

    const updateItemShippedQty = async (detail, newQty) => {
        const loadingToast = toast.loading("Đang cập nhật...");
        try {
            const res = await axios.patch(`/api/order-details/${detail.id}/shipped-quantity`, { shipped_quantity: newQty });
            const { order_shipping_status } = res.data;

            setOrders(prev => prev.map(o => {
                if (o.details?.some(d => d.id === detail.id)) {
                    const newDetails = o.details.map(d => d.id === detail.id ? { ...d, shipped_quantity: newQty } : d);
                    return { ...o, details: newDetails, shipping_status: order_shipping_status };
                }
                return o;
            }));
            setUpdatingQty(null);
            queryClient.invalidateQueries(['shippingSummary']);
            toast.success("Cập nhật số lượng thành công!", { id: loadingToast });
        } catch (err) {
            console.error("Error updating item shipped qty:", err);
            toast.error("Không thể cập nhật số lượng.", { id: loadingToast });
        }
    };

    const filteredOrders = orders.filter(o =>
        (activeTab === 'any' || o.shipping_status === activeTab) &&
        (o.display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.shipping_phone?.includes(searchTerm))
    );

    return (
        <Portal>
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500000] flex justify-end font-sans">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-transparent"
                    />
                    <m.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-[650px] h-full bg-card/75 dark:bg-slate-950/75 backdrop-blur-2xl flex flex-col border-l border-white/10 dark:border-white/15 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-border bg-transparent flex justify-between items-center relative overflow-hidden shrink-0">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                    <Truck size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground uppercase tracking-wide leading-tight">Giao Hàng</h3>
                                    <div className="flex gap-3 mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{orders.filter(o => o.shipping_status === 'Shipping').length} ĐANG CHẠY</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{orders.filter(o => o.shipping_status === 'Delivered').length} HOÀN TẤT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors z-10"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Search & Tabs */}
                        <div className="p-5 space-y-4 bg-transparent border-b border-border">
                            <div className="flex gap-3">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tìm mã đơn, tên khách..."
                                        className="w-full h-11 pl-10 pr-4 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm font-semibold transition-all outline-none dark:text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="relative w-36 group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" size={16} />
                                    <input
                                        type="date"
                                        className="w-full h-11 pl-9 pr-2 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs font-semibold transition-all outline-none appearance-none dark:text-white uppercase"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {[
                                    { label: 'Đang giao', value: 'Shipping', icon: Clock },
                                    { label: 'Đã giao', value: 'Delivered', icon: CheckCircle2 }
                                ].map(tab => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setActiveTab(tab.value)}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                            activeTab === tab.value
                                                ? "bg-primary text-white shadow-md"
                                                : "bg-background border border-border text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <tab.icon size={14} strokeWidth={2.5} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-transparent">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                    <span className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">Đang tải đơn hàng...</span>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <Truck size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-bold uppercase text-xs tracking-widest">Không tìm thấy đơn nào</p>
                                </div>
                            ) : (
                                filteredOrders.map((order, idx) => (
                                    <m.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all group flex flex-col relative overflow-hidden",
                                            order.shipping_status === 'Delivered'
                                                ? "bg-[#022c22] border-blue-500/30 hover:border-blue-400 hover:bg-[#022c22]/90 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                                : "bg-[#022c22] border-emerald-500/30 hover:border-emerald-400 hover:bg-[#022c22]/90 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute left-0 top-0 w-1 h-full transition-colors z-10",
                                            order.shipping_status === 'Delivered' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                        )} />

                                        <div className="flex items-center justify-between w-full mb-3 pl-2">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner",
                                                    order.shipping_status === 'Delivered' ? "bg-blue-500/20 text-blue-500" : "bg-emerald-500/20 text-emerald-500"
                                                )}>
                                                    {order.shipping_status === 'Delivered' ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <Truck size={14} strokeWidth={2.5} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className={cn(
                                                        "text-[12px] font-black uppercase tracking-wide leading-none mb-1 truncate pr-2 flex items-center gap-1",
                                                        order.shipping_status === 'Delivered' ? "text-blue-400" : "text-emerald-400 font-extrabold"
                                                    )}>
                                                        #{order.display_id}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-white/30 tabular-nums uppercase">
                                                            {order.shipping_status === 'Delivered' ? (order.delivery_date ? formatDate(order.delivery_date) : formatDate(order.date)) : formatDate(order.date)}
                                                        </span>
                                                        <div className={cn("text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-tight border", 
                                                            order.shipping_status === 'Delivered' ? "bg-blue-500/20 text-blue-400 border-blue-500/5" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/5")}>
                                                            {order.partner_name || 'Khách lẻ'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pl-2 shrink-0">
                                                <div className={cn(
                                                    "text-[15px] font-black tracking-tighter tabular-nums text-right leading-none drop-shadow-md",
                                                    order.shipping_status === 'Delivered' ? "text-blue-400" : "text-emerald-400"
                                                )}>
                                                    {formatNumber(order.total_amount)}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmingShipCancel(order.id);
                                                    }}
                                                    className="p-1 bg-rose-500/10 hover:bg-rose-500/30 text-white/40 hover:text-rose-400 rounded-md transition-all"
                                                    title="Hủy giao hàng"
                                                >
                                                    <X size={10} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Shipping Info - styled like inner boxes in history panel */}
                                        <div className="flex gap-2 items-center mb-3 bg-white/5 p-2 rounded-lg border border-white/5 ml-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <MapPin size={10} className="text-emerald-400 shrink-0" />
                                                <span className="text-[10px] font-bold text-white/70 truncate">
                                                    {order.shipping_address || <span className="italic opacity-50">N/A</span>}
                                                </span>
                                            </div>
                                            <div className="w-px h-3 bg-white/10 shrink-0" />
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Phone size={10} className="text-blue-400 shrink-0" />
                                                <span className="text-[10px] font-black text-white/90">
                                                    {order.shipping_phone || <span className="italic opacity-50">N/A</span>}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1.5 ml-2">
                                            <button
                                                onClick={() => setExpandedOrderId(order.id)}
                                                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-md transition-all border border-white/5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                                            >
                                                <PackageSearch size={10} /> Bốc hàng
                                            </button>

                                            <button
                                                onClick={() => onViewOrder(order)}
                                                className="w-7 h-7 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-md transition-all border border-white/5 flex items-center justify-center"
                                            >
                                                <ExternalLink size={10} />
                                            </button>

                                            {order.shipping_status === 'Shipping' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'Delivered')}
                                                    className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/20 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                                                >
                                                    <CheckCircle2 size={10} strokeWidth={2.5} /> XONG
                                                </button>
                                            )}

                                            {order.shipping_status === 'Delivered' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'Shipping')}
                                                    className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                                                >
                                                    <RefreshCcw size={10} /> HOÀN TÁC
                                                </button>
                                            )}
                                        </div>
                                    </m.div>
                                ))
                            )}
                        </div>
                    </m.div>

                    {/* Packing Modal (Gọn hơn) */}
                    <AnimatePresence>
                        {expandedOrderId && (
                            <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                                <m.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setExpandedOrderId(null)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <m.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="relative w-full max-w-xl bg-card/80 dark:bg-slate-950/80 backdrop-blur-2xl rounded-[32px] overflow-hidden shadow-2xl border border-white/10 dark:border-white/15"
                                >
                                    {/* Modal Header */}
                                    {(() => {
                                        const order = orders.find(o => o.id === expandedOrderId);
                                        if (!order) return null;
                                        const progress = Math.round((order.details?.reduce((acc, d) => acc + (d.shipped_quantity || 0), 0) / order.details?.reduce((acc, d) => acc + d.quantity, 0)) * 100);

                                        return (
                                            <>
                                                <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-transparent/50 dark:bg-slate-800/50">
                                                    <div>
                                                        <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase">📦 Bốc hàng #{order.display_id}</h4>
                                                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{order.partner_name || 'Khách lẻ'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Tiến độ bốc</div>
                                                        <div className="text-2xl font-black text-emerald-600">{progress}%</div>
                                                    </div>
                                                </div>

                                                <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
                                                    {order.details?.map(detail => {
                                                        const isDone = (detail.shipped_quantity || 0) >= detail.quantity;
                                                        return (
                                                            <div
                                                                key={detail.id}
                                                                className={cn(
                                                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                                                    isDone
                                                                        ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/20 opacity-60"
                                                                        : "bg-transparent border-gray-100 dark:border-slate-800 shadow-sm"
                                                                )}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={cn("text-base font-black uppercase tracking-tight truncate", isDone && "line-through text-gray-400")}>
                                                                        {detail.product_name}
                                                                    </div>
                                                                    <div className="text-sm font-bold text-gray-400 mt-1">
                                                                        SL: <span className="text-gray-900 dark:text-gray-100 font-black">{detail.shipped_quantity || 0}</span> / {detail.quantity} {detail.unit}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {updatingQty?.detailId === detail.id ? (
                                                                        <input
                                                                            type="number"
                                                                            autoFocus
                                                                            className="w-20 h-10 bg-transparent border-2 border-emerald-500 rounded-xl text-lg font-black text-center outline-none"
                                                                            value={updatingQty.value}
                                                                            onChange={(e) => setUpdatingQty({ ...updatingQty, value: e.target.value })}
                                                                            onBlur={() => updateItemShippedQty(detail, parseFloat(updatingQty.value) || 0)}
                                                                            onKeyDown={(e) => e.key === 'Enter' && updateItemShippedQty(detail, parseFloat(updatingQty.value) || 0)}
                                                                        />
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setUpdatingQty({ detailId: detail.id, value: detail.shipped_quantity || 0 })}
                                                                            className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-400 transition-all border border-transparent hover:border-gray-200"
                                                                        >
                                                                            <Search size={18} />
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => updateItemShippedQty(detail, isDone ? 0 : detail.quantity)}
                                                                        className={cn(
                                                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md",
                                                                            isDone
                                                                                ? "bg-emerald-500 text-white"
                                                                                : "bg-transparent border-2 border-gray-200 dark:border-slate-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-500"
                                                                        )}
                                                                    >
                                                                        <CheckCircle2 size={24} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="p-6 border-t dark:border-slate-800 bg-transparent/50 dark:bg-slate-800/50">
                                                    <button
                                                        onClick={() => setExpandedOrderId(null)}
                                                        className="w-full h-14 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
                                                    >
                                                        Đóng danh sách
                                                    </button>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </m.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Custom Confirm Modal */}
                    <AnimatePresence>
                        {confirmingShipCancel && (
                            <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                                <m.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setConfirmingShipCancel(null)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <m.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="relative w-full max-w-sm bg-transparent rounded-[32px] p-8 shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
                                >
                                    <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mb-6 mx-auto">
                                        <Truck size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white text-center uppercase tracking-tight mb-2">Gỡ danh sách ship?</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-medium leading-relaxed mb-8">
                                        Bạn có chắc chắn muốn gỡ đơn hàng này không? Đơn hàng vẫn được lưu lại trong lịch sử bán hàng.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmingShipCancel(null)}
                                            className="flex-1 h-12 bg-transparent text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Bỏ qua
                                        </button>
                                        <button
                                            onClick={() => updateStatus(confirmingShipCancel, null)}
                                            className="flex-1 h-12 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
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
