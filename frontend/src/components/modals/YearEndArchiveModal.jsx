import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { X, Archive, ShieldCheck, Database, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Calendar, Coins, Users, Package, FileCheck } from 'lucide-react';
import { formatNumber, cn } from '../../lib/utils';
import Portal from '../widgets/Portal';

export default function YearEndArchiveModal({ isOpen, onClose, onSuccess }) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear - 1);
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [customCash, setCustomCash] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedYear(currentYear - 1);
            setConfirmText('');
            setResult(null);
            setError(null);
            fetchPreview(currentYear - 1);
        }
    }, [isOpen]);

    const fetchPreview = async (year) => {
        setLoadingPreview(true);
        setError(null);
        try {
            const res = await axios.get(`/api/archive-preview?year=${year}`);
            setPreview(res.data);
            setCustomCash(String(res.data?.calculated_cash_balance || 0));
        } catch (err) {
            console.error('Fetch archive preview error:', err);
            setError('Không thể tải dữ liệu xem trước chốt sổ');
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleYearChange = (yr) => {
        setSelectedYear(yr);
        fetchPreview(yr);
    };

    const handleExecuteArchive = async (e) => {
        e.preventDefault();
        if (confirmText.trim() !== 'CHỐT SỔ') {
            setError('Vui lòng gõ chính xác chữ "CHỐT SỔ" để xác nhận');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                year: parseInt(selectedYear),
                opening_cash: parseFloat(customCash) || 0,
                opening_note: `Số dư quỹ tiền mặt đầu kỳ năm ${parseInt(selectedYear) + 1} (Chốt sổ năm ${selectedYear})`
            };

            const res = await axios.post('/api/archive-year', payload);
            if (res.data && res.data.status === 'success') {
                setResult(res.data);
                if (onSuccess) onSuccess(res.data);
            } else {
                setError(res.data?.message || 'Có lỗi xảy ra khi chốt sổ');
            }
        } catch (err) {
            console.error('Execute archive error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Lỗi khi thực hiện chốt sổ');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/65 backdrop-blur-md"
                />

                {/* Modal Container */}
                <m.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-emerald-900/10 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col font-sans max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-[#1c380e] via-[#2d5016] to-[#4a7c59] text-white flex items-center justify-between relative overflow-hidden shrink-0">
                        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                            <Archive size={170} />
                        </div>
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                <Database size={22} className="text-emerald-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wider">Chốt Sổ Cuối Năm & Kết Chuyển Số Dư</h3>
                                <p className="text-[11px] font-bold text-white/80">Lưu trữ dữ liệu năm cũ & khởi tạo số dư đầu kỳ cho năm mới</p>
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

                    {/* Content Body */}
                    <div className="p-6 overflow-y-auto space-y-5">
                        {/* If archive succeeded */}
                        {result ? (
                            <div className="py-6 space-y-5 text-center">
                                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-md">
                                    <CheckCircle2 size={36} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                        Chốt Sổ Năm {selectedYear} Thành Công!
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Dữ liệu năm cũ đã được đóng gói an toàn và toàn bộ số dư đã kết chuyển sang năm mới.
                                    </p>
                                </div>

                                {/* Results details card */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2.5 text-xs">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                                        <span className="text-slate-500 font-bold">Tệp sao lưu an toàn:</span>
                                        <span className="font-mono font-black text-[#2d5016] dark:text-emerald-400">{result.archive_file}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                                        <span className="text-slate-500 font-bold">Số đơn hàng đã lưu trữ:</span>
                                        <span className="font-mono font-black text-slate-700 dark:text-slate-200">{formatNumber(result.archived_orders_count)} đơn</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                                        <span className="text-slate-500 font-bold">Số dư quỹ tiền mặt đầu kỳ:</span>
                                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{formatNumber(result.opening_cash_balance)} đ</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-slate-500 font-bold">Dung lượng Database mới:</span>
                                        <span className="font-mono font-black text-blue-600 dark:text-blue-400">{result.new_db_size_mb} MB (Siêu nhẹ!)</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        window.location.reload();
                                    }}
                                    className="px-6 py-3 bg-[#2d5016] hover:bg-[#203c0e] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
                                >
                                    HOÀN TẤT & LÀM MỚI ỨNG DỤNG
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleExecuteArchive} className="space-y-4.5">
                                {error && (
                                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                                        <AlertTriangle size={16} className="shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Year Selection Bar */}
                                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-[#2d5016] dark:text-emerald-400" />
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Chọn Năm Cần Chốt Sổ:
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {[currentYear - 2, currentYear - 1, currentYear].map((yr) => (
                                            <button
                                                key={yr}
                                                type="button"
                                                onClick={() => handleYearChange(yr)}
                                                className={cn(
                                                    "px-3.5 py-1.5 rounded-xl font-mono text-xs font-black transition-all active:scale-95",
                                                    selectedYear === yr
                                                        ? "bg-[#2d5016] text-white shadow-sm"
                                                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                                                )}
                                            >
                                                Năm {yr}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview Stats Grid */}
                                {loadingPreview ? (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                                        <RefreshCw size={24} className="animate-spin text-[#2d5016]" />
                                        <span className="text-xs font-bold">Đang tổng hợp dữ liệu năm {selectedYear}...</span>
                                    </div>
                                ) : preview ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Đơn Hàng Sẽ Lưu Trữ</span>
                                                <span className="text-base font-mono font-black text-slate-800 dark:text-slate-100 block">
                                                    {formatNumber(preview.orders_count)}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Chi Tiết Hàng Hóa</span>
                                                <span className="text-base font-mono font-black text-slate-800 dark:text-slate-100 block">
                                                    {formatNumber(preview.order_details_count)}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Đối Tác Còn Công Nợ</span>
                                                <span className="text-base font-mono font-black text-amber-600 dark:text-amber-400 block">
                                                    {formatNumber(preview.partners_with_debt)}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Dung Lượng DB Gốc</span>
                                                <span className="text-base font-mono font-black text-blue-600 dark:text-blue-400 block">
                                                    {preview.current_db_size_mb} MB
                                                </span>
                                            </div>
                                        </div>

                                        {/* Auto-rollover explanations */}
                                        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 space-y-2 text-xs">
                                            <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
                                                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                                                <span>Quy Trình Kết Chuyển Số Dư Tự Động Sang Năm {selectedYear + 1}:</span>
                                            </div>
                                            <ul className="space-y-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium list-disc list-inside">
                                                <li><strong>Tồn kho sản phẩm:</strong> Giữ nguyên số lượng tồn kho thực tế hiện tại làm Tồn kho đầu kỳ.</li>
                                                <li><strong>Công nợ khách hàng & nhà cung cấp:</strong> Số nợ còn lại của từng đối tác được tạo thành <strong>Số dư nợ đầu kỳ</strong> (không bị mất công nợ).</li>
                                                <li><strong>Danh mục & Cài đặt:</strong> Giữ nguyên 100% sản phẩm, bảng giá, mẫu in, tài khoản, khách hàng.</li>
                                            </ul>
                                        </div>

                                        {/* Opening cash balance input */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <Coins size={14} className="text-[#2d5016] dark:text-emerald-400" />
                                                    Số Dư Quỹ Tiền Mặt Đầu Kỳ Năm Mới (Thực Tế Trong Két) *
                                                </span>
                                                <span className="text-[11px] font-mono text-[#2d5016] dark:text-emerald-400 font-black">
                                                    {formatNumber(parseFloat(customCash) || 0)} đ
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="1000"
                                                    required
                                                    value={customCash}
                                                    onChange={(e) => setCustomCash(e.target.value)}
                                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-black text-base text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#4a7c59] transition-all"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">
                                                    VNĐ
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                Gợi ý: Mặc định là số dư quỹ theo sổ sách tính đến hết 31/12/{selectedYear}. Anh/chị có thể nhập lại số tiền thực tế nếu có đếm lại tiền trong két.
                                            </p>
                                        </div>

                                        {/* Confirmation safety gate */}
                                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2.5">
                                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                                                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                                                <span>Xác Nhận Đóng Băng & Chốt Sổ Năm {selectedYear}</span>
                                            </div>
                                            <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed font-medium">
                                                Hệ thống sẽ tự động nhân bản 1 bản sao lưu nguyên vẹn <code>easypos_archive_{selectedYear}_[thời_gian].db</code> vào thư mục sao lưu. Vui lòng gõ chữ <strong>CHỐT SỔ</strong> vào ô bên dưới để xác nhận thực hiện:
                                            </p>
                                            <input
                                                type="text"
                                                required
                                                value={confirmText}
                                                onChange={(e) => setConfirmText(e.target.value)}
                                                placeholder="Gõ CHỐT SỔ để xác nhận..."
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl font-black text-xs text-amber-900 dark:text-amber-200 tracking-widest uppercase focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                    </div>
                                ) : null}

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
                                        disabled={submitting || confirmText.trim() !== 'CHỐT SỔ'}
                                        className={cn(
                                            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md border border-white/10",
                                            confirmText.trim() === 'CHỐT SỔ' && !submitting
                                                ? "bg-gradient-to-r from-emerald-600 to-[#2d5016] hover:from-emerald-700 hover:to-[#203c0e] text-white active:scale-95 cursor-pointer"
                                                : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        {submitting ? (
                                            <>
                                                <RefreshCw size={14} className="animate-spin" />
                                                ĐANG CHỐT SỔ & THU GỌN DB...
                                            </>
                                        ) : (
                                            <>
                                                <Archive size={14} />
                                                CHỐT SỔ & KHỞI TẠO NĂM MỚI
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </m.div>
            </div>
        </Portal>
    );
}
