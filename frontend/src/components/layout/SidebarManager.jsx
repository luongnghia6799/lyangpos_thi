import React, { useState, useEffect, useMemo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    RotateCcw, 
    Check, 
    Eye, 
    EyeOff, 
    Layers, 
    SlidersHorizontal, 
    Sparkles, 
    CheckCheck,
    XSquare,
    Info,
    Palette,
    Sun,
    Moon,
    Compass,
    RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
    DEFAULT_NAV_SECTIONS, 
    NAV_PRESETS, 
    getStoredHiddenPaths, 
    setStoredHiddenPaths,
    SIDEBAR_GRADIENT_PRESETS,
    DEFAULT_SIDEBAR_STYLE,
    getStoredSidebarStyle,
    setStoredSidebarStyle
} from '../../lib/navConfig';

export default function SidebarManager({ onToast, onUpdateSetting }) {
    const [hiddenPaths, setHiddenPaths] = useState(() => getStoredHiddenPaths());
    const [sidebarStyle, setSidebarStyle] = useState(() => getStoredSidebarStyle());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const handleSync = () => {
            setHiddenPaths(getStoredHiddenPaths());
        };
        const handleStyleSync = () => {
            setSidebarStyle(getStoredSidebarStyle());
        };
        window.addEventListener('sidebar_visibility_changed', handleSync);
        window.addEventListener('sidebar_style_changed', handleStyleSync);
        window.addEventListener('storage', handleSync);
        window.addEventListener('storage', handleStyleSync);
        return () => {
            window.removeEventListener('sidebar_visibility_changed', handleSync);
            window.removeEventListener('sidebar_style_changed', handleStyleSync);
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('storage', handleStyleSync);
        };
    }, []);

    const allItems = useMemo(() => {
        const list = [];
        DEFAULT_NAV_SECTIONS.forEach(sec => {
            sec.items.forEach(item => {
                list.push({ ...item, sectionId: sec.id, sectionLabel: sec.label });
            });
        });
        return list;
    }, []);

    const totalCount = allItems.length;
    const hiddenCount = hiddenPaths.length;
    const visibleCount = totalCount - hiddenCount;

    const updateSidebarStyle = (updates, toastMsg) => {
        const next = { ...sidebarStyle, ...updates };
        setSidebarStyle(next);
        setStoredSidebarStyle(next);
        if (onUpdateSetting) {
            onUpdateSetting('sidebar_custom_style', JSON.stringify(next));
        }
        if (onToast && toastMsg) {
            onToast({ message: toastMsg, type: 'success' });
        }
    };

    const handleToggleSidebarColor = (enabled) => {
        updateSidebarStyle({ enabled }, enabled ? 'Đã bật màu sắc tùy chỉnh cho Sidebar' : 'Đã tắt màu tùy chỉnh (dùng nền trong suốt mặc định)');
    };

    const handleApplyGradientPreset = (preset) => {
        updateSidebarStyle({
            enabled: true,
            color1: preset.color1,
            color2: preset.color2,
            angle: preset.angle,
            isLightText: preset.isLightText
        }, `Đã áp dụng dải màu: ${preset.label}`);
    };

    const handleResetSidebarStyle = () => {
        updateSidebarStyle(DEFAULT_SIDEBAR_STYLE, 'Đã khôi phục cài đặt màu sắc Sidebar ban đầu');
    };

    const applyPaths = (nextPaths, toastMsg) => {
        setHiddenPaths(nextPaths);
        setStoredHiddenPaths(nextPaths);
        if (onUpdateSetting) {
            onUpdateSetting('sidebar_hidden_items', JSON.stringify(nextPaths));
        }
        if (onToast && toastMsg) {
            onToast({ message: toastMsg, type: 'success' });
        }
    };

    const toggleItem = (path) => {
        const isHidden = hiddenPaths.includes(path);
        let next;
        if (isHidden) {
            next = hiddenPaths.filter(p => p !== path);
        } else {
            next = [...hiddenPaths, path];
        }
        applyPaths(next, isHidden ? `Đã hiển thị trang trên Sidebar` : `Đã ẩn trang khỏi Sidebar`);
    };

    const toggleSection = (section) => {
        const sectionPaths = section.items.map(i => i.path);
        const allSectionHidden = sectionPaths.every(p => hiddenPaths.includes(p));

        let next;
        if (allSectionHidden) {
            // Unhide all in this section
            next = hiddenPaths.filter(p => !sectionPaths.includes(p));
            applyPaths(next, `Đã hiển thị toàn bộ mục thuộc nhóm ${section.label}`);
        } else {
            // Hide all in this section
            const combined = new Set([...hiddenPaths, ...sectionPaths]);
            next = Array.from(combined);
            applyPaths(next, `Đã ẩn toàn bộ mục thuộc nhóm ${section.label}`);
        }
    };

    const applyPreset = (preset) => {
        applyPaths(preset.hiddenPaths, `Đã áp dụng mẫu: ${preset.label}`);
    };

    const filteredSections = useMemo(() => {
        return DEFAULT_NAV_SECTIONS.map(section => {
            if (selectedCategory !== 'all' && section.id !== selectedCategory) {
                return null;
            }

            const items = section.items.filter(item => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase().trim();
                return (
                    item.label.toLowerCase().includes(q) ||
                    item.path.toLowerCase().includes(q) ||
                    (item.desc && item.desc.toLowerCase().includes(q))
                );
            });

            if (items.length === 0) return null;

            return {
                ...section,
                items
            };
        }).filter(Boolean);
    }, [searchQuery, selectedCategory]);

    return (
        <div className="space-y-6">
            {/* Sidebar Color & Gradient Customizer Card */}
            <div className="bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/80 text-white p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-md">
                {/* Decorative glow */}
                <div 
                    className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-500"
                    style={{
                        background: sidebarStyle.enabled 
                            ? `linear-gradient(${sidebarStyle.angle}deg, ${sidebarStyle.color1}, ${sidebarStyle.color2})` 
                            : 'linear-gradient(135deg, #10b981, #065f46)'
                    }}
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div 
                            className="p-3 rounded-2xl border shadow-inner transition-all duration-300"
                            style={{
                                background: sidebarStyle.enabled 
                                    ? `linear-gradient(${sidebarStyle.angle}deg, ${sidebarStyle.color1}, ${sidebarStyle.color2})`
                                    : 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <Palette size={22} className="text-white drop-shadow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black uppercase tracking-tight text-white">
                                    Màu sắc & Dải màu Gradient Sidebar
                                </h3>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all",
                                    sidebarStyle.enabled 
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                                        : "bg-white/10 text-white/50 border-white/10"
                                )}>
                                    {sidebarStyle.enabled ? 'Đang bật màu riêng' : 'Mặc định (Trong suốt)'}
                                </span>
                            </div>
                            <p className="text-[9.5px] font-bold text-white/60 mt-0.5 uppercase tracking-wide">
                                Tùy chỉnh màu nền cho thanh menu bên trái với dải màu Gradient chuyển sắc sống động
                            </p>
                        </div>
                    </div>

                    {/* Master Switch */}
                    <div className="flex items-center gap-3 bg-white/10 p-1.5 pl-3.5 pr-2 rounded-2xl border border-white/10 shadow-inner">
                        <span className="text-xs font-black uppercase tracking-wider text-white/90">
                            {sidebarStyle.enabled ? 'Bật màu Sidebar' : 'Tắt màu (Nền gốc)'}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleToggleSidebarColor(!sidebarStyle.enabled)}
                            className={cn(
                                "h-7 rounded-full p-1 transition-all duration-300 relative focus:outline-none",
                                sidebarStyle.enabled ? "bg-emerald-500 shadow-md shadow-emerald-500/40" : "bg-white/20"
                            )}
                            style={{ width: '3.25rem' }}
                        >
                            <m.div
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={cn(
                                    "w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center",
                                    sidebarStyle.enabled ? "ml-auto" : "ml-0"
                                )}
                            >
                                {sidebarStyle.enabled && <Check size={12} className="text-emerald-700 stroke-[3]" />}
                            </m.div>
                        </button>
                    </div>
                </div>

                {/* Settings Panel (Visible only when enabled) */}
                <AnimatePresence>
                    {sidebarStyle.enabled && (
                        <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4 pt-3 border-t border-white/10 relative z-10 overflow-hidden"
                        >
                            {/* Live mini preview bar */}
                            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 shrink-0">
                                        Xem trước dải màu:
                                    </span>
                                    <div 
                                        className="h-9 flex-1 sm:w-64 rounded-xl border border-white/20 shadow-inner flex items-center justify-center px-4 transition-all duration-300"
                                        style={{
                                            background: `linear-gradient(${sidebarStyle.angle}deg, ${sidebarStyle.color1}, ${sidebarStyle.color2})`,
                                            color: sidebarStyle.isLightText ? '#ffffff' : '#0f172a'
                                        }}
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-wider drop-shadow-sm flex items-center gap-1.5">
                                            <Sparkles size={13} /> LyangPOS Menu
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    {/* Text lightness toggle */}
                                    <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-[10px] font-black uppercase">
                                        <button
                                            type="button"
                                            onClick={() => updateSidebarStyle({ isLightText: true })}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all",
                                                sidebarStyle.isLightText ? "bg-white text-slate-900 shadow-sm font-black" : "text-white/60 hover:text-white"
                                            )}
                                            title="Chữ sáng (dùng cho màu nền tối)"
                                        >
                                            <Sun size={12} /> Chữ sáng
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateSidebarStyle({ isLightText: false })}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all",
                                                !sidebarStyle.isLightText ? "bg-slate-900 text-white shadow-sm font-black" : "text-white/60 hover:text-white"
                                            )}
                                            title="Chữ tối (dùng cho màu nền sáng)"
                                        >
                                            <Moon size={12} /> Chữ tối
                                        </button>
                                    </div>

                                    {/* Reset button */}
                                    <button
                                        type="button"
                                        onClick={handleResetSidebarStyle}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl border border-white/10 transition-all text-xs flex items-center gap-1"
                                        title="Khôi phục mặc định"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Preset Gradients Grid */}
                            <div>
                                <div className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Sparkles size={12} /> Chọn nhanh bộ phối màu Gradient:
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {SIDEBAR_GRADIENT_PRESETS.map((preset) => {
                                        const isSelected = 
                                            sidebarStyle.color1.toLowerCase() === preset.color1.toLowerCase() &&
                                            sidebarStyle.color2.toLowerCase() === preset.color2.toLowerCase();
                                        return (
                                            <m.button
                                                key={preset.id}
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => handleApplyGradientPreset(preset)}
                                                className={cn(
                                                    "p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 shadow-sm group",
                                                    isSelected ? "border-white ring-2 ring-emerald-400 shadow-emerald-500/20" : "border-white/10 hover:border-white/30"
                                                )}
                                                style={{
                                                    background: `linear-gradient(${preset.angle}deg, ${preset.color1}, ${preset.color2})`,
                                                    color: preset.isLightText ? '#ffffff' : '#0f172a'
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-[11px] font-black uppercase tracking-wider drop-shadow-sm line-clamp-1">
                                                        {preset.label}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="p-0.5 bg-white text-slate-900 rounded-full shadow-sm shrink-0">
                                                            <Check size={10} className="stroke-[3]" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[8.5px] font-bold opacity-80 uppercase tracking-tight flex items-center gap-1 mt-auto">
                                                    <span className="w-2 h-2 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: preset.color1 }} />
                                                    <span className="w-2 h-2 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: preset.color2 }} />
                                                    <span>{preset.angle}°</span>
                                                </div>
                                            </m.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Color Pickers & Angle Slider */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                {/* Color 1 Picker */}
                                <div className="space-y-1.5">
                                    <label className="text-[9.5px] font-black uppercase tracking-widest text-white/70 block">
                                        1. Màu bắt đầu (Color 1):
                                    </label>
                                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                                        <input
                                            type="color"
                                            value={sidebarStyle.color1}
                                            onChange={(e) => updateSidebarStyle({ color1: e.target.value })}
                                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={sidebarStyle.color1}
                                            onChange={(e) => updateSidebarStyle({ color1: e.target.value })}
                                            className="bg-transparent font-mono text-xs font-black text-white uppercase outline-none w-24"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>

                                {/* Color 2 Picker */}
                                <div className="space-y-1.5">
                                    <label className="text-[9.5px] font-black uppercase tracking-widest text-white/70 block">
                                        2. Màu kết thúc (Color 2):
                                    </label>
                                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                                        <input
                                            type="color"
                                            value={sidebarStyle.color2}
                                            onChange={(e) => updateSidebarStyle({ color2: e.target.value })}
                                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                        />
                                        <input
                                            type="text"
                                            value={sidebarStyle.color2}
                                            onChange={(e) => updateSidebarStyle({ color2: e.target.value })}
                                            className="bg-transparent font-mono text-xs font-black text-white uppercase outline-none w-24"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>

                                {/* Angle Adjuster */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[9.5px] font-black uppercase tracking-widest text-white/70">
                                        <span className="flex items-center gap-1"><Compass size={12} /> Góc xoay Gradient:</span>
                                        <span className="font-mono text-emerald-400">{sidebarStyle.angle}°</span>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            step="5"
                                            value={sidebarStyle.angle}
                                            onChange={(e) => updateSidebarStyle({ angle: parseInt(e.target.value, 10) || 0 })}
                                            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
                                        />
                                        <div className="flex items-center justify-between gap-1">
                                            {[90, 135, 180, 225, 270].map((deg) => (
                                                <button
                                                    key={deg}
                                                    type="button"
                                                    onClick={() => updateSidebarStyle({ angle: deg })}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all",
                                                        sidebarStyle.angle === deg 
                                                            ? "bg-emerald-500 text-slate-950 font-black" 
                                                            : "bg-white/10 text-white/60 hover:text-white"
                                                    )}
                                                >
                                                    {deg}°
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Header with Stats & Presets */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/5 dark:from-emerald-950/40 dark:via-slate-900/40 dark:to-teal-950/20 p-5 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/15 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <Layers size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-800 dark:text-emerald-200 uppercase tracking-tight">
                                    Tùy biến Ẩn / Hiện Menu Sidebar
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                                    {visibleCount}/{totalCount} Đang hiện
                                </span>
                            </div>
                            <p className="text-[9.5px] font-bold text-gray-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide">
                                Tắt các mục không dùng tới để thanh bên gọn gàng và dễ thao tác nhất
                            </p>
                        </div>
                    </div>

                    {/* Quick Stat Pill */}
                    <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-emerald-900/10 dark:border-slate-800">
                        <div className="px-3 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Eye size={13} />
                            <span>{visibleCount} Trang hiện</span>
                        </div>
                        <div className="px-3 py-1 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <EyeOff size={13} />
                            <span>{hiddenCount} Đã ẩn</span>
                        </div>
                    </div>
                </div>

                {/* Presets Row */}
                <div className="pt-2 border-t border-emerald-500/10 dark:border-white/5">
                    <div className="text-[9px] font-black text-gray-400 dark:text-emerald-400/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-500" /> Cấu hình mẫu nhanh (Presets):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {NAV_PRESETS.map((preset) => {
                            const isCurrent = (
                                preset.hiddenPaths.length === hiddenPaths.length &&
                                preset.hiddenPaths.every(p => hiddenPaths.includes(p))
                            );
                            const PresetIcon = preset.icon;
                            return (
                                <m.button
                                    key={preset.id}
                                    type="button"
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => applyPreset(preset)}
                                    className={cn(
                                        "p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between",
                                        isCurrent
                                            ? "bg-[#2d5016] dark:bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/30"
                                            : "bg-white/70 dark:bg-slate-900/70 hover:bg-emerald-50/50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            {PresetIcon && (
                                                <div className={cn(
                                                    "p-1.5 rounded-lg flex items-center justify-center shrink-0",
                                                    isCurrent
                                                        ? "bg-white/20 text-white"
                                                        : "bg-emerald-100/60 dark:bg-emerald-900/40 text-[#2d5016] dark:text-emerald-400"
                                                )}>
                                                    {typeof PresetIcon === 'string' ? (
                                                        <span className="text-sm leading-none">{PresetIcon}</span>
                                                    ) : (
                                                        <PresetIcon size={15} />
                                                    )}
                                                </div>
                                            )}
                                            <span className="text-xs font-black uppercase tracking-wider">{preset.label}</span>
                                        </div>
                                        {isCurrent && (
                                            <span className="p-0.5 bg-white/20 rounded-full">
                                                <Check size={12} className="text-white stroke-[3]" />
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "text-[8.5px] font-bold uppercase tracking-wider line-clamp-2 mt-0.5",
                                        isCurrent ? "text-white/80" : "text-gray-400 dark:text-slate-400"
                                    )}>
                                        {preset.desc}
                                    </p>
                                </m.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm trang theo tên hoặc đường dẫn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
                            selectedCategory === 'all'
                                ? "bg-[#2d5016] dark:bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        )}
                    >
                        Tất cả ({totalCount})
                    </button>
                    {DEFAULT_NAV_SECTIONS.map(sec => {
                        const secItemCount = sec.items.length;
                        const secHiddenCount = sec.items.filter(i => hiddenPaths.includes(i.path)).length;
                        const isSelected = selectedCategory === sec.id;
                        return (
                            <button
                                key={sec.id}
                                type="button"
                                onClick={() => setSelectedCategory(sec.id)}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5",
                                    isSelected
                                        ? "bg-[#2d5016] dark:bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                )}
                            >
                                <span>{sec.label}</span>
                                <span className={cn(
                                    "text-[9px] px-1.5 py-0.2 rounded-full",
                                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-gray-500"
                                )}>
                                    {secItemCount - secHiddenCount}/{secItemCount}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sections & Items Grid */}
            <div className="space-y-4">
                {filteredSections.map((section) => {
                    const sectionPaths = section.items.map(i => i.path);
                    const allSectionHidden = sectionPaths.every(p => hiddenPaths.includes(p));
                    const sectionHiddenCount = section.items.filter(i => hiddenPaths.includes(i.path)).length;
                    const sectionVisibleCount = section.items.length - sectionHiddenCount;

                    return (
                        <div
                            key={section.id}
                            className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-sm"
                        >
                            {/* Section Header */}
                            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                        {section.label}
                                    </h4>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                        ({sectionVisibleCount}/{section.items.length} hiển thị)
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(section)}
                                        className="px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1"
                                    >
                                        {allSectionHidden ? (
                                            <>
                                                <Eye size={12} /> Hiện toàn bộ nhóm
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff size={12} /> Ẩn toàn bộ nhóm
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Items Grid */}
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {section.items.map((item) => {
                                    const isHidden = hiddenPaths.includes(item.path);
                                    const ItemIcon = item.icon;

                                    return (
                                        <m.div
                                            key={item.path}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className={cn(
                                                "p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 select-none",
                                                isHidden
                                                    ? "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60"
                                                    : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-emerald-500/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "p-2 rounded-xl shrink-0 transition-colors",
                                                    isHidden
                                                        ? "bg-slate-200/50 dark:bg-slate-800 text-gray-400 dark:text-slate-600"
                                                        : "bg-emerald-500/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400"
                                                )}>
                                                    <ItemIcon size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn(
                                                            "text-xs font-black uppercase tracking-tight truncate",
                                                            isHidden ? "text-gray-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-200"
                                                        )}>
                                                            {item.label}
                                                        </span>
                                                        {item.badge && (
                                                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] font-mono text-gray-400 dark:text-slate-500 truncate mt-0.5">
                                                        {item.path}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Toggle Button */}
                                            <button
                                                type="button"
                                                onClick={() => toggleItem(item.path)}
                                                className={cn(
                                                    "p-2 rounded-xl transition-all shrink-0 flex items-center justify-center border",
                                                    isHidden
                                                        ? "bg-slate-200/60 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-600 hover:border-emerald-500/30 border-transparent"
                                                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-600 hover:border-rose-500/30"
                                                )}
                                                title={isHidden ? "Bấm để HIỆN trang này" : "Bấm để ẨN trang này"}
                                            >
                                                {isHidden ? (
                                                    <EyeOff size={15} />
                                                ) : (
                                                    <Eye size={15} />
                                                )}
                                            </button>
                                        </m.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {filteredSections.length === 0 && (
                    <div className="p-8 text-center bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Không tìm thấy trang nào khớp với từ khóa "{searchQuery}"
                        </p>
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="mt-3 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider underline"
                        >
                            Xóa bộ lọc tìm kiếm
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Tip */}
            <div className="flex items-start gap-2.5 p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-800 dark:text-blue-300">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div className="text-[9.5px] font-bold leading-relaxed uppercase tracking-wider">
                    Ghi chú: Việc ẩn trang chỉ làm gọn thanh Sidebar bên trái. Bạn vẫn có thể dùng phím tắt <span className="font-mono font-black text-blue-900 dark:text-blue-200">Ctrl + G</span> để tìm kiếm và truy cập nhanh bất kỳ trang nào bất cứ lúc nào!
                </div>
            </div>
        </div>
    );
}
