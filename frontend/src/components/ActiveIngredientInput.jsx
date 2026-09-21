import React, { useState, useEffect, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, Tag, Edit3, Check, ChevronDown, Trash2, BookmarkCheck } from 'lucide-react';
import {
    POPULAR_ACTIVE_INGREDIENTS,
    CATEGORY_LABELS,
    parseActiveIngredients,
    stringifyActiveIngredients,
    extractActiveIngredientsFromProducts,
    getCustomActiveIngredients,
    saveCustomActiveIngredient,
    removeCustomActiveIngredient
} from '../data/activeIngredientsData';

export default function ActiveIngredientInput({
    value = '',
    onChange,
    existingProducts = [],
    className = '',
    placeholder = 'Nhập hoặc chọn hoạt chất (VD: Difenoconazole)...',
    direction = 'up' // Mặc định mở chổng lên trên theo yêu cầu
}) {
    // Mode: 'chips' (thẻ thông minh) hoặc 'text' (văn bản thuần)
    const [mode, setMode] = useState('chips');
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editTagValue, setEditTagValue] = useState('');
    const [resolvedDirection, setResolvedDirection] = useState(direction);
    const [customIngredients, setCustomIngredients] = useState(() => getCustomActiveIngredients());

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const listRef = useRef(null);

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

    useEffect(() => {
        if (direction === 'auto' && isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 280) {
                setResolvedDirection('up');
            } else {
                setResolvedDirection('down');
            }
        } else {
            setResolvedDirection(direction);
        }
    }, [direction, isOpen]);

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
            if (containerRef.current && !containerRef.current.contains(e.target)) {
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

    const handleSaveEditTag = () => {
        if (editingIndex === null) return;
        const trimmed = editTagValue.trim();
        let nextTags;
        if (!trimmed) {
            nextTags = tags.filter((_, idx) => idx !== editingIndex);
        } else {
            nextTags = [...tags];
            nextTags[editingIndex] = trimmed;
            // Cũng tự nhớ hoạt chất sau khi sửa nếu là tên mới
            const isStandard = POPULAR_ACTIVE_INGREDIENTS.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
            if (!isStandard) {
                const updated = saveCustomActiveIngredient(trimmed, 'custom');
                if (updated) setCustomIngredients(updated);
            }
        }
        onChange(stringifyActiveIngredients(nextTags));
        setEditingIndex(null);
        setEditTagValue('');
    };

    const showCustomAdd = Boolean(inputValue.trim() && !fullIngredientList.some(i => i.name.toLowerCase() === inputValue.trim().toLowerCase()));
    const totalItems = filteredSuggestions.length + (showCustomAdd ? 1 : 0);

    const handleKeyDown = (e) => {
        if (editingIndex !== null) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else if (totalItems > 0) {
                setHighlightedIndex(prev => (prev + 1) % totalItems);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen && totalItems > 0) {
                setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
            }
        } else if (e.key === 'Enter' || e.key === ',' || e.key === '+') {
            e.preventDefault();
            if (isOpen && totalItems > 0) {
                if (highlightedIndex < filteredSuggestions.length) {
                    handleAddTag(filteredSuggestions[highlightedIndex].name);
                } else if (showCustomAdd) {
                    handleAddTag(inputValue);
                }
            } else if (inputValue.trim()) {
                handleAddTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            handleRemoveTag(tags.length - 1);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const getTagCategory = (tagName) => {
        const lower = tagName.toLowerCase();
        const found = fullIngredientList.find(i => lower.includes(i.name.toLowerCase()));
        return found ? found.category : 'custom';
    };

    return (
        <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
            {/* Thanh điều khiển phụ: Chuyển đổi Thẻ/Văn bản & Đếm số lượng */}
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

            {/* CHẾ ĐỘ 1: VĂN BẢN THUẦN (Plain text mode) */}
            {mode === 'text' ? (
                <div className="relative">
                    <input
                        type="text"
                        className="w-full p-3 font-bold text-sm rounded-2xl bg-white dark:bg-[#181e16] border-2 border-[#8b6f47]/30 dark:border-white/15 focus:border-[#2d5016] focus:ring-4 focus:ring-[#2d5016]/10 text-slate-900 dark:text-slate-100 outline-none transition-all shadow-xs"
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
                        placeholder="VD: Difenoconazole 250g/l + Propiconazole 150g/l"
                        autoComplete="off"
                    />
                    <p className="text-[11px] text-[#8b6f47] dark:text-slate-400 mt-1 ml-1 font-medium">
                        * Mẹo: Các hoạt chất cách nhau bởi dấu <code className="font-mono font-bold text-[#2d5016] dark:text-emerald-400">+</code> hoặc dấu phẩy <code className="font-mono font-bold text-[#2d5016] dark:text-emerald-400">,</code>
                    </p>
                </div>
            ) : (
                /* CHẾ ĐỘ 2: THẺ TAGS CHỌN NHANH & AUTOCOMPLETE */
                <div className="space-y-2">
                    <div
                        onClick={() => inputRef.current?.focus()}
                        className="min-h-[48px] p-2 bg-white dark:bg-[#181e16] border-2 border-[#8b6f47]/30 dark:border-white/15 focus-within:border-[#2d5016] dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-[#2d5016]/10 rounded-2xl flex flex-wrap items-center gap-1.5 transition-all shadow-xs cursor-text"
                    >
                        {/* Danh sách Tags đã chọn */}
                        <AnimatePresence>
                            {tags.map((tag, idx) => {
                                const catKey = getTagCategory(tag);
                                const catStyle = CATEGORY_LABELS[catKey] || CATEGORY_LABELS.custom;

                                if (editingIndex === idx) {
                                    return (
                                        <div key={idx} className="flex items-center gap-1 bg-white dark:bg-slate-900 border-2 border-[#2d5016] dark:border-emerald-500 rounded-xl px-2.5 py-1 shadow-md">
                                            <input
                                                type="text"
                                                className="bg-transparent font-bold text-xs outline-none text-slate-900 dark:text-white w-32"
                                                value={editTagValue}
                                                autoFocus
                                                onChange={e => setEditTagValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleSaveEditTag();
                                                    if (e.key === 'Escape') setEditingIndex(null);
                                                }}
                                                onBlur={handleSaveEditTag}
                                            />
                                            <button type="button" onClick={handleSaveEditTag} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                                                <Check size={13} strokeWidth={3} />
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <m.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`group/chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all select-none shadow-2xs ${catStyle.color}`}
                                    >
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEditTag(idx, tag);
                                            }}
                                            className="cursor-pointer hover:underline"
                                            title="Click đúp để chỉnh sửa hàm lượng"
                                        >
                                            {tag}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag(idx);
                                            }}
                                            className="opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-all text-current"
                                            title="Xóa hoạt chất này"
                                        >
                                            <X size={12} strokeWidth={2.5} />
                                        </button>
                                    </m.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Ô nhập tìm kiếm hoạt chất */}
                        <div className="flex-1 min-w-[160px] relative">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-transparent font-bold text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none px-1.5 py-1"
                                placeholder={tags.length === 0 ? placeholder : 'Thêm hoạt chất khác...'}
                                value={inputValue}
                                onChange={e => {
                                    setInputValue(e.target.value);
                                    if (!isOpen) setIsOpen(true);
                                }}
                                onFocus={() => setIsOpen(true)}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                            />
                        </div>

                        {/* Nút mở/đóng danh mục */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(prev => !prev);
                                inputRef.current?.focus();
                            }}
                            className="p-1.5 rounded-xl text-[#8b6f47] dark:text-slate-400 hover:text-[#2d5016] dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            title="Xem toàn bộ danh mục hoạt chất"
                        >
                            <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${
                                    resolvedDirection === 'up'
                                        ? (isOpen ? 'rotate-0 text-[#2d5016] dark:text-emerald-400' : 'rotate-180')
                                        : (isOpen ? 'rotate-180 text-[#2d5016] dark:text-emerald-400' : 'rotate-0')
                                }`}
                            />
                        </button>
                    </div>

                    {/* POPUP GỢI Ý AUTOCOMPLETE (BACKGROUND ĐẶC KHÔNG BỊ TRONG SUỐT XUYÊN THẤU) */}
                    <AnimatePresence>
                        {isOpen && (
                            <m.div
                                ref={dropdownRef}
                                initial={{ opacity: 0, y: resolvedDirection === 'up' ? 8 : -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: resolvedDirection === 'up' ? 8 : -8, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute left-0 right-0 z-[2500] bg-[#faf8f5] dark:bg-[#161b14] text-slate-800 dark:text-slate-100 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-2 border-[#8b6f47]/30 dark:border-white/20 overflow-hidden ${
                                    resolvedDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
                                }`}
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
                                                    onClick={() => handleAddTag(item.name)}
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                    className={`group/item flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer text-xs transition-all ${
                                                        isSelected
                                                            ? 'bg-[#2d5016]/15 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300 font-bold border border-[#2d5016]/30 dark:border-emerald-500/30 shadow-2xs'
                                                            : 'hover:bg-[#2d5016]/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border border-transparent'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-bold text-sm truncate">{item.name}</span>
                                                        {item.aliases && item.aliases.length > 0 && (
                                                            <span className="text-[11px] text-[#8b6f47] dark:text-slate-400 italic font-medium hidden sm:inline truncate">
                                                                ({item.aliases.slice(0, 2).join(', ')})
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${catConfig.color}`}>
                                                            {catConfig.label}
                                                        </span>

                                                        {/* Cho phép xóa hoạt chất tự tạo nếu gõ nhầm */}
                                                        {item.isCustom && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteCustom(e, item.name)}
                                                                className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg transition-all text-slate-400"
                                                                title="Quên / Xóa hoạt chất này khỏi bộ nhớ"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
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
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
