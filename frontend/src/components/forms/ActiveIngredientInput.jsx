import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, Tag, Edit2, Edit3, Check, ChevronDown, Trash2, BookmarkCheck } from 'lucide-react';
import {
    POPULAR_ACTIVE_INGREDIENTS,
    CATEGORY_LABELS,
    parseActiveIngredients,
    stringifyActiveIngredients,
    extractActiveIngredientsFromProducts,
    getCustomActiveIngredients,
    saveCustomActiveIngredient,
    updateCustomActiveIngredient,
    removeCustomActiveIngredient
} from '../../data/activeIngredientsData';

export default function ActiveIngredientInput({
    value = '',
    onChange,
    existingProducts = [],
    className = '',
    placeholder = 'Nhập hoặc chọn hoạt chất (VD: Difenoconazole)...',
    direction = 'up',
    compact = false
}) {
    // Mode: 'chips' (thẻ thông minh) hoặc 'text' (văn bản thuần)
    const [mode, setMode] = useState('chips');
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editTagValue, setEditTagValue] = useState('');
    const [inlineEditingIng, setInlineEditingIng] = useState(null); // { name, editVal }
    const [resolvedDirection, setResolvedDirection] = useState(direction);
    const [customIngredients, setCustomIngredients] = useState(() => getCustomActiveIngredients());
    const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 380 });

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);

    // Tính toán tọa độ hiển thị Dropdown dạng Portal trên document.body
    const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldUp = direction === 'auto'
            ? (spaceBelow < 280 && rect.top > 280)
            : (direction === 'up');

        setResolvedDirection(shouldUp ? 'up' : 'down');

        const targetWidth = Math.max(rect.width, 380);
        let left = rect.left;
        if (left + targetWidth > window.innerWidth - 12) {
            left = Math.max(12, window.innerWidth - targetWidth - 12);
        }

        setCoords({
            top: rect.bottom,
            bottom: window.innerHeight - rect.top,
            left: Math.max(8, left),
            width: targetWidth
        });
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
        }
    }, [isOpen, direction]);

    // Đóng dropdown khi cuộn trang (ngoại trừ khi đang cuộn bên trong danh sách dropdown)
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = (e) => {
            if (e && e.target && (e.target.closest?.('.active-ingredient-dropdown') || dropdownRef.current?.contains(e.target))) {
                return;
            }
            setIsOpen(false);
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    // Cuộn tự động mục đang highlight trong dropdown
    useEffect(() => {
        if (isOpen && listRef.current) {
            const listEl = listRef.current;
            const activeEl = listEl.children[highlightedIndex];
            if (activeEl) {
                const listRect = listEl.getBoundingClientRect();
                const itemRect = activeEl.getBoundingClientRect();

                if (itemRect.top < listRect.top) {
                    listEl.scrollTop -= (listRect.top - itemRect.top) + 8;
                } else if (itemRect.bottom > listRect.bottom) {
                    listEl.scrollTop += (itemRect.bottom - listRect.bottom) + 8;
                }
            }
        }
    }, [highlightedIndex, isOpen]);

    // Danh sách tag hiện tại từ props value
    const tags = useMemo(() => parseActiveIngredients(value), [value]);

    // Trích xuất các hoạt chất đã dùng từ danh sách sản phẩm hiện tại của cửa hàng
    const storeIngredients = useMemo(() => {
        return extractActiveIngredientsFromProducts(existingProducts);
    }, [existingProducts]);

    // Tổng hợp toàn bộ danh mục (từ điển chuẩn + hoạt chất tự học từ DB + hoạt chất tự tạo trong máy)
    const fullIngredientList = useMemo(() => {
        const knownNames = new Set(POPULAR_ACTIVE_INGREDIENTS.map(i => i.name.toLowerCase()));
        const list = [...POPULAR_ACTIVE_INGREDIENTS];

        // 1. Gộp hoạt chất tự học từ danh mục sản phẩm hiện có
        storeIngredients.forEach(name => {
            if (!knownNames.has(name.toLowerCase())) {
                list.push({
                    name,
                    category: 'custom',
                    aliases: [name.toLowerCase()],
                    isCustom: true
                });
                knownNames.add(name.toLowerCase());
            }
        });

        // 2. Gộp hoạt chất người dùng tự gõ thêm đã lưu trong máy
        customIngredients.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            if (itemName && !knownNames.has(itemName.toLowerCase())) {
                list.push({
                    name: itemName,
                    category: 'custom',
                    aliases: [itemName.toLowerCase()],
                    isCustom: true
                });
                knownNames.add(itemName.toLowerCase());
            }
        });

        return list;
    }, [storeIngredients, customIngredients]);

    // Lọc gợi ý theo từ khóa và nhóm công dụng
    const filteredSuggestions = useMemo(() => {
        const query = inputValue.trim().toLowerCase();
        const selectedNames = new Set(tags.map(t => t.toLowerCase()));

        return fullIngredientList.filter(item => {
            if (selectedNames.has(item.name.toLowerCase())) return false;

            if (selectedCategory !== 'all' && item.category !== selectedCategory) {
                return false;
            }

            if (!query) return true;

            const nameMatch = item.name.toLowerCase().includes(query);
            const aliasMatch = item.aliases && item.aliases.some(a => a.toLowerCase().includes(query));
            return nameMatch || aliasMatch;
        }).slice(0, 30);
    }, [inputValue, selectedCategory, fullIngredientList, tags]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target) &&
                !dropdownRef.current?.contains(e.target) &&
                !e.target.closest?.('.active-ingredient-dropdown')
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlightedIndex khi danh sách lọc thay đổi
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredSuggestions]);

    const handleAddTag = (nameToAdd) => {
        const trimmed = (nameToAdd || inputValue).trim();
        if (!trimmed) return;

        // TỰ ĐỘNG GHI NHỚ VÀO BỘ NHỚ CỬA HÀNG: nếu chưa có trong từ điển chuẩn thì tự động lưu vĩnh viễn!
        const isStandard = POPULAR_ACTIVE_INGREDIENTS.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
        if (!isStandard) {
            const updated = saveCustomActiveIngredient(trimmed, 'custom');
            if (updated) setCustomIngredients(updated);
        }

        // Thêm vào danh sách tag hiện tại của sản phẩm
        if (!tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            const nextTags = [...tags, trimmed];
            onChange(stringifyActiveIngredients(nextTags));
        }
        setInputValue('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleDeleteCustom = (e, nameToDelete) => {
        e.stopPropagation();
        const updated = removeCustomActiveIngredient(nameToDelete);
        setCustomIngredients(updated || []);
    };

    const handleRemoveTag = (indexToRemove) => {
        const nextTags = tags.filter((_, idx) => idx !== indexToRemove);
        onChange(stringifyActiveIngredients(nextTags));
    };

    const handleStartEditTag = (index, currentVal) => {
        setEditingIndex(index);
        setEditTagValue(currentVal);
    };

    const handleSaveEditTag = (index) => {
        const trimmed = editTagValue.trim();
        const oldTag = tags[index];
        if (!trimmed) {
            handleRemoveTag(index);
        } else {
            const nextTags = [...tags];
            nextTags[index] = trimmed;
            onChange(stringifyActiveIngredients(nextTags));

            // Nếu sửa tên khác với ban đầu, cập nhật vào bộ nhớ hoạt chất tự tạo
            if (oldTag && oldTag.toLowerCase() !== trimmed.toLowerCase()) {
                const updated = updateCustomActiveIngredient(oldTag, trimmed);
                if (updated) setCustomIngredients(updated);
            }
        }
        setEditingIndex(null);
        setEditTagValue('');
    };

    const handleSaveInlineEdit = () => {
        if (!inlineEditingIng) return;
        const { name: oldName, editVal } = inlineEditingIng;
        const trimmedNew = editVal.trim();
        if (!trimmedNew || trimmedNew.toLowerCase() === oldName.toLowerCase()) {
            setInlineEditingIng(null);
            return;
        }

        const updated = updateCustomActiveIngredient(oldName, trimmedNew);
        setCustomIngredients(updated || getCustomActiveIngredients());

        // Nếu hoạt chất này đang nằm trong tags đã chọn, cập nhật tag luôn
        if (tags.some(t => t.toLowerCase() === oldName.toLowerCase())) {
            const nextTags = tags.map(t => (t.toLowerCase() === oldName.toLowerCase() ? trimmedNew : t));
            onChange(stringifyActiveIngredients(nextTags));
        }

        setInlineEditingIng(null);
    };

    const showCustomAdd = Boolean(inputValue.trim() && !fullIngredientList.some(i => i.name.toLowerCase() === inputValue.trim().toLowerCase()));
    const totalItems = filteredSuggestions.length + (showCustomAdd ? 1 : 0);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            const maxIdx = filteredSuggestions.length + (showCustomAdd ? 1 : 0) - 1;
            setHighlightedIndex(prev => (prev < maxIdx ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            const maxIdx = filteredSuggestions.length + (showCustomAdd ? 1 : 0) - 1;
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : maxIdx));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen && highlightedIndex < filteredSuggestions.length) {
                handleAddTag(filteredSuggestions[highlightedIndex].name);
            } else if (inputValue.trim()) {
                handleAddTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            handleRemoveTag(tags.length - 1);
        }
    };

    const getTagCategory = (tagName) => {
        const lower = tagName.toLowerCase();
        const found = fullIngredientList.find(i => lower.includes(i.name.toLowerCase()));
        return found ? found.category : 'custom';
    };

    return (
        <div ref={containerRef} className={`relative ${compact ? 'space-y-0' : 'space-y-1.5'} ${className}`}>
            {/* Thanh điều khiển phụ: Chuyển đổi Thẻ/Văn bản & Đếm số lượng (Ẩn khi compact trong bảng) */}
            {!compact && (
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-[#5c4028] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={13} className="text-[#2d5016] dark:text-emerald-400 animate-pulse" />
                            Hoạt chất & Thành phần
                        </span>
                        {tags.length > 0 && mode === 'chips' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#2d5016]/10 text-[#2d5016] dark:bg-emerald-500/20 dark:text-emerald-300 border border-[#2d5016]/20">
                                {tags.length} hoạt chất
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setMode(prev => prev === 'chips' ? 'text' : 'chips');
                            setIsOpen(false);
                        }}
                        className="text-[11px] font-bold text-[#2d5016] dark:text-emerald-400 hover:opacity-80 transition-opacity flex items-center gap-1.5 bg-[#2d5016]/10 dark:bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-[#2d5016]/20 dark:border-emerald-500/25"
                        title={mode === 'chips' ? 'Chuyển sang gõ chữ tự do' : 'Chuyển sang dạng thẻ chọn nhanh'}
                    >
                        {mode === 'chips' ? (
                            <>
                                <Edit3 size={11} />
                                <span>Gõ văn bản thuần</span>
                            </>
                        ) : (
                            <>
                                <Tag size={11} />
                                <span>Dạng thẻ gợi ý</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* CHẾ ĐỘ 1: VĂN BẢN THUẦN (Plain text mode) */}
            {mode === 'text' ? (
                <div className="relative flex items-center">
                    <input
                        type="text"
                        className={compact
                            ? "w-full py-1.5 pl-2.5 pr-8 font-bold text-xs rounded-xl bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/5 border border-stone-400/40 dark:border-white/10 hover:border-emerald-500/60 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 text-stone-900 dark:text-stone-100 outline-none transition-all"
                            : "w-full p-3 font-bold text-sm rounded-2xl bg-[#fcfbf9]/90 dark:bg-[#181e16] border-2 border-[#8b6f47]/30 dark:border-white/15 focus:border-[#2d5016] focus:ring-4 focus:ring-[#2d5016]/10 text-slate-900 dark:text-slate-100 outline-none transition-all shadow-xs"
                        }
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onBlur={e => {
                            const parts = parseActiveIngredients(e.target.value);
                            let updated = null;
                            parts.forEach(p => {
                                const clean = p.replace(/\s+\d+.*$/i, '').trim();
                                if (clean.length >= 3) {
                                    const res = saveCustomActiveIngredient(clean, 'custom');
                                    if (res) updated = res;
                                }
                            });
                            if (updated) setCustomIngredients(updated);
                        }}
                        placeholder={compact ? "VD: Difenoconazole + Propiconazole..." : "VD: Difenoconazole 250g/l + Propiconazole 150g/l"}
                        autoComplete="off"
                    />
                    {compact && (
                        <button
                            type="button"
                            onClick={() => setMode('chips')}
                            className="absolute right-2 p-1 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                            title="Chuyển sang dạng thẻ chọn nhanh"
                        >
                            <Tag size={13} />
                        </button>
                    )}
                    {!compact && (
                        <p className="text-[11px] text-[#8b6f47] dark:text-slate-400 mt-1 ml-1 font-medium">
                            * Mẹo: Các hoạt chất cách nhau bởi dấu <code className="font-mono font-bold text-[#2d5016] dark:text-emerald-400">+</code> hoặc dấu phẩy <code className="font-mono font-bold text-[#2d5016] dark:text-emerald-400">,</code>
                        </p>
                    )}
                </div>
            ) : (
                /* CHẾ ĐỘ 2: THẺ TAGS CHỌN NHANH & AUTOCOMPLETE */
                <div className={compact ? "space-y-0" : "space-y-2"}>
                    <div
                        onClick={() => {
                            updateCoords();
                            inputRef.current?.focus();
                        }}
                        className={compact
                            ? "min-h-[34px] px-2 py-1 bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/5 border border-stone-400/40 dark:border-white/10 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 focus-within:border-emerald-600 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/15 focus-within:bg-transparent rounded-xl flex flex-wrap items-center gap-1 transition-all cursor-text"
                            : "min-h-[48px] p-2 bg-[#fcfbf9]/90 dark:bg-[#181e16] border-2 border-[#8b6f47]/30 dark:border-white/15 focus-within:border-[#2d5016] dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-[#2d5016]/10 rounded-2xl flex flex-wrap items-center gap-1.5 transition-all shadow-xs cursor-text"
                        }
                    >
                        {/* Danh sách Tags đã chọn */}
                        <AnimatePresence>
                            {tags.map((tag, idx) => {
                                const catKey = getTagCategory(tag);
                                const catStyle = CATEGORY_LABELS[catKey] || CATEGORY_LABELS.custom;

                                if (editingIndex === idx) {
                                    return (
                                        <div key={idx} className="flex items-center gap-1 bg-white dark:bg-slate-900 border-2 border-[#2d5016] dark:border-emerald-500 rounded-xl px-2 py-0.5 shadow-md">
                                            <input
                                                type="text"
                                                className="bg-transparent font-bold text-xs outline-none text-slate-900 dark:text-white w-28"
                                                value={editTagValue}
                                                onChange={e => setEditTagValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveEditTag(idx);
                                                    if (e.key === 'Escape') setEditingIndex(null);
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEditTag(idx)}
                                                className="text-emerald-600 hover:text-emerald-700"
                                            >
                                                <Check size={12} strokeWidth={3} />
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <m.span
                                        key={idx}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className={compact
                                            ? `inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${catStyle.color}`
                                            : `inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs transition-all ${catStyle.color}`
                                        }
                                    >
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEditTag(idx, tag);
                                            }}
                                            className="cursor-pointer hover:underline inline-flex items-center gap-1 group/chip"
                                            title="Click để sửa tên hoạt chất này"
                                        >
                                            <span>{tag}</span>
                                            <Edit3 size={10} className="opacity-40 group-hover/chip:opacity-100 transition-opacity" />
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag(idx);
                                            }}
                                            className="hover:opacity-70 rounded-full p-0.5 transition-opacity"
                                        >
                                            <X size={compact ? 10 : 12} strokeWidth={2.5} />
                                        </button>
                                    </m.span>
                                );
                            })}
                        </AnimatePresence>

                        {/* Ô nhập tìm kiếm hoạt chất */}
                        <div className="flex-1 min-w-[120px] relative">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-transparent font-bold text-xs text-slate-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none px-1.5 py-0.5"
                                placeholder={tags.length === 0 ? placeholder : (compact ? '+ Thêm...' : 'Thêm hoạt chất khác...')}
                                value={inputValue}
                                onChange={e => {
                                    setInputValue(e.target.value);
                                    if (!isOpen) {
                                        updateCoords();
                                        setIsOpen(true);
                                    }
                                }}
                                onFocus={() => {
                                    updateCoords();
                                    setIsOpen(true);
                                }}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                            />
                        </div>

                        {/* Nút chuyển sang gõ văn bản thuần khi ở chế độ compact */}
                        {compact && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMode('text');
                                    setIsOpen(false);
                                }}
                                className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                title="Chuyển sang gõ văn bản thuần"
                            >
                                <Edit3 size={12} />
                            </button>
                        )}

                        {/* Nút mở/đóng danh mục */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isOpen) updateCoords();
                                setIsOpen(prev => !prev);
                                inputRef.current?.focus();
                            }}
                            className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            title="Xem toàn bộ danh mục hoạt chất"
                        >
                            <ChevronDown
                                size={15}
                                className={`transition-transform duration-200 ${
                                    resolvedDirection === 'up'
                                        ? (isOpen ? 'rotate-0 text-emerald-700 dark:text-emerald-400' : 'rotate-180')
                                        : (isOpen ? 'rotate-180 text-emerald-700 dark:text-emerald-400' : 'rotate-0')
                                }`}
                            />
                        </button>
                    </div>

                    {/* POPUP GỢI Ý AUTOCOMPLETE DẠNG PORTAL (KHÔNG BỊ BẤT KỲ DÒNG BẢNG NÀO ĐÈ LÊN) */}
                    {createPortal(
                        <AnimatePresence>
                            {isOpen && (
                                <m.div
                                    ref={dropdownRef}
                                    initial={{ opacity: 0, y: resolvedDirection === 'up' ? 8 : -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: resolvedDirection === 'up' ? 8 : -8, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed z-[99999999] bg-[#faf8f5] dark:bg-[#161b14] text-slate-800 dark:text-slate-100 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-2 border-[#8b6f47]/30 dark:border-white/20 overflow-hidden active-ingredient-dropdown"
                                    style={{
                                        left: coords.left,
                                        width: coords.width,
                                        top: resolvedDirection === 'up' ? 'auto' : coords.top + 6,
                                        bottom: resolvedDirection === 'up' ? coords.bottom + 6 : 'auto',
                                    }}
                                >
                                    {/* Thanh lọc theo nhóm */}
                                    <div className="p-2 border-b border-[#8b6f47]/20 dark:border-white/10 bg-[#ede6dc] dark:bg-[#1e251b] flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[11px] font-black">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('all')}
                                            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                                                selectedCategory === 'all'
                                                    ? 'bg-[#2d5016] text-white shadow-md'
                                                    : 'bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#5c4028] dark:text-slate-300 border border-black/5 dark:border-white/5'
                                            }`}
                                        >
                                            Tất cả
                                        </button>
                                        {Object.entries(CATEGORY_LABELS).map(([key, config]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setSelectedCategory(key)}
                                                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                                                    selectedCategory === key
                                                        ? 'bg-[#2d5016] text-white shadow-md'
                                                        : 'bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#5c4028] dark:text-slate-300 border border-black/5 dark:border-white/5'
                                                }`}
                                            >
                                                {config.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Danh sách gợi ý */}
                                    <div ref={listRef} className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-[#faf8f5] dark:bg-[#161b14]">
                                        {filteredSuggestions.length > 0 ? (
                                            filteredSuggestions.map((item, index) => {
                                                const catConfig = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.custom;
                                                const isSelected = highlightedIndex === index;

                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            if (inlineEditingIng?.name === item.name) return;
                                                            handleAddTag(item.name);
                                                        }}
                                                        onMouseEnter={() => setHighlightedIndex(index)}
                                                        className={`group/item flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer text-xs transition-all ${
                                                            isSelected
                                                                ? 'bg-[#2d5016]/15 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300 font-bold border border-[#2d5016]/30 dark:border-emerald-500/30 shadow-2xs'
                                                                : 'hover:bg-[#2d5016]/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border border-transparent'
                                                        }`}
                                                    >
                                                        {inlineEditingIng?.name === item.name ? (
                                                            <div className="flex-1 flex items-center gap-1.5 py-0.5" onClick={e => e.stopPropagation()}>
                                                                <input
                                                                    type="text"
                                                                    className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-stone-900 border-2 border-emerald-600 text-stone-900 dark:text-stone-100 outline-none shadow-xs"
                                                                    value={inlineEditingIng.editVal}
                                                                    onChange={e => setInlineEditingIng(prev => ({ ...prev, editVal: e.target.value }))}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleSaveInlineEdit();
                                                                        if (e.key === 'Escape') setInlineEditingIng(null);
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSaveInlineEdit}
                                                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                                                                    title="Lưu tên hoạt chất mới"
                                                                >
                                                                    <Check size={13} strokeWidth={3} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setInlineEditingIng(null)}
                                                                    className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl cursor-pointer"
                                                                    title="Hủy"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="font-bold text-sm truncate">{item.name}</span>
                                                                    {item.aliases && item.aliases.length > 0 && (
                                                                        <span className="text-[11px] text-[#8b6f47] dark:text-slate-400 italic font-medium hidden sm:inline truncate">
                                                                            ({item.aliases.slice(0, 2).join(', ')})
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${catConfig.color}`}>
                                                                        {catConfig.label}
                                                                    </span>

                                                                    {/* Cho phép sửa hoặc xóa hoạt chất tự tạo */}
                                                                    {item.isCustom && (
                                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setInlineEditingIng({ name: item.name, editVal: item.name });
                                                                                }}
                                                                                className="p-1 hover:bg-emerald-500/10 hover:text-emerald-600 rounded-lg transition-all text-slate-400 cursor-pointer"
                                                                                title="Sửa tên hoạt chất này"
                                                                            >
                                                                                <Edit2 size={13} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => handleDeleteCustom(e, item.name)}
                                                                                className="p-1 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg transition-all text-slate-400 cursor-pointer"
                                                                                title="Quên / Xóa hoạt chất này khỏi bộ nhớ"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            !inputValue.trim() && (
                                                <div className="p-6 text-center text-xs text-[#8b6f47] dark:text-slate-400 font-medium">
                                                    Không có hoạt chất nào trong nhóm này
                                                </div>
                                            )
                                        )}

                                        {/* Lựa chọn thêm giá trị tùy ý người dùng gõ (nằm sau danh sách gợi ý) */}
                                        {showCustomAdd && (
                                            <div
                                                onClick={() => handleAddTag(inputValue)}
                                                onMouseEnter={() => setHighlightedIndex(filteredSuggestions.length)}
                                                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer text-xs font-bold transition-all border ${
                                                    highlightedIndex === filteredSuggestions.length
                                                        ? 'bg-[#2d5016]/15 border-[#2d5016]/30 text-[#2d5016] dark:text-emerald-400'
                                                        : 'bg-white/70 dark:bg-white/5 border-dashed border-[#8b6f47]/40 hover:bg-[#2d5016]/10 text-slate-800 dark:text-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-[#2d5016] text-white flex items-center justify-center">
                                                        <Plus size={14} strokeWidth={3} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>Thêm mới: <span className="font-black text-[#2d5016] dark:text-emerald-400">"{inputValue.trim()}"</span></span>
                                                        <span className="text-[10px] text-[#8b6f47] dark:text-slate-400 font-semibold flex items-center gap-1">
                                                            <BookmarkCheck size={11} className="text-emerald-600" /> Hệ thống sẽ tự động ghi nhớ lại
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-white font-bold px-2 py-0.5 bg-[#2d5016] rounded-lg shadow-xs">Nhấn Enter</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chân dropdown hướng dẫn */}
                                    <div className="px-3.5 py-2 border-t border-[#8b6f47]/20 dark:border-white/10 bg-[#ede6dc] dark:bg-[#1e251b] flex items-center justify-between text-[11px] text-[#8b6f47] dark:text-slate-400 font-semibold">
                                        <div className="flex items-center gap-1.5">
                                            <span>Dùng phím</span>
                                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 shadow-xs font-mono font-bold text-slate-800 dark:text-slate-200">↑</span>
                                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 shadow-xs font-mono font-bold text-slate-800 dark:text-slate-200">↓</span>
                                            <span>chọn</span>
                                            <span>•</span>
                                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 shadow-xs font-mono font-bold text-slate-800 dark:text-slate-200">Enter</span>
                                            <span>thêm</span>
                                        </div>
                                        <span className="font-bold text-[#2d5016] dark:text-emerald-400">{fullIngredientList.length} hoạt chất sẵn có</span>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                </div>
            )}
        </div>
    );
}
