import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Check, Sparkles, RefreshCw, Type, ExternalLink, Leaf } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { GOOGLE_FONTS_VIETNAMESE, loadGoogleFont } from '../lib/googleFonts';
import Portal from './Portal';

export default function GoogleFontPickerModal({
    isOpen,
    onClose,
    currentFont,
    onSelectFont
}) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [previewText, setPreviewText] = useState('Hóa đơn bán hàng - 123.456đ');
    const [loadingFont, setLoadingFont] = useState(null);

    const categories = ['All', 'Sans-serif', 'Serif', 'Display', 'Handwriting', 'Monospace'];

    const filteredFonts = useMemo(() => {
        return GOOGLE_FONTS_VIETNAMESE.filter(f => {
            const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
            const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
            return matchesSearch && matchesCat;
        });
    }, [search, selectedCategory]);

    // Preload visible fonts for instant preview in modal
    useEffect(() => {
        if (isOpen) {
            filteredFonts.slice(0, 50).forEach(f => {
                loadGoogleFont(f.name);
            });
        }
    }, [isOpen, filteredFonts]);

    if (!isOpen) return null;

    const handlePick = async (fontName) => {
        setLoadingFont(fontName);
        try {
            await loadGoogleFont(fontName);
            onSelectFont(fontName);
            onClose();
        } catch (e) {
            console.error('Error applying font:', e);
            onSelectFont(fontName);
            onClose();
        } finally {
            setLoadingFont(null);
        }
    };

    // Extract raw font name from string like "'Be Vietnam Pro', sans-serif"
    const currentCleanName = (currentFont || '').replace(/['"]/g, '').split(',')[0].trim();

    return (
        <Portal>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 font-sans">
                <m.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-[#faf8f3] dark:bg-[#0c140e] border border-[#8b6f47]/30 dark:border-white/10 w-full max-w-4xl h-[85vh] max-h-[750px] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 relative"
                >
                    {/* Header */}
                    <div className="p-5 px-6 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between bg-[#d4a574]/10 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white flex items-center justify-center shadow-sm">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#2d5016] dark:text-[#d4a574] flex items-center gap-2">
                                    Kho Google Fonts Tiếng Việt
                                </h3>
                                <p className="text-xs text-[#8b6f47] dark:text-slate-400 font-bold">
                                    Toàn bộ {GOOGLE_FONTS_VIETNAMESE.length} font chữ Google Fonts sắc nét, 100% chuẩn dấu Tiếng Việt
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-[#8b6f47]/10 hover:bg-[#8b6f47]/20 dark:bg-white/5 dark:hover:bg-white/10 text-[#8b6f47] dark:text-[#d4a574] flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Filters & Search Toolbar */}
                    <div className="p-4 px-6 border-b border-[#8b6f47]/10 dark:border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between bg-black/[0.02] dark:bg-white/[0.01]">
                        {/* Search Input */}
                        <div className="relative w-full md:w-72">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b6f47]/60" />
                            <input
                                type="text"
                                placeholder="Tìm tên font (VD: Playfair, Inter, Lobster...)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-transparent dark:bg-[#06140e] border border-[#8b6f47]/25 dark:border-white/10 rounded-xl text-xs font-black outline-none focus:border-[#2d5016] dark:focus:border-[#d4a574] transition-colors"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Preview Text Input */}
                        <div className="flex-1 w-full md:w-auto">
                            <input
                                type="text"
                                value={previewText}
                                onChange={(e) => setPreviewText(e.target.value)}
                                placeholder="Nhập nội dung gõ thử..."
                                className="w-full px-3.5 py-2 bg-transparent dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 rounded-xl text-xs font-bold text-[#2d5016] dark:text-white outline-none focus:border-[#2d5016] transition-colors italic"
                            />
                        </div>

                        {/* Category Tabs */}
                        <div className="flex bg-[#d4a574]/10 dark:bg-slate-800/20 p-1 rounded-xl border border-border overflow-x-auto max-w-full custom-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                        selectedCategory === cat
                                            ? 'bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-none'
                                            : 'text-[#8b6f47] hover:bg-[#d4a574]/15 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {cat === 'All' ? 'Tất cả' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Grid List */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {filteredFonts.map((font) => {
                                const isSelected = currentCleanName.toLowerCase() === font.name.toLowerCase();
                                const fontStack = `'${font.name}', sans-serif`;

                                return (
                                    <m.div
                                        key={font.name}
                                        whileHover={{ y: -2 }}
                                        onClick={() => handlePick(font.name)}
                                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${
                                            isSelected
                                                ? 'bg-[#2d5016]/10 border-[#2d5016] dark:border-[#4ade80] shadow-sm ring-2 ring-[#2d5016]/20'
                                                : 'bg-transparent dark:bg-slate-900/30 border-[#8b6f47]/20 dark:border-white/10 hover:border-[#2d5016] dark:hover:border-[#d4a574] hover:shadow-md'
                                        }`}
                                    >
                                        {/* Top Info */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                                    {font.name}
                                                </span>
                                                {isSelected && (
                                                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-black bg-[#2d5016] text-white rounded-md">
                                                        <Check size={10} strokeWidth={3} /> Đang dùng
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574] px-1.5 py-0.5 bg-[#8b6f47]/10 dark:bg-white/5 rounded-md">
                                                {font.category}
                                            </span>
                                        </div>

                                        {/* Live Preview Sample */}
                                        <div
                                            className="font-preview-sample py-3 px-1 my-1 text-slate-900 dark:text-slate-100 border-y border-[#8b6f47]/10 dark:border-white/5 min-h-[56px] flex items-center overflow-hidden"
                                            style={{ fontFamily: `'${font.name}', ${font.category === 'Serif' ? 'serif' : (font.category === 'Monospace' ? 'monospace' : (font.category === 'Handwriting' ? 'cursive' : 'sans-serif'))}` }}
                                        >
                                            <p className="font-preview-sample text-base truncate leading-snug w-full font-bold">
                                                {previewText || 'Hóa đơn bán hàng'}
                                            </p>
                                        </div>

                                        {/* Bottom action */}
                                        <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                                            <span className="text-[9px] text-[#8b6f47]/60">Google Fonts (VN)</span>
                                            <span className="text-[#2d5016] dark:text-[#4ade80] font-black group-hover:underline flex items-center gap-1">
                                                {loadingFont === font.name ? 'Đang nạp...' : 'Áp dụng font →'}
                                            </span>
                                        </div>
                                    </m.div>
                                );
                            })}
                        </div>

                        {filteredFonts.length === 0 && (
                            <div className="py-16 text-center text-[#8b6f47] flex flex-col items-center gap-2">
                                <Type size={32} className="opacity-40" />
                                <p className="text-sm font-black">Không tìm thấy font chữ nào phù hợp với từ khóa "{search}"</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Notice */}
                    <div className="p-3.5 px-6 border-t border-[#8b6f47]/15 dark:border-white/10 bg-[#d4a574]/10 dark:bg-white/[0.02] flex items-center justify-between text-[11px] text-[#8b6f47] dark:text-slate-400 font-bold">
                        <span>💡 Toàn bộ {GOOGLE_FONTS_VIETNAMESE.length} font chữ đều được nạp trực tiếp & hỗ trợ 100% Tiếng Việt.</span>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all"
                        >
                            Đóng
                        </button>
                    </div>
                </m.div>
            </div>
        </Portal>
    );
}
