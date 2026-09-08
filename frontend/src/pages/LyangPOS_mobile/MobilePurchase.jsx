import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Package, X, Menu, ChevronRight, User, ShoppingCart, Trash2, ChevronDown } from 'lucide-react';
import { formatNumber, normalizeUOM, removeAccents } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useProductData, usePartnerData } from '../../queries/useProductData';
import MobileMenu from '../../components/MobileMenu';
import MobilePartnerSelector from '../../components/MobilePartnerSelector';
import ConfirmModal from '../../components/ConfirmModal';
import Portal from '../../components/Portal';

export default function MobilePurchase() {
    const triggerHaptic = (style = 'medium') => {
        if (window.navigator?.vibrate) {
            if (style === 'light') window.navigator.vibrate(10);
            else if (style === 'medium') window.navigator.vibrate(20);
            else if (style === 'heavy') window.navigator.vibrate([30, 50, 30]);
            else if (style === 'success') window.navigator.vibrate([10, 30, 10]);
        }
    };

    const navigate = useNavigate();
    const { data: productsData } = useProductData();
    const { data: partnersData } = usePartnerData();

    const products = productsData || [];
    const partners = partnersData || [];

    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [qtyModalProduct, setQtyModalProduct] = useState(null);
    const [inputQty, setInputQty] = useState('1');
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('mobile_purchase_cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('mobile_purchase_search') || '');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState(() => {
        const saved = localStorage.getItem('mobile_purchase_partner');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (paymentMethod === 'Bank') {
            axios.get('/api/bank-accounts').then(res => {
                setBankAccounts(res.data);
                if (res.data.length > 0) setSelectedBankAccountId(res.data[0].id);
            });
        }
    }, [paymentMethod]);

    useEffect(() => {
        localStorage.setItem('mobile_purchase_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('mobile_purchase_search', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem('mobile_purchase_partner', JSON.stringify(selectedPartner));
    }, [selectedPartner]);
    const [showPartnerSelector, setShowPartnerSelector] = useState(false);

    const searchInputRef = useRef(null);
    const cartItemRefs = useRef({});

    const filteredProducts = useMemo(() => {
        let res = products;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            const sNoAccent = removeAccents(s);
            res = res.filter(p => {
                const name = (p.name || '').toLowerCase();
                const code = (p.code || '').toLowerCase();
                return name.includes(s) || removeAccents(name).includes(sNoAccent) ||
                       code.includes(s) || removeAccents(code).includes(sNoAccent);
            });
        }
        return res;
    }, [products, searchTerm]);

    const [displayLimit, setDisplayLimit] = useState(25);

    useEffect(() => {
        setDisplayLimit(25);
    }, [searchTerm]);

    const paginatedProducts = useMemo(() => {
        return filteredProducts.slice(0, displayLimit);
    }, [filteredProducts, displayLimit]);

    const addToCart = (product, qty = 1) => {
        const addQty = Math.max(1, parseInt(qty) || 1);
        triggerHaptic('light');
        const appliedPrice = product.cost_price;
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
        setIsCartExpanded(true); // Auto expand when adding
        setToast({ message: `Đã thêm (${addQty}) ${product.name}`, type: 'success' });
        setTimeout(() => setToast(null), 1500);
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

    const totalAmount = useMemo(() => cart.reduce((sum, i) => sum + (i.price * i.quantity), 0), [cart]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        triggerHaptic('medium');
        try {
            const orderData = {
                partner_id: selectedPartner ? selectedPartner.id : null,
                type: 'Purchase',
                payment_method: paymentMethod,
                bank_account_id: paymentMethod === 'Bank' ? selectedBankAccountId : null,
                details: cart.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: item.price
                })),
                note: 'Mobile Purchase Order',
                amount_paid: paymentMethod === 'Debt' ? 0 : totalAmount
            };
            await axios.post('/api/orders', orderData);
            setCart([]);
            setToast({ message: 'Nhập hàng thành công!', type: 'success' });
            setTimeout(() => setToast(null), 2000);
            setSelectedPartner(null);
        } catch (err) {
            setToast({ message: 'Lỗi nhập hàng', type: 'error' });
        }
    };

    return (
        <div className="h-full min-h-screen flex flex-col bg-slate-100 dark:bg-black text-slate-800 dark:text-slate-100 overflow-hidden relative">
            <div className="flex-1 flex flex-col overflow-hidden no-print">

            {/* Supplier Selector Bar & Search Input */}
            <div className="bg-white dark:bg-black border-b border-slate-200/80 dark:border-slate-800 p-3 space-y-2 shrink-0 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                    <button
                        onClick={() => setShowPartnerSelector(true)}
                        className="flex-1 flex items-center justify-between p-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 active:scale-98 transition-all"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                <User size={16} />
                            </div>
                            <div className="flex flex-col text-left truncate">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Nhà cung cấp</span>
                                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                                    {selectedPartner ? selectedPartner.name : 'NCC Vãng Lai'}
                                </span>
                            </div>
                        </div>
                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
                    <input
                        ref={searchInputRef}
                        className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl py-2 pl-10 pr-4 outline-none font-semibold text-xs text-slate-900 dark:text-white border border-transparent focus:border-primary/40 dark:focus:border-emerald-500/40 transition-all placeholder:text-slate-400"
                        placeholder="Nhập tên sản phẩm hoặc mã để nhập kho..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-64">
                {paginatedProducts.map(p => (
                    <m.div
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setQtyModalProduct(p);
                            setInputQty('1');
                        }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between relative overflow-hidden group active:bg-slate-50 dark:active:bg-slate-800/80 transition-colors"
                    >
                        <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-3.5 bg-primary dark:bg-emerald-500 rounded-full shrink-0" />
                                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-tight truncate">
                                    {p.name}
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[9px] font-extrabold text-primary dark:text-emerald-400 uppercase tracking-wider bg-primary/10 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                    {normalizeUOM(p.unit)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 tracking-tight">
                                    Mã: {p.code || '---'}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-extrabold tracking-tight px-2 py-0.5 rounded-md",
                                    (p.current_stock || 0) <= 0
                                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                )}>
                                    Tồn: {p.current_stock || 0}
                                </span>
                                {p.secondary_unit && p.multiplier > 1 && (
                                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                                        1 {normalizeUOM(p.secondary_unit)} = {p.multiplier} {normalizeUOM(p.unit)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex flex-col items-end">
                                <span className="font-extrabold text-primary dark:text-emerald-400 text-sm leading-none tracking-tight">
                                    {formatNumber(p.cost_price)}đ
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">GIÁ / {normalizeUOM(p.unit)}</span>
                            </div>
                            <div className="w-8 h-8 bg-primary/10 dark:bg-emerald-500/15 text-primary dark:text-emerald-400 rounded-xl flex items-center justify-center group-active:scale-90 transition-transform">
                                <Plus size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </m.div>
                ))}

                {/* Load More Button */}
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

            {/* Bottom Cart Action (High Visibility Floating Panel) */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <m.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-40 pb-4 px-3 pointer-events-none flex flex-col justify-end"
                        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.25 }}
                    >
                        {/* Premium Gradient Container */}
                        <m.div
                            layout
                            className={cn(
                                "bg-transparent backdrop-blur-2xl rounded-[2.5rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col pointer-events-auto relative",
                                "max-h-[70dvh]"
                            )}>
                            {/* Decorative Background Glow */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4a7c59] to-transparent opacity-50"></div>

                            {/* Pro Header / Summary Bar */}
                            <div
                                onClick={() => {
                                    setIsCartExpanded(!isCartExpanded);
                                    triggerHaptic('medium');
                                }}
                                className={cn(
                                    "p-5 flex justify-between items-center cursor-pointer transition-all",
                                    isCartExpanded
                                        ? "bg-gradient-to-b from-[#4a7c59]/5 to-transparent border-b border-gray-100 dark:border-slate-800"
                                        : "bg-gradient-to-r from-[#4a7c59] to-[#4a7c59]/80 text-white shadow-xl"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2.5 rounded-2xl transition-all shadow-lg cursor-pointer",
                                        isCartExpanded ? "bg-[#4a7c59] text-white animate-pulse" : "bg-white text-[#4a7c59]"
                                    )}>
                                        <ShoppingCart size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn("font-black text-xs uppercase tracking-[0.15em]", isCartExpanded ? "text-gray-900 dark:text-white" : "text-white")}>
                                            ({cart.length})
                                        </span>
                                        {!isCartExpanded && (
                                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Bấm để hoàn tất</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 flex-1 justify-end">
                                    <div className="text-right flex flex-col items-end">
                                        <div className={cn("font-black text-xl leading-none tracking-tighter", isCartExpanded ? "text-[#4a7c59]" : "text-white")}>
                                            {formatNumber(totalAmount)}
                                        </div>
                                        {!isCartExpanded && <div className="text-[8px] font-bold uppercase tracking-widest opacity-60 text-right">Tổng tiền</div>}
                                    </div>
                                    {isCartExpanded && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setItemToDelete('all'); }}
                                            className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Cart Items (Expanded) */}
                            {isCartExpanded && (
                                <div className="max-h-[155px] overflow-y-auto no-scrollbar bg-transparent/10 dark:bg-slate-900/20 px-4 py-2">
                                    {[...cart].reverse().map((item, revIdx) => {
                                        const idx = cart.length - 1 - revIdx;
                                        return (
                                            <m.div key={idx} className="relative mb-1 last:mb-0 group">
                                                {/* Delete Action Background */}
                                                <div
                                                    className="absolute inset-y-0 right-0 w-20 bg-red-500 rounded-2xl flex items-center justify-center text-white"
                                                    onClick={() => setItemToDelete(idx)}
                                                >
                                                    <Trash2 size={20} />
                                                </div>

                                                <m.div
                                                    drag="x"
                                                    dragConstraints={{ left: -80, right: 0 }}
                                                    dragElastic={0.1}
                                                    className="flex items-center justify-between py-3 border-b border-gray-100/50 dark:border-slate-800/50 last:border-0 gap-3 bg-transparent relative z-10"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-extrabold text-[12px] text-gray-800 dark:text-gray-200 leading-tight uppercase truncate">
                                                            {item.product_name || item.name}
                                                        </div>
                                                        <div className="text-[9px] font-black text-[#4a7c59] mt-1 flex items-center gap-2">
                                                            {item.price === 0 ? (
                                                                <span className="bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase tracking-tighter text-[8px]">HÀNG TẶNG</span>
                                                            ) : (
                                                                <span>Giá nhập: {formatNumber(item.price)}đ</span>
                                                            )}
                                                            <span className="w-1 h-1 rounded-full bg-[#4a7c59]/30"></span>
                                                            <span className="text-gray-400">T.Tiền: {formatNumber(item.price * item.quantity)}đ</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center bg-transparent rounded-xl p-0.5 border border-gray-200 dark:border-white/5 shrink-0">
                                                        <button onClick={() => updateQuantity(idx, -1)} className="w-8 h-8 flex items-center justify-center text-[#4a7c59] active:scale-90 transition-transform"><Minus size={14} strokeWidth={3} /></button>
                                                        <input
                                                            ref={el => cartItemRefs.current[idx] = el}
                                                            type="number"
                                                            inputMode="numeric"
                                                            value={item.quantity}
                                                            onFocus={(e) => e.target.select()}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    setSearchTerm('');
                                                                    searchInputRef.current?.focus();
                                                                }
                                                            }}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                const newCart = [...cart];
                                                                newCart[idx].quantity = val;
                                                                if (val <= 0) {
                                                                    setItemToDelete(idx);
                                                                } else {
                                                                    setCart(newCart);
                                                                }
                                                            }}
                                                            className="text-xs font-black w-7 text-center bg-transparent outline-none dark:text-white"
                                                        />
                                                        <button onClick={() => updateQuantity(idx, 1)} className="w-8 h-8 flex items-center justify-center text-[#4a7c59] active:scale-90 transition-transform"><Plus size={14} strokeWidth={3} /></button>
                                                    </div>
                                                </m.div>
                                            </m.div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Compact Payment Method Selector */}
                            {isCartExpanded && (
                                <div className="px-5 py-2 border-t border-gray-100 dark:border-slate-800/50">
                                    <div className="flex p-1 bg-transparent rounded-[1.25rem] relative">
                                        {[
                                            { id: 'Cash', label: 'Tiền mặt' },
                                            { id: 'Bank', label: 'Chuyển khoản' },
                                            { id: 'Debt', label: 'Ghi nợ' }
                                        ].map(method => (
                                            <button
                                                key={method.id}
                                                onClick={() => { setPaymentMethod(method.id); triggerHaptic('light'); }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-xl text-[10px] font-black transition-all relative z-10",
                                                    paymentMethod === method.id
                                                        ? "text-white"
                                                        : "text-gray-500 dark:text-gray-400"
                                                )}
                                            >
                                                {method.label}
                                                {paymentMethod === method.id && (
                                                    <m.div
                                                        layoutId="active-method-purchase"
                                                        className="absolute inset-0 bg-[#4a7c59] rounded-xl -z-10 shadow-sm"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Bank Selector - Slim version */}
                                    {paymentMethod === 'Bank' && bankAccounts.length > 0 && (
                                        <m.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="mt-2 overflow-hidden"
                                        >
                                            <select
                                                value={selectedBankAccountId}
                                                onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                                className="w-full bg-transparent border border-gray-100 dark:border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold outline-none text-gray-700 dark:text-gray-200"
                                            >
                                                {bankAccounts.map(bank => (
                                                    <option key={bank.id} value={bank.id}>{bank.bank_name} - {bank.account_number}</option>
                                                ))}
                                            </select>
                                        </m.div>
                                    )}
                                </div>
                            )}

                            {/* Checkout Final Action */}
                            <div className={cn(
                                "p-5 pt-2 transition-all shrink-0",
                                isCartExpanded ? "bg-transparent border-t border-gray-100 dark:border-slate-800" : "hidden"
                            )}>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-[#4a7c59] text-white py-4 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-[#4a7c59]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <span>Lưu hóa đơn</span>
                                    <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                                        <ChevronRight size={18} />
                                    </div>
                                </button>
                            </div>
                        </m.div>
                    </m.div>
                )}
            </AnimatePresence>

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <AnimatePresence>
                {toast && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        className={cn(
                            "fixed top-24 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full shadow-2xl z-[70] font-bold text-xs flex items-center gap-2",
                            toast.type === 'success' ? "bg-transparent text-[#4a7c59] border border-[#4a7c59]/20" : "bg-red-500 text-white"
                        )}
                    >
                        <div className={cn("w-2 h-2 rounded-full", toast.type === 'success' ? "bg-[#4a7c59]" : "bg-white")}></div>
                        <span>{toast.message}</span>
                    </m.div>
                )}
            </AnimatePresence>
            <ConfirmModal
                isOpen={itemToDelete !== null}
                title={itemToDelete === 'all' ? "Xóa giỏ hàng?" : "Xóa sản phẩm?"}
                message={itemToDelete === 'all'
                    ? "Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng không?"
                    : `Bạn có chắc chắn muốn xóa "${cart[itemToDelete]?.product_name}" khỏi giỏ hàng?`}
                type="danger"
                onConfirm={() => {
                    if (itemToDelete === 'all') {
                        setCart([]);
                    } else {
                        setCart(cart.filter((_, i) => i !== itemToDelete));
                    }
                    setItemToDelete(null);
                }}
                onCancel={() => setItemToDelete(null)}
            />
            <MobilePartnerSelector
                isOpen={showPartnerSelector}
                onClose={() => setShowPartnerSelector(false)}
                onSelect={setSelectedPartner}
                selectedPartner={selectedPartner}
                type="Supplier"
            />

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
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nhập số lượng nhập kho</span>
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
                                        {[1, 2, 5, 10, 20, 50, 100].map(n => (
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
                                        <span>Thêm Nhập Kho (Enter)</span>
                                    </button>
                                </form>
                            </m.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
}
