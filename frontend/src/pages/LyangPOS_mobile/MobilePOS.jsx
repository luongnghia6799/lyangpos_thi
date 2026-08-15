import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, User, X, Menu, ChevronRight, ShoppingCart, Trash2, ChevronDown, Printer, Check, PauseCircle, Clock, Gift, QrCode, Barcode, Scan } from 'lucide-react';
import { formatNumber, normalizeUOM, removeAccents } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useProductData } from '../../queries/useProductData';
import MobileMenu from '../../components/MobileMenu';
import MobilePartnerSelector from '../../components/MobilePartnerSelector';
import MobileBarcodeScannerModal from '../../components/MobileBarcodeScannerModal';
import ConfirmModal from '../../components/ConfirmModal';
import Portal from '../../components/Portal';
import { DEFAULT_SETTINGS } from '../../lib/settings';
import PrintTemplate from '../../components/PrintTemplate';
import useMobileNative from '../../hooks/useMobileNative';

export default function MobilePOS() {
    const { triggerHaptic } = useMobileNative();
    const navigate = useNavigate();
    const { data: productsData } = useProductData();
    const [products, setProducts] = useState([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [printData, setPrintData] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [printOptions] = useState(() => {
        const saved = localStorage.getItem("pos_print_options");
        return saved ? JSON.parse(saved) : {
            showOldDebt: false,
            showPayment: false,
            showRemaining: false,
            showCashGiven: true,
            showChange: true
        };
    });

    useEffect(() => {
        const fetchPrintSettings = async () => {
            try {
                const [templatesRes, settingsRes] = await Promise.all([
                    axios.get("/api/print-templates"),
                    axios.get("/api/settings"),
                ]);
                let combinedSettings = { ...DEFAULT_SETTINGS };
                if (settingsRes.data) {
                    combinedSettings = { ...combinedSettings, ...settingsRes.data };
                }
                if (templatesRes.data && templatesRes.data.length > 0) {
                    const activeTemplate = templatesRes.data.find(t => t.is_default) || templatesRes.data[0];
                    if (activeTemplate && activeTemplate.config) {
                        try {
                            const config = typeof activeTemplate.config === 'string'
                                ? JSON.parse(activeTemplate.config)
                                : activeTemplate.config;
                            combinedSettings = { ...combinedSettings, ...config };
                        } catch (e) {
                            console.error("Failed to parse template config", e);
                        }
                    }
                }
                setSettings(combinedSettings);
            } catch (err) {
                console.error("Failed to load mobile print settings", err);
            }
        };
        fetchPrintSettings();
    }, []);

    const [qtyModalProduct, setQtyModalProduct] = useState(null);
    const [inputQty, setInputQty] = useState('1');
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('mobile_pos_cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('mobile_pos_search') || '');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem('mobile_pos_category') || 'Tất cả');
    const [selectedPartner, setSelectedPartner] = useState(() => {
        const saved = localStorage.getItem('mobile_pos_partner');
        return saved ? JSON.parse(saved) : null;
    });

    // Held Orders State (Matching Android Native HeldOrder feature)
    const [heldOrders, setHeldOrders] = useState(() => {
        const saved = localStorage.getItem('mobile_pos_held_orders');
        return saved ? JSON.parse(saved) : [];
    });
    const [isHoldSheetOpen, setIsHoldSheetOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('mobile_pos_held_orders', JSON.stringify(heldOrders));
    }, [heldOrders]);

    useEffect(() => {
        localStorage.setItem('mobile_pos_cart', JSON.stringify(cart));
        localStorage.setItem('pos_cart', JSON.stringify(cart));
        if (selectedPartner) {
            localStorage.setItem('pos_partner_name', selectedPartner.name || 'Khách lẻ');
        }
        window.dispatchEvent(new CustomEvent('pos_cart_updated', {
            detail: { cart: cart, partner_name: selectedPartner?.name || 'Khách lẻ' }
        }));
    }, [cart, selectedPartner]);

    // Live POS Terminal Mirror Heartbeat Broadcasting
    useEffect(() => {
        let terminalId = localStorage.getItem('mobile_pos_terminal_id');
        if (!terminalId) {
            terminalId = `MobilePOS-${Math.floor(100 + Math.random() * 900)}`;
            localStorage.setItem('mobile_pos_terminal_id', terminalId);
        }

        const user = JSON.parse(sessionStorage.getItem('user') || '{}');

        const broadcastMobileState = async () => {
            try {
                const totalItems = cart.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
                const totalAmt = cart.reduce((acc, i) => acc + (Number(i.quantity) || 1) * Number(i.sale_price || i.price || 0), 0);

                await axios.post('/api/pos/terminal-state', {
                    terminal_id: terminalId,
                    terminal_name: `Máy POS Di Động (${user.full_name || user.username || terminalId})`,
                    user_name: user.full_name || user.username || 'Thu ngân mobile',
                    cart: cart,
                    partner_name: selectedPartner?.name || 'Khách lẻ',
                    total_items: totalItems,
                    total_amount: totalAmt,
                    status: 'active',
                    current_page: 'MobilePOS'
                });
            } catch (e) {
                // silent
            }
        };

        broadcastMobileState();
        const interval = setInterval(broadcastMobileState, 2500);
        return () => clearInterval(interval);
    }, [cart, selectedPartner]);

    const packingChannelRef = useRef(null);
    useEffect(() => {
        packingChannelRef.current = new BroadcastChannel('packing_channel');
        return () => packingChannelRef.current?.close();
    }, []);

    useEffect(() => {
        localStorage.setItem('mobile_pos_search', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem('mobile_pos_category', selectedCategory);
    }, [selectedCategory]);

    useEffect(() => {
        localStorage.setItem('mobile_pos_partner', JSON.stringify(selectedPartner));
    }, [selectedPartner]);
    const [showPartnerSelector, setShowPartnerSelector] = useState(false);

    const searchInputRef = useRef(null);

    useEffect(() => {
        if (productsData) setProducts(productsData);
    }, [productsData]);

    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [todaySalesMap, setTodaySalesMap] = useState({});

    const fetchTodaySales = useCallback(async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const res = await axios.get(`/api/reports/product-sales?start_date=${todayStr}&limit=500`);
            if (res.data && Array.isArray(res.data)) {
                const salesMap = {};
                res.data.forEach(item => {
                    if (item.product_id) salesMap[item.product_id] = item.qty || 0;
                });
                setTodaySalesMap(salesMap);
            }
        } catch (err) {
            console.error("Failed to fetch today sales", err);
        }
    }, []);

    useEffect(() => {
        fetchTodaySales();
    }, [fetchTodaySales]);

    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [customPrices, setCustomPrices] = useState({});

    useEffect(() => {
        if (selectedPartner) {
            axios.get(`/api/custom-prices/${selectedPartner.id}`)
                .then(res => setCustomPrices(res.data))
                .catch(err => console.error(err));
        } else {
            setCustomPrices({});
        }
    }, [selectedPartner]);

    useEffect(() => {
        if (paymentMethod === 'Bank') {
            axios.get('/api/bank-accounts').then(res => {
                setBankAccounts(res.data);
                if (res.data.length > 0) setSelectedBankAccountId(res.data[0].id);
            });
        }
    }, [paymentMethod]);

    const categories = useMemo(() => {
        if (!products) return ['Tất cả'];
        const cats = new Set(products.map(p => p.category || 'Khác').filter(Boolean));
        return ['Tất cả', ...Array.from(cats).sort()];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let res = products;
        if (!searchTerm) {
            if (selectedCategory && selectedCategory !== 'Tất cả') {
                res = res.filter(p => p.category === selectedCategory);
            }
            return [...res].sort((a, b) => {
                const qtyA = todaySalesMap[a.id] || 0;
                const qtyB = todaySalesMap[b.id] || 0;
                if (qtyB !== qtyA) return qtyB - qtyA;
                const aName = (a.name || "").toLowerCase();
                const bName = (b.name || "").toLowerCase();
                return aName.localeCompare(bName, "vi", { sensitivity: "base" });
            }).slice(0, 15);
        }
        
        if (selectedCategory && selectedCategory !== 'Tất cả') {
            res = res.filter(p => p.category === selectedCategory);
        }
        
        const s = searchTerm.toLowerCase();
        const sNoAccent = removeAccents(s);
        res = res.filter(p => {
            const name = (p.name || '').toLowerCase();
            const code = (p.code || '').toLowerCase();
            return name.includes(s) || removeAccents(name).includes(sNoAccent) ||
                   code.includes(s) || removeAccents(code).includes(sNoAccent);
        });
        return res;
    }, [products, searchTerm, selectedCategory, todaySalesMap]);

    const [displayLimit, setDisplayLimit] = useState(25);

    useEffect(() => {
        setDisplayLimit(25);
    }, [searchTerm, selectedCategory]);

    const paginatedProducts = useMemo(() => {
        return filteredProducts.slice(0, displayLimit);
    }, [filteredProducts, displayLimit]);

    const addToCart = (product, qty = 1) => {
        const addQty = Math.max(1, parseInt(qty) || 1);
        triggerHaptic('light');
        const appliedPrice = customPrices[product.id] !== undefined ? customPrices[product.id] : product.sale_price;
        const existingIdx = cart.findIndex(i => i.product_id === product.id && i.price === appliedPrice);
        if (existingIdx > -1) {
            setCart(prev => prev.map((item, idx) =>
                idx === existingIdx ? { ...item, quantity: item.quantity + addQty } : item
            ));
        } else {
            const newItem = {
                product_id: product.id,
                product_name: product.name,
                price: appliedPrice,
                quantity: addQty,
                unit: product.unit
            };
            setCart(prev => [...prev, newItem]);
        }
        setToast({ message: `Đã thêm (${addQty}) ${product.name}`, type: 'success' });
        setTimeout(() => setToast(null), 1200);
    };

    const updateQuantity = (idx, delta) => {
        triggerHaptic('light');
        const newCart = [...cart];
        newCart[idx].quantity += delta;
        if (newCart[idx].quantity <= 0) {
            setCart(cart.filter((_, i) => i !== idx));
        } else {
            setCart(newCart);
        }
    };

    const toggleGiftItem = (idx) => {
        triggerHaptic('medium');
        const newCart = [...cart];
        if (newCart[idx].price === 0) {
            const prod = products.find(p => p.id === newCart[idx].product_id);
            newCart[idx].price = prod ? prod.sale_price : 0;
        } else {
            newCart[idx].price = 0;
        }
        setCart(newCart);
    };

    const handleHoldOrder = () => {
        if (cart.length === 0) return;
        triggerHaptic('medium');
        const newHold = {
            id: Date.now().toString(),
            date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            cart: [...cart],
            partner: selectedPartner,
            paymentMethod,
            totalAmount: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        };
        setHeldOrders(prev => [newHold, ...prev]);
        setCart([]);
        setSelectedPartner(null);
        setIsCartExpanded(false);
        setToast({ message: 'Đã hoãn đơn thành công!', type: 'success' });
        setTimeout(() => setToast(null), 1500);
    };

    const handleRestoreHold = (hold) => {
        triggerHaptic('light');
        setCart(hold.cart);
        setSelectedPartner(hold.partner);
        setPaymentMethod(hold.paymentMethod || 'Cash');
        setHeldOrders(prev => prev.filter(h => h.id !== hold.id));
        setIsHoldSheetOpen(false);
        setIsCartExpanded(true);
    };

    const totalAmount = useMemo(() => cart.reduce((sum, i) => sum + (i.price * i.quantity), 0), [cart]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        triggerHaptic('success');
        try {
            const orderData = {
                partner_id: selectedPartner ? selectedPartner.id : null,
                type: 'Sale',
                payment_method: paymentMethod,
                bank_account_id: paymentMethod === 'Bank' ? selectedBankAccountId : null,
                details: cart.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: item.price
                })),
                note: 'Mobile POS Order',
                amount_paid: paymentMethod === 'Debt' ? 0 : totalAmount,
                created_by: JSON.parse(sessionStorage.getItem('user') || '{}').name || JSON.parse(sessionStorage.getItem('user') || '{}').username || 'Unknown'
            };
            const res = await axios.post('/api/orders', orderData);
            
            if (packingChannelRef.current) {
                const payload = {
                    type: 'NEW_ORDER',
                    orders: [{
                        id: res.data.display_id || res.data.id || 'MOBILE',
                        customer_name: selectedPartner?.name || 'Khách lẻ',
                        timestamp: new Date().toLocaleTimeString(),
                        items: cart.map(i => ({ name: i.product_name, quantity: i.quantity })),
                        note: 'Mobile POS Order'
                    }]
                };
                packingChannelRef.current.postMessage(payload);
                axios.post('/api/packing/sync', payload).catch(console.error);
            }

            setPrintData(res.data);
            setCart([]);
            setSelectedPartner(null);
            setIsCartExpanded(false);
            setShowSuccessModal(true);
        } catch (err) {
            setToast({ message: 'Lỗi thanh toán đơn', type: 'error' });
        } finally {
            fetchTodaySales();
        }
    };

    const handleBarcodeScanResult = useCallback((code) => {
        if (!code) return;
        triggerHaptic('success');
        const cleanCode = code.trim();
        const exactMatch = products.find(p => 
            (p.code && p.code.toLowerCase() === cleanCode.toLowerCase()) || 
            (p.sku && p.sku.toLowerCase() === cleanCode.toLowerCase())
        );
        if (exactMatch) {
            addToCart(exactMatch);
            setToast({ message: `Đã thêm: ${exactMatch.name}`, type: 'success' });
            setTimeout(() => setToast(null), 2000);
        } else {
            setSearchTerm(cleanCode);
            setToast({ message: `Mã vạch: ${cleanCode}`, type: 'info' });
            setTimeout(() => setToast(null), 2000);
        }
    }, [products, triggerHaptic, addToCart]);

    return (
        <div className="flex flex-col space-y-3 p-3 no-print font-sans pb-24">
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <MobileBarcodeScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleBarcodeScanResult} 
            />

            {/* Android POS Top Partner Selection Card */}
            <div 
                onClick={() => {
                    triggerHaptic('light');
                    setShowPartnerSelector(true);
                }}
                className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm cursor-pointer android-touchable"
            >
                <div className="flex items-center gap-3 truncate">
                    <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-400 shrink-0">
                        <User size={20} />
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Khách Hàng Bán Lẻ / Sỉ</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {selectedPartner ? selectedPartner.name : 'Khách lẻ (Tạo đơn nhanh)'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {heldOrders.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('medium');
                                setIsHoldSheetOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-bold text-xs border border-amber-200/60 dark:border-amber-900/40"
                        >
                            <PauseCircle size={14} />
                            <span>Đơn hoãn ({heldOrders.length})</span>
                        </button>
                    )}
                    <ChevronRight size={20} className="text-slate-400" />
                </div>
            </div>

            {/* Search Input Bar with Barcode Scanner Icon */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-2">
                <div className="relative flex items-center">
                    <Search className="absolute left-3.5 text-slate-400" size={20} />
                    <input
                        ref={searchInputRef}
                        className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl py-2.5 pl-11 pr-24 outline-none font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                        placeholder="Tìm tên hoặc quét mã SP..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-2 flex items-center gap-1.5">
                        {searchTerm ? (
                            <button 
                                className="text-slate-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" 
                                onClick={() => setSearchTerm('')}
                            >
                                <X size={18} />
                            </button>
                        ) : null}
                        <button
                            onClick={() => {
                                triggerHaptic('medium');
                                if (window.AndroidBridge?.scanBarcode) {
                                    window.AndroidBridge.scanBarcode();
                                } else {
                                    setIsScannerOpen(true);
                                }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg hover:bg-primary/20 active:scale-95 transition-all font-bold text-xs android-touchable shrink-0"
                            title="Quét mã vạch"
                        >
                            <Barcode size={16} />
                            <span>Quét</span>
                        </button>
                    </div>
                </div>

                {/* Categories Tab Bar Slider */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 pt-2.5 pb-1 px-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                triggerHaptic('light');
                                setSelectedCategory(cat);
                            }}
                            className={cn(
                                "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all android-touchable",
                                selectedCategory === cat || (!selectedCategory && cat === 'Tất cả')
                                    ? "bg-primary text-white shadow-md shadow-primary/20 dark:bg-emerald-600 dark:shadow-emerald-900/30"
                                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Cards List */}
            <div className="flex flex-col gap-2.5">
                {paginatedProducts.map(p => {
                    const cartItem = cart.find(item => item.product_id === p.id);
                    const quantityInCart = cartItem ? cartItem.quantity : 0;

                    return (
                        <m.div
                            key={p.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setQtyModalProduct(p);
                                setInputQty('1');
                            }}
                            className={cn(
                                "bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-sm border transition-all cursor-pointer android-touchable flex items-center justify-between min-h-[84px] relative overflow-hidden",
                                quantityInCart > 0
                                    ? "border-primary dark:border-emerald-500 bg-primary/5 dark:bg-emerald-950/20"
                                    : "border-slate-200/90 dark:border-slate-800 hover:border-primary/50"
                            )}
                        >
                            <div className="flex-1 min-w-0 pr-3">
                                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug mb-1 truncate">
                                    {p.name}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                        {normalizeUOM(p.unit)}
                                    </span>
                                    {p.code && (
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                                            Mã: {p.code}
                                        </span>
                                    )}
                                    <span className={cn(
                                        "font-semibold px-2 py-0.5 rounded-md",
                                        (p.current_stock || 0) <= 0
                                            ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    )}>
                                        Tồn: {p.current_stock || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex flex-col items-end">
                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base leading-tight">
                                        {formatNumber(p.sale_price)}đ
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400">/{normalizeUOM(p.unit)}</span>
                                </div>

                                {quantityInCart > 0 ? (
                                    <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-primary/25">
                                        {quantityInCart}
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                                        <Plus size={18} strokeWidth={2.5} />
                                    </div>
                                )}
                            </div>
                        </m.div>
                    );
                })}

                {/* Progressive Pagination Load More Button */}
                {filteredProducts.length > paginatedProducts.length && (
                    <button
                        onClick={() => setDisplayLimit(prev => prev + 25)}
                        className="w-full py-3 my-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-primary dark:text-emerald-400 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Tải thêm ({paginatedProducts.length}/{filteredProducts.length} sản phẩm)</span>
                        <ChevronDown size={16} />
                    </button>
                )}
            </div>

            {/* Floating Cart Pill at the bottom edge of viewport */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <m.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="fixed bottom-4 left-3 right-3 max-w-md mx-auto z-40"
                    >
                        <div
                            onClick={() => {
                                triggerHaptic('medium');
                                setIsCartExpanded(true);
                            }}
                            className="bg-slate-900 text-white dark:bg-emerald-600 rounded-2xl shadow-xl p-3.5 flex items-center justify-between cursor-pointer border border-slate-800 dark:border-emerald-500/50 android-touchable"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative p-2.5 bg-white/15 rounded-xl">
                                    <ShoppingCart size={22} className="text-white" />
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-300 dark:text-emerald-100 font-medium">Giỏ hàng ({cart.length} sản phẩm)</span>
                                    <span className="font-extrabold text-lg leading-tight text-white">
                                        {formatNumber(totalAmount)}đ
                                    </span>
                                </div>
                            </div>

                            <button className="flex items-center gap-1.5 bg-primary dark:bg-white text-white dark:text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md">
                                <span>Thanh toán</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Expanded Full Cart Sheet Drawer */}
            <AnimatePresence>
                {isCartExpanded && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm android-webview">
                        <m.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                            className="bg-white dark:bg-slate-900 rounded-t-[28px] max-h-[88dvh] flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-area-pb"
                        >
                            {/* Drawer Header */}
                            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center font-bold">
                                        {cart.length}
                                    </div>
                                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Chi tiết giỏ hàng</h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleHoldOrder}
                                        className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-3 py-1.5 rounded-xl flex items-center gap-1 border border-amber-200/60 dark:border-amber-900/40"
                                    >
                                        <PauseCircle size={14} />
                                        Hoãn đơn
                                    </button>
                                    <button
                                        onClick={() => setIsCartExpanded(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Cart Items Scroll List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="relative overflow-hidden rounded-2xl group">
                                        {/* Swipe Left Delete Background Action */}
                                        <div className="absolute inset-y-0 right-0 w-28 bg-rose-600 rounded-2xl flex items-center justify-end pr-4 text-white font-extrabold text-xs gap-1 shadow-inner">
                                            <Trash2 size={18} />
                                            <span>XÓA</span>
                                        </div>

                                        {/* Touch Draggable Cart Item Card */}
                                        <m.div
                                            drag="x"
                                            dragConstraints={{ left: -85, right: 0 }}
                                            dragElastic={0.1}
                                            onDragEnd={(e, info) => {
                                                if (info.offset.x < -60 || info.velocity.x < -250) {
                                                    triggerHaptic('medium');
                                                    setCart(prev => prev.filter((_, i) => i !== idx));
                                                    setToast({ message: 'Đã xóa sản phẩm khỏi giỏ', type: 'info' });
                                                    setTimeout(() => setToast(null), 1200);
                                                }
                                            }}
                                            className="bg-slate-50 dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 relative z-10 touch-pan-y"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                        {item.product_name || item.name}
                                                    </h4>
                                                    {item.price === 0 && (
                                                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">Tặng</span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                    {formatNumber(item.price)}đ x {item.quantity} = {formatNumber(item.price * item.quantity)}đ
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleGiftItem(idx);
                                                    }}
                                                    className={cn(
                                                        "p-1.5 rounded-lg text-xs font-semibold border transition-colors",
                                                        item.price === 0
                                                            ? "bg-rose-500 text-white border-rose-500"
                                                            : "bg-slate-200/60 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-transparent"
                                                    )}
                                                    title="Đổi thành hàng tặng 0đ"
                                                >
                                                    <Gift size={15} />
                                                </button>

                                                {/* Stepper Buttons */}
                                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => updateQuantity(idx, -1)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
                                                    >
                                                        <Minus size={15} />
                                                    </button>
                                                    <span className="w-7 text-center font-bold text-xs text-slate-900 dark:text-white">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(idx, 1)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-primary dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
                                                    >
                                                        <Plus size={15} />
                                                    </button>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerHaptic('medium');
                                                        setCart(prev => prev.filter((_, i) => i !== idx));
                                                        setToast({ message: 'Đã xóa sản phẩm', type: 'info' });
                                                        setTimeout(() => setToast(null), 1200);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors ml-0.5"
                                                    title="Xóa khỏi giỏ"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </m.div>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Method Selector & Checkout Summary */}
                            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex gap-2">
                                    {[
                                        { id: 'Cash', label: 'Tiền mặt' },
                                        { id: 'Bank', label: 'Chuyển khoản' },
                                        { id: 'Debt', label: 'Ghi nợ' }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setPaymentMethod(m.id);
                                            }}
                                            className={cn(
                                                "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border android-touchable",
                                                paymentMethod === m.id
                                                    ? "bg-primary text-white border-primary shadow-sm dark:bg-emerald-600 dark:border-emerald-500"
                                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === 'Bank' && bankAccounts.length > 0 && (
                                    <select
                                        value={selectedBankAccountId}
                                        onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
                                    >
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.bank_name} - {b.account_number}</option>
                                        ))}
                                    </select>
                                )}

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-sm font-semibold text-slate-500">Tổng thanh toán:</span>
                                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {formatNumber(totalAmount)}đ
                                    </span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-3.5 bg-primary dark:bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/25 active:scale-98 transition-transform"
                                >
                                    Xác Nhận Thanh Toán (Lưu Đơn)
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Held Orders Bottom Sheet Modal */}
            <AnimatePresence>
                {isHoldSheetOpen && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm android-webview">
                        <m.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                            className="bg-white dark:bg-slate-900 rounded-t-[28px] max-h-[80dvh] flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-area-pb"
                        >
                            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PauseCircle size={20} className="text-amber-500" />
                                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Danh sách đơn tạm hoãn</h3>
                                </div>
                                <button
                                    onClick={() => setIsHoldSheetOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {heldOrders.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">Không có đơn hàng hoãn nào</div>
                                ) : (
                                    heldOrders.map((hold) => (
                                        <div
                                            key={hold.id}
                                            className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                                        >
                                            <div>
                                                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                    {hold.partner?.name || 'Khách lẻ'} ({hold.cart.length} món)
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    Thời gian: {hold.date} • Tổng: <span className="font-bold text-emerald-600">{formatNumber(hold.totalAmount)}đ</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRestoreHold(hold)}
                                                    className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-xs"
                                                >
                                                    Mở lại
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        triggerHaptic('warning');
                                                        setHeldOrders(prev => prev.filter(h => h.id !== hold.id));
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Partner Selector Modal */}
            <MobilePartnerSelector
                isOpen={showPartnerSelector}
                onClose={() => setShowPartnerSelector(false)}
                onSelect={setSelectedPartner}
                selectedPartner={selectedPartner}
            />

            {/* Success checkout and Print popup */}
            <AnimatePresence>
                {showSuccessModal && printData && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 no-print android-webview"
                    >
                        <m.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                <Check size={36} strokeWidth={3} />
                            </div>
                            <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">Thanh toán thành công!</h3>
                            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Mã đơn #{printData.display_id || printData.id}</p>

                            <div className="w-full my-5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-left text-xs font-medium">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Khách hàng:</span>
                                    <span className="text-slate-900 dark:text-slate-100 font-bold">{printData.partner_name || 'Khách lẻ'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Phương thức:</span>
                                    <span className="text-slate-900 dark:text-slate-100 font-bold">{printData.payment_method}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-500 font-bold">Tổng tiền:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatNumber(printData.total_amount)}đ</span>
                                </div>
                            </div>

                            <div className="w-full space-y-2.5">
                                <button
                                    onClick={() => {
                                        triggerHaptic('medium');
                                        setTimeout(() => window.print(), 300);
                                    }}
                                    className="w-full bg-primary dark:bg-emerald-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-98 transition-transform flex items-center justify-center gap-2"
                                >
                                    <Printer size={18} />
                                    <span>In Hóa Đơn</span>
                                </button>
                                <button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setShowSuccessModal(false);
                                        setPrintData(null);
                                    }}
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs active:scale-98 transition-transform"
                                >
                                    Tạo Đơn Hàng Mới
                                </button>
                            </div>
                        </m.div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Quantity Input Modal */}
            <AnimatePresence>
                {qtyModalProduct && (
                    <Portal>
                        <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm android-webview">
                            <m.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nhập số lượng bán</span>
                                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                                            {qtyModalProduct.name}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setQtyModalProduct(null)}
                                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const val = parseInt(inputQty) || 1;
                                    addToCart(qtyModalProduct, val);
                                    setQtyModalProduct(null);
                                }} className="space-y-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setInputQty(prev => String(Math.max(1, (parseInt(prev) || 1) - 1)))}
                                            className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
                                        >
                                            -
                                        </button>

                                        <input
                                            autoFocus
                                            type="number"
                                            inputMode="numeric"
                                            value={inputQty}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setInputQty(e.target.value)}
                                            className="w-28 h-12 text-center text-2xl font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-primary dark:text-emerald-400"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setInputQty(prev => String((parseInt(prev) || 0) + 1))}
                                            className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Quick Presets */}
                                    <div className="flex gap-1.5 justify-center flex-wrap">
                                        {[1, 2, 5, 10, 20, 50].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setInputQty(String(n))}
                                                className={cn(
                                                    "py-1.5 px-3 rounded-xl font-bold text-xs border transition-all active:scale-95",
                                                    String(n) === inputQty
                                                        ? "bg-primary dark:bg-emerald-600 text-white border-primary"
                                                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-transparent"
                                                )}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3.5 bg-primary dark:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/25 active:scale-98 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <span>Thêm Vào Giỏ (Enter)</span>
                                    </button>
                                </form>
                            </m.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>

            {/* Hidden Print Template */}
            {printData && printData.details && printData.details.length > 0 && (
                <div className="only-print">
                    <PrintTemplate
                        data={printData}
                        settings={settings}
                        type="Sale"
                        showOldDebt={printOptions.showOldDebt}
                        showPayment={printOptions.showPayment}
                        showRemaining={printOptions.showRemaining}
                        showCashGiven={printOptions.showCashGiven}
                        showChange={printOptions.showChange}
                    />
                </div>
            )}
        </div>
    );
}
