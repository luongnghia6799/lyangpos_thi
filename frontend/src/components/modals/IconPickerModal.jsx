import React, { useState, useMemo } from 'react';
import { Search, X, Check, Sparkles, RotateCcw } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { POPULAR_ICONS, getLucideIconComponent } from '../../lib/iconConfig';
import Portal from '../widgets/Portal';
import { cn } from '../../lib/utils';

export default function IconPickerModal({
    isOpen,
    onClose,
    target, // { id: string, label: string, currentIconName?: string }
    onSelectIcon,
    onResetIcon
}) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = useMemo(() => {
        const set = new Set(POPULAR_ICONS.map(i => i.category));
        return ['All', ...Array.from(set)];
    }, []);

    const filteredIcons = useMemo(() => {
        const query = search.trim().toLowerCase();
        return POPULAR_ICONS.filter(item => {
            const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
            if (!matchesCat) return false;
            if (!query) return true;
            return item.name.toLowerCase().includes(query) || item.label.toLowerCase().includes(query);
        });
    }, [search, selectedCategory]);

    if (!isOpen || !target) return null;

    const currentName = target.currentIconName;

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Box */}
                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden z-10"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black uppercase tracking-tight text-slate-800 dark:text-white">
                                            Chọn Icon Thay Thế
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            Đang sửa vị trí: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{target.label || target.id}</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {onResetIcon && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onResetIcon(target.id);
                                                onClose();
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                            title="Khôi phục lại icon mặc định"
                                        >
                                            <RotateCcw size={13} />
                                            <span>Mặc định</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Search and Category Filter */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm kiếm icon (VD: Home, Cart, Tiền, Kho, Thêm...)"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent focus:border-emerald-500 transition-all"
                                        autoFocus
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Category pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                    {categories.map((cat) => {
                                        const isSelected = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer",
                                                    isSelected
                                                        ? "bg-[#2d5016] dark:bg-emerald-600 text-white border-transparent shadow-xs"
                                                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100"
                                                )}
                                            >
                                                {cat === 'All' ? 'Tất cả' : cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Icon Grid */}
                            <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                                {filteredIcons.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                        <Search size={36} className="opacity-30 mb-2" />
                                        <p className="text-sm font-bold">Không tìm thấy icon phù hợp</p>
                                        <p className="text-xs text-slate-400 mt-1">Hãy thử tìm theo tiếng Anh hoặc tên chuyên môn</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                        {filteredIcons.map((item) => {
                                            const IconComp = getLucideIconComponent(item.name);
                                            if (!IconComp) return null;
                                            const isCurrent = currentName === item.name;

                                            return (
                                                <button
                                                    key={item.name}
                                                    type="button"
                                                    onClick={() => {
                                                        onSelectIcon(target.id, item.name);
                                                        onClose();
                                                    }}
                                                    className={cn(
                                                        "group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 cursor-pointer text-center",
                                                        isCurrent
                                                            ? "bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-500 text-[#2d5016] dark:text-emerald-300 shadow-sm"
                                                            : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-slate-800 hover:border-emerald-500/40 hover:scale-[1.04]"
                                                    )}
                                                >
                                                    {isCurrent && (
                                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                            <Check size={10} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        <IconComp size={24} />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full mt-1">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate w-full">
                                                        {item.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                <span className="font-medium">
                                    Có <strong className="text-slate-700 dark:text-slate-300">{filteredIcons.length}</strong> icon khả dụng
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    Bấm vào icon bất kỳ để áp dụng ngay lập tức
                                </span>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
