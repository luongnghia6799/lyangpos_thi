import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { X, Coins, Sparkles, CheckCircle, AlertTriangle, ArrowRight, Calendar, FileText, RefreshCw } from 'lucide-react';
import { formatNumber, cn } from '../../lib/utils';
import Portal from '../widgets/Portal';

export default function ReconcileFundModal({ isOpen, onClose, currentBookBalance = 0, onSuccess }) {
    const [actualAmount, setActualAmount] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setActualAmount(String(currentBookBalance || 0));
            setDate(new Date().toISOString().slice(0, 10));
            setNote('Khai báo số dư quỹ đầu kỳ - Kiểm kê tiền mặt thực tế trong két');
            setError(null);
        }
    }, [isOpen, currentBookBalance]);

    if (!isOpen) return null;

    const actualVal = parseFloat(actualAmount) || 0;
    const diff = actualVal - (currentBookBalance || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await axios.post('/api/vouchers/reconcile', {
                actual_balance: actualVal,
                date: date,
                note: note.trim() || undefined
            });

            if (res.data && res.data.status === 'success') {
                if (onSuccess) onSuccess(res.data);
                onClose();
            } else {
                setError(res.data?.message || 'Có lỗi xảy ra');
            }
        } catch (err) {
            console.error('Reconcile error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Lỗi khi thực hiện kiểm kê quỹ');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Container */}
                <m.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-emerald-900/10 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
                >
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white flex items-center justify-between relative overflow-hidden shrink-0">
                        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                            <Coins size={140} />
                        </div>
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                <Sparkles size={20} className="text-amber-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider">Khai Báo & Kiểm Kê Số Dư Quỹ</h3>
                                <p className="text-[11px] font-bold text-white/80">Đếm lại tiền thực tế trong két & thiết lập số dư đầu kỳ</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="relative z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto max-h-[80vh]">
                        {error && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Comparision Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Book balance */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                                    Sổ Sách Hiện Tại
                                </span>
                                <span className="text-xl font-mono font-black text-slate-700 dark:text-slate-200 block">
                                    {formatNumber(currentBookBalance || 0)} đ
                                </span>
                            </div>

                            {/* Difference badge */}
                            <div className={cn(
                                "p-4 rounded-2xl border flex flex-col justify-center",
                                Math.abs(diff) < 0.001 
                                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
                                    : diff > 0 
                                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300"
                                        : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300"
                            )}>
                                <span className="text-[10px] font-black uppercase opacity-80 tracking-wider block mb-0.5">
                                    {Math.abs(diff) < 0.001 ? "Khớp Sổ Sách" : diff > 0 ? "Thừa Quỹ (Điều chỉnh tăng)" : "Thiếu Quỹ (Điều chỉnh giảm)"}
                                </span>
                                <span className="text-lg font-mono font-black tracking-tight">
                                    {diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)} đ
                                </span>
                            </div>
                        </div>

                        {/* Input actual amount */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>Số Tiền Thực Tế Trong Két (Đếm Được) *</span>
                                <span className="text-[11px] font-mono text-[#2d5016] dark:text-emerald-400 font-black">
                                    {formatNumber(actualVal)} đ
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    required
                                    value={actualAmount}
                                    onChange={(e) => setActualAmount(e.target.value)}
                                    placeholder="Nhập số tiền thực tế..."
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-black text-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4a7c59] dark:focus:border-emerald-500 transition-all shadow-inner"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">
                                    VNĐ
                                </span>
                            </div>
                        </div>

                        {/* Date selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Calendar size={13} className="text-[#2d5016] dark:text-emerald-400" />
                                <span>Ngày Áp Dụng *</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4a7c59] transition-all"
                            />
                        </div>

                        {/* Note */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FileText size={13} className="text-[#2d5016] dark:text-emerald-400" />
                                <span>Lý Do / Ghi Chú Kiểm Kê</span>
                            </label>
                            <textarea
                                rows={2}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ghi chú đợt kiểm kê quỹ hoặc khai báo đầu kỳ..."
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4a7c59] transition-all resize-none"
                            />
                        </div>

                        {/* Informational tip */}
                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-[11px] font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                            💡 <strong>Cơ chế tự động:</strong> Hệ thống sẽ tự động tạo một phiếu điều chỉnh bù trừ (Phiếu Thu nếu thừa, Phiếu Chi nếu thiếu) với nhãn <strong>[ĐẦU KỲ / KIỂM KÊ]</strong> để đưa số dư sổ quỹ về đúng chuẩn <strong>{formatNumber(actualVal)} đ</strong>.
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] hover:from-[#203c0e] hover:to-[#3d664a] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 border border-white/10"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        ĐANG CẬP NHẬT...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={14} />
                                        XÁC NHẬN SỐ DƯ QUỸ
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </m.div>
            </div>
        </Portal>
    );
}
