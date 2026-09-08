import React, { useState, useEffect, useMemo } from 'react';
import Portal from './Portal';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Warehouse, X, Calendar, ChevronRight, Package, Check, ArrowDownToLine, RefreshCw, Plus, Minus, CheckCircle, ChevronDown, ChevronUp, Search, Eye, Layers } from 'lucide-react';
import { formatDate, formatNumber, removeAccents } from '../lib/utils';
import { cn } from '../lib/utils';

export default function ConsignmentPanel({ isOpen, onClose, onImportSuccess, partnerId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [expandedOrderIds, setExpandedOrderIds] = useState({});
    const [importQuantities, setImportQuantities] = useState({}); // {order_detail_id: quantity_string}
    const [productImportQuantities, setProductImportQuantities] = useState({}); // {product_id: quantity_string}
    const [activeTab, setActiveTab] = useState('pending'); // pending, completed
    const [viewMode, setViewMode] = useState('products'); // products, orders
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchConsignments();
            setImportQuantities({});
            setProductImportQuantities({});
            setSearchTerm('');
        }
    }, [isOpen, partnerId]);

    const fetchConsignments = async () => {
        setLoading(true);
        try {
            let url = '/api/orders?type=Purchase&is_consignment=true&limit=200';
            if (partnerId) {
                url += `&partner_id=${partnerId}`;
            }
            const res = await axios.get(url);
            const allItems = res.data.items || res.data || [];
            setOrders(allItems);
        } catch (err) {
            console.error("Error loading consignment orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrderIds(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    // Order View Quantity handlers
    const handleQuantityChange = (detailId, val, maxVal) => {
        if (val === '') {
            setImportQuantities(prev => ({ ...prev, [detailId]: '' }));
            return;
        }
        const num = parseFloat(val);
        if (isNaN(num)) return;
        const clamped = Math.max(0, Math.min(maxVal, num));
        setImportQuantities(prev => ({ ...prev, [detailId]: clamped.toString() }));
    };

    const adjustQuantity = (detailId, currentVal, delta, maxVal) => {
        const baseVal = currentVal === '' ? 0 : parseFloat(currentVal);
        const newVal = Math.max(0, Math.min(maxVal, baseVal + delta));
        setImportQuantities(prev => ({ ...prev, [detailId]: newVal.toString() }));
    };

    const setFullQuantity = (detailId, maxVal) => {
        setImportQuantities(prev => ({ ...prev, [detailId]: maxVal.toString() }));
    };

    // Product View Quantity handlers
    const handleProductQuantityChange = (productId, val, maxVal) => {
        if (val === '') {
            setProductImportQuantities(prev => ({ ...prev, [productId]: '' }));
            return;
        }
        const num = parseFloat(val);
        if (isNaN(num)) return;
        const clamped = Math.max(0, Math.min(maxVal, num));
        setProductImportQuantities(prev => ({ ...prev, [productId]: clamped.toString() }));
    };

    const adjustProductQuantity = (productId, currentVal, delta, maxVal) => {
        const baseVal = currentVal === '' ? 0 : parseFloat(currentVal);
        const newVal = Math.max(0, Math.min(maxVal, baseVal + delta));
        setProductImportQuantities(prev => ({ ...prev, [productId]: newVal.toString() }));
    };

    const setFullProductQuantity = (productId, maxVal) => {
        setProductImportQuantities(prev => ({ ...prev, [productId]: maxVal.toString() }));
    };

    // Order level actions
    const handleSingleImportSubmit = async (order, detail) => {
        const inputVal = importQuantities[detail.id];
        const qty = inputVal !== undefined && inputVal !== '' ? parseFloat(inputVal) : 0;
        if (qty <= 0) {
            alert("Vui lòng nhập số lượng nhận lớn hơn 0.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post(`/api/orders/${order.id}/import-consignment`, {
                details: [{
                    product_id: detail.product_id,
                    quantity: qty
                }]
            });
            
            setImportQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[detail.id];
                return newQuantities;
            });
            
            await fetchConsignments();
            
            if (onImportSuccess) {
                onImportSuccess(res.data.message || `Đã nhận kho ${qty} ${detail.product_unit || detail.unit || ''} thành công!`);
            }
        } catch (err) {
            console.error("Error submitting consignment import:", err);
            alert(err.response?.data?.error || "Có lỗi xảy ra khi nhập hàng từ kho gửi.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleImportSubmit = async (order) => {
        const detailsToImport = order.details
            .map(d => {
                const inputVal = importQuantities[d.id];
                const qty = inputVal !== undefined && inputVal !== '' ? parseFloat(inputVal) : 0;
                return {
                    product_id: d.product_id,
                    quantity: qty
                };
            })
            .filter(item => item.quantity > 0);

        if (detailsToImport.length === 0) {
            alert("Vui lòng nhập số lượng nhận cho ít nhất một sản phẩm.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post(`/api/orders/${order.id}/import-consignment`, {
                details: detailsToImport
            });
            
            const newQuantities = { ...importQuantities };
            order.details.forEach(d => {
                delete newQuantities[d.id];
            });
            setImportQuantities(newQuantities);
            
            await fetchConsignments();
            
            if (onImportSuccess) {
                onImportSuccess(res.data.message || "Nhập kho thành công!");
            }
        } catch (err) {
            console.error("Error submitting consignment import:", err);
            alert(err.response?.data?.error || "Có lỗi xảy ra khi nhập hàng từ kho gửi.");
        } finally {
            setSubmitting(false);
        }
    };

    // Product level actions - FIFO auto-allocation
    const handleProductImportSubmit = async (summaryItem) => {
        const inputVal = productImportQuantities[summaryItem.productId];
        const qty = inputVal !== undefined && inputVal !== '' ? parseFloat(inputVal) : 0;
        if (qty <= 0) {
            alert("Vui lòng nhập số lượng nhận lớn hơn 0.");
            return;
        }

        setSubmitting(true);
        let remainingToImport = qty;
        const successMessages = [];

        try {
            // Allocate FIFO across orders
            for (const detail of summaryItem.matchingDetails) {
                if (remainingToImport <= 0) break;

                const take = Math.min(remainingToImport, detail.remaining);
                if (take <= 0) continue;

                await axios.post(`/api/orders/${detail.orderId}/import-consignment`, {
                    details: [{
                        product_id: summaryItem.productId,
                        quantity: take
                    }]
                });

                remainingToImport -= take;
                successMessages.push(`Nhận ${take} ${summaryItem.unit} (Đơn #${detail.displayId})`);
            }

            setProductImportQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[summaryItem.productId];
                return newQuantities;
            });

            await fetchConsignments();

            if (onImportSuccess) {
                onImportSuccess(
                    `Đã nhận thành công tổng cộng ${qty} ${summaryItem.unit} sản phẩm ${summaryItem.name}!\n` +
                    successMessages.join('\n')
                );
            }
        } catch (err) {
            console.error("Error processing FIFO product import:", err);
            alert(err.response?.data?.error || "Có lỗi xảy ra khi nhập hàng.");
        } finally {
            setSubmitting(false);
        }
    };

    // Compute Product Summaries (FIFO queues)
    const productSummary = useMemo(() => {
        const summary = {};
        orders.forEach(order => {
            order.details.forEach(d => {
                const remaining = d.quantity - (d.shipped_quantity || 0);
                const isCompleted = remaining <= 0;
                
                // Filter based on active tab
                if (activeTab === 'pending' && isCompleted) return;
                if (activeTab === 'completed' && !isCompleted) return;

                if (!summary[d.product_id]) {
                    summary[d.product_id] = {
                        productId: d.product_id,
                        name: d.product_name,
                        unit: d.product_unit || d.unit || 'ĐV',
                        price: d.price,
                        totalConsigned: 0,
                        totalShipped: 0,
                        totalRemaining: 0,
                        matchingDetails: []
                    };
                }
                summary[d.product_id].totalConsigned += d.quantity;
                summary[d.product_id].totalShipped += (d.shipped_quantity || 0);
                summary[d.product_id].totalRemaining += remaining;
                summary[d.product_id].matchingDetails.push({
                    orderId: order.id,
                    displayId: order.display_id || order.id,
                    orderDate: order.date,
                    detailId: d.id,
                    remaining: remaining
                });
            });
        });

        // Sort details chronologically (oldest first for FIFO)
        Object.values(summary).forEach(item => {
            item.matchingDetails.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        });

        return Object.values(summary);
    }, [orders, activeTab]);

    // Filters for Order View
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const isFullyShipped = order.details.every(d => (d.quantity - (d.shipped_quantity || 0)) <= 0);
            const matchesTab = activeTab === 'completed' ? isFullyShipped : !isFullyShipped;
            if (!matchesTab) return false;

            if (searchTerm.trim() !== '') {
                const term = removeAccents(searchTerm.toLowerCase());
                const displayId = (order.display_id || order.id || '').toString().toLowerCase();
                const partnerName = removeAccents((order.partner_name || '').toLowerCase());
                const matchesOrder = displayId.includes(term) || partnerName.includes(term);
                const matchesProduct = order.details.some(d => 
                    removeAccents((d.product_name || '').toLowerCase()).includes(term)
                );
                return matchesOrder || matchesProduct;
            }

            return true;
        });
    }, [orders, activeTab, searchTerm]);

    // Filters for Product View
    const filteredProducts = useMemo(() => {
        if (searchTerm.trim() === '') return productSummary;
        const term = removeAccents(searchTerm.toLowerCase());
        return productSummary.filter(item => 
            removeAccents(item.name.toLowerCase()).includes(term)
        );
    }, [productSummary, searchTerm]);

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
                        className="absolute inset-0 bg-slate-950/40 dark:bg-black/60"
                    />
                    
                    <m.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 220 }}
                        className="relative w-[520px] h-full bg-card shadow-2xl flex flex-col border-l border-border"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-border bg-card flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                    <Warehouse size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground uppercase tracking-wide leading-tight">Hàng gửi kho NCC</h3>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Theo dõi & Nhập kho sỉ lẻ</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchConsignments}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors z-10"
                                    title="Tải lại"
                                >
                                    <RefreshCw size={14} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors z-10"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Top controls: Tab Filter & View Mode */}
                        <div className="p-4 pb-3 space-y-3 bg-card/50 border-b border-border">
                            {/* View Mode Toggle: Products vs Orders */}
                            <div className="flex bg-background border border-border p-1 rounded-xl">
                                <button
                                    onClick={() => { setViewMode('products'); setSearchTerm(''); }}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                        viewMode === 'products'
                                            ? "bg-card text-foreground shadow-sm border border-border/50"
                                            : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                                    )}
                                >
                                    <Layers size={13} /> Tổng hợp sản phẩm
                                </button>
                                <button
                                    onClick={() => { setViewMode('orders'); setSearchTerm(''); }}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                        viewMode === 'orders'
                                            ? "bg-card text-foreground shadow-sm border border-border/50"
                                            : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                                    )}
                                >
                                    <Eye size={13} /> Chi tiết theo đơn
                                </button>
                            </div>

                            {/* Status Tab Toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={cn(
                                        "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm",
                                        activeTab === 'pending'
                                            ? "bg-amber-600 text-white border-amber-600 shadow-amber-600/25"
                                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                                    )}
                                >
                                    <Warehouse size={13} /> Đang chờ nhập
                                </button>
                                <button
                                    onClick={() => setActiveTab('completed')}
                                    className={cn(
                                        "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm",
                                        activeTab === 'completed'
                                            ? "bg-amber-600 text-white border-amber-600 shadow-amber-600/25"
                                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                                    )}
                                >
                                    <Check size={13} /> Đã nhận hết
                                </button>
                            </div>

                            {/* Search Filter */}
                            <div className="relative group">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-amber-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={viewMode === 'products' ? "Tìm tên sản phẩm gửi kho..." : "Tìm tên sản phẩm hoặc mã đơn hàng..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 dark:text-white transition-all font-semibold"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors w-6 h-6 flex items-center justify-center rounded-md hover:bg-destructive/10"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-background/50">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32 opacity-55">
                                    <div className="w-9 h-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Đang nạp hàng ký gửi...</span>
                                </div>
                            ) : (viewMode === 'products' ? filteredProducts : filteredOrders).length === 0 ? (
                                <div className="text-center py-32 text-gray-300 dark:text-slate-700">
                                    <Warehouse size={56} className="mx-auto mb-4 opacity-15 text-amber-500" />
                                    <p className="font-black uppercase text-xs tracking-widest">Không tìm thấy hàng gửi kho</p>
                                </div>
                            ) : viewMode === 'products' ? (
                                /* View Mode 1: Product Summary View */
                                filteredProducts.map((item, idx) => {
                                    const currentInput = productImportQuantities[item.productId] || '';
                                    const currentNum = currentInput === '' ? 0 : parseFloat(currentInput);

                                    return (
                                        <m.div
                                            key={item.productId}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col gap-3 group relative"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20 mr-2 shrink-0">
                                                        Sản phẩm
                                                    </span>
                                                    <h4 className="text-sm font-bold text-foreground uppercase mt-2 leading-tight truncate">
                                                        {item.name}
                                                    </h4>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] font-mono text-muted-foreground font-bold block">Đơn giá nhập</span>
                                                    <span className="text-xs font-bold text-foreground">{formatNumber(item.price)}đ</span>
                                                </div>
                                            </div>

                                            {/* Quantity metrics breakdown */}
                                            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-muted-foreground bg-background/50 p-2.5 rounded-xl border border-border/50">
                                                <div className="text-center border-r border-border/50">
                                                    <span className="text-muted-foreground/70 block text-[9px] uppercase tracking-wider mb-0.5">Tổng gửi</span>
                                                    <span className="text-foreground font-bold text-xs">{item.totalConsigned} {item.unit}</span>
                                                </div>
                                                <div className="text-center border-r border-border/50">
                                                    <span className="text-muted-foreground/70 block text-[9px] uppercase tracking-wider mb-0.5">Đã lấy</span>
                                                    <span className="text-emerald-500 font-bold text-xs">{item.totalShipped} {item.unit}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-muted-foreground/70 block text-[9px] uppercase tracking-wider mb-0.5">Còn lại</span>
                                                    <span className="text-amber-500 font-bold text-xs">{item.totalRemaining} {item.unit}</span>
                                                </div>
                                            </div>

                                            {/* Controls for quick FIFO import */}
                                            {item.totalRemaining > 0 && activeTab === 'pending' && (
                                                <div className="flex justify-between items-center gap-3 pt-1">
                                                    <div>
                                                        <button
                                                            onClick={() => setFullProductQuantity(item.productId, item.totalRemaining)}
                                                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase rounded-lg border border-amber-200/40 transition-all"
                                                        >
                                                            Nhận Hết ({item.totalRemaining})
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Qty incrementors */}
                                                        <div className="flex items-center bg-transparent border dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                                                            <button
                                                                onClick={() => adjustProductQuantity(item.productId, currentInput, -1, item.totalRemaining)}
                                                                className="p-1.5 hover:bg-transparent dark:hover:bg-slate-800 text-gray-500 transition-colors"
                                                            >
                                                                <Minus size={12} strokeWidth={2.5} />
                                                            </button>
                                                            <input
                                                                type="text"
                                                                placeholder="0"
                                                                value={currentInput}
                                                                onChange={(e) => handleProductQuantityChange(item.productId, e.target.value, item.totalRemaining)}
                                                                className="w-14 text-center font-black text-xs focus:outline-none bg-transparent dark:text-white"
                                                            />
                                                            <button
                                                                onClick={() => adjustProductQuantity(item.productId, currentInput, 1, item.totalRemaining)}
                                                                className="p-1.5 hover:bg-transparent dark:hover:bg-slate-800 text-gray-500 transition-colors"
                                                            >
                                                                <Plus size={12} strokeWidth={2.5} />
                                                            </button>
                                                        </div>

                                                        {/* Submit trigger */}
                                                        <button
                                                            disabled={currentNum <= 0 || submitting}
                                                            onClick={() => handleProductImportSubmit(item)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 shadow-sm text-[10px] font-black uppercase",
                                                                currentNum > 0
                                                                    ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                                                                    : "bg-transparent border-transparent text-gray-400 cursor-not-allowed"
                                                            )}
                                                        >
                                                            <ArrowDownToLine size={13} strokeWidth={2.5} />
                                                            Nhận
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* FIFO Queue details hover indicator */}
                                            {item.matchingDetails.length > 1 && (
                                                <div className="text-[8px] text-gray-400 font-bold tracking-tight italic mt-0.5">
                                                    Phân bổ FIFO tự động qua {item.matchingDetails.length} đơn gửi kho khác nhau.
                                                </div>
                                            )}
                                        </m.div>
                                    );
                                })
                            ) : (
                                /* View Mode 2: Classical Order Detail View */
                                filteredOrders.map((order, idx) => {
                                    const isExpanded = !!expandedOrderIds[order.id];
                                    
                                    let totalOrdered = 0;
                                    let totalShipped = 0;
                                    order.details.forEach(d => {
                                        totalOrdered += d.quantity;
                                        totalShipped += d.shipped_quantity || 0;
                                    });
                                    const progressPercent = totalOrdered > 0 ? Math.round((totalShipped / totalOrdered) * 100) : 0;

                                    return (
                                        <m.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col group relative"
                                        >
                                            <div 
                                                className="flex justify-between items-start cursor-pointer select-none"
                                                onClick={() => toggleOrderExpansion(order.id)}
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-500/20">#{order.display_id || order.id}</span>
                                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                            {progressPercent}% Đã nhận
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-bold text-foreground uppercase truncate">
                                                        {order.partner_name || "Nhà cung cấp ẩn danh"}
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Calendar size={10} /> {formatDate(order.date)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-right">
                                                        <div className="font-bold text-base text-foreground">{formatNumber(order.total_amount)}</div>
                                                        <div className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">{order.payment_method === 'Debt' ? 'Công nợ' : 'Tiền mặt'}</div>
                                                    </div>
                                                    <div className="text-muted-foreground/50 group-hover:text-amber-500 transition-colors">
                                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-background border border-border/50 h-2 rounded-full overflow-hidden mt-4 mb-2">
                                                <div 
                                                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500 shadow-sm" 
                                                    style={{ width: `${progressPercent}%` }} 
                                                />
                                            </div>

                                            {/* Expanded details & Inputs */}
                                            {isExpanded && (
                                                <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-slate-800 space-y-3">
                                                    <div className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Chi tiết sản phẩm gửi kho:</div>
                                                    
                                                    <div className="space-y-3">
                                                        {order.details.map((detail) => {
                                                            const maxVal = detail.quantity - (detail.shipped_quantity || 0);
                                                            const currentInput = importQuantities[detail.id] || '';
                                                            const currentNum = currentInput === '' ? 0 : parseFloat(currentInput);
                                                            const unitStr = detail.product_unit || detail.unit || 'ĐV';
                                                            
                                                            return (
                                                                <div 
                                                                    key={detail.id} 
                                                                    className="flex flex-col bg-transparent/50 dark:bg-slate-900/30 p-3 rounded-xl border border-gray-100 dark:border-slate-800"
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase leading-tight truncate max-w-[320px]" title={detail.product_name}>
                                                                            {detail.product_name}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold shrink-0">
                                                                            Giá: {formatNumber(detail.price)}đ
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-transparent p-2 rounded-lg mb-2">
                                                                        <div className="text-center border-r dark:border-slate-800">
                                                                            Tổng ký gửi: <span className="text-gray-800 dark:text-gray-200 font-black">{detail.quantity} {unitStr}</span>
                                                                        </div>
                                                                        <div className="text-center border-r dark:border-slate-800">
                                                                            Đã lấy: <span className="text-emerald-600 font-black">{detail.shipped_quantity || 0} {unitStr}</span>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            Còn lại: <span className="text-rose-500 font-black">{maxVal} {unitStr}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex justify-between items-center gap-3">
                                                                        <div className="text-[9px] font-bold text-gray-400">
                                                                            {maxVal > 0 && activeTab === 'pending' && (
                                                                                <button
                                                                                    onClick={() => setFullQuantity(detail.id, maxVal)}
                                                                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase rounded-lg border border-amber-200/40 transition-all"
                                                                                >
                                                                                    Chọn Hết ({maxVal})
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        {maxVal > 0 && activeTab === 'pending' && (
                                                                            <div className="flex items-center gap-2 shrink-0">
                                                                                <div className="flex items-center bg-transparent border dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                                                                                    <button
                                                                                        onClick={() => adjustQuantity(detail.id, currentInput, -1, maxVal)}
                                                                                        className="p-1.5 hover:bg-transparent dark:hover:bg-slate-800 text-gray-500 transition-colors"
                                                                                    >
                                                                                        <Minus size={12} strokeWidth={2.5} />
                                                                                    </button>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="0"
                                                                                        value={currentInput}
                                                                                        onChange={(e) => handleQuantityChange(detail.id, e.target.value, maxVal)}
                                                                                        className="w-14 text-center font-black text-xs focus:outline-none bg-transparent dark:text-white"
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => adjustQuantity(detail.id, currentInput, 1, maxVal)}
                                                                                        className="p-1.5 hover:bg-transparent dark:hover:bg-slate-800 text-gray-500 transition-colors"
                                                                                    >
                                                                                        <Plus size={12} strokeWidth={2.5} />
                                                                                    </button>
                                                                                </div>

                                                                                <button
                                                                                    disabled={currentNum <= 0 || submitting}
                                                                                    onClick={() => handleSingleImportSubmit(order, detail)}
                                                                                    className={cn(
                                                                                        "p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 shadow-sm text-[10px] font-black uppercase",
                                                                                        currentNum > 0
                                                                                            ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                                                                                            : "bg-transparent border-transparent text-gray-400 cursor-not-allowed"
                                                                                    )}
                                                                                >
                                                                                    <ArrowDownToLine size={13} strokeWidth={2.5} />
                                                                                    Nhận Lẻ
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {activeTab === 'pending' && (
                                                        <m.button
                                                            whileTap={{ scale: 0.98 }}
                                                            disabled={submitting}
                                                            onClick={() => handleImportSubmit(order)}
                                                            className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-900/10 flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50"
                                                        >
                                                            {submitting ? (
                                                                <>
                                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    Đang cập nhật kho...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle size={14} strokeWidth={2.5} />
                                                                    Nhập Toàn Bộ Đã Chọn
                                                                </>
                                                            )}
                                                        </m.button>
                                                    )}
                                                </div>
                                            )}

                                            {!isExpanded && (
                                                <div className="text-[9px] text-amber-600 dark:text-amber-500/70 font-bold italic text-right mt-1 opacity-60 group-hover:opacity-100 transition-all pointer-events-none">
                                                    Nhấn để chi tiết hàng gửi & nhận kho
                                                </div>
                                            )}
                                        </m.div>
                                    );
                                })
                            )}
                        </div>

                    </m.div>
                </div>
            )}
        </AnimatePresence>
        </Portal>
    );
}
