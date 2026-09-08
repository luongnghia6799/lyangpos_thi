import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check, DollarSign } from 'lucide-react';
import { cn, formatNumber, playErrorSound, playSuccessSound } from '../lib/utils';
import Portal from './Portal';
import axios from 'axios';

export default function PriceRaiseModal({
    isOpen,
    items = [], // Array of { productId, productName, unit, costPrice, currentSalePrice }
    onSuccess,
    onClose,
    queryClient
}) {
    const [priceData, setPriceData] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && items.length > 0) {
            playErrorSound();
            const initialData = items.map(item => ({
                ...item,
                newSalePrice: item.currentSalePrice || item.costPrice || 0
            }));
            setPriceData(initialData);
            setSelectedIds(new Set(items.map(i => i.productId)));
        }
    }, [isOpen, items]);

    const handlePriceChange = (productId, val) => {
        setPriceData(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, newSalePrice: val };
            }
            return item;
        }));
    };

    const toggleSelect = (productId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    };

    const handleConfirm = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const itemsToUpdate = priceData.filter(i => selectedIds.has(i.productId) && i.newSalePrice > 0);
            
            for (const item of itemsToUpdate) {
                if (item.productId) {
                    await axios.put(`/api/products/${item.productId}`, {
                        sale_price: item.newSalePrice
                    });
                }
            }

            if (queryClient) {
                await queryClient.invalidateQueries({ queryKey: ['products'] });
            }

            // Sync BroadcastChannel
            try {
                const syncChan = new BroadcastChannel('pos_data_sync');
                syncChan.postMessage({ type: 'PRODUCTS_UPDATED' });
                syncChan.close();
            } catch (e) {
                console.error("Broadcast error:", e);
            }

            playSuccessSound();
            if (onSuccess) onSuccess(itemsToUpdate);
            onClose();
        } catch (err) {
            console.error("Error updating sale prices:", err);
            alert("Có lỗi xảy ra khi cập nhật giá bán. Vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || items.length === 0) return null;

    return (
        <Portal>
            <AnimatePresence>
                <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 cursor-pointer"
                    />

                    <m.div
                        initial={{ scale: 0.94, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 text-slate-800 dark:text-white"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                                    <AlertTriangle size={22} className="stroke-[2.5]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        Cảnh báo: Giá nhập cao hơn Giá bán!
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                        Có <span className="font-bold text-amber-600 dark:text-amber-400">{priceData.length}</span> sản phẩm có giá nhập cao hơn giá bán. Bạn có muốn nâng giá không?
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Product List */}
                        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-3">
                            {priceData.map((item, idx) => {
                                const diff = item.costPrice - item.currentSalePrice;
                                const isSelected = selectedIds.has(item.productId);

                                return (
                                    <div 
                                        key={item.productId || idx} 
                                        className={cn(
                                            "rounded-2xl p-3.5 border transition-all",
                                            isSelected 
                                                ? "bg-slate-50 dark:bg-slate-800/40 border-amber-500/30 dark:border-amber-500/20" 
                                                : "bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-50"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-2.5">
                                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(item.productId)}
                                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-sm text-slate-850 dark:text-white">
                                                        {item.productName}
                                                    </span>
                                                    {item.unit && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 uppercase">
                                                            {item.unit}
                                                        </span>
                                                    )}
                                                </div>
                                            </label>

                                            <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/20 whitespace-nowrap">
                                                Lệch -{formatNumber(diff)} đ
                                            </span>
                                        </div>

                                        {/* Price Row */}
                                        <div className="grid grid-cols-12 gap-3 items-center bg-white dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200/70 dark:border-white/5">
                                            <div className="col-span-3 text-center border-r border-slate-100 dark:border-white/5 pr-2">
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Giá bán cũ</div>
                                                <div className="text-sm font-bold text-slate-400 dark:text-slate-500 line-through tabular-nums mt-0.5">
                                                    {formatNumber(item.currentSalePrice)} đ
                                                </div>
                                            </div>

                                            <div className="col-span-3 text-center border-r border-slate-100 dark:border-white/5 pr-2">
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Giá nhập mới</div>
                                                <div className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                                                    {formatNumber(item.costPrice)} đ
                                                </div>
                                            </div>

                                            <div className="col-span-6 pl-1">
                                                <div className="text-[10px] font-black uppercase tracking-wider text-primary dark:text-emerald-400 mb-1">
                                                    Giá bán mới:
                                                </div>

                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="text"
                                                        disabled={!isSelected}
                                                        placeholder="Nhập giá bán mới..."
                                                        value={item.newSalePrice ? formatNumber(item.newSalePrice) : ""}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                                            handlePriceChange(item.productId, val);
                                                        }}
                                                        className="w-full py-2 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl font-black text-base text-slate-850 dark:text-white text-right outline-none disabled:opacity-40 transition-all tabular-nums"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">đ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                            >
                                Giữ nguyên giá (Bỏ qua)
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isSubmitting || selectedIds.size === 0}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span>Đang lưu...</span>
                                ) : (
                                    <>
                                        <Check size={16} strokeWidth={3} />
                                        <span>Nâng giá bán ({selectedIds.size})</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </m.div>
                </div>
            </AnimatePresence>
        </Portal>
    );
}
