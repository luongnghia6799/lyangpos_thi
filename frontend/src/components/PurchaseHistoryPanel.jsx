import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { History, ShoppingBag, Clock, X, ChevronRight, Package, Calendar, Eye, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber } from '../lib/utils';
import { cn } from '../lib/utils';

export default function PurchaseHistoryPanel({ partner, isOpen, onClose, onAddToCart, onViewOrder, onEditOrder, onDeleteOrder }) {
    const [orders, setOrders] = useState([]);
    const [boughtProducts, setBoughtProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('invoices'); // invoices, products
    const [onlyConsignment, setOnlyConsignment] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isOpen && partner) {
            setOrders([]);
            setPage(1);
            setHasMore(true);
            fetchHistory(1, onlyConsignment);
        }
    }, [isOpen, partner, onlyConsignment]);

    const fetchHistory = async (pageToFetch = 1, isConsignmentFilter = onlyConsignment) => {
        setLoading(true);
        try {
            const limit = 20;
            let url = `/api/orders?partner_id=${partner.id}&limit=${limit}&page=${pageToFetch}&type=Purchase`;
            if (isConsignmentFilter) {
                url += '&is_consignment=true';
            }
            const res = await axios.get(url);
            const newItems = res.data.items || res.data || [];

            setOrders(prev => pageToFetch === 1 ? newItems : [...prev, ...newItems]);

            if (newItems.length < limit) {
                setHasMore(false);
            }

            // Extract unique products (run only on first page or merge carefully)
            if (pageToFetch === 1) {
                const productMap = {};
                newItems.forEach(order => {
                    order.details && order.details.forEach(detail => {
                        if (!productMap[detail.product_id]) {
                            productMap[detail.product_id] = {
                                id: detail.product_id,
                                name: detail.product_name,
                                unit: detail.product_unit,
                                price: detail.price,
                                total_qty: 0,
                                last_price: detail.price,
                                last_date: order.date,
                                multiplier: detail.multiplier,
                                secondary_unit: detail.secondary_unit,
                                stock: detail.stock
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
            console.error("Error fetching Purchase history:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage, onlyConsignment);
    };

    const [expandedOrders, setExpandedOrders] = useState({}); // {orderId: boolean}

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[5000] flex justify-end font-sans">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                    />
                    <m.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-[400px] h-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col border-l border-[#d4a574]/30"
                    >
                        {/* Header */}
                        <div className="p-6 border-b dark:border-slate-800 bg-gradient-to-r from-[#d4a574]/10 to-transparent flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#d4a574]/20 rounded-xl text-[#d4a574]">
                                    <History size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-gray-800 dark:text-gray-100 uppercase tracking-tighter leading-none">Lịch sử nhập hàng</h3>
                                    <p className="text-[10px] font-bold text-[#d4a574]/80 uppercase tracking-widest mt-1">{partner.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-4 gap-2">
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    activeTab === 'invoices'
                                        ? "bg-[#d4a574] text-white shadow-lg shadow-[#d4a574]/20"
                                        : "bg-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
                                )}
                            >
                                <Clock size={16} /> Phiếu nhập
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    activeTab === 'products'
                                        ? "bg-[#d4a574] text-white shadow-lg shadow-[#d4a574]/20"
                                        : "bg-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
                                )}
                            >
                                <ShoppingBag size={16} /> Sản phẩm
                            </button>
                        </div>

                        {activeTab === 'invoices' && (
                            <div className="px-6 pb-2 flex justify-end">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <input 
                                        type="checkbox" 
                                        checked={onlyConsignment} 
                                        onChange={e => setOnlyConsignment(e.target.checked)}
                                        className="rounded border-[#d4a574]/40 text-[#d4a574] focus:ring-[#d4a574]"
                                    />
                                    <span>Chỉ hiện đơn gửi kho</span>
                                </label>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                    <div className="w-8 h-8 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin mb-4" />
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Đang tải...</span>
                                </div>
                            ) : activeTab === 'invoices' ? (
                                orders.length === 0 ? (
                                    <div className="text-center py-20 text-gray-300 dark:text-slate-700">
                                        <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-black uppercase text-xs tracking-widest">Chưa có phiếu nhập nào</p>
                                    </div>
                                ) : (
                                    <>
                                        {orders.map((order, idx) => {
                                            const isExpanded = expandedOrders[order.id];
                                            const displayedDetails = isExpanded ? (order.details || []) : (order.details || []).slice(0, 3);

                                            // Parse note for logs and clean note
                                            const lines = (order.note || '').split('\n');
                                            const logs = [];
                                            const cleanLines = [];
                                            const logPattern = /^-?\s*\[([\d/]+\s+[\d:]+)\]\s*(.*)$/;
                                            lines.forEach(line => {
                                                const match = line.match(logPattern);
                                                if (match) {
                                                    logs.push({
                                                        timestamp: match[1],
                                                        content: match[2]
                                                    });
                                                } else {
                                                    cleanLines.push(line);
                                                }
                                            });
                                            const cleanNote = cleanLines.join('\n').trim();

                                            return (
                                                <m.div
                                                    key={order.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="bg-transparent p-4 rounded-2xl border border-transparent hover:border-[#d4a574]/20 transition-all group cursor-pointer hover:shadow-md relative overflow-hidden"
                                                    onClick={() => onViewOrder && onViewOrder(order)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className="p-1.5 bg-[#d4a574]/10 text-[#d4a574] rounded-lg group-hover:bg-[#d4a574] group-hover:text-white transition-all shrink-0">
                                                                <Eye size={14} fill="currentColor" className="fill-transparent" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-black text-[#d4a574] uppercase truncate">#{order.display_id || order.id}</div>
                                                                <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                                                                    <Calendar size={10} /> {formatDate(order.date)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right shrink-0">
                                                                <div className="font-black text-gray-800 dark:text-gray-100">{formatNumber(order.total_amount)}</div>
                                                                <div className="flex gap-1 justify-end mt-1">
                                                                    {order.is_consignment && (
                                                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30">
                                                                            Gửi kho
                                                                        </span>
                                                                    )}
                                                                    <div className={cn(
                                                                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit",
                                                                        order.payment_method === 'Debt' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                                                    )}>
                                                                        {order.payment_method === 'Debt' ? 'Ghi nợ' : 'Tiền mặt'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Action Buttons */}
                                                            <div className="flex flex-col gap-1 transition-all duration-300 opacity-0 scale-90 translate-x-3 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 w-0 group-hover:w-auto overflow-hidden">
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        onEditOrder && onEditOrder(order); 
                                                                    }} 
                                                                    className="p-1.5 bg-[#d4a574]/10 hover:bg-[#d4a574] text-[#d4a574] hover:text-white rounded-md transition-all shadow-sm"
                                                                    title="Sửa phiếu"
                                                                >
                                                                    <Edit size={12} strokeWidth={3} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        toggleOrderExpansion(order.id); 
                                                                    }} 
                                                                    className="p-1.5 bg-transparent dark:bg-slate-700 hover:bg-[#d4a574] text-slate-500 hover:text-white rounded-md transition-all shadow-sm"
                                                                    title={isExpanded ? "Thu gọn" : "Xem nhanh ghi chú"}
                                                                >
                                                                    {isExpanded ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl">
                                                        {displayedDetails.map((d, i) => (
                                                            <div key={i} className="text-[10px] flex justify-between text-gray-600 dark:text-gray-400">
                                                                <span className="truncate flex-1 pr-2 uppercase font-bold">• {d.product_name}</span>
                                                                <span className="font-black">x{formatNumber(d.quantity)}</span>
                                                            </div>
                                                        ))}
                                                        {order.details && order.details.length > 3 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleOrderExpansion(order.id);
                                                                }}
                                                                className="text-[9px] text-[#d4a574] font-bold italic w-full text-left pt-1"
                                                            >
                                                                {isExpanded ? "Thu gọn" : `... và ${order.details.length - 3} sản phẩm khác`}
                                                            </button>
                                                        )}

                                                        {isExpanded && cleanNote && (
                                                            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                                                                <span className="font-black uppercase tracking-wider block text-[8px] text-slate-400">Ghi chú:</span>
                                                                {cleanNote}
                                                            </div>
                                                        )}

                                                        {isExpanded && logs.length > 0 && (
                                                            <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800 space-y-1">
                                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <Clock size={8} className="text-amber-500" /> Nhật ký nhận hàng gửi kho:
                                                                </div>
                                                                <div className="space-y-1.5 pl-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                                                                    {logs.map((log, lidx) => (
                                                                        <div key={lidx} className="flex gap-2 text-[9px] relative">
                                                                            {lidx !== logs.length - 1 && (
                                                                                <div className="absolute left-[4px] top-3 bottom-[-8px] w-[1px] bg-amber-100 dark:bg-amber-900/30" />
                                                                            )}
                                                                            <div className="w-2 h-2 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                                                                <div className="w-1 h-1 bg-amber-500 rounded-full" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <span className="font-bold text-gray-700 dark:text-gray-300 break-words leading-tight">{log.content}</span>
                                                                                <span className="text-[8px] text-gray-400 block mt-0.5">{log.timestamp}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </m.div>
                                            );
                                        })}

                                        {hasMore && (
                                            <button
                                                onClick={loadMore}
                                                disabled={loading}
                                                className="w-full py-3 rounded-xl border border-dashed border-[#d4a574]/30 text-[#d4a574] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#d4a574]/5 transition-all disabled:opacity-50"
                                            >
                                                {loading ? "Đang tải..." : "Xem thêm giao dịch"}
                                            </button>
                                        )}
                                    </>
                                )
                            ) : (
                                boughtProducts.length === 0 ? (
                                    <div className="text-center py-20 text-gray-300 dark:text-slate-700">
                                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-black uppercase text-xs tracking-widest">Chưa nhập sản phẩm nào</p>
                                    </div>
                                ) : (
                                    boughtProducts.map((p, idx) => (
                                        <m.div
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-transparent p-4 rounded-2xl border border-transparent hover:border-[#d4a574]/20 transition-all group flex items-center justify-between"
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="font-black text-xs text-gray-800 dark:text-gray-100 uppercase truncate" title={p.name}>{p.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black text-[#d4a574] tabular-nums">Đã nhập: {formatNumber(p.total_qty)} {p.unit}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span className="text-[10px] font-bold text-gray-400">Giá nhập cuois: {formatNumber(p.last_price)}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onAddToCart(p)}
                                                className="w-10 h-10 bg-white dark:bg-slate-700 text-[#d4a574] hover:bg-[#d4a574] hover:text-white rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-90"
                                                title="Thêm vào phiếu nhập"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </m.div>
                                    ))
                                )
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-6 bg-transparent border-t dark:border-slate-800">
                            <div className="bg-[#d4a574]/5 rounded-2xl p-4 border border-[#d4a574]/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng nợ hiện tại</span>
                                    {partner.debt_balance !== 0 && (
                                        <span className="p-1 px-2 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase">Đang nợ</span>
                                    )}
                                </div>
                                <div className="text-2xl font-black text-rose-500 tracking-tighter tabular-nums">
                                    {formatNumber(partner.debt_balance)} <span className="text-xs">VNĐ</span>
                                </div>
                            </div>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}
