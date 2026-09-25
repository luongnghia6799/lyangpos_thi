import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { 
    FlaskConical, Search, Plus, Trash2, Edit2, Check, X, ExternalLink, 
    Sparkles, ShieldCheck, Bug, Leaf, Sprout, Store, Info,
    RefreshCw, BookOpen, AlertTriangle, CheckCircle2, Layers,
    Play, Square, CheckCircle, Clock, Cpu
} from 'lucide-react';
import { cn, removeAccents } from '../../lib/utils';
import { 
    POPULAR_ACTIVE_INGREDIENTS, 
    CATEGORY_LABELS, 
    getCustomActiveIngredients, 
    saveCustomActiveIngredient, 
    updateCustomActiveIngredient,
    removeCustomActiveIngredient,
    parseActiveIngredients,
    replaceIngredientInProductString
} from '../../data/activeIngredientsData';
import CatalogPagination from './CatalogPagination';

export default function IngredientCatalogTab({ products = [], onUpdate, onToast, onOpenEditProduct }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [customIngredients, setCustomIngredients] = useState(() => getCustomActiveIngredients());
    const [newIngName, setNewIngName] = useState('');
    const [newIngCat, setNewIngCat] = useState('fungicide');
    const [renamingIng, setRenamingIng] = useState(null); // { oldName, newName, category, originalCategory, syncProducts, isSubmitting }
    const [selectedIngDetail, setSelectedIngDetail] = useState(null);
    const [drawerSearch, setDrawerSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Quản lý tri thức dược học đã nghiên cứu trong database
    const [researchedMap, setResearchedMap] = useState({});
    const [isSyncingResearch, setIsSyncingResearch] = useState(false);
    const [isResearchingOne, setIsResearchingOne] = useState(false);

    // Helper an toàn bóc tách mảng từ string hoặc JSON
    const parseList = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean);
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
                } catch (e) {}
            }
            return trimmed.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    const loadResearched = async () => {
        try {
            const res = await axios.get('/api/active-ingredients/researched');
            if (res.data?.data) {
                const map = {};
                res.data.data.forEach(item => {
                    const raw = item.research || item;
                    const ingName = raw.name;
                    if (ingName) {
                        const targetsList = parseList(raw.targets);
                        const synergiesList = parseList(raw.compatible_synergies);
                        const incompatibilitiesList = parseList(raw.incompatibilities || raw.incompatible_warnings);
                        const isSystemic = raw.is_systemic ?? (
                            (raw.features && /lưu dẫn|nội hấp/i.test(raw.features)) ||
                            (raw.role_type && /lưu dẫn|nội hấp/i.test(raw.role_type)) ||
                            (raw.moa && /lưu dẫn|nội hấp/i.test(raw.moa))
                        );
                        const isHotWarning = raw.is_hot_crop_warning ?? (
                            (raw.features && /nóng|cẩn trọng|hoa non|trái non/i.test(raw.features)) ||
                            (raw.incompatibilities && /nóng|cháy lá|rụng hoa/i.test(raw.incompatibilities))
                        );

                        map[ingName.toLowerCase()] = {
                            ...raw,
                            targets: targetsList,
                            compatible_synergies: synergiesList,
                            incompatibilities: incompatibilitiesList,
                            incompatible_warnings: incompatibilitiesList,
                            is_systemic: isSystemic,
                            is_hot_crop_warning: isHotWarning,
                        };
                    }
                });
                setResearchedMap(map);
            }
        } catch (e) {}
    };

    useEffect(() => {
        loadResearched();
    }, []);

    // Modal Batch AI Research cho toàn bộ kho
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchRunning, setBatchRunning] = useState(false);
    const [batchMode, setBatchMode] = useState('unresearched'); // 'unresearched' | 'all'
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [batchCurrentName, setBatchCurrentName] = useState('');
    const [batchLogs, setBatchLogs] = useState([]);
    const stopBatchRef = useRef(false);

    // Danh sách tên hoạt chất thực tế trong kho
    const warehouseActivesList = useMemo(() => {
        const set = new Set();
        products.forEach(p => {
            if (!p.active_ingredient) return;
            const ings = parseActiveIngredients(p.active_ingredient);
            ings.forEach(name => {
                const trimmed = name.trim();
                if (trimmed) set.add(trimmed);
            });
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
    }, [products]);

    // Phân loại hoạt chất đã có AI research chuyên sâu vs chưa có
    const { researchedList, unresearchedList } = useMemo(() => {
        const researched = [];
        const unresearched = [];

        warehouseActivesList.forEach(name => {
            const r = researchedMap[name.toLowerCase()];
            const hasDeep = r && (r.research_source === 'gemini' || (r.research_source === 'system' && r.targets?.length > 0));
            if (hasDeep) {
                researched.push({ name, research: r });
            } else {
                unresearched.push({ name, research: r });
            }
        });

        return { researchedList: researched, unresearchedList: unresearched };
    }, [warehouseActivesList, researchedMap]);

    const handleOpenBatchModal = async () => {
        setIsSyncingResearch(true);
        try {
            await axios.post('/api/active-ingredients/researched/sync');
            await loadResearched();
            setShowBatchModal(true);
        } catch (err) {
            onToast?.({ message: `Lỗi đồng bộ kho: ${err.message}`, type: 'error' });
        } finally {
            setIsSyncingResearch(false);
        }
    };

    const startBatchAiResearch = async () => {
        const targetList = batchMode === 'all' 
            ? warehouseActivesList 
            : unresearchedList.map(u => u.name);

        if (targetList.length === 0) {
            onToast?.({ message: 'Không có hoạt chất nào cần nghiên cứu AI!', type: 'info' });
            return;
        }

        setBatchRunning(true);
        stopBatchRef.current = false;
        setBatchProgress({ current: 0, total: targetList.length });
        setBatchLogs([]);

        for (let i = 0; i < targetList.length; i++) {
            if (stopBatchRef.current) {
                setBatchLogs(prev => [{
                    name: 'Hệ thống',
                    status: 'stopped',
                    text: 'Người dùng đã tạm dừng tiến trình nghiên cứu AI'
                }, ...prev]);
                break;
            }

            const name = targetList[i];
            setBatchCurrentName(name);
            setBatchProgress({ current: i + 1, total: targetList.length });

            try {
                const res = await axios.post('/api/active-ingredients/researched/research-one', { name });
                const data = res.data?.data;
                const tgts = parseList(data?.targets);
                
                setBatchLogs(prev => [{
                    name,
                    status: 'success',
                    text: `Nhóm: ${data?.group_name || 'N/A'} • Trị: ${tgts.slice(0, 3).join(', ') || 'Nhiều dịch hại'}`
                }, ...prev]);

                // Cập nhật lại database map ngay lập tức
                await loadResearched();
            } catch (err) {
                const errDetail = err.response?.data?.error || err.message;
                setBatchLogs(prev => [{
                    name,
                    status: 'error',
                    text: `Lỗi: ${errDetail}`
                }, ...prev]);
            }

            // Nghỉ nhẹ 600ms giữa các request để bảo đảm API rate limit Gemini
            if (i < targetList.length - 1 && !stopBatchRef.current) {
                await new Promise(r => setTimeout(r, 600));
            }
        }

        setBatchRunning(false);
        setBatchCurrentName('');
        onToast?.({ message: 'Tiến trình AI Research hoàn tất!', type: 'success' });
        onUpdate?.();
    };

    const stopBatchAiResearch = () => {
        stopBatchRef.current = true;
    };

    const handleResearchOne = async (ingName) => {
        if (!ingName) return;
        setIsResearchingOne(true);
        try {
            const res = await axios.post('/api/active-ingredients/researched/research-one', { name: ingName });
            onToast?.({
                message: res.data?.message || `Đã nghiên cứu dược học hoạt chất "${ingName}"`,
                type: 'success'
            });
            await loadResearched();
        } catch (err) {
            onToast?.({
                message: `Lỗi AI research: ${err.response?.data?.error || err.message}`,
                type: 'error'
            });
        } finally {
            setIsResearchingOne(false);
        }
    };

    // Thống kê sản phẩm chứa từng hoạt chất
    const productStatsByIng = useMemo(() => {
        const stats = {};
        products.forEach(p => {
            if (!p.active_ingredient) return;
            const ings = parseActiveIngredients(p.active_ingredient);
            ings.forEach(ing => {
                const rawName = typeof ing === 'string' ? ing : (ing?.name || '');
                const norm = rawName.replace(/\s+\d+.*$/i, '').trim();
                if (!norm) return;
                const key = norm.toLowerCase();
                if (!stats[key]) {
                    stats[key] = { displayName: norm, products: [] };
                }
                if (!stats[key].products.some(prod => prod.id === p.id)) {
                    stats[key].products.push(p);
                }
            });
        });
        return stats;
    }, [products]);

    // Hợp nhất danh mục chuẩn + tự tạo
    const allIngredients = useMemo(() => {
        const map = new Map();

        // 1. Thư viện chuẩn
        POPULAR_ACTIVE_INGREDIENTS.forEach(item => {
            map.set(item.name.toLowerCase(), {
                name: item.name,
                category: item.category,
                aliases: item.aliases || [],
                isCustom: false
            });
        });

        // 2. Custom từ người dùng
        customIngredients.forEach(item => {
            const name = typeof item === 'string' ? item : item.name;
            const category = typeof item === 'object' && item.category ? item.category : 'custom';
            const key = name.toLowerCase();
            if (!map.has(key)) {
                map.set(key, { name, category, isCustom: true });
            }
        });

        // 3. Từ sản phẩm thực tế trong kho nếu chưa có
        Object.values(productStatsByIng).forEach(entry => {
            const key = entry.displayName.toLowerCase();
            if (!map.has(key)) {
                map.set(key, { name: entry.displayName, category: 'custom', isCustom: true });
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            const countA = productStatsByIng[a.name.toLowerCase()]?.products.length || 0;
            const countB = productStatsByIng[b.name.toLowerCase()]?.products.length || 0;
            if (countB !== countA) return countB - countA;
            return a.name.localeCompare(b.name, 'vi');
        });
    }, [customIngredients, productStatsByIng]);

    // Lọc theo Category & Search
    const filteredIngredients = useMemo(() => {
        let list = allIngredients;

        if (selectedCategory === 'in_use') {
            list = list.filter(item => (productStatsByIng[item.name.toLowerCase()]?.products.length || 0) > 0);
        } else if (selectedCategory === 'researched') {
            list = list.filter(item => !!researchedMap[item.name.toLowerCase()]);
        } else if (selectedCategory === 'custom') {
            list = list.filter(item => item.isCustom);
        } else if (selectedCategory !== 'all') {
            list = list.filter(item => item.category === selectedCategory);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const termNoAccent = removeAccents(term);
            list = list.filter(item => {
                const n = item.name.toLowerCase();
                const aliases = (item.aliases || []).join(' ').toLowerCase();
                if (n.includes(term) || removeAccents(n).includes(termNoAccent) ||
                    aliases.includes(term) || removeAccents(aliases).includes(termNoAccent)) {
                    return true;
                }

                // Tra cứu sâu bệnh, đối tượng đặc trị và từ khóa từ AI Research
                const r = researchedMap[item.name.toLowerCase()];
                if (r) {
                    const targetsStr = Array.isArray(r.targets) ? r.targets.join(' ') : (r.targets || '');
                    const keywordsStr = Array.isArray(r.keywords) ? r.keywords.join(' ') : (r.keywords || '');
                    const roleStr = r.role_type || '';
                    const moaStr = r.moa || '';
                    const groupStr = r.group_name || '';

                    const combined = `${targetsStr} ${keywordsStr} ${roleStr} ${moaStr} ${groupStr}`.toLowerCase();
                    if (combined.includes(term) || removeAccents(combined).includes(termNoAccent)) {
                        return true;
                    }
                }
                return false;
            });
        }

        return list;
    }, [allIngredients, selectedCategory, searchTerm, productStatsByIng, researchedMap]);

    // Reset page khi thay đổi tìm kiếm hoặc bộ lọc
    useEffect(() => {
        setPage(1);
    }, [searchTerm, selectedCategory]);

    const paginatedIngredients = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredIngredients.slice(start, start + PAGE_SIZE);
    }, [filteredIngredients, page]);

    const handleAdd = () => {
        if (!newIngName.trim()) return;
        const name = newIngName.trim();
        const updated = saveCustomActiveIngredient(name, newIngCat);
        setCustomIngredients(updated || getCustomActiveIngredients());
        setNewIngName('');
        onToast?.({ message: `Đã thêm hoạt chất "${name}" vào thư viện`, type: 'success' });
    };

    const handleDeleteCustom = (e, name) => {
        e.stopPropagation();
        const updated = removeCustomActiveIngredient(name);
        setCustomIngredients(updated || []);
        onToast?.({ message: `Đã xóa hoạt chất "${name}"`, type: 'info' });
    };

    // Đổi tên hoạt chất và đồng bộ sản phẩm nếu cần
    const handleConfirmRename = async () => {
        if (!renamingIng || !renamingIng.newName.trim()) return;
        const { oldName, newName, category, syncProducts } = renamingIng;
        const trimmedNew = newName.trim();
        if (oldName === trimmedNew && category === renamingIng.originalCategory) {
            setRenamingIng(null);
            return;
        }

        setRenamingIng(prev => ({ ...prev, isSubmitting: true }));
        try {
            // 1. Cập nhật trong custom active ingredients
            const updated = updateCustomActiveIngredient(oldName, trimmedNew, category);
            setCustomIngredients(updated || getCustomActiveIngredients());

            // 2. Nếu có sản phẩm và người dùng tick chọn đồng bộ
            const targetProducts = productStatsByIng[oldName.toLowerCase()]?.products || [];
            if (syncProducts && targetProducts.length > 0) {
                await Promise.all(
                    targetProducts.map(p => {
                        const newActive = replaceIngredientInProductString(p.active_ingredient, oldName, trimmedNew);
                        return axios.put(`/api/products/${p.id}`, {
                            ...p,
                            active_ingredient: newActive
                        });
                    })
                );
                onUpdate?.();
                onToast?.({
                    message: `Đã đổi tên hoạt chất thành "${trimmedNew}" (đồng bộ ${targetProducts.length} sản phẩm)`,
                    type: 'success'
                });
            } else {
                onToast?.({
                    message: `Đã đổi tên hoạt chất thành "${trimmedNew}"`,
                    type: 'success'
                });
            }

            setRenamingIng(null);
        } catch (err) {
            console.error('Error renaming active ingredient:', err);
            onToast?.({ message: `Lỗi cập nhật hoạt chất: ${err.message}`, type: 'error' });
            setRenamingIng(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <div className="space-y-6">
            {/* THANH ĐIỀU KHIỂN & THÊM MỚI */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-3xl border border-stone-300/60 dark:border-white/10">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tra cứu tên hoạt chất hoặc sâu bệnh đặc trị (VD: sâu xanh, bọ trĩ, thán thư)..."
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* THÊM HOẠT CHẤT MỚI & ĐỒNG BỘ AI RESEARCH */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleOpenBatchModal}
                        disabled={isSyncingResearch}
                        className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
                        title="Quét hoạt chất trong kho và thực hiện nghiên cứu chuyên sâu bằng AI Gemini"
                    >
                        <RefreshCw size={13} className={cn(isSyncingResearch && "animate-spin")} />
                        <span>{isSyncingResearch ? "Đang quét..." : "AI Research Toàn Bộ Kho"}</span>
                        {unresearchedList.length > 0 && (
                            <span className="bg-amber-400 text-stone-900 text-[10px] px-1.5 py-0.5 rounded-full font-black ml-0.5" title={`${unresearchedList.length} hoạt chất cần AI nghiên cứu`}>
                                {unresearchedList.length}
                            </span>
                        )}
                    </button>

                    <input
                        type="text"
                        value={newIngName}
                        onChange={(e) => setNewIngName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Tên hoạt chất mới..."
                        className="px-3.5 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                    />
                    <select
                        value={newIngCat}
                        onChange={(e) => setNewIngCat(e.target.value)}
                        className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 cursor-pointer"
                    >
                        <option value="fungicide">Trừ nấm / Bệnh</option>
                        <option value="insecticide">Trừ sâu / Rầy</option>
                        <option value="herbicide">Trừ cỏ</option>
                        <option value="pgr">Dưỡng / Sinh trưởng</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#2d5016] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={3} /> Thêm Hoạt Chất
                    </button>
                </div>
            </div>

            {/* BANNER ĐỔI TÊN HOẠT CHẤT ĐỒNG BỘ */}
            <AnimatePresence>
                {renamingIng && (
                    <m.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                                    <Edit2 size={16} className="text-emerald-600" />
                                    Sửa tên & Phân loại hoạt chất
                                </h4>
                                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                                    Đang sửa hoạt chất gốc: <strong className="text-emerald-800 dark:text-emerald-300 font-bold">"{renamingIng.oldName}"</strong>
                                </p>
                            </div>
                            <button onClick={() => setRenamingIng(null)} className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-5">
                                <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">Tên hoạt chất đúng:</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={renamingIng.newName}
                                    onChange={(e) => setRenamingIng(prev => ({ ...prev, newName: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
                                    placeholder="Nhập tên hoạt chất chuẩn..."
                                    className="w-full px-4 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-black/30 border border-stone-300/70 dark:border-white/10 outline-none text-stone-900 dark:text-stone-100 focus:border-emerald-600"
                                />
                            </div>

                            <div className="md:col-span-4">
                                <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">Phân loại công dụng:</label>
                                <select
                                    value={renamingIng.category}
                                    onChange={(e) => setRenamingIng(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-[#181f19] border border-stone-300/70 dark:border-white/10 outline-none text-stone-800 dark:text-stone-200 focus:border-emerald-600 cursor-pointer"
                                >
                                    <option value="fungicide">Trừ nấm / Bệnh</option>
                                    <option value="insecticide">Trừ sâu / Rầy</option>
                                    <option value="herbicide">Trừ cỏ</option>
                                    <option value="pgr">Dưỡng / Sinh trưởng</option>
                                    <option value="custom">Cửa hàng tự thêm</option>
                                </select>
                            </div>

                            <div className="md:col-span-3 flex items-end gap-2 pt-2 md:pt-5">
                                <button
                                    type="button"
                                    disabled={renamingIng.isSubmitting || !renamingIng.newName.trim()}
                                    onClick={handleConfirmRename}
                                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    <Check size={14} strokeWidth={3} />
                                    <span>{renamingIng.isSubmitting ? "Đang lưu..." : "Lưu Sửa Đổi"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRenamingIng(null)}
                                    className="py-2 px-3 bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 rounded-2xl text-xs font-bold hover:bg-black/10 cursor-pointer"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>

                        {/* Tự động cập nhật các sản phẩm đang chứa hoạt chất này */}
                        {(productStatsByIng[renamingIng.oldName.toLowerCase()]?.products.length || 0) > 0 && (
                            <div className="pt-2 border-t border-emerald-500/20 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="sync-prod-check-ing"
                                    checked={renamingIng.syncProducts}
                                    onChange={(e) => setRenamingIng(prev => ({ ...prev, syncProducts: e.target.checked }))}
                                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                                />
                                <label htmlFor="sync-prod-check-ing" className="text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer select-none">
                                    Đồng bộ cập nhật tên mới cho <strong>{productStatsByIng[renamingIng.oldName.toLowerCase()]?.products.length}</strong> sản phẩm đang dùng hoạt chất này
                                </label>
                            </div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>

            {/* GỢI Ý TRA CỨU NHANH THEO SÂU BỆNH / DỊCH HẠI */}
            <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-stone-200/60 dark:border-white/5">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mr-1 flex items-center gap-1">
                    <Bug size={13} className="text-emerald-600" />
                    <span>Tra cứu nhanh:</span>
                </span>
                {[
                    'Sâu xanh', 'Bọ trĩ', 'Sâu cuốn lá', 'Sâu đục thân', 'Rầy nâu',
                    'Nhện đỏ', 'Rệp sáp', 'Thán thư', 'Đạo ôn', 'Sương mai', 'Thối nhũn', 'Nứt thân xì mủ'
                ].map(pest => {
                    const isSelected = searchTerm.toLowerCase() === pest.toLowerCase();
                    return (
                        <button
                            key={pest}
                            type="button"
                            onClick={() => setSearchTerm(isSelected ? '' : pest)}
                            className={cn(
                                "px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer",
                                isSelected
                                    ? "bg-emerald-600 text-white shadow-xs font-black"
                                    : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 border border-stone-300/60 dark:border-white/10"
                            )}
                        >
                            {pest}
                        </button>
                    );
                })}
            </div>

            {/* TABS LỌC NHÓM CÔNG DỤNG */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase text-stone-500 tracking-wider mr-1">Phân loại:</span>
                {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'in_use', label: 'Đang dùng trong kho', icon: Store },
                    { id: 'researched', label: `Đã research dược học (${Object.keys(researchedMap).length})`, icon: BookOpen },
                    { id: 'fungicide', label: 'Trừ nấm / Bệnh', icon: ShieldCheck },
                    { id: 'insecticide', label: 'Trừ sâu / Rầy', icon: Bug },
                    { id: 'herbicide', label: 'Trừ cỏ', icon: Leaf },
                    { id: 'pgr', label: 'Sinh trưởng / Phân', icon: Sprout },
                    { id: 'custom', label: 'Cửa hàng tự thêm', icon: Sparkles },
                ].map(cat => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                                isActive
                                    ? "bg-emerald-700 text-white shadow-xs font-black"
                                    : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300 hover:bg-black/10"
                            )}
                        >
                            {Icon && <Icon size={12} />}
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* GRID CÁC THẺ HOẠT CHẤT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {paginatedIngredients.map(item => {
                    const countEntry = productStatsByIng[item.name.toLowerCase()];
                    const productCount = countEntry?.products.length || 0;
                    const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.custom;
                    const researchData = researchedMap[item.name.toLowerCase()];

                    return (
                        <div
                            key={item.name}
                            onClick={() => setSelectedIngDetail({ name: item.name, products: countEntry?.products || [] })}
                            className={cn(
                                "p-4 rounded-3xl border transition-all flex flex-col justify-between group cursor-pointer",
                                productCount > 0
                                    ? "bg-white/80 dark:bg-[#141f17]/80 border-stone-300/60 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md"
                                    : "bg-black/[0.01] dark:bg-white/[0.01] border-stone-300/40 dark:border-white/5 hover:border-stone-400 opacity-80"
                            )}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                    <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRenamingIng({
                                                    oldName: item.name,
                                                    newName: item.name,
                                                    category: item.category || 'custom',
                                                    originalCategory: item.category || 'custom',
                                                    syncProducts: true,
                                                    isSubmitting: false
                                                });
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                                            title="Sửa tên hoạt chất / phân loại"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        {item.isCustom && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteCustom(e, item.name)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                                title="Xóa hoạt chất tự tạo này"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={cn(
                                        "inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                                        catMeta?.color || "bg-stone-100 text-stone-600"
                                    )}>
                                        {catMeta?.label || item.category}
                                    </span>
                                    {researchData && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-300 dark:border-sky-800 px-1.5 py-0.5 rounded-md">
                                            🔬 Đã research
                                        </span>
                                    )}
                                </div>

                                {(() => {
                                    const tgts = parseList(researchData?.targets);
                                    if (tgts.length > 0) {
                                        let displayTgts = tgts;
                                        let hasMatchedTarget = false;
                                        if (searchTerm.trim()) {
                                            const sLower = searchTerm.toLowerCase();
                                            const sNo = removeAccents(sLower);
                                            const matchingT = tgts.filter(t => t.toLowerCase().includes(sLower) || removeAccents(t.toLowerCase()).includes(sNo));
                                            const otherT = tgts.filter(t => !t.toLowerCase().includes(sLower) && !removeAccents(t.toLowerCase()).includes(sNo));
                                            if (matchingT.length > 0) {
                                                hasMatchedTarget = true;
                                                displayTgts = [...matchingT, ...otherT];
                                            }
                                        }
                                        return (
                                            <p className="text-[10px] text-stone-600 dark:text-stone-300 line-clamp-1 mt-1.5 font-medium">
                                                🎯 Trị: <span className={cn(hasMatchedTarget ? "font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded" : "")}>
                                                    {displayTgts.slice(0, 3).join(', ')}
                                                </span>
                                            </p>
                                        );
                                    }
                                    if (item.aliases && item.aliases.length > 0) {
                                        return (
                                            <p className="text-[10px] text-stone-400 italic line-clamp-1 mt-1">
                                                Gợi nhớ: {item.aliases.slice(0, 3).join(', ')}
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <div className="pt-2 mt-2 border-t border-stone-200/50 dark:border-white/5 flex items-center justify-between text-[11px]">
                                <span className="text-stone-500">Sản phẩm kho:</span>
                                <span className={cn(
                                    "font-black tabular-nums px-1.5 py-0.2 rounded-md",
                                    productCount > 0 ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300" : "text-stone-400"
                                    )}>
                                    {productCount} SP
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PHÂN TRANG */}
            <CatalogPagination
                currentPage={page}
                totalItems={filteredIngredients.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="hoạt chất"
            />

            {/* MODAL / DRAWER SẢN PHẨM CHỨA HOẠT CHẤT NÀY */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedIngDetail && (
                        <div className="fixed inset-0 z-[999999] isolate flex justify-end">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs"
                                onClick={() => {
                                    setSelectedIngDetail(null);
                                    setDrawerSearch('');
                                }}
                            />

                            <m.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                                className="relative w-full max-w-md h-full bg-[#faf8f5] dark:bg-[#142018] shadow-2xl flex flex-col border-l border-emerald-600/20 dark:border-white/10 z-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="p-5 pb-4 border-b border-stone-200/80 dark:border-white/10 flex items-start justify-between gap-3 bg-white/40 dark:bg-black/20">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-600/20 shadow-2xs">
                                            <FlaskConical size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-base text-stone-900 dark:text-stone-100 truncate">
                                                {selectedIngDetail.name}
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                                Có <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedIngDetail.products?.length || 0}</span> sản phẩm chứa hoạt chất này
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const item = allIngredients.find(i => i.name.toLowerCase() === selectedIngDetail.name.toLowerCase()) || { name: selectedIngDetail.name, category: 'custom' };
                                                setRenamingIng({
                                                    oldName: item.name,
                                                    newName: item.name,
                                                    category: item.category || 'custom',
                                                    originalCategory: item.category || 'custom',
                                                    syncProducts: true,
                                                    isSubmitting: false
                                                });
                                                setSelectedIngDetail(null);
                                                setDrawerSearch('');
                                            }}
                                            className="p-2 rounded-2xl hover:bg-emerald-500/10 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                                            title="Đổi tên hoạt chất này"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedIngDetail(null);
                                                setDrawerSearch('');
                                            }}
                                            className="p-2 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0 cursor-pointer"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* THÔNG TIN DƯỢC HỌC RESEARCH (NẾU CÓ) */}
                                {(() => {
                                    const activeResearch = researchedMap[selectedIngDetail.name.toLowerCase()];
                                    return (
                                        <div className="px-5 pt-4 pb-2 border-b border-stone-200/80 dark:border-white/10 space-y-3 bg-emerald-500/[0.03]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <BookOpen size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                    <span className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                                                        Hồ sơ Dược học Nông nghiệp
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={isResearchingOne}
                                                    onClick={() => handleResearchOne(selectedIngDetail.name)}
                                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                                                    title="Nghiên cứu lại hoạt chất này bằng AI Gemini"
                                                >
                                                    <RefreshCw size={11} className={cn(isResearchingOne && "animate-spin")} />
                                                    <span>{isResearchingOne ? "Đang AI..." : (activeResearch ? "AI Research Lại" : "AI Research")}</span>
                                                </button>
                                            </div>

                                            {activeResearch ? (
                                                <div className="space-y-2.5 text-xs">
                                                    {/* Nhóm hóa học & Cơ chế */}
                                                    {(activeResearch.chemical_group || activeResearch.mechanism_of_action) && (
                                                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 space-y-1">
                                                            {activeResearch.chemical_group && (
                                                                <p className="text-stone-700 dark:text-stone-300">
                                                                    <strong className="text-emerald-700 dark:text-emerald-400">Nhóm:</strong> {activeResearch.chemical_group}
                                                                </p>
                                                            )}
                                                            {activeResearch.mechanism_of_action && (
                                                                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                                                                    <strong className="text-stone-700 dark:text-stone-300">Cơ chế tác động (MOA):</strong> {activeResearch.mechanism_of_action}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Đặc tính Lưu dẫn / Mát - Nóng */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                                            activeResearch.is_systemic 
                                                                ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                                                                : "bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-300"
                                                        )}>
                                                            {activeResearch.is_systemic ? "💧 Lưu dẫn / Nội hấp" : "🛡️ Tiếp xúc / Bề mặt"}
                                                        </span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                                            activeResearch.is_hot_crop_warning
                                                            ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                                        )}>
                                                            {activeResearch.is_hot_crop_warning ? "⚠️ Cần chú ý khi hoa/trái non (tính nóng)" : "🌿 Mát cây / An toàn bông trái"}
                                                        </span>
                                                    </div>

                                                    {/* Đối tượng đặc trị */}
                                                    {(() => {
                                                        const tgts = parseList(activeResearch.targets);
                                                        if (tgts.length === 0) return null;
                                                        return (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-stone-500 block mb-1">ĐỐI TƯỢNG ĐẶC TRỊ:</span>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {tgts.map((tgt, i) => (
                                                                        <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800">
                                                                            {tgt}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Phối hợp tương thích tăng lực */}
                                                    {(() => {
                                                        const syns = parseList(activeResearch.compatible_synergies);
                                                        if (syns.length === 0) return null;
                                                        return (
                                                            <div>
                                                                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block mb-1">GỢI Ý PHỐI HỢP TƯƠNG THÍCH (TĂNG HIỆU LỰC):</span>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {syns.map((syn, i) => (
                                                                        <span key={i} className="px-2 py-0.5 rounded-lg bg-sky-100/70 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 font-bold text-[10px] border border-sky-300 dark:border-sky-800">
                                                                            + {syn}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Tương kỵ */}
                                                    {(() => {
                                                        const incs = parseList(activeResearch.incompatible_warnings || activeResearch.incompatibilities);
                                                        if (incs.length === 0) return null;
                                                        return (
                                                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 space-y-0.5">
                                                                <span className="font-bold flex items-center gap-1 text-[10px] uppercase text-rose-700 dark:text-rose-400">
                                                                    <AlertTriangle size={11} /> Cảnh báo tương kỵ:
                                                                </span>
                                                                {incs.map((inc, i) => (
                                                                    <p key={i}>• {inc}</p>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-stone-600 dark:text-stone-300 text-xs space-y-1">
                                                    <p className="font-semibold text-amber-800 dark:text-amber-300">Chưa có dữ liệu dược học chuyên sâu</p>
                                                    <p className="text-[11px] text-stone-500">Bấm nút "AI Research" phía trên để Gemini tự động phân tích cơ chế, hoạt chất tương thích và đối tượng trị.</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Quick filter inside drawer */}
                                {(selectedIngDetail.products?.length || 0) > 3 && (
                                    <div className="px-5 pt-3 pb-1">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <input
                                                type="text"
                                                value={drawerSearch}
                                                onChange={(e) => setDrawerSearch(e.target.value)}
                                                placeholder="Lọc sản phẩm trong hoạt chất..."
                                                className="w-full pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-emerald-600"
                                            />
                                            {drawerSearch && (
                                                <button onClick={() => setDrawerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Product list */}
                                <div className="p-5 space-y-2.5 flex-1 overflow-y-auto">
                                    {(selectedIngDetail.products || [])
                                        .filter(p => {
                                            if (!drawerSearch.trim()) return true;
                                            const t = drawerSearch.toLowerCase();
                                            return (p.name && p.name.toLowerCase().includes(t)) ||
                                                   (p.code && p.code.toLowerCase().includes(t)) ||
                                                   (p.brand && p.brand.toLowerCase().includes(t));
                                        })
                                        .map(p => (
                                            <div
                                                key={p.id}
                                                className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#19271e]/90 border border-stone-200/90 dark:border-white/10 hover:border-emerald-500/60 hover:shadow-md transition-all group flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold line-clamp-1 mt-0.5">
                                                        {p.active_ingredient}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-1.5">
                                                        <span className="bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md font-mono">
                                                            {p.code || `ID:${p.id}`}
                                                        </span>
                                                        {p.brand && (
                                                            <span className="bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md">
                                                                {p.brand}
                                                            </span>
                                                        )}
                                                        <span className="bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                                                            Tồn: {p.stock ?? 0} {p.unit}
                                                        </span>
                                                    </div>
                                                </div>
                                                {onOpenEditProduct && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedIngDetail(null);
                                                            onOpenEditProduct(p);
                                                        }}
                                                        className="p-2 rounded-xl text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all shrink-0"
                                                        title="Mở sửa sản phẩm"
                                                    >
                                                        <ExternalLink size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* MODAL BATCH AI RESEARCH TOÀN BỘ KHO HÀNG */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showBatchModal && (
                        <div className="fixed inset-0 z-[999999] isolate flex items-center justify-center p-4">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs"
                                onClick={() => {
                                    if (!batchRunning) setShowBatchModal(false);
                                }}
                            />

                            <m.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="relative w-full max-w-xl bg-[#faf8f5] dark:bg-[#142018] rounded-3xl shadow-2xl border border-emerald-600/30 dark:border-white/10 overflow-hidden flex flex-col z-10 max-h-[90vh]"
                            >
                                {/* Header */}
                                <div className="p-5 border-b border-stone-200/80 dark:border-white/10 flex items-start justify-between gap-3 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                            <Cpu size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                                AI Research Toàn Bộ Hoạt Chất Kho
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                                                    Gemini AI
                                                </span>
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                                                Tự động phân tích chuyên sâu MOA, đối tượng đặc trị & phối hợp tương thích
                                            </p>
                                        </div>
                                    </div>

                                    {!batchRunning && (
                                        <button
                                            type="button"
                                            onClick={() => setShowBatchModal(false)}
                                            className="p-2 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                                    {/* Thống kê 3 cột */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-2xl bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 text-center">
                                            <span className="text-[10px] font-black uppercase text-stone-400 block mb-0.5">Hoạt chất kho</span>
                                            <strong className="text-lg font-black text-stone-800 dark:text-stone-100">{warehouseActivesList.length}</strong>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">Đã có hồ sơ AI</span>
                                            <strong className="text-lg font-black text-emerald-700 dark:text-emerald-300">{researchedList.length}</strong>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block mb-0.5">Cần AI nghiên cứu</span>
                                            <strong className="text-lg font-black text-amber-700 dark:text-amber-400">{unresearchedList.length}</strong>
                                        </div>
                                    </div>

                                    {/* Chọn chế độ (chỉ khi chưa chạy) */}
                                    {!batchRunning && (
                                        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-stone-200 dark:border-white/10 space-y-2">
                                            <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block">
                                                Chọn phạm vi nghiên cứu:
                                            </span>
                                            <div className="space-y-1.5">
                                                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-stone-200/40 dark:hover:bg-white/5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="batchMode"
                                                        value="unresearched"
                                                        checked={batchMode === 'unresearched'}
                                                        onChange={() => setBatchMode('unresearched')}
                                                        className="text-emerald-600 accent-emerald-600 cursor-pointer"
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-stone-800 dark:text-stone-200">
                                                            Chỉ nghiên cứu {unresearchedList.length} hoạt chất chưa có dữ liệu AI
                                                        </span>
                                                        <span className="text-[11px] text-stone-500 block">
                                                            (Khuyên dùng - Nhanh chóng và tiết kiệm thời gian)
                                                        </span>
                                                    </div>
                                                </label>

                                                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-stone-200/40 dark:hover:bg-white/5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="batchMode"
                                                        value="all"
                                                        checked={batchMode === 'all'}
                                                        onChange={() => setBatchMode('all')}
                                                        className="text-emerald-600 accent-emerald-600 cursor-pointer"
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-stone-800 dark:text-stone-200">
                                                            Nghiên cứu lại toàn bộ {warehouseActivesList.length} hoạt chất trong kho
                                                        </span>
                                                        <span className="text-[11px] text-stone-500 block">
                                                            (Ghi đè và cập nhật thông tin dược học mới nhất từ Gemini)
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tiến trình khi đang chạy */}
                                    {batchRunning && (
                                        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-2.5">
                                            <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                                <span className="flex items-center gap-2">
                                                    <RefreshCw size={14} className="animate-spin text-indigo-600" />
                                                    Đang phân tích: <strong className="text-indigo-700 dark:text-indigo-300 underline font-black">{batchCurrentName}</strong>
                                                </span>
                                                <span>
                                                    {batchProgress.current} / {batchProgress.total} ({batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0}%)
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 transition-all duration-300"
                                                    style={{
                                                        width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Hộp Nhật Ký Realtime */}
                                    {batchLogs.length > 0 && (
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase text-stone-400 block tracking-wider">
                                                Nhật Ký Nghiên Cứu Thời Gian Thực ({batchLogs.length})
                                            </span>
                                            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 font-mono text-[11px]">
                                                {batchLogs.map((log, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 py-0.5">
                                                        {log.status === 'success' && <CheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" />}
                                                        {log.status === 'error' && <AlertTriangle size={13} className="text-rose-600 shrink-0 mt-0.5" />}
                                                        {log.status === 'stopped' && <Clock size={13} className="text-amber-600 shrink-0 mt-0.5" />}
                                                        <div className="min-w-0 flex-1">
                                                            <strong className="text-stone-800 dark:text-stone-200 font-bold">{log.name}:</strong>{' '}
                                                            <span className={cn(
                                                                log.status === 'success' ? "text-stone-600 dark:text-stone-400" :
                                                                log.status === 'error' ? "text-rose-600 dark:text-rose-400" : "text-amber-600"
                                                            )}>
                                                                {log.text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Controls */}
                                <div className="p-4 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-black/20">
                                    <span className="text-[11px] text-stone-400">
                                        {batchRunning ? "Vui lòng giữ cửa sổ mở trong khi AI đang xử lý..." : "Kết quả được lưu trực tiếp vào cơ sở dữ liệu"}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {batchRunning ? (
                                            <button
                                                type="button"
                                                onClick={stopBatchAiResearch}
                                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <Square size={13} /> Dừng Lại
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBatchModal(false)}
                                                    className="px-4 py-2 bg-stone-200/70 hover:bg-stone-300 dark:bg-white/10 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                    Đóng
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={(batchMode === 'unresearched' ? unresearchedList.length : warehouseActivesList.length) === 0}
                                                    onClick={startBatchAiResearch}
                                                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:scale-[1.02] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    <Play size={13} fill="currentColor" />
                                                    <span>
                                                        Bắt Đầu AI Research ({batchMode === 'all' ? warehouseActivesList.length : unresearchedList.length})
                                                    </span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
