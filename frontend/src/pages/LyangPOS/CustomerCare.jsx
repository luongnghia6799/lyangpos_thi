import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';

const {
    Search, Plus, Check, Gift, Users, Trash2, Calendar, Wheat, Sprout,
    MoreHorizontal, Filter, AlertCircle, X, Loader2, ChevronDown, Package,
    PartyPopper, Utensils, Beer, Wine, Cake, Star, Heart, Award, Zap, Flag,
    Bookmark, Camera, Music, Coffee, Pizza, ShoppingBag, CreditCard,
    Briefcase, Umbrella, Sun, Moon, Cloud, Snowflake, Flame, Crown, Gem,
    Trophy, Medal, Smile, ThumbsUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} = LucideIcons;

const AVAILABLE_ICONS = [
    'Gift', 'PartyPopper', 'Cake', 'Beer', 'Wine', 'Utensils', 'Pizza', 'Coffee',
    'Star', 'Heart', 'Crown', 'Gem', 'Trophy', 'Medal', 'Award', 'Zap',
    'Flag', 'Bookmark', 'Camera', 'Music', 'ShoppingBag', 'CreditCard',
    'Briefcase', 'Sun', 'Moon', 'Cloud', 'Snowflake', 'Flame', 'Smile', 'ThumbsUp'
];

// Helper to popover positioning
const Popover = ({ options, onSelect, onClose, style }) => {
    return (
        <div style={style} className="fixed mt-2 bg-[#faf8f3] dark:bg-slate-950 rounded-xl border border-border p-2 min-w-[150px] z-[9999] flex flex-col gap-1 shadow-none">
            <div className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1 mb-1">Chọn quà tặng</div>
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={(e) => { e.stopPropagation(); onSelect(opt); }}
                    className="text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-between group"
                >
                    <span>{opt}</span>
                    <Check size={14} className="opacity-0 group-hover:opacity-50" />
                </button>
            ))}
            <div className="h-px bg-transparent dark:bg-slate-700 my-1" />
            <button
                onClick={(e) => { e.stopPropagation(); onSelect(null); }} // null means remove/untick
                className="text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            >
                Hủy / Xóa
            </button>
        </div>
    );
};

