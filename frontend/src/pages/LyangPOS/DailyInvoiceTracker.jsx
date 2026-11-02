import React, { useState, useEffect, useMemo } from 'react';
import {
    Receipt,
    Calendar,
    Search,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    RefreshCw,
    Check,
    X,
    Edit3,
    FileText,
    Users,
    DollarSign,
    Clock,
    Phone,
    MapPin,
    ArrowRight,
    Sparkles,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ExternalLink,
    Filter,
    Layers,
    Package,
    Hourglass,
    CheckCheck,
    ArrowUpRight,
    HelpCircle,
    BookOpen,
    Lightbulb,
    Info
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { cn } from '../../lib/utils';
import { createPortal } from 'react-dom';

export default function DailyInvoiceTracker() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [scope, setScope] = useState(() => localStorage.getItem('daily_invoice_tracker_scope') || 'daily'); // 'daily', 'pending', 'completed'
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [showGuideModal, setShowGuideModal] = useState(false);

    useEffect(() => {
        if (scope) {
            localStorage.setItem('daily_invoice_tracker_scope', scope);
        }
    }, [scope]);
    const defaultSummary = {
        total_partners_count: 0,
        invoiced_partners_count: 0,
        uninvoiced_partners_count: 0,
        total_sales_amount: 0,
        invoiced_amount: 0,
        uninvoiced_amount: 0,
        total_orders_count: 0,
        invoiced_orders_count: 0,
        uninvoiced_orders_count: 0
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const [data, setData] = useState({
        summary: defaultSummary,
        partners: []
    });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'uninvoiced', 'invoiced'
    const [expandedPartners, setExpandedPartners] = useState({});

    const summary = (data && data.summary) ? data.summary : defaultSummary;
    const partners = (data && Array.isArray(data.partners)) ? data.partners : [];

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when filters, scope or search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [scope, selectedDate, statusFilter, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(partners.length / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, partners.length);
    const paginatedPartners = partners.slice(startIndex, endIndex);

    const getPageNumbers = (current, total) => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    // Modal state for viewing & tracking items of a partner
    const [partnerItemsModal, setPartnerItemsModal] = useState({
        isOpen: false,
        partner: null,
        items: [],
        commonInvoiceNo: '',
        commonInvoiceNote: ''
    });

    // Modal state for editing single order invoice details
    const [editOrderModal, setEditOrderModal] = useState({
        isOpen: false,
        order: null,
        partner: null,
        invoiceNo: '',
        invoiceNote: '',
        isInvoiced: true
    });

    const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
    const [bulkInvoiceNo, setBulkInvoiceNo] = useState('');
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Clear selections when scope or filters change
    useEffect(() => {
        setSelectedPartnerIds([]);
    }, [scope, selectedDate, statusFilter]);

    // Fetch invoice tracking data (silent mode keeps list mounted without jumping)
    const fetchInvoiceData = async (currentScope = scope, date = selectedDate, silent = false) => {
        if (!silent && (!data.partners || data.partners.length === 0)) {
            setLoading(true);
        }
        setIsFetching(true);
        try {
            const res = await axios.get('/api/accounting/daily-invoices', {
                params: {
                    scope: currentScope,
                    date: (currentScope === 'daily' || currentScope === 'completed') ? date : undefined,
                    search: searchQuery || undefined,
                    status: statusFilter !== 'all' ? statusFilter : undefined
                }
            });
            setData(res.data || { summary: defaultSummary, partners: [] });
        } catch (err) {
            console.error("Fetch invoice tracking error:", err);
            toast.error("Không thể tải danh sách hóa đơn theo dõi");
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchInvoiceData(scope, selectedDate);
    }, [scope, selectedDate, statusFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoiceData(scope, selectedDate, true);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleExpand = (partnerId) => {
        setExpandedPartners(prev => ({
            ...prev,
            [partnerId]: !prev[partnerId]
        }));
    };

    const toggleSelectPartner = (partnerId) => {
        setSelectedPartnerIds(prev =>
            prev.includes(partnerId)
                ? prev.filter(id => id !== partnerId)
                : [...prev, partnerId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPartnerIds.length === partners.length) {
            setSelectedPartnerIds([]);
        } else {
            setSelectedPartnerIds(partners.map(p => p.partner_id));
        }
    };

    const handleBulkBatchInvoice = async (isInvoiced = true) => {
        if (selectedPartnerIds.length === 0) return;
        setIsBulkUpdating(true);
        const idsToUpdate = [...selectedPartnerIds];

        // Optimistic UI update
        setData(prev => {
            if (!prev || !prev.partners) return prev;
            const nextPartners = prev.partners.map(p => {
                if (idsToUpdate.includes(p.partner_id)) {
                    return {
                        ...p,
                        is_fully_invoiced: isInvoiced,
                        pending_items_count: isInvoiced ? 0 : (p.total_items_count || 0),
                        invoiced_items_count: isInvoiced ? (p.total_items_count || 0) : 0,
                        invoiced_orders_count: isInvoiced ? (p.total_orders_count || 0) : 0,
                        uninvoiced_orders_count: isInvoiced ? 0 : (p.total_orders_count || 0)
                    };
                }
                return p;
            });
            return { ...prev, partners: nextPartners };
        });

        try {
            // Attempt primary bulk API
            try {
                const res = await axios.post('/api/accounting/partners/bulk-batch-invoice', {
                    partner_ids: idsToUpdate,
                    date: (scope === 'daily' || scope === 'completed') ? selectedDate : null,
                    is_invoiced: isInvoiced,
                    invoice_no: bulkInvoiceNo,
                    invoice_note: ''
                });
                toast.success(res.data.message || `Đã xuất đủ hóa đơn cho ${idsToUpdate.length} khách!`);
            } catch (bulkErr) {
                console.warn("Bulk API failed, falling back to parallel batch invoice...", bulkErr);
                // Guaranteed fallback: call individual partner batch invoices in parallel
                await Promise.all(idsToUpdate.map(pid =>
                    axios.post(`/api/accounting/partners/${pid}/batch-invoice`, {
                        date: (scope === 'daily' || scope === 'completed') ? selectedDate : null,
                        is_invoiced: isInvoiced,
                        invoice_no: bulkInvoiceNo,
                        invoice_note: ''
                    })
                ));
                toast.success(`Đã xuất đủ hóa đơn cho ${idsToUpdate.length} khách hàng!`);
            }
            setSelectedPartnerIds([]);
            setBulkInvoiceNo('');
            fetchInvoiceData(scope, selectedDate, true);
        } catch (err) {
            console.error("Batch update error:", err);
            toast.error(err.response?.data?.error || "Lỗi khi cập nhật hóa đơn hàng loạt");
            fetchInvoiceData(scope, selectedDate, true);
        } finally {
            setIsBulkUpdating(false);
        }
    };

    // Open Partner Items Modal to view and track all items
    const openPartnerItemsModal = (partner) => {
        if (!partner) return;
        const itemsCopy = (partner.items || []).map(item => {
            const isInv = Boolean(item.is_invoiced);
            const invQty = item.invoiced_quantity !== undefined && item.invoiced_quantity !== null
                ? Number(item.invoiced_quantity)
                : (isInv ? Number(item.quantity) : 0);
            return {
                ...item,
                temp_is_invoiced: isInv || (invQty >= Number(item.quantity)),
                temp_invoiced_quantity: invQty,
                temp_invoice_no: item.invoice_no || (partner.invoice_numbers && partner.invoice_numbers[0]) || ''
            };
        });

        setPartnerItemsModal({
            isOpen: true,
            partner: partner,
            items: itemsCopy,
            commonInvoiceNo: partner.invoice_numbers && partner.invoice_numbers[0] ? partner.invoice_numbers[0] : '',
            commonInvoiceNote: ''
        });
    };

    // Open single order edit modal
    const openOrderEditModal = (order, partner) => {
        if (!order) return;
        setEditOrderModal({
            isOpen: true,
            order: order,
            partner: partner,
            invoiceNo: order.invoice_no || '',
            invoiceNote: order.invoice_note || '',
            isInvoiced: Boolean(order.is_invoiced)
        });
    };

    // Toggle single item in Partner Items Modal
    const handleToggleItemStatus = (index, forcedValue = null) => {
        setPartnerItemsModal(prev => {
            const nextItems = prev.items.map((item, idx) => {
                if (idx !== index) return item;
                const nextIsInvoiced = forcedValue !== null ? forcedValue : !item.temp_is_invoiced;
                const nextQty = nextIsInvoiced ? Number(item.quantity) : 0;
                return {
                    ...item,
                    temp_is_invoiced: nextIsInvoiced,
                    temp_invoiced_quantity: nextQty,
                    temp_invoice_no: nextIsInvoiced ? (item.temp_invoice_no || prev.commonInvoiceNo || '') : ''
                };
            });
            return { ...prev, items: nextItems };
        });
    };

    // Mark all items in modal as Invoiced or Uninvoiced
    const handleSetAllItemsStatus = (isInvoiced) => {
        setPartnerItemsModal(prev => {
            const nextItems = prev.items.map(item => {
                const nextQty = isInvoiced ? Number(item.quantity) : 0;
                return {
                    ...item,
                    temp_is_invoiced: isInvoiced,
                    temp_invoiced_quantity: nextQty,
                    temp_invoice_no: isInvoiced ? (item.temp_invoice_no || prev.commonInvoiceNo || '') : ''
                };
            });
            return { ...prev, items: nextItems };
        });
    };

    // Save Partner Items Tracking
    const handleSavePartnerItems = async () => {
        const { partner, items, commonInvoiceNo } = partnerItemsModal;
        try {
            const payloadItems = items.map(it => ({
                detail_id: it.id || it.detail_id,
                is_invoiced: Boolean(it.temp_is_invoiced),
                invoiced_quantity: Number(it.temp_invoiced_quantity || 0),
                invoice_no: it.temp_invoice_no || commonInvoiceNo || ''
            }));

            await axios.post(`/api/accounting/partners/${partner.partner_id}/update-items-invoice`, {
                items: payloadItems,
                invoice_no: commonInvoiceNo
            });

            const allDone = items.every(it => it.temp_is_invoiced && it.temp_invoiced_quantity >= it.quantity);
            if (allDone) {
                toast.success(`Đã xuất đủ toàn bộ món cho khách ${partner.partner_name}! Đánh dấu Xong.`);
            } else {
                toast.success(`Đã lưu tiến độ món hàng! Khách được đưa vào tab "Cần xuất thêm" để xuất tiếp.`);
            }

            setPartnerItemsModal({ ...partnerItemsModal, isOpen: false });
            fetchInvoiceData(scope, selectedDate, true);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu trạng thái món hàng");
        }
    };

    // Save a SINGLE item line directly from modal
    const handleSaveSingleModalItem = async (item) => {
        try {
            const payload = {
                is_invoiced: Boolean(item.temp_is_invoiced),
                invoiced_quantity: Number(item.temp_invoiced_quantity || 0),
                invoice_no: item.temp_invoice_no || partnerItemsModal.commonInvoiceNo || ''
            };
            await axios.post(`/api/accounting/order-details/${item.id || item.detail_id}/invoice-status`, payload);
            toast.success(`Đã lưu riêng món "${item.product_name}" thành công!`);
            fetchInvoiceData(scope, selectedDate, true);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu dòng món hàng này");
        }
    };

    // Quick toggle single item line from the main list
    const handleQuickToggleItem = async (item, targetStatus) => {
        try {
            await axios.post(`/api/accounting/order-details/${item.id || item.detail_id}/invoice-status`, {
                is_invoiced: targetStatus,
                invoiced_quantity: targetStatus ? Number(item.quantity) : 0,
                invoice_no: targetStatus ? (item.invoice_no || '') : ''
            });
            toast.success(targetStatus ? `Đã đánh dấu xuất HĐ cho món "${item.product_name}"` : `Đã bỏ xuất HĐ món "${item.product_name}"`);
            fetchInvoiceData(scope, selectedDate, true);
        } catch (err) {
            console.error(err);
            toast.error("Không thể cập nhật dòng món hàng");
        }
    };

    // Toggle single order invoice status
    const handleToggleOrderInvoice = async (order, targetStatus) => {
        try {
            await axios.post(`/api/accounting/orders/${order.id}/invoice-status`, {
                is_invoiced: targetStatus,
                invoice_no: targetStatus ? (order.invoice_no || '') : '',
                invoice_note: targetStatus ? (order.invoice_note || '') : ''
            });
            toast.success(targetStatus ? `Đã đánh dấu xuất HĐ đơn ${order.display_id}` : `Đã bỏ đánh dấu đơn ${order.display_id}`);
            fetchInvoiceData(scope, selectedDate, true);
        } catch (err) {
            console.error(err);
            toast.error("Không thể cập nhật trạng thái hóa đơn");
        }
    };

    // Save Single Order Modal
    const handleSaveOrderModal = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/accounting/orders/${editOrderModal.order.id}/invoice-status`, {
                is_invoiced: editOrderModal.isInvoiced,
                invoice_no: editOrderModal.invoiceNo,
                invoice_note: editOrderModal.invoiceNote
            });
            toast.success("Đã cập nhật thông tin hóa đơn đơn hàng!");
            setEditOrderModal({ ...editOrderModal, isOpen: false });
            fetchInvoiceData(scope, selectedDate, true);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu thông tin");
        }
    };

    // Batch mark all orders of partner with optimistic update (NO RELOAD / JUMP)
    const handleBatchPartnerInvoice = async (partnerId, isInvoiced) => {
        // Optimistic local state update so user stays in place with instant feedback
        setData(prev => {
            if (!prev || !prev.partners) return prev;
            const nextPartners = prev.partners.map(p => {
                if (p.partner_id === partnerId) {
                    return {
                        ...p,
                        is_fully_invoiced: isInvoiced,
                        pending_items_count: isInvoiced ? 0 : (p.total_items_count || 0),
                        invoiced_items_count: isInvoiced ? (p.total_items_count || 0) : 0,
                        invoiced_orders_count: isInvoiced ? (p.total_orders_count || 0) : 0,
                        uninvoiced_orders_count: isInvoiced ? 0 : (p.total_orders_count || 0)
                    };
                }
                return p;
            });
            return { ...prev, partners: nextPartners };
        });

        try {
            const res = await axios.post(`/api/accounting/partners/${partnerId}/batch-invoice`, {
                date: scope === 'daily' ? selectedDate : null,
                is_invoiced: isInvoiced,
                invoice_no: '',
                invoice_note: ''
            });
            toast.success(res.data.message || "Đã cập nhật hóa đơn cho khách hàng!");
            fetchInvoiceData(scope, selectedDate, true);
        } catch (err) {
            console.error(err);
            toast.error("Không thể cập nhật toàn bộ đơn của khách");
            fetchInvoiceData(scope, selectedDate, true);
        }
    };

    // Quick Date helper
    const handleQuickDate = (offsetDays) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const str = d.toISOString().split('T')[0];
        setSelectedDate(str);
    };

    // Export Excel
    const handleExportExcel = async () => {
        if (!data.partners || data.partners.length === 0) {
            toast.error("Không có dữ liệu để xuất file!");
            return;
        }

        const rows = [];
        data.partners.forEach(p => {
            (p.items || []).forEach((item, idx) => {
                rows.push({
                    "Khách hàng / Đối tác": p.partner_name,
                    "Số điện thoại": p.partner_phone || '---',
                    "Mã đơn hàng": item.order_display_id,
                    "Ngày tạo": item.order_date ? new Date(item.order_date).toLocaleDateString('vi-VN') : '---',
                    "Mã sản phẩm": item.product_code || '---',
                    "Tên sản phẩm / Món": item.product_name,
                    "Đơn vị tính": item.unit || 'ĐV',
                    "Số lượng mua": item.quantity || 0,
                    "Số lượng đã xuất HĐ": item.invoiced_quantity || (item.is_invoiced ? item.quantity : 0),
                    "Trạng thái món": (item.is_invoiced || item.invoiced_quantity >= item.quantity) ? 'ĐÃ XUẤT ĐỦ' : 'CẦN XUẤT THÊM',
                    "Đơn giá": item.price || 0,
                    "Thành tiền": item.total_price || 0,
                    "Số Hóa Đơn": item.invoice_no || p.invoice_numbers?.join(', ') || '---'
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Theo_Doi_Mon_Hoa_Don");

        const filename = `Theo_Doi_Hoa_Don_${scope}_${selectedDate}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        try {
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(wbout, filename, true);
            toast.success("Đã xuất file theo dõi hóa đơn thành công!");
        } catch (err) {
            console.error("Export Error:", err);
            toast.error("Lỗi khi xuất file");
        }
    };

    return (
        <div className="space-y-5 text-slate-900 dark:text-white font-sans">
            {/* SUB-TABS NAVIGATION & ACTIONS (No Outer Box, No White Background) */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                {/* Sub-tabs pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl border border-slate-300/40 dark:border-slate-700/40 shadow-xs overflow-x-auto">
                    {/* Tab 1: Theo Ngày */}
                    <button
                        onClick={() => setScope('daily')}
                        className={cn(
                            "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                            scope === 'daily'
                                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm ring-1 ring-white/10"
                                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <Calendar size={15} />
                        <span>Theo Ngày</span>
                        {scope === 'daily' && summary.total_partners_count > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white ml-0.5">
                                {summary.total_partners_count}
                            </span>
                        )}
                    </button>

                    {/* Tab 2: Cần Xuất Thêm / Nợ HĐ */}
                    <button
                        onClick={() => setScope('pending')}
                        className={cn(
                            "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap relative",
                            scope === 'pending'
                                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm ring-1 ring-white/10"
                                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <Hourglass size={15} className={cn(scope === 'pending' ? "text-white" : "text-rose-500 animate-pulse")} />
                        <span>Cần Xuất Thêm / Nợ HĐ</span>
                        {summary.uninvoiced_partners_count > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black ml-0.5",
                                scope === 'pending'
                                    ? "bg-white/25 text-white"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/50"
                            )}>
                                {summary.uninvoiced_partners_count}
                            </span>
                        )}
                    </button>

                    {/* Tab 3: Đã Hoàn Tất */}
                    <button
                        onClick={() => setScope('completed')}
                        className={cn(
                            "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                            scope === 'completed'
                                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm ring-1 ring-white/10"
                                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <CheckCheck size={15} className={cn(scope === 'completed' ? "text-white" : "text-emerald-500")} />
                        <span>Đã Hoàn Tất</span>
                        {summary.invoiced_partners_count > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black ml-0.5",
                                scope === 'completed'
                                    ? "bg-white/25 text-white"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50"
                            )}>
                                {summary.invoiced_partners_count}
                            </span>
                        )}
                    </button>
                </div>

                {/* Right controls: Date Picker & Excel Export */}
                <div className="flex flex-wrap items-center gap-2.5 justify-end">
                    {(scope === 'daily' || scope === 'completed') && (
                        <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-300/40 dark:border-slate-700/40">
                            <Calendar size={15} className="text-emerald-600 dark:text-emerald-400 ml-2" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 text-xs outline-none px-2 py-1 cursor-pointer"
                            />
                            <button
                                onClick={() => handleQuickDate(0)}
                                className={cn(
                                    "px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer",
                                    selectedDate === todayStr
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900"
                                )}
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => handleQuickDate(-1)}
                                className="px-3 py-1 rounded-xl font-bold text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer"
                            >
                                Hôm qua
                            </button>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchInvoiceData(scope, selectedDate)}
                        className="p-2.5 bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl transition-all cursor-pointer shadow-xs"
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw size={16} className={cn(isFetching && "animate-spin text-emerald-600 dark:text-emerald-400")} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportExcel}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/20 border border-emerald-500/30 transition-all cursor-pointer"
                    >
                        <FileSpreadsheet size={16} />
                        <span>Xuất Báo Cáo Excel</span>
                    </motion.button>
                </div>
            </div>

            {/* KPI Summary Cards (Viền cùng màu, icon in vào card) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Tổng đối tác */}
                <div className="p-3.5 rounded-2xl border border-cyan-400/40 bg-cyan-50/30 dark:bg-cyan-950/20 shadow-xs flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
                            <Users size={18} />
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] font-black text-cyan-800 dark:text-cyan-300 uppercase tracking-wider truncate">
                                {scope === 'pending' ? 'Khách Cần Xuất Thêm' : scope === 'completed' ? 'Khách Đã Xong' : 'Tổng Đối Tác'}
                            </p>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{summary.total_orders_count} đơn</span>
                        </div>
                    </div>
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tabular-nums shrink-0">{summary.total_partners_count}</p>
                </div>

                {/* Đã xuất đủ */}
                <div className="p-3.5 rounded-2xl border border-emerald-400/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} />
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider truncate">
                                Đã Xuất Đủ ({summary.total_partners_count ? Math.round((summary.invoiced_partners_count / summary.total_partners_count) * 100) : 0}%)
                            </p>
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{(summary.invoiced_amount || 0).toLocaleString()}đ</span>
                        </div>
                    </div>
                    <p className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">{summary.invoiced_partners_count}</p>
                </div>

                {/* Nợ HĐ / Chưa Đủ */}
                <div className={cn(
                    "p-3.5 rounded-2xl border shadow-xs flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5",
                    summary.uninvoiced_partners_count > 0 ? "border-rose-400/50 bg-rose-50/30 dark:bg-rose-950/20" : "border-slate-300 dark:border-slate-800 bg-transparent"
                )}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            summary.uninvoiced_partners_count > 0
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                : "bg-slate-200/60 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                            <AlertCircle size={18} className={cn(summary.uninvoiced_partners_count > 0 && "animate-pulse")} />
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider truncate">Nợ HĐ / Chưa Đủ</p>
                            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">{(summary.uninvoiced_amount || 0).toLocaleString()}đ</span>
                        </div>
                    </div>
                    <p className={cn("text-xl md:text-2xl font-black tabular-nums shrink-0", summary.uninvoiced_partners_count > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-white")}>
                        {summary.uninvoiced_partners_count}
                    </p>
                </div>

                {/* Tổng Doanh Thu */}
                <div className="p-3.5 rounded-2xl border border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                            <DollarSign size={18} />
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider truncate">Tổng Doanh Thu</p>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{summary.total_orders_count} đơn hàng</span>
                        </div>
                    </div>
                    <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight shrink-0">
                        {(summary.total_sales_amount || 0).toLocaleString()}đ
                    </p>
                </div>
            </div>

            {/* Search & Status Filter Bar (No outer box border) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full group">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm đối tác, SĐT, tên sản phẩm, mã đơn (HD...)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-transparent border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={15} />
                        </button>
                    )}
                </div>

                {scope === 'daily' && (
                    <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl border border-slate-300/40 dark:border-slate-700/40 w-full md:w-auto shrink-0 shadow-xs">
                        {[
                            { id: 'all', label: `Tất cả (${summary.total_partners_count})` },
                            { id: 'uninvoiced', label: `🔴 Chưa đủ (${summary.uninvoiced_partners_count})` },
                            { id: 'invoiced', label: `🟢 Xuất đủ (${summary.invoiced_partners_count})` }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                                    statusFilter === f.id
                                        ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs"
                                        : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Multi-Select & Batch Action Toolbar */}
            {partners.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleSelectAll}
                            className="px-3.5 py-2 rounded-xl bg-transparent border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all",
                                selectedPartnerIds.length === partners.length && partners.length > 0
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-slate-300 dark:border-slate-600 bg-transparent"
                            )}>
                                {selectedPartnerIds.length === partners.length && partners.length > 0 && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span>{selectedPartnerIds.length === partners.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} ({partners.length} khách)</span>
                        </button>

                        {selectedPartnerIds.length > 0 && (
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                Đã chọn {selectedPartnerIds.length} khách
                            </span>
                        )}
                    </div>

                    {selectedPartnerIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 shadow-lg ring-1 ring-emerald-500/20"
                        >
                            <input
                                type="text"
                                placeholder="Số HĐ chung (tùy chọn)..."
                                value={bulkInvoiceNo}
                                onChange={(e) => setBulkInvoiceNo(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 w-44 placeholder:text-slate-400"
                            />
                            <button
                                onClick={() => handleBulkBatchInvoice(true)}
                                disabled={isBulkUpdating}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                            >
                                <Check size={14} strokeWidth={3} />
                                <span>{isBulkUpdating ? 'Đang xuất...' : `Xuất Đủ (${selectedPartnerIds.length} khách)`}</span>
                            </button>
                            <button
                                onClick={() => setSelectedPartnerIds([])}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                Hủy
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            {/* List of Partners and their Items / Orders */}
            {loading && partners.length === 0 ? (
                <div className="py-20 text-center">
                    <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={36} />
                    <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">Đang tải dữ liệu theo dõi hóa đơn...</p>
                </div>
            ) : partners.length === 0 ? (
                <div className="py-20 text-center bg-transparent rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12">
                    <Receipt className="mx-auto mb-4 text-slate-400 dark:text-slate-600" size={56} />
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase">
                        {scope === 'daily'
                            ? (summary.invoiced_partners_count > 0 ? 'Đã Xuất Đủ Toàn Bộ Khách Hàng Trong Ngày!' : 'Không Có Đơn Hàng Nào Trong Ngày Đã Chọn')
                            : scope === 'pending'
                                ? 'Tuyệt Vời! Không Có Khách Nào Cần Xuất Thêm Hóa Đơn'
                                : 'Chưa Có Hóa Đơn Nào Hoàn Tất Trong Ngày Này'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto font-medium">
                        {scope === 'daily'
                            ? (summary.invoiced_partners_count > 0 ? 'Tất cả khách xuất đủ đã được chuyển sang tab "Đã hoàn tất".' : 'Chưa có phát sinh đơn bán hàng nào trong ngày này.')
                            : scope === 'pending'
                                ? 'Tất cả các đối tác và đơn hàng đã được xuất đủ hóa đơn hoàn tất.'
                                : 'Các khách hàng và đơn hàng xuất đủ sẽ hiển thị tại đây.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                    {paginatedPartners.map((partner) => {
                        const itemsList = partner.items || [];
                        const totalItemsCount = (partner.total_items_count != null && partner.total_items_count > 0)
                            ? partner.total_items_count
                            : itemsList.length;
                        const invoicedItemsCount = (partner.invoiced_items_count != null)
                            ? partner.invoiced_items_count
                            : itemsList.filter(it => it.is_invoiced || (it.invoiced_quantity != null && Number(it.invoiced_quantity) >= Number(it.quantity))).length;
                        const pendingItemsCount = (partner.pending_items_count != null)
                            ? partner.pending_items_count
                            : Math.max(0, totalItemsCount - invoicedItemsCount);
                        const isFullyInvoiced = partner.is_fully_invoiced || (totalItemsCount > 0 && pendingItemsCount === 0);
                        const isSelected = selectedPartnerIds.includes(partner.partner_id);

                        return (
                            <div
                                key={partner.partner_id}
                                onClick={() => openPartnerItemsModal(partner)}
                                className={cn(
                                    "rounded-2xl border transition-all duration-150 overflow-hidden shadow-2xs cursor-pointer select-none",
                                    isSelected
                                        ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10"
                                        : (isFullyInvoiced
                                            ? "border-emerald-400/40 bg-emerald-50/25 dark:bg-emerald-950/20 dark:border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50/40"
                                            : "border-rose-400/40 bg-rose-50/20 dark:bg-rose-950/20 dark:border-rose-500/30 hover:border-rose-500 hover:bg-rose-50/30")
                                )}
                            >
                                {/* Partner Card Row - Theme Styled & No Accordion Dropdown */}
                                <div className="p-3 md:py-2.5 md:px-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Multi-select checkbox */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelectPartner(partner.partner_id);
                                            }}
                                            className={cn(
                                                "w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 shadow-2xs",
                                                isSelected
                                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                                    : "border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-emerald-500 text-transparent"
                                            )}
                                            title={isSelected ? "Bỏ chọn" : "Chọn khách này"}
                                        >
                                            <Check size={13} className={isSelected ? "opacity-100 stroke-[3]" : "opacity-0"} />
                                        </button>

                                        {/* Avatar in vào card theo theme */}
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border shadow-2xs",
                                            isFullyInvoiced
                                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                                                : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30"
                                        )}>
                                            {(partner.partner_name || 'Khách Lẻ').charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 truncate">
                                                    <span>{partner.partner_name}</span>
                                                    <ArrowUpRight size={14} className="text-slate-400 shrink-0" />
                                                </h3>
                                                
                                                {/* Status Badge theo theme */}
                                                {isFullyInvoiced ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                                                        <Check size={11} className="stroke-[3]" /> ĐÃ XUẤT ĐỦ ({totalItemsCount} món)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/25">
                                                        <AlertCircle size={11} /> CẦN XUẤT {pendingItemsCount}/{totalItemsCount} MÓN
                                                    </span>
                                                )}

                                                {partner.invoice_numbers && partner.invoice_numbers.length > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                                                        Số HĐ: {partner.invoice_numbers.join(', ')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex-wrap font-medium">
                                                {partner.partner_phone && (
                                                    <span className="flex items-center gap-1 text-[11px]">
                                                        <Phone size={11} className="text-slate-400" /> {partner.partner_phone}
                                                    </span>
                                                )}
                                                {partner.partner_address && (
                                                    <span className="flex items-center gap-1 truncate max-w-xs text-[11px]">
                                                        <MapPin size={11} className="text-slate-400" /> {partner.partner_address}
                                                    </span>
                                                )}
                                                {typeof partner.partner_debt === 'number' && partner.partner_debt !== 0 && (
                                                    <span className="text-amber-800 dark:text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 text-[11px]">
                                                        Nợ: {(partner.partner_debt || 0).toLocaleString()}đ
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Partner Totals & Quick Actions */}
                                    <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Mua ({partner.total_orders_count || partner.orders?.length || 0} đơn)</p>
                                            <p className="text-base md:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                                {(partner.total_amount || 0).toLocaleString()}đ
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            {/* Button to open Item-level Tracker */}
                                            <button
                                                type="button"
                                                onClick={() => openPartnerItemsModal(partner)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-black bg-cyan-100/70 hover:bg-cyan-200/80 text-cyan-900 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 dark:text-cyan-300 border border-cyan-400/40 dark:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-2xs active:scale-95"
                                            >
                                                <Package size={13} />
                                                <span>Xem Món ({totalItemsCount})</span>
                                            </button>

                                            {/* Batch toggle button */}
                                            {isFullyInvoiced ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleBatchPartnerInvoice(partner.partner_id, false)}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200/70 hover:bg-rose-100 text-slate-700 hover:text-rose-800 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap"
                                                >
                                                    Bỏ đánh dấu
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleBatchPartnerInvoice(partner.partner_id, true)}
                                                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                                                >
                                                    <Check size={13} strokeWidth={3} />
                                                    <span>Xuất Đủ (Xong)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Phân Trang Đối Tác (Pagination Bar) */}
                {partners.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-slate-300/50 dark:border-slate-800 text-xs">
                        {/* Thông tin số lượng */}
                        <div className="text-slate-600 dark:text-slate-400 font-bold">
                            Hiển thị <span className="text-slate-900 dark:text-white font-black">{partners.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, partners.length)}</span> trên tổng số <span className="text-slate-900 dark:text-white font-black">{partners.length}</span> đối tác
                        </div>

                        {/* Bộ chuyển trang */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={safeCurrentPage <= 1}
                                className="p-1.5 rounded-lg border border-slate-300/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Trang đầu"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={safeCurrentPage <= 1}
                                className="p-1.5 rounded-lg border border-slate-300/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Trang trước"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {/* Danh sách các số trang */}
                            <div className="flex items-center gap-1 px-1">
                                {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => (
                                    p === '...' ? (
                                        <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={cn(
                                                "min-w-8 h-8 px-2 rounded-lg font-black text-xs transition-all cursor-pointer",
                                                safeCurrentPage === p
                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-300/50 dark:border-slate-700/50"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    )
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={safeCurrentPage >= totalPages}
                                className="p-1.5 rounded-lg border border-slate-300/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Trang tiếp theo"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={safeCurrentPage >= totalPages}
                                className="p-1.5 rounded-lg border border-slate-300/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Trang cuối"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>

                        {/* Chọn số dòng / trang */}
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Hiển thị:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent border border-slate-300/60 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer text-xs"
                            >
                                <option value={10} className="dark:bg-slate-900">10 đối tác / trang</option>
                                <option value={20} className="dark:bg-slate-900">20 đối tác / trang</option>
                                <option value={50} className="dark:bg-slate-900">50 đối tác / trang</option>
                                <option value={100} className="dark:bg-slate-900">100 đối tác / trang</option>
                            </select>
                        </div>
                    </div>
                )}
            </>
        )}

{/* MODAL 1: CHI TIẾT MÓN THEO TỪNG ĐỐI TÁC (LIGHT MODE DEFAULT) */}
{mounted && typeof document !== 'undefined' && createPortal(
<AnimatePresence>
{partnerItemsModal.isOpen && partnerItemsModal.partner && (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#fcfaf8] dark:bg-slate-950 backdrop-blur-2xl rounded-3xl p-5 md:p-7 max-w-7xl w-[96vw] max-h-[94vh] h-[94vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4 text-slate-900 dark:text-white relative overflow-hidden"
        >
            {/* Glowing accent inside modal */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0 relative z-10">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Chi Tiết Món Xuất Hóa Đơn - {partnerItemsModal.partner.partner_name}</span>
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                            Đánh dấu từng món đã xuất đủ hoặc cần xuất thêm. Món chưa xuất đủ sẽ được lưu vào tab "Cần xuất thêm".
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setPartnerItemsModal({ ...partnerItemsModal, isOpen: false })}
                    className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-colors border border-slate-200 dark:border-slate-800"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Quick Controls & Invoice No Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10 shadow-sm">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider shrink-0">Số HĐ chung:</span>
                    <input
                        type="text"
                        placeholder="VD: HD-00123"
                        value={partnerItemsModal.commonInvoiceNo}
                        onChange={(e) => setPartnerItemsModal({ ...partnerItemsModal, commonInvoiceNo: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 font-mono font-bold text-xs text-slate-900 dark:text-white outline-none w-full sm:w-52"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={() => handleSetAllItemsStatus(true)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 border border-emerald-400/20"
                    >
                        <Check size={13} />
                        <span>Đánh Dấu Xuất Đủ Tất Cả</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSetAllItemsStatus(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                        Bỏ chọn tất cả
                    </button>
                </div>
            </div>

            {/* Items List Table with Tracking Checkboxes & Quantity Input */}
            <div className="overflow-y-auto flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm relative z-10">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="py-3 px-3.5 w-12 text-center">Xuất HĐ</th>
                            <th className="py-3 px-3.5">Mã đơn</th>
                            <th className="py-3 px-3.5">Món / Sản phẩm</th>
                            <th className="py-3 px-3.5 text-center">ĐVT</th>
                            <th className="py-3 px-3.5 text-center">SL Mua</th>
                            <th className="py-3 px-3.5 text-center">SL Đã Xuất HĐ</th>
                            <th className="py-3 px-3.5 text-right">Đơn giá</th>
                            <th className="py-3 px-3.5 text-right">Thành tiền</th>
                            <th className="py-3 px-3.5 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                        {partnerItemsModal.items.map((item, idx) => {
                            const isDone = item.temp_is_invoiced && (item.temp_invoiced_quantity >= item.quantity);

                            return (
                                <tr
                                    key={item.id || idx}
                                    className={cn(
                                        "transition-colors",
                                        isDone
                                            ? "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                            : "bg-rose-50/50 hover:bg-rose-50/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/30"
                                    )}
                                >
                                    <td className="py-3 px-3.5 text-center">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleItemStatus(idx);
                                            }}
                                            className={cn(
                                                "w-7 h-7 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer border shadow-sm",
                                                item.temp_is_invoiced
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25 active:scale-90"
                                                    : "bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-transparent border-slate-300 dark:border-slate-600 hover:border-emerald-500 active:scale-90"
                                            )}
                                            title={item.temp_is_invoiced ? "Đã xuất HĐ (Bấm để bỏ chọn)" : "Chưa xuất HĐ (Bấm để chọn)"}
                                        >
                                            <Check size={16} strokeWidth={3.5} className={cn("transition-transform duration-150", item.temp_is_invoiced ? "scale-100 text-white" : "scale-0")} />
                                        </button>
                                    </td>
                                    <td className="py-3 px-3.5 font-bold font-mono text-slate-600 dark:text-slate-400">
                                        {item.order_display_id || item.display_id || (item.order_id ? `#${item.order_id}` : '---')}
                                    </td>
                                    <td className="py-3 px-3.5 font-black text-slate-900 dark:text-white">
                                        <span>{item.product_name}</span>
                                        {item.product_code && (
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5 font-mono">({item.product_code})</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3.5 text-center text-slate-600 dark:text-slate-400 font-semibold">
                                        {item.unit || 'ĐV'}
                                    </td>
                                    <td className="py-3 px-3.5 text-center font-black text-slate-900 dark:text-white">
                                        {item.quantity}
                                    </td>
                                    <td className="py-3 px-3.5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.quantity}
                                                value={item.temp_invoiced_quantity !== undefined ? item.temp_invoiced_quantity : (item.temp_is_invoiced ? item.quantity : 0)}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setPartnerItemsModal(prev => {
                                                        const nextItems = prev.items.map((it, i) => {
                                                            if (i !== idx) return it;
                                                            const isInv = val > 0 || (it.quantity < 0 && val !== 0);
                                                            return {
                                                                ...it,
                                                                temp_invoiced_quantity: val,
                                                                temp_is_invoiced: isInv,
                                                                temp_invoice_no: isInv ? (it.temp_invoice_no || prev.commonInvoiceNo || '') : ''
                                                            };
                                                        });
                                                        return { ...prev, items: nextItems };
                                                    });
                                                }}
                                                className="w-16 py-1.5 px-2 text-center font-black font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-emerald-500 text-xs"
                                            />
                                            <span className="text-slate-500 font-bold">/ {item.quantity}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3.5 text-right text-slate-700 dark:text-slate-300 tabular-nums font-mono font-bold">
                                        {(item.price || 0).toLocaleString()}đ
                                    </td>
                                    <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white tabular-nums font-mono">
                                        {((item.total_price != null ? item.total_price : item.total) || 0).toLocaleString()}đ
                                    </td>
                                    <td className="py-3 px-3.5 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleItemStatus(idx)}
                                            className="cursor-pointer"
                                        >
                                            {isDone ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:scale-105 transition-transform">
                                                    <Check size={11} /> ĐÃ XUẤT ĐỦ
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 hover:scale-105 transition-transform">
                                                    <Hourglass size={11} /> CẦN XUẤT THÊM
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 shrink-0 relative z-10">
                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                    <span>Tổng số món: <strong className="text-slate-900 dark:text-white font-black">{partnerItemsModal.items.length}</strong> | </span>
                    <span>Đã xuất đủ: <strong className="text-emerald-700 dark:text-emerald-400 font-black">{partnerItemsModal.items.filter(i => i.temp_is_invoiced && i.temp_invoiced_quantity >= i.quantity).length}</strong> | </span>
                    <span>Cần xuất thêm: <strong className="text-rose-700 dark:text-rose-400 font-black">{partnerItemsModal.items.filter(i => !i.temp_is_invoiced || i.temp_invoiced_quantity < i.quantity).length}</strong></span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={() => setPartnerItemsModal({ ...partnerItemsModal, isOpen: false })}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                        Đóng
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSavePartnerItems}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 border border-emerald-400/20 cursor-pointer flex items-center gap-2"
                    >
                        <Check size={16} />
                        <span>Lưu Trạng Thái Món Hàng</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    </div>
)}
</AnimatePresence>,
document.body
)}

{/* MODAL 2: CẬP NHẬT ĐƠN LẺ (LIGHT MODE DEFAULT) */}
{mounted && typeof document !== 'undefined' && createPortal(
<AnimatePresence>
{editOrderModal.isOpen && editOrderModal.order && (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#fcfaf8] dark:bg-slate-950 backdrop-blur-2xl rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-slate-900 dark:text-white"
        >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
                        <Receipt size={20} />
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                        Cập nhật Hóa Đơn - Đơn {editOrderModal.order.display_id}
                    </h3>
                </div>
                <button
                    onClick={() => setEditOrderModal({ ...editOrderModal, isOpen: false })}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors border border-slate-200 dark:border-slate-800"
                >
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={handleSaveOrderModal} className="space-y-4">
                <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <input
                        type="checkbox"
                        id="modalOrderIsInvoiced"
                        checked={editOrderModal.isInvoiced}
                        onChange={(e) => setEditOrderModal({ ...editOrderModal, isInvoiced: e.target.checked })}
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                    />
                    <label htmlFor="modalOrderIsInvoiced" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                        Đã xuất hóa đơn điện tử / VAT
                    </label>
                </div>

                {editOrderModal.isInvoiced && (
                    <>
                        <div>
                            <label className="text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                Số Hóa Đơn (Tùy chọn)
                            </label>
                            <input
                                type="text"
                                placeholder="VD: HD-00123, 000456..."
                                value={editOrderModal.invoiceNo}
                                onChange={(e) => setEditOrderModal({ ...editOrderModal, invoiceNo: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white text-sm outline-none shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                Ghi Chú Hóa Đơn (Tùy chọn)
                            </label>
                            <textarea
                                placeholder="Ghi chú thêm (VD: Đã gửi mail cho khách, xuất qua MISA...)"
                                rows={3}
                                value={editOrderModal.invoiceNote}
                                onChange={(e) => setEditOrderModal({ ...editOrderModal, invoiceNote: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 font-bold text-slate-900 dark:text-white text-sm outline-none resize-none shadow-sm"
                            />
                        </div>
                    </>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setEditOrderModal({ ...editOrderModal, isOpen: false })}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 border border-emerald-400/20 cursor-pointer"
                    >
                        Lưu Thay Đổi
                    </button>
                </div>
            </form>
        </motion.div>
    </div>
)}
</AnimatePresence>,
document.body
)}

            {/* User Guide Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showGuideModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-500/30">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase">
                                                Hướng Dẫn Sử Dụng Theo Dõi Hóa Đơn
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                                Quy trình xuất hóa đơn, theo dõi nợ HĐ & đối soát món hàng
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowGuideModal(false)}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="overflow-y-auto space-y-6 py-4 pr-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    {/* 1. Ý nghĩa 3 tab */}
                                    <div className="space-y-2.5">
                                        <h4 className="font-black text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                            <Layers size={16} />
                                            <span>1. Ý nghĩa 3 Tab Quản Lý</span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                                                <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-[11px] uppercase">
                                                    <Calendar size={13} className="text-emerald-600" />
                                                    <span>Theo Ngày</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                                                    Chỉ hiện các khách hàng phát sinh trong ngày <strong>chưa xuất đủ hóa đơn</strong>. Khi bấm Xuất Đủ, khách tự động chuyển sang tab "Đã hoàn tất".
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20">
                                                <div className="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase">
                                                    <Hourglass size={13} className="text-rose-500" />
                                                    <span>Cần Xuất Thêm</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                                                    Tổng hợp tất cả khách hàng <strong>còn nợ hoặc mới xuất một phần</strong> món hàng từ trước đến nay để bạn không bao giờ bị bỏ sót.
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20">
                                                <div className="font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase">
                                                    <CheckCheck size={13} className="text-emerald-600" />
                                                    <span>Đã Hoàn Tất</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                                                    Lưu trữ và lọc danh sách những khách hàng & đơn hàng đã <strong>xuất đủ 100% hóa đơn</strong> theo từng ngày.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Cách xuất hóa đơn */}
                                    <div className="space-y-3">
                                        <h4 className="font-black text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                            <Sparkles size={16} />
                                            <span>2. Ba Cách Xuất Hóa Đơn Thuận Tiện</span>
                                        </h4>
                                        
                                        <div className="space-y-2.5">
                                            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                                                <div className="font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">A</span>
                                                    <span>Xuất Đủ Hàng Loạt (Chọn nhiều khách cùng lúc)</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                                                    Tick chọn các ô vuông bên trái từng khách hàng (hoặc bấm <em>Chọn tất cả</em>) &rarr; Nhập <em>Số HĐ chung</em> (nếu có) trên thanh công cụ &rarr; Bấm <strong>"Xuất Đủ ([X] khách)"</strong> để hoàn tất trong 1 giây.
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                                                <div className="font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">B</span>
                                                    <span>Xuất Đủ Nhanh 1 Khách Hàng (1 Click)</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                                                    Bấm trực tiếp nút <strong>"Xuất Đủ (Xong)"</strong> màu xanh trên thẻ của khách hàng đó để đánh dấu tất cả đơn hàng đã xuất xong.
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                                                <div className="font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">C</span>
                                                    <span>Xuất Chi Tiết Từng Món & Chỉnh Số Lượng Xuất Lẻ</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                                                    Bấm vào tên/thẻ khách hàng để mở bảng danh sách món &rarr; Tick chọn từng món cần xuất, điền số HĐ hoặc chỉnh số lượng xuất riêng từng dòng &rarr; Bấm <strong>"Lưu Tiến Độ"</strong>. Khách chưa xuất hết sẽ được tự động giữ lại ở tab <em>Cần Xuất Thêm</em>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Mẹo & Tiện ích */}
                                    <div className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                                        <h4 className="font-black text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                            <Lightbulb size={15} />
                                            <span>Mẹo Đối Soát Tiện Ích</span>
                                        </h4>
                                        <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                            <li><strong>Tìm kiếm đa năng:</strong> Gõ tên khách hàng, số điện thoại, tên món hàng, mã đơn (VD: <code>HD123</code>) hoặc số hóa đơn để tìm ngay.</li>
                                            <li><strong>Xuất Báo Cáo Excel:</strong> Nhấn nút "Xuất Báo Cáo Excel" ở góc trên để tải bảng thống kê chi tiết gửi cho kế toán hoặc phần mềm hóa đơn điện tử.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
                                    <button
                                        onClick={() => setShowGuideModal(false)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
                                    >
                                        Đã Hiểu & Đóng
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
