import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Menu, X, Phone, MapPin, DollarSign } from 'lucide-react';
import { formatNumber, formatDebt, cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import MobileMenu from '../../components/MobileMenu';
import MobilePartnerEditModal from '../../components/MobilePartnerEditModal';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function MobilePartners() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [partners, setPartners] = useState([]);
    const [filterType, setFilterType] = useState('All'); // All, Customer, Supplier
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const LIMIT = 20;

    // Edit Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);

    useEffect(() => {
        setPage(1);
        fetchPartners(1);
    }, [filterType, searchTerm]);

    const fetchPartners = async (pageNum = page) => {
        if (pageNum === 1) setLoading(true);
        else setIsLoadingMore(true);

        try {
            const res = await axios.get('/api/partners', {
                params: {
                    limit: LIMIT,
                    page: pageNum,
                    search: searchTerm,
                    type: filterType
                }
            });
            const fetchedItems = res.data.items || res.data || [];
            
            if (pageNum === 1) {
                setPartners(fetchedItems);
            } else {
                setPartners(prev => [...prev, ...fetchedItems]);
            }
            
            // Check if there are more items to load
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
        fetchPartners(nextPage);
    };

    const handleSave = () => {
        fetchPartners();
        setIsModalOpen(false);
        setToast({ message: editingPartner ? "Cập nhật đối tác thành công!" : "Thêm đối tác thành công!", type: 'success' });
    };

    const openEdit = (partner) => {
        setEditingPartner(partner);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingPartner(null);
        setIsModalOpen(true);
    };

    const handleDelete = (partner) => {
        setConfirm({
            title: "Xác nhận xóa",
            message: `Bạn có chắc muốn xóa đối tác "${partner.name}"? Hành động này có thể ảnh hưởng đến lịch sử giao dịch.`,
            type: "danger",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/partners/${partner.id}`);
                    setToast({ message: "Xóa đối tác thành công!", type: "success" });
                    fetchPartners();
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
                        placeholder="Tìm tên, số điện thoại đối tác..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="absolute right-3 text-slate-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSearchTerm('')}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Partner Filter Control */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                    {[
                        { id: 'All', label: 'Tất cả' },
                        { id: 'Customer', label: 'Khách hàng' },
                        { id: 'Supplier', label: 'Nhà cung cấp' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => {
                                triggerHaptic && triggerHaptic('light');
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
            </div>

            {/* Partner Items List */}
            <div className="space-y-2.5">
                {loading ? (
                    <div className="text-center py-10 text-xs font-bold text-slate-400 uppercase animate-pulse">Đang tải đối tác...</div>
                ) : partners.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium">Không tìm thấy đối tác nào</div>
                ) : (
                    partners.map(p => (
                        <div 
                            key={p.id}
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
                        >
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{p.name}</span>
                                    {p.is_customer && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">Khách</span>
                                    )}
                                    {p.is_supplier && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">NCC</span>
                                    )}
                                </div>

                                {p.phone && (
                                    <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        <Phone size={14} />
                                        <span>{p.phone}</span>
                                    </a>
                                )}

                                {p.address && (
                                    <div className="flex items-center gap-1.5 text-xs font-normal text-slate-500 dark:text-slate-400 truncate">
                                        <MapPin size={14} className="shrink-0 text-slate-400" />
                                        <span className="truncate">{p.address}</span>
                                    </div>
                                )}

                                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                                    <span className="text-slate-400">Công nợ hiện tại:</span>
                                    <span className={cn(
                                        "font-extrabold text-sm tabular-nums",
                                        p.debt_balance > 0 ? "text-blue-600 dark:text-blue-400" : p.debt_balance < 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"
                                    )}>
                                        {formatDebt(p.debt_balance)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0">
                                <button 
                                    onClick={() => openEdit(p)}
                                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 android-touchable"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(p)}
                                    className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 android-touchable"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
                
                {/* Load More Button */}
                {hasMore && partners.length > 0 && (
                    <div className="pt-2 pb-4 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="px-6 py-2.5 bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 font-bold text-xs rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 disabled:opacity-50 android-touchable"
                        >
                            {isLoadingMore ? "Đang tải..." : "Xem thêm đối tác"}
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) Add Partner */}
            <button
                onClick={openAdd}
                className="fixed bottom-6 right-4 z-40 w-14 h-14 bg-primary dark:bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform android-touchable"
            >
                <Plus size={26} strokeWidth={2.5} />
            </button>

            {/* Modals & Overlays */}
            <MobilePartnerEditModal
                isOpen={isModalOpen}
                partner={editingPartner}
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