export default function CustomerCare() {
    const [partners, setPartners] = useState([]);
    const [events, setEvents] = useState([]);
    const [logs, setLogs] = useState({}); // Map: "eventId-partnerId" -> { id, gift_type, ... }
    const [loading, setLoading] = useState(true);
    const [quickAddName, setQuickAddName] = useState('');

    // Modals
    const [showAddEvent, setShowAddEvent] = useState(false);

    // Form States
    const [eventForm, setEventForm] = useState({ name: '', gift_types: '', icon: 'Gift' });
    const [editEventId, setEditEventId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Active Popover State: { partnerId, eventId, x, y }
    const [activePopover, setActivePopover] = useState(null);
    // Header Menu State for Bulk Action: { eventId, x, y }
    const [activeHeaderMenu, setActiveHeaderMenu] = useState(null);

    // Filters
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({ eventId: 'all', status: 'all', giftType: 'all' });

    // Explicit Selection State (Set of IDs)
    const [selectedPartnerIds, setSelectedPartnerIds] = useState(new Set());

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Include supplier=false handling in backend if needed, or filter here
            const [pRes, eRes, lRes] = await Promise.all([
                axios.get('/api/partners?is_customer=true'),
                axios.get('/api/events'),
                axios.get('/api/event-logs')
            ]);

            // Filter helpers
            setPartners(pRes.data.filter(p => p.type !== 'Supplier'));
            setEvents(eRes.data);

            // Build logs map
            const logsMap = {};
            lRes.data.forEach(log => {
                logsMap[`${log.event_id}-${log.partner_id}`] = log;
            });
            setLogs(logsMap);

        } catch (err) {
            console.error(err);
            showToast('Lỗi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered partners logic (can be extended)
    const filteredPartners = useMemo(() => {
        let result = partners;

        // 1. Quick Search Filter
        if (quickAddName) {
            const lower = quickAddName.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.phone && p.phone.includes(lower))
            );
        }

        // 2. Apply complex filters
        if (filters.eventId !== 'all') {
            result = result.filter(p => {
                const key = `${filters.eventId}-${p.id}`;
                const log = logs[key];

                // Status Filter
                if (filters.status === 'received') {
                    if (!log) return false;
                    // Gift Type Filter (only relevant if received)
                    if (filters.giftType !== 'all') {
                        return log.gift_type === filters.giftType;
                    }
                    return true;
                } else if (filters.status === 'not_received') {
                    return !log;
                }

                // If status is 'all', check gift type if specified
                if (filters.giftType !== 'all') {
                    return log && log.gift_type === filters.giftType;
                }

                return true;
            });
        } else if (filters.status !== 'all' || filters.giftType !== 'all') {
            // "Global" check (Any event) - harder to define "not_received" globally (means received nothing ever?)
            // Let's interpret "received" as "received at least one thing in ANY event"
            result = result.filter(p => {
                const partnerLogs = Object.values(logs).filter(l => l.partner_id === p.id);
                const hasReceivedAny = partnerLogs.length > 0;

                if (filters.status === 'received') {
                    if (!hasReceivedAny) return false;
                    if (filters.giftType !== 'all') {
                        return partnerLogs.some(l => l.gift_type === filters.giftType);
                    }
                    return true;
                } else if (filters.status === 'not_received') {
                    return !hasReceivedAny;
                }

                if (filters.giftType !== 'all') {
                    return partnerLogs.some(l => l.gift_type === filters.giftType);
                }
                return true;
            });
        }

        return result;
    }, [partners, quickAddName, filters, logs]);

    // Pagination Logic
    useEffect(() => {
        setCurrentPage(1);
    }, [quickAddName, filters]); // Reset page on filter change

    const paginatedPartners = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPartners.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPartners, currentPage]);

    const totalPages = Math.ceil(filteredPartners.length / ITEMS_PER_PAGE);

    const handleSaveEvent = async () => {
        if (!eventForm.name.trim()) return;
        setSubmitting(true);
        try {
            if (editEventId) {
                const res = await axios.put(`/api/events/${editEventId}`, {
                    name: eventForm.name,
                    gift_types: eventForm.gift_types,
                    icon: eventForm.icon
                });
                setEvents(events.map(e => e.id === editEventId ? res.data : e));
                showToast('Cập nhật sự kiện thành công');
            } else {
                const res = await axios.post('/api/events', {
                    name: eventForm.name,
                    gift_types: eventForm.gift_types,
                    icon: eventForm.icon
                });
                setEvents([res.data, ...events]);
                showToast('Tạo sự kiện thành công');
            }

            setEventForm({ name: '', gift_types: '', icon: 'Gift' });
            setEditEventId(null);
            setShowAddEvent(false);
        } catch (err) {
            showToast('Lỗi lưu sự kiện', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
        try {
            await axios.delete(`/api/events/${id}`);
            setEvents(events.filter(e => e.id !== id));
            showToast('Đã xóa sự kiện');
        } catch (err) {
            showToast('Lỗi xóa sự kiện', 'error');
        }
    };

    const handleQuickAddPartner = async (e) => {
        if (e.key === 'Enter') {
            if (!quickAddName.trim()) return;

            // Check exact match to prevent dupes
            const exactMatch = partners.find(p => p.name.toLowerCase() === quickAddName.trim().toLowerCase());
            if (exactMatch) {
                showToast('Khách hàng này đã có trong danh sách!', 'warning');
                return;
            }

            try {
                const res = await axios.post('/api/partners', {
                    name: quickAddName,
                    is_customer: true,
                    is_supplier: false
                });
                setPartners([res.data, ...partners]);
                showToast(`Đã thêm khách: ${quickAddName}`);
                setQuickAddName(''); // clear input
            } catch (err) {
                showToast('Lỗi thêm khách hàng', 'error');
            }
        }
    };

    const handleCellClick = (partnerId, event, e) => {
        // If event has multiple gift types
        if (event.gift_types) {
            const rect = e.currentTarget.getBoundingClientRect();
            // Open popover
            setActivePopover({
                partnerId,
                eventId: event.id,
                x: rect.left + rect.width / 2,
                y: rect.bottom
            });
        } else {
            // Standard Toggle
            toggleLog(partnerId, event.id, null);
        }
    };

    const toggleLog = async (partnerId, eventId, specificGiftType = null) => {
        setActivePopover(null); // Close any popover

        const key = `${eventId}-${partnerId}`;
        const currentLog = logs[key];

        // Optimistic Update
        setLogs(prev => {
            const next = { ...prev };
            // If toggling OFF (same type or generic toggle on existing)
            if (currentLog && (specificGiftType === null || currentLog.gift_type === specificGiftType)) {
                delete next[key];
            } else {
                // Toggling ON or Changing Type
                next[key] = {
                    event_id: eventId,
                    partner_id: partnerId,
                    gift_type: specificGiftType,
                    completed_at: new Date().toISOString()
                };
            }
            return next;
        });

        try {
            await axios.post('/api/event-logs/toggle', {
                event_id: eventId,
                partner_id: partnerId,
                gift_type: specificGiftType
            });
        } catch (err) {
            // Revert
            setLogs(prev => {
                const next = { ...prev };
                if (currentLog) next[key] = currentLog;
                else delete next[key];
                return next;
            });
            showToast('Lỗi cập nhật', 'error');
        }
    };

    // Selection Handlers
    const toggleSelectAllFiltered = () => {
        const newSelected = new Set(selectedPartnerIds);
        const allFilteredSelected = filteredPartners.every(p => newSelected.has(p.id));

        if (allFilteredSelected) {
            // Deselect all filtered
            filteredPartners.forEach(p => newSelected.delete(p.id));
        } else {
            // Select all filtered
            filteredPartners.forEach(p => newSelected.add(p.id));
        }
        setSelectedPartnerIds(newSelected);
    };

    const toggleSelectPartner = (id) => {
        const newSelected = new Set(selectedPartnerIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedPartnerIds(newSelected);
    };

    const clearSelection = () => setSelectedPartnerIds(new Set());

    const handleBulkAction = async (eventId, giftType) => {
        // Target: If selection exists, use selection. Else default to ALL filtered (legacy/fallback behavior or maybe restrict?)
        // Requirement: "thêm vào current selection, rồi mới thao tác hàng loạt cho nhóm đã lọc" -> This implies Selection is the KEY.

        const targetIds = selectedPartnerIds.size > 0
            ? Array.from(selectedPartnerIds)
            : filteredPartners.map(p => p.id); // Fallback: if no selection, apply to all visible rows (optional, but good UX)

        if (targetIds.length === 0) {
            showToast('Chưa chọn khách hàng nào', 'warning');
            return;
        }

        const msg = selectedPartnerIds.size > 0
            ? `Bạn có chắc muốn tặng "${giftType || 'Đã nhận'}" cho ${selectedPartnerIds.size} khách hàng ĐÃ CHỌN?`
            : `Bạn có chắc muốn tặng "${giftType || 'Đã nhận'}" cho TẤT CẢ ${filteredPartners.length} khách hàng hiển thị?`;

        if (!window.confirm(msg)) return;

        setActiveHeaderMenu(null);
        setLoading(true);

        try {
            // Create bulk logs
            const promises = targetIds.map(pid => {
                return axios.post('/api/event-logs/toggle', {
                    event_id: eventId,
                    partner_id: pid,
                    gift_type: giftType
                });
            });

            await Promise.all(promises);
            showToast(`Đã áp dụng thành công cho ${targetIds.length} khách hàng`);
            fetchData(); // Refresh all
            // Keep selection? Or clear? Usually keeping is safer in case of mistake, user can change mind.
            // But let's verify if user wants to clear. Maybe clear to avoid confusion.
            // clearSelection(); 
        } catch (e) {
            showToast('Lỗi thao tác hàng loạt', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 pb-20 w-full transition-colors relative">
            <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">

                <div className="flex items-center gap-3 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                            <Heart className="text-primary" size={32} />
                            Chăm Sóc Khách Hàng
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Quản lý quà tặng & sự kiện</p>
                        </div>
                    </div>
                </div>



                <div className="flex gap-2">
                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={cn(
                                "px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all border",
                                (filters.eventId !== 'all' || filters.status !== 'all' || filters.giftType !== 'all')
                                    ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white border-transparent"
                                    : "bg-transparent text-primary dark:text-[#d4a574] border-border hover:bg-primary/10"
                            )}
                        >
                            <Filter size={18} strokeWidth={2.5} />
                            <span>Bộ lọc</span>
                            {(filters.eventId !== 'all' || filters.status !== 'all' || filters.giftType !== 'all') && (
                                <div className="bg-white text-primary text-[10px] w-5 h-5 rounded-full flex items-center justify-center -ml-1 border border-border">!</div>
                            )}
                        </button>

                        <AnimatePresence>
                            {showFilter && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                                    <m.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-[300px] bg-[#faf8f3] dark:bg-slate-950 rounded-2xl border border-border p-4 z-50 flex flex-col gap-3 shadow-none"
                                    >
                                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Bộ lọc tìm kiếm</span>
                                            {(filters.eventId !== 'all' || filters.status !== 'all' || filters.giftType !== 'all') && (
                                                <button
                                                    onClick={() => setFilters({ eventId: 'all', status: 'all', giftType: 'all' })}
                                                    className="text-[10px] font-bold text-red-500 hover:underline"
                                                >
                                                    Xóa lọc
                                                </button>
                                            )}
                                        </div>

                                        {/* Event Filter */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Sự kiện</label>
                                            <select
                                                value={filters.eventId}
                                                onChange={e => setFilters({ ...filters, eventId: e.target.value, giftType: 'all' })}
                                                className="w-full bg-transparent border border-border focus:border-primary rounded-lg px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none"
                                            >
                                                <option value="all">Tất cả sự kiện</option>
                                                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Trạng thái</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setFilters({ ...filters, status: 'all' })}
                                                    className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all", filters.status === 'all' ? "bg-gray-200 dark:bg-gray-700 border-transparent text-gray-800 dark:text-gray-200" : "border-gray-200 dark:border-slate-700 text-gray-500")}
                                                >Tất cả</button>
                                                <button
                                                    onClick={() => setFilters({ ...filters, status: 'received' })}
                                                    className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all", filters.status === 'received' ? "bg-green-100 border-green-200 text-green-700" : "border-gray-200 dark:border-slate-700 text-gray-500")}
                                                >Đã nhận</button>
                                                <button
                                                    onClick={() => setFilters({ ...filters, status: 'not_received' })}
                                                    className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all", filters.status === 'not_received' ? "bg-red-50 border-red-200 text-red-600" : "border-gray-200 dark:border-slate-700 text-gray-500")}
                                                >Chưa nhận</button>
                                            </div>
                                        </div>

                                        {/* Gift Type (Dynamic) */}
                                        {((filters.eventId !== 'all') && (filters.status !== 'not_received')) && (() => {
                                            const evt = events.find(e => String(e.id) === String(filters.eventId));
                                            if (!evt || !evt.gift_types) return null;
                                            const types = evt.gift_types.split(/[,;|\.]+/).map(s => s.trim()).filter(Boolean);
                                            return (
                                                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                                    <label className="text-xs font-bold text-gray-400 uppercase">Loại quà</label>
                                                    <select
                                                        value={filters.giftType}
                                                        onChange={e => setFilters({ ...filters, giftType: e.target.value })}
                                                        className="w-full bg-transparent border border-border focus:border-primary rounded-lg px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none"
                                                    >
                                                        <option value="all">Tất cả loại</option>
                                                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            );
                                        })()}

                                    </m.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => {
                            setEventForm({ name: '', gift_types: '', icon: 'Gift' });
                            setEditEventId(null);
                            setShowAddEvent(true);
                        }}
                        className="bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white hover:scale-[1.02] active:scale-95 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all border border-white/10"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span className="hidden sm:inline">Sự Kiện Mới</span>
                    </button>
                </div>
            </div >

            {/* Main Table Container with Pagination */}
            < div className="flex-1 flex flex-col overflow-hidden relative" >
                <div className="flex-1 overflow-hidden relative px-4 pt-4">
                    <div className="w-full h-full overflow-auto custom-scrollbar bg-transparent rounded-3xl border border-[#d4a574]/20">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-40 shadow-none ring-1 ring-[#d4a574]/20">
                                <tr>
                                    {/* Sticky Top-Left Corner */}
                                    <th className="sticky left-0 top-0 z-50 bg-[#faf8f3]/60 dark:bg-slate-950/60 p-0 border-b border-r border-[#d4a574]/20 w-[280px] min-w-[280px] backdrop-blur-md">
                                        <div className="p-3">

                                            {/* Selection Info Bar */}
                                            {selectedPartnerIds.size > 0 && (
                                                <div className="mb-2 p-2 bg-[#2d5016]/10 dark:bg-[#4a7c59]/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 fade-in duration-300">
                                                    <span className="text-xs font-bold text-primary dark:text-[#d4a574]">Đã chọn: {selectedPartnerIds.size}</span>
                                                    <button onClick={clearSelection} className="text-[10px] font-bold text-gray-500 hover:text-red-500 bg-transparent px-2 py-1 rounded shadow-none border border-border">Bỏ chọn</button>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                {/* Select All Checkbox */}
                                                <button
                                                    onClick={toggleSelectAllFiltered}
                                                    className={cn(
                                                        "w-10 h-10 flex items-center justify-center rounded-xl border transition-all flex-shrink-0",
                                                        filteredPartners.length > 0 && filteredPartners.every(p => selectedPartnerIds.has(p.id))
                                                            ? "bg-primary border-primary text-white"
                                                            : "bg-transparent border-border text-gray-400 hover:border-primary/50"
                                                    )}
                                                    title="Chọn tất cả danh sách đang lọc"
                                                >
                                                    {filteredPartners.length > 0 && filteredPartners.every(p => selectedPartnerIds.has(p.id)) ? <Check size={20} strokeWidth={4} /> : <div className="w-3 h-3 rounded-sm bg-current opacity-20" />}
                                                </button>

                                                <div className="relative group flex-1">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input
                                                        value={quickAddName}
                                                        onChange={(e) => setQuickAddName(e.target.value)}
                                                        onKeyDown={handleQuickAddPartner}
                                                        placeholder="Lọc & Chọn..."
                                                        className="w-full h-10 bg-[#d4a574]/5 dark:bg-slate-800 border-2 border-transparent focus:border-[#d4a574]/30 rounded-xl pl-9 pr-3 text-sm font-bold text-primary dark:text-[#d4a574] outline-none transition-all placeholder:font-normal placeholder:text-muted/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                                                <span>Danh sách ({filteredPartners.length})</span>
                                                <Users size={12} />
                                            </div>
                                        </div>
                                    </th>

                                    {/* Scrollable Event Headers */}
                                    {events.map(event => {
                                        const EventIcon = event.icon && LucideIcons[event.icon] ? LucideIcons[event.icon] : null;
                                        return (
                                            <th
                                                key={event.id}
                                                onDoubleClick={() => {
                                                    setEventForm({ name: event.name, gift_types: event.gift_types || '', icon: event.icon || 'Gift' });
                                                    setEditEventId(event.id);
                                                    setShowAddEvent(true);
                                                }}
                                                className="p-2 text-center border-b border-r border-[#d4a574]/20 min-w-[140px] w-[140px] align-top bg-[#faf8f3]/60 dark:bg-slate-950/60 group hover:bg-[#faf4eb] dark:hover:bg-slate-900 transition-all relative cursor-pointer backdrop-blur-md"
                                                title="Double click để sửa"
                                            >
                                                <div className="flex flex-col items-center h-full justify-between gap-1 w-full pt-1 relative">
                                                    {/* Header Dropdown Trigger */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setActiveHeaderMenu({
                                                                eventId: event.id,
                                                                x: rect.left,
                                                                y: rect.bottom,
                                                                giftTypes: event.gift_types ? event.gift_types.split(/[,;|\.]+/).map(s => s.trim()).filter(Boolean) : []
                                                            });
                                                        }}
                                                        className="absolute top-0 left-0 p-1 text-gray-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <MoreHorizontal size={14} />
                                                    </button>

                                                    <div className="w-full">
                                                        <div className="flex justify-center mb-1">
                                                            {EventIcon && <EventIcon size={20} className="text-primary dark:text-[#d4a574] opacity-80" />}
                                                        </div>
                                                        <div className="font-black text-primary dark:text-[#d4a574] text-[15px] leading-tight uppercase tracking-tight break-words whitespace-normal select-none drop-shadow-sm">{event.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 mt-0.5 select-none">
                                                            {new Date(event.date).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        <div className="mt-2 w-full">
                                                            {(() => {
                                                                const eventLogs = Object.values(logs).filter(l => l.event_id === event.id);
                                                                const total = eventLogs.length;
                                                                const byType = {};
                                                                if (event.gift_types) {
                                                                    event.gift_types.split(/[,;|\.]+/).forEach(t => byType[t.trim()] = 0);
                                                                    eventLogs.forEach(l => {
                                                                        if (l.gift_type && byType[l.gift_type] !== undefined) {
                                                                            byType[l.gift_type]++;
                                                                        }
                                                                    });
                                                                }
                                                                return (
                                                                    <div className="flex flex-col items-center w-full">
                                                                        {total > 0 ? (
                                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-transparent rounded-full mb-1">
                                                                                <Check size={12} className="text-green-500" strokeWidth={4} />
                                                                                <span className="text-[11px] font-black text-gray-600 dark:text-gray-300">{total} đã nhận</span>
                                                                            </div>
                                                                        ) : <div className="h-6"></div>}

                                                                        {event.gift_types ? (
                                                                            <div className="relative group/tooltip flex justify-center w-full">
                                                                                <div className="flex gap-1 justify-center opacity-40 hover:opacity-100 transition-opacity cursor-help py-1">
                                                                                    <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                                                                                    <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                                                                                    <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                                                                                </div>
                                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none group-hover/tooltip:pointer-events-auto z-[60]">
                                                                                    <div className="bg-transparent shadow-xl rounded-xl p-3 border border-gray-100 dark:border-slate-700 flex flex-col gap-2 min-w-[160px]">
                                                                                        <div className="text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 dark:border-slate-700 pb-1 mb-1">Chi tiết quà tặng</div>
                                                                                        {Object.entries(byType).map(([type, count]) => (
                                                                                            <div key={type} className="flex items-center justify-between gap-4">
                                                                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{type}</span>
                                                                                                <span className="text-xs font-black text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-md min-w-[24px] text-center">{count}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : <div className="h-3"></div>}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEvent(event.id);
                                                        }}
                                                        className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </th>

                                        );
                                    })}
                                    {/* Filler */}
                                    <th className="w-full border-b border-[#d4a574]/20 dark:border-slate-800"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPartners.length === 0 ? (
                                    <tr>
                                        <td colSpan={events.length + 2} className="p-12 text-center sticky left-0 z-30">
                                            {quickAddName ? (
                                                <div className="flex flex-col items-center text-gray-400">
                                                    <Plus size={48} className="mb-2 text-orange-200" />
                                                    <p>Ấn <kbd className="bg-transparent px-1 rounded font-bold text-gray-600">Enter</kbd> để thêm mới khách hàng này</p>
                                                </div>
                                            ) : (
                                                <p className="text-gray-400">Chưa có dữ liệu</p>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPartners.map(partner => (
                                        <tr key={partner.id} className="hover:bg-[#d4a574]/5 dark:hover:bg-slate-800/50 transition-colors group">
                                            {/* Sticky Left Column */}
                                            <td className="sticky left-0 z-30 bg-[#faf8f3]/60 dark:bg-slate-950/60 group-hover:bg-[#faf4eb] dark:group-hover:bg-slate-900 p-3 border-b border-r border-[#d4a574]/20 backdrop-blur-md">
                                                <div className="flex items-center gap-3">
                                                    {/* Row Checkbox */}
                                                    <button
                                                        onClick={() => toggleSelectPartner(partner.id)}
                                                        className={cn(
                                                            "w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                                            selectedPartnerIds.has(partner.id)
                                                                ? "bg-primary border-primary text-white"
                                                                : "bg-transparent border-gray-300 dark:border-slate-600 text-transparent hover:border-primary"
                                                        )}
                                                    >
                                                        <Check size={12} strokeWidth={4} />
                                                    </button>

                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate group-hover:text-primary transition-colors">{partner.name}</span>
                                                        {partner.phone && (
                                                            <span className="text-[11px] text-gray-400 font-mono">{partner.phone}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Grid Cells */}
                                            {events.map(event => {
                                                const key = `${event.id}-${partner.id}`;
                                                const log = logs[key];
                                                const isChecked = !!log;

                                                // Specific Gift Type Display
                                                const displayType = log?.gift_type;

                                                return (
                                                    <td key={event.id} className="p-3 border-b border-r border-[#d4a574]/20 text-center relative group-hover:bg-white/50 dark:group-hover:bg-white/5">
                                                        <div className="flex justify-center relative">
                                                            <m.button
                                                                whileTap={{ scale: 0.8 }}
                                                                onClick={(e) => handleCellClick(partner.id, event, e)}
                                                                className={cn(
                                                                    "h-9 min-w-[36px] px-2 rounded-xl flex items-center justify-center transition-all shadow-sm border text-xs font-bold gap-1",
                                                                    isChecked
                                                                        ? "bg-green-500 border-green-500 text-white shadow-green-500/20"
                                                                        : "bg-transparent border-[#d4a574]/30 dark:border-slate-700 text-gray-400 hover:border-primary hover:text-primary dark:hover:border-slate-600"
                                                                )}
                                                            >
                                                                {isChecked && <Check size={14} strokeWidth={4} />}
                                                                {displayType && <span>{displayType}</span>}

                                                                {event.gift_types && !isChecked && (
                                                                    <ChevronDown size={14} className="opacity-30" />
                                                                )}
                                                            </m.button>

                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="border-b border-[#d4a574]/20 dark:border-slate-800"></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-3 flex items-center justify-between border-t border-[#d4a574]/10 bg-transparent z-30">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Hiển thị {paginatedPartners.length} / {filteredPartners.length} khách hàng
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-transparent hover:border-[#d4a574]/20 text-gray-600 dark:text-gray-300"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-transparent hover:border-[#d4a574]/20 text-gray-600 dark:text-gray-300"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <span className="text-sm font-black text-primary dark:text-[#d4a574] px-4">
                                Trang {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-transparent hover:border-[#d4a574]/20 text-gray-600 dark:text-gray-300"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-transparent hover:border-[#d4a574]/20 text-gray-600 dark:text-gray-300"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* End of Main Content Flex Column */}

            {/* Add Event Modal */}
            <AnimatePresence>
                {showAddEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <m.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddEvent(false)}
                        />
                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#faf8f3] dark:bg-slate-950 rounded-3xl border border-border p-8 w-full max-w-md relative z-10 shadow-none"
                        >
                            <h3 className="text-xl font-black text-primary dark:text-[#d4a574] mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <Plus className="p-1 bg-[#2d5016]/10 text-primary rounded-lg" size={28} />
                                {editEventId ? 'Cập Nhật Sự Kiện' : 'Thêm Sự Kiện Mới'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tên sự kiện (*)</label>
                                    <input
                                        autoFocus
                                        value={eventForm.name}
                                        onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                                        placeholder="Ví dụ: Quà Tết 2026..."
                                        className="w-full bg-transparent border border-border rounded-xl px-4 py-3 font-semibold focus:border-primary outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Các loại quà (cách nhau dấu phẩy)</label>
                                    <input
                                        value={eventForm.gift_types}
                                        onChange={e => setEventForm({ ...eventForm, gift_types: e.target.value })}
                                        placeholder="Ví dụ: Rượu, Bánh, Tiền mặt..."
                                        className="w-full bg-transparent border border-border rounded-xl px-4 py-3 font-semibold focus:border-primary outline-none transition-all dark:text-white"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Để trống nếu chỉ cần đánh dấu Đã Nhận.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Biểu tượng</label>
                                    <div className="grid grid-cols-6 gap-2 max-h-[120px] overflow-y-auto p-1 custom-scrollbar">
                                        {AVAILABLE_ICONS.map(iconName => {
                                            const Icon = LucideIcons[iconName];
                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => setEventForm({ ...eventForm, icon: iconName })}
                                                    className={cn(
                                                        "p-2 rounded-lg flex items-center justify-center transition-all border",
                                                        eventForm.icon === iconName
                                                            ? "bg-primary text-white border-primary"
                                                            : "bg-transparent border-border text-gray-500 hover:bg-primary/10 hover:text-primary"
                                                    )}
                                                    title={iconName}
                                                >
                                                    <Icon size={20} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowAddEvent(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-transparent border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-transparent dark:hover:bg-slate-850 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={!eventForm.name.trim() || submitting}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white hover:scale-[1.02] active:scale-95 transition-all border border-white/10 disabled:opacity-50 disabled:scale-100"
                                >
                                    {submitting ? 'Đang lưu...' : (editEventId ? 'Cập Nhật' : 'Tạo Sự Kiện')}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Global Popover (Portal-like) */}
            < AnimatePresence >
                {activePopover && (
                    <>
                        <div className="fixed inset-0 z-[9990]" onClick={() => setActivePopover(null)} />
                        <Popover
                            style={{
                                top: activePopover.y,
                                left: activePopover.x,
                                transform: 'translateX(-50%)'
                            }}
                            options={events.find(e => e.id === activePopover.eventId)?.gift_types?.split(/[,;|\.]+/).map(s => s.trim()).filter(Boolean) || []}
                            onSelect={(opt) => toggleLog(activePopover.partnerId, activePopover.eventId, opt)}
                            onClose={() => setActivePopover(null)}
                        />
                    </>
                )}
            </AnimatePresence >

            {/* Header Bulk Menu */}
            < AnimatePresence >
                {activeHeaderMenu && (
                    <>
                        <div className="fixed inset-0 z-[9990]" onClick={() => setActiveHeaderMenu(null)} />
                        <div
                            style={{
                                top: activeHeaderMenu.y,
                                left: activeHeaderMenu.x
                            }}
                            className="fixed mt-1 bg-transparent rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 dark:border-slate-700 p-2 min-w-[200px] z-[9999] flex flex-col gap-1"
                        >
                            <div className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1 mb-1">
                                {selectedPartnerIds.size > 0
                                    ? `Áp dụng cho ${selectedPartnerIds.size} khách ĐÃ CHỌN`
                                    : "Áp dụng cho TOÀN BỘ danh sách hiển thị"}
                            </div>
                            {activeHeaderMenu.giftTypes.length > 0 ? (
                                activeHeaderMenu.giftTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleBulkAction(activeHeaderMenu.eventId, type)}
                                        className="text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-between group"
                                    >
                                        <span>Tặng "{type}"</span>
                                        <Users size={14} className="opacity-0 group-hover:opacity-50 text-primary" />
                                    </button>
                                ))
                            ) : (
                                <button
                                    onClick={() => handleBulkAction(activeHeaderMenu.eventId, null)} // Implicit simple toggle? Or skip
                                    className="text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-green-50 dark:hover:bg-slate-700 text-green-600 transition-colors"
                                >
                                    Đánh dấu "Đã nhận"
                                </button>
                            )}
                        </div>
                    </>
                )}
            </AnimatePresence >

            {/* Toast */}
            < AnimatePresence >
                {toast && (
                    <m.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className={cn(
                            "fixed bottom-8 left-1/2 px-6 py-3 rounded-full shadow-2xl z-[120] font-bold text-sm flex items-center gap-2",
                            toast.type === 'success' ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-red-500 text-white"
                        )}
                    >
                        {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                        <span>{toast.message}</span>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    </div>
    );
}
