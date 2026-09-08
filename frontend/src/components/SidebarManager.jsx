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
    Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
    DEFAULT_NAV_SECTIONS, 
    NAV_PRESETS, 
    getStoredHiddenPaths, 
    setStoredHiddenPaths 
} from '../lib/navConfig';

export default function SidebarManager({ onToast, onUpdateSetting }) {
    const [hiddenPaths, setHiddenPaths] = useState(() => getStoredHiddenPaths());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const handleSync = () => {
            setHiddenPaths(getStoredHiddenPaths());
        };
        window.addEventListener('sidebar_visibility_changed', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('sidebar_visibility_changed', handleSync);
            window.removeEventListener('storage', handleSync);
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
                                ? "bg-[#2d5016] text-white border-[#2d5016] dark:bg-emerald-600 dark:border-emerald-500 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800"
                        )}
                    >
                        Tất cả ({totalCount})
                    </button>
                    {DEFAULT_NAV_SECTIONS.map(sec => (
                        <button
                            key={sec.id}
                            type="button"
                            onClick={() => setSelectedCategory(sec.id)}
                            className={cn(
                                "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
                                selectedCategory === sec.id
                                    ? "bg-[#2d5016] text-white border-[#2d5016] dark:bg-emerald-600 dark:border-emerald-500 shadow-sm"
                                    : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800"
                            )}
                        >
                            {sec.label} ({sec.items.length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Sections and Items List */}
            <div className="space-y-6">
                {filteredSections.map(section => {
                    const sectionPaths = section.items.map(i => i.path);
                    const allSectionHidden = sectionPaths.every(p => hiddenPaths.includes(p));
                    const sectionVisibleCount = section.items.filter(i => !hiddenPaths.includes(i.path)).length;

                    return (
                        <div 
                            key={section.id} 
                            className="bg-white/40 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm"
                        >
                            {/* Section Header with Bulk Action */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        <Layers size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                            {section.label}
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 lowercase">
                                                ({sectionVisibleCount}/{section.items.length} đang bật)
                                            </span>
                                        </h4>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => toggleSection(section)}
                                    className="text-[9px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors border border-emerald-500/20 flex items-center gap-1.5"
                                >
                                    {allSectionHidden ? (
                                        <>
                                            <CheckCheck size={12} /> Bật cả nhóm
                                        </>
                                    ) : (
                                        <>
                                            <XSquare size={12} /> Ẩn cả nhóm
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Item Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {section.items.map(item => {
                                    const isHidden = hiddenPaths.includes(item.path);
                                    const isVisible = !isHidden;
                                    const IconComponent = item.icon;

                                    return (
                                        <m.div
                                            key={item.path}
                                            whileHover={{ y: -1 }}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 select-none",
                                                isVisible
                                                    ? "bg-white dark:bg-slate-900 border-emerald-500/30 dark:border-emerald-500/20 shadow-sm"
                                                    : "bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-90"
                                            )}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 border",
                                                    isVisible
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-sm"
                                                        : "bg-slate-200/60 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700"
                                                )}>
                                                    <IconComponent size={18} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate">
                                                            {item.label}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                                                            {item.path}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-slate-400 mt-1 uppercase tracking-wider truncate">
                                                        {item.desc || 'Chức năng hệ thống'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Toggle Switch */}
                                            <button
                                                type="button"
                                                onClick={() => toggleItem(item.path)}
                                                className={cn(
                                                    "relative w-11 h-6 rounded-full transition-all duration-300 outline-none shrink-0 border",
                                                    isVisible 
                                                        ? "bg-[#2d5016] dark:bg-emerald-600 border-emerald-500/40 shadow-sm" 
                                                        : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                                )}
                                                title={isVisible ? "Bấm để ẩn khỏi Sidebar" : "Bấm để hiện lên Sidebar"}
                                            >
                                                <div className={cn(
                                                    "absolute top-[2px] left-[2px] w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md flex items-center justify-center",
                                                    isVisible ? "translate-x-[20px]" : "translate-x-0"
                                                )}>
                                                    {isVisible ? (
                                                        <Check size={10} className="text-emerald-700 stroke-[3]" />
                                                    ) : (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                    )}
                                                </div>
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
