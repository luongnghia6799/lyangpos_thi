import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { 
    Bot, 
    X, 
    TriangleAlert, 
    Camera, 
    Plus, 
    Sparkles, 
    LoaderCircle, 
    Trash2, 
    ArrowRight, 
    CheckCircle2, 
    AlertCircle, 
    Layers, 
    RefreshCw, 
    FileText, 
    BookmarkPlus
} from 'lucide-react';
import Portal from '@/components/widgets/Portal';
import ProductAutocomplete from '../forms/ProductAutocomplete';
import { formatNumber, cn, removeAccents } from '../../lib/utils';

// Helper for fuzzy feature extraction
const normalizeWord = (str) => {
    return removeAccents(String(str || '')).toLowerCase().trim();
};

const extractMatchFeatures = (text) => {
    if (!text) return { clean: '', tokens: new Set(), codes: new Set(), volumes: new Set(), npk: null, coreWords: [] };
    
    let clean = normalizeWord(text);
    
    // NPK formula
    let npk = null;
    const npkMatch = clean.match(/\b(\d{1,2})[\-.](\d{1,2})[\-.](\d{1,2})\b/);
    if (npkMatch) {
        npk = `${npkMatch[1]}-${npkMatch[2]}-${npkMatch[3]}`;
        clean = clean.replace(npkMatch[0], ' ');
    }

    clean = clean.replace(/\bx\s*\d+\b/gi, ' ');

    const volumes = new Set();
    const volRegex = /\b(\d+(?:\.\d+)?)\s*(ml|l|lit|kg|gr|g|cc)\b/g;
    let vMatch;
    while ((vMatch = volRegex.exec(clean)) !== null) {
        let unit = vMatch[2] === 'lit' ? 'l' : (vMatch[2] === 'gr' ? 'g' : vMatch[2]);
        volumes.add(`${vMatch[1]}${unit}`);
    }

    const tokens = clean.split(/[\s\-_,./+*()[\]{}]+/).filter(Boolean);
    const codes = new Set();
    const coreWords = [];

    tokens.forEach(t => {
        if (/^[a-z]+\d+[a-z]*$/i.test(t) || /^\d+[a-z]+$/i.test(t)) {
            if (/^\d+(ml|l|lit|kg|gr|g|cc)$/i.test(t)) {
                volumes.add(t.toLowerCase());
            } else {
                codes.add(t.toLowerCase());
            }
        } else if (t.length > 1 && !/^\d+$/.test(t)) {
            coreWords.push(t.toLowerCase());
        }
    });

    return {
        clean: normalizeWord(text),
        tokens: new Set(tokens),
        codes,
        volumes,
        npk,
        coreWords
    };
};

const isFuzzyWordMatch = (w1, w2) => {
    if (w1 === w2) return true;
    if (w1.length >= 3 && w2.length >= 3) {
        if (w1.includes(w2) || w2.includes(w1)) return true;
        const minLen = Math.min(w1.length, w2.length);
        const maxLen = Math.max(w1.length, w2.length);
        if (maxLen - minLen <= 2) {
            let commonPrefix = 0;
            while (commonPrefix < minLen && w1[commonPrefix] === w2[commonPrefix]) {
                commonPrefix++;
            }
            if (commonPrefix >= 3) return true;
        }
    }
    return false;
};

const scoreProductMatch = (sFeat, product) => {
    if (!product) return 0;
    const pName = product.name || '';
    const pAlias = product.alias || '';
    const pCode = product.code || '';
    const pFullText = `${pName} ${pAlias} ${pCode}`;
    const pFeat = extractMatchFeatures(pFullText);

    if (sFeat.clean === pFeat.clean || sFeat.clean === normalizeWord(pName)) {
        return 20.0;
    }

    let score = 0.0;
    let hasCoreOrNpkMatch = false;

    if (sFeat.npk && pFeat.npk) {
        if (sFeat.npk === pFeat.npk) {
            score += 6.0;
            hasCoreOrNpkMatch = true;
        } else {
            return 0.0;
        }
    }

    let coreMatchCount = 0;
    sFeat.coreWords.forEach(sw => {
        const matched = pFeat.coreWords.some(pw => isFuzzyWordMatch(sw, pw));
        if (matched) coreMatchCount += 1;
    });

    if (coreMatchCount > 0) {
        score += coreMatchCount * 3.5;
        hasCoreOrNpkMatch = true;
    }

    if (!hasCoreOrNpkMatch) return 0.0;

    sFeat.codes.forEach(c => {
        if (pFeat.codes.has(c)) score += 3.0;
    });

    sFeat.volumes.forEach(v => {
        if (pFeat.volumes.has(v)) score += 2.0;
    });

    let overlapCount = 0;
    sFeat.tokens.forEach(t => {
        if (pFeat.tokens.has(t)) overlapCount += 1;
    });
    if (overlapCount > 0) {
        score += (overlapCount / Math.max(sFeat.tokens.size, pFeat.tokens.size)) * 1.5;
    }

    return score;
};

