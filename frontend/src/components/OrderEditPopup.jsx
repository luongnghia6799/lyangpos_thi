import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Plus, Search, User, CreditCard, FileText, ShoppingCart, Info, Warehouse, Clock, ArrowRight, Sprout, Coins } from 'lucide-react';
import { formatNumber, formatDate, cn, removeAccents } from '../lib/utils';
import ProductEditModal from './ProductEditModal';
import Toast from './Toast';
import Portal from './Portal';

export default function OrderEditPopup({ order, partner, onClose, onSave }) {
    const [cart, setCart] = useState((order?.details || []).map(d => ({
        ...d,
        product_id: d.product_id,
        quantity: d.quantity,
        price: d.price,
        unit: d.product_unit,
        secondary_unit: d.secondary_unit,
        multiplier: d.multiplier || 1,
        secondary_qty: d.quantity / (d.multiplier || 1),
        cartId: Math.random().toString(36).substr(2, 9)
    })));

    const parsedNote = useMemo(() => {
        const lines = (order.note || '').split('\n');
        const logs = [];
        const cleanLines = [];
        const logPattern = /^-?\s*\[([\d/]+\s+[\d:]+)\]\s*(.*)$/;
        lines.forEach(line => {
            const match = line.match(logPattern);
            if (match) {
                logs.push({
                    timestamp: match[1],
                    content: match[2]
                });
            } else {
                cleanLines.push(line);
            }
        });
        return { logs, cleanNote: cleanLines.join('\n').trim() };
    }, [order.note]);

    const [note, setNote] = useState(parsedNote.cleanNote);
    const consignmentLogs = parsedNote.logs;
    const [amountPaid, setAmountPaid] = useState(order.amount_paid || 0);
    const [cashGiven, setCashGiven] = useState(order.cash_given || 0);
    const [paymentMethod, setPaymentMethod] = useState(order.payment_method || (order.amount_paid >= order.total_amount ? 'Cash' : 'Debt'));
    const [loading, setLoading] = useState(false);
    const [isConsignment, setIsConsignment] = useState(order.is_consignment || false);

    // Special handling for Opening Debt
    const isOpeningDebt = order.display_id === '#NODAU' || order.display_id === 'NODAU';
    const [openingAmount, setOpeningAmount] = useState(order.total_amount || 0);
    const [openingType, setOpeningType] = useState(order.type || 'Sale'); // Sale=Khách nợ mình, Purchase=Mình nợ khách
    const [searchTerm, setSearchTerm] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [toast, setToast] = useState(null);
    const [products, setProducts] = useState([]);
    
    // New product modal state
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [loadedPartner, setLoadedPartner] = useState(partner || null);

    const searchInputRef = useRef(null);
    const cashGivenInputRef = useRef(null);

    useEffect(() => {
        if (!partner && order.partner_id) {
            axios.get('/api/partners')
                .then(res => {
                    const list = res.data.items || res.data || [];
                    const p = list.find(x => x.id === order.partner_id);
                    if (p) setLoadedPartner(p);
                })
                .catch(err => console.error("Failed to load partner in OrderEditPopup", err));
        } else {
            setLoadedPartner(partner);
        }
    }, [partner, order.partner_id]);

    const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

    useEffect(() => {
        if (paymentMethod === 'Cash') {
            setAmountPaid(totalAmount);
            setCashGiven(totalAmount);
        }
    }, [totalAmount, paymentMethod]);
    const oldDebt = useMemo(() => {
        if (!loadedPartner) return 0;
        let base = loadedPartner.debt_balance || 0;
        if (order.payment_method === 'Debt') {
            if (order.type === 'Sale') base -= order.total_amount;
            else base += order.total_amount;
        }
        base += (order.amount_paid || 0);
        return base;
    }, [loadedPartner, order]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setProducts(res.data);
        } catch (err) { console.error(err); }
    };

    const updateItem = (cartId, field, value) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.cartId !== cartId) return item;

            const updatedItem = { ...item };
            if (field === 'secondary_qty') {
                updatedItem.secondary_qty = value;
                updatedItem.quantity = value * updatedItem.multiplier;
            } else if (field === 'quantity') {
                updatedItem.quantity = value;
                updatedItem.secondary_qty = value / updatedItem.multiplier;
            } else if (field === 'price') {
                updatedItem.price = value;
                updatedItem.is_manual_price = true;
            } else {
                updatedItem[field] = value;
            }

            if ((field === 'quantity' || field === 'secondary_qty') && order.type === 'Sale') {
                const p = products.find(prod => prod.id === updatedItem.product_id);
                if (p) {
                    const isBulk = p.bulk_quantity > 0 && updatedItem.quantity >= p.bulk_quantity;
                    const expectedPrice = isBulk ? (p.bulk_price || p.sale_price) : p.sale_price;
                    const isCurrentPriceDefault = (updatedItem.price === p.sale_price) || (p.bulk_price > 0 && updatedItem.price === p.bulk_price);
                    
                    if (!updatedItem.is_manual_price && isCurrentPriceDefault) {
                        updatedItem.price = expectedPrice;
                    }
                }
            }

            return updatedItem;
        }));
    };

    const removeItem = (cartId) => {
        setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
    };

    const handleSave = async () => {
        if (cart.length === 0 && !isOpeningDebt) return;
        setLoading(true);
        try {
            let finalNote = note.trim();
            if (consignmentLogs.length > 0) {
                const logsText = consignmentLogs.map(l => `- [${l.timestamp}] ${l.content}`).join('\n');
                finalNote = finalNote ? `${finalNote}\n\n${logsText}` : logsText;
            }

            const data = isOpeningDebt ? {
                partner_id: order.partner_id,
                type: openingType,
                payment_method: 'Debt',
                total_amount: openingAmount,
                note: finalNote,
                amount_paid: 0,
                details: []
            } : {
                partner_id: order.partner_id,
                type: order.type,
                payment_method: paymentMethod,
                details: cart.map(d => ({
                    product_id: d.product_id,
                    quantity: d.quantity,
                    price: d.price,
                    product_name: d.product_name
                })),
                note: finalNote,
                amount_paid: amountPaid,
                cash_given: cashGiven,
                is_consignment: isConsignment
            };
            await axios.put(`/api/orders/${order.id}`, data);
            onSave();
        } catch (err) {
            setToast({ message: err.response?.data?.error || "Lỗi khi lưu", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (p) => {
        const cartId = Math.random().toString(36).substr(2, 9);
        const isBulk = p.bulk_quantity > 0 && 1 >= p.bulk_quantity;
        const initialPrice = order.type === 'Sale' 
            ? (isBulk ? (p.bulk_price || p.sale_price) : p.sale_price) 
            : p.cost_price;
        setCart(prev => [
            {
                product_id: p.id,
                product_name: p.name,
                product_unit: p.unit,
                secondary_unit: p.secondary_unit,
                multiplier: p.multiplier || 1,
                quantity: 1,
                secondary_qty: 1 / (p.multiplier || 1),
                price: initialPrice,
                is_manual_price: false,
                cartId
            },
            ...prev
        ]);
        setSearchTerm('');
        setIsProductDropdownOpen(false);
        setActiveIndex(0);

        // Autofocus quantity input for this new item
        setTimeout(() => {
            const sec = document.getElementById(`edit-sec-qty-${cartId}`);
            if (sec && p.secondary_unit) {
                sec.focus();
                sec.select();
            } else {
                const main = document.getElementById(`edit-main-qty-${cartId}`);
                main?.focus();
                main?.select();
            }
        }, 100);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.keyCode === 112 || e.key === 'F1') {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => {
                    cashGivenInputRef.current?.focus();
                    cashGivenInputRef.current?.select();
                }, 50);
                return;
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [onClose]);

    const filteredProducts = useMemo(() => {
        const s = searchTerm.toLowerCase();
        if (!s) return [];
        const sNoAccent = removeAccents(s);
        return products.filter(p => {
            const name = p.name.toLowerCase();
            const code = (p.code || '').toLowerCase();
            return name.includes(s) || removeAccents(name).includes(sNoAccent) ||
                   code.includes(s) || removeAccents(code).includes(sNoAccent);
        }).slice(0, 10);
    }, [products, searchTerm]);

    return (
        <Portal>
            <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md">
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 cursor-pointer"
                />
                
                <m.div
                    initial={{ scale: 0.96, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 15 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    className="bg-white dark:bg-slate-950 border-2 border-[#d4a574]/30 dark:border-emerald-500/20 w-full max-w-7xl h-[92vh] max-h-[92vh] rounded-[2.5rem] shadow-[0_0_80px_rgba(16,185,129,0.15)] flex flex-col relative z-10 overflow-hidden text-slate-800 dark:text-white"
                >
                    {/* Header */}
                    <div className="px-8 py-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-transparent shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                {order.type === 'Sale' ? <ShoppingCart size={22} className="stroke-[2.5]" /> : <FileText size={22} className="stroke-[2.5]" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-wider leading-tight">
                                    Chi Tiết Hóa Đơn #{order.display_id}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                    <span className={cn("px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 font-bold")}>
                                        {order.type === 'Sale' ? 'Bán lẻ' : 'Nhập hàng'}
                                    </span>
                                    <span>•</span>
                                    <span>Đối tác: {order.partner_name || loadedPartner?.name || 'Khách Vãng Lai'}</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-transparent">
                        {isOpeningDebt ? (
                            <div className="flex-1 p-8 flex flex-col items-center justify-center">
                                <div className="max-w-md w-full space-y-8 text-center">
                                    <div className="space-y-2">
                                        <h4 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Điều chỉnh nợ đầu kỳ</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Nhập số tiền dư nợ tại thời điểm bắt đầu</p>
                                    </div>

                                    <div className="p-1.5 bg-slate-150 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl flex gap-1.5 mt-8">
                                        <button
                                            onClick={() => setOpeningType('Sale')}
                                            className={cn("flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all cursor-pointer", openingType === 'Sale' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5")}
                                        >Khách nợ mình</button>
                                        <button
                                            onClick={() => setOpeningType('Purchase')}
                                            className={cn("flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all cursor-pointer", openingType === 'Purchase' ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5")}
                                        >Mình nợ khách</button>
                                    </div>

                                    <div className="relative mt-8">
                                        <input
                                            type="number"
                                            className="w-full p-8 bg-slate-100 dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:border-emerald-500 font-black text-5xl text-center text-emerald-600 dark:text-emerald-400 shadow-2xl transition-all"
                                            value={openingAmount}
                                            onChange={e => setOpeningAmount(parseFloat(e.target.value) || 0)}
                                            autoFocus
                                            onFocus={e => e.target.select()}
                                        />
                                        <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                                            <span className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-lg">VNĐ</span>
                                        </div>
                                    </div>

                                    <p className="mt-12 text-xs text-slate-500 font-bold italic">
                                        * Lưu ý: Việc thay đổi này sẽ ảnh hưởng trực tiếp đến tổng nợ hiện tại của đối tác.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Left: Cart Editing */
                            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-white/5">
                                {/* Search Bar */}
                                <div className="p-5 border-b border-slate-200 dark:border-white/5">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-4 text-slate-400" size={18} />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="🔍 Tìm sản phẩm thêm vào đơn (Enter khi trống để thêm sản phẩm mới)..."
                                            className="w-full pl-11 p-4 bg-transparent/50 dark:bg-white/5 border-0 border-transparent focus:border-transparent focus:ring-0 ring-0 outline-none focus:outline-none font-black text-base uppercase tracking-wider text-emerald-800 dark:text-white placeholder-slate-450 transition-all"
                                            value={searchTerm}
                                            onChange={e => { setSearchTerm(e.target.value); setIsProductDropdownOpen(true); setActiveIndex(0); }}
                                            onKeyDown={e => {
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setActiveIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setActiveIndex(prev => Math.max(prev - 1, 0));
                                                } else if (e.key === 'Enter') {
                                                    if (filteredProducts.length > 0 && filteredProducts[activeIndex]) {
                                                        e.preventDefault();
                                                        addToCart(filteredProducts[activeIndex]);
                                                    } else if (searchTerm.trim() !== '') {
                                                        // No matching products found, trigger product creation modal
                                                        e.preventDefault();
                                                        setIsNewProductModalOpen(true);
                                                    }
                                                }
                                            }}
                                        />
                                        <AnimatePresence>
                                            {isProductDropdownOpen && filteredProducts.length > 0 && (
                                                <m.div
                                                    key="product-dropdown"
                                                    initial={{ opacity: 0, y: 10 }} 
                                                    animate={{ opacity: 1, y: 0 }} 
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden backdrop-blur-[24px]"
                                                >
                                                    {filteredProducts.map((p, pIdx) => (
                                                        <div
                                                            key={p.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToCart(p);
                                                            }}
                                                            className={cn(
                                                                "p-3.5 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-100 dark:border-white/5 last:border-b-0",
                                                                pIdx === activeIndex ? "bg-emerald-500 text-white" : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                                            )}
                                                        >
                                                            <div>
                                                                <div className={cn("font-black text-base uppercase tracking-wider transition-all duration-300", pIdx === activeIndex ? "text-white pl-3" : "text-emerald-800 dark:text-white pl-0")}>{p.name}</div>
                                                                <div className={cn("text-[10px] uppercase font-black tracking-wider mt-0.5 transition-all duration-300", pIdx === activeIndex ? "text-white/80 pl-3" : "text-slate-500 dark:text-slate-400 pl-0")}>{p.unit} • {formatNumber(order.type === 'Sale' ? p.sale_price : p.cost_price)}đ</div>
                                                            </div>
                                                            <Plus size={16} className={pIdx === activeIndex ? "text-white" : "text-emerald-500 dark:text-emerald-400"} />
                                                        </div>
                                                    ))}
                                                </m.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                        <thead className="text-[10px] font-black uppercase text-slate-400 tracking-widest sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 p-2">
                                            <tr>
                                                <th className="p-3">Sản phẩm</th>
                                                <th className="p-3 w-36">Quy cách</th>
                                                <th className="p-3 w-32">Số lượng</th>
                                                <th className="p-3 w-40">Đơn giá</th>
                                                <th className="p-3 text-right">Thành tiền</th>
                                                <th className="p-3 w-12 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.map((item, idx) => (
                                                <tr key={item.cartId} className="bg-slate-50 dark:bg-white/5 rounded-2xl overflow-hidden hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5 group">
                                                    <td className="p-4 rounded-l-2xl">
                                                        <div className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{item.product_name}</div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mt-0.5">{item.unit}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-0 border-transparent focus:border-transparent focus:ring-0 ring-0 outline-none focus:outline-none text-center font-black text-xs text-emerald-600 dark:text-emerald-400"
                                                                id={`edit-sec-qty-${item.cartId}`}
                                                                value={item.secondary_qty}
                                                                onFocus={e => e.target.select()}
                                                                onChange={e => updateItem(item.cartId, 'secondary_qty', parseFloat(e.target.value) || 0)}
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{item.secondary_unit || '...'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="bg-slate-100 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-0 border-transparent focus:border-transparent focus:ring-0 ring-0 outline-none focus:outline-none text-center font-black text-xs text-slate-850 dark:text-white"
                                                                id={`edit-main-qty-${item.cartId}`}
                                                                value={item.quantity}
                                                                onFocus={e => e.target.select()}
                                                                onChange={e => updateItem(item.cartId, 'quantity', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="bg-slate-100 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent border-0 border-transparent focus:border-transparent focus:ring-0 ring-0 outline-none focus:outline-none text-right font-black text-xs text-amber-600 dark:text-amber-400"
                                                                id={`edit-price-${item.cartId}`}
                                                                value={item.price}
                                                                onFocus={e => e.target.select()}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        searchInputRef.current?.focus();
                                                                        searchInputRef.current?.select();
                                                                    }
                                                                }}
                                                                onChange={e => updateItem(item.cartId, 'price', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right font-black text-slate-850 dark:text-white text-sm">
                                                        {formatNumber(item.price * item.quantity)}đ
                                                    </td>
                                                    <td className="p-4 text-center rounded-r-2xl">
                                                        <button 
                                                            onClick={() => removeItem(item.cartId)} 
                                                            className="text-slate-500 hover:text-rose-450 dark:hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Right: Payment & Summary */}
                        <div className="w-full lg:w-[400px] bg-slate-50 dark:bg-slate-950/30 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar border-l border-slate-200 dark:border-white/5">
                            <div className="space-y-5">
                                {order.type === 'Purchase' && (
                                    <div className="flex justify-between items-center bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2">
                                            <Warehouse size={16} className="text-amber-500 dark:text-amber-400" />
                                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest">Đơn hàng gửi kho:</span>
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
                                                    ? "bg-emerald-500 after:translate-x-4" 
                                                    : "bg-slate-300 dark:bg-slate-700"
                                            )}></div>
                                        </label>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-widest ml-1">Hình thức thanh toán</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setPaymentMethod('Cash');
                                                setAmountPaid(totalAmount);
                                                setCashGiven(totalAmount);
                                            }}
                                            className={cn("p-3.5 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 border-2 transition-all cursor-pointer", paymentMethod === 'Cash' ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20" : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10")}
                                        >
                                            <CreditCard size={18} className={paymentMethod === 'Cash' ? "text-white" : "text-emerald-600 dark:text-emerald-400"} /> Tiền mặt
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPaymentMethod('Debt');
                                                setAmountPaid(0);
                                                setCashGiven(0);
                                            }}
                                            className={cn("p-3.5 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 border-2 transition-all cursor-pointer", paymentMethod === 'Debt' ? "bg-amber-500 border-amber-450 text-white shadow-lg shadow-amber-500/20" : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10")}
                                        >
                                            <FileText size={18} className={paymentMethod === 'Debt' ? "text-white" : "text-amber-500 dark:text-amber-400"} /> Công nợ
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-widest ml-1">Khách đưa (F1)</label>
                                        <div className="relative group">
                                            <input
                                                ref={cashGivenInputRef}
                                                type="number"
                                                className="w-full p-4 bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10 focus:border-emerald-500/50 rounded-2xl outline-none font-black text-lg text-emerald-600 dark:text-emerald-400 text-right"
                                                value={cashGiven === 0 ? '' : cashGiven}
                                                placeholder="0"
                                                autoComplete="off"
                                                onChange={e => setCashGiven(parseFloat(e.target.value) || 0)}
                                                onFocus={e => e.target.select()}
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                                                <div className="text-[10px] font-black text-slate-500 uppercase">₫</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {cashGiven > totalAmount && (
                                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex justify-between items-center animate-in zoom-in-95 duration-200">
                                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Tiền thối lại</span>
                                        <span className="text-xl font-black text-emerald-650 dark:text-emerald-400">{formatNumber(cashGiven - totalAmount)}đ</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-widest ml-1">Thanh toán (Đã trả)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10 focus:border-emerald-500/50 rounded-2xl outline-none font-black text-lg text-emerald-600 dark:text-emerald-400 text-right"
                                            value={amountPaid}
                                            autoComplete="off"
                                            onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                                            onFocus={e => e.target.select()}
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                                            <button
                                                onClick={() => { setAmountPaid(totalAmount); setCashGiven(totalAmount); }}
                                                className="text-[9px] font-black text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-450 uppercase cursor-pointer"
                                            >Hóa đơn</button>
                                            {paymentMethod === 'Debt' && (
                                                <button
                                                    onClick={() => setAmountPaid(totalAmount + (oldDebt > 0 ? oldDebt : 0))}
                                                    className="text-[9px] font-black text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-450 uppercase border-l pl-2 border-slate-300 dark:border-white/10 cursor-pointer"
                                                >Tổng nợ</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-widest ml-1">Ghi chú đơn hàng</label>
                                    <textarea
                                        className="w-full p-4 bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10 focus:border-emerald-500/50 rounded-2xl outline-none font-bold text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 min-h-[80px]"
                                        placeholder="Nội dung ghi chú..."
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                    />
                                </div>

                                {consignmentLogs.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-widest ml-1 flex items-center gap-1.5">
                                            <Clock size={12} className="text-amber-500" /> Lịch sử nhận hàng gửi kho
                                        </label>
                                        <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 max-h-[180px] overflow-y-auto custom-scrollbar space-y-3">
                                            {consignmentLogs.map((log, idx) => (
                                                <div key={idx} className="flex gap-2.5 text-[11px] relative">
                                                    {idx !== consignmentLogs.length - 1 && (
                                                        <div className="absolute left-[7px] top-4 bottom-[-16px] w-[1.5px] bg-amber-500/20" />
                                                    )}
                                                    <div className="w-3.5 h-3.5 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center shrink-0 z-10 mt-0.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-700 dark:text-slate-300 leading-snug break-words">
                                                            {log.content}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                                                            {log.timestamp}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/15 space-y-3 shrink-0">
                                {isOpeningDebt ? null : (
                                    <>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tổng cộng</span>
                                            <span className="text-2xl font-black text-slate-800 dark:text-white">{formatNumber(totalAmount)}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Còn lại</span>
                                            <span className={cn("text-sm font-black", totalAmount - amountPaid > 0 ? "text-rose-600 dark:text-rose-450" : "text-emerald-600 dark:text-emerald-450")}>
                                                {formatNumber(totalAmount - amountPaid)}đ
                                            </span>
                                        </div>
                                    </>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10 cursor-pointer"
                                >
                                    <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu cập nhật'}
                                </button>
                            </div>
                        </div>
                    </div>
                </m.div>
                
                <AnimatePresence>
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast(null)}
                        />
                    )}
                </AnimatePresence>

                {/* Dynamic Product Creation Modal */}
                {isNewProductModalOpen && (
                    <ProductEditModal
                        isOpen={isNewProductModalOpen}
                        product={{ name: searchTerm }}
                        onClose={() => setIsNewProductModalOpen(false)}
                        onSave={async () => {
                            try {
                                const res = await axios.get('/api/products');
                                setProducts(res.data);
                                if (res.data && res.data.length > 0) {
                                    // Sort to find newest product (highest ID)
                                    const sorted = [...res.data].sort((a, b) => b.id - a.id);
                                    const newestProduct = sorted[0];
                                    if (newestProduct) {
                                        addToCart(newestProduct);
                                    }
                                }
                            } catch (err) {
                                console.error(err);
                            }
                            setIsNewProductModalOpen(false);
                        }}
                    />
                )}
            </div>
        </Portal>
    );
}
