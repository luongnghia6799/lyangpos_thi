import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence, MotionConfig } from 'framer-motion';
import { Search, Plus, Minus, Trash2, Save, X, Printer, User, Users, Phone, FileText, ShoppingCart, Activity, History, Menu, Package, TrendingDown, TrendingUp, AlertTriangle, AlertCircle, Truck, Pause, RotateCcw, Sprout, Wheat, Droplets, Coins, Leaf, Warehouse, Eye, Keyboard, ChevronLeft, ChevronRight, Loader2, Clock, MapPin, Wallet, Bot, Sparkles, Camera, Upload, Check, PanelRight, PanelBottom, Banknote, CreditCard, ArrowRight, ArrowLeftRight, ReceiptText, ShoppingBag, Bell } from 'lucide-react';
import HeavyClock from '../../components/HeavyClock';
import { formatCurrency, formatNumber, formatDebt, formatDate, normalizeUOM, removeAccents } from '../../lib/utils';
import { cn, playSuccessSound, playTickSound, playPopSound, playErrorSound, playTabSound } from '../../lib/utils';
import { useLocation } from 'react-router-dom';
import { DEFAULT_SETTINGS } from '../../lib/settings';
import Toast from '../../components/Toast';
import ProductEditModal from '../../components/ProductEditModal';
import PartnerEditModal from '../../components/PartnerEditModal';
import PrintTemplate from '../../components/PrintTemplate';
import LoadingOverlay from '../../components/LoadingOverlay';
import Portal from '../../components/Portal';
import POSHistoryPanel from '../../components/POSHistoryPanel';
import OrderEditPopup from '../../components/OrderEditPopup';
import ConfirmModal from '../../components/ConfirmModal';
import ConsignmentPanel from '../../components/ConsignmentPanel';
import DailyOrderHistoryModal from '../../components/DailyOrderHistoryModal';
import MarqueeText from '../../components/MarqueeText';
import PartnerInfoHoverCard from '../../components/PartnerInfoHoverCard';
import CustomSelect from '../../components/CustomSelect';
import PriceRaiseModal from '../../components/PriceRaiseModal';
import LyangLogo from '../../assets/logo.png';

import { useProductData, usePartnerData } from '../../queries/useProductData';
import { useQueryClient } from '@tanstack/react-query';


