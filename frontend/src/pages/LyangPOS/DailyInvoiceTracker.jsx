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
    Filter
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { cn } from '../../lib/utils';

export default function DailyInvoiceTracker() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [data, setData] = useState({
        summary: {
            total_partners_count: 0,
            invoiced_partners_count: 0,
            uninvoiced_partners_count: 0,
            total_sales_amount: 0,
            invoiced_amount: 0,
            uninvoiced_amount: 0,
            total_orders_count: 0,
            invoiced_orders_count: 0,
            uninvoiced_orders_count: 0
        },
        partners: []
    });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'uninvoiced', 'invoiced'
    const [expandedPartners, setExpandedPartners] = useState({});

    // Modal state for editing invoice details
    const [editModal, setEditModal] = useState({
        isOpen: false,
        type: 'order', // 'order' or 'partner'
        targetId: null,
        partnerId: null,
        title: '',
        invoiceNo: '',
        invoiceNote: '',
        isInvoiced: true
    });

    // Fetch daily invoice status
    const fetchDailyInvoices = async (date = selectedDate) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/accounting/daily-invoices', {
                params: {
                    date: date,
                    search: searchQuery,
                    status: statusFilter
                }
            });
            setData(res.data);
            
            // Auto expand all partners initially if <= 10
            if (res.data.partners && res.data.partners.length <= 10) {
                const initialExpanded = {};
                res.data.partners.forEach(p => {
                    initialExpanded[p.partner_id] = true;
                });
                setExpandedPartners(initialExpanded);
            }
        } catch (error) {
            console.error("Error fetching daily invoices:", error);
            toast.error("Không thể tải dữ liệu xuất hóa đơn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyInvoices(selectedDate);
    }, [selectedDate, statusFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDailyInvoices(selectedDate);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleExpand = (partnerId) => {
        setExpandedPartners(prev => ({
            ...prev,
            [partnerId]: !prev[partnerId]
        }));
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
            fetchDailyInvoices(selectedDate);
        } catch (err) {
            console.error(err);
            toast.error("Không thể cập nhật trạng thái hóa đơn");
        }
    };

    // Open Edit Modal for an Order
    const openOrderEditModal = (order, partner) => {
        setEditModal({
            isOpen: true,
            type: 'order',
            targetId: order.id,
            partnerId: partner.partner_id,
            title: `Cập nhật Hóa Đơn - Đơn hàng ${order.display_id} (${partner.partner_name})`,
            invoiceNo: order.invoice_no || '',
            invoiceNote: order.invoice_note || '',
            isInvoiced: order.is_invoiced !== false
        });
    };

    // Open Batch Edit Modal for a Partner
    const openPartnerBatchModal = (partner, targetStatus) => {
        if (!targetStatus) {
            // Quick unmark
            handleBatchPartnerInvoice(partner.partner_id, false, '', '');
            return;
        }

        setEditModal({
            isOpen: true,
            type: 'partner',
            targetId: partner.partner_id,
            partnerId: partner.partner_id,
            title: `Đánh dấu Xuất HĐ Toàn Bộ Đơn - ${partner.partner_name} (${partner.orders.length} đơn)`,
            invoiceNo: partner.invoice_numbers && partner.invoice_numbers[0] ? partner.invoice_numbers[0] : '',
            invoiceNote: '',
            isInvoiced: true
        });
    };

    // Submit Edit Modal
    const handleModalSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editModal.type === 'order') {
                await axios.post(`/api/accounting/orders/${editModal.targetId}/invoice-status`, {
                    is_invoiced: editModal.isInvoiced,
                    invoice_no: editModal.invoiceNo,
                    invoice_note: editModal.invoiceNote
                });
                toast.success("Đã cập nhật thông tin hóa đơn đơn hàng!");
            } else {
                await handleBatchPartnerInvoice(editModal.targetId, editModal.isInvoiced, editModal.invoiceNo, editModal.invoiceNote);
            }
            setEditModal({ ...editModal, isOpen: false });
            fetchDailyInvoices(selectedDate);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu thông tin");
        }
    };

    const handleBatchPartnerInvoice = async (partnerId, isInvoiced, invoiceNo, invoiceNote) => {
        try {
            const res = await axios.post(`/api/accounting/partners/${partnerId}/batch-invoice`, {
                date: selectedDate,
                is_invoiced: isInvoiced,
                invoice_no: invoiceNo,
                invoice_note: invoiceNote
            });
            toast.success(res.data.message || "Đã cập nhật hóa đơn cho khách hàng!");
            fetchDailyInvoices(selectedDate);
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
            toast.error("Không có dữ liệu trong ngày này để xuất file!");
            return;
        }

        const rows = [];
        data.partners.forEach(p => {
            p.orders.forEach(o => {
                const timeStr = o.date ? new Date(o.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                rows.push({
                    "Ngày": selectedDate,
                    "Giờ tạo": timeStr,
                    "Khách hàng / Đối tác": p.partner_name,
                    "Số điện thoại": p.partner_phone || '---',
                    "Địa chỉ": p.partner_address || '---',
                    "Mã đơn hàng": o.display_id,
                    "Tổng tiền đơn": o.total_amount || 0,
                    "Đã thanh toán": o.amount_paid || 0,
                    "Hình thức thanh toán": o.payment_method || '---',
                    "Trạng thái Hóa đơn": o.is_invoiced ? 'ĐÃ XUẤT HÓA ĐƠN' : 'CHƯA XUẤT',
                    "Số Hóa Đơn": o.invoice_no || '---',
                    "Ngày xuất HĐ": o.invoice_date ? new Date(o.invoice_date).toLocaleString('vi-VN') : '---',
                    "Ghi chú HĐ": o.invoice_note || '---'
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Theo_Doi_Hoa_Don");

        const filename = `Theo_Doi_Xuat_Hoa_Don_${selectedDate}.xlsx`;
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
            {/* Top Filter & Control Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xl">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Date picker & Quick Select */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                            <Calendar size={18} className="text-emerald-600 dark:text-emerald-400 ml-2" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent font-black text-slate-800 dark:text-slate-100 text-sm outline-none px-2 py-1 cursor-pointer"
                            />
                        </div>

                        {/* Quick date buttons */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleQuickDate(0)}
                                className={cn(
                                    "px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer",
                                    selectedDate === todayStr
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                )}
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => handleQuickDate(-1)}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                            >
                                Hôm qua
                            </button>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => fetchDailyInvoices(selectedDate)}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <RefreshCw size={15} className={cn(loading && "animate-spin text-emerald-600")} />
                            <span>Làm mới</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleExportExcel}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                            <FileSpreadsheet size={16} />
                            <span>Xuất Excel Báo Cáo</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tổng khách có đơn */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center shadow-inner">
                            <Users size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Khách Có Đơn Trong Ngày</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{data.summary.total_partners_count}</span>
                                <span className="text-xs font-bold text-slate-400">khách ({data.summary.total_orders_count} đơn)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Đã xuất hóa đơn */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                Đã Xuất Hóa Đơn ({data.summary.total_partners_count ? Math.round((data.summary.invoiced_partners_count / data.summary.total_partners_count) * 100) : 0}%)
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{data.summary.invoiced_partners_count}</span>
                                <span className="text-xs font-bold text-emerald-600/70">khách ({data.summary.invoiced_amount.toLocaleString()}đ)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chưa xuất hóa đơn */}
                <div className={cn(
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border shadow-sm relative overflow-hidden",
                    data.summary.uninvoiced_partners_count > 0 ? "border-rose-300 dark:border-rose-900/80 bg-rose-50/20" : "border-slate-200 dark:border-slate-800"
                )}>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                            data.summary.uninvoiced_partners_count > 0 ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400" : "bg-slate-100 text-slate-400"
                        )}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Chưa Xuất Hóa Đơn</p>
                            <div className="flex items-baseline gap-2">
                                <span className={cn("text-2xl font-black tabular-nums", data.summary.uninvoiced_partners_count > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white")}>
                                    {data.summary.uninvoiced_partners_count}
                                </span>
                                <span className="text-xs font-bold text-rose-500/80">khách ({data.summary.uninvoiced_amount.toLocaleString()}đ)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Doanh thu ngày */}
                <div className="bg-slate-900 dark:bg-slate-950 p-5 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tổng Doanh Thu Ngày</p>
                            <p className="text-xl font-black text-white tabular-nums">
                                {data.summary.total_sales_amount.toLocaleString()}đ
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
                        placeholder="Tìm kiếm theo tên khách, SĐT, mã đơn (HD...), số HĐ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/70 border border-transparent focus:border-emerald-500/30 rounded-xl outline-none font-bold text-sm text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto">
                    {[
                        { id: 'all', label: `Tất cả (${data.summary.total_partners_count})` },
                        { id: 'uninvoiced', label: `🔴 Chưa xuất (${data.summary.uninvoiced_partners_count})` },
                        { id: 'invoiced', label: `🟢 Đã xuất (${data.summary.invoiced_partners_count})` }
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

            {/* List of Partners and their Orders */}
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-3" size={36} />
                    <p className="text-sm font-black text-slate-500 uppercase tracking-wider">Đang tải danh sách theo dõi hóa đơn...</p>
                </div>
            ) : data.partners.length === 0 ? (
                <div className="py-20 text-center bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12">
                    <Receipt className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={56} />
                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase">Không Có Đơn Hàng Nào Trong Ngày {selectedDate}</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Không tìm thấy phát sinh đơn bán hàng nào phù hợp với bộ lọc ngày hiện tại. Hãy chọn ngày khác hoặc kiểm tra bộ lọc.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.partners.map((partner) => {
                        const isExpanded = !!expandedPartners[partner.partner_id];
                        const isFullyInvoiced = partner.is_fully_invoiced;

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
                                    <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleExpand(partner.partner_id)}>
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
                                                <h3 className="text-base font-black text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                                                    {partner.partner_name}
                                                </h3>
                                                
                                                {/* Status Badge */}
                                                {isFullyInvoiced ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30">
                                                        <Check size={12} /> ĐÃ XUẤT HÓA ĐƠN ({partner.invoiced_orders_count}/{partner.total_orders_count} ĐƠN)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                                                        <AlertCircle size={12} /> CẦN XUẤT HÓA ĐƠN ({partner.uninvoiced_orders_count} ĐƠN CHƯA XUẤT)
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
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tổng Mua Trong Ngày</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                                {partner.total_amount.toLocaleString()}đ
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Batch toggle button */}
                                            {isFullyInvoiced ? (
                                                <button
                                                    onClick={() => openPartnerBatchModal(partner, false)}
                                                    className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer whitespace-nowrap"
                                                >
                                                    Bỏ đánh dấu
                                                </button>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={() => openPartnerBatchModal(partner, true)}
                                                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    <Check size={14} />
                                                    <span>Đánh dấu ĐÃ XUẤT ({partner.orders.length} đơn)</span>
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
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                                                Danh Sách Đơn Hàng Trong Ngày ({partner.orders.length} đơn):
                                            </p>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                                                            <th className="py-2.5 px-3.5 w-12 text-center">STT</th>
                                                            <th className="py-2.5 px-3.5">Mã đơn</th>
                                                            <th className="py-2.5 px-3.5">Giờ tạo</th>
                                                            <th className="py-2.5 px-3.5 text-right">Tổng tiền</th>
                                                            <th className="py-2.5 px-3.5">Hình thức TT</th>
                                                            <th className="py-2.5 px-3.5 text-center">Trạng thái HĐ</th>
                                                            <th className="py-2.5 px-3.5">Số HĐ / Ghi chú</th>
                                                            <th className="py-2.5 px-3.5 text-right">Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                                        {partner.orders.map((order, idx) => {
                                                            const timeStr = order.date ? new Date(order.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

                                                            return (
                                                                <tr
                                                                    key={order.id}
                                                                    className={cn(
                                                                        "transition-colors",
                                                                        order.is_invoiced
                                                                            ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                                                                            : "bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/50"
                                                                    )}
                                                                >
                                                                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="py-3 px-3.5 font-black text-slate-900 dark:text-white font-mono">
                                                                        {order.display_id}
                                                                    </td>
                                                                    <td className="py-3 px-3.5 text-slate-500 flex items-center gap-1">
                                                                        <Clock size={12} className="text-slate-400" />
                                                                        <span>{timeStr}</span>
                                                                    </td>
                                                                    <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white tabular-nums">
                                                                        {order.total_amount.toLocaleString()}đ
                                                                    </td>
                                                                    <td className="py-3 px-3.5">
                                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                                            {order.payment_method || 'Tiền mặt'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-3.5 text-center">
                                                                        {order.is_invoiced ? (
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                                <Check size={11} /> ĐÃ XUẤT
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                                                <AlertCircle size={11} /> CHƯA XUẤT
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                                                                        {order.invoice_no ? (
                                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 mr-2">
                                                                                Số: {order.invoice_no}
                                                                            </span>
                                                                        ) : null}
                                                                        {order.invoice_note ? (
                                                                            <span className="text-slate-400 text-[11px] italic">
                                                                                ({order.invoice_note})
                                                                            </span>
                                                                        ) : (!order.invoice_no && <span className="text-slate-300 dark:text-slate-600">---</span>)}
                                                                    </td>
                                                                    <td className="py-3 px-3.5 text-right">
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            <button
                                                                                onClick={() => handleToggleOrderInvoice(order, !order.is_invoiced)}
                                                                                className={cn(
                                                                                    "p-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                                                                                    order.is_invoiced
                                                                                        ? "bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600"
                                                                                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                                                                )}
                                                                                title={order.is_invoiced ? "Bỏ đánh dấu xuất HĐ" : "Đánh dấu đã xuất HĐ"}
                                                                            >
                                                                                {order.is_invoiced ? <X size={14} /> : <Check size={14} />}
                                                                            </button>

                                                                            <button
                                                                                onClick={() => openOrderEditModal(order, partner)}
                                                                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                                                                                title="Nhập số hóa đơn / ghi chú"
                                                                            >
                                                                                <Edit3 size={14} />
                                                                            </button>
                                                                        </div>
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

            {/* Modal Edit Invoice Info */}
            <AnimatePresence>
                {editModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                                        {editModal.title}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setEditModal({ ...editModal, isOpen: false })}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleModalSubmit} className="space-y-4">
                                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <input
                                        type="checkbox"
                                        id="modalIsInvoiced"
                                        checked={editModal.isInvoiced}
                                        onChange={(e) => setEditModal({ ...editModal, isInvoiced: e.target.checked })}
                                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor="modalIsInvoiced" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                                        Đã xuất hóa đơn điện tử / VAT
                                    </label>
                                </div>

                                {editModal.isInvoiced && (
                                    <>
                                        <div>
                                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                                                Số Hóa Đơn (Tùy chọn)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: HD-00123, 000456..."
                                                value={editModal.invoiceNo}
                                                onChange={(e) => setEditModal({ ...editModal, invoiceNo: e.target.value })}
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
                                                value={editModal.invoiceNote}
                                                onChange={(e) => setEditModal({ ...editModal, invoiceNote: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-emerald-500 resize-none"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center justify-end gap-2.5 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditModal({ ...editModal, isOpen: false })}
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
            </AnimatePresence>
        </div>
    );
}