const findBestProductMatch = (scannedName, productsList) => {
    if (!scannedName || !productsList || productsList.length === 0) return null;
    const sFeat = extractMatchFeatures(scannedName);
    let bestMatch = null;
    let maxScore = 0;

    for (const p of productsList) {
        const score = scoreProductMatch(sFeat, p);
        if (score > maxScore) {
            maxScore = score;
            bestMatch = p;
        }
    }

    if (maxScore >= 0.4) return bestMatch;
    return null;
};

export default function AIScanStockConversionModal({
    isOpen = false,
    onClose,
    allProducts = [],
    mappings = [],
    onAddBatchToQueue,
    onSaveMappingQuick,
    showToast,
    settings = {}
}) {
    const [previewImages, setPreviewImages] = useState([]);
    const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('gemini_api_key') || settings?.gemini_api_key || '');
    const [isScanning, setIsScanning] = useState(false);
    const [step, setStep] = useState('upload'); // 'upload' or 'review'
    const [scannedItems, setScannedItems] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (settings?.gemini_api_key && !apiKeyInput) {
            setApiKeyInput(settings.gemini_api_key);
        }
    }, [settings?.gemini_api_key]);

    // Clipboard Paste Listener
    useEffect(() => {
        if (!isOpen || step !== 'upload') return;

        const handlePaste = (e) => {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                if (target.type === 'text' || target.type === 'password') return;
            }
            const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
            if (!items) return;

            const imageFiles = [];
            for (let idx = 0; idx < items.length; idx++) {
                if (items[idx].type.indexOf('image') !== -1) {
                    const blob = items[idx].getAsFile();
                    if (blob) imageFiles.push(blob);
                }
            }
            if (imageFiles.length > 0) {
                e.preventDefault();
                const promises = imageFiles.map(file => new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                }));
                Promise.all(promises).then(results => {
                    setPreviewImages(prev => [...prev, ...results]);
                    showToast?.(`Đã dán ${imageFiles.length} ảnh từ Clipboard!`, 'success');
                });
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, step]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const promises = files.map(file => new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        }));
        Promise.all(promises).then(results => {
            setPreviewImages(prev => [...prev, ...results]);
        });
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer?.files?.length) {
            const imgFiles = Array.from(e.dataTransfer.files).filter(s => s.type.startsWith('image/'));
            if (imgFiles.length > 0) {
                const promises = imgFiles.map(s => new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(s);
                }));
                Promise.all(promises).then(results => {
                    setPreviewImages(prev => [...prev, ...results]);
                    showToast?.(`Đã thêm ${imgFiles.length} ảnh thả vào!`, 'success');
                });
            }
        }
    };

    // Execute AI Scanning
    const handleStartScan = async () => {
        if (previewImages.length === 0) {
            showToast?.('Vui lòng chọn hoặc dán ít nhất 1 ảnh!', 'error');
            return;
        }

        const effectiveKey = apiKeyInput.trim() || settings?.gemini_api_key || localStorage.getItem('gemini_api_key') || '';
        if (!effectiveKey) {
            showToast?.('Vui lòng nhập Gemini API Key để tiếp tục!', 'error');
            return;
        }

        setIsScanning(true);
        try {
            // Save API key if user typed a new one
            if (apiKeyInput.trim()) {
                localStorage.setItem('gemini_api_key', apiKeyInput.trim());
                if (apiKeyInput.trim() !== settings?.gemini_api_key) {
                    axios.post('/api/settings', { gemini_api_key: apiKeyInput.trim() }).catch(() => {});
                }
            }

            const res = await axios.post('/api/purchase/scan-invoice', {
                images: previewImages,
                api_key: effectiveKey
            });

            const rawItems = res.data || [];
            if (!Array.isArray(rawItems) || rawItems.length === 0) {
                showToast?.('Không phát hiện được thông tin sản phẩm nào từ ảnh.', 'error');
                setIsScanning(false);
                return;
            }

            // Map each detected item
            const processed = rawItems.map((item, idx) => {
                const scannedName = item.product_name || item.name || '';
                const qty = Math.max(1, parseFloat(item.quantity) || 1);

                // 1. Try to find matched source product
                const matchedSource = findBestProductMatch(scannedName, allProducts);

                // 2. Check if this source product has a configured mapping
                let matchedDest = null;
                let multiplier = 50;
                let isLinked = false;

                if (matchedSource) {
                    const foundMap = mappings.find(m => m.source_product_id === matchedSource.id);
                    if (foundMap) {
                        matchedDest = allProducts.find(p => p.id === foundMap.dest_product_id) || null;
                        multiplier = foundMap.multiplier || 50;
                        isLinked = true;
                    } else {
                        // Guess dest product: e.g. same name with unit 'kg' or multiplier from source
                        multiplier = matchedSource.multiplier > 1 ? matchedSource.multiplier : 50;
                        const candidate = allProducts.find(p => 
                            p.id !== matchedSource.id && 
                            (normalizeWord(p.name).includes(normalizeWord(matchedSource.name)) || 
                             normalizeWord(matchedSource.name).includes(normalizeWord(p.name))) &&
                            (p.unit?.toLowerCase() === 'kg' || p.unit?.toLowerCase() === 'gói')
                        );
                        if (candidate) matchedDest = candidate;
                    }
                }

                return {
                    id: `${Date.now()}_${idx}`,
                    selected: true,
                    raw_name: scannedName,
                    source_product: matchedSource,
                    dest_product: matchedDest,
                    source_qty: qty,
                    multiplier: multiplier,
                    dest_qty_actual: qty * multiplier,
                    is_linked: isLinked,
                    note: `Quét AI từ: ${scannedName}`
                };
            });

            setScannedItems(processed);
            setStep('review');
            showToast?.(`AI đã trích xuất thành công ${processed.length} mặt hàng!`, 'success');
        } catch (err) {
            console.error('AI Scan Error:', err);
            showToast?.(err.response?.data?.error || err.message || 'Lỗi khi quét ảnh với AI', 'error');
        } finally {
            setIsScanning(false);
        }
    };

    // Item updates in Review table
    const handleUpdateItemSource = (itemId, newSourceId) => {
        const prod = allProducts.find(p => p.id === newSourceId);
        setScannedItems(prev => prev.map(item => {
            if (item.id === itemId) {
                // Check if mapping exists for this new source
                const map = mappings.find(m => m.source_product_id === newSourceId);
                let dest = item.dest_product;
                let mult = item.multiplier;
                let linked = false;

                if (map) {
                    dest = allProducts.find(p => p.id === map.dest_product_id) || dest;
                    mult = map.multiplier;
                    linked = true;
                } else if (prod && prod.multiplier > 1) {
                    mult = prod.multiplier;
                }

                return {
                    ...item,
                    source_product: prod,
                    dest_product: dest,
                    multiplier: mult,
                    dest_qty_actual: item.source_qty * mult,
                    is_linked: linked
                };
            }
            return item;
        }));
    };

    const handleUpdateItemDest = (itemId, newDestId) => {
        const prod = allProducts.find(p => p.id === newDestId);
        setScannedItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, dest_product: prod };
            }
            return item;
        }));
    };

    const handleUpdateItemField = (itemId, field, value) => {
        setScannedItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, [field]: value };
                if (field === 'source_qty' || field === 'multiplier') {
                    const sq = field === 'source_qty' ? Number(value) : item.source_qty;
                    const m = field === 'multiplier' ? Number(value) : item.multiplier;
                    updated.dest_qty_actual = sq * m;
                }
                return updated;
            }
            return item;
        }));
    };

    const handleToggleSelect = (itemId) => {
        setScannedItems(prev => prev.map(i => i.id === itemId ? { ...i, selected: !i.selected } : i));
    };

    const handleToggleSelectAll = () => {
        const anyUnselected = scannedItems.some(i => !i.selected);
        setScannedItems(prev => prev.map(i => ({ ...i, selected: anyUnselected })));
    };

    const handleSaveMappingFromRow = (item) => {
        if (!item.source_product || !item.dest_product) {
            showToast?.('Vui lòng chọn cả SP Nguồn và SP Đích!', 'error');
            return;
        }
        if (onSaveMappingQuick) {
            onSaveMappingQuick(item.source_product.id, item.dest_product.id, item.multiplier);
            setScannedItems(prev => prev.map(i => i.id === item.id ? { ...i, is_linked: true } : i));
        }
    };

    // Confirm and push to queue
    const handleConfirmToQueue = () => {
        const selected = scannedItems.filter(i => i.selected);
        if (selected.length === 0) {
            showToast?.('Vui lòng chọn ít nhất 1 mặt hàng để thêm vào hàng đợi!', 'error');
            return;
        }

        const validItems = [];
        let skipped = 0;

        selected.forEach(item => {
            if (!item.source_product || !item.dest_product || item.dest_qty_actual <= 0) {
                skipped++;
                return;
            }

            validItems.push({
                id: Date.now() + Math.random(),
                source_product: item.source_product,
                dest_product: item.dest_product,
                source_qty: Number(item.source_qty),
                multiplier: Number(item.multiplier),
                dest_qty_actual: Number(item.dest_qty_actual),
                note: item.note || `AI Scan: ${item.source_product.name} ➔ ${item.dest_product.name}`,
                cost_price_source: item.source_product.cost_price || 0,
                cost_price_dest: (item.source_product.cost_price * item.source_qty) / item.dest_qty_actual
            });
        });

        if (validItems.length === 0) {
            showToast?.('Chưa chọn đủ Sản phẩm Nguồn hoặc Sản phẩm Đích cho các mặt hàng được chọn!', 'error');
            return;
        }

        onAddBatchToQueue(validItems);
        showToast?.(`Đã thêm ${validItems.length} mặt hàng từ AI Scan vào hàng đợi xé lẻ!${skipped > 0 ? ` (Bỏ qua ${skipped} mục chưa chọn đủ sản phẩm)` : ''}`, 'success');
        handleClose();
    };

    const handleClose = () => {
        setStep('upload');
        setPreviewImages([]);
        setScannedItems([]);
        onClose?.();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0"
                    onClick={handleClose}
                />

                <m.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col relative z-10 overflow-hidden max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="p-4 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-xs">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                                    AI Scan Ảnh Xé Lẻ Kho Hàng
                                    {step === 'review' && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            Bước 2: Duyệt & Tự Động Khớp Sản Phẩm
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                                    {step === 'upload' 
                                        ? 'Chụp hoặc tải ảnh phiếu cân, toa xé bao, sổ tay kho hàng để AI nhận diện tự động'
                                        : 'Kiểm tra thông tin đã nhận dạng, tự động khớp sản phẩm lẻ theo cài đặt liên kết và thêm vào hàng đợi'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-muted-foreground transition-colors"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6 custom-scrollbar">
                        {step === 'upload' ? (
                            /* PHASE 1: UPLOAD / PASTE IMAGES */
                            <div className="space-y-6">
                                {/* API Key Notice if missing */}
                                {(!settings?.gemini_api_key && !apiKeyInput) && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase">
                                            <TriangleAlert size={16} /> Cần Cấu Hình Gemini API Key
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Vui lòng nhập API Key để sử dụng tính năng nhận diện AI:
                                        </p>
                                        <input
                                            type="password"
                                            value={apiKeyInput}
                                            onChange={e => setApiKeyInput(e.target.value)}
                                            placeholder="Dán Gemini API Key tại đây..."
                                            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-emerald-500 text-foreground"
                                        />
                                    </div>
                                )}

                                {/* Dropzone */}
                                <div
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handleDrop}
                                    className="flex flex-col justify-center items-center border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-emerald-500 rounded-[2rem] p-6 bg-slate-50/50 dark:bg-slate-800/20 min-h-[280px] relative transition-all group"
                                >
                                    {previewImages.length > 0 ? (
                                        <div className="w-full flex flex-col space-y-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
                                                {previewImages.map((src, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group/thumb shadow-xs">
                                                        <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewImages(prev => prev.filter((_, n) => n !== idx))}
                                                            className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all shadow-md opacity-0 group-hover/thumb:opacity-100"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap justify-center gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-xs active:scale-95"
                                                >
                                                    <Plus size={14} strokeWidth={3} /> Thêm ảnh
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImages([])}
                                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all uppercase tracking-wider shadow-xs active:scale-95"
                                                >
                                                    Xóa tất cả
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex flex-col items-center justify-center cursor-pointer space-y-4 w-full h-full py-10"
                                        >
                                            <div className="p-5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full group-hover:scale-110 transition-transform">
                                                <Camera size={40} />
                                            </div>
                                            <div className="text-center space-y-1.5">
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                                    Chọn hoặc Kéo Thả Ảnh Vào Đây
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Hoặc nhấn <strong>Ctrl + V</strong> để dán ảnh trực tiếp từ màn hình / Clipboard
                                                </p>
                                                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider mt-2">
                                                    Hỗ trợ JPG, PNG, WEBP (Nhiều ảnh cùng lúc)
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Tips */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                                    <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div className="text-xs space-y-1">
                                        <p className="font-black text-foreground uppercase tracking-wider">
                                            Mẹo để AI nhận diện xé lẻ chính xác nhất:
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            • Ảnh phiếu cân, sổ ghi chép rõ nét, đủ ánh sáng và không bị mờ nhòe chữ số.<br />
                                            • AI sẽ tự động tìm <strong>sản phẩm nguyên bao</strong> và đối chiếu với <strong>cài đặt liên kết xé lẻ</strong> để tự điền <strong>sản phẩm lẻ</strong> tương ứng.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* PHASE 2: REVIEW & CONFIRM DETECTED ITEMS */
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                            Đã nhận diện {scannedItems.length} mặt hàng từ ảnh
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleToggleSelectAll}
                                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-foreground hover:bg-slate-50"
                                        >
                                            {scannedItems.every(i => i.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </button>
                                        <button
                                            onClick={() => setStep('upload')}
                                            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground"
                                        >
                                            Quét lại ảnh khác
                                        </button>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                                    <th className="p-3 text-center w-10">Chọn</th>
                                                    <th className="p-3 min-w-[200px]">SP Nguồn (Bao xuất)</th>
                                                    <th className="p-3 text-center w-24">Số Bao</th>
                                                    <th className="p-3 text-center w-8">➔</th>
                                                    <th className="p-3 min-w-[200px]">SP Đích (Ký lẻ nhận)</th>
                                                    <th className="p-3 text-center w-28">Tỉ lệ (Kg/Bao)</th>
                                                    <th className="p-3 text-right w-28">Tổng Kg Nhận</th>
                                                    <th className="p-3 text-center w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                {scannedItems.map((item) => (
                                                    <tr 
                                                        key={item.id} 
                                                        className={cn(
                                                            "transition-colors",
                                                            item.selected ? "bg-white dark:bg-slate-900 hover:bg-slate-50/50" : "bg-slate-50/30 dark:bg-slate-900/30 opacity-60"
                                                        )}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.selected}
                                                                onChange={() => handleToggleSelect(item.id)}
                                                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                            />
                                                        </td>

                                                        {/* Source Product */}
                                                        <td className="p-3">
                                                            <div className="space-y-1">
                                                                <div className="text-[10px] font-bold text-muted-foreground truncate" title={item.raw_name}>
                                                                    Ảnh đọc: <em>"{item.raw_name}"</em>
                                                                </div>
                                                                <ProductAutocomplete
                                                                    allProducts={allProducts}
                                                                    value={item.source_product?.id || null}
                                                                    onChange={(id) => handleUpdateItemSource(item.id, id)}
                                                                    placeholder="Chọn SP nguyên bao..."
                                                                    className="w-full text-xs"
                                                                />
                                                                {item.source_product && (
                                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <span>Tồn: <strong>{formatNumber(item.source_product.stock)} {item.source_product.unit}</strong></span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Source Qty */}
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="any"
                                                                value={item.source_qty}
                                                                onChange={e => handleUpdateItemField(item.id, 'source_qty', e.target.value)}
                                                                className="w-20 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-black text-center text-orange-600 outline-none focus:border-primary"
                                                            />
                                                            <div className="text-[9px] font-bold text-muted-foreground mt-0.5">
                                                                {item.source_product?.unit || 'Bao'}
                                                            </div>
                                                        </td>

                                                        {/* Arrow */}
                                                        <td className="p-3 text-center">
                                                            <ArrowRight size={14} className="text-primary mx-auto" />
                                                        </td>

                                                        {/* Destination Product */}
                                                        <td className="p-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    {item.is_linked ? (
                                                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase flex items-center gap-1">
                                                                            <CheckCircle2 size={10} /> Đã Khớp Mẫu
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase flex items-center gap-1">
                                                                            <AlertCircle size={10} /> Chưa Lưu Mẫu
                                                                        </span>
                                                                    )}
                                                                    {(!item.is_linked && item.source_product && item.dest_product) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSaveMappingFromRow(item)}
                                                                            className="text-[9px] font-black text-primary hover:underline flex items-center gap-0.5"
                                                                            title="Lưu cặp này làm liên kết mặc định"
                                                                        >
                                                                            <BookmarkPlus size={10} /> Lưu mẫu
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <ProductAutocomplete
                                                                    allProducts={allProducts}
                                                                    value={item.dest_product?.id || null}
                                                                    onChange={(id) => handleUpdateItemDest(item.id, id)}
                                                                    placeholder="Chọn SP ký lẻ..."
                                                                    className="w-full text-xs"
                                                                />
                                                                {item.dest_product && (
                                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <span>Tồn: <strong>{formatNumber(item.dest_product.stock)} {item.dest_product.unit}</strong></span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Multiplier */}
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="number"
                                                                min="0.1"
                                                                step="any"
                                                                value={item.multiplier}
                                                                onChange={e => handleUpdateItemField(item.id, 'multiplier', e.target.value)}
                                                                className="w-20 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-black text-center text-primary outline-none focus:border-primary"
                                                            />
                                                            <div className="text-[9px] font-bold text-muted-foreground mt-0.5">
                                                                Kg / Bao
                                                            </div>
                                                        </td>

                                                        {/* Dest Qty Actual */}
                                                        <td className="p-3 text-right">
                                                            <input
                                                                type="number"
                                                                min="0.1"
                                                                step="any"
                                                                value={item.dest_qty_actual}
                                                                onChange={e => handleUpdateItemField(item.id, 'dest_qty_actual', e.target.value)}
                                                                className="w-24 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-black text-right text-emerald-600 dark:text-emerald-400 outline-none focus:border-primary"
                                                            />
                                                            <div className="text-[9px] font-bold text-muted-foreground mt-0.5">
                                                                {item.dest_product?.unit || 'Kg'}
                                                            </div>
                                                        </td>

                                                        {/* Delete Row */}
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={() => setScannedItems(prev => prev.filter(i => i.id !== item.id))}
                                                                className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
                        {step === 'upload' ? (
                            <>
                                <div className="text-xs text-muted-foreground font-medium">
                                    {previewImages.length > 0 ? `Đã chọn ${previewImages.length} ảnh để quét` : 'Chưa có ảnh nào'}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground font-black text-xs uppercase tracking-wider transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleStartScan}
                                        disabled={isScanning || previewImages.length === 0}
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-40 active:scale-95"
                                    >
                                        {isScanning ? (
                                            <>
                                                <LoaderCircle size={16} className="animate-spin" />
                                                <span>AI Đang Phân Tích...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                <span>Bắt Đầu Quét AI</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-xs text-muted-foreground font-medium">
                                    Đã chọn <strong>{scannedItems.filter(i => i.selected).length}</strong> / {scannedItems.length} mặt hàng
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setStep('upload')}
                                        className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground font-black text-xs uppercase tracking-wider transition-all"
                                    >
                                        Quay lại
                                    </button>
                                    <button
                                        onClick={handleConfirmToQueue}
                                        disabled={scannedItems.filter(i => i.selected).length === 0}
                                        className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-40 active:scale-95"
                                    >
                                        <Plus size={16} strokeWidth={2.5} />
                                        <span>Thêm Vào Danh Sách Chờ Quy Đổi ({scannedItems.filter(i => i.selected).length})</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </m.div>
            </div>
        </Portal>
    );
}
