import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Clock, User, ChevronLeft, Check, Layers, ArrowRight } from 'lucide-react';
import { formatNumber } from '../../lib/utils';
import MobileMenu from '../../components/MobileMenu';
import { cn } from '../../lib/utils';
import useMobileNative from '../../hooks/useMobileNative';

export default function MobileOrders() {
    const { triggerHaptic } = useMobileNative();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterStatus, setFilterStatus] = useState('Pending');

    const fetchTodayOrders = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const res = await axios.get(`/api/orders?type=Sale&year=${year}&month=${month}&day=${day}&limit=100`);
            setOrders(res.data.items || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayOrders();
        const interval = setInterval(fetchTodayOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => (o.status || 'Pending') === filterStatus);
    }, [orders, filterStatus]);

    const [displayLimit, setDisplayLimit] = useState(25);

    useEffect(() => {
        setDisplayLimit(25);
    }, [filterStatus]);

    const paginatedOrders = useMemo(() => {
        const sorted = [...filteredOrders].sort((a, b) => b.id - a.id);
        return sorted.slice(0, displayLimit);
    }, [filteredOrders, displayLimit]);

    const handleMarkAsPicked = async () => {
        if (!selectedOrder) return;
        triggerHaptic('success');
        try {
            await axios.patch(`/api/orders/${selectedOrder.id}/status`, { status: 'Completed' });
            setToast({ message: `Đã soạn xong đơn #${selectedOrder.display_id || selectedOrder.id}`, type: 'success' });
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Completed' } : o));
            setTimeout(() => setToast(null), 2000);
            setSelectedOrder(null);
        } catch (err) {
            setToast({ message: 'Lỗi cập nhật trạng thái', type: 'error' });
        }
    };

    return (
        <div className="p-3 space-y-3 no-print font-sans pb-6">
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Filter Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3 flex items-center justify-between gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex-1">
                    {[
                        { id: 'Pending', label: 'Đang chờ soạn' },
                        { id: 'Completed', label: 'Đã hoàn thành' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => {
                                triggerHaptic('light');
                                setFilterStatus(f.id);
                            }}
                            className={cn(
                                "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all android-touchable",
                                filterStatus === f.id
                                    ? "bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-2.5">
                {loading && orders.length === 0 && (
                    <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase animate-pulse">Đang tải danh sách đơn...</div>
                )}

                {!loading && filteredOrders.length === 0 && (
                    <div className="text-center py-14 text-slate-400 font-medium space-y-2">
                        <Layers size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
                        <p className="text-sm">Không có đơn hàng nào trong trạng thái này</p>
                    </div>
                )}

                {paginatedOrders.map(order => (
                    <m.div
                        key={order.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            triggerHaptic('light');
                            setSelectedOrder(order);
                        }}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col gap-2 cursor-pointer android-touchable"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                    #{order.display_id || order.id}
                                </span>
                                <div className="text-xs font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Clock size={13} className="text-emerald-500" />
                                    {new Date(order.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                                    {formatNumber(order.total_amount)}đ
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                    {order.payment_method}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                                <User size={14} className="text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                    {order.partner_name || 'Khách lẻ'}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-primary dark:text-emerald-400 flex items-center gap-1">
                                Chi tiết <ArrowRight size={14} />
                            </span>
                        </div>
                    </m.div>
                ))}

                {filteredOrders.length > paginatedOrders.length && (
                    <button
                        onClick={() => setDisplayLimit(prev => prev + 25)}
                        className="w-full py-3 my-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-primary dark:text-emerald-400 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Tải thêm ({paginatedOrders.length}/{filteredOrders.length} đơn hàng)</span>
                    </button>
                )}
            </div>

            {/* Order Detail Bottom Sheet Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm android-webview">
                        <m.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                            className="bg-white dark:bg-slate-900 rounded-t-[28px] max-h-[90dvh] flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-area-pb"
                        >
                            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <div className="text-center font-bold text-sm text-slate-900 dark:text-slate-100">
                                    Đơn #{selectedOrder.display_id || selectedOrder.id}
                                </div>
                                <div className="w-8"></div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {(selectedOrder.details || []).map((detail, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                        <div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{detail.product_name}</div>
                                            <div className="text-xs text-slate-500 font-medium">{formatNumber(detail.price)}đ x {detail.quantity}</div>
                                        </div>
                                        <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                            {formatNumber(detail.price * detail.quantity)}đ
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedOrder.status !== 'Completed' && (
                                <div className="p-4 border-t border-slate-200/80 dark:border-slate-800">
                                    <button
                                        onClick={handleMarkAsPicked}
                                        className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-900/20 active:scale-98 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} strokeWidth={3} />
                                        <span>Đã Soạn Xong Đơn Hàng</span>
                                    </button>
                                </div>
                            )}
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Container */}
            <AnimatePresence>
                {toast && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.8, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.8, y: -20, x: '-50%' }}
                        className={cn(
                            "fixed top-24 left-1/2 px-6 py-2.5 rounded-full shadow-2xl z-[110] font-bold text-xs flex items-center gap-2",
                            toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                        )}
                    >
                        <Check size={16} strokeWidth={4} />
                        <span>{toast.message}</span>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
