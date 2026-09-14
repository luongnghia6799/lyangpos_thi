import React, { useState } from 'react';
import { motion as m } from 'framer-motion';
import { Palette, X, RotateCcw, Check, Sparkles, Sliders, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

export const CART_COLOR_PRESETS = [
    {
        id: 'default',
        name: 'Mặc định (Lyang Theme)',
        desc: 'Tông màu tự nhiên chuẩn hệ thống',
        headerBg: 'default',
        headerText: 'default',
        borderColor: 'default',
        borderWidth: '1',
        previewHeaderBg: '#8b6f47',
        previewBorder: '#8b6f47'
    },
    {
        id: 'emerald',
        name: 'Xanh Ngọc Emerald',
        desc: 'Sang trọng, sáng sủa, thanh lịch',
        headerBg: '#064e3b',
        headerText: '#6ee7b7',
        borderColor: '#10b981',
        borderWidth: '2',
        previewHeaderBg: '#064e3b',
        previewBorder: '#10b981'
    },
    {
        id: 'forest',
        name: 'Xanh Rêu Forest',
        desc: 'Đằm thắm, chuyên nghiệp, dịu mắt',
        headerBg: '#1e3a10',
        headerText: '#d9f99d',
        borderColor: '#2d5016',
        borderWidth: '2',
        previewHeaderBg: '#1e3a10',
        previewBorder: '#2d5016'
    },
    {
        id: 'terracotta',
        name: 'Nâu Đất Cổ Điển',
        desc: 'Ấm áp, phong cách Vintage Lyang',
        headerBg: '#543b24',
        headerText: '#fde68a',
        borderColor: '#8b6f47',
        borderWidth: '2',
        previewHeaderBg: '#543b24',
        previewBorder: '#8b6f47'
    },
    {
        id: 'navy',
        name: 'Xanh Biển Navy',
        desc: 'Công nghệ, hiện đại, sắc nét',
        headerBg: '#172554',
        headerText: '#93c5fd',
        borderColor: '#3b82f6',
        borderWidth: '2',
        previewHeaderBg: '#172554',
        previewBorder: '#3b82f6'
    },
    {
        id: 'purple',
        name: 'Tím Hoàng Gia',
        desc: 'Huyền bí, thời thượng, đẳng cấp',
        headerBg: '#3b0764',
        headerText: '#e9d5ff',
        borderColor: '#8b5cf6',
        borderWidth: '2',
        previewHeaderBg: '#3b0764',
        previewBorder: '#8b5cf6'
    },
    {
        id: 'rose',
        name: 'Đỏ Hồng Ruby',
        desc: 'Nổi bật, rực rỡ, năng động',
        headerBg: '#4c0519',
        headerText: '#fecdd3',
        borderColor: '#f43f5e',
        borderWidth: '2',
        previewHeaderBg: '#4c0519',
        previewBorder: '#f43f5e'
    },
    {
        id: 'amber',
        name: 'Hổ Phách Warm Amber',
        desc: 'Ấm cúng, cuốn hút, tương phản cao',
        headerBg: '#451a03',
        headerText: '#fde68a',
        borderColor: '#f59e0b',
        borderWidth: '2',
        previewHeaderBg: '#451a03',
        previewBorder: '#f59e0b'
    },
    {
        id: 'slate',
        name: 'Đen Slate Tối Giản',
        desc: 'Đen mun hiện đại, siêu nét',
        headerBg: '#0f172a',
        headerText: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: '2',
        previewHeaderBg: '#0f172a',
        previewBorder: '#475569'
    }
];

export const DEFAULT_CART_COLOR_CONFIG = {
    headerBg: 'default',
    headerText: 'default',
    borderColor: 'default',
    borderWidth: '1'
};

export default function CartColorCustomizerModal({ isOpen, onClose, config, onChangeConfig }) {
    if (!isOpen) return null;

    const currentConfig = { ...DEFAULT_CART_COLOR_CONFIG, ...config };

    const handleApplyPreset = (preset) => {
        const newCfg = {
            headerBg: preset.headerBg,
            headerText: preset.headerText,
            borderColor: preset.borderColor,
            borderWidth: preset.borderWidth
        };
        onChangeConfig(newCfg);
    };

    const handleReset = () => {
        onChangeConfig(DEFAULT_CART_COLOR_CONFIG);
    };

    // Quick color swatch picker options
    const colorSwatches = [
        '#2d5016', '#10b981', '#064e3b', '#8b6f47', '#543b24',
        '#2563eb', '#1d4ed8', '#7c3aed', '#db2777', '#e11d48',
        '#d97706', '#0f172a', '#334155', '#475569', '#ffffff', '#000000'
    ];

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <m.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative w-full max-w-2xl bg-[#faf8f3] dark:bg-[#071510] border border-[#8b6f47]/30 dark:border-emerald-500/30 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#8b6f47]/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-emerald-500/20 text-primary dark:text-emerald-400 flex items-center justify-center shadow-inner">
                            <Palette size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span>Tùy Biến Màu Header & Viền Giỏ Hàng</span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full">
                                    Live Sync
                                </span>
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                Áp dụng tức thì cho cả POS Bán Hàng & Nhập Hàng
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Live Preview Box */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <Eye size={14} className="text-primary dark:text-emerald-400" />
                                Xem trước giỏ hàng (Live Preview)
                            </span>
                            <span className="text-[10px] text-slate-400 lowercase font-medium">
                                thay đổi có hiệu lực ngay trên bảng
                            </span>
                        </div>

                        <div 
                            className="w-full rounded-2xl overflow-hidden transition-all duration-300 bg-card/40 backdrop-blur-md"
                            style={{
                                border: `${currentConfig.borderWidth || '1'}px solid ${currentConfig.borderColor !== 'default' ? currentConfig.borderColor : '#8b6f4740'}`,
                                boxShadow: currentConfig.borderColor !== 'default' ? `0 0 20px ${currentConfig.borderColor}25` : 'none'
                            }}
                        >
                            <table className="w-full text-left border-collapse table-fixed text-xs">
                                <thead>
                                    <tr 
                                        style={{
                                            backgroundColor: currentConfig.headerBg !== 'default' ? currentConfig.headerBg : 'transparent',
                                            color: currentConfig.headerText !== 'default' ? currentConfig.headerText : '#8b6f47'
                                        }}
                                        className="transition-colors duration-200 border-b border-black/10 dark:border-white/10"
                                    >
                                        <th className="py-2.5 px-3 font-black uppercase text-[10px] w-12 text-center" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Stt</th>
                                        <th className="py-2.5 px-3 font-black uppercase text-[10px]" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Tên sản phẩm</th>
                                        <th className="py-2.5 px-3 font-black uppercase text-[10px] text-center w-20" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Số lượng</th>
                                        <th className="py-2.5 px-3 font-black uppercase text-[10px] text-right w-24" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Đơn giá</th>
                                        <th className="py-2.5 px-3 font-black uppercase text-[10px] text-right w-28" style={{ color: currentConfig.headerText !== 'default' ? currentConfig.headerText : undefined }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr 
                                        className="border-b border-black/5 dark:border-white/5 transition-colors"
                                        style={{
                                            borderColor: currentConfig.borderColor !== 'default' ? `${currentConfig.borderColor}30` : undefined
                                        }}
                                    >
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">1</td>
                                        <td className="py-2.5 px-3 font-black text-slate-800 dark:text-slate-100 uppercase">Sản phẩm mẫu VIP</td>
                                        <td className="py-2.5 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">2</td>
                                        <td className="py-2.5 px-3 text-right font-black text-slate-600 dark:text-slate-300">150.000</td>
                                        <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">300.000đ</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-500" />
                                Bộ sưu tập Theme mẫu (Presets)
                            </h4>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                                <RotateCcw size={11} />
                                <span>Khôi phục mặc định</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {CART_COLOR_PRESETS.map((preset) => {
                                const isSelected = currentConfig.headerBg === preset.headerBg && 
                                                   currentConfig.headerText === preset.headerText && 
                                                   currentConfig.borderColor === preset.borderColor &&
                                                   (currentConfig.borderWidth || '1') === preset.borderWidth;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className={cn(
                                            "relative flex flex-col p-2.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-98 group",
                                            isSelected
                                                ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                                                : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 hover:border-black/20 dark:hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full mb-1.5">
                                            <span className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                                                {preset.name}
                                            </span>
                                            {isSelected && (
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-5 h-5 rounded-lg border border-black/10 shadow-inner shrink-0" 
                                                style={{ backgroundColor: preset.previewHeaderBg }}
                                                title="Màu nền Header"
                                            />
                                            <div 
                                                className="w-5 h-5 rounded-lg border-2 shrink-0" 
                                                style={{ borderColor: preset.previewBorder, backgroundColor: 'transparent' }}
                                                title="Màu viền"
                                            />
                                            <span className="text-[9px] font-bold text-slate-400 truncate">
                                                {preset.desc}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Color Tuning */}
                    <div className="space-y-3 p-4 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-black/10 dark:border-white/10">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Sliders size={14} className="text-primary dark:text-emerald-400" />
                            Tùy chỉnh chi tiết (Màu tự do)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Header Background Color */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>Màu nền Header:</span>
                                    <span className="font-mono text-[10px] text-primary dark:text-emerald-400">
                                        {currentConfig.headerBg === 'default' ? 'Mặc định' : currentConfig.headerBg}
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onChangeConfig({ ...currentConfig, headerBg: 'default' })}
                                        className={cn(
                                            "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                            currentConfig.headerBg === 'default'
                                                ? "bg-primary text-white border-primary"
                                                : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                        )}
                                    >
                                        Mặc định
                                    </button>
                                    <div className="relative flex items-center gap-1.5 flex-1">
                                        <input
                                            type="color"
                                            value={currentConfig.headerBg === 'default' ? '#8b6f47' : currentConfig.headerBg}
                                            onChange={(e) => onChangeConfig({ ...currentConfig, headerBg: e.target.value })}
                                            className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={currentConfig.headerBg === 'default' ? '' : currentConfig.headerBg}
                                            placeholder="#HEX..."
                                            onChange={(e) => onChangeConfig({ ...currentConfig, headerBg: e.target.value })}
                                            className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Header Text Color */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>Màu chữ Header:</span>
                                    <span className="font-mono text-[10px] text-primary dark:text-emerald-400">
                                        {currentConfig.headerText === 'default' ? 'Mặc định' : currentConfig.headerText}
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onChangeConfig({ ...currentConfig, headerText: 'default' })}
                                        className={cn(
                                            "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                            currentConfig.headerText === 'default'
                                                ? "bg-primary text-white border-primary"
                                                : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                        )}
                                    >
                                        Mặc định
                                    </button>
                                    <div className="relative flex items-center gap-1.5 flex-1">
                                        <input
                                            type="color"
                                            value={currentConfig.headerText === 'default' ? '#ffffff' : currentConfig.headerText}
                                            onChange={(e) => onChangeConfig({ ...currentConfig, headerText: e.target.value })}
                                            className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={currentConfig.headerText === 'default' ? '' : currentConfig.headerText}
                                            placeholder="#HEX..."
                                            onChange={(e) => onChangeConfig({ ...currentConfig, headerText: e.target.value })}
                                            className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cart Border Color */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>Màu viền giỏ hàng:</span>
                                    <span className="font-mono text-[10px] text-primary dark:text-emerald-400">
                                        {currentConfig.borderColor === 'default' ? 'Mặc định' : currentConfig.borderColor}
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onChangeConfig({ ...currentConfig, borderColor: 'default' })}
                                        className={cn(
                                            "px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer",
                                            currentConfig.borderColor === 'default'
                                                ? "bg-primary text-white border-primary"
                                                : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                        )}
                                    >
                                        Mặc định
                                    </button>
                                    <div className="relative flex items-center gap-1.5 flex-1">
                                        <input
                                            type="color"
                                            value={currentConfig.borderColor === 'default' ? '#8b6f47' : currentConfig.borderColor}
                                            onChange={(e) => onChangeConfig({ ...currentConfig, borderColor: e.target.value })}
                                            className="w-8 h-8 rounded-xl cursor-pointer border border-black/10 p-0.5 bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={currentConfig.borderColor === 'default' ? '' : currentConfig.borderColor}
                                            placeholder="#HEX..."
                                            onChange={(e) => onChangeConfig({ ...currentConfig, borderColor: e.target.value })}
                                            className="flex-1 h-8 px-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cart Border Width */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>Độ dày viền giỏ hàng:</span>
                                    <span className="font-mono text-[10px] text-primary dark:text-emerald-400">
                                        {currentConfig.borderWidth || '1'}px
                                    </span>
                                </label>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {['0.5', '1', '1.5', '2', '3', '4'].map((w) => (
                                        <button
                                            key={w}
                                            type="button"
                                            onClick={() => onChangeConfig({ ...currentConfig, borderWidth: w })}
                                            className={cn(
                                                "py-1 text-xs font-black rounded-lg border transition-all cursor-pointer text-center",
                                                (currentConfig.borderWidth || '1') === w
                                                    ? "bg-primary text-white border-primary shadow-xs"
                                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10"
                                            )}
                                        >
                                            {w}px
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Color Swatches */}
                        <div className="pt-2 border-t border-black/5 dark:border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                                Bảng màu chọn nhanh:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {colorSwatches.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => {
                                            onChangeConfig({
                                                ...currentConfig,
                                                borderColor: color,
                                                headerBg: color
                                            });
                                        }}
                                        className="w-5 h-5 rounded-md border border-black/20 hover:scale-125 transition-transform shadow-xs cursor-pointer"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#8b6f47]/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                        * Tự động lưu và giữ nguyên cho những lần làm việc sau
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
                    >
                        Hoàn tất & Đóng
                    </button>
                </div>
            </m.div>
        </div>
    );
}
