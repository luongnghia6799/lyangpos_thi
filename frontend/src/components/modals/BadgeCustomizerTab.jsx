import React, { useState } from 'react';
import { 
    Palette, RotateCcw, Check, Sparkles, Bookmark, Tag, 
    Clock, PackageCheck, BadgePercent, CircleAlert, SlidersHorizontal,
    Square, Eye, SunMedium, Truck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { hexToRgba, isLightColor, adjustColor } from './BubbleCustomizerTab';

export { hexToRgba, isLightColor, adjustColor };

export const BADGE_PRESETS = [
    {
        id: 'default',
        name: 'Mặc Định (Lyang Theme)',
        desc: 'Tông màu tự nhiên chuẩn hệ thống nông nghiệp Lyang',
        badgeCustomMode: 'all',
        badgeBg: 'default',
        badgeBorderColor: 'default',
        badgeBorderWidth: '2',
        badgeEnableBorder: true,
        badgeTextColor: 'default',
        badgeEnableShadow: false,
        badgeDeliveryBg: 'default',
        badgeDeliveryBorder: 'default',
        badgeDeliveryText: 'default',
        previewBorder: '#8b6f47',
        previewAccent: '#2d5016'
    },
    {
        id: 'forest_emerald',
        name: 'Xanh Rừng & Ngọc Lục Bảo',
        desc: 'Viền xanh rêu đậm nét, chữ xanh rừng cao cấp',
        badgeCustomMode: 'all',
        badgeBg: 'rgba(45, 80, 22, 0.22)',
        badgeBorderColor: '#2d5016',
        badgeBorderWidth: '2',
        badgeEnableBorder: true,
        badgeTextColor: '#1b340d',
        badgeEnableShadow: true,
        badgeDeliveryBg: 'linear-gradient(to right, #059669, #2d5016, #1d380e)',
        badgeDeliveryBorder: '#6ee7b7',
        badgeDeliveryText: '#ffffff',
        previewBorder: '#2d5016',
        previewAccent: '#10b981'
    },
    {
        id: 'warm_amber',
        name: 'Nâu Đất & Vàng Hổ Phách',
        desc: 'Tông nâu gỗ ấm, sang trọng, tương phản cao',
        badgeCustomMode: 'all',
        badgeBg: 'rgba(139, 111, 71, 0.22)',
        badgeBorderColor: '#8b6f47',
        badgeBorderWidth: '2',
        badgeEnableBorder: true,
        badgeTextColor: '#4e391e',
        badgeEnableShadow: true,
        badgeDeliveryBg: 'linear-gradient(to right, #d97706, #8b6f47, #451a03)',
        badgeDeliveryBorder: '#fcd34d',
        badgeDeliveryText: '#ffffff',
        previewBorder: '#8b6f47',
        previewAccent: '#d97706'
    },
    {
        id: 'vibrant_coral',
        name: 'Đỏ San Hô & Hồng Ruby',
        desc: 'Nổi bật, rực rỡ, thích hợp làm nổi các cảnh báo',
        badgeCustomMode: 'all',
        badgeBg: 'rgba(244, 63, 94, 0.22)',
        badgeBorderColor: '#f43f5e',
        badgeBorderWidth: '2',
        badgeEnableBorder: true,
        badgeTextColor: '#9f1239',
        badgeEnableShadow: true,
        badgeDeliveryBg: 'linear-gradient(to right, #f43f5e, #be123c, #881337)',
        badgeDeliveryBorder: '#fda4af',
        badgeDeliveryText: '#ffffff',
        previewBorder: '#f43f5e',
        previewAccent: '#fb7185'
    },
    {
        id: 'cyber_cyan',
        name: 'Xanh Neon Cyan & Đại Dương',
        desc: 'Hiện đại, công nghệ, sáng sủa, thanh lịch',
        badgeCustomMode: 'all',
        badgeBg: 'rgba(6, 182, 212, 0.22)',
        badgeBorderColor: '#0891b2',
        badgeBorderWidth: '2',
        badgeEnableBorder: true,
        badgeTextColor: '#164e63',
        badgeEnableShadow: true,
        badgeDeliveryBg: 'linear-gradient(to right, #06b6d4, #0e7490, #164e63)',
        badgeDeliveryBorder: '#67e8f9',
        badgeDeliveryText: '#ffffff',
        previewBorder: '#0891b2',
        previewAccent: '#06b6d4'
    },
    {
        id: 'titan_dark',
        name: 'Titan Siêu Tối Giản',
        desc: 'Xám titan sâu, viền sắc nét, cực kỳ dịu mắt',
        badgeCustomMode: 'all',
        badgeBg: 'rgba(71, 85, 105, 0.24)',
        badgeBorderColor: '#475569',
        badgeBorderWidth: '2',
        badgeEnableBorder: true,
        badgeTextColor: '#0f172a',
        badgeEnableShadow: false,
        badgeDeliveryBg: 'linear-gradient(to right, #334155, #1e293b, #0f172a)',
        badgeDeliveryBorder: '#94a3b8',
        badgeDeliveryText: '#ffffff',
        previewBorder: '#475569',
        previewAccent: '#64748b'
    }
];

export const getBadgeComputedStyle = (config, badgeType = 'stock') => {
    if (!config) return {};
    const mode = config.badgeCustomMode || 'all';

    let bg = null;
    let borderCol = null;
    let textCol = null;

    if (mode === 'individual') {
        if (badgeType === 'stock') {
            if (config.badgeStockBg && config.badgeStockBg !== 'default') bg = config.badgeStockBg;
            if (config.badgeStockBorder && config.badgeStockBorder !== 'default') borderCol = config.badgeStockBorder;
            if (config.badgeStockText && config.badgeStockText !== 'default') textCol = config.badgeStockText;
        } else if (badgeType === 'last_purchase' || badgeType === 'purchase') {
            if (config.badgePurchaseBg && config.badgePurchaseBg !== 'default') bg = config.badgePurchaseBg;
            if (config.badgePurchaseBorder && config.badgePurchaseBorder !== 'default') borderCol = config.badgePurchaseBorder;
            if (config.badgePurchaseText && config.badgePurchaseText !== 'default') textCol = config.badgePurchaseText;
        } else if (badgeType === 'low_price') {
            if (config.badgeLowPriceBg && config.badgeLowPriceBg !== 'default') bg = config.badgeLowPriceBg;
            if (config.badgeLowPriceBorder && config.badgeLowPriceBorder !== 'default') borderCol = config.badgeLowPriceBorder;
            if (config.badgeLowPriceText && config.badgeLowPriceText !== 'default') textCol = config.badgeLowPriceText;
        } else if (badgeType === 'loss' || badgeType === 'warning' || badgeType === 'below_new') {
            if (config.badgeLossBg && config.badgeLossBg !== 'default') bg = config.badgeLossBg;
            if (config.badgeLossBorder && config.badgeLossBorder !== 'default') borderCol = config.badgeLossBorder;
            if (config.badgeLossText && config.badgeLossText !== 'default') textCol = config.badgeLossText;
        } else if (badgeType === 'delivery' || badgeType === 'fertilizer' || badgeType === 'delivery_reminder') {
            if (config.badgeDeliveryBg && config.badgeDeliveryBg !== 'default') bg = config.badgeDeliveryBg;
            if (config.badgeDeliveryBorder && config.badgeDeliveryBorder !== 'default') borderCol = config.badgeDeliveryBorder;
            if (config.badgeDeliveryText && config.badgeDeliveryText !== 'default') textCol = config.badgeDeliveryText;
        }
    } else {
        // mode === 'all'
        if (badgeType === 'delivery' || badgeType === 'fertilizer' || badgeType === 'delivery_reminder') {
            if (config.badgeDeliveryBg && config.badgeDeliveryBg !== 'default') bg = config.badgeDeliveryBg;
            if (config.badgeDeliveryBorder && config.badgeDeliveryBorder !== 'default') borderCol = config.badgeDeliveryBorder;
            if (config.badgeDeliveryText && config.badgeDeliveryText !== 'default') textCol = config.badgeDeliveryText;
        }
    }

    // Fallback to global badge setting if not set or in 'all' mode
    if (!bg && config.badgeBg && config.badgeBg !== 'default') bg = config.badgeBg;
    if (!borderCol && config.badgeBorderColor && config.badgeBorderColor !== 'default') borderCol = config.badgeBorderColor;
    if (!textCol && config.badgeTextColor && config.badgeTextColor !== 'default') textCol = config.badgeTextColor;

    const res = {};
    if (bg && bg !== 'default') {
        if (bg.includes('gradient')) {
            res.background = bg;
        } else {
            res.backgroundColor = bg;
        }
    }
    const isDelivery = (badgeType === 'delivery' || badgeType === 'fertilizer' || badgeType === 'delivery_reminder');
    const borderWidth = (config.badgeEnableBorder === false || (isDelivery && config.badgeDeliveryEnableBorder === false)) 
        ? 0 
        : Number(config.badgeBorderWidth || 2);

    if (borderCol && borderCol !== 'default') {
        res.borderColor = borderCol;
        res.borderWidth = `${borderWidth}px`;
        res.borderStyle = 'solid';
    } else if (config.badgeEnableBorder === false || (isDelivery && config.badgeDeliveryEnableBorder === false)) {
        res.border = 'none';
    } else if (borderWidth !== 2) {
        res.borderWidth = `${borderWidth}px`;
    }

    if (textCol && textCol !== 'default') {
        res.color = textCol;
    }

    if ((config.badgeEnableShadow || (isDelivery && config.badgeDeliveryEnableShadow)) && borderCol && borderCol !== 'default') {
        res.boxShadow = `0 4px 16px ${hexToRgba(borderCol, 0.4) || 'rgba(0,0,0,0.2)'}`;
    }

    return res;
};

export default function BadgeCustomizerTab({ config, onChangeConfig }) {
    const currentConfig = { ...config };
    const [subTarget, setSubTarget] = useState('all'); // 'all', 'stock', 'purchase', 'low_price', 'loss'

    const handleApplyPreset = (preset) => {
        onChangeConfig({
            ...currentConfig,
            badgeCustomMode: preset.badgeCustomMode || 'all',
            badgeBg: preset.badgeBg,
            badgeBorderColor: preset.badgeBorderColor,
            badgeBorderWidth: preset.badgeBorderWidth,
            badgeEnableBorder: preset.badgeEnableBorder,
            badgeTextColor: preset.badgeTextColor,
            badgeEnableShadow: preset.badgeEnableShadow,
            badgeDeliveryBg: preset.badgeDeliveryBg || 'default',
            badgeDeliveryBorder: preset.badgeDeliveryBorder || 'default',
            badgeDeliveryText: preset.badgeDeliveryText || 'default'
        });
    };

    const handleResetBadges = () => {
        handleApplyPreset(BADGE_PRESETS[0]);
    };

    const quickColors = [
        '#6ee7b7', '#34d399', '#10b981', '#2d5016', '#fcd34d', '#d97706',
        '#fb7185', '#f43f5e', '#38bdf8', '#0891b2', '#c084fc', '#8b5cf6',
        '#8b6f47', '#475569', '#000000', '#ffffff'
    ];

    const quickBgColors = [
        'rgba(45, 80, 22, 0.22)',
        'rgba(139, 111, 71, 0.22)',
        'rgba(217, 119, 6, 0.22)',
        'rgba(244, 63, 94, 0.22)',
        'rgba(8, 145, 178, 0.22)',
        'rgba(16, 185, 129, 0.22)',
        'rgba(59, 130, 246, 0.22)',
        'rgba(139, 92, 246, 0.22)',
        'rgba(0, 0, 0, 0.1)',
        'rgba(255, 255, 255, 0.8)'
    ];

    const quickTextColors = [
        '#ffffff', '#6ee7b7', '#fef08a', '#fda4af', '#7dd3fc', '#e9d5ff',
        '#1b340d', '#4e391e', '#78350f', '#9f1239', '#164e63',
        '#064e3b', '#1e3a8a', '#581c87', '#0f172a'
    ];

    const getTargetFieldNames = () => {
        if (subTarget === 'stock') {
            return { bg: 'badgeStockBg', border: 'badgeStockBorder', text: 'badgeStockText' };
        } else if (subTarget === 'purchase') {
            return { bg: 'badgePurchaseBg', border: 'badgePurchaseBorder', text: 'badgePurchaseText' };
        } else if (subTarget === 'low_price') {
            return { bg: 'badgeLowPriceBg', border: 'badgeLowPriceBorder', text: 'badgeLowPriceText' };
        } else if (subTarget === 'loss') {
            return { bg: 'badgeLossBg', border: 'badgeLossBorder', text: 'badgeLossText' };
        } else if (subTarget === 'delivery') {
            return { bg: 'badgeDeliveryBg', border: 'badgeDeliveryBorder', text: 'badgeDeliveryText' };
        }
        return { bg: 'badgeBg', border: 'badgeBorderColor', text: 'badgeTextColor' };
    };

    const fieldNames = getTargetFieldNames();
    const isIndividualMode = currentConfig.badgeCustomMode === 'individual';

    const currentBorder = currentConfig[fieldNames.border] || 'default';
    const currentBg = currentConfig[fieldNames.bg] || 'default';
    const currentText = currentConfig[fieldNames.text] || 'default';
    const borderWidth = currentConfig.badgeBorderWidth || '2';
    const enableBorder = currentConfig.badgeEnableBorder !== false;
    const enableShadow = Boolean(currentConfig.badgeEnableShadow);

    return (
        <div className="space-y-6">
            {/* Header / Intro */}
            <div className="flex items-center justify-between pb-3.5 border-b border-black/5 dark:border-white/10 gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-800 dark:text-emerald-400 flex items-center gap-2">
                        <Bookmark size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Màu Sắc & Viền Badge Dòng Hàng</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tùy chỉnh màu nền, viền và chữ cho toàn bộ nhãn badge trong giỏ hàng.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleResetBadges}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-black transition-colors cursor-pointer shrink-0"
                >
                    <RotateCcw size={13} />
                    <span>Mặc định</span>
                </button>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fbf9f4] to-[#ede8dc] dark:from-[#1a1e17] dark:to-[#121610] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5">
                        <Eye size={13} /> Xem trước thực tế các Badge (Bấm vào badge để chọn chỉnh)
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {isIndividualMode ? `Đang chỉnh riêng: ${subTarget}` : 'Áp dụng đồng bộ'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 p-3 bg-white/70 dark:bg-black/30 rounded-xl border border-black/5 dark:border-white/5">
                    {/* Stock badge preview */}
                    <div 
                        onClick={() => {
                            onChangeConfig({ ...currentConfig, badgeCustomMode: 'individual' });
                            setSubTarget('stock');
                        }}
                        style={getBadgeComputedStyle(currentConfig, 'stock')}
                        className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none bg-[#2d5016]/20 text-[#1b340d] border-[#2d5016]/45 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/50",
                            subTarget === 'stock' && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#121610]"
                        )}
                        title="Bấm để chỉnh nhãn Tồn kho"
                    >
                        <PackageCheck size={12} strokeWidth={2.8} />
                        <span>526</span>
                    </div>

                    {/* Last purchase badge preview */}
                    <div 
                        onClick={() => {
                            onChangeConfig({ ...currentConfig, badgeCustomMode: 'individual' });
                            setSubTarget('purchase');
                        }}
                        style={getBadgeComputedStyle(currentConfig, 'last_purchase')}
                        className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black border-2 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none bg-[#8b6f47]/20 text-[#4e391e] border-[#8b6f47]/45 dark:bg-[#d4a574]/25 dark:text-[#f7e6d0] dark:border-[#d4a574]/50",
                            subTarget === 'purchase' && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#121610]"
                        )}
                        title="Bấm để chỉnh nhãn Đã mua"
                    >
                        <Clock size={11} strokeWidth={2.6} />
                        <span>Đã mua: 11/10/2026</span>
                    </div>

                    {/* Low price badge preview */}
                    <div 
                        onClick={() => {
                            onChangeConfig({ ...currentConfig, badgeCustomMode: 'individual' });
                            setSubTarget('low_price');
                        }}
                        style={getBadgeComputedStyle(currentConfig, 'low_price')}
                        className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9.5px] font-black border-2 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none bg-[#d97706]/20 text-[#78350f] border-[#b45309]/50 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/50",
                            subTarget === 'low_price' && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#121610]"
                        )}
                        title="Bấm để chỉnh nhãn Giá thấp"
                    >
                        <BadgePercent size={11} strokeWidth={2.8} />
                        <span>GIÁ THẤP (8,000đ)</span>
                    </div>

                    {/* Loss / Warning badge preview */}
                    <div 
                        onClick={() => {
                            onChangeConfig({ ...currentConfig, badgeCustomMode: 'individual' });
                            setSubTarget('loss');
                        }}
                        style={getBadgeComputedStyle(currentConfig, 'loss')}
                        className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9.5px] font-black border-2 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none bg-rose-500/25 text-rose-950 border-rose-500/50 dark:bg-rose-500/30 dark:text-rose-200 dark:border-rose-400/60",
                            subTarget === 'loss' && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#121610]"
                        )}
                        title="Bấm để chỉnh nhãn Cảnh báo lỗ"
                    >
                        <CircleAlert size={11} strokeWidth={2.8} />
                        <span>LỖ VỐN</span>
                    </div>

                    {/* Delivery reminder badge preview */}
                    <div 
                        onClick={() => {
                            onChangeConfig({ ...currentConfig, badgeCustomMode: 'individual' });
                            setSubTarget('delivery');
                        }}
                        style={getBadgeComputedStyle(currentConfig, 'delivery')}
                        className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black border-2 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none bg-gradient-to-r from-emerald-600 via-[#2d5016] to-[#1d380e] text-white border-emerald-300 dark:border-emerald-400",
                            subTarget === 'delivery' && "ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-[#121610]"
                        )}
                        title="Bấm để tùy chỉnh màu & viền cho Badge Nhắc Chở Phân"
                    >
                        <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                        <Truck size={12} strokeWidth={2.8} />
                        <span>Nhắc Chở Phân (2)</span>
                    </div>
                </div>
            </div>

            {/* PRESETS SECTION */}
            <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Bộ Mẫu Phối Màu Nhanh (Badge Presets)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {BADGE_PRESETS.map((p) => {
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleApplyPreset(p)}
                                className="p-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between gap-2 bg-white dark:bg-[#151c14] border-black/10 dark:border-white/10 hover:border-emerald-500 shadow-xs"
                            >
                                <div>
                                    <div className="font-black text-xs text-slate-800 dark:text-emerald-300 flex items-center justify-between">
                                        <span>{p.name}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: p.previewBorder }} />
                                            <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: p.previewAccent }} />
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                        {p.desc}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CHẾ ĐỘ TÙY CHỈNH: CHUNG VS TỪNG LOẠI */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Phạm Vi Tùy Biến
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Áp dụng chung cho mọi badge hoặc chỉnh riêng cho từng loại thẻ
                        </div>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-black/10 dark:bg-black/30 rounded-xl">
                        <button
                            type="button"
                            onClick={() => {
                                onChangeConfig({ ...currentConfig, badgeCustomMode: 'all' });
                                setSubTarget('all');
                            }}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
                                !isIndividualMode
                                    ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                            )}
                        >
                            Tất cả Badge
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onChangeConfig({ ...currentConfig, badgeCustomMode: 'individual' });
                                if (subTarget === 'all') setSubTarget('stock');
                            }}
                            className={cn(
                                "px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
                                isIndividualMode
                                    ? "bg-white dark:bg-[#0e271d] text-slate-800 dark:text-emerald-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                            )}
                        >
                            Từng Badge riêng
                        </button>
                    </div>
                </div>

                {/* Sub-target selector when in individual mode */}
                {isIndividualMode && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-black/5 dark:border-white/5 overflow-x-auto custom-scrollbar">
                        <button
                            type="button"
                            onClick={() => setSubTarget('stock')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                subTarget === 'stock'
                                    ? "bg-[#2d5016] text-white shadow-xs"
                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10"
                            )}
                        >
                            <PackageCheck size={12} />
                            <span>1. Tồn Kho</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSubTarget('purchase')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                subTarget === 'purchase'
                                    ? "bg-[#8b6f47] text-white shadow-xs"
                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10"
                            )}
                        >
                            <Clock size={12} />
                            <span>2. Đã Mua</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSubTarget('low_price')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                subTarget === 'low_price'
                                    ? "bg-[#d97706] text-white shadow-xs"
                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10"
                            )}
                        >
                            <BadgePercent size={12} />
                            <span>3. Giá Thấp</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSubTarget('loss')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                subTarget === 'loss'
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10"
                            )}
                        >
                            <CircleAlert size={12} />
                            <span>4. Cảnh Báo Lỗ</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSubTarget('delivery')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                                subTarget === 'delivery'
                                    ? "bg-gradient-to-r from-emerald-700 to-[#1d380e] text-emerald-200 border border-emerald-400/60 shadow-xs"
                                    : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10"
                            )}
                        >
                            <Truck size={12} />
                            <span>5. Nhắc Chở Phân</span>
                        </button>
                    </div>
                )}
            </div>

            {/* BORDER SETTINGS */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Square size={14} className="text-emerald-600" />
                        Tùy Biến Đường Viền (Border)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Bật viền</span>
                        <input
                            type="checkbox"
                            checked={enableBorder}
                            onChange={(e) => onChangeConfig({ ...currentConfig, badgeEnableBorder: e.target.checked })}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                    </label>
                </div>

                {/* Border Width Selection */}
                <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>Độ dày viền (Border Width)</span>
                        <span className="font-mono font-black text-slate-800 dark:text-emerald-400">{borderWidth}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {['1', '1.5', '2', '2.5', '3'].map((w) => (
                            <button
                                key={w}
                                type="button"
                                onClick={() => onChangeConfig({ ...currentConfig, badgeBorderWidth: w })}
                                className={cn(
                                    "flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border",
                                    borderWidth === w
                                        ? "bg-[#2d5016] text-white border-[#2d5016] shadow-xs"
                                        : "bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500"
                                )}
                            >
                                {w}px
                            </button>
                        ))}
                    </div>
                </div>

                {/* Border Color Swatches & Picker */}
                <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>Màu viền</span>
                        <div className="flex items-center gap-2">
                            {currentBorder !== 'default' && (
                                <button
                                    type="button"
                                    onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.border]: 'default' })}
                                    className="text-[10px] text-rose-500 hover:underline font-bold"
                                >
                                    Về mặc định
                                </button>
                            )}
                            <div className="w-5 h-5 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: currentBorder !== 'default' ? currentBorder : '#8b6f47' }} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {quickColors.map((col) => (
                            <button
                                key={col}
                                type="button"
                                onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.border]: col })}
                                className={cn(
                                    "w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer shadow-xs",
                                    currentBorder === col ? "border-emerald-500 scale-110 ring-2 ring-emerald-500/30" : "border-black/10"
                                )}
                                style={{ backgroundColor: col }}
                                title={col}
                            />
                        ))}

                        <div className="flex items-center gap-1.5 pl-2 border-l border-black/10 dark:border-white/10">
                            <input
                                type="color"
                                value={currentBorder !== 'default' ? currentBorder : '#8b6f47'}
                                onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.border]: e.target.value })}
                                className="w-7 h-7 rounded-lg cursor-pointer border border-black/10 bg-transparent p-0"
                                title="Chọn màu tự do"
                            />
                            <input
                                type="text"
                                placeholder="#hex..."
                                value={currentBorder !== 'default' ? currentBorder : ''}
                                onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.border]: e.target.value })}
                                className="w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* BACKGROUND SETTINGS */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <Palette size={14} className="text-amber-600" />
                        Tùy Biến Màu Nền (Background)
                    </span>
                    <div className="flex items-center gap-2">
                        {currentBg !== 'default' && (
                            <button
                                type="button"
                                onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.bg]: 'default' })}
                                className="text-[10px] text-rose-500 hover:underline font-bold"
                            >
                                Về mặc định
                            </button>
                        )}
                        <div className="w-5 h-5 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: currentBg !== 'default' ? currentBg : 'rgba(45,80,22,0.2)' }} />
                    </div>
                </div>

                {subTarget === 'delivery' && (
                    <div className="space-y-1.5 pb-2">
                        <div className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Sparkles size={11} /> Mẫu Gradient Chở Phân Sang Trọng:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {[
                                { name: 'Emerald Vụ Mùa', val: 'linear-gradient(to right, #059669, #2d5016, #1d380e)' },
                                { name: 'Xanh Neon Mint', val: 'linear-gradient(to right, #10b981, #059669)' },
                                { name: 'Hổ Phách Vàng', val: 'linear-gradient(to right, #f59e0b, #b45309)' },
                                { name: 'Đỏ San Hô', val: 'linear-gradient(to right, #f43f5e, #be123c)' },
                                { name: 'Cyan Biển Sâu', val: 'linear-gradient(to right, #06b6d4, #0e7490)' },
                                { name: 'Tím Cyber', val: 'linear-gradient(to right, #8b5cf6, #6d28d9)' },
                                { name: 'Titan Tối Giản', val: 'linear-gradient(to right, #334155, #0f172a)' },
                                { name: 'Đen Obsidian', val: '#1e293b' }
                            ].map(item => (
                                <button
                                    key={item.name}
                                    type="button"
                                    onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.bg]: item.val })}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white text-left transition-all border border-white/20 shadow-xs hover:scale-105 cursor-pointer truncate",
                                        currentBg === item.val && "ring-2 ring-emerald-400"
                                    )}
                                    style={{ background: item.val }}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                    {quickBgColors.map((col, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.bg]: col })}
                            className={cn(
                                "w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer shadow-xs",
                                currentBg === col ? "border-emerald-500 scale-110 ring-2 ring-emerald-500/30" : "border-black/10"
                            )}
                            style={{ backgroundColor: col }}
                            title={col}
                        />
                    ))}

                    <div className="flex items-center gap-1.5 pl-2 border-l border-black/10 dark:border-white/10">
                        <input
                            type="color"
                            value={currentBg.startsWith('#') ? currentBg : '#2d5016'}
                            onChange={(e) => {
                                const rgba = hexToRgba(e.target.value, 0.25);
                                onChangeConfig({ ...currentConfig, [fieldNames.bg]: rgba || e.target.value });
                            }}
                            className="w-7 h-7 rounded-lg cursor-pointer border border-black/10 bg-transparent p-0"
                            title="Chọn màu nền tự do"
                        />
                        <input
                            type="text"
                            placeholder="rgba / #hex..."
                            value={currentBg !== 'default' ? currentBg : ''}
                            onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.bg]: e.target.value })}
                            className="w-28 px-2 py-1 text-[11px] font-mono font-bold rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* TEXT & ICON COLOR SETTINGS */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <Tag size={14} className="text-emerald-600" />
                        Màu Chữ & Biểu Tượng (Text & Icon Color)
                    </span>
                    <div className="flex items-center gap-2">
                        {currentText !== 'default' && (
                            <button
                                type="button"
                                onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.text]: 'default' })}
                                className="text-[10px] text-rose-500 hover:underline font-bold"
                            >
                                Về mặc định
                            </button>
                        )}
                        <div className="w-5 h-5 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: currentText !== 'default' ? currentText : '#1b340d' }} />
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {quickTextColors.map((col) => (
                        <button
                            key={col}
                            type="button"
                            onClick={() => onChangeConfig({ ...currentConfig, [fieldNames.text]: col })}
                            className={cn(
                                "w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer shadow-xs",
                                currentText === col ? "border-emerald-500 scale-110 ring-2 ring-emerald-500/30" : "border-black/10"
                            )}
                            style={{ backgroundColor: col }}
                            title={col}
                        />
                    ))}

                    <div className="flex items-center gap-1.5 pl-2 border-l border-black/10 dark:border-white/10">
                        <input
                            type="color"
                            value={currentText !== 'default' ? currentText : '#1b340d'}
                            onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.text]: e.target.value })}
                            className="w-7 h-7 rounded-lg cursor-pointer border border-black/10 bg-transparent p-0"
                            title="Chọn màu chữ tự do"
                        />
                        <input
                            type="text"
                            placeholder="#hex..."
                            value={currentText !== 'default' ? currentText : ''}
                            onChange={(e) => onChangeConfig({ ...currentConfig, [fieldNames.text]: e.target.value })}
                            className="w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* SHADOW / GLOW TOGGLE */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <div>
                    <div className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Hiệu Ứng Đổ Bóng Viền (Border Shadow)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tạo bóng đổ nhẹ theo màu viền giúp các badge nổi khối 3D rõ nét
                    </div>
                </div>

                <input
                    type="checkbox"
                    checked={enableShadow}
                    onChange={(e) => onChangeConfig({ ...currentConfig, badgeEnableShadow: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
            </div>
        </div>
    );
}
