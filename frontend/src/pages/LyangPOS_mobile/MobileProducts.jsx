import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { formatNumber, cn } from '../../lib/utils';
import MobileMenu from '../../components/MobileMenu';
import MobileProductEditModal from '../../components/MobileProductEditModal';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import useMobileNative from '../../hooks/useMobileNative';

export default function MobileProducts() {
    const { triggerHaptic } = useMobileNative();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const LIMIT = 20;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        setPage(1);
        fetchProducts(1);
        fetchCategories();
    }, [selectedCategory, filterType, searchTerm]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async (pageNum = page) => {
        if (pageNum === 1) setLoading(true);
        else setIsLoadingMore(true);
        
        try {
            const res = await axios.get('/api/products', {
                params: {
                    limit: LIMIT,
                    page: pageNum,
                    search: searchTerm,
                    category_id: selectedCategory,
                    filterType: filterType === 'all' ? '' : filterType,
                    include_inactive: true
                }
            });
            const fetchedItems = res.data.items || res.data || [];
            
            if (pageNum === 1) {
                setProducts(fetchedItems);
            } else {
                setProducts(prev => [...prev, ...fetchedItems]);
            }
            
            if (res.data.pages) {
                setHasMore(pageNum < res.data.pages);
            } else {
                setHasMore(fetchedItems.length === LIMIT);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage);
    };

    const handleSave = () => {
        fetchProducts();
        setIsModalOpen(false);
        setToast({ message: editingProduct ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!", type: 'success' });
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleDelete = (product) => {
        setConfirm({
            title: "Xác nhận xóa",
            message: `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`,
            type: "danger",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/products/${product.id}`);
                    setToast({ message: "Xóa sản phẩm thành công!", type: "success" });
                    fetchProducts();
                } catch (err) {
                    setToast({ message: err.response?.data?.error || "Lỗi khi xóa", type: "error" });
                }
                setConfirm(null);
            }
        });
    };

    return (
        <div className="p-3 space-y-3 no-print font-sans pb-6">
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Search Bar & Filter Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3 space-y-3">
                <div className="relative flex items-center">
                    <Search className="absolute left-3.5 text-slate-400" size={20} />
                    <input
                        className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl py-2.5 pl-11 pr-10 outline-none font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                        placeholder="Tìm sản phẩm theo tên, mã SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="absolute right-3 text-slate-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSearchTerm('')}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Filter Segmented Control */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'warning', label: 'Sắp hết hàng' },
                        { id: 'near_expiry', label: 'Cận hạn dùng' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => {
                                triggerHaptic('light');
                                setFilterType(f.id);
                            }}
                            className={cn(
                                "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all android-touchable",
                                filterType === f.id
                                    ? "bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Categories Slider */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border android-touchable",
                            selectedCategory === '' 
                                ? "bg-primary text-white border-primary shadow-xs dark:bg-emerald-600 dark:border-emerald-500" 
                                : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        )}
                    >
                        Tất cả loại
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border android-touchable",
                                selectedCategory === cat.id
                                    ? "bg-primary text-white border-primary shadow-xs dark:bg-emerald-600 dark:border-emerald-500" 
                                    : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Items List */}
            <div className="space-y-2.5">
                {loading ? (
                    <div className="text-center py-10 text-xs font-bold text-slate-400 uppercase animate-pulse">Đang tải danh sách...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium">Không tìm thấy sản phẩm nào</div>
                ) : (
                    products.map(prod => (
                        <div 
                            key={prod.id}
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{prod.name}</span>
                                    {prod.stock <= (prod.min_stock || 5) && (
                                        <span className="text-amber-500 shrink-0"><AlertTriangle size={16} /></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                    <span>Mã: {prod.sku || prod.code || '---'}</span>
                                    <span>•</span>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-300">{prod.unit}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div>
                                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Giá bán</span>
                                        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{formatNumber(prod.sale_price)}đ</span>
                                    </div>
                                    <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Giá vốn</span>
                                        <span className="font-semibold text-slate-600 dark:text-slate-300">{formatNumber(prod.cost_price)}đ</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <div className="text-right">
                                    <span className={cn(
                                        "font-extrabold text-sm px-2.5 py-1 rounded-xl inline-block",
                                        prod.stock <= 0
                                            ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                            : prod.stock <= (prod.min_stock || 5)
                                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    )}>
                                        Tồn: {prod.stock}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEdit(prod)}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 android-touchable"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(prod)}
                                        className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 android-touchable"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                
                {/* Load More Button */}
                {hasMore && products.length > 0 && (
                    <div className="pt-2 pb-4 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="px-6 py-2.5 bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 font-bold text-xs rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 disabled:opacity-50 android-touchable"
                        >
                            {isLoadingMore ? "Đang tải..." : "Xem thêm sản phẩm"}
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) Add Product */}
            <button
                onClick={openAdd}
                className="fixed bottom-6 right-4 z-40 w-14 h-14 bg-primary dark:bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform android-touchable"
            >
                <Plus size={26} strokeWidth={2.5} />
            </button>

            {/* Modals & Overlays */}
            <MobileProductEditModal
                isOpen={isModalOpen}
                product={editingProduct}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />

            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {confirm && (
                <ConfirmModal
                    isOpen={!!confirm}
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                    type={confirm.type}
                />
            )}
        </div>
    );
}