const SearchableProductSelect = ({ value, onChange, products }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedProduct = products.find(p => p.id === Number(value));
    const displayValue = selectedProduct 
        ? `${selectedProduct.name} (${selectedProduct.unit})`
        : (value === 'NEW' ? '✨ Tạo sản phẩm mới vào kho' : (value === 'CUSTOM' ? '📝 Thêm sản phẩm tự do' : '❌ Bỏ qua sản phẩm này'));

    const filtered = products.filter(p => 
        removeAccents(p.name.toLowerCase()).includes(removeAccents(search.toLowerCase())) ||
        (p.code && removeAccents(p.code.toLowerCase()).includes(removeAccents(search.toLowerCase())))
    ).slice(0, 8);

    return (
        <div ref={containerRef} className="relative w-full">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black text-gray-700 dark:text-gray-200 outline-none cursor-pointer flex justify-between items-center transition-all hover:border-emerald-500/50"
            >
                <span className="truncate">{displayValue}</span>
                <span className="text-[8px] opacity-40 ml-2">▼</span>
            </div>
            
            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[9999] p-2 space-y-1.5 max-h-[250px] overflow-y-auto">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Gõ để tìm kiếm..."
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black outline-none focus:border-emerald-500"
                        autoFocus
                    />
                    <div className="space-y-0.5">
                        <button
                            type="button"
                            onClick={() => { onChange('NEW'); setIsOpen(false); }}
                            className="w-full text-left p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-black text-emerald-600 flex items-center gap-1"
                        >
                            ✨ Tạo sản phẩm mới vào kho
                        </button>
                        <button
                            type="button"
                            onClick={() => { onChange('CUSTOM'); setIsOpen(false); }}
                            className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-black text-blue-600 flex items-center gap-1"
                        >
                            📝 Thêm sản phẩm tự do (không quản lý kho)
                        </button>
                        <button
                            type="button"
                            onClick={() => { onChange('SKIP'); setIsOpen(false); }}
                            className="w-full text-left p-2 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-black text-red-600 flex items-center gap-1"
                        >
                            ❌ Bỏ qua sản phẩm này
                        </button>
                        
                        {filtered.length > 0 && <div className="border-t dark:border-slate-800 my-1"></div>}
                        
                        {filtered.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => { onChange(p.id); setIsOpen(false); }}
                                className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate"
                            >
                                {p.name} ({p.unit})
                            </button>
                        ))}
                        {filtered.length === 0 && search && (
                            <div className="p-2 text-center text-[10px] text-gray-400 italic">Không tìm thấy sản phẩm</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Purchase() {
    const { data: productsData, isLoading: isLoadingProducts } = useProductData();
    const [gpuDisabled, setGpuDisabled] = useState(() => localStorage.getItem("pos_gpu_disabled") === "true");

    useEffect(() => {
        const handleGpuState = () => {
            setGpuDisabled(localStorage.getItem("pos_gpu_disabled") === "true");
        };
        window.addEventListener("gpu_state_changed", handleGpuState);
        window.addEventListener("storage", handleGpuState);
        return () => {
            window.removeEventListener("gpu_state_changed", handleGpuState);
            window.removeEventListener("storage", handleGpuState);
        };
    }, []);
    const { data: partnersData, isLoading: isLoadingPartners } = usePartnerData();
    const queryClient = useQueryClient();

    const products = Array.isArray(productsData) ? productsData : (Array.isArray(productsData?.items) ? productsData.items : (Array.isArray(productsData?.products) ? productsData.products : []));
    const partners = Array.isArray(partnersData) ? partnersData : (Array.isArray(partnersData?.items) ? partnersData.items : (Array.isArray(partnersData?.partners) ? partnersData.partners : []));

    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [partnerSearch, setPartnerSearch] = useState('');
    const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
    const [isPartnerHovered, setIsPartnerHovered] = useState(false);
    const [isPartnerSearchExpanded, setIsPartnerSearchExpanded] = useState(false);
    const [note, setNote] = useState('');
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const actionMenuRef = React.useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
                setIsActionMenuOpen(false);
            }
        };
        if (isActionMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActionMenuOpen]);
    const [bottomSummaryHeight, setBottomSummaryHeight] = useState(() => Number(localStorage.getItem('purchase_bottom_summary_height')) || 115);
    const [isResizingBottom, setIsResizingBottom] = useState(false);
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState(() => ((localStorage.getItem('unified_pos_mode') || 'Wholesale') === 'Wholesale' ? 'Debt' : 'Cash'));
    const [lastOrder, setLastOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editOrderId, setEditOrderId] = useState(null);
    const [editingOriginalOrder, setEditingOriginalOrder] = useState(null);
    const [pendingPartnerId, setPendingPartnerId] = useState(null);
    const [historyStep, setHistoryStep] = useState(0); // 0 = new invoice, 1 = last, 2 = 2nd last...
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [showQuickAddPartner, setShowQuickAddPartner] = useState(false);
    const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [zoomScale, setZoomScale] = useState(1);
    const [printOptions, setPrintOptions] = useState({
        showOldDebt: true,
        showPayment: true,
        showRemaining: true,
        showCashGiven: true,
        showChange: true
    });
    const [toast, setToast] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
    const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);
    const location = useLocation();

    // AI Receipt Scan States
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [scannedImages, setScannedImages] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [scanApiKey, setScanApiKey] = useState('');
    const [scanMapping, setScanMapping] = useState({});
    const [saveNoticeStyle, setSaveNoticeStyle] = useState(() => localStorage.getItem("pos_save_notice_style") || "card");

    // Price Raise Warning States
    const [priceRaiseItems, setPriceRaiseItems] = useState([]);
    const [isPriceRaiseModalOpen, setIsPriceRaiseModalOpen] = useState(false);
    const [dismissedPriceRaises, setDismissedPriceRaises] = useState({}); // { [productId]: price }

    const checkPriceRaiseAlert = (itemsToCheck, force = false) => {
        if (!itemsToCheck || !Array.isArray(itemsToCheck) || itemsToCheck.length === 0) return;
        const triggered = [];
        itemsToCheck.forEach(item => {
            if (!item.product_id) return;
            const prod = products.find(p => p.id === item.product_id);
            if (prod && prod.sale_price > 0 && item.price > prod.sale_price) {
                if (!force && dismissedPriceRaises[prod.id] === item.price) {
                    return;
                }
                triggered.push({
                    productId: prod.id,
                    productName: prod.name,
                    unit: prod.unit,
                    costPrice: item.price,
                    currentSalePrice: prod.sale_price
                });
            }
        });
        if (triggered.length > 0) {
            setPriceRaiseItems(triggered);
            setIsPriceRaiseModalOpen(true);
        }
    };

    const handleDismissPriceRaise = () => {
        setDismissedPriceRaises(prev => {
            const next = { ...prev };
            priceRaiseItems.forEach(i => {
                next[i.productId] = i.costPrice;
            });
            return next;
        });
        setIsPriceRaiseModalOpen(false);
    };

    const handlePriceRaiseSuccess = (updatedItems) => {
        setToast({
            message: `Đã nâng giá bán thành công cho ${updatedItems.length} sản phẩm!`,
            type: 'success'
        });
        setIsPriceRaiseModalOpen(false);
    };

    const GENERIC_AGRI_WORDS = new Set([
        'co', 'thuoc', 'phan', 'bon', 'sau', 'ray', 'benh', 'duong', 'chai',
        'goi', 'can', 'xit', 'tri', 'giet', 'diet', 'tru', 'hop', 'thung',
        'bao', 'kg', 'gr', 'g', 'ml', 'l', 'lit', 'x', 'loai', 'hieu', 'syngenta', 'hop tri', 'basf'
    ]);

    const normalizeWord = (str) => {
        return removeAccents(String(str || '')).toLowerCase().trim();
    };

    const extractMatchFeatures = (text) => {
        if (!text) return { clean: '', tokens: new Set(), codes: new Set(), volumes: new Set(), npk: null, coreWords: [] };
        
        let clean = normalizeWord(text);
        
        // 1. Detect NPK formula (e.g. 20-20-15, 20.20.15, 16.16.8, 30-10-10)
        let npk = null;
        const npkMatch = clean.match(/\b(\d{1,2})[\-.](\d{1,2})[\-.](\d{1,2})\b/);
        if (npkMatch) {
            npk = `${npkMatch[1]}-${npkMatch[2]}-${npkMatch[3]}`;
            clean = clean.replace(npkMatch[0], ' ');
        }

        // 2. Remove pack multiplier pattern like 'x 20', 'x20', 'x 24' so it doesn't pollute codes
        clean = clean.replace(/\bx\s*\d+\b/gi, ' ');

        // 3. Extract volume / weight specifications (450ml, 1l, 25kg, 500g, etc.)
        const volumes = new Set();
        const volRegex = /\b(\d+(?:\.\d+)?)\s*(ml|l|lit|kg|gr|g|cc)\b/g;
        let vMatch;
        while ((vMatch = volRegex.exec(clean)) !== null) {
            let unit = vMatch[2] === 'lit' ? 'l' : (vMatch[2] === 'gr' ? 'g' : vMatch[2]);
            volumes.add(`${vMatch[1]}${unit}`);
        }

        // 4. Extract tokens
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
            } else if (t.length > 1 && !GENERIC_AGRI_WORDS.has(t) && !/^\d+$/.test(t)) {
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
                if (commonPrefix >= 4 || (minLen <= 4 && commonPrefix >= 3)) return true;
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

        // 1. NPK Formula Match (Critical for fertilizers: 20-20-15, 16-16-8...)
        if (sFeat.npk && pFeat.npk) {
            if (sFeat.npk === pFeat.npk) {
                score += 6.0;
                hasCoreOrNpkMatch = true;
            } else {
                return 0.0; // Conflicting NPK -> zero score
            }
        } else if (sFeat.npk && !pFeat.npk) {
            score -= 2.0;
        }

        // 2. Core Words Matching (Brand, Name, Active Ingredient)
        let coreMatchCount = 0;
        sFeat.coreWords.forEach(sw => {
            const matched = pFeat.coreWords.some(pw => isFuzzyWordMatch(sw, pw));
            if (matched) {
                coreMatchCount += 1;
            }
        });

        if (coreMatchCount > 0) {
            score += coreMatchCount * 3.5;
            hasCoreOrNpkMatch = true;
        } else if (pFeat.coreWords.length > 0 && sFeat.coreWords.length > 0) {
            score -= 2.0;
        }

        // GUARD-RAIL: If neither core brand words nor NPK match, DO NOT MATCH!
        if (!hasCoreOrNpkMatch) {
            return 0.0;
        }

        // 3. Formulation / Alphanumeric Codes (425EC, 250SC, 70WP, Q7, 24H...)
        sFeat.codes.forEach(c => {
            if (pFeat.codes.has(c)) {
                score += 3.0;
            } else if (pFeat.codes.size > 0) {
                score -= 1.0;
            }
        });

        // 4. Volume / Weight Matching (450ml, 1l, 25kg, 1kg...)
        sFeat.volumes.forEach(v => {
            if (pFeat.volumes.has(v)) {
                score += 2.0;
            } else if (pFeat.volumes.size > 0) {
                score -= 1.0;
            }
        });

        // 5. Token Overlap & Substring inclusion
        let overlapCount = 0;
        sFeat.tokens.forEach(t => {
            if (pFeat.tokens.has(t)) overlapCount += 1;
        });
        if (overlapCount > 0) {
            score += (overlapCount / Math.max(sFeat.tokens.size, pFeat.tokens.size)) * 1.5;
        }

        const cleanProdName = normalizeWord(pName);
        if (sFeat.clean.includes(cleanProdName) || cleanProdName.includes(sFeat.clean)) {
            score += 2.0;
        }

        return Math.max(0, score);
    };

    const findBestMatch = (scannedName, productsList) => {
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

        if (maxScore >= 0.5) {
            return bestMatch;
        }
        return null;
    };

    const getTopMatches = (scannedName, productsList, limit = 3) => {
        if (!scannedName || !productsList || productsList.length === 0) return [];
        const sFeat = extractMatchFeatures(scannedName);

        const scored = productsList.map(p => ({
            product: p,
            score: scoreProductMatch(sFeat, p)
        }));

        return scored
            .filter(item => item.score >= 0.3)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.product);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const promises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(results => {
            setScannedImages(prev => [...prev, ...results]);
        });
    };

    const handleScanInvoice = async () => {
        if (scannedImages.length === 0) return;
        setIsScanning(true);
        try {
            const res = await axios.post('/api/purchase/scan-invoice', {
                images: scannedImages,
                api_key: scanApiKey || settings.gemini_api_key || ''
            });
            
            if (scanApiKey && scanApiKey !== settings.gemini_api_key) {
                await axios.post('/api/settings', { gemini_api_key: scanApiKey });
                setSettings(prev => ({ ...prev, gemini_api_key: scanApiKey }));
            }

            const items = res.data || [];
            if (items.length === 0) {
                setToast({ message: 'Không phát hiện được sản phẩm nào trong hóa đơn.', type: 'error' });
                return;
            }

            const newCart = [...cart];
            items.forEach(item => {
                const match = findBestMatch(item.product_name, products);
                const qtyToAdd = item.quantity || 1;
                const appliedPrice = item.price || 0;

                if (match) {
                    const existingIdx = newCart.findIndex(c => c.product_id === match.id && c.price === appliedPrice);
                    if (existingIdx > -1) {
                        newCart[existingIdx].quantity += qtyToAdd;
                        newCart[existingIdx].secondary_qty = newCart[existingIdx].quantity / (match.multiplier || 1);
                    } else {
                        newCart.unshift({
                            product_id: match.id,
                            product_name: match.name,
                            unit: match.unit,
                            secondary_unit: match.secondary_unit,
                            multiplier: match.multiplier || 1,
                            price: appliedPrice,
                            quantity: qtyToAdd,
                            secondary_qty: qtyToAdd / (match.multiplier || 1),
                            stock: match.stock,
                            active_ingredient: match.active_ingredient,
                            ai_scanned: true,
                            ai_original_name: item.product_name,
                            ai_matched_status: 'matched'
                        });
                    }
                } else {
                    newCart.unshift({
                        product_id: null,
                        product_name: item.product_name,
                        unit: item.unit || 'Cái',
                        secondary_unit: null,
                        multiplier: 1,
                        price: appliedPrice,
                        quantity: qtyToAdd,
                        secondary_qty: qtyToAdd,
                        stock: 0,
                        active_ingredient: null,
                        ai_scanned: true,
                        ai_original_name: item.product_name,
                        ai_matched_status: 'unmatched'
                    });
                }
            });

            setCart(newCart);
            setIsScanModalOpen(false);
            setScannedImages([]);
            playSuccessSound();
            setToast({ message: `Quét thành công! Đã tự động thêm ${items.length} sản phẩm vào đơn hàng.`, type: 'success' });
            setTimeout(() => checkPriceRaiseAlert(newCart), 350);
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.error || 'Có lỗi xảy ra khi quét hóa đơn.', type: 'error' });
        } finally {
            setIsScanning(false);
        }
    };

    const importScannedItems = async () => {
        setLoading(true);
        try {
            const newCart = [...cart];
            for (let i = 0; i < scannedItems.length; i++) {
                const item = scannedItems[i];
                const mapping = scanMapping[i];
                
                if (mapping === 'SKIP') {
                    continue;
                }
                
                let targetProduct = null;
                if (mapping === 'NEW') {
                    try {
                        const newProdRes = await axios.post('/api/products', {
                            name: item.product_name,
                            unit: item.unit || 'Cái',
                            cost_price: item.price || 0,
                            sale_price: Math.round((item.price || 0) * 1.2),
                            stock: 0
                        });
                        targetProduct = newProdRes.data;
                        queryClient.invalidateQueries({ queryKey: ['products'] });
                    } catch (createErr) {
                        console.error("Lỗi tạo sản phẩm mới:", createErr);
                        targetProduct = {
                            id: null,
                            name: item.product_name,
                            unit: item.unit || 'Cái',
                            cost_price: item.price || 0,
                            latest_cost_price: item.price || 0,
                            multiplier: 1
                        };
                    }
                } else if (mapping === 'CUSTOM') {
                    targetProduct = {
                        id: null,
                        name: item.product_name,
                        unit: item.unit || 'Cái',
                        cost_price: item.price || 0,
                        latest_cost_price: item.price || 0,
                        multiplier: 1
                    };
                } else {
                    targetProduct = products.find(p => p.id === Number(mapping));
                }
                
                if (targetProduct) {
                    const qtyToAdd = item.quantity || 1;
                    const appliedPrice = item.price || 0;
                    
                    if (targetProduct.id) {
                        const existingIdx = newCart.findIndex(c => c.product_id === targetProduct.id && c.price === appliedPrice);
                        if (existingIdx > -1) {
                            newCart[existingIdx].quantity += qtyToAdd;
                            newCart[existingIdx].secondary_qty = newCart[existingIdx].quantity / (targetProduct.multiplier || 1);
                        } else {
                            newCart.unshift({
                                product_id: targetProduct.id,
                                product_name: targetProduct.name,
                                unit: targetProduct.unit,
                                secondary_unit: targetProduct.secondary_unit,
                                multiplier: targetProduct.multiplier || 1,
                                price: appliedPrice,
                                quantity: qtyToAdd,
                                secondary_qty: qtyToAdd / (targetProduct.multiplier || 1),
                                stock: targetProduct.stock,
                                active_ingredient: targetProduct.active_ingredient
                            });
                        }
                    } else {
                        newCart.unshift({
                            product_id: null,
                            product_name: targetProduct.name,
                            unit: targetProduct.unit,
                            secondary_unit: null,
                            multiplier: 1,
                            price: appliedPrice,
                            quantity: qtyToAdd,
                            secondary_qty: qtyToAdd,
                            stock: 0,
                            active_ingredient: null
                        });
                    }
                }
            }
            
            setCart(newCart);
            setIsScanModalOpen(false);
            setScannedImage(null);
            setScannedItems([]);
            playSuccessSound();
            setToast({ message: "Đã nhập danh sách hàng từ hóa đơn thành công!", type: "success" });
            setTimeout(() => checkPriceRaiseAlert(newCart), 350);
        } catch (err) {
            console.error(err);
            setToast({ message: "Có lỗi xảy ra khi nhập hàng.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const [heldPurchases, setHeldPurchases] = useState(() => {
        const saved = localStorage.getItem('held_purchases');
        return saved ? JSON.parse(saved) : [];
    });
    const [isHeldSidebarOpen, setIsHeldSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
        const [keepOrderAfterSave, setKeepOrderAfterSave] = useState(() => localStorage.getItem("pos_keep_order_after_save") === "true");
const [summaryLayoutMode, setSummaryLayoutMode] = useState(() => localStorage.getItem('purchase_summary_layout_mode') || 'sidebar');
    const toggleSummaryLayout = () => {
        const next = summaryLayoutMode === 'sidebar' ? 'bottom' : 'sidebar';
        setSummaryLayoutMode(next);
        localStorage.setItem('purchase_summary_layout_mode', next);
    };
    const [posMode, setPosMode] = useState(() => localStorage.getItem('unified_pos_mode') || 'Wholesale');

    const [bubblePos, setBubblePos] = useState(() => {
        try {
            const saved = localStorage.getItem("purchase_bubble_positions");
            return saved ? JSON.parse(saved) : { partner: { x: 0, y: 0 }, total: { x: 0, y: 0 } };
        } catch {
            return { partner: { x: 0, y: 0 }, total: { x: 0, y: 0 } };
        }
    });

    const updateBubblePos = (id, offset) => {
        setBubblePos(prev => {
            let newX = prev[id].x + offset.x;
            let newY = prev[id].y + offset.y;

            if (id === 'partner') {
                newX = Math.max(-20, Math.min(newX, 800));
                newY = Math.max(-500, Math.min(newY, 20));
            } else if (id === 'total') {
                newX = Math.max(-800, Math.min(newX, 20));
                newY = Math.max(-500, Math.min(newY, 20));
            }

            const newPos = {
                ...prev,
                [id]: { x: newX, y: newY }
            };
            localStorage.setItem("purchase_bubble_positions", JSON.stringify(newPos));
            return newPos;
        });
    };

    const handleStartResizeBottom = (e) => {
        e.preventDefault();
        setIsResizingBottom(true);
        const startY = e.clientY;
        const startH = bottomSummaryHeight;
        const onMouseMove = (moveEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const newH = Math.min(Math.max(startH + deltaY, 70), 320);
            setBottomSummaryHeight(newH);
        };
        const onMouseUp = () => {
            setIsResizingBottom(false);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            setBottomSummaryHeight((finalH) => {
                localStorage.setItem("purchase_bottom_summary_height", finalH.toString());
                return finalH;
            });
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const [workingItem, setWorkingItem] = useState({ product: null, quantity: 1, price: 0, secondary_qty: 0, name: '' });
    const [rowSearchIdx, setRowSearchIdx] = useState(null);
    const [rowSearchTerm, setRowSearchTerm] = useState('');
    const [rowActiveIndex, setRowActiveIndex] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const quantityRefs = React.useRef({});
    const searchInputRef = React.useRef(null);
    const workingQtyRef = React.useRef(null);
    const workingPriceRef = React.useRef(null);
    const workingSecQtyRef = React.useRef(null);
    const partnerDropdownRef = React.useRef(null);
    const productDropdownRef = React.useRef(null);
    const rowSearchDropdownRef = React.useRef(null);
    const partnerInputRef = React.useRef(null);

    const [isPartnerEditModalOpen, setIsPartnerEditModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);

    const [isLoaded, setIsLoaded] = useState(false);
  // HeavyClock handles time
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [isDailyHistoryOpen, setIsDailyHistoryOpen] = useState(false);
    const [isConsignment, setIsConsignment] = useState(false);
    const [isConsignmentPanelOpen, setIsConsignmentPanelOpen] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [hasConsignmentOrders, setHasConsignmentOrders] = useState(false);
    const [savedOrderNotice, setSavedOrderNotice] = useState(null);

    const refreshConsignmentStatus = async (partnerId) => {
        const pId = partnerId !== undefined ? partnerId : selectedPartner?.id;
        if (!pId) {
            setHasConsignmentOrders(false);
            return;
        }
        try {
            const res = await axios.get(`/api/orders?type=Purchase&is_consignment=true&partner_id=${pId}&limit=1`);
            const items = res.data.items || res.data || [];
            setHasConsignmentOrders(items.length > 0);
        } catch (err) {
            console.error("Error checking consignment orders for partner:", err);
            setHasConsignmentOrders(false);
        }
    };

    useEffect(() => {
        refreshConsignmentStatus();
    }, [selectedPartner]);

    // Handled by HeavyClock

    // Auto-Magnet Focus cho trang Nhập hàng: Tự động nhảy vào ô số lượng khi chọn hàng
    useEffect(() => {
        if (workingItem.product) {
            const timer = setTimeout(() => {
                const targetRef = (posMode === 'Wholesale' && workingItem.product.secondary_unit) ? workingSecQtyRef : workingQtyRef;
                if (targetRef.current) {
                    targetRef.current.focus();
                    targetRef.current.select?.();
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [workingItem.product, posMode]);

    const currentWorkingTotal = useMemo(() => workingItem.product ? (workingItem.price * workingItem.quantity) : 0, [workingItem.product, workingItem.price, workingItem.quantity]);
    const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + currentWorkingTotal, [cart, currentWorkingTotal]);
    const totalItems = useMemo(() => cart.length + (workingItem.product ? 1 : 0), [cart, workingItem.product]);
    const totalQty = useMemo(() => cart.reduce((sum, item) => sum + (item.quantity || 0), 0) + (workingItem.quantity || 0), [cart, workingItem.quantity]);
    const totalSecondaryQty = useMemo(() => cart.reduce((sum, item) => sum + (item.secondary_qty || 0), 0) + (workingItem.secondary_qty || 0), [cart, workingItem.secondary_qty]);

    const oldDebt = useMemo(() => {
        if (!selectedPartner) return 0;
        if (editOrderId && editingOriginalOrder && selectedPartner.id === editingOriginalOrder.partner_id && editingOriginalOrder.old_debt !== undefined && editingOriginalOrder.old_debt !== null) {
            return editingOriginalOrder.old_debt;
        }
        let balance = selectedPartner.debt_balance;

        // If we are editing an order, the current balance already includes the impact of the original version of this order.
        if (editOrderId && editingOriginalOrder && selectedPartner.id === editingOriginalOrder.partner_id) {
            if (editingOriginalOrder.payment_method === 'Debt') {
                const originalImpact = (editingOriginalOrder.total_amount || 0) - (editingOriginalOrder.amount_paid || 0);
                // For Purchase, the impact was subtracted from balance
                balance += originalImpact;
            }
        }
        return balance;
    }, [selectedPartner, editOrderId, editingOriginalOrder]);

    const remainingDebt = paymentMethod === 'Debt'
        ? (oldDebt - (totalAmount >= 0 ? (totalAmount - amountPaid) : (totalAmount + amountPaid)))
        : oldDebt;

    useEffect(() => {
        localStorage.setItem('held_purchases', JSON.stringify(heldPurchases));
    }, [heldPurchases]);

    const fetchProducts = async () => {
        try {
            await queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (err) { console.error(err); }
    };

    const fetchPartners = async () => {
        try {
            await queryClient.invalidateQueries({ queryKey: ['partners'] });
        } catch (err) { console.error(err); }
    };

    const fetchBankAccounts = async () => {
        try {
            const res = await axios.get('/api/bank-accounts');
            setBankAccounts(res.data);
            if (res.data.length > 0) setSelectedBankAccountId(res.data[0].id);
        } catch (err) { console.error(err); }
    };

    const fetchSettings = async () => {
        try {
            const [templatesRes, settingsRes] = await Promise.all([
                axios.get('/api/print-templates?module=Purchase'),
                axios.get('/api/settings')
            ]);
            let combinedSettings = { ...DEFAULT_SETTINGS };
            if (settingsRes.data) {
                combinedSettings = { ...combinedSettings, ...settingsRes.data };
            }
            if (templatesRes.data && templatesRes.data.length > 0) {
                const defaultTemplate = templatesRes.data.find(t => t.is_default) || templatesRes.data[0];
                if (defaultTemplate) {
                    try {
                        const config = JSON.parse(defaultTemplate.config);
                        combinedSettings = { ...combinedSettings, ...config };
                    } catch (e) {
                        console.error("Error parsing template config", e);
                    }
                }
            }
            const localDoraemon = localStorage.getItem('ui_show_doraemon');
            if (localDoraemon !== null) combinedSettings.ui_show_doraemon = localDoraemon;

            setSettings(combinedSettings);
            const isEditMode = editOrderId || location.state?.editOrder || new URLSearchParams(window.location.search).get('edit');
            if (cart.length === 0 && !isEditMode) {
                setPaymentMethod(posMode === 'Wholesale' ? 'Debt' : 'Cash');
            }
        } catch (err) {
            console.error('Lỗi khi tải cài đặt:', err);
        }
    };

    const loadDraft = () => {
        const draft = localStorage.getItem('purchase_draft');
        if (draft) {
            try {
                const d = JSON.parse(draft);
                setCart(d.cart || []);
                setNote(d.note || '');
                setAmountPaid(d.amountPaid || 0);
                setPaymentMethod(d.paymentMethod || (localStorage.getItem('unified_pos_mode') === 'Wholesale' ? 'Debt' : 'Cash'));
                setIsConsignment(d.isConsignment || false);
                if (d.selectedPartnerId) {
                    const partner = partners.find(p => p.id === d.selectedPartnerId);
                    setSelectedPartner(partner || null);
                } else {
                    setSelectedPartner(null);
                }
                setEditOrderId(null);
                setEditingOriginalOrder(null);
                setHistoryStep(0);
                return true;
            } catch (e) {
                console.error("Error loading draft", e);
            }
        }
        return false;
    };

    const loadOrder = (order) => {
        setEditOrderId(order.id);
        setEditingOriginalOrder(order);
        setCart(order.details.map(d => ({
            product_id: d.product_id,
            product_name: d.product_name,
            unit: d.product_unit,
            secondary_unit: d.secondary_unit,
            multiplier: d.multiplier || 1,
            price: d.price,
            quantity: d.quantity,
            secondary_qty: d.quantity / (d.multiplier || 1),
            stock: d.stock || 0,
            active_ingredient: d.active_ingredient
        })));
        setNote(order.note || '');
        setAmountPaid(order.amount_paid || 0);
        setPaymentMethod(order.payment_method);
        setIsConsignment(order.is_consignment || false);
        setPendingPartnerId(order.partner_id);
        setPartnerSearch('');
        setSearchTerm('');
        setIsPartnerDropdownOpen(false);
    };

    const fetchOrder = async (id) => {
        try {
            const res = await axios.get(`/api/orders/${id}`);
            if (res.data) loadOrder(res.data);
        } catch (e) {
            console.error("Error fetching order", e);
            setToast({ message: 'Không tìm thấy hóa đơn', type: 'error' });
        }
    };

    useEffect(() => {
        // fetchProducts(); - Removed, using React Query
        // fetchPartners(); - Removed, using React Query
        fetchSettings();
        fetchBankAccounts();

        // Load Draft
        if (!location.state?.editOrder) {
            loadDraft();
        }

        // Handle Edit Mode
        if (location.state?.editOrder) {
            loadOrder(location.state.editOrder);
        } else {
            const params = new URLSearchParams(window.location.search);
            const editId = params.get('edit');
            if (editId) {
                fetchOrder(editId);
            } else if (editOrderId) {
                // Not in edit mode - if we were previously editing, we should restore our draft
                if (!loadDraft()) resetForm(false);
            }
        }
        setIsLoaded(true);
    }, [location.search, location.state]);

    const handlePreview = () => {
        if (cart.length === 0) {
            setToast({ message: "Chưa có sản phẩm nào để xem trước!", type: "error" });
            return;
        }
        const currentOrderData = {
            id: editOrderId || 'NHẬP TẠM',
            display_id: editOrderId ? String(editOrderId) : 'NHẬP TẠM',
            date: new Date().toISOString(),
            partner: selectedPartner,
            partner_id: selectedPartner?.id || null,
            partner_name: selectedPartner?.name || 'Nhà cung cấp',
            partner_phone: selectedPartner?.phone,
            partner_address: selectedPartner?.address,
            details: cart.map(item => ({
                ...item,
                product_name: item.name || item.product_name,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit
            })),
            total_amount: totalAmount,
            old_debt: oldDebt !== undefined ? oldDebt : (selectedPartner?.debt_balance || 0),
            amount_paid: amountPaid,
            remaining_debt: remainingDebt,
            payment_method: paymentMethod,
            note: note,
            is_consignment: isConsignment
        };
        setPreviewData(currentOrderData);
        setZoomScale(1);
        setShowPreview(true);
    };

    const handleModeChange = (newMode) => {
        setPosMode(newMode);
        localStorage.setItem('unified_pos_mode', newMode);
        if (cart.length === 0 && !editOrderId) {
            setPaymentMethod(newMode === 'Wholesale' ? 'Debt' : 'Cash');
        }
    };

    useEffect(() => {
        if (paymentMethod === 'Cash') setAmountPaid(totalAmount);
    }, [paymentMethod, totalAmount]);

    useEffect(() => {
        if (isLoaded && !editOrderId) {
            const draft = { cart, selectedPartnerId: selectedPartner?.id, note, amountPaid, paymentMethod, isConsignment };
            localStorage.setItem('purchase_draft', JSON.stringify(draft));
        }
    }, [cart, selectedPartner, note, amountPaid, paymentMethod, editOrderId, isConsignment, isLoaded]); // Added isLoaded dependency

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.key) return;

            // 1. Handle Tab sound immediately
            if (e.key === 'Tab') {
                playTabSound();
            }

            const key = e.key.toUpperCase();
            if (e.key === 'Escape') {
                const isAnythingOpen = isPartnerDropdownOpen || isHeldSidebarOpen ||
                    showQuickAddPartner || showQuickAddProduct || isEditModalOpen ||
                    searchTerm || rowSearchIdx !== null;

                if (isAnythingOpen) {
                    setIsPartnerDropdownOpen(false);
                    setIsHeldSidebarOpen(false);
                    setShowQuickAddPartner(false);
                    setShowQuickAddProduct(false);
                    setIsEditModalOpen(false);
                    setSearchTerm('');
                    setRowSearchIdx(null);
                }
            } else if (e.ctrlKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateHistory('prev');
            } else if (e.ctrlKey && e.key === 'ArrowRight') {
                e.preventDefault();
                navigateHistory('next');
            } else if (key === 'F7' || e.keyCode === 118) {
                e.preventDefault();
                handlePreview();
            } else if (key === (settings.kb_search || 'F2').toUpperCase()) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (key === (settings.kb_save || 'F12').toUpperCase()) {
                e.preventDefault();
                handleSave(false);
            } else if (key === (settings.kb_pay || 'F9').toUpperCase()) {
                e.preventDefault();
                handleSave(true);
            } else if (key === (settings.kb_new || 'F4').toUpperCase()) {
                e.preventDefault();
                resetForm();
            } else if (key === (settings.kb_hold || 'F8').toUpperCase()) {
                e.preventDefault();
                handleHold();
            }

            // 2. Handle "Typing without focus" warning
            const isPrintable = e.key.length === 1;
            const noModifiers = !e.ctrlKey && !e.altKey && !e.metaKey;
            const notInInput = e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA';

            if (isPrintable && noModifiers && notInInput) {
                playErrorSound();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, selectedPartner, amountPaid, note, settings, isPartnerDropdownOpen, isHeldSidebarOpen, showQuickAddPartner, showQuickAddProduct, isEditModalOpen, searchTerm, rowSearchIdx, historyStep]);

    useEffect(() => {
        if (partners.length > 0) {
            if (pendingPartnerId) {
                const partner = partners.find(p => p.id == pendingPartnerId);
                if (partner) {
                    setSelectedPartner(partner);
                    setPendingPartnerId(null);
                    setPartnerSearch('');
                }
            } else if (selectedPartner) {
                // Sync selectedPartner with fresh data
                const fresh = partners.find(p => p.id === selectedPartner.id);
                if (fresh && fresh.debt_balance !== selectedPartner.debt_balance) {
                    setSelectedPartner(fresh);
                }
            } else if (!editOrderId) {
                const draft = localStorage.getItem('purchase_draft');
                if (draft) {
                    try {
                        const d = JSON.parse(draft);
                        if (d.selectedPartnerId) {
                            const partner = partners.find(p => p.id === d.selectedPartnerId);
                            if (partner) {
                                setSelectedPartner(partner);
                                setPartnerSearch('');
                            }
                        }
                    } catch (e) { }
                }
            }
        }
    }, [partners, pendingPartnerId, editOrderId, location.state]);

    // NEW: Auto-recalculate debt when partner is selected
    useEffect(() => {
        if (selectedPartner?.id && !editOrderId) {
            const syncDebtFromServer = async () => {
                try {
                    const res = await axios.post(`/api/partners/${selectedPartner.id}/recalculate-debt`);
                    if (res.data.new_balance !== undefined) {
                        setSelectedPartner(prev => {
                            if (!prev || prev.id !== selectedPartner.id) return prev;
                            return { ...prev, debt_balance: res.data.new_balance };
                        });
                    }
                } catch (err) {
                    console.error("Error auto-syncing debt:", err);
                }
            };
            syncDebtFromServer();
        }
    }, [selectedPartner?.id, editOrderId]);

    const addToCart = (product, customQty = null, customPrice = null) => {
        const qtyToAdd = customQty !== null ? customQty : 1;
        const appliedPrice = customPrice !== null ? customPrice : (product.latest_cost_price || product.cost_price);
        const existing = cart.find(item => item.product_id === product.id && item.price === appliedPrice);
        if (existing) {
            setCart(cart.map(item =>
                item.product_id === product.id && item.price === appliedPrice
                    ? { ...item, quantity: item.quantity + qtyToAdd, price: appliedPrice, secondary_qty: (item.quantity + qtyToAdd) / (item.multiplier || 1) }
                    : item
            ));
        } else {
            setCart([{
                product_id: product.id,
                product_name: product.name,
                unit: product.unit,
                secondary_unit: product.secondary_unit,
                multiplier: product.multiplier || 1,
                price: appliedPrice,
                quantity: qtyToAdd,
                secondary_qty: qtyToAdd / (product.multiplier || 1),
                stock: product.stock,
                active_ingredient: product.active_ingredient
            }, ...cart]);
        }
        setSearchTerm('');
        setActiveIndex(0);
        playTickSound();
        setWorkingItem({ product: null, quantity: 1, price: 0, secondary_qty: 0, name: '' });
        setTimeout(() => searchInputRef.current?.focus(), 10);
        if (product && product.sale_price > 0 && appliedPrice > product.sale_price) {
            setTimeout(() => checkPriceRaiseAlert([{ product_id: product.id, price: appliedPrice }]), 350);
        }
    };

    const updateCartItem = (idx, field, value) => {
        const newCart = [...cart];
        const item = newCart[idx];
        if (field === 'secondary_qty') {
            item.secondary_qty = value;
            item.quantity = value * item.multiplier;
        } else if (field === 'quantity') {
            item.quantity = value;
            item.secondary_qty = value / item.multiplier;
        } else {
            item[field] = value;
        }
        setCart(newCart);
    };

    const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));

    const handleSave = async (shouldPrint = true) => {
        if (loading) return;
        let finalCart = [...cart];
        if (workingItem.product && workingItem.quantity !== 0) {
            const existingIdx = finalCart.findIndex(i => i.product_id === workingItem.product.id && i.price === workingItem.price);
            if (existingIdx > -1) {
                finalCart[existingIdx].quantity += workingItem.quantity;
                finalCart[existingIdx].secondary_qty += workingItem.secondary_qty;
            } else {
                finalCart = [{
                    product_id: workingItem.product.id,
                    product_name: workingItem.product.name,
                    unit: workingItem.product.unit,
                    secondary_unit: workingItem.product.secondary_unit,
                    multiplier: workingItem.product.multiplier || 1,
                    price: workingItem.price,
                    stock: workingItem.product.stock,
                    quantity: workingItem.quantity,
                    secondary_qty: workingItem.secondary_qty
                }, ...finalCart];
            }
        }
        if (finalCart.length === 0) return;
        setLoading(true);
        try {
            const orderData = {
                partner_id: selectedPartner ? selectedPartner.id : null,
                type: 'Purchase',
                payment_method: paymentMethod,
                details: finalCart.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: item.price
                })),
                note,
                amount_paid: amountPaid,
                bank_account_id: paymentMethod === 'Transfer' ? selectedBankAccountId : null,
                is_consignment: isConsignment,
                created_by: JSON.parse(sessionStorage.getItem('user') || '{}').name || JSON.parse(sessionStorage.getItem('user') || '{}').username || 'Admin'
            };
            let res;
            if (editOrderId) res = await axios.put(`/api/orders/${editOrderId}`, orderData);
            else res = await axios.post('/api/orders', orderData);
            
            const savedOrderId = res.data?.id;
            const enrichedOrder = {
                ...res.data,
                old_debt: (res.data?.old_debt !== undefined && res.data?.old_debt !== null) ? res.data.old_debt : (selectedPartner ? (selectedPartner.debt_balance || 0) : 0),
                partner_id: selectedPartner?.id || res.data.partner_id,
                partner_name: selectedPartner?.name || res.data.partner_name,
                partner_address: selectedPartner?.address || res.data.partner_address,
                partner_phone: selectedPartner?.phone || res.data.partner_phone,
                partner: selectedPartner || res.data.partner || null
            };
            setLastOrder(enrichedOrder);
            if (keepOrderAfterSave && savedOrderId) {
                setEditOrderId(savedOrderId);
                setEditingOriginalOrder(res.data);
            }

            // Invalidate React Query caches
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['partners'] });

            // Broadcast data sync
            try {
                const syncChan = new BroadcastChannel('pos_data_sync');
                syncChan.postMessage({ type: 'ORDER_SAVED' });
                syncChan.close();
            } catch (e) {
                console.error("BroadcastChannel error:", e);
            }

            const savedDisplayId = res.data?.display_id || res.data?.id || editOrderId || "MỚI";
            if (saveNoticeStyle === 'card') {
                setSavedOrderNotice({
                    id: savedDisplayId,
                    count: finalCart.length,
                    total: totalAmount,
                    partnerName: selectedPartner?.name || 'Nhà cung cấp',
                    type: 'Purchase'
                });
                setTimeout(() => setSavedOrderNotice(null), 2400);
            } else {
                setToast({ message: "Đã lưu đơn nhập hàng thành công!", type: "success" });
            }

            playSuccessSound();

            if (shouldPrint) {
                setTimeout(() => {
                    window.print();
                    setTimeout(() => {
                        if (!keepOrderAfterSave) {
                            resetForm(false);
                            localStorage.removeItem('purchase_draft');
                        }
                    }, 1000);
                }, 1000);
            } else {
                if (!keepOrderAfterSave) {
                    resetForm(false);
                    localStorage.removeItem('purchase_draft');
                }
            }
        } catch (err) {
            setToast({ message: err.response?.data?.error || "Lỗi khi lưu đơn nhập hàng", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = (keepPartner = false) => {
        setCart([]);
        setWorkingItem({ product: null, quantity: 1, price: 0, secondary_qty: 0, multiplier: 1 });
        if (!keepPartner) {
            setSelectedPartner(null);
            setPartnerSearch('');
        }
        setSearchTerm('');
        setIsPartnerDropdownOpen(false);
        setAmountPaid(0);
        const defaultMethod = posMode === 'Wholesale' ? 'Debt' : 'Cash';
        setPaymentMethod(defaultMethod);
        if (defaultMethod === 'Cash') setAmountPaid(0);
        setNote('');
        setIsConsignment(false);
        setEditOrderId(null);
        setEditingOriginalOrder(null);
        setLastOrder(null);
        setHistoryStep(0);
        playPopSound();
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const navigateHistory = async (direction) => {
        let nextStep;
        if (direction === 'prev') nextStep = historyStep + 1;
        else nextStep = Math.max(0, historyStep - 1);
        if (nextStep === 0) {
            playPopSound();
            if (!loadDraft()) resetForm();
            return;
        }
        try {
            setHistoryLoading(true);
            const res = await axios.get(`/api/orders?type=Purchase&limit=1&page=${nextStep}`);
            const items = res.data.items || res.data;
            if (items && items.length > 0) {
                const order = items[0];

                // Small delay to allow fade out
                await new Promise(r => setTimeout(r, 150));

                loadOrder(order);
                const partner = partners.find(p => p.id === order.partner_id);
                setSelectedPartner(partner || null);
                setHistoryStep(nextStep);
                playPopSound();
            } else {
                if (direction === 'prev') setToast({ message: "Không còn đơn nhập hàng cũ hơn.", type: "error" });
                else if (!loadDraft()) resetForm();
            }
        } catch (err) {
            console.error(err);
            setToast({ message: "Lỗi khi tải lịch sử đơn nhập hàng", type: "error" });
        } finally {
            setTimeout(() => setHistoryLoading(false), 300);
        }
    };

    const handleHold = () => {
        if (cart.length === 0) return;
        const newHeld = {
            id: Date.now(),
            cart: [...cart],
            partner: selectedPartner,
            total: totalAmount,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            note: note,
            paymentMethod: paymentMethod,
            editOrderId
        };
        setHeldPurchases([newHeld, ...heldPurchases]);
        localStorage.removeItem('purchase_draft');
        resetForm();
        setIsHeldSidebarOpen(true);
    };

    const handleDeleteOrder = (order) => {
        setConfirm({
            title: "Xác nhận hủy đơn nhập hàng",
            message: `Bạn có chắc chắn muốn hủy đơn nhập #${order.display_id || order.id}?`,
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/orders/${order.id}`);
                    setToast({ message: 'Đã hủy đơn nhập hàng!', type: 'success' });
                    setIsHistoryPanelOpen(false);
                    fetchProducts();
                    fetchPartners();
                } catch (err) {
                    setToast({ message: 'Lỗi khi hủy đơn hàng', type: 'error' });
                } finally {
                    setConfirm(null);
                }
            },
        });
    };

    const handleRestore = (held) => {
        setCart(held.cart);
        setSelectedPartner(held.partner);
        setNote(held.note || '');
        setPaymentMethod(held.paymentMethod || (posMode === 'Wholesale' ? 'Debt' : 'Cash'));
        setEditOrderId(held.editOrderId || null);
        setHeldPurchases(heldPurchases.filter(h => h.id !== held.id));
        setIsHeldSidebarOpen(false);
    };

    const handleRemoveHeld = (id) => setHeldPurchases(heldPurchases.filter(h => h.id !== id));

    const filteredProducts = useMemo(() => {
        const s = searchTerm.toLowerCase();
        const sNoAccent = removeAccents(s);
        return products
            .filter(p => {
                const name = (p.name || "").toLowerCase();
                const code = (p.code || "").toLowerCase();
                const active = (p.active_ingredient || "").toLowerCase();
                return !s ||
                    name.includes(s) || removeAccents(name).includes(sNoAccent) ||
                    code.includes(s) || removeAccents(code).includes(sNoAccent) ||
                    active.includes(s) || removeAccents(active).includes(sNoAccent);
            })
            .sort((a, b) => {
                const aName = (a.name || "").toLowerCase();
                const bName = (b.name || "").toLowerCase();

                if (s) {
                    const aStarts = aName.startsWith(s);
                    const bStarts = bName.startsWith(s);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    if (a.code?.toLowerCase() === s && b.code?.toLowerCase() !== s) return -1;
                    if (a.code?.toLowerCase() !== s && b.code?.toLowerCase() === s) return 1;
                }

                return aName.localeCompare(bName, 'vi', { sensitivity: 'base' });
            })
            .slice(0, 50);
    }, [products, searchTerm]);

    const filteredPartners = useMemo(() => {
        const s = partnerSearch.toLowerCase();
        const searchId = parseInt(s);
        const sNoAccent = removeAccents(s);
        return partners
            .filter(p => {
                const matchesId = !isNaN(searchId) && p.id === searchId;
                const pNameNorm = (p.name || "").toLowerCase();
                return matchesId ||
                    pNameNorm.includes(s) ||
                    removeAccents(pNameNorm).includes(sNoAccent) ||
                    (p.phone || "").includes(s);
            })
            .sort((a, b) => {
                if (!isNaN(searchId)) {
                    if (a.id === searchId) return -1;
                    if (b.id === searchId) return 1;
                }
                const aName = (a.name || "").toLowerCase();
                const bName = (b.name || "").toLowerCase();
                const aStarts = aName.startsWith(s);
                const bStarts = bName.startsWith(s);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return aName.localeCompare(bName, 'vi', { sensitivity: 'base' });
            })
            .slice(0, 50);
    }, [partners, partnerSearch]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.key) return;
            const key = e.key.toUpperCase();

            // F1 / F3: Focus Supplier
            if (e.keyCode === 112 || key === 'F1' || e.keyCode === 114 || key === 'F3') {
                e.preventDefault();
                setIsPartnerHovered(false);
                setIsPartnerSearchExpanded(true);
                setIsPartnerDropdownOpen(true);
                setTimeout(() => {
                    partnerInputRef.current?.focus();
                    partnerInputRef.current?.select();
                }, 50);
            }
            // F2: Focus Search Product
            else if (e.keyCode === 113 || key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // F7: Print Preview
            else if (e.keyCode === 118 || key === 'F7') {
                e.preventDefault();
                handlePreview();
            }
            // F4: Reset Form (New Order)
            else if (e.keyCode === 115 || key === 'F4') {
                e.preventDefault();
                resetForm();
            }
            // F9: Save & Print
            else if (e.keyCode === 120 || key === 'F9') {
                e.preventDefault();
                handleSave(true);
            }
            // F12: Save Only
            else if (e.keyCode === 123 || key === 'F12') {
                e.preventDefault();
                handleSave(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, resetForm]);

    return (
        <MotionConfig 
          reducedMotion={gpuDisabled ? "always" : "no-preference"} 
          transition={gpuDisabled ? { type: "just" } : undefined}
        >
            <div className={cn("flex flex-col h-screen main-content-bg font-sans overflow-hidden transition-colors", gpuDisabled && "gpu-disabled-mode")}>
            <div className="flex-1 flex flex-col overflow-hidden no-print">
                {/* Top Bar: Search & Supplier */}
                <div className="p-4 flex gap-6 items-center print:hidden transition-colors relative border-[#d4a574]/20 z-[2500]">

                    {/* Background Decoration Layer */}
                    {!gpuDisabled && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute right-[-40px] top-[-40px] opacity-[0.03] dark:opacity-[0.06] -rotate-12 transition-all duration-1000">
                                <Wheat size={240} className="text-primary" />
                            </div>
                            <div className="absolute left-[-20px] bottom-[-20px] opacity-[0.02] dark:opacity-[0.04] rotate-45 transition-all duration-1000">
                                <Sprout size={180} className="text-[#4a7c59]" />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 shrink-0 mr-2">
                        <div className="flex items-center gap-3 group cursor-default relative">
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black text-primary dark:text-[#d4a574] uppercase tracking-tighter flex items-center gap-2 leading-none">
                                    NHẬP HÀNG
                                </h1>
                                <span className="text-[10px] font-bold text-slate-400">
                                    by LyangNghia
                                </span>
                            </div>
                            <AnimatePresence mode="popLayout" initial={false}>
                                <m.div
                                    key={editingOriginalOrder?.id || historyStep || 'new'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center"
                                >
                                    <div className="flex items-center h-9 bg-transparent px-3 rounded-full border border-black/10 dark:border-white/10 shrink-0">
                                        <div className={cn("w-2 h-2 rounded-full mr-2 shrink-0", editOrderId ? "bg-amber-500" : "bg-emerald-500")} />
                                        <div className="flex flex-col justify-center">
                                            <span className="text-[12px] font-black font-mono text-amber-600 dark:text-amber-400 tracking-wider leading-none">
                                                #{editingOriginalOrder?.display_id || editOrderId || 'MỚI'}
                                            </span>
                                            {editingOriginalOrder?.date && (
                                                <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums leading-none">
                                                    {new Date(editingOriginalOrder.date).toLocaleTimeString("vi-VN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })} - {new Date(editingOriginalOrder.date).toLocaleDateString("vi-VN", {
                                                        day: "2-digit",
                                                        month: "2-digit"
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </m.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800 relative z-[2100]">
                        {/* 1. Compact Partner Search Input */}
                        <div 
                            className="relative shrink-0" 
                            onMouseEnter={() => {
                                if (!isPartnerDropdownOpen && document.activeElement !== partnerInputRef.current) {
                                    setIsPartnerHovered(true);
                                }
                            }}
                            onMouseLeave={() => setIsPartnerHovered(false)}
                            onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                setTimeout(() => {
                                    setIsPartnerDropdownOpen(false);
                                }, 180);
                            }
                        }}>
                            <div
                                className={cn(
                                    "relative flex items-center rounded-full overflow-hidden w-44 md:w-52 h-9 border-2 transition-[border-color,background-color,box-shadow] duration-200 ease-out",
                                    (selectedPartner && !isPartnerDropdownOpen)
                                        ? "bg-[#8b6f47] dark:bg-[#8b6f47] border-[#8b6f47] dark:border-[#d4a574] shadow-md shadow-[#8b6f47]/30 text-white"
                                        : "border-[#8b6f47]/30 dark:border-[#d4a574]/40 bg-white/90 dark:bg-slate-900/90 shadow-sm focus-within:border-[#8b6f47] dark:focus-within:border-[#d4a574] focus-within:shadow-[0_0_0_2px_rgba(139,111,71,0.2)]"
                                )}
                            >
                                <m.div
                                    key={(selectedPartner && !isPartnerDropdownOpen) ? "selected-partner-icon" : "search-icon"}
                                    initial={{ scale: 0.75, rotate: -8 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10"
                                >
                                    <Truck
                                        size={15}
                                        strokeWidth={(selectedPartner && !isPartnerDropdownOpen) ? 2.8 : 2.5}
                                        className={cn(
                                            "shrink-0",
                                            (selectedPartner && !isPartnerDropdownOpen)
                                                ? "text-white drop-shadow-sm"
                                                : "text-[#8b6f47] dark:text-[#d4a574]"
                                        )}
                                    />
                                </m.div>
                                <input
                                    type="text"
                                    className={cn(
                                        "w-full pl-8 pr-7 py-1.5 h-full bg-transparent outline-none font-black text-xs text-slate-900 dark:text-white placeholder:text-muted/60 leading-normal",
                                        (selectedPartner && !isPartnerDropdownOpen) && "opacity-0 select-none cursor-pointer"
                                    )}
                                    ref={partnerInputRef}
                                    placeholder="Tìm NCC (F3)..."
                                    value={selectedPartner ? selectedPartner.name : partnerSearch}
                                    onFocus={() => {
                                        setIsPartnerHovered(false);
                                        setIsPartnerDropdownOpen(true);
                                    }}
                                    onDoubleClick={(e) => {
                                        if (selectedPartner) {
                                            e.stopPropagation();
                                            setEditingPartner(selectedPartner);
                                            setIsPartnerEditModalOpen(true);
                                        }
                                    }}
                                    onChange={(e) => {
                                        setIsPartnerHovered(false);
                                        setPartnerSearch(e.target.value);
                                        if (selectedPartner) setSelectedPartner(null);
                                        setIsPartnerDropdownOpen(true);
                                        setActiveIndex(0);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsPartnerHovered(false);
                                            setIsPartnerDropdownOpen(false);
                                        } else if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setIsPartnerHovered(false);
                                            setActiveIndex(prev => {
                                                const next = Math.min(prev + 1, filteredPartners.length);
                                                if (partnerDropdownRef.current) {
                                                    const targetEl = partnerDropdownRef.current.querySelector(`[data-index="${next}"]`);
                                                    targetEl?.scrollIntoView({ block: "nearest" });
                                                }
                                                return next;
                                            });
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setIsPartnerHovered(false);
                                            setActiveIndex(prev => {
                                                const next = Math.max(prev - 1, 0);
                                                if (partnerDropdownRef.current) {
                                                    const targetEl = partnerDropdownRef.current.querySelector(`[data-index="${next}"]`);
                                                    targetEl?.scrollIntoView({ block: "nearest" });
                                                }
                                                return next;
                                            });
                                        } else if (e.key === 'Enter') {
                                            e.preventDefault();
                                            setIsPartnerHovered(false);
                                            if (activeIndex === 0) {
                                                setSelectedPartner(null);
                                                setPartnerSearch('');
                                            } else if (filteredPartners[activeIndex - 1]) {
                                                setSelectedPartner(filteredPartners[activeIndex - 1]);
                                                setPartnerSearch('');
                                            }
                                            setIsPartnerDropdownOpen(false);
                                            setTimeout(() => searchInputRef.current?.focus(), 50);
                                        }
                                    }}
                                />
                                {/* Marquee Partner Name Overlay with smooth pop-in */}
                                <AnimatePresence mode="wait">
                                    {selectedPartner && !isPartnerDropdownOpen && (
                                        <m.div
                                            key={selectedPartner.id || selectedPartner.name}
                                            initial={{ opacity: 0, x: 6, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -6, scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 450, damping: 28 }}
                                            className="absolute left-8 right-7 top-0 bottom-0 flex items-center overflow-hidden pointer-events-none"
                                        >
                                            <span className={cn(
                                                "font-black text-xs uppercase tracking-tight whitespace-nowrap inline-block text-white font-black drop-shadow-sm",
                                                (selectedPartner.name || "").length > 12 && "partner-pill-marquee-text"
                                            )}>
                                                {selectedPartner.name}
                                            </span>
                                        </m.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {(selectedPartner || partnerSearch) && !isPartnerDropdownOpen && (
                                        <m.div
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10"
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsPartnerHovered(false);
                                                    setSelectedPartner(null);
                                                    setPartnerSearch('');
                                                }}
                                                className={cn(
                                                    "w-5 h-5 flex items-center justify-center rounded-full transition-all cursor-pointer",
                                                    (selectedPartner && !isPartnerDropdownOpen)
                                                        ? "bg-white/20 text-white hover:bg-rose-500 hover:text-white shadow-sm"
                                                        : "bg-black/5 dark:bg-white/10 text-muted hover:bg-rose-500 hover:text-white"
                                                )}
                                                title="Bỏ chọn NCC"
                                            >
                                                <X size={10} strokeWidth={3} />
                                            </button>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Partner Hover Info Card */}
                            <PartnerInfoHoverCard
                                partner={selectedPartner}
                                isVisible={isPartnerHovered && !isPartnerDropdownOpen && Boolean(selectedPartner) && document.activeElement !== partnerInputRef.current}
                            />

                            {/* Dropdown list */}
                            <AnimatePresence>
                                {isPartnerDropdownOpen && (
                                    <m.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        className="dropdown-premium bg-white dark:bg-slate-900 backdrop-blur-2xl absolute top-full left-0 mt-2 w-[560px] md:w-[600px] max-w-[95vw] shadow-2xl !z-[3000] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                                        ref={partnerDropdownRef}
                                    >
                                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-0 divide-y divide-slate-100 dark:divide-slate-800/80">
                                            <div
                                                data-index={0}
                                                className={cn("dropdown-item flex items-center gap-3.5 px-4 py-3.5 transition-all relative cursor-pointer", activeIndex === 0 && "active")}
                                                onMouseEnter={() => setActiveIndex(0)}
                                                onClick={() => {
                                                    setIsPartnerHovered(false);
                                                    setSelectedPartner(null);
                                                    setPartnerSearch('');
                                                    setIsPartnerDropdownOpen(false);
                                                    setTimeout(() => searchInputRef.current?.focus(), 50);
                                                }}
                                            >
                                                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0", activeIndex === 0 ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
                                                    <Truck size={22} strokeWidth={2.5} />
                                                </div>
                                                <div className="py-0.5">
                                                    <div className={cn("font-black uppercase tracking-tight text-base md:text-[17px]", activeIndex === 0 ? "text-white" : "text-slate-900 dark:text-white")}>NHÀ CUNG CẤP VÃNG LAI</div>
                                                    <div className={cn("text-[11px] font-bold uppercase tracking-widest leading-none mt-1", activeIndex === 0 ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>MẶC ĐỊNH KHÔNG LƯU NỢ</div>
                                                </div>
                                            </div>
                                            {filteredPartners.map((p, idx) => (
                                                <div
                                                    key={p.id}
                                                    data-index={idx + 1}
                                                    onMouseEnter={() => setActiveIndex(idx + 1)}
                                                    onClick={() => {
                                                        setIsPartnerHovered(false);
                                                        setSelectedPartner(p);
                                                        setPartnerSearch('');
                                                        setIsPartnerDropdownOpen(false);
                                                        setTimeout(() => searchInputRef.current?.focus(), 50);
                                                    }}
                                                    className={cn("dropdown-item flex justify-between items-center px-4 py-3 transition-all relative cursor-pointer", activeIndex === idx + 1 && "active")}
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                                                        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all border border-slate-100 dark:border-slate-800", activeIndex === idx + 1 ? "bg-white/20 text-white border-transparent" : "bg-white dark:bg-slate-800 text-[#8b6f47] dark:text-[#d4a574] shadow-sm")}>
                                                            <Truck size={22} strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0", activeIndex === idx + 1 ? "bg-white/20 border-white/40 text-white" : "bg-[#8b6f47]/15 border-[#8b6f47]/30 text-[#8b6f47] dark:text-[#d4a574]")}>
                                                                    NCC
                                                                </span>
                                                                <p className={cn("font-black tracking-tight text-base md:text-[17px] truncate", activeIndex === idx + 1 ? "text-white" : "text-slate-900 dark:text-white")}>{p.name}</p>
                                                            </div>
                                                            <div className={cn("flex items-center gap-3.5 text-xs font-bold tracking-wide opacity-80", activeIndex === idx + 1 ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
                                                                <span className="flex items-center gap-1 shrink-0"><Phone size={12} strokeWidth={2.5} className="opacity-60" />{p.phone || "---"}</span>
                                                                {p.address && <span className="flex items-center gap-1 truncate max-w-[220px]"><MapPin size={12} strokeWidth={2.5} className="opacity-60" />{p.address}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1 shrink-0 pl-2">
                                                        <p className={cn("text-2xl font-black tabular-nums tracking-tight leading-none", activeIndex === idx + 1 ? "text-white" : (p.debt_balance || 0) > 0 ? "text-[#d93025] dark:text-rose-400" : (p.debt_balance || 0) < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#0f9d58] dark:text-emerald-400 font-bold")}>
                                                            {((p.debt_balance || 0) > 0 ? "+" : "") + formatNumber(Math.abs(p.debt_balance || 0))}
                                                        </p>
                                                        <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors", 
                                                            activeIndex === idx + 1 
                                                                ? "bg-white/20 border-white/40 text-white" 
                                                                : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50"
                                                        )}>
                                                            {(p.debt_balance || 0) > 0 ? "KHÁCH NỢ" : (p.debt_balance || 0) < 0 ? "MÌNH NỢ" : "HẾT NỢ"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 2. Note Button */}
                        <m.button
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsNoteModalOpen(true)}
                            className="relative w-9 h-9 shrink-0 bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full transition-all flex items-center justify-center border border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-sm"
                            title={note ? `Ghi chú: ${note}` : "Thêm ghi chú đơn nhập"}
                        >
                            <FileText size={16} strokeWidth={2.5} />
                            {note && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                            )}
                        </m.button>

                        {/* 3. Held Orders (Treo đơn) */}
                        <m.button
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={() => setIsHeldSidebarOpen(true)}
                            className="relative w-9 h-9 bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full transition-all flex items-center justify-center border border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-sm shrink-0"
                            title="Danh sách đơn nhập tạm"
                        >
                            <Pause size={16} strokeWidth={2.5} />
                            {heldPurchases.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] min-w-[18px] h-4.5 rounded-full flex items-center justify-center font-black border border-white px-1 leading-none z-20">
                                    {heldPurchases.length}
                                </span>
                            )}
                        </m.button>

                        {/* 4. History Step Navigator (if in sidebar mode) */}
                        {summaryLayoutMode === 'sidebar' && (
                            <m.div className="flex items-center rounded-full border border-[#8b6f47]/30 dark:border-[#d4a574]/30 bg-transparent dark:bg-slate-950/90 p-0.5 transition-colors shadow-sm h-9 shrink-0">
                                <m.button
                                    onClick={() => navigateHistory('prev')}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-7 h-7 flex items-center justify-center transition-colors rounded-full bg-transparent hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574]"
                                    title="Đơn trước"
                                >
                                    <ChevronLeft size={14} strokeWidth={2.5} />
                                </m.button>
                                <m.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (historyStep !== 0) {
                                            if (!loadDraft()) resetForm();
                                        }
                                    }}
                                    className="px-2 flex items-center justify-center min-w-[55px]"
                                >
                                    <span className="text-[11px] font-black uppercase tracking-tight text-[#8b6f47] dark:text-[#d4a574]">
                                        {editingOriginalOrder?.display_id ? `#${editingOriginalOrder.display_id}` : (editOrderId ? `#${editOrderId}` : "MỚI")}
                                    </span>
                                </m.button>
                                <m.button
                                    onClick={() => navigateHistory('next')}
                                    disabled={historyStep === 0}
                                    whileTap={{ scale: 0.9 }}
                                    className={cn(
                                        "w-7 h-7 flex items-center justify-center transition-colors rounded-full",
                                        historyStep === 0 ? "opacity-30 cursor-not-allowed text-[#8b6f47] dark:text-[#d4a574]" : "bg-transparent hover:bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574]"
                                    )}
                                >
                                    <ChevronRight size={14} strokeWidth={2.5} />
                                </m.button>
                            </m.div>
                        )}

                        {/* 5. Wholesale / Retail Mode */}
                        <m.button
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleModeChange(posMode === 'Retail' ? 'Wholesale' : 'Retail')}
                            className="relative w-9 h-9 shrink-0 bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full transition-all flex items-center justify-center border border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-sm"
                            title={posMode === 'Wholesale' ? "Chế độ Nhập Sỉ (Bấm để đổi sang Lẻ)" : "Chế độ Nhập Lẻ (Bấm để đổi sang Sỉ)"}
                        >
                            {posMode === 'Wholesale' ? <Users size={16} strokeWidth={2.5} /> : <User size={16} strokeWidth={2.5} />}
                            <div className={cn(
                                "absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-white",
                                posMode === 'Wholesale' ? "bg-amber-300" : "bg-white"
                            )} />
                        </m.button>

                        {/* 6. Daily / Partner History */}
                        <m.button
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (summaryLayoutMode === "bottom") {
                                    setIsDailyHistoryOpen(true);
                                } else {
                                    if (selectedPartner) {
                                        setIsHistoryPanelOpen(true);
                                    } else {
                                        setIsDailyHistoryOpen(true);
                                    }
                                }
                            }}
                            className="w-9 h-9 shrink-0 bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full transition-all flex items-center justify-center border border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-sm"
                            title={summaryLayoutMode === "bottom" ? "Lịch sử nhập hàng trong ngày" : (selectedPartner ? `Lịch sử nhập hàng của ${selectedPartner.name}` : "Lịch sử nhập hàng trong ngày")}
                        >
                            <History size={16} strokeWidth={2.5} />
                        </m.button>

                        {/* 7. Hamburger Action Menu (Thao tác) */}
                        <div className="relative" ref={actionMenuRef}>
                            <m.button
                                whileHover={{ y: -2, scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsActionMenuOpen(prev => !prev)}
                                className={cn(
                                    "w-9 h-9 shrink-0 rounded-full transition-all flex items-center justify-center border shadow-sm",
                                    isActionMenuOpen ? "bg-[#725a38] text-white border-[#d4a574]" : "bg-[#8b6f47] hover:bg-[#725a38] text-white border-[#8b6f47]/40 dark:border-[#d4a574]/40"
                                )}
                                title="Thao tác khác"
                            >
                                <Menu size={16} strokeWidth={2.5} />
                            </m.button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isActionMenuOpen && (
                                    <m.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-[4000] flex flex-col gap-1 text-left select-none"
                                    >
                                        {/* Preview Invoice */}
                                        <button
                                            onClick={() => {
                                                setIsActionMenuOpen(false);
                                                const tempOrder = {
                                                    display_id: editOrderId ? `Đơn nhập #${editOrderId}` : 'XEM TRƯỚC',
                                                    date: new Date().toISOString(),
                                                    partner_name: selectedPartner ? selectedPartner.name : 'Nhà cung cấp vãng lai',
                                                    partner_address: selectedPartner ? selectedPartner.address : '',
                                                    partner_phone: selectedPartner ? selectedPartner.phone : '',
                                                    total_amount: totalAmount,
                                                    amount_paid: amountPaid,
                                                    payment_method: paymentMethod,
                                                    note: note,
                                                    old_debt: oldDebt,
                                                    partner_id: selectedPartner ? selectedPartner.id : null,
                                                    details: cart.map(item => ({ ...item }))
                                                };
                                                setPreviewData(tempOrder);
                                                setShowPreview(true);
                                            }}
                                            className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-[#8b6f47] dark:hover:text-[#d4a574] rounded-xl transition-all"
                                        >
                                            <Eye size={16} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                            <span>Xem trước in hóa đơn</span>
                                        </button>

                                        {/* AI Invoice Scanner */}
                                        <button
                                            onClick={() => {
                                                setIsActionMenuOpen(false);
                                                setIsScanModalOpen(true);
                                            }}
                                            className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-[#8b6f47] dark:hover:text-[#d4a574] rounded-xl transition-all w-full text-left"
                                        >
                                            <Bot size={16} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                            <span className="font-black uppercase tracking-tight text-left">AI SCAN</span>
                                        </button>

                                        {/* Consignment Warehouse Panel */}
                                        <button
                                            onClick={() => {
                                                setIsActionMenuOpen(false);
                                                setIsConsignmentPanelOpen(true);
                                            }}
                                            className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-[#8b6f47] dark:hover:text-[#d4a574] rounded-xl transition-all"
                                        >
                                            <Warehouse size={16} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                            <span>Theo dõi hàng gửi kho</span>
                                        </button>

                                        {/* Keep Order After Save Toggle */}
                                        <button
                                            onClick={() => {
                                                const newVal = !keepOrderAfterSave;
                                                setKeepOrderAfterSave(newVal);
                                                localStorage.setItem("pos_keep_order_after_save", newVal ? "true" : "false");
                                                try {
                                                    const syncChan = new BroadcastChannel('pos_data_sync');
                                                    syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'pos_keep_order_after_save', value: newVal ? 'true' : 'false' });
                                                    syncChan.close();
                                                } catch (e) {}
                                            }}
                                            className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-[#8b6f47] dark:hover:text-[#d4a574] rounded-xl transition-all border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-0.5 w-full text-left"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <ShoppingCart size={16} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                                <div className="flex flex-col text-left">
                                                    <span className="font-black uppercase tracking-tight text-[11px]">Ở lại đơn vừa lưu</span>
                                                    <span className="text-[9px] font-bold text-slate-400 lowercase tracking-normal">{keepOrderAfterSave ? "bật: giữ lại giỏ hàng" : "tắt: tự xóa giỏ hàng"}</span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 flex items-center border",
                                                keepOrderAfterSave ? "bg-[#8b6f47] border-[#8b6f47] justify-end" : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                            )}>
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </div>
                                        </button>

                                        {/* Save Notice Style Toggle (Card / Toast) */}
                                        <button
                                            onClick={() => {
                                                const nextStyle = saveNoticeStyle === 'card' ? 'toast' : 'card';
                                                setSaveNoticeStyle(nextStyle);
                                                localStorage.setItem("pos_save_notice_style", nextStyle);
                                                try {
                                                    const syncChan = new BroadcastChannel('pos_data_sync');
                                                    syncChan.postMessage({ type: 'UI_SETTING_UPDATED', key: 'pos_save_notice_style', value: nextStyle });
                                                    syncChan.close();
                                                } catch (e) {}
                                            }}
                                            className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-[#8b6f47] dark:hover:text-[#d4a574] rounded-xl transition-all border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-0.5 w-full text-left"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Bell size={16} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                                <div className="flex flex-col text-left">
                                                    <span className="font-black uppercase tracking-tight text-[11px]">Kiểu báo lưu đơn</span>
                                                    <span className="text-[9px] font-bold text-slate-400 lowercase tracking-normal">{saveNoticeStyle === 'card' ? "thẻ nổi giữa màn hình" : "toast góc cũ"}</span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 flex items-center border",
                                                saveNoticeStyle === 'card' ? "bg-[#8b6f47] border-[#8b6f47] justify-end" : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start"
                                            )}>
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </div>
                                        </button>

                                        {/* Layout Toggle */}
                                        <button
                                            onClick={() => {
                                                setIsActionMenuOpen(false);
                                                toggleSummaryLayout();
                                            }}
                                            className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-[#8b6f47] dark:hover:text-[#d4a574] rounded-xl transition-all border-t border-slate-100 dark:border-slate-800/80 pt-2"
                                        >
                                            {summaryLayoutMode === 'bottom' ? (
                                                <PanelRight size={16} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                            ) : (
                                                <PanelBottom size={16} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                            )}
                                            <span>Chuyển bố cục: {summaryLayoutMode === 'bottom' ? 'Cột phải' : 'Ở dưới'}</span>
                                        </button>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex-1 min-w-[8px]" />

                    {/* Date/Time Display in Empty Space */}
                    <div className="flex justify-end items-center mr-2 shrink-0">
                        <HeavyClock variant="purchase" gpuDisabled={gpuDisabled} />
                    </div>
                </div>



                <div className="flex-1 flex gap-3 p-4 pt-0 pb-4 print:hidden min-h-0 relative">
                    {/* Left: Product Cart Section */}
                    <m.div
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex-1 flex flex-col min-h-0 relative"
                    >
                        <div className="flex-1 overflow-hidden relative transition-all duration-500 rounded-3xl bg-transparent border-none shadow-none">
                            <div className="w-full h-full rounded-3xl overflow-hidden relative bg-transparent">
                                {/* Subtle wheat grain pattern overlay */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139, 111, 71, 0.1) 10px, rgba(139, 111, 71, 0.1) 20px),
                                             radial-gradient(circle at 3px 3px, rgba(45, 80, 22, 0.08) 1px, transparent 0)`,
                                    backgroundSize: '40px 40px, 30px 30px',
                                    backgroundPosition: '0 0, 15px 15px'
                                }}></div>

                                <div className="absolute inset-0 overflow-auto pt-2 px-2">
                                    <div className="w-full transition-colors relative group/decoration pb-[400px]">
                                        {/* Background Decoration Layer */}
                                        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                                            <div className="absolute right-[-100px] bottom-[-100px] opacity-[0.02] dark:opacity-[0.04] group-hover/decoration:scale-110 transition-transform duration-[2000ms] text-[#4a7c59]">
                                                <Sprout size={600} />
                                            </div>
                                            <div className="absolute left-[-50px] top-[-50px] opacity-[0.015] dark:opacity-[0.03] group-hover/decoration:rotate-12 transition-transform duration-[3000ms] text-muted">
                                                <Wheat size={400} />
                                            </div>
                                        </div>
                                        <table className="w-full text-left border-separate border-spacing-0 table-fixed">
                                            <colgroup>
                                                <col style={{ width: "4%" }} />
                                                <col style={{ width: "42%" }} />
                                                <col style={{ width: "7%" }} />
                                                <col style={{ width: "9%" }} />
                                                <col style={{ width: "8%" }} />
                                                <col style={{ width: "12%" }} />
                                                <col style={{ width: "14%" }} />
                                                <col style={{ width: "4%" }} />
                                            </colgroup>
                                            <thead className="bg-transparent backdrop-blur-md sticky top-0 z-[100] print:hidden border-b border-[#8b6f47]/15 dark:border-white/10 shadow-xs">
                                                <tr className="border-none">
                                                    <th rowSpan={2} className="py-1.5 px-2 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap">Stt</th>
                                                    <th className="px-4 py-1 align-middle whitespace-nowrap">
                                                        <div className="flex items-center justify-between w-full gap-4">
                                                            <span className="font-black uppercase tracking-[0.1em] text-[9px] text-slate-500/80 dark:text-slate-400">Danh mục sản phẩm nhập hàng</span>
                                                        </div>
                                                    </th>
                                                    <th rowSpan={2} className="py-1.5 px-3 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 border-x border-white/10 dark:border-slate-800/20 whitespace-nowrap">Đơn vị</th>
                                                    <th className="py-1.5 px-3 text-center font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap">Quy đổi</th>
                                                    <th className="py-1.5 px-3 text-center font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap">Số lượng</th>
                                                    <th rowSpan={2} className="py-1.5 px-3 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap">Giá nhập</th>
                                                    <th rowSpan={2} className="py-1.5 px-3 text-center align-middle font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Thành tiền</th>
                                                    <th rowSpan={2} className="text-center" />
                                                </tr>
                                                <tr className="border-t border-slate-200 dark:border-white/10 dark:border-slate-800/20 bg-transparent">
                                                    <td className="px-4 py-1 text-center border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                                                            <span className="text-[8px] font-black text-slate-400/80 uppercase tracking-widest">{totalItems} items</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1 text-center border-r border-white/10 dark:border-slate-800/20 whitespace-nowrap">
                                                        <span className="text-xs font-black text-slate-500 tabular-nums">{formatNumber(totalSecondaryQty)}</span>
                                                    </td>
                                                    <td className="px-3 py-1 text-center whitespace-nowrap">
                                                        <span className="text-xs font-black text-primary/80 tabular-nums">{formatNumber(totalQty)}</span>
                                                    </td>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-none">
                                                {/* Dòng Tìm Kiếm Sản Phẩm - Relocated for Better Workflow */}
                                                <tr
                                                    className="bg-transparent sticky top-[52px] z-[150] hover:z-[1000] focus-within:z-[2001] border-b border-[#8b6f47]/15 dark:border-white/5 transition-all hover:bg-white/5 dark:hover:bg-slate-800/10 group/working-row cursor-pointer"
                                                    onDoubleClick={() => {
                                                        if (workingItem.product) {
                                                            setEditingProduct(workingItem.product);
                                                            setIsEditModalOpen(true);
                                                        }
                                                    }}
                                                >
                                                    <td className="py-4 px-2 text-center">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                                                            <Plus size={18} className="text-primary" />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2 relative">
                                                        <div className="relative group/search">
                                                            <div className="relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-400">
                                                                    <Search size={20} />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Tên sản phẩm (F2)..."
                                                                    className="w-full py-2.5 px-2.5 pl-12 bg-transparent border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-transparent rounded-xl font-black text-gray-800 dark:text-gray-100 outline-none transition-all shadow-none leading-relaxed placeholder:normal-case placeholder:leading-relaxed"
                                                                    autoComplete="off"
                                                                    value={searchTerm}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setSearchTerm(val);
                                                                        setActiveIndex(0);
                                                                        // if user edits, clear current product to show dropdown
                                                                        if (workingItem.product && val !== workingItem.name) {
                                                                            setWorkingItem({ ...workingItem, product: null, name: val });
                                                                        }
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'ArrowUp') {
                                                                            e.preventDefault();
                                                                            setActiveIndex(prev => {
                                                                                const next = Math.max(prev - 1, 0);
                                                                                const container = productDropdownRef.current;
                                                                                if (container) {
                                                                                    const item = container.children[next];
                                                                                    if (item) item.scrollIntoView({ block: 'nearest' });
                                                                                }
                                                                                return next;
                                                                            });
                                                                        } else if (e.key === 'ArrowDown') {
                                                                            e.preventDefault();
                                                                            setActiveIndex(prev => {
                                                                                const next = Math.min(prev + 1, filteredProducts.length - 1);
                                                                                const container = productDropdownRef.current;
                                                                                if (container) {
                                                                                    const item = container.children[next];
                                                                                    if (item) item.scrollIntoView({ block: 'nearest' });
                                                                                }
                                                                                return next;
                                                                            });
                                                                        } else if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            if (searchTerm && filteredProducts[activeIndex]) {
                                                                                const p = filteredProducts[activeIndex];
                                                                                const currentQty = workingItem.quantity > 0 ? workingItem.quantity : 1;
                                                                                setWorkingItem({
                                                                                    product: p,
                                                                                    quantity: currentQty,
                                                                                    price: p.latest_cost_price || p.cost_price,
                                                                                    secondary_qty: currentQty / (p.multiplier || 1),
                                                                                    name: p.name
                                                                                });
                                                                                setSearchTerm(p.name);
                                                                                addToCart(p, 1, p.latest_cost_price || p.cost_price);
                                                                            }
                                                                        } else if (e.key === 'Tab') {
                                                                            if (workingItem.product) {
                                                                                e.preventDefault();
                                                                                // useEffect will handle focus
                                                                            } else if (searchTerm && filteredProducts[activeIndex]) {
                                                                                e.preventDefault();
                                                                                const p = filteredProducts[activeIndex];
                                                                                const currentQty = workingItem.quantity > 0 ? workingItem.quantity : 1;
                                                                                setWorkingItem({
                                                                                    product: p,
                                                                                    quantity: currentQty,
                                                                                    price: p.latest_cost_price || p.cost_price,
                                                                                    secondary_qty: currentQty / (p.multiplier || 1),
                                                                                    name: p.name
                                                                                });
                                                                                setSearchTerm(p.name);
                                                                            }
                                                                        }
                                                                    }}
                                                                    onFocus={(e) => e.target.select()}
                                                                    ref={searchInputRef}
                                                                />
                                                            </div>
                                                            {workingItem.product && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight backdrop-blur-md border transition-all shadow-sm",
                                                                        workingItem.product.stock < 10
                                                                            ? "bg-red-500/20 text-red-600 border-red-500/30"
                                                                            : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                                    )}>
                                                                        {workingItem.product.stock}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <AnimatePresence>
                                                                {searchTerm && !workingItem.product && (
                                                                    <m.div
                                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                                        className="dropdown-premium min-w-[500px]"
                                                                    >
                                                                        <div className="max-h-[400px] overflow-y-auto no-scrollbar scroll-smooth" ref={productDropdownRef}>
                                                                            {filteredProducts.map((p, idx) => (
                                                                                <div
                                                                                    key={p.id}
                                                                                    onMouseEnter={() => setActiveIndex(idx)}
                                                                                    onClick={() => {
                                                                                        const currentQty = workingItem.quantity > 0 ? workingItem.quantity : 1;
                                                                                        setWorkingItem({
                                                                                            product: p,
                                                                                            quantity: currentQty,
                                                                                            price: p.latest_cost_price || p.cost_price,
                                                                                            secondary_qty: currentQty / (p.multiplier || 1),
                                                                                            name: p.name
                                                                                        });
                                                                                        setSearchTerm(p.name);
                                                                                        // useEffect sẽ tự lo việc focus
                                                                                    }}
                                                                                    onDoubleClick={() => {
                                                                                        setEditingProduct(p);
                                                                                        setIsEditModalOpen(true);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "dropdown-item flex justify-between items-center",
                                                                                        idx === activeIndex && "active"
                                                                                    )}
                                                                                >
                                                                                    <div className="flex-1 min-w-0 overflow-hidden mr-3">
                                                                                        <div className={cn("font-black tracking-tight flex items-center gap-2 leading-relaxed min-w-0", idx === activeIndex ? "text-white" : "text-gray-800 dark:text-gray-100")}>
                                                                                            <div className="min-w-0 flex-1 overflow-hidden">
                                                                                                <MarqueeText
                                                                                                    text={p.name}
                                                                                                    isActive={idx === activeIndex}
                                                                                                    className="font-black tracking-tight leading-relaxed"
                                                                                                    style={{
                                                                                                        paddingLeft: idx === activeIndex ? '12px' : '0px'
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            {p.code && (
                                                                                                <span className={cn(
                                                                                                    "shrink-0 text-[9px] px-1.5 py-0.5 rounded font-black tabular-nums border",
                                                                                                    idx === activeIndex ? "bg-white/20 text-white border-white/20" : "bg-transparent text-gray-400 border-gray-200 dark:border-slate-700"
                                                                                                )}>
                                                                                                    {p.code}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className={cn("text-[10px] font-bold italic mb-0.5", idx === activeIndex ? "text-white/80" : "text-primary dark:text-emerald-400")}>{p.active_ingredient}</div>
                                                                                        <div className={cn("text-[10px] uppercase font-black flex items-center gap-2", idx === activeIndex ? "text-white/70" : "text-gray-400")}>
                                                                                            {normalizeUOM(p.unit)} {p.multiplier > 1 && `/ ${normalizeUOM(p.secondary_unit)} (x${p.multiplier})`}
                                                                                            <span className={cn(
                                                                                                "ml-2 px-2.5 py-1 rounded-lg text-sm font-black border shadow-sm",
                                                                                                idx === activeIndex
                                                                                                    ? "bg-white/20 text-white border-white/30"
                                                                                                    : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                                                                                            )}>
                                                                                                {p.stock}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right flex flex-col items-end gap-1.5">
                                                                                        <div className={cn("font-black text-lg tracking-tighter leading-none", idx === activeIndex ? "text-white" : "text-emerald-400")}>
                                                                                            {formatNumber(p.cost_price)}
                                                                                        </div>
                                                                                        <div className={cn("text-[10px] font-bold uppercase flex items-center gap-1", idx === activeIndex ? "text-white/70" : "text-gray-400")}>
                                                                                            <History size={10} strokeWidth={3} />
                                                                                            Nhập cuối: {formatNumber(p.latest_cost_price || 0)}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {searchTerm && filteredProducts.length === 0 && (
                                                                            <div
                                                                                className="p-4 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-primary hover:text-white cursor-pointer text-primary dark:text-emerald-400 font-black uppercase text-xs flex items-center gap-2"
                                                                                onClick={() => { setQuickAddName(searchTerm); setShowQuickAddProduct(true); }}
                                                                            >
                                                                                <Plus size={16} /> Thêm sản phẩm mới: "{searchTerm}"
                                                                            </div>
                                                                        )}
                                                                    </m.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2 text-center">
                                                        <div className="font-bold text-gray-700 dark:text-gray-200 text-xs">{normalizeUOM(workingItem.product?.unit || '-')}</div>
                                                        {workingItem.product?.secondary_unit && (
                                                            <div className="text-[10px] text-primary font-black uppercase tracking-tighter">
                                                                1 {normalizeUOM(workingItem.product.secondary_unit)} = {workingItem.product.multiplier} {normalizeUOM(workingItem.product.unit)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <div className="flex items-center gap-1 h-10 px-2 bg-transparent border border-white/20 dark:border-white/10 rounded-2xl focus-within:bg-transparent focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 shadow-none transition-all text-primary dark:text-emerald-400">
                                                            <input
                                                                type="number"
                                                                disabled={!workingItem.product?.secondary_unit}
                                                                className="w-full min-w-0 bg-transparent text-center font-black text-base outline-none placeholder:text-gray-300 disabled:opacity-30"
                                                                id="working-sec-qty"
                                                                ref={workingSecQtyRef}
                                                                value={workingItem.product ? workingItem.secondary_qty : ""}
                                                                autoComplete="off"
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => {
                                                                    const v = parseFloat(e.target.value) || 0;
                                                                    setWorkingItem(prev => {
                                                                        const mult = parseFloat(prev.product?.multiplier) || 1;
                                                                        return {
                                                                            ...prev,
                                                                            secondary_qty: v,
                                                                            quantity: v * mult
                                                                        };
                                                                    });
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Tab') {
                                                                        e.preventDefault();
                                                                        workingQtyRef.current?.focus();
                                                                    } else if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        if (workingItem.product && workingItem.quantity !== 0) {
                                                                            addToCart(workingItem.product, workingItem.quantity, workingItem.price);
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[10px] font-black text-gray-400 uppercase pr-2 whitespace-nowrap">{normalizeUOM(workingItem.product?.secondary_unit)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2">
                                                        <input
                                                            type="number"
                                                            className="w-full h-10 text-center bg-transparent border border-white/20 dark:border-white/10 rounded-2xl focus:bg-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none font-black text-lg text-primary dark:text-emerald-400 shadow-none transition-all placeholder:text-gray-300"
                                                            value={workingItem.product ? workingItem.quantity : ""}
                                                            id="working-main-qty"
                                                            ref={workingQtyRef}
                                                            autoComplete="off"
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={(e) => {
                                                                const v = parseFloat(e.target.value) || 0;
                                                                setWorkingItem(prev => {
                                                                    const mult = parseFloat(prev.product?.multiplier) || 1;
                                                                    return {
                                                                        ...prev,
                                                                        quantity: v,
                                                                        secondary_qty: v / mult
                                                                    };
                                                                });
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Tab') {
                                                                    e.preventDefault();
                                                                    workingPriceRef.current?.focus();
                                                                } else if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (workingItem.product && workingItem.quantity !== 0) {
                                                                        addToCart(workingItem.product, workingItem.quantity, workingItem.price);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-4 px-2 text-center">
                                                        <div className="flex flex-col items-center gap-1 group/price relative group-hover/price:z-[500]">
                                                            {workingItem.product && (
                                                                <div
                                                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-1
                                                                                bg-[#fbf9f4]/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-[#8b6f47]/30 dark:border-white/15 shadow-2xl shadow-[#8b6f47]/10 dark:shadow-black/50
                                                                                flex items-stretch whitespace-nowrap z-[9999] 
                                                                                opacity-0 group-hover/price:opacity-100 group-focus-within/price:opacity-100
                                                                                transition-all duration-300 pointer-events-none translate-y-2 group-hover/price:translate-y-0 group-focus-within/price:translate-y-0 ring-1 ring-black/5 dark:ring-white/5"
                                                                >
                                                                    <div className="flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                                                                        <span className="text-[9px] uppercase font-black text-slate-500/80 dark:text-slate-400 leading-none mb-1.5 tracking-[0.1em]">
                                                                            Vốn TB
                                                                        </span>
                                                                        <span className="text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums">
                                                                            {formatNumber(workingItem.product.cost_price)}
                                                                            <span className="text-[10px] ml-1 opacity-60">đ</span>
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-px my-2 bg-gradient-to-b from-transparent via-[#8b6f47]/20 dark:via-white/15 to-transparent" />
                                                                    <div className="flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                                                                        <span className="text-[9px] uppercase font-black text-[#8b6f47] dark:text-[#d4a574] leading-none mb-1.5 tracking-[0.1em]">
                                                                            Nhập cuối
                                                                        </span>
                                                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                                            {formatNumber(workingItem.product.latest_cost_price || 0)}
                                                                            <span className="text-[10px] ml-1 opacity-60">đ</span>
                                                                        </span>
                                                                    </div>
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#fbf9f4]/95 dark:border-t-slate-900/95 drop-shadow-xs" />
                                                                </div>
                                                            )}
                                                            <div className="relative w-full">
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 text-center bg-transparent border-none focus:ring-0 rounded font-black outline-none text-lg tabular-nums text-primary dark:text-emerald-400"
                                                                    value={workingItem.product ? formatNumber(workingItem.price) : ""}
                                                                    id="working-price"
                                                                    ref={workingPriceRef}
                                                                    autoComplete="off"
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => {
                                                                        const v = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                                                        setWorkingItem({ ...workingItem, price: v });
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            if (workingItem.product && workingItem.quantity !== 0) {
                                                                                addToCart(workingItem.product, workingItem.quantity, workingItem.price);
                                                                            }
                                                                        } else if (e.key === 'Tab' && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            searchInputRef.current?.focus();
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right font-black text-gray-900 dark:text-white text-lg">
                                                        {workingItem.product ? formatNumber(workingItem.price * workingItem.quantity) : ""}
                                                    </td>
                                                    <td className="py-4 px-2 text-center">
                                                        {workingItem.product && (
                                                            <button
                                                                onClick={() => setWorkingItem({ product: null, quantity: 1, price: 0, secondary_qty: 0, name: '' })}
                                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                title="Xóa dòng"
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>

                                                <AnimatePresence initial={false}>
                                                    {historyLoading ? (
                                                        <m.tr
                                                            key="loading-skeleton"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="w-full border-none bg-transparent"
                                                        >
                                                            <td colSpan={8} className="h-[400px] text-center relative align-middle border-none bg-transparent">
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 select-none">
                                                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                                                        <div className="absolute inset-0 rounded-full border-[2.5px] border-emerald-500/20 border-t-emerald-600 dark:border-white/10 dark:border-t-emerald-400 animate-spin" />
                                                                        <div className="absolute -inset-1.5 rounded-full border border-dashed border-[#8b6f47]/20 dark:border-white/10 pointer-events-none" />
                                                                        <div className="w-9 h-9 flex items-center justify-center relative z-10">
                                                                            <img src={LyangLogo} alt="LyangPOS" className="w-full h-full object-contain rounded-xl drop-shadow-md" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8b6f47] dark:text-[#d4a574]">
                                                                            Lyang<span className="text-emerald-700 dark:text-emerald-400">POS</span>
                                                                        </span>
                                                                        <span className="text-xs font-black text-[#2d5016] dark:text-emerald-300 uppercase tracking-widest px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-[#8b6f47]/15 dark:border-white/10 shadow-xs">
                                                                            Đang đồng bộ dữ liệu...
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </m.tr>
                                                    ) : (
                                                        cart.map((item, idx) => (
                                                            <m.tr
                                                                key={`cart-row-${idx}`}
                                                                layout
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: 50, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }}
                                                                transition={{
                                                                    duration: 0.3,
                                                                    type: "spring",
                                                                    stiffness: 300,
                                                                    damping: 25,
                                                                    delay: idx * 0.02
                                                                }}
                                                                className={cn(
                                                                    "relative transition-colors duration-200 group cursor-pointer border-b border-[#8b6f47]/10 dark:border-white/5 last:border-b-0",
                                                                    rowSearchIdx === idx
                                                                        ? "z-[2000] bg-white/5 dark:bg-slate-800/20"
                                                                        : "z-[50] hover:z-[1000] bg-transparent hover:bg-white/5 dark:hover:bg-slate-800/5 focus-within:z-[1000]"
                                                                )}
                                                                onDoubleClick={() => {
                                                                    const p = products.find(prod => prod.id === item.product_id);
                                                                    if (p) {
                                                                        setEditingProduct(p);
                                                                        setIsEditModalOpen(true);
                                                                    }
                                                                }}
                                                            >
                                                                <td className="py-2 px-2 text-center text-slate-400 font-black text-[11px] group-hover:text-primary transition-colors tabular-nums">{idx + 1}</td>
                                                                <td className="py-2 px-2 relative">
                                                                    <div
                                                                        className="relative group/search-row"
                                                                        onDoubleClick={(e) => {
                                                                            e.preventDefault();
                                                                            const p = products.find(prod => prod.id === item.product_id);
                                                                            if (p) {
                                                                                setEditingProduct(p);
                                                                                setIsEditModalOpen(true);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {rowSearchIdx === idx ? (
                                                                            <div className="w-full flex flex-col justify-center gap-1">
                                                                                <input
                                                                                    className={cn(
                                                                                        "w-full h-auto py-2.5 px-4 bg-white/10 dark:bg-slate-800/30 shadow-xl rounded-xl border-none focus:ring-0",
                                                                                        "text-[17px] font-black tracking-tight transition-all leading-relaxed placeholder:normal-case placeholder:leading-relaxed",
                                                                                        "text-emerald-900 dark:text-emerald-300 placeholder:text-gray-300"
                                                                                    )}
                                                                                    autoComplete="off"
                                                                                    autoFocus
                                                                                    value={rowSearchTerm}
                                                                                    onFocus={(e) => {
                                                                                        setRowSearchIdx(idx);
                                                                                        setRowSearchTerm(item.product_name);
                                                                                        setRowActiveIndex(0);
                                                                                        e.target.select();
                                                                                        if (item.ai_scanned) {
                                                                                            const newCart = [...cart];
                                                                                            delete newCart[idx].ai_scanned;
                                                                                            setCart(newCart);
                                                                                        }
                                                                                    }}
                                                                                    onChange={(e) => {
                                                                                        setRowSearchTerm(e.target.value);
                                                                                        setRowActiveIndex(0);
                                                                                    }}
                                                                                    onBlur={() => {
                                                                                        setTimeout(() => {
                                                                                            setRowSearchIdx(prev => prev === idx ? null : prev);
                                                                                        }, 200);
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        const filtered = products.filter(p => {
                                                                                            const s = rowSearchTerm.toLowerCase();
                                                                                            return (p.name || "").toLowerCase().includes(s) ||
                                                                                                (p.code || "").toLowerCase().includes(s) ||
                                                                                                (p.active_ingredient || "").toLowerCase().includes(s);
                                                                                        })
                                                                                        .sort((a, b) => {
                                                                                            const s = rowSearchTerm.toLowerCase();
                                                                                            const aName = (a.name || "").toLowerCase();
                                                                                            const bName = (b.name || "").toLowerCase();
                                                                                            const aStarts = aName.startsWith(s);
                                                                                            const bStarts = bName.startsWith(s);
                                                                                            if (aStarts && !bStarts) return -1;
                                                                                            if (!aStarts && bStarts) return 1;
                                                                                            if (a.code?.toLowerCase() === s && b.code?.toLowerCase() !== s) return -1;
                                                                                            if (a.code?.toLowerCase() !== s && b.code?.toLowerCase() === s) return 1;
                                                                                            return aName.localeCompare(bName, 'vi', { sensitivity: 'base' });
                                                                                        })
                                                                                        .slice(0, 50);
                                                                                    if (e.key === 'ArrowDown') {
                                                                                        if (rowSearchIdx === idx && filtered.length > 0) {
                                                                                            e.preventDefault();
                                                                                            setRowActiveIndex(prev => {
                                                                                                const next = Math.min(prev + 1, filtered.length - 1);
                                                                                                if (rowSearchDropdownRef.current) {
                                                                                                    const itemEl = rowSearchDropdownRef.current.children[next];
                                                                                                    if (itemEl) itemEl.scrollIntoView({ block: 'nearest' });
                                                                                                }
                                                                                                return next;
                                                                                            });
                                                                                        } else {
                                                                                            e.preventDefault();
                                                                                            const nextIdx = idx + 1;
                                                                                            if (nextIdx < cart.length) {
                                                                                                document.getElementById(`row-name-${nextIdx}`)?.focus();
                                                                                            }
                                                                                        }
                                                                                    } else if (e.key === 'ArrowUp') {
                                                                                        if (rowSearchIdx === idx && filtered.length > 0) {
                                                                                            e.preventDefault();
                                                                                            setRowActiveIndex(prev => {
                                                                                                const next = Math.max(prev - 1, 0);
                                                                                                if (rowSearchDropdownRef.current) {
                                                                                                    const itemEl = rowSearchDropdownRef.current.children[next];
                                                                                                    if (itemEl) itemEl.scrollIntoView({ block: 'nearest' });
                                                                                                }
                                                                                                return next;
                                                                                            });
                                                                                        } else {
                                                                                            e.preventDefault();
                                                                                            const prevIdx = idx - 1;
                                                                                            if (prevIdx >= 0) {
                                                                                                document.getElementById(`row-name-${prevIdx}`)?.focus();
                                                                                            } else {
                                                                                                searchInputRef.current?.focus();
                                                                                            }
                                                                                        }
                                                                                    } else if (e.key === 'Enter') {
                                                                                        e.preventDefault();
                                                                                        if (filtered[rowActiveIndex]) {
                                                                                            const p = filtered[rowActiveIndex];
                                                                                            let newCart = [...cart];
                                                                                            const currentQty = newCart[idx].quantity;
                                                                                            const existingIdx = newCart.findIndex((item, i) => i !== idx && item.product_id === p.id);
                                                                                            if (existingIdx > -1) {
                                                                                                newCart[existingIdx].quantity += currentQty;
                                                                                                newCart[existingIdx].secondary_qty = newCart[existingIdx].quantity / (newCart[existingIdx].multiplier || 1);
                                                                                                newCart.splice(idx, 1);
                                                                                            } else {
                                                                                                newCart[idx] = {
                                                                                                    ...newCart[idx],
                                                                                                    product_id: p.id,
                                                                                                    product_name: p.name,
                                                                                                    unit: p.unit,
                                                                                                    secondary_unit: p.secondary_unit,
                                                                                                    multiplier: p.multiplier || 1,
                                                                                                    price: p.cost_price,
                                                                                                    stock: p.stock,
                                                                                                    secondary_qty: currentQty / (p.multiplier || 1),
                                                                                                    active_ingredient: p.active_ingredient
                                                                                                };
                                                                                            }
                                                                                            setCart(newCart);
                                                                                            setRowSearchIdx(null);
                                                                                        }
                                                                                        searchInputRef.current?.focus();
                                                                                    } else if (e.key === 'Tab') {
                                                                                        e.preventDefault();
                                                                                        const filtered_matches = filtered.length > 0 ? filtered : [];
                                                                                        if (filtered_matches[rowActiveIndex]) {
                                                                                            const p = filtered_matches[rowActiveIndex];
                                                                                            let newCart = [...cart];
                                                                                            const currentQty = newCart[idx].quantity;
                                                                                            const existingIdx = newCart.findIndex((item, i) => i !== idx && item.product_id === p.id);
                                                                                            if (existingIdx > -1) {
                                                                                                newCart[existingIdx].quantity += currentQty;
                                                                                                newCart[existingIdx].secondary_qty = newCart[existingIdx].quantity / (newCart[existingIdx].multiplier || 1);
                                                                                                newCart.splice(idx, 1);
                                                                                                setCart(newCart);
                                                                                                setRowSearchIdx(null);

                                                                                                // Focus the merged row's quantity
                                                                                                setTimeout(() => {
                                                                                                    const targetIdx = existingIdx > idx ? existingIdx - 1 : existingIdx;
                                                                                                    const sec = document.getElementById(`qty-sec-${targetIdx}`);
                                                                                                    if (posMode === 'Wholesale' && sec && !sec.disabled) {
                                                                                                        sec.focus();
                                                                                                        sec.select?.();
                                                                                                    } else {
                                                                                                        const main = document.getElementById(`qty-main-${targetIdx}`);
                                                                                                        main?.focus();
                                                                                                        main?.select?.();
                                                                                                    }
                                                                                                }, 200);
                                                                                            } else {
                                                                                                newCart[idx] = {
                                                                                                    ...newCart[idx],
                                                                                                    product_id: p.id,
                                                                                                    product_name: p.name,
                                                                                                    unit: p.unit,
                                                                                                    secondary_unit: p.secondary_unit,
                                                                                                    multiplier: p.multiplier || 1,
                                                                                                    price: p.cost_price,
                                                                                                    stock: p.stock,
                                                                                                    secondary_qty: currentQty / (p.multiplier || 1),
                                                                                                    active_ingredient: p.active_ingredient
                                                                                                };
                                                                                                setCart(newCart);
                                                                                                setRowSearchIdx(null);
                                                                                                setTimeout(() => {
                                                                                                    const sec = document.getElementById(`qty-sec-${idx}`);
                                                                                                    if (posMode === 'Wholesale' && sec && !sec.disabled) {
                                                                                                        sec.focus();
                                                                                                        sec.select?.();
                                                                                                    } else {
                                                                                                        const main = document.getElementById(`qty-main-${idx}`);
                                                                                                        main?.focus();
                                                                                                        main?.select?.();
                                                                                                    }
                                                                                                }, 200);
                                                                                            }
                                                                                        } else {
                                                                                            // No match, just move to quantity column
                                                                                            setRowSearchIdx(null);
                                                                                            setTimeout(() => {
                                                                                                const sec = document.getElementById(`qty-sec-${idx}`);
                                                                                                if (posMode === 'Wholesale' && sec && !sec.disabled) {
                                                                                                    sec.focus();
                                                                                                    sec.select?.();
                                                                                                } else {
                                                                                                    const main = document.getElementById(`qty-main-${idx}`);
                                                                                                    main?.focus();
                                                                                                    main?.select?.();
                                                                                                }
                                                                                            }, 200);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                id={`row-name-${idx}`}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => {
                                                                                setRowSearchIdx(idx);
                                                                                setRowSearchTerm(item.product_name);
                                                                                setRowActiveIndex(0);
                                                                                setTimeout(() => {
                                                                                    const el = document.getElementById(`row-name-${idx}`);
                                                                                    el?.focus();
                                                                                    el?.select?.();
                                                                                }, 50);
                                                                            }}
                                                                            className="w-full h-auto py-1.5 px-3 flex flex-col justify-center gap-1 cursor-pointer group/marquee-wrap min-h-[44px]"
                                                                        >
                                                                            <div className="w-full flex items-center justify-between gap-2.5">
                                                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                                                    <MarqueeText
                                                                                        text={item.product_name}
                                                                                        className="text-[17px] font-black tracking-tight leading-relaxed text-emerald-900 dark:text-emerald-300"
                                                                                        title={item.product_name}
                                                                                        onDoubleClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            const p = products.find(prod => prod.id === item.product_id);
                                                                                            if (p) {
                                                                                                setEditingProduct(p);
                                                                                                setIsEditModalOpen(true);
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            {item.ai_scanned && (
                                                                                <div className="flex items-center gap-1.5 z-10 w-fit">
                                                                                    {item.ai_matched_status === 'matched' ? (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1.5 border border-emerald-500/20 shadow-xs">
                                                                                            <Sparkles size={11} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                                                                                            <span>AI Tự khớp: "{item.ai_original_name}"</span>
                                                                                            <button 
                                                                                                type="button" 
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const newCart = [...cart];
                                                                                                    delete newCart[idx].ai_scanned;
                                                                                                    setCart(newCart);
                                                                                                }}
                                                                                                className="hover:bg-emerald-500/20 rounded p-0.5 text-emerald-700 dark:text-emerald-300 transition-all inline-flex items-center justify-center ml-0.5"
                                                                                                title="Xác nhận khớp đúng"
                                                                                            >
                                                                                                <Check size={10} strokeWidth={3} />
                                                                                            </button>
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center gap-1.5 border border-amber-500/20 shadow-xs">
                                                                                            <AlertCircle size={11} className="text-amber-500 dark:text-amber-400 shrink-0" />
                                                                                            <span>AI không khớp được: "{item.ai_original_name}"</span>
                                                                                            <button 
                                                                                                type="button" 
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const newCart = [...cart];
                                                                                                    delete newCart[idx].ai_scanned;
                                                                                                    setCart(newCart);
                                                                                                }}
                                                                                                className="hover:bg-amber-500/20 rounded p-0.5 text-amber-700 dark:text-amber-300 transition-all inline-flex items-center justify-center ml-0.5"
                                                                                                title="Bỏ qua cảnh báo"
                                                                                            >
                                                                                                <X size={10} strokeWidth={3} />
                                                                                            </button>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {rowSearchIdx === idx && rowSearchTerm && (
                                                                            <div className="dropdown-premium min-w-[400px] mt-2">
                                                                                <div ref={rowSearchDropdownRef} className="max-h-64 overflow-y-auto no-scrollbar">
                                                                                    {products.filter(p => {
                                                                                        const s = rowSearchTerm.toLowerCase();
                                                                                        return (p.name || "").toLowerCase().includes(s) ||
                                                                                            (p.code || "").toLowerCase().includes(s) ||
                                                                                            (p.active_ingredient || "").toLowerCase().includes(s);
                                                                                    })
                                                                                        .sort((a, b) => {
                                                                                            const s = rowSearchTerm.toLowerCase();
                                                                                            const aName = (a.name || "").toLowerCase();
                                                                                            const bName = (b.name || "").toLowerCase();
                                                                                            const aStarts = aName.startsWith(s);
                                                                                            const bStarts = bName.startsWith(s);
                                                                                            if (aStarts && !bStarts) return -1;
                                                                                            if (!aStarts && bStarts) return 1;
                                                                                            if (a.code?.toLowerCase() === s && b.code?.toLowerCase() !== s) return -1;
                                                                                            if (a.code?.toLowerCase() !== s && b.code?.toLowerCase() === s) return 1;
                                                                                            return aName.localeCompare(bName, 'vi', { sensitivity: 'base' });
                                                                                        })
                                                                                        .slice(0, 50).map((p, pIdx) => (
                                                                                            <div
                                                                                                key={p.id}
                                                                                                onMouseEnter={() => setRowActiveIndex(pIdx)}
                                                                                                onClick={() => {
                                                                                                    let newCart = [...cart];
                                                                                                    const currentQty = newCart[idx].quantity;
                                                                                                    const existingIdx = newCart.findIndex((item, i) => i !== idx && item.product_id === p.id);
                                                                                                    if (existingIdx > -1) {
                                                                                                        newCart[existingIdx].quantity += currentQty;
                                                                                                        newCart[existingIdx].secondary_qty = newCart[existingIdx].quantity / (newCart[existingIdx].multiplier || 1);
                                                                                                        newCart.splice(idx, 1);
                                                                                                    } else {
                                                                                                        newCart[idx] = {
                                                                                                            ...newCart[idx],
                                                                                                            product_id: p.id,
                                                                                                            product_name: p.name,
                                                                                                            unit: p.unit,
                                                                                                            secondary_unit: p.secondary_unit,
                                                                                                            multiplier: p.multiplier || 1,
                                                                                                            price: p.cost_price,
                                                                                                            stock: p.stock,
                                                                                                            secondary_qty: currentQty / (p.multiplier || 1),
                                                                                                            active_ingredient: p.active_ingredient
                                                                                                        };
                                                                                                    }
                                                                                                    setCart(newCart);
                                                                                                    setRowSearchIdx(null);
                                                                                                }}
                                                                                                className={cn(
                                                                                                    "dropdown-item flex justify-between items-center",
                                                                                                    pIdx === rowActiveIndex && "active"
                                                                                                )}
                                                                                            >
                                                                                                <div className="flex-1 min-w-0 overflow-hidden mr-3">
                                                                                                    <div className={cn("font-black tracking-tight flex items-center gap-2 leading-relaxed min-w-0", pIdx === rowActiveIndex ? "text-white" : "text-gray-800 dark:text-gray-100")}>
                                                                                                        <div className="min-w-0 flex-1 overflow-hidden">
                                                                                                            <MarqueeText
                                                                                                                text={p.name}
                                                                                                                isActive={pIdx === rowActiveIndex}
                                                                                                                className="font-black tracking-tight leading-relaxed"
                                                                                                                style={{
                                                                                                                    paddingLeft: pIdx === rowActiveIndex ? '12px' : '0px'
                                                                                                                }}
                                                                                                            />
                                                                                                        </div>
                                                                                                        {p.code && (
                                                                                                            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded font-black tabular-nums border bg-transparent text-gray-400 border-gray-200 dark:border-slate-700">
                                                                                                                {p.code}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="text-[11px] text-gray-500 uppercase font-black flex items-center gap-2">
                                                                                                        <span>{normalizeUOM(p.unit)}</span>
                                                                                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                                                        <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-emerald-500/20">{p.stock}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="text-right">
                                                                                                    <div className="font-black text-primary leading-none">{formatNumber(p.cost_price)}</div>
                                                                                                    <div className="text-[9px] font-black mt-1 uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                                                                        Nhập cuối: {formatNumber(p.latest_cost_price)}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {item.active_ingredient && (
                                                                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/search-row:block z-[2000] w-64 bg-slate-800 text-white p-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700 uppercase-none">
                                                                                <div className="text-[10px] font-black uppercase text-emerald-400 mb-1 tracking-widest border-b border-white/10 pb-1">Hoạt chất / Thành phần</div>
                                                                                <div className="text-xs font-bold leading-relaxed">{item.active_ingredient}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-slate-500 font-bold text-xs">
                                                                    <div>{normalizeUOM(item.unit)}</div>
                                                                    {item.secondary_unit && <div className="text-[10px] text-primary/60 dark:text-emerald-400/60 font-black uppercase tracking-tighter mt-0.5">1 {normalizeUOM(item.secondary_unit)} = {item.multiplier} {normalizeUOM(item.unit)}</div>}
                                                                </td>
                                                                <td className="py-2 px-2">
                                                                    {item.secondary_unit ? (
                                                                        <div className="flex items-center gap-1 h-10 px-2 bg-transparent border border-white/20 dark:border-white/10 rounded-2xl focus-within:bg-transparent focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 shadow-none transition-all text-primary dark:text-emerald-400">
                                                                            <input
                                                                                type="number"
                                                                                className="w-full min-w-0 bg-transparent text-center font-black text-base outline-none placeholder:text-gray-300"
                                                                                value={item.secondary_qty}
                                                                                onFocus={(e) => e.target.select()}
                                                                                autoComplete="off"
                                                                                onChange={(e) => updateCartItem(idx, 'secondary_qty', parseFloat(e.target.value) || 0)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'ArrowDown') {
                                                                                        e.preventDefault();
                                                                                        const nextIdx = idx + 1;
                                                                                        if (nextIdx < cart.length) {
                                                                                            document.getElementById(`qty-sec-${nextIdx}`)?.focus();
                                                                                        }
                                                                                    } else if (e.key === 'ArrowUp') {
                                                                                        e.preventDefault();
                                                                                        const prevIdx = idx - 1;
                                                                                        if (prevIdx >= 0) {
                                                                                            document.getElementById(`qty-sec-${prevIdx}`)?.focus();
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                id={`qty-sec-${idx}`}
                                                                            />
                                                                            <span className="text-[10px] font-black text-gray-400 uppercase pr-2 whitespace-nowrap">{normalizeUOM(item.secondary_unit)}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center text-gray-300 italic text-[10px] font-bold">N/A</div>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-2 relative group/qty">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full h-10 text-center bg-transparent border border-white/20 dark:border-white/10 rounded-2xl focus:bg-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none font-black text-lg text-primary dark:text-emerald-400 shadow-none transition-all placeholder:text-gray-300"
                                                                        value={item.quantity}
                                                                        onFocus={(e) => e.target.select()}
                                                                        autoComplete="off"
                                                                        onChange={(e) => updateCartItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                searchInputRef.current?.focus();
                                                                            } else if (e.key === 'Tab') {
                                                                                e.preventDefault();
                                                                                document.getElementById(`price-${idx}`)?.focus();
                                                                            } else if (e.key === 'ArrowDown') {
                                                                                e.preventDefault();
                                                                                const nextIdx = idx + 1;
                                                                                if (nextIdx < cart.length) {
                                                                                    document.getElementById(`qty-main-${nextIdx}`)?.focus();
                                                                                }
                                                                            } else if (e.key === 'ArrowUp') {
                                                                                e.preventDefault();
                                                                                const prevIdx = idx - 1;
                                                                                if (prevIdx >= 0) {
                                                                                    document.getElementById(`qty-main-${prevIdx}`)?.focus();
                                                                                } else {
                                                                                    workingQtyRef.current?.focus();
                                                                                }
                                                                            }
                                                                        }}
                                                                        id={`qty-main-${idx}`}
                                                                    />
                                                                    <button
                                                                        tabIndex={-1}
                                                                        className="absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center bg-white/40 dark:bg-black/20 text-[#8b6f47] dark:text-emerald-400 rounded-full  border border-white/50 dark:border-white/10 hover:bg-white/60 active:scale-90 z-[70] transition-all hover:scale-110 opacity-0 group-hover/qty:opacity-100"
                                                                        onClick={() => updateCartItem(idx, 'quantity', item.quantity * -1)}
                                                                        title="Đổi thành Trả Hàng (Âm)"
                                                                    >
                                                                        <RotateCcw size={10} strokeWidth={3} />
                                                                    </button>
                                                                </td>
                                                                <td className="py-2 px-2 text-right text-slate-900 dark:text-white font-black text-lg">
                                                                    <div className="flex flex-col items-center gap-1 group/price relative group-hover/price:z-[500]">
                                                                        {products.find(p => p.id === item.product_id) && (
                                                                            <div
                                                                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-1
                                                                                            bg-[#fbf9f4]/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-[#8b6f47]/30 dark:border-white/15 shadow-2xl shadow-[#8b6f47]/10 dark:shadow-black/50
                                                                                            flex items-stretch whitespace-nowrap z-[9999] 
                                                                                            opacity-0 group-hover/price:opacity-100 group-focus-within/price:opacity-100
                                                                                            transition-all duration-300 pointer-events-none translate-y-2 group-hover/price:translate-y-0 group-focus-within/price:translate-y-0 ring-1 ring-black/5 dark:ring-white/5"
                                                                            >
                                                                                <div className="flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                                                                                    <span className="text-[9px] uppercase font-black text-slate-500/80 dark:text-slate-400 leading-none mb-1.5 tracking-[0.1em]">
                                                                                        Vốn TB
                                                                                    </span>
                                                                                    <span className="text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums">
                                                                                        {formatNumber(products.find(p => p.id === item.product_id)?.cost_price || 0)}
                                                                                        <span className="text-[10px] ml-1 opacity-60">đ</span>
                                                                                    </span>
                                                                                </div>
                                                                                <div className="w-px my-2 bg-gradient-to-b from-transparent via-[#8b6f47]/20 dark:via-white/15 to-transparent" />
                                                                                <div className="flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                                                                                    <span className="text-[9px] uppercase font-black text-[#8b6f47] dark:text-[#d4a574] leading-none mb-1.5 tracking-[0.1em]">
                                                                                        Nhập cuối
                                                                                    </span>
                                                                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                                                        {formatNumber(products.find(p => p.id === item.product_id)?.latest_cost_price || 0)}
                                                                                        <span className="text-[10px] ml-1 opacity-60">đ</span>
                                                                                    </span>
                                                                                </div>
                                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#fbf9f4]/95 dark:border-t-slate-900/95 drop-shadow-xs" />
                                                                            </div>
                                                                        )}
                                                                        <div className="relative w-full">
                                                                            <input
                                                                                type="text"
                                                                                className={cn(
                                                                                    "w-full p-2 text-center bg-transparent border-none focus:ring-0 rounded font-black outline-none text-lg tabular-nums text-primary dark:text-emerald-400",
                                                                                    item.price === 0 && "text-transparent select-none placeholder:text-transparent"
                                                                                )}
                                                                            value={formatNumber(item.price)}
                                                                            onFocus={(e) => e.target.select()}
                                                                            autoComplete="off"
                                                                            onChange={(e) => {
                                                                                const val = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                                                                updateCartItem(idx, 'price', val);
                                                                            }}
                                                                            onBlur={() => {
                                                                                if (item.product_id && item.price > 0) {
                                                                                    const prod = products.find(p => p.id === item.product_id);
                                                                                    if (prod && prod.sale_price > 0 && item.price > prod.sale_price) {
                                                                                        checkPriceRaiseAlert([{ product_id: prod.id, price: item.price }]);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' || e.key === 'Tab') {
                                                                                    e.preventDefault();
                                                                                    if (e.key === 'Enter') playTabSound();
                                                                                    searchInputRef.current?.focus();
                                                                                } else if (e.key === 'ArrowDown') {
                                                                                    e.preventDefault();
                                                                                    const nextIdx = idx + 1;
                                                                                    if (nextIdx < cart.length) {
                                                                                        document.getElementById(`price-${nextIdx}`)?.focus();
                                                                                    }
                                                                                } else if (e.key === 'ArrowUp') {
                                                                                    e.preventDefault();
                                                                                    const prevIdx = idx - 1;
                                                                                    if (prevIdx >= 0) {
                                                                                        document.getElementById(`price-${prevIdx}`)?.focus();
                                                                                    } else {
                                                                                        workingPriceRef.current?.focus();
                                                                                    }
                                                                                }
                                                                            }}
                                                                            id={`price-${idx}`}
                                                                        />
                                                                        {item.price === 0 && (
                                                                            <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
                                                                                <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider border border-rose-500/20">
                                                                                    HÀNG TẶNG
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                </td>
                                                                <td className="py-2 px-4 text-right font-black text-slate-900 dark:text-white text-lg tabular-nums">
                                                                    {formatNumber(item.price * item.quantity)}
                                                                </td>
                                                                <td className="py-2 px-2 text-center">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const newCart = [...cart];
                                                                            newCart.splice(idx, 1);
                                                                            setCart(newCart);
                                                                        }}
                                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Xóa dòng"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </td>
                                                            </m.tr>
                                                        ))
                                                    )}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* In-Cart Save Success Visual Feedback */}
                                <AnimatePresence>
                                    {savedOrderNotice && (
                                        <m.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                            className="no-print print:hidden absolute inset-0 z-[500] pointer-events-none rounded-3xl backdrop-blur-sm bg-transparent flex items-center justify-center p-4"
                                        >
                                            {/* Floating notification badge in center */}
                                            <m.div
                                                initial={{ scale: 0.95, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.98, opacity: 0, transition: { duration: 0.15 } }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="bg-[#fbf8f2] dark:bg-[#1a1e17] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 shadow-2xl rounded-3xl p-5 md:p-7 flex flex-col items-center gap-2.5 text-center max-w-xs sm:max-w-sm w-full mx-auto relative overflow-hidden pointer-events-auto"
                                            >
                                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                                    <m.rect
                                                        x="1"
                                                        y="1"
                                                        width="calc(100% - 2px)"
                                                        height="calc(100% - 2px)"
                                                        rx="23"
                                                        fill="none"
                                                        stroke="#10b981"
                                                        strokeWidth="2"
                                                        pathLength="100"
                                                        strokeDasharray="25 75"
                                                        initial={{ strokeDashoffset: 100 }}
                                                        animate={{ strokeDashoffset: 0 }}
                                                        transition={{ duration: 1.6, ease: "easeInOut" }}
                                                    />
                                                </svg>
                                                <div className="relative flex items-center justify-center mb-0.5">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-[#2d5016]/25 relative z-10">
                                                        <Check size={30} strokeWidth={3.5} />
                                                        </div>
                                                    </div>

                                                    <div className="text-base sm:text-lg font-black uppercase tracking-tight text-[#2d5016] dark:text-emerald-400">
                                                        ĐÃ LƯU ĐƠN NHẬP THÀNH CÔNG!
                                                    </div>

                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b6f47]/10 dark:bg-[#d4a574]/15 border border-[#8b6f47]/25 dark:border-[#d4a574]/30 text-[#2d5016] dark:text-[#d4a574] text-xs font-black uppercase tracking-wide">
                                                        <span>ĐƠN #{savedOrderNotice.id}</span>
                                                        <span className="opacity-40">•</span>
                                                        <span>{savedOrderNotice.count} MÓN</span>
                                                        {savedOrderNotice.partnerName && (
                                                            <>
                                                                <span className="opacity-40">•</span>
                                                                <span className="truncate max-w-[120px]">{savedOrderNotice.partnerName}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </m.div>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

{/* Floating Bubbles - Only visible when sidebar is collapsed and in sidebar mode */}
<AnimatePresence>
{!isSidebarExpanded && summaryLayoutMode === 'sidebar' && (
    <>
        {/* Floating Supplier Bubble - Bottom Left */}
        <m.div
            key="partner-bubble"
            initial={{
                scale: 0.5,
                opacity: 0,
                y: 50,
                filter: "blur(10px)",
            }}
             animate={{
                 scale: 1,
                 opacity: 1,
                 x: bubblePos.partner.x,
                 y: bubblePos.partner.y,
                 filter: "blur(0.01px)",
             }}
             exit={{
                 scale: 0.5,
                 opacity: 0,
                 y: 50,
                 filter: "blur(10px)",
             }}
             transition={{
                 scale: {
                     type: "spring",
                     stiffness: 350,
                     damping: 25,
                     mass: 0.8,
                 },
                 opacity: { duration: 0.2 },
                 y: {
                     type: "spring",
                     stiffness: 350,
                     damping: 25,
                     mass: 0.8,
                 },
                 filter: { duration: 0.2, ease: "easeOut" },
             }}
             drag
             dragConstraints={{ top: -500 - bubblePos.partner.y, left: -20 - bubblePos.partner.x, right: 800 - bubblePos.partner.x, bottom: 20 - bubblePos.partner.y }}
             onDragEnd={(_, info) => updateBubblePos('partner', info.offset)}
             className="absolute bottom-10 left-10 z-[110] pointer-events-none flex flex-col items-start gap-4"
         >
             <div className="flex items-center gap-4 pointer-events-auto">
                 <div
                     onClick={() => {
                         if (selectedPartner) {
                             setEditingPartner(selectedPartner);
                             setIsPartnerEditModalOpen(true);
                         } else {
                             partnerInputRef.current?.focus();
                         }
                     }}
                     className="flex items-start group/partner-bubble cursor-pointer hover:scale-[1.02] transition-all duration-500 p-4 px-6 rounded-[2.5rem] border border-border/50 bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md hover:bg-[#f5eedb] dark:hover:bg-[#332a1e] hover:border-primary/30 relative overflow-hidden"
                 >
                     <Sprout className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/5 -rotate-12 transition-transform group-hover/partner-bubble:scale-110 group-hover/partner-bubble:-rotate-6 pointer-events-none" />
                     
                     <div className="flex flex-col max-w-[300px] relative z-10">
                         <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                             Nhà cung cấp
                         </div>
                         
                         <div className="flex items-center gap-2 mb-2">
                             {selectedPartner && (
                                 <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black tracking-wider shrink-0 mt-0.5">
                                     ID: {selectedPartner.id}
                                 </span>
                             )}
                            <div className="text-lg font-black text-foreground uppercase leading-relaxed py-1 tracking-tight truncate">
                                {selectedPartner ? selectedPartner.name : "Nhà cung cấp lẻ"}
                            </div>
                        </div>
                    {selectedPartner && (
                        <div className="flex flex-col gap-1.5 mt-2 w-full">
                            {/* Info Grid (Phone, CCCD, Address) */}
                            <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
                                {selectedPartner.phone && (
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 bg-transparent/60 dark:bg-slate-900/60 rounded-lg border border-gray-100 dark:border-slate-800/80",
                                        !selectedPartner.cccd && "col-span-2"
                                    )}>
                                        <Phone size={12} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                        <span className="text-gray-800 dark:text-gray-200 truncate">
                                            {selectedPartner.phone}
                                        </span>
                                    </div>
                                )}
                                {selectedPartner.cccd && (
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 bg-transparent/60 dark:bg-slate-900/60 rounded-lg border border-gray-100 dark:border-slate-800/80",
                                        !selectedPartner.phone && "col-span-2"
                                    )}>
                                        <FileText size={12} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                        <span className="text-gray-800 dark:text-gray-200 truncate">
                                            {selectedPartner.cccd}
                                        </span>
                                    </div>
                                )}
                                {selectedPartner.address && (
                                    <div className="col-span-2 flex items-center gap-1.5 px-2 py-1 bg-transparent/60 dark:bg-slate-900/60 rounded-lg border border-gray-100 dark:border-slate-800/80">
                                        <MapPin size={12} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300 truncate" title={selectedPartner.address}>
                                            {selectedPartner.address}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Debt Status Card */}
                            {remainingDebt !== 0 && (
                                    <div className="p-2 bg-transparent flex items-start gap-1.5 text-[11px] font-bold">
                                        <Wallet size={11} className="text-primary/70 shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground uppercase tracking-wider text-[9px] whitespace-nowrap mt-0.5">
                                            Dư nợ:
                                        </span>
                                        {(() => {
                                            const changeVal = remainingDebt - oldDebt;
                                            if (changeVal === 0) {
                                                return (
                                                    <span className={cn("font-black text-xs ml-1", oldDebt > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                                                        {formatNumber(Math.abs(oldDebt))}{oldDebt < 0 ? " (Mình nợ)" : oldDebt > 0 ? " (Họ nợ)" : ""}
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="font-black text-xs ml-1 flex flex-col items-start gap-1">
                                                    <span className={oldDebt > 0 ? "text-rose-500/80" : oldDebt < 0 ? "text-emerald-500/80" : "text-foreground/80"}>
                                                        {formatNumber(Math.abs(oldDebt))}{oldDebt < 0 ? " (Mình nợ)" : oldDebt > 0 ? " (Họ nợ)" : ""}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-muted-foreground text-[10px]">➔</span>
                                                        <span className={remainingDebt > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                                                            {formatNumber(Math.abs(remainingDebt))}{remainingDebt < 0 ? " (Mình nợ)" : remainingDebt > 0 ? " (Họ nợ)" : ""}
                                                        </span>
                                                    </div>
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </m.div>

            {/* Floating Total Amount Bubble - Bottom Right */}
            <m.div
                key="total-bubble"
                initial={{
                    scale: 0.5,
                    opacity: 0,
                    y: 50,
                    filter: "blur(10px)",
                }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    x: bubblePos.total.x,
                    y: bubblePos.total.y,
                    filter: "blur(0.01px)",
                }}
                exit={{
                    scale: 0.5,
                    opacity: 0,
                    y: 50,
                    filter: "blur(10px)",
                }}
                transition={{
                    scale: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 },
                    opacity: { duration: 0.2 },
                    y: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 },
                    filter: { duration: 0.2, ease: "easeOut" },
                }}
                drag
                dragConstraints={{ top: -500 - bubblePos.total.y, left: -800 - bubblePos.total.x, right: 20 - bubblePos.total.x, bottom: 20 - bubblePos.total.y }}
                onDragEnd={(_, info) => updateBubblePos('total', info.offset)}
                className="absolute bottom-10 right-10 z-[110] pointer-events-none flex items-center gap-4"
            >
                {selectedPartner && (
                    <div className="w-[180px] pointer-events-auto flex items-center pos-card bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md p-1.5 rounded-[2.5rem] group/payment-toggle relative h-[75px] transition-all duration-500 shadow-md border border-border/50">
                        <m.div
                            layout
                            className="absolute inset-y-1.5 bg-[#4a7c59] rounded-[2rem] z-0"
                            style={{
                                width: "calc(50% - 6px)",
                                left: paymentMethod === "Cash" ? "6px" : "calc(50%)"
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30
                            }}
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPaymentMethod("Cash");
                            }}
                            className={cn(
                                "flex-1 h-full rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative z-10 gap-0.5",
                                paymentMethod === "Cash" ? "text-white" : "text-slate-400 hover:text-primary dark:hover:text-[#d4a574]"
                            )}
                        >
                            <Coins size={14} className={paymentMethod === "Cash" ? "opacity-100" : "opacity-40"} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Tiền mặt</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPaymentMethod("Debt");
                                setAmountPaid(0);
                            }}
                            className={cn(
                                "flex-1 h-full rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative z-10 gap-0.5",
                                paymentMethod === "Debt" ? "text-white" : "text-slate-400 hover:text-primary dark:hover:text-[#d4a574]"
                            )}
                        >
                            <Wallet size={14} className={paymentMethod === "Debt" ? "opacity-100" : "opacity-40"} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Ghi nợ</span>
                        </button>
                    </div>
                )}
                <div
                    className="px-10 py-6 rounded-[2.5rem] border border-border/50 bg-[#f8f4e8]/95 dark:bg-[#2a2217]/95 backdrop-blur-md hover:bg-[#f5eedb] dark:hover:bg-[#332a1e] hover:border-emerald-500/30 flex flex-col items-end group/total cursor-default hover:scale-[1.02] active:scale-95 transition-all duration-500 pointer-events-auto relative overflow-hidden"
                >
                    <Wallet className="absolute -left-8 -bottom-8 w-40 h-40 text-emerald-500/5 -rotate-12 transition-transform group-hover/total:scale-110 group-hover/total:-rotate-6 pointer-events-none" />
                    <div className="flex items-center gap-2 mb-1 z-10 relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                            Tổng cộng tiền nhập
                        </span>
                    </div>
                    <div className="text-4xl font-black tracking-tighter tabular-nums text-foreground flex items-baseline gap-1 z-10 relative">
                        {formatNumber(totalAmount)}
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                            đ
                        </span>
                    </div>
                </div>
            </m.div>
        </>
    )}
</AnimatePresence>

                        {/* Bottom Summary Panel when in 'bottom' mode */}
                        {summaryLayoutMode === 'bottom' && (
                            <div 
                                style={{ height: `${bottomSummaryHeight}px`, minHeight: '75px', maxHeight: '320px' }}
                                className="mt-1 bg-transparent border-0 rounded-[1.8rem] p-1 shadow-none shrink-0 no-print relative flex flex-col justify-between select-none"
                            >
                                {/* Top Drag Handle for Resizing */}
                                <div
                                    id="purchase-bottom-summary-resizer"
                                    onMouseDown={handleStartResizeBottom}
                                    className="w-full h-3 -mt-3.5 mb-1 cursor-row-resize flex items-center justify-center group/resize-bar hover:bg-[#8b6f47]/10 transition-colors rounded-t-full"
                                    title="Kéo để chỉnh độ cao thanh tổng kết"
                                >
                                    <div className={cn(
                                        "w-16 h-1 rounded-full transition-all shadow-sm",
                                        isResizingBottom
                                            ? "bg-emerald-500 h-1.5 w-24 shadow-emerald-500/50"
                                            : "bg-slate-400/40 dark:bg-slate-600/40 group-hover/resize-bar:bg-emerald-500 group-hover/resize-bar:h-1.5 group-hover/resize-bar:w-20"
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch w-full h-full">
                                    {/* Col 1: Dư nợ & Sổ nợ / Gửi kho (2 cols) */}
                                    <m.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="md:col-span-2 flex flex-col justify-between gap-1.5 min-w-0 h-full"
                                    >
                                        <div
                                            onClick={() => {
                                                if (selectedPartner) {
                                                    setIsHistoryPanelOpen(true);
                                                } else {
                                                    setIsPartnerSearchExpanded(true);
                                                    setIsPartnerDropdownOpen(true);
                                                    setTimeout(() => partnerInputRef.current?.focus(), 50);
                                                }
                                            }}
                                            className={cn(
                                                "flex-1 min-h-[38px] relative overflow-hidden p-1.5 px-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] min-w-0 shadow-sm flex flex-col justify-between group/debt-card",
                                                (selectedPartner?.debt_balance || 0) > 0
                                                    ? "bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-transparent border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-rose-500/5"
                                                    : (selectedPartner?.debt_balance || 0) < 0
                                                        ? "bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/5"
                                                        : "bg-black/[0.03] dark:bg-white/[0.03] border-[#8b6f47]/20 dark:border-white/10 hover:border-[#8b6f47]/40"
                                            )}
                                            title={selectedPartner ? `Xem lịch sử nợ NCC ${selectedPartner.name}` : "Chưa chọn NCC"}
                                        >
                                            <div className="absolute -right-1.5 -bottom-2 opacity-[0.08] dark:opacity-[0.11] text-current pointer-events-none -rotate-6 transition-transform group-hover/debt-card:scale-110 select-none">
                                                <Wallet size={42} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex items-center justify-between w-full relative z-10 pt-0.5">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground leading-normal">
                                                    Dư nợ
                                                </span>
                                                {selectedPartner && (selectedPartner.debt_balance || 0) !== 0 && (
                                                    <m.span
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className={cn(
                                                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 transition-all leading-normal",
                                                            (selectedPartner.debt_balance || 0) > 0 
                                                                ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20" 
                                                                : "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                                                        )}
                                                    >
                                                        {(selectedPartner.debt_balance || 0) > 0 ? "Khách nợ" : "Mình nợ"}
                                                    </m.span>
                                                )}
                                            </div>
                                            <m.div
                                                key={Math.abs(selectedPartner?.debt_balance || 0)}
                                                initial={{ opacity: 0, y: -3 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className={cn(
                                                    "text-sm lg:text-base font-black tracking-tight tabular-nums truncate leading-tight mt-auto text-right pb-0.5 transition-colors duration-300 relative z-10",
                                                    (selectedPartner?.debt_balance || 0) > 0 
                                                        ? "text-rose-600 dark:text-rose-400" 
                                                        : (selectedPartner?.debt_balance || 0) < 0 
                                                            ? "text-emerald-600 dark:text-emerald-400" 
                                                            : "text-slate-400 dark:text-slate-500"
                                                )}
                                            >
                                                {formatNumber(Math.abs(selectedPartner?.debt_balance || 0))}<span className="text-[10px] font-normal ml-0.5">đ</span>
                                            </m.div>
                                        </div>

                                        {/* Sub-buttons: SỔ NỢ / GỬI KHO */}
                                        <div className="flex-1 min-h-[28px] max-h-9 flex items-stretch gap-1.5">
                                            <button
                                                onClick={() => selectedPartner ? setIsHistoryPanelOpen(true) : setToast({ message: 'Vui lòng chọn NCC trước', type: 'warning' })}
                                                className="relative overflow-hidden flex-1 h-full flex items-center justify-center rounded-xl border border-[#8b6f47]/20 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] text-[#8b6f47] dark:text-[#d4a574] text-[9px] font-black hover:bg-[#8b6f47]/15 dark:hover:bg-white/10 transition-all text-center tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98] group/sno"
                                                title="Lịch sử đơn nhập NCC"
                                            >
                                                <div className="absolute -right-1 -bottom-2 opacity-[0.09] dark:opacity-[0.13] text-current pointer-events-none -rotate-6 transition-transform group-hover/sno:scale-115 select-none">
                                                    <History size={30} strokeWidth={1.8} />
                                                </div>
                                                <span className="relative z-10">SỔ NỢ</span>
                                            </button>
                                            <button
                                                onClick={() => setIsConsignment(prev => !prev)}
                                                className={cn(
                                                    "relative overflow-hidden flex-1 h-full flex items-center justify-center rounded-xl text-[9px] font-black tracking-wider transition-all text-center shadow-sm hover:scale-[1.02] active:scale-[0.98] group/gk",
                                                    isConsignment
                                                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400 shadow-sm shadow-amber-500/20"
                                                        : "border border-[#8b6f47]/20 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] text-[#8b6f47] dark:text-[#d4a574] hover:bg-[#8b6f47]/15 dark:hover:bg-white/10"
                                                )}
                                                title={isConsignment ? "Đang chọn: Đơn hàng gửi kho (Bấm để tắt)" : "Chọn đơn hàng gửi kho (Bấm để bật)"}
                                            >
                                                <div className={cn(
                                                    "absolute -right-1 -bottom-2 pointer-events-none -rotate-6 transition-transform group-hover/gk:scale-115 select-none",
                                                    isConsignment ? "opacity-25 text-white" : "opacity-[0.09] dark:opacity-[0.13] text-current"
                                                )}>
                                                    <Warehouse size={30} strokeWidth={1.8} />
                                                </div>
                                                <span className="relative z-10">{isConsignment ? "GỬI KHO ✓" : "GỬI KHO"}</span>
                                            </button>
                                        </div>
                                    </m.div>

                                    {/* Col 2: Payment Method & Payment Input (3 cols) */}
                                    <m.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.05 }}
                                        className="md:col-span-3 flex flex-col justify-between gap-1.5 h-full"
                                    >
                                        <div className="flex-1 min-h-[30px] max-h-9 flex items-stretch w-full gap-1.5">
                                            <button
                                                onClick={() => { setPaymentMethod('Cash'); setAmountPaid(totalAmount); }}
                                                className={cn(
                                                    "relative overflow-hidden flex-1 h-full rounded-xl flex items-center justify-center text-[9px] font-black tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer group/cash",
                                                    paymentMethod === 'Cash' 
                                                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/30 border border-emerald-500/50" 
                                                        : "bg-black/[0.03] dark:bg-white/[0.03] text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/15 dark:hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute -right-1 -bottom-2 pointer-events-none -rotate-6 transition-transform group-hover/cash:scale-110 select-none",
                                                    paymentMethod === "Cash" ? "opacity-25 text-white" : "opacity-[0.09] dark:opacity-[0.13] text-current"
                                                )}>
                                                    <Banknote size={34} strokeWidth={1.8} />
                                                </div>
                                                <span className="relative z-10">TIỀN MẶT</span>
                                            </button>
                                            <button
                                                onClick={() => { setPaymentMethod('Debt'); setAmountPaid(0); }}
                                                className={cn(
                                                    "relative overflow-hidden flex-1 h-full rounded-xl flex items-center justify-center text-[9px] font-black tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer group/debt",
                                                    paymentMethod === 'Debt' 
                                                        ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-600/30 border border-rose-500/50" 
                                                        : "bg-black/[0.03] dark:bg-white/[0.03] text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/15 dark:hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute -right-1 -bottom-2 pointer-events-none -rotate-6 transition-transform group-hover/debt:scale-110 select-none",
                                                    paymentMethod === "Debt" ? "opacity-25 text-white" : "opacity-[0.09] dark:opacity-[0.13] text-current"
                                                )}>
                                                    <CreditCard size={34} strokeWidth={1.8} />
                                                </div>
                                                <span className="relative z-10">CÔNG NỢ</span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('Transfer')}
                                                className={cn(
                                                    "relative overflow-hidden flex-1 h-full rounded-xl flex items-center justify-center text-[9px] font-black tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer group/ck",
                                                    paymentMethod === 'Transfer' 
                                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30 border border-blue-500/50" 
                                                        : "bg-black/[0.03] dark:bg-white/[0.03] text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/20 dark:border-white/10 hover:bg-[#8b6f47]/15 dark:hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute -right-1 -bottom-2 pointer-events-none -rotate-6 transition-transform group-hover/ck:scale-110 select-none",
                                                    paymentMethod === "Transfer" ? "opacity-25 text-white" : "opacity-[0.09] dark:opacity-[0.13] text-current"
                                                )}>
                                                    <Sparkles size={34} strokeWidth={1.8} />
                                                </div>
                                                <span className="relative z-10">C/K</span>
                                            </button>
                                        </div>

                                        {paymentMethod === 'Transfer' ? (
                                            <CustomSelect
                                                className="flex-1 min-h-[32px] max-h-10 w-full p-1 bg-black/[0.02] dark:bg-white/[0.02] border border-[#8b6f47]/20 dark:border-white/10 rounded-xl font-bold text-xs outline-none text-foreground flex items-center shadow-sm"
                                                value={selectedBankAccountId}
                                                onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                                options={bankAccounts.map(acc => ({
                                                    value: acc.id,
                                                    label: `${acc.bank_name} - ${acc.account_number}`
                                                }))}
                                            />
                                        ) : (
                                            <div className="flex-1 min-h-[32px] max-h-10 relative flex items-center bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-[#8b6f47]/20 dark:border-white/10 shadow-sm focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/15 group/pay-input transition-all duration-300">
                                                <div className="absolute right-16 -bottom-3 opacity-[0.06] dark:opacity-[0.08] text-[#8b6f47] dark:text-[#d4a574] pointer-events-none -rotate-6 select-none overflow-hidden">
                                                    <ReceiptText size={42} strokeWidth={1.5} />
                                                </div>
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#8b6f47]/70 dark:text-[#d4a574]/70 uppercase tracking-widest pointer-events-none z-10">
                                                    Thanh toán:
                                                </span>
                                                <input
                                                    type="text"
                                                    readOnly={paymentMethod === 'Cash'}
                                                    className={cn(
                                                        "w-full h-full pl-22 pr-3 text-right font-black text-base md:text-lg outline-none bg-transparent tabular-nums flex items-center transition-colors duration-300 relative z-10",
                                                        paymentMethod === 'Cash' ? "text-[#2d5016]/70 dark:text-emerald-400/70 cursor-not-allowed" : "text-[#2d5016] dark:text-emerald-400"
                                                    )}
                                                    value={formatNumber(amountPaid)}
                                                    onChange={(e) => setAmountPaid(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                                                />
                                                {paymentMethod !== 'Cash' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAmountPaid(totalAmount + (oldDebt < 0 ? Math.abs(oldDebt) : 0))}
                                                        className="absolute right-2 -top-2.5 opacity-0 group-hover/pay-input:opacity-100 focus-within:opacity-100 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 text-[8.5px] font-black uppercase rounded-full border border-white/40 dark:border-emerald-400 shadow-md transition-all duration-200 active:scale-95 z-30 cursor-pointer"
                                                        title="Thanh toán toàn bộ đơn nhập và nợ cũ"
                                                    >
                                                        Trả hết
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </m.div>

                                    {/* Col 3: Debt status (Timeline Flow: Trước đơn ➔ Sau đơn) (3 cols) */}
                                    <m.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        className="md:col-span-3 h-full p-2 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-[#8b6f47]/20 dark:border-white/10 flex flex-col justify-between shadow-sm hover:border-[#8b6f47]/40 transition-all duration-300 relative overflow-hidden group/debt-change"
                                    >
                                        <div className="absolute -right-2 -bottom-2 opacity-[0.06] dark:opacity-[0.09] text-current pointer-events-none -rotate-6 transition-transform group-hover/debt-change:scale-105 select-none">
                                            <ArrowLeftRight size={48} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex items-center justify-between relative z-10 pt-0.5">
                                            <span className="text-[9px] font-black text-[#8b6f47]/80 dark:text-[#d4a574]/80 uppercase tracking-wider leading-normal">
                                                Biến động nợ
                                            </span>
                                            <m.span
                                                key={remainingDebt < oldDebt ? "up" : remainingDebt > oldDebt ? "down" : "same"}
                                                initial={{ opacity: 0, scale: 0.85 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={cn(
                                                    "text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-full transition-all duration-300 leading-normal",
                                                    remainingDebt < oldDebt 
                                                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" 
                                                        : remainingDebt > oldDebt 
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                                                            : "bg-black/[0.05] dark:bg-white/[0.05] text-slate-500"
                                                )}
                                            >
                                                {remainingDebt < oldDebt ? "+ Tăng nợ" : remainingDebt > oldDebt ? "- Giảm nợ" : "Không đổi"}
                                            </m.span>
                                        </div>

                                        <div className="flex items-center justify-between gap-1.5 mt-auto relative z-10">
                                            {/* Trước đơn */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 leading-normal mb-0.5">
                                                    <span className="text-[8.5px] font-bold text-muted-foreground uppercase leading-normal">Trước</span>
                                                    {oldDebt !== 0 ? (
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border leading-normal shrink-0",
                                                            oldDebt > 0 ? "text-rose-600 bg-rose-500/10 border-rose-500/25 dark:text-rose-400" : "text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400"
                                                        )}>
                                                            {oldDebt > 0 ? "Khách nợ" : "Mình nợ"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase shrink-0 leading-normal">Hết nợ</span>
                                                    )}
                                                </div>
                                                <m.div
                                                    key={Math.abs(oldDebt)}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.25 }}
                                                    className={cn("text-xs lg:text-sm font-black tracking-tight tabular-nums truncate leading-tight transition-colors duration-300", oldDebt > 0 ? "text-rose-500 dark:text-rose-400" : oldDebt < 0 ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400")}
                                                >
                                                    {formatNumber(Math.abs(oldDebt))}<span className="text-[9px] font-normal ml-0.5">đ</span>
                                                </m.div>
                                            </div>

                                            {/* Center Flow Arrow */}
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground shrink-0">
                                                <ArrowRight size={11} strokeWidth={2.5} />
                                            </div>

                                            {/* Sau đơn */}
                                            <div className="flex-1 min-w-0 text-right">
                                                <div className="flex items-center justify-end gap-1 leading-normal mb-0.5">
                                                    {remainingDebt !== 0 ? (
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border leading-normal shrink-0",
                                                            remainingDebt > 0 ? "text-rose-600 bg-rose-500/10 border-rose-500/25 dark:text-rose-400" : "text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400"
                                                        )}>
                                                            {remainingDebt > 0 ? "Khách nợ" : "Mình nợ"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 leading-normal shrink-0">Hết nợ</span>
                                                    )}
                                                    <span className="text-[8.5px] font-bold text-muted-foreground uppercase leading-normal">Sau đơn</span>
                                                </div>
                                                <m.div
                                                    key={Math.abs(remainingDebt)}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.25 }}
                                                    className={cn("text-sm lg:text-base font-black tracking-tight tabular-nums truncate leading-tight transition-colors duration-300", remainingDebt > 0 ? "text-rose-600 dark:text-rose-400" : remainingDebt < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}
                                                >
                                                    {formatNumber(Math.abs(remainingDebt))}<span className="text-[9px] font-normal ml-0.5">đ</span>
                                                </m.div>
                                            </div>
                                        </div>
                                    </m.div>

                                    {/* Col 4: Total & Action Buttons (4 cols) */}
                                    <m.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.15 }}
                                        className="md:col-span-4 flex items-stretch gap-2 h-full"
                                    >
                                        <div className="flex-1 h-full p-2 px-3.5 rounded-xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white flex flex-col justify-between relative overflow-hidden select-none active:scale-[0.98] transition-all cursor-pointer min-h-0 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] group/total-main">
                                            {/* Subtle glass reflection overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                                            <div className="absolute -right-3 -bottom-4 text-white/15 pointer-events-none -rotate-12 transition-transform group-hover/total-main:scale-110 group-hover/total-main:-rotate-6 select-none">
                                                <ShoppingBag size={76} strokeWidth={1.2} />
                                            </div>
                                            <div className="flex items-center justify-between relative z-10">
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-200">
                                                    TỔNG CỘNG ĐƠN HÀNG
                                                </span>
                                                <m.span
                                                    key={cart.length}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-white/15 text-emerald-100 backdrop-blur-sm"
                                                >
                                                    {cart.length} món
                                                </m.span>
                                            </div>
                                            <m.div
                                                key={totalAmount}
                                                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                                className="text-2xl md:text-3xl font-black tracking-tight truncate leading-tight tabular-nums mt-auto relative z-10"
                                            >
                                                {formatNumber(totalAmount)}
                                                <span className="text-xs font-normal ml-0.5 opacity-90">đ</span>
                                            </m.div>
                                        </div>

                                        <div className="flex flex-col justify-between gap-1.5 shrink-0 min-w-[140px] h-full">
                                            <div className="flex-1 min-h-[32px] max-h-11 flex items-stretch gap-1.5 justify-between">
                                                <m.button
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={cart.length === 0}
                                                    onClick={handleHold}
                                                    className="relative overflow-hidden flex-1 h-full bg-black/[0.04] dark:bg-white/[0.04] text-[#8b6f47] dark:text-[#d4a574] rounded-xl flex items-center justify-center border border-[#8b6f47]/25 dark:border-white/10 hover:bg-[#8b6f47]/15 transition-all shadow-sm group/btn-pause"
                                                    title="Tạm đơn [F4]"
                                                >
                                                    <div className="absolute -right-1 -bottom-2 opacity-[0.08] dark:opacity-[0.12] text-current pointer-events-none -rotate-6 transition-transform group-hover/btn-pause:scale-115 select-none">
                                                        <Pause size={28} strokeWidth={1.8} />
                                                    </div>
                                                    <Pause size={16} strokeWidth={2.5} className="relative z-10" />
                                                </m.button>
                                                <m.button
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={cart.length === 0 || loading}
                                                    onClick={() => handleSave(false)}
                                                    className="relative overflow-hidden flex-1 h-full bg-black/[0.04] dark:bg-white/[0.04] text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center border border-emerald-600/25 dark:border-emerald-400/25 hover:bg-emerald-500/15 transition-all shadow-sm group/btn-save"
                                                    title="Lưu đơn [Ctrl+S]"
                                                >
                                                    <div className="absolute -right-1 -bottom-2 opacity-[0.08] dark:opacity-[0.12] text-current pointer-events-none -rotate-6 transition-transform group-hover/btn-save:scale-115 select-none">
                                                        <Save size={28} strokeWidth={1.8} />
                                                    </div>
                                                    {loading ? <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin relative z-10" /> : <Save size={16} strokeWidth={2.5} className="relative z-10" />}
                                                </m.button>
                                                <m.button
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={cart.length === 0 || loading}
                                                    onClick={() => handleSave(true)}
                                                    className="relative overflow-hidden flex-1 h-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 border border-emerald-400/40 hover:scale-[1.02] active:scale-95 transition-all group/btn-print"
                                                    title="Lưu và In hóa đơn [F9]"
                                                >
                                                    <div className="absolute -right-1 -bottom-2 text-white/15 pointer-events-none -rotate-6 transition-transform group-hover/btn-print:scale-115 select-none">
                                                        <Printer size={28} strokeWidth={1.8} />
                                                    </div>
                                                    {loading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" /> : <Printer size={17} strokeWidth={2.5} className="relative z-10" />}
                                                </m.button>
                                            </div>

                                            {/* History navigation buttons below action row */}
                                            <div className="flex-1 min-h-[26px] max-h-8 flex items-stretch gap-1.5 w-full">
                                                <m.button
                                                    onClick={() => navigateHistory('prev')}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex-1 h-full rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-400/25 flex items-center justify-center shadow-xs hover:shadow transition-all cursor-pointer"
                                                    title="Xem đơn trước"
                                                >
                                                    <ChevronLeft size={18} strokeWidth={2.8} />
                                                </m.button>
                                                <m.button
                                                    onClick={() => navigateHistory('next')}
                                                    disabled={historyStep === 0}
                                                    whileHover={historyStep === 0 ? {} : { scale: 1.03 }}
                                                    whileTap={historyStep === 0 ? {} : { scale: 0.95 }}
                                                    className={cn(
                                                        "flex-1 h-full rounded-xl border flex items-center justify-center shadow-xs transition-all",
                                                        historyStep === 0
                                                            ? "bg-black/[0.03] dark:bg-white/[0.03] text-emerald-700/30 dark:text-emerald-400/30 border-black/5 dark:border-white/5 cursor-not-allowed"
                                                            : "bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-400/25 hover:shadow cursor-pointer"
                                                    )}
                                                    title="Xem đơn kế tiếp"
                                                >
                                                    <ChevronRight size={18} strokeWidth={2.8} />
                                                </m.button>
                                            </div>
                                        </div>
                                    </m.div>
                                </div>
                            </div>
                        )}
                    </m.div>

                    {/* Right: Summary & Actions Sidebar */}
                    {summaryLayoutMode === 'sidebar' && (
                        <m.div
                            layout
                            initial={false}
                            animate={{ width: isSidebarExpanded ? "22%" : "90px" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="flex flex-col bg-transparent pr-1 min-h-0 relative shrink-0"
                        >
                            <div className="p-1 transition-colors relative flex-1 flex flex-col min-h-0">

                                <AnimatePresence mode="popLayout">
                                    {!isSidebarExpanded ? (
                                        <m.div
                                            key="mini-sidebar"
                                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 1 }}
                                            className="flex flex-col items-center py-4 gap-8 h-full relative z-10"
                                        >
                                            {/* Partner Status Mini */}
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg relative",
                                                selectedPartner ? "bg-[#8b6f47] text-white border-white/20" : "bg-white/50 dark:bg-slate-800/50 text-muted border-white/50"
                                            )}>
                                                <Sprout size={24} />
                                                {selectedPartner && (
                                                    <div className="absolute -top-2 -right-3 bg-gradient-to-tr from-[#2d5016] to-[#4a7c59] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-2 border-white dark:border-slate-800 ring-2 ring-[#2d5016]/20 transition-transform group-hover:scale-110">
                                                        #{selectedPartner.id}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Toggle Button */}
                                            <div className="flex-1 flex items-center justify-center">
                                                <m.button
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setIsSidebarExpanded(true)}
                                                    className="w-16 h-16 bg-transparent hover:bg-primary/10 text-primary dark:text-emerald-400 border border-border rounded-full flex items-center justify-center transition-all group/toggle"
                                                >
                                                    <ChevronLeft size={32} strokeWidth={3} className="group-hover/toggle:-translate-x-1 transition-transform" />
                                                </m.button>
                                            </div>

                                            {/* Actions Mini */}
                                            <div className="flex flex-col gap-3 pb-4">
                                                <m.button
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={handleHold}
                                                    disabled={cart.length === 0}
                                                    className="w-14 h-14 pos-card text-emerald-700/80 dark:text-emerald-400/80 rounded-2xl flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30 hover:bg-emerald-500/10 transition-all shadow-none hover:shadow-none"
                                                    title="Tạm đơn"
                                                >
                                                    <Pause size={24} />
                                                </m.button>
                                                <m.button
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleSave(false)}
                                                    disabled={cart.length === 0 || loading}
                                                    className="w-14 h-14 pos-card text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30 hover:bg-emerald-500/10 transition-all shadow-none hover:shadow-none"
                                                    title="Chỉ lưu"
                                                >
                                                    {loading ? <div className="w-5 h-5 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Save size={24} />}
                                                </m.button>
                                                <m.button
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleSave(true)}
                                                    disabled={cart.length === 0 || loading}
                                                    className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 border border-white/20 transition-all"
                                                    title="Lưu và In"
                                                >
                                                    {loading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <Printer size={28} />}
                                                </m.button>
                                            </div>
                                        </m.div>
                                    ) : (
                                        <m.div
                                            key="expanded-sidebar"
                                            initial={{ opacity: 0, x: 20, scale: 0.98 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.98 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 1 }}
                                            className="h-full flex flex-col relative"
                                        >
                                            {/* Toggle Button Inside */}
                                            <m.button
                                                whileHover={{ scale: 1.15, x: 1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setIsSidebarExpanded(false)}
                                                className="absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-transparent hover:bg-primary/10 text-primary dark:text-emerald-400 border border-border rounded-full flex items-center justify-center z-[130] transition-all shadow-none hover:shadow-none"
                                            >
                                                <ChevronRight size={18} strokeWidth={4} />
                                            </m.button>

                                            <div className="flex flex-col gap-3 relative z-10 flex-1 overflow-y-auto -mr-2 pr-2 pb-2">
                                                {/* Supplier Info */}
                                                <div className="space-y-3">
                                                    <div
                                                        onClick={() => {
                                                            if (selectedPartner) {
                                                                setEditingPartner(selectedPartner);
                                                                setIsPartnerEditModalOpen(true);
                                                            } else {
                                                                partnerInputRef.current?.focus();
                                                            }
                                                        }}
                                                        className="flex items-start group/partner-bubble cursor-pointer hover:scale-[1.02] transition-all duration-500 p-4 px-6 rounded-[2.5rem] border border-border/50 bg-card/40 dark:bg-slate-900/40 backdrop-blur-xl hover:bg-card/60 hover:border-primary/30 relative overflow-hidden shadow-lg"
                                                    >
                                                        <Sprout className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/5 -rotate-12 transition-transform group-hover/partner-bubble:scale-110 group-hover/partner-bubble:-rotate-6 pointer-events-none" />
                                                        <div className="flex flex-col max-w-[300px] relative z-10">
                                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                                                                Nhà cung cấp
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {selectedPartner && (
                                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black tracking-wider shrink-0 mt-0.5">
                                                                        ID: {selectedPartner.id}
                                                                    </span>
                                                                )}
                                                                <div className="text-lg font-black text-foreground uppercase leading-relaxed py-1 tracking-tight truncate">
                                                                    {selectedPartner ? selectedPartner.name : "Nhà cung cấp lẻ"}
                                                                </div>
                                                            </div>
                                                            {selectedPartner && (
                                                                <div className="flex flex-col gap-1 mt-1.5">
                                                                    {(selectedPartner.phone || selectedPartner.address) && (
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 truncate bg-white/50 dark:bg-slate-900/40 px-2 py-1 rounded-xl w-fit max-w-full">
                                                                            <Phone size={11} strokeWidth={3} className="shrink-0 text-[#8b6f47] dark:text-[#d4a574]" />
                                                                            <span className="truncate">{selectedPartner.phone || "N/A"}</span>
                                                                            {selectedPartner.address && (
                                                                                <>
                                                                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                                                    <MapPin size={11} strokeWidth={3} className="shrink-0 text-emerald-500" />
                                                                                    <span className="truncate">{selectedPartner.address}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {remainingDebt !== 0 && (
                                                                        <div className={cn(
                                                                            "flex items-start gap-1.5 text-xs font-bold mt-1 bg-transparent px-3 py-2 w-full"
                                                                        )}>
                                                                            <Wallet size={12} strokeWidth={2.5} className="shrink-0 text-primary/70 mt-0.5" />
                                                                            <span className="text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap mt-0.5">
                                                                                Dư nợ:
                                                                            </span>
                                                                            {(() => {
                                                                                const changeVal = remainingDebt - oldDebt;
                                                                                if (changeVal === 0) {
                                                                                    return (
                                                                                        <span className={cn("font-black text-xs ml-1", oldDebt > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                                                                                            {formatNumber(Math.abs(oldDebt))}{oldDebt < 0 ? " (Mình nợ)" : oldDebt > 0 ? " (Họ nợ)" : ""}
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                return (
                                                                                    <span className="font-black text-xs ml-1 flex flex-col items-start gap-1">
                                                                                        <span className={oldDebt > 0 ? "text-rose-500/80" : oldDebt < 0 ? "text-emerald-500/80" : "text-foreground/80"}>
                                                                                            {formatNumber(Math.abs(oldDebt))}{oldDebt < 0 ? " (Mình nợ)" : oldDebt > 0 ? " (Họ nợ)" : ""}
                                                                                        </span>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className="text-muted-foreground text-[10px]">➔</span>
                                                                                            <span className={remainingDebt > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                                                                                                {formatNumber(Math.abs(remainingDebt))}{remainingDebt < 0 ? " (Mình nợ)" : remainingDebt > 0 ? " (Họ nợ)" : ""}
                                                                                            </span>
                                                                                        </div>
                                                                                    </span>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Note */}
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-3 text-primary/40 dark:text-[#d4a574]/40 z-10"><Leaf size={16} /></div>
                                                        <textarea placeholder="Ghi chú đơn nhập..." className="w-full pl-9 p-3 bg-transparent border border-border rounded-[1.5rem] focus:border-primary/50 dark:focus:border-[#4a7c59] outline-none transition-all resize-none h-16 text-xs italic dark:text-gray-350" value={note} onChange={(e) => setNote(e.target.value)} />
                                                    </div>
                                                </div>

                                                {/* Calculations */}
                                                <div className="flex-1 space-y-3 pt-1">
                                                    <div className={cn(
                                                        "p-4 px-5 rounded-[1.5rem] bg-primary dark:bg-primary shadow-lg relative overflow-hidden group/total-main cursor-default hover:brightness-110 transition-all",
                                                        totalAmount > 0 ? "shadow-primary/20" : "opacity-90"
                                                    )}>
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                                        <div className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-1 text-center relative z-10">Tổng cộng đơn hàng</div>
                                                        <div className="font-black text-3xl text-center text-white whitespace-nowrap overflow-hidden relative z-10">
                                                            {formatNumber(totalAmount)}
                                                            <span className="text-sm opacity-50 font-bold ml-1">đ</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 px-1">
                                                        <div className="flex justify-between items-center pos-card p-3 rounded-[1.2rem] transition-all">
                                                            <span className="text-[10px] font-black text-muted/60 dark:text-[#d4a574]/40 uppercase tracking-widest">Nợ trước đơn:</span>
                                                            <span className="font-black text-sm text-red-500 dark:text-red-400/80">{formatNumber(oldDebt)}</span>
                                                        </div>
                                                        {selectedPartner && (
                                                            <div className="flex justify-between items-center pos-card p-3 rounded-[1.2rem] transition-all">
                                                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Nợ hiện tại:</span>
                                                                <span className="font-black text-sm text-amber-600 dark:text-amber-400">{formatNumber(selectedPartner.debt_balance || 0)}</span>
                                                            </div>
                                                        )}

                                                        {/* Consignment Order Toggle */}
                                                        <div className="flex justify-between items-center pos-card p-3 rounded-[1.2rem] border-amber-500/20 transition-all">
                                                            <div className="flex items-center gap-2">
                                                                <Warehouse size={16} className="text-amber-600 dark:text-amber-500" />
                                                                <span className="text-[10px] font-black text-muted/60 dark:text-[#d4a574]/40 uppercase tracking-widest">Đơn hàng gửi kho:</span>
                                                            </div>
                                                            <label 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setIsConsignment(!isConsignment);
                                                                }}
                                                                className="relative inline-flex items-center cursor-pointer"
                                                            >
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isConsignment} 
                                                                    readOnly
                                                                    className="sr-only" 
                                                                />
                                                                <div className={cn(
                                                                    "w-9 h-5 rounded-full transition-all relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all",
                                                                    isConsignment 
                                                                        ? "bg-amber-600 after:translate-x-4" 
                                                                        : "bg-gray-200 dark:bg-gray-700"
                                                                )}></div>
                                                            </label>
                                                        </div>

                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex pos-card p-1.5 rounded-[1.2rem] gap-1">
                                                                <button
                                                                    onClick={() => setPaymentMethod('Cash')}
                                                                    className={cn(
                                                                        "flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all",
                                                                        paymentMethod === 'Cash' ? "bg-gradient-to-br from-[#2d5016] to-[#4a7c59] text-white shadow-md" : "text-primary/60 hover:text-primary dark:text-[#d4a574]/60"
                                                                    )}
                                                                >
                                                                    TIỀN MẶT
                                                                </button>
                                                                <button
                                                                    onClick={() => { setPaymentMethod('Debt'); setAmountPaid(0); }}
                                                                    className={cn(
                                                                        "flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all",
                                                                        paymentMethod === 'Debt' ? "bg-gradient-to-br from-[#8b6f47] to-[#d4a574] text-white shadow-md" : "text-muted/60 hover:text-muted dark:text-[#d4a574]/60"
                                                                    )}
                                                                >
                                                                    CÔNG NỢ
                                                                </button>
                                                                <button
                                                                    onClick={() => { setPaymentMethod('Transfer'); }}
                                                                    className={cn(
                                                                        "flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all",
                                                                        paymentMethod === 'Transfer' ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md" : "text-blue-600/60 hover:text-blue-600 dark:text-[#d4a574]/60"
                                                                    )}
                                                                >
                                                                    CHUYỂN KHOẢN
                                                                </button>
                                                            </div>
                                                            {paymentMethod === 'Transfer' && (
                                                                <div className="relative overflow-hidden flex items-center justify-between p-2.5 pl-4 pos-card border-blue-200 dark:border-blue-900/30 rounded-[1.2rem]">
                                                                    <div className="text-[9px] font-black text-blue-400 uppercase whitespace-nowrap">
                                                                        TK Chuyển:
                                                                    </div>
                                                                    <CustomSelect
                                                                        className="w-full min-w-0 border-none shadow-none text-right justify-end font-bold text-xs bg-transparent dark:text-white outline-none"
                                                                        value={selectedBankAccountId}
                                                                        onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                                                        options={bankAccounts.map(acc => ({
                                                                            value: acc.id,
                                                                            label: `${acc.bank_name} - ${acc.account_number}`
                                                                        }))}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted/40 uppercase z-10">Thanh toán:</div>
                                                                <input
                                                                    type="text"
                                                                    readOnly={paymentMethod === 'Cash'}
                                                                    className={cn(
                                                                        "w-full p-2.5 pl-24 text-right rounded-[1.2rem] font-black text-xl outline-none pos-card transition-all",
                                                                        (paymentMethod === 'Cash')
                                                                            ? "text-primary/40 cursor-not-allowed"
                                                                            : "text-primary dark:text-[#d4a574] focus:ring-2 focus:ring-primary/20"
                                                                    )}
                                                                    value={formatNumber(amountPaid)}
                                                                    autoComplete="off"
                                                                    onChange={(e) => setAmountPaid(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remaining Balance */}
                                                <div className="bg-gradient-to-br from-primary to-primary-hover text-white p-5 rounded-[1.5rem] flex items-center justify-between shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-white/10 relative z-20">
                                                    <div className="min-w-0">
                                                        <span className="text-[10px] font-black uppercase opacity-70 tracking-[0.1em] block mb-1">Nợ NCC sau đơn:</span>
                                                        <span className="text-3xl font-black tracking-tighter block leading-none">{formatNumber(remainingDebt)}</span>
                                                    </div>
                                                    <Coins className="text-white/20 shrink-0 ml-2" size={32} />
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-2 pt-2">
                                                    <div className="flex gap-2">
                                                        <m.button
                                                            whileTap={{ scale: 0.95 }}
                                                            disabled={cart.length === 0}
                                                            onClick={handleHold}
                                                            className="flex-1 pos-card text-emerald-700/80 dark:text-emerald-400/80 rounded-2xl font-black hover:bg-emerald-500/10 hover:scale-[1.02] transition-all duration-300 ease-in-out flex items-center justify-center gap-2 py-3 text-lg uppercase tracking-widest whitespace-nowrap"
                                                        >
                                                            <Pause size={20} className="shrink-0" />
                                                            <span className="text-lg uppercase tracking-widest font-black">TẠM</span>
                                                        </m.button>
                                                        <m.button
                                                            whileTap={{ scale: 0.95 }}
                                                            disabled={cart.length === 0 || loading}
                                                            onClick={() => handleSave(false)}
                                                            className="flex-1 pos-card text-emerald-600 dark:text-emerald-400 rounded-2xl font-black border border-emerald-500/20 dark:border-emerald-500/30 hover:bg-emerald-500/10 hover:scale-[1.02] transition-all duration-300 ease-in-out flex items-center justify-center gap-2 py-3 text-lg uppercase tracking-widest whitespace-nowrap"
                                                        >
                                                            <Save size={20} className="shrink-0" />
                                                            <span className="text-lg uppercase tracking-widest font-black">LƯU</span>
                                                        </m.button>
                                                    </div>
                                                    <m.button
                                                        whileTap={{ scale: 0.98 }}
                                                        disabled={cart.length === 0 || loading}
                                                        onClick={() => handleSave(true)}
                                                        className="w-full bg-gradient-to-r from-primary to-primary-hover text-white rounded-2xl flex items-center justify-center border border-white/20 transition-all p-4 h-16 relative z-20"
                                                    >
                                                        {loading ? (
                                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <Printer size={28} className="shrink-0" />
                                                                <span className="text-3xl tracking-widest uppercase font-black">IN</span>
                                                            </div>
                                                        )}
                                                    </m.button>
                                                </div>
                                            </div>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </m.div>
                    )}
                </div>


                {/* Held Purchases Sidebar */}
                <AnimatePresence>
                    {isHeldSidebarOpen && (
                        <Portal>
                            <div className="fixed inset-0 z-[3000] flex justify-end font-sans">
                                <m.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setIsHeldSidebarOpen(false)}
                                />
                                <m.div
                                    initial={{ x: '100%', opacity: 0.5 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: '100%', opacity: 0.5 }}
                                    transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                                    className="relative w-[360px] md:w-[440px] bg-[#f8f4e8] dark:bg-[#1a1714] border-l border-[#8b6f47]/30 dark:border-white/10 shadow-2xl h-full flex flex-col p-6 z-10"
                                >
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#8b6f47]/20">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-[#8b6f47]/15 text-[#8b6f47] dark:text-[#d4a574] rounded-2xl border border-[#8b6f47]/30">
                                                <Pause size={22} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                                                    Đơn nhập tạm
                                                </h2>
                                                <p className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.2em] mt-0.5">
                                                    Đang chờ ({heldPurchases.length})
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsHeldSidebarOpen(false)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-muted transition-colors"
                                        >
                                            <X size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-auto space-y-4 pr-1 custom-scrollbar">
                                        {heldPurchases.length === 0 ? (
                                            <div className="text-center py-32 text-muted/40">
                                                <div className="relative inline-block mb-4">
                                                    <Pause size={64} className="opacity-20 mx-auto" />
                                                </div>
                                                <p className="font-black uppercase text-xs tracking-widest">Trống trải...</p>
                                            </div>
                                        ) : (
                                            <AnimatePresence mode="popLayout">
                                                {heldPurchases.map((held, idx) => (
                                                    <m.div
                                                        key={held.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                                        transition={{
                                                            delay: idx * 0.05,
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 30
                                                        }}
                                                        className="bg-white/90 dark:bg-[#25201b] border border-[#8b6f47]/25 dark:border-white/10 rounded-3xl p-4 hover:border-[#8b6f47]/50 transition-all group shadow-sm hover:shadow-lg"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex-1 min-w-0 pr-2">
                                                                <div className="font-black text-foreground uppercase text-sm leading-tight group-hover:text-[#8b6f47] dark:group-hover:text-[#d4a574] transition-colors truncate">
                                                                    {held.partner ? held.partner.name : "NCC VÃNG LAI"}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <div className="text-[10px] font-black text-muted bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase tabular-nums">
                                                                        🕒 {held.time}
                                                                    </div>
                                                                    <div className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] bg-[#8b6f47]/10 px-2 py-0.5 rounded-full uppercase">
                                                                        {held.cart.length} món
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveHeld(held.id)}
                                                                className="text-muted/60 hover:text-rose-500 transition-colors p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl shrink-0"
                                                                title="Xóa đơn tạm"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-[#8b6f47]/10 dark:bg-[#8b6f47]/20 p-3 rounded-2xl border border-[#8b6f47]/20">
                                                            <div>
                                                                <div className="text-[9px] font-black text-muted uppercase leading-none mb-1">Tổng cộng</div>
                                                                <div className="text-[#8b6f47] dark:text-[#d4a574] font-black text-lg tracking-tight">
                                                                    {formatNumber(held.total)} đ
                                                                </div>
                                                            </div>
                                                            <m.button
                                                                whileHover={{ scale: 1.04 }}
                                                                whileTap={{ scale: 0.96 }}
                                                                onClick={() => handleRestore(held)}
                                                                className="bg-[#8b6f47] hover:bg-[#725938] text-white px-4 py-2 rounded-xl font-black text-[11px] uppercase flex items-center gap-1.5 shadow-md transition-all"
                                                            >
                                                                <RotateCcw size={13} strokeWidth={3} />
                                                                THU HỒI
                                                            </m.button>
                                                        </div>
                                                    </m.div>
                                                ))}
                                            </AnimatePresence>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-[#8b6f47]/20">
                                        <button
                                            onClick={() => setIsHeldSidebarOpen(false)}
                                            className="w-full py-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-[#8b6f47]/30 dark:border-white/10 text-foreground font-black uppercase text-xs transition-all tracking-widest shadow-sm"
                                        >
                                            Đóng sidebar
                                        </button>
                                    </div>
                                </m.div>
                            </div>
                        </Portal>
                    )}
                </AnimatePresence>

                {/* Modals & Components */}
                {/* Quick Add Modals */}
                <PartnerEditModal
                    isOpen={showQuickAddPartner}
                    partner={{ name: quickAddName, is_customer: false, is_supplier: true }}
                    onClose={() => setShowQuickAddPartner(false)}
                    onSave={(newPartner) => {
                        fetchPartners();
                        setShowQuickAddPartner(false);
                        if (newPartner) {
                            setSelectedPartner(newPartner);
                            setPartnerSearch('');
                            setTimeout(() => searchInputRef.current?.focus(), 100);
                        }
                    }}
                />

                <ProductEditModal
                    isOpen={showQuickAddProduct}
                    product={{ name: quickAddName }}
                    onClose={() => setShowQuickAddProduct(false)}
                    onSave={() => {
                        fetchProducts();
                        setShowQuickAddProduct(false);
                    }}
                />

                <AnimatePresence>
                    {isScanModalOpen && (
                        <Portal>
                            <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                                <m.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0"
                                    onClick={() => {
                                        setIsScanModalOpen(false);
                                        setScannedImages([]);
                                    }}
                                />
                                <m.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col relative z-10 overflow-hidden max-h-[90vh]"
                                >
                                    {/* Modal Header */}
                                    <m.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 shrink-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                                <Bot size={20} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h3 className="text-base font-black text-foreground uppercase tracking-tight leading-relaxed py-0.5 truncate">
                                                    Quét Hóa Đơn Bằng AI
                                                </h3>
                                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5">Tự động nhận dạng & thêm vào giỏ bằng Gemini</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setIsScanModalOpen(false);
                                                setScannedImages([]);
                                            }}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-muted-foreground transition-colors"
                                        >
                                            <X size={16} strokeWidth={2.5} />
                                        </button>
                                    </m.div>

                                    {/* Modal Content */}
                                    <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                                        {/* API Key Configuration if missing */}
                                        {!settings.gemini_api_key && (
                                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl space-y-2">
                                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase">
                                                    <AlertTriangle size={16} /> Cần cấu hình API Key
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    Vui lòng nhập <strong>Gemini API Key</strong> của bạn để tiếp tục.
                                                </p>
                                                <input
                                                    type="password"
                                                    value={scanApiKey}
                                                    onChange={(e) => setScanApiKey(e.target.value)}
                                                    placeholder="Nhập Gemini API Key..."
                                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-emerald-500 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500/35 transition-all"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-4 flex flex-col">
                                            <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 rounded-[2rem] p-6 bg-slate-50/50 dark:bg-slate-800/20 min-h-[260px] relative overflow-hidden group transition-all duration-300">
                                                {scannedImages.length > 0 ? (
                                                    <div className="w-full h-full flex flex-col space-y-4">
                                                        <div className="grid grid-cols-3 gap-3 max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
                                                            {scannedImages.map((img, index) => (
                                                                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 group/thumb shadow-sm">
                                                                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setScannedImages(prev => prev.filter((_, i) => i !== index))}
                                                                        className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all shadow opacity-0 group-hover/thumb:opacity-100 duration-200"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-center gap-3">
                                                            <label 
                                                                htmlFor="scan-image-upload"
                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95"
                                                            >
                                                                <Plus size={14} strokeWidth={3} /> Thêm ảnh
                                                            </label>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setScannedImages([])}
                                                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all uppercase tracking-wider shadow-sm active:scale-95"
                                                            >
                                                                Xóa tất cả
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label 
                                                        htmlFor="scan-image-upload"
                                                        className="flex flex-col items-center justify-center cursor-pointer space-y-4 w-full h-full py-8"
                                                    >
                                                        <div className="p-5 bg-emerald-500/10 text-emerald-600 rounded-full group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                                                            <Camera size={36} />
                                                        </div>
                                                        <div className="text-center space-y-1.5">
                                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">Chụp hoặc tải ảnh hóa đơn lên</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hỗ trợ chọn nhiều ảnh PNG, JPG, WEBP</p>
                                                        </div>
                                                    </label>
                                                )}
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    multiple
                                                    capture="environment" 
                                                    onChange={handleImageSelect} 
                                                    className="hidden" 
                                                    id="scan-image-upload" 
                                                />
                                            </div>

                                            {scannedImages.length > 0 && (
                                                <m.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleScanInvoice}
                                                    disabled={isScanning || (!settings.gemini_api_key && !scanApiKey)}
                                                    className="w-full p-4 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:brightness-110 disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all"
                                                >
                                                    {isScanning ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin text-white" />
                                                            Đang phân tích hóa đơn bằng AI...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={16} className="text-white" />
                                                            Bắt đầu phân tích hóa đơn (AI)
                                                        </>
                                                    )}
                                                </m.button>
                                            )}
                                        </div>
                                    </div>
                                </m.div>
                            </div>
                        </Portal>
                    )}
                </AnimatePresence>

                <ProductEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    product={editingProduct}
                    onSave={fetchProducts}
                />

                <PartnerEditModal
                    isOpen={isPartnerEditModalOpen}
                    partner={editingPartner}
                    onClose={() => setIsPartnerEditModalOpen(false)}
                    onSave={async (updatedPartner) => {
                        await fetchPartners();
                        if (updatedPartner) {
                            setSelectedPartner(updatedPartner);
                            setPartnerSearch('');
                            setTimeout(() => searchInputRef.current?.focus(), 100);
                        }
                    }}
                />


                {/* Print Preview Studio (POS Style) */}
                <AnimatePresence>
                    {showPreview && previewData && (
                        <Portal>
                            <div className="fixed inset-0 z-[1000] flex bg-[radial-gradient(circle_at_25%_center,_#1e293b_0%,_#020617_100%)] animate-in fade-in duration-700 font-sans overflow-hidden">
                                {/* Background ambient glow */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden" />
                                </div>

                                {/* Left Sidebar Settings Panel */}
                                <m.div
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -100, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                    className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-50 relative"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-8 border-b border-white/10">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                                            Thiết lập in
                                        </h3>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                                            Tùy chỉnh nội dung hiển thị
                                        </p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                        <div className="space-y-4">
                                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-3 gap-1">
                                                <button
                                                    className="flex-1 py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                                >
                                                    📄 Phiếu nhập hàng
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <label className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.2em]">
                                                        Thông tin tài chính
                                                    </label>
                                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-rose-500/20 to-transparent ml-4" />
                                                </div>

                                                <div className="grid gap-3">
                                                    {[
                                                        { id: 'showOldDebt', label: 'Hiển thị nợ cũ', icon: Coins, color: 'text-rose-400', glow: 'shadow-rose-500/20' },
                                                        { id: 'showPayment', label: 'Hiển thị thanh toán', icon: Wallet, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
                                                        { id: 'showRemaining', label: 'Hiển thị còn lại', icon: FileText, color: 'text-blue-400', glow: 'shadow-blue-500/20' },
                                                    ].map(opt => {
                                                        const IconComp = opt.icon;
                                                        const val = printOptions[opt.id];
                                                        return (
                                                            <m.button
                                                                key={opt.id}
                                                                whileHover={{ x: 8, backgroundColor: "rgba(255,255,255,0.08)" }}
                                                                whileTap={{ scale: 0.96 }}
                                                                onClick={() => setPrintOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                                                                className={cn(
                                                                    "w-full p-4 rounded-[1.8rem] flex items-center justify-between transition-all duration-500 border border-white/5 group relative overflow-hidden",
                                                                    val ? "bg-white/10" : "bg-transparent"
                                                                )}
                                                            >
                                                                {val && <div className={cn("absolute inset-0 opacity-5 bg-current", opt.color)} />}
                                                                <div className="flex items-center gap-4 relative z-10">
                                                                    <div className={cn(
                                                                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                                        val ? `bg-white/10 ${opt.color} ${opt.glow} scale-110` : "bg-white/5 text-white/20 group-hover:text-white/40"
                                                                    )}>
                                                                        <IconComp size={20} strokeWidth={2.5} className={cn("transition-transform duration-700", val ? "rotate-0 scale-110" : "rotate-[-10deg]")} />
                                                                    </div>
                                                                    <div className="flex flex-col items-start gap-0.5">
                                                                        <span className={cn(
                                                                            "text-[11px] font-black uppercase tracking-[0.05em] transition-colors duration-500",
                                                                            val ? "text-white" : "text-white/30 group-hover:text-white/60"
                                                                        )}>
                                                                            {opt.label}
                                                                        </span>
                                                                        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest leading-none">
                                                                            {val ? "ĐANG HIỆN" : "ĐANG ẨN"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className={cn(
                                                                    "w-12 h-6 rounded-full relative p-1 transition-all duration-700 overflow-hidden ring-1 ring-white/10",
                                                                    val ? "bg-emerald-500/20" : "bg-white/5 shadow-none"
                                                                )}>
                                                                    <div className={cn(
                                                                        "absolute top-1/2 left-3 right-3 h-[2px] rounded-full transition-colors duration-700",
                                                                        val ? "bg-emerald-500/40" : "bg-white/10"
                                                                    )} />
                                                                    <m.div
                                                                        layout
                                                                        animate={{
                                                                            x: val ? 24 : 0,
                                                                            backgroundColor: val ? "#10b981" : "#475569"
                                                                        }}
                                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                        className="w-4 h-4 rounded-full flex items-center justify-center relative z-10"
                                                                    >
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 shadow-none" />
                                                                        {val && <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-10" />}
                                                                    </m.div>
                                                                </div>
                                                            </m.button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar Action Buttons */}
                                    <div className="p-8 border-t border-white/10 space-y-3 bg-slate-900">
                                        <m.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setShowPreview(false);
                                                handleSave(true);
                                            }}
                                            className="group w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                                        >
                                            <Printer size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                                            <span>Lưu & In Ngay</span>
                                        </m.button>

                                        <m.button
                                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowPreview(false)}
                                            className="w-full py-4 bg-white/5 text-white/50 hover:text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] border border-white/5 flex items-center justify-center gap-3 transition-all"
                                        >
                                            <X size={18} />
                                            <span>Đóng nhanh</span>
                                        </m.button>
                                    </div>
                                </m.div>

                                {/* Floating Bottom Zoom Controls */}
                                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2100] flex items-center gap-2 p-2 bg-slate-900/80 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl">
                                    <m.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.1))}
                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                                        title="Thu nhỏ"
                                    >
                                        <Minus size={20} />
                                    </m.button>
                                    <div className="px-4 text-[13px] font-black text-white min-w-[60px] text-center">
                                        {Math.round(zoomScale * 100)}%
                                    </div>
                                    <m.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setZoomScale(prev => Math.min(2, prev + 0.1))}
                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                                        title="Phóng to"
                                    >
                                        <Plus size={20} />
                                    </m.button>
                                    <div className="w-[1px] h-6 bg-white/10 mx-1" />
                                    <m.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setZoomScale(1)}
                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                                        title="Reset"
                                    >
                                        <RotateCcw size={18} />
                                    </m.button>
                                </div>

                                {/* Main Document Canvas */}
                                <div
                                    className="flex-1 h-full overflow-auto no-scrollbar py-20 px-4 flex flex-col items-center cursor-zoom-out"
                                    onClick={() => setShowPreview(false)}
                                >
                                    <m.div
                                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                        animate={{ scale: zoomScale, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="relative keep-white bg-white ring-1 ring-black/5 transform-gpu cursor-default origin-top shadow-2xl"
                                    >
                                        <PrintTemplate
                                            data={previewData}
                                            settings={settings}
                                            type="Purchase"
                                            isPreview={true}
                                            showOldDebt={printOptions.showOldDebt}
                                            showPayment={printOptions.showPayment}
                                            showRemaining={printOptions.showRemaining}
                                            showCashGiven={printOptions.showCashGiven}
                                            showChange={printOptions.showChange}
                                        />
                                    </m.div>
                                    <p className="mt-10 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-sans">
                                        Cuộn để xem toàn bộ phiếu • LyangPOS Studio
                                    </p>
                                </div>
                            </div>
                        </Portal>
                    )}
                </AnimatePresence>
                <ConsignmentPanel
                    isOpen={isConsignmentPanelOpen}
                    onClose={() => setIsConsignmentPanelOpen(false)}
                    partnerId={selectedPartner?.id}
                    onImportSuccess={(msg) => {
                        setToast({ message: msg, type: 'success' });
                        queryClient.invalidateQueries({ queryKey: ['products'] });
                        queryClient.invalidateQueries({ queryKey: ['partners'] });
                        queryClient.invalidateQueries({ queryKey: ['orders'] });
                        fetchProducts();
                        fetchPartners();
                        refreshConsignmentStatus(selectedPartner?.id);
                    }}
                />
                <LoadingOverlay isVisible={loading && products.length === 0} message="Đang nạp dữ liệu Nhập hàng..." />
            </div >
            {/* Print Area */}
            {
                lastOrder && (
                    <div className="only-print">
                        <PrintTemplate
                            data={lastOrder}
                            settings={settings}
                            type="Purchase"
                        />
                    </div>
                )
            }
            <AnimatePresence>
                {isOrderDetailModalOpen && selectedDetailOrder && (
                    <OrderEditPopup
                        order={selectedDetailOrder}
                        partner={partners.find(p => p.id === selectedDetailOrder.partner_id)}
                        onClose={() => setIsOrderDetailModalOpen(false)}
                        onSave={() => {
                            setIsOrderDetailModalOpen(false);
                            queryClient.invalidateQueries(['orders']);
                            refreshConsignmentStatus(selectedPartner?.id);
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {confirm && (
                    <ConfirmModal
                        isOpen={!!confirm}
                        title={confirm.title}
                        message={confirm.message}
                        onConfirm={confirm.onConfirm}
                        onCancel={() => setConfirm(null)}
                    />
                )}
            </AnimatePresence>

            {/* Order Note Dedicated Modal */}
            <AnimatePresence>
                {isNoteModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in select-none">
                        <m.div
                            initial={{ opacity: 0, scale: 0.92, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 15 }}
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg overflow-hidden flex flex-col gap-4 text-foreground"
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                        <FileText size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base uppercase tracking-tight text-foreground">
                                            Ghi chú đơn nhập
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            Nhập thông tin giao nhận, ghi chú NCC, tình trạng hàng...
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors text-muted-foreground"
                                >
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    autoFocus
                                    rows={5}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            setIsNoteModalOpen(false);
                                        }
                                        if (e.key === 'Escape') {
                                            setIsNoteModalOpen(false);
                                        }
                                    }}
                                    placeholder="Nhập ghi chú chi tiết cho đơn nhập này..."
                                    className="w-full p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none transition-all shadow-inner"
                                />
                                {note && (
                                    <button
                                        onClick={() => setNote('')}
                                        className="absolute right-3 bottom-4 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                                    >
                                        Xóa hết
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-black/5 dark:bg-white/10 border border-black/10 rounded">Ctrl</kbd>
                                    +
                                    <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-black/5 dark:bg-white/10 border border-black/10 rounded">Enter</kbd>
                                    để lưu nhanh
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsNoteModalOpen(false)}
                                        className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-foreground transition-colors"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        onClick={() => setIsNoteModalOpen(false)}
                                        className="px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-[#059669] hover:bg-[#047857] text-white transition-all shadow-md shadow-emerald-700/20 flex items-center gap-1.5"
                                    >
                                        <Check size={14} strokeWidth={3} />
                                        Xong
                                    </button>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
                {/* Partner Transaction History Panel */}
                <Portal>
                <POSHistoryPanel
                    context="Purchase"
                    defaultType="Purchase"
                    partner={selectedPartner}
                    isOpen={isHistoryPanelOpen}
                    onClose={() => setIsHistoryPanelOpen(false)}
                    onAddToCart={(prod) => {
                        const targetProd = (products || []).find(p => p.id === prod.id) || prod;
                        const appliedPrice = prod.last_price !== undefined ? prod.last_price : (targetProd.cost_price || targetProd.price || 0);
                        setCart(prev => {
                            const newCart = [...prev];
                            const existingIdx = newCart.findIndex(c => c.product_id === targetProd.id);
                            if (existingIdx > -1) {
                                newCart[existingIdx].quantity += 1;
                                newCart[existingIdx].secondary_qty = newCart[existingIdx].quantity / (targetProd.multiplier || 1);
                            } else {
                                newCart.unshift({
                                    product_id: targetProd.id,
                                    product_name: targetProd.name,
                                    unit: targetProd.unit,
                                    secondary_unit: targetProd.secondary_unit,
                                    multiplier: targetProd.multiplier || 1,
                                    price: appliedPrice,
                                    quantity: 1,
                                    secondary_qty: 1 / (targetProd.multiplier || 1),
                                    stock: targetProd.stock,
                                    active_ingredient: targetProd.active_ingredient
                                });
                            }
                            return newCart;
                        });
                        playPopSound();
                        setToast({ message: `Đã thêm ${prod.name} vào đơn nhập`, type: "success" });
                    }}
                    onViewOrder={(order) => {
                        setSelectedDetailOrder(order);
                        setIsOrderDetailModalOpen(true);
                    }}
                    onEditOrder={(order) => {
                        setIsHistoryPanelOpen(false);
                        setEditingOriginalOrder(order);
                        setEditOrderId(order.id);
                        if (order.partner) {
                            setSelectedPartner(order.partner);
                        } else if (order.partner_id) {
                            const foundPartner = (suppliers || partners || []).find(p => p.id === order.partner_id);
                            setSelectedPartner(foundPartner || {
                                id: order.partner_id,
                                name: order.partner_name,
                                phone: order.partner_phone,
                                address: order.partner_address
                            });
                        } else {
                            setSelectedPartner(null);
                        }
                        if (order.details && Array.isArray(order.details)) {
                            setCart(order.details.map(d => ({
                                product_id: d.product_id,
                                product_name: d.product_name || d.product?.name,
                                unit: d.unit || d.product?.unit || 'Cái',
                                secondary_unit: d.secondary_unit || d.product?.secondary_unit,
                                multiplier: d.multiplier || d.product?.multiplier || 1,
                                price: d.price !== undefined ? d.price : (d.unit_price || 0),
                                quantity: d.quantity || 1,
                                secondary_qty: d.secondary_qty || (d.quantity ? d.quantity / (d.multiplier || 1) : 1),
                                stock: d.product?.stock || 0,
                                active_ingredient: d.product?.active_ingredient || null,
                                expiry_date: d.expiry_date || null
                            })));
                        }
                        setPaymentMethod(order.payment_method || 'Cash');
                        setAmountPaid(order.amount_paid || 0);
                        setNote(order.note || '');
                        playPopSound();
                        setToast({ message: `Đã nạp đơn #${order.display_id || order.id} ra màn hình nhập`, type: "success" });
                    }}
                    onDeleteOrder={async (orderId) => {
                        try {
                            await axios.delete(`/api/orders/${orderId}`);
                            playPopSound();
                            setToast({ message: "Đã xóa đơn thành công!", type: "success" });
                        } catch (e) {
                            console.error(e);
                            setToast({ message: "Không thể xóa đơn.", type: "error" });
                        }
                    }}
                />
                </Portal>

                {/* Daily Purchase History Modal */}
                <DailyOrderHistoryModal
                    isOpen={isDailyHistoryOpen}
                    onClose={() => setIsDailyHistoryOpen(false)}
                    type="Purchase"
                    settings={settings}
                    onEditOrder={(order) => {
                        setIsDailyHistoryOpen(false);
                        setEditingOriginalOrder(order);
                        setEditOrderId(order.id);
                        if (order.partner) {
                            setSelectedPartner(order.partner);
                        } else if (order.partner_id) {
                            const foundPartner = (suppliers || partners || []).find(p => p.id === order.partner_id);
                            setSelectedPartner(foundPartner || {
                                id: order.partner_id,
                                name: order.partner_name,
                                phone: order.partner_phone,
                                address: order.partner_address
                            });
                        } else {
                            setSelectedPartner(null);
                        }
                        if (order.details && Array.isArray(order.details)) {
                            setCart(order.details.map(d => ({
                                product_id: d.product_id,
                                product_name: d.product_name || d.product?.name,
                                unit: d.unit || d.product?.unit || 'Cái',
                                secondary_unit: d.secondary_unit || d.product?.secondary_unit,
                                multiplier: d.multiplier || d.product?.multiplier || 1,
                                price: d.price !== undefined ? d.price : (d.unit_price || 0),
                                quantity: d.quantity || 1,
                                secondary_qty: d.secondary_qty || (d.quantity ? d.quantity / (d.multiplier || 1) : 1),
                                stock: d.product?.stock || 0,
                                active_ingredient: d.product?.active_ingredient || null,
                                expiry_date: d.expiry_date || null
                            })));
                        }
                        setPaymentMethod(order.payment_method || 'Cash');
                        setAmountPaid(order.amount_paid || 0);
                        setNote(order.note || '');
                        playPopSound();
                    }}
                    onPrintOrder={(order) => {
                        const partner = partners.find(p => p.id === order.partner_id);
                        const enriched = {
                            ...order,
                            old_debt: (order.old_debt !== undefined && order.old_debt !== null) ? order.old_debt : (partner ? (partner.debt_balance || 0) : 0),
                            partner: partner || order.partner || null
                        };
                        setLastOrder(enriched);
                        setTimeout(() => window.print(), 300);
                    }}
                    onDeleteOrder={async (orderId) => {
                        try {
                            await axios.delete(`/api/orders/${orderId}`);
                            playPopSound();
                            setToast({ message: "Đã xóa đơn nhập hàng thành công!", type: "success" });
                        } catch (e) {
                            console.error(e);
                            setToast({ message: "Không thể xóa đơn nhập.", type: "error" });
                        }
                    }}
                />

                {/* Price Raise Warning Modal */}
                <PriceRaiseModal
                    isOpen={isPriceRaiseModalOpen}
                    items={priceRaiseItems}
                    onClose={handleDismissPriceRaise}
                    onSuccess={handlePriceRaiseSuccess}
                    queryClient={queryClient}
                />

                {/* Toast Notification */}
                <AnimatePresence>
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </MotionConfig>
    );
}
