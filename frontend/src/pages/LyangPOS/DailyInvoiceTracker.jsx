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
    ExternalLink,
    Filter,
    Layers,
    Package,
    Hourglass,
    CheckCheck,
    ArrowUpRight
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { cn } from '../../lib/utils';
import { createPortal } from 'react-dom';

export default function DailyInvoiceTracker() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [scope, setScope] = useState('daily'); // 'daily', 'pending', 'completed'
    const [selectedDate, setSelectedDate] = useState(todayStr);
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

    // Fetch invoice tracking data
    const fetchInvoiceData = async (currentScope = scope, date = selectedDate) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/accounting/daily-invoices', {
                params: {
                    scope: currentScope,
                    date: currentScope === 'daily' ? date : undefined,
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
        }
    };

    useEffect(() => {
        fetchInvoiceData(scope, selectedDate);
    }, [scope, selectedDate, statusFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoiceData(scope, selectedDate);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleExpand = (partnerId) => {
        setExpandedPartners(prev => ({
            ...prev,
            [partnerId]: !prev[partnerId]
        }));
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
                detail_id: it.id,
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
            fetchInvoiceData(scope, selectedDate);
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
            await axios.post(`/api/accounting/order-details/${item.id}/invoice-status`, payload);
            toast.success(`Đã lưu riêng món "${item.product_name}" thành công!`);
            fetchInvoiceData(scope, selectedDate);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu dòng món hàng này");
        }
    };

    // Quick toggle single item line from the main list
    const handleQuickToggleItem = async (item, targetStatus) => {
        try {
            await axios.post(`/api/accounting/order-details/${item.id}/invoice-status`, {
                is_invoiced: targetStatus,
                invoiced_quantity: targetStatus ? Number(item.quantity) : 0,
                invoice_no: targetStatus ? (item.invoice_no || '') : ''
            });
            toast.success(targetStatus ? `Đã đánh dấu xuất HĐ cho món "${item.product_name}"` : `Đã bỏ xuất HĐ món "${item.product_name}"`);
            fetchInvoiceData(scope, selectedDate);
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
            fetchInvoiceData(scope, selectedDate);
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
            fetchInvoiceData(scope, selectedDate);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu thông tin");
        }
    };

    // Batch mark all orders of partner
    const handleBatchPartnerInvoice = async (partnerId, isInvoiced) => {
        try {
            const res = await axios.post(`/api/accounting/partners/${partnerId}/batch-invoice`, {
                date: scope === 'daily' ? selectedDate : null,
                is_invoiced: isInvoiced,
                invoice_no: '',
                invoice_note: ''
            });
            toast.success(res.data.message || "Đã cập nhật hóa đơn cho khách hàng!");
            fetchInvoiceData(scope, selectedDate);
        } catch (err) {
            console.error(err);
            toast.error("Không thể cập nhật toàn bộ đơn của khách");
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
        <div className="space-y-6">
            {/* SUB-TABS (DAILY vs PENDING NEED MORE vs COMPLETED) */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <button
                        onClick={() => setScope('daily')}
                        className={cn(
                            "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                            scope === 'daily'
                                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                    >
                        <Calendar size={15} />
                        <span>Hôm Nay / Theo Ngày</span>
                    </button>

                    <button
                        onClick={() => setScope('pending')}
                        className={cn(
                            "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer relative",
                            scope === 'pending'
                                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-md"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                    >
                        <Hourglass size={15} className="text-rose-500 animate-pulse" />
                        <span>Cần Xuất Thêm / Nợ HĐ</span>
                        {scope === 'daily' && summary.uninvoiced_partners_count > 0 && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-4 ring-rose-500/20" />
                        )}
                    </button>

                    <button
                        onClick={() => setScope('completed')}
                        className={cn(
                            "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                            scope === 'completed'
                                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                    >
                        <CheckCheck size={16} />
                        <span>Đã Hoàn Tất</span>
                    </button>
                </div>

                {/* Date Controls (only for daily scope) */}
                <div className="flex flex-wrap items-center gap-3">
                    {scope === 'daily' && (
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                            <Calendar size={16} className="text-emerald-600 dark:text-emerald-400 ml-2" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent font-black text-slate-800 dark:text-slate-100 text-xs outline-none px-2 py-1 cursor-pointer"
                            />
                            <button
                                onClick={() => handleQuickDate(0)}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer",
                                    selectedDate === todayStr ? "bg-emerald-600 text-white font-black" : "bg-slate-200 text-slate-600"
                                )}
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => handleQuickDate(-1)}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                            >
                                Hôm qua
                            </button>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => fetchInvoiceData(scope, selectedDate)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw size={16} className={cn(loading && "animate-spin text-emerald-600")} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleExportExcel}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                        <FileSpreadsheet size={15} />
                        <span>Xuất Excel Báo Cáo</span>
                    </motion.button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tổng đối tác */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center shadow-inner">
                            <Users size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                {scope === 'pending' ? 'Đối Tác Cần Xuất Thêm HĐ' : 'Tổng Đối Tác'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{summary.total_partners_count}</span>
                                <span className="text-xs font-bold text-slate-400">khách ({summary.total_orders_count} đơn)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Đã xuất đủ */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                Đã Xuất Đủ ({summary.total_partners_count ? Math.round((summary.invoiced_partners_count / summary.total_partners_count) * 100) : 0}%)
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{summary.invoiced_partners_count}</span>
                                <span className="text-xs font-bold text-emerald-600/70">khách ({summary.invoiced_amount.toLocaleString()}đ)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chưa xuất đủ / Cần xuất thêm */}
                <div className={cn(
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border shadow-sm relative overflow-hidden",
                    summary.uninvoiced_partners_count > 0 ? "border-rose-300 dark:border-rose-900/80 bg-rose-50/20" : "border-slate-200 dark:border-slate-800"
                )}>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                            summary.uninvoiced_partners_count > 0 ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400" : "bg-slate-100 text-slate-400"
                        )}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Chưa Xuất Đủ / Nợ HĐ</p>
                            <div className="flex items-baseline gap-2">
                                <span className={cn("text-2xl font-black tabular-nums", summary.uninvoiced_partners_count > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white")}>
                                    {summary.uninvoiced_partners_count}
                                </span>
                                <span className="text-xs font-bold text-rose-500/80">khách ({summary.uninvoiced_amount.toLocaleString()}đ)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Doanh thu */}
                <div className="bg-slate-900 dark:bg-slate-950 p-5 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tổng Giá Trị Đơn Hàng</p>
                            <p className="text-xl font-black text-white tabular-nums">
                                {summary.total_sales_amount.toLocaleString()}đ
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên đối tác, SĐT, tên món/sản phẩm, mã đơn (HD...)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/70 border border-transparent focus:border-emerald-500/30 rounded-xl outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto">
                    {[
                        { id: 'all', label: `Tất cả (${summary.total_partners_count})` },
                        { id: 'uninvoiced', label: `🔴 Chưa đủ (${summary.uninvoiced_partners_count})` },
                        { id: 'invoiced', label: `🟢 Xuất đủ (${summary.invoiced_partners_count})` }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                                statusFilter === f.id
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List of Partners and their Items / Orders */}
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={36} />
                    <p className="text-sm font-black text-slate-500 uppercase tracking-wider">Đang tải dữ liệu theo dõi hóa đơn...</p>
                </div>
            ) : partners.length === 0 ? (
                <div className="py-20 text-center bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12">
                    <Receipt className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={56} />
                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase">
                        {scope === 'pending' ? 'Tuyệt Vời! Không Có Khách Nào Cần Xuất Thêm Hóa Đơn' : 'Không Có Dữ Liệu Phù Hợp'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        {scope === 'pending'
                            ? 'Tất cả các đối tác và đơn hàng đã được xuất đủ hóa đơn hoàn tất.'
                            : 'Không tìm thấy phát sinh đơn bán hàng nào trong phạm vi đã chọn.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {partners.map((partner) => {
                        const isExpanded = !!expandedPartners[partner.partner_id];
                        const isFullyInvoiced = partner.is_fully_invoiced;
                        const pendingItemsCount = partner.pending_items_count || 0;
                        const totalItemsCount = partner.total_items_count || 0;

                        return (
                            <div
                                key={partner.partner_id}
                                className={cn(
                                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden",
                                    isFullyInvoiced
                                        ? "border-emerald-500/30 hover:border-emerald-500/60"
                                        : "border-rose-400/40 hover:border-rose-500/70 bg-gradient-to-r from-rose-500/5 to-transparent"
                                )}
                            >
                                {/* Partner Card Header */}
                                <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => openPartnerItemsModal(partner)}>
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm shrink-0",
                                            isFullyInvoiced
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                        )}>
                                            {partner.partner_name.charAt(0).toUpperCase()}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h3 className="text-base font-black text-slate-900 dark:text-white hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                                                    <span>{partner.partner_name}</span>
                                                    <ArrowUpRight size={14} className="text-slate-400" />
                                                </h3>
                                                
                                                {/* Status Badge */}
                                                {isFullyInvoiced ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30">
                                                        <Check size={12} /> ĐÃ XUẤT ĐỦ (XONG) - {totalItemsCount} MÓN
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                                                        <AlertCircle size={12} /> CHƯA ĐỦ - CẦN XUẤT {pendingItemsCount}/{totalItemsCount} MÓN
                                                    </span>
                                                )}

                                                {partner.invoice_numbers && partner.invoice_numbers.length > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        Số HĐ: {partner.invoice_numbers.join(', ')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap font-medium">
                                                {partner.partner_phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={12} /> {partner.partner_phone}
                                                    </span>
                                                )}
                                                {partner.partner_address && (
                                                    <span className="flex items-center gap-1 truncate max-w-xs">
                                                        <MapPin size={12} /> {partner.partner_address}
                                                    </span>
                                                )}
                                                {partner.partner_debt !== 0 && (
                                                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                                                        Nợ hiện tại: {partner.partner_debt.toLocaleString()}đ
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Partner Totals & Quick Actions */}
                                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tổng Mua ({partner.total_orders_count} đơn)</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                                {partner.total_amount.toLocaleString()}đ
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Button to open Item-level Tracker */}
                                            <motion.button
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => openPartnerItemsModal(partner)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border border-blue-500/20"
                                            >
                                                <Package size={14} />
                                                <span>Xem Món Cần Xuất ({partner.items?.length || 0})</span>
                                            </motion.button>

                                            {/* Batch toggle button */}
                                            {isFullyInvoiced ? (
                                                <button
                                                    onClick={() => handleBatchPartnerInvoice(partner.partner_id, false)}
                                                    className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer whitespace-nowrap"
                                                >
                                                    Bỏ đánh dấu
                                                </button>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={() => handleBatchPartnerInvoice(partner.partner_id, true)}
                                                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    <Check size={14} />
                                                    <span>Xuất Đủ (Xong)</span>
                                                </motion.button>
                                            )}

                                            <button
                                                onClick={() => toggleExpand(partner.partner_id)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                            >
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Order details table under partner */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2.5">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                    Danh Sách Các Món Hàng Cần Xuất Hóa Đơn ({partner.items?.length || 0} món):
                                                </p>
                                                <button
                                                    onClick={() => openPartnerItemsModal(partner)}
                                                    className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span>Mở bảng chỉnh sửa & track chi tiết</span>
                                                    <ArrowRight size={12} />
                                                </button>
                                            </div>

                                            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                                                            <th className="py-2.5 px-3.5 w-12 text-center">Xuất HĐ</th>
                                                            <th className="py-2.5 px-3.5 w-10 text-center">STT</th>
                                                            <th className="py-2.5 px-3.5">Mã đơn</th>
                                                            <th className="py-2.5 px-3.5">Tên món / Sản phẩm</th>
                                                            <th className="py-2.5 px-3.5 text-center">ĐVT</th>
                                                            <th className="py-2.5 px-3.5 text-center">SL Mua</th>
                                                            <th className="py-2.5 px-3.5 text-center">SL Đã Xuất HĐ</th>
                                                            <th className="py-2.5 px-3.5 text-right">Đơn giá</th>
                                                            <th className="py-2.5 px-3.5 text-right">Thành tiền</th>
                                                            <th className="py-2.5 px-3.5 text-center">Trạng thái HĐ</th>
                                                            <th className="py-2.5 px-3.5 text-center">Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                                        {(partner.items || []).map((item, idx) => {
                                                            const isItemInvoiced = item.is_invoiced || item.invoiced_quantity >= item.quantity;

                                                            return (
                                                                <tr
                                                                    key={item.id || idx}
                                                                    className={cn(
                                                                        "transition-colors",
                                                                        isItemInvoiced
                                                                            ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                                                                            : "bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/50"
                                                                    )}
                                                                >
                                                                    <td className="py-2.5 px-3.5 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={Boolean(isItemInvoiced)}
                                                                            onChange={() => handleQuickToggleItem(item, !isItemInvoiced)}
                                                                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                                                            title="Đánh dấu riêng dòng này"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 font-bold text-slate-600 dark:text-slate-300 font-mono">
                                                                        {item.order_display_id}
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 font-black text-slate-900 dark:text-white">
                                                                        <span>{item.product_name}</span>
                                                                        {item.product_code && (
                                                                            <span className="text-[10px] text-slate-400 ml-2 font-mono">({item.product_code})</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-center text-slate-500">
                                                                        {item.unit || 'ĐV'}
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-center font-black text-slate-900 dark:text-white">
                                                                        {item.quantity}
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-center font-black">
                                                                        <span className={cn(
                                                                            "px-2 py-0.5 rounded-md text-[11px]",
                                                                            isItemInvoiced ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                                                        )}>
                                                                            {item.invoiced_quantity || (item.is_invoiced ? item.quantity : 0)} / {item.quantity}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                                                                        {item.price?.toLocaleString()}đ
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-right font-black text-slate-900 dark:text-white tabular-nums">
                                                                        {item.total_price?.toLocaleString()}đ
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuickToggleItem(item, !isItemInvoiced)}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            {isItemInvoiced ? (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:scale-105 transition-transform">
                                                                                    <Check size={10} /> ĐÃ XUẤT ĐỦ
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:scale-105 transition-transform">
                                                                                    <AlertCircle size={10} /> CẦN XUẤT
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    </td>
                                                                    <td className="py-2.5 px-3.5 text-center">
                                                                        <button
                                                                            onClick={() => openPartnerItemsModal(partner)}
                                                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 font-bold transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]"
                                                                            title="Mở bảng chi tiết"
                                                                        >
                                                                            <Edit3 size={13} />
                                                                            <span>Sửa</span>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL 1: CHI TIẾT & TRACK MÓN CẦN XUẤT HÓA ĐƠN CỦA ĐỐI TÁC */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {partnerItemsModal.isOpen && partnerItemsModal.partner && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 max-w-7xl w-[96vw] max-h-[94vh] h-[94vh] shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                                Chi Tiết Món Xuất Hóa Đơn - {partnerItemsModal.partner.partner_name}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium">
                                                Track xem từng món đã xuất đủ hay chưa. Món chưa xuất đủ sẽ được lưu vào tab "Cần xuất thêm".
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPartnerItemsModal({ ...partnerItemsModal, isOpen: false })}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Quick Controls & Invoice No Bar */}
                                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase shrink-0">Số HĐ chung:</span>
                                        <input
                                            type="text"
                                            placeholder="VD: HD-00123"
                                            value={partnerItemsModal.commonInvoiceNo}
                                            onChange={(e) => setPartnerItemsModal({ ...partnerItemsModal, commonInvoiceNo: e.target.value })}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 w-full sm:w-48"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSetAllItemsStatus(true)}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                        >
                                            <Check size={13} />
                                            <span>Đánh Dấu Xuất Đủ Tất Cả</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSetAllItemsStatus(false)}
                                            className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                                        >
                                            Bỏ chọn tất cả
                                        </button>
                                    </div>
                                </div>

                                {/* Items List Table with Tracking Checkboxes & Quantity Input */}
                                <div className="overflow-y-auto flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                                            <tr>
                                                <th className="py-3 px-3.5 w-12 text-center">Xuất HĐ</th>
                                                <th className="py-3 px-3.5">Mã đơn</th>
                                                <th className="py-3 px-3.5">Món / Sản phẩm</th>
                                                <th className="py-3 px-3.5 text-center">ĐVT</th>
                                                <th className="py-3 px-3.5 text-center">SL Mua</th>
                                                <th className="py-3 px-3.5 text-center">SL Đã Xuất HĐ</th>
                                                <th className="py-3 px-3.5 text-center">Số HĐ Riêng</th>
                                                <th className="py-3 px-3.5 text-right">Đơn giá</th>
                                                <th className="py-3 px-3.5 text-right">Thành tiền</th>
                                                <th className="py-3 px-3.5 text-center">Trạng thái</th>
                                                <th className="py-3 px-3.5 text-center">Lưu Dòng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                            {partnerItemsModal.items.map((item, idx) => {
                                                const isDone = item.temp_is_invoiced && (item.temp_invoiced_quantity >= item.quantity);

                                                return (
                                                    <tr
                                                        key={item.id || idx}
                                                        className={cn(
                                                            "transition-colors",
                                                            isDone
                                                                ? "bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/50"
                                                                : "bg-rose-50/20 dark:bg-rose-950/20 hover:bg-rose-50/40"
                                                        )}
                                                    >
                                                        <td 
                                                            className="py-3 px-3.5 text-center cursor-pointer select-none"
                                                            onClick={() => handleToggleItemStatus(idx)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={Boolean(item.temp_is_invoiced)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleItemStatus(idx);
                                                                }}
                                                                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3.5 font-bold font-mono text-slate-500">
                                                            {item.order_display_id}
                                                        </td>
                                                        <td className="py-3 px-3.5 font-black text-slate-900 dark:text-white">
                                                            <span>{item.product_name}</span>
                                                            {item.product_code && (
                                                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({item.product_code})</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3.5 text-center text-slate-500">
                                                            {item.unit || 'ĐV'}
                                                        </td>
                                                        <td className="py-3 px-3.5 text-center font-black text-slate-900 dark:text-white">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="py-3 px-3.5 text-center">
                                                            <div className="flex items-center justify-center gap-1">
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
                                                                    className="w-16 py-1 px-2 text-center font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 text-xs"
                                                                />
                                                                <span className="text-slate-400 font-bold">/ {item.quantity}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3.5 text-center">
                                                            <input
                                                                type="text"
                                                                placeholder="Số HĐ riêng"
                                                                value={item.temp_invoice_no || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setPartnerItemsModal(prev => {
                                                                        const nextItems = prev.items.map((it, i) => {
                                                                            if (i !== idx) return it;
                                                                            return { ...it, temp_invoice_no: val };
                                                                        });
                                                                        return { ...prev, items: nextItems };
                                                                    });
                                                                }}
                                                                className="w-24 py-1 px-2 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 text-xs"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3.5 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                                                            {item.price?.toLocaleString()}đ
                                                        </td>
                                                        <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white tabular-nums">
                                                            {item.total_price?.toLocaleString()}đ
                                                        </td>
                                                        <td className="py-3 px-3.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleItemStatus(idx)}
                                                                className="cursor-pointer"
                                                            >
                                                                {isDone ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/20 hover:scale-105 transition-transform">
                                                                        <Check size={11} /> ĐÃ XUẤT ĐỦ
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-500/20 hover:scale-105 transition-transform">
                                                                        <Hourglass size={11} /> CẦN XUẤT THÊM
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="py-3 px-3.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveSingleModalItem(item)}
                                                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-xl font-black text-xs transition-all cursor-pointer inline-flex items-center gap-1 border border-emerald-500/20"
                                                                title="Lưu riêng dòng này"
                                                            >
                                                                <Check size={12} />
                                                                <span>Lưu Dòng</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 shrink-0">
                                    <div className="text-xs text-slate-500">
                                        <span>Tổng số món: <strong>{partnerItemsModal.items.length}</strong> | </span>
                                        <span>Đã xuất đủ: <strong className="text-emerald-600">{partnerItemsModal.items.filter(i => i.temp_is_invoiced && i.temp_invoiced_quantity >= i.quantity).length}</strong> | </span>
                                        <span>Cần xuất thêm: <strong className="text-rose-600">{partnerItemsModal.items.filter(i => !i.temp_is_invoiced || i.temp_invoiced_quantity < i.quantity).length}</strong></span>
                                    </div>

                                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setPartnerItemsModal({ ...partnerItemsModal, isOpen: false })}
                                            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                                        >
                                            Đóng
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleSavePartnerItems}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
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

            {/* MODAL 2: CẬP NHẬT ĐƠN LẺ */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {editOrderModal.isOpen && editOrderModal.order && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                            <Receipt size={20} />
                                        </div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                                            Cập nhật Hóa Đơn - Đơn {editOrderModal.order.display_id}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setEditOrderModal({ ...editOrderModal, isOpen: false })}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveOrderModal} className="space-y-4">
                                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <input
                                            type="checkbox"
                                            id="modalOrderIsInvoiced"
                                            checked={editOrderModal.isInvoiced}
                                            onChange={(e) => setEditOrderModal({ ...editOrderModal, isInvoiced: e.target.checked })}
                                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <label htmlFor="modalOrderIsInvoiced" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                                            Đã xuất hóa đơn điện tử / VAT
                                        </label>
                                    </div>

                                    {editOrderModal.isInvoiced && (
                                        <>
                                            <div>
                                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                                                    Số Hóa Đơn (Tùy chọn)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="VD: HD-00123, 000456..."
                                                    value={editOrderModal.invoiceNo}
                                                    onChange={(e) => setEditOrderModal({ ...editOrderModal, invoiceNo: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-emerald-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                                                    Ghi Chú Hóa Đơn (Tùy chọn)
                                                </label>
                                                <textarea
                                                    placeholder="Ghi chú thêm (VD: Đã gửi mail cho khách, xuất qua MISA...)"
                                                    rows={3}
                                                    value={editOrderModal.invoiceNote}
                                                    onChange={(e) => setEditOrderModal({ ...editOrderModal, invoiceNote: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-emerald-500 resize-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="flex items-center justify-end gap-2.5 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditOrderModal({ ...editOrderModal, isOpen: false })}
                                            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer"
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
        </div>
    );
}
