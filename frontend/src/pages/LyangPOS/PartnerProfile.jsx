import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    Search, Users, Phone, MapPin, CreditCard, Calendar,
    RefreshCw, Download, ShoppingCart, History, Package,
    ChevronDown, Receipt, CheckCircle2, TrendingUp,
    Printer, Mail, Share2, Info, User, Plus, Edit2,
    Activity, Sprout, Wheat, Droplets, ArrowLeft, ExternalLink
} from 'lucide-react';
import { cn, formatNumber, formatDebt, formatDate } from '../../lib/utils';
import LoadingOverlay from '../../components/LoadingOverlay';
import Toast from '../../components/Toast';
import PrintTemplate from '../../components/PrintTemplate';
import OrderEditPopup from '../../components/OrderEditPopup';
import CustomDatePicker from '../../components/CustomDatePicker';

const translateType = (type) => {
    if (!type) return '';
    const t = type.toLowerCase();
    const map = {
        'order': 'Hóa đơn',
        'voucher': 'Chứng từ',
        'bank': 'Ngân hàng',
        'system': 'Hệ thống',
        'purchase': 'Nhập hàng',
        'sale': 'Bán hàng'
    };
    return map[t] || type;
};

const translateMethod = (method) => {
    if (!method) return '-';
    const methodStr = method.toLowerCase();
    const map = {
        'debt': 'Ghi nợ',
        'cash': 'Tiền mặt',
        'bank': 'Chuyển khoản'
    };
    return map[methodStr] || method;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            mass: 0.4,
            damping: 15,
            stiffness: 120
        }
    }
};

const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', mass: 0.4, damping: 15 }
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        transition: { duration: 0.15 }
    }
};

export default function PartnerProfile() {
    const { id: urlParamId } = useParams();
    const navigate = useNavigate();

    // Selection state
    const [partners, setPartners] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);

    // Data state
    const [ledger, setLedger] = useState([]);
    const [stats, setStats] = useState({
        total_bought: 0,
        total_paid: 0,
        current_balance: 0,
        order_count: 0
    });
    const [debtCycles, setDebtCycles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    // Filter state
    const [filterType, setFilterType] = useState('all'); // all, debt, cash
    const [selectedCycleId, setSelectedCycleId] = useState('all');
    const [rangeMode, setRangeMode] = useState('all'); // all, latest, custom

    const [dateType, setDateType] = useState('all'); // all, year, month, quarter, custom
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterMonth, setFilterMonth] = useState('');
    const [filterQuarter, setFilterQuarter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedPartner?.id, filterType, selectedCycleId, rangeMode, dateType, filterYear, filterMonth, filterQuarter, startDate, endDate]);

    const [startReceiptId, setStartReceiptId] = useState('');
    const [endReceiptId, setEndReceiptId] = useState('');
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [toast, setToast] = useState(null);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef(null);
    const partnerDropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [printTemplate, setPrintTemplate] = useState(null);
    const [printSettings, setPrintSettings] = useState({});
    const printRef = useRef();

    // Fetch partners for the sidebar
    useEffect(() => {
        fetchPartners();
        fetchPrintTemplate();
    }, []);

    const fetchPrintTemplate = async () => {
        try {
            const res = await axios.get('/api/print-templates?module=PartnerLedger');
            if (res.data && res.data.length > 0) {
                const template = res.data.find(t => t.is_default) || res.data[0];
                setPrintTemplate(template);
                if (typeof template.config === 'string') {
                    setPrintSettings(JSON.parse(template.config));
                } else {
                    setPrintSettings(template.config || {});
                }
            }
        } catch (err) {
            console.error("Error fetching print template", err);
        }
    };

    // Effect to handle URL id change or initial load
    useEffect(() => {
        if (partners.length > 0) {
            const targetId = urlParamId ? parseInt(urlParamId) : parseInt(localStorage.getItem('selected_partner_id'));
            if (targetId) {
                const partner = partners.find(p => p.id === targetId);
                if (partner) {
                    setSelectedPartner(partner);
                }
            }
        }
    }, [urlParamId, partners]);

    useEffect(() => {
        if (selectedPartner) {
            localStorage.setItem('selected_partner_id', selectedPartner.id.toString());
        }
    }, [selectedPartner]);

    const fetchPartners = async (query = '') => {
        setSearching(true);
        try {
            const res = await axios.get('/api/partners', { params: { search: query } });
            setPartners(res.data);
            const targetId = urlParamId ? parseInt(urlParamId) : parseInt(localStorage.getItem('selected_partner_id'));
            if (targetId && !selectedPartner) {
                const p = res.data.find(x => x.id === targetId);
                if (p) setSelectedPartner(p);
            }
        } catch (err) {
            console.error('Lỗi tải đối tác:', err);
            setToast({ message: 'Không thể tải danh sách đối tác', type: 'error' });
        } finally {
            setSearching(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        if (!selectedPartner) return;
        const text = `🏥 LYANG POS - HỒ SƠ ĐỐI TÁC\n👤 Tên: ${selectedPartner.name}\n📞 SĐT: ${selectedPartner.phone || 'N/A'}\n💰 Dư nợ: ${formatDebt(selectedPartner.debt_balance)}\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Hồ sơ đối tác', text });
            } else {
                await navigator.clipboard.writeText(text);
                setToast({ message: 'Đã sao chép thông tin vào bộ nhớ tạm', type: 'success' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleExport = async () => {
        if (!selectedPartner) return;
        try {
            const { start_date, end_date } = getBackendDateParams();
            let url = `/api/partners/${selectedPartner.id}/ledger/export?filter_type=${filterType}`;
            if (start_date) url += `&start_date=${start_date}`;
            if (end_date) url += `&end_date=${end_date}`;
            const res = await axios.get(url, { responseType: 'blob' });
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(res.data, `lich_su_doi_tac_${selectedPartner.name.replace(/\s+/g, '_')}.xlsx`);
        } catch (err) {
            console.error("Export Error:", err);
            setToast({ message: "Không thể xuất file lịch sử đối tác", type: "error" });
        }
    };

    const handleRefresh = async () => {
        if (selectedPartner) {
            await fetchPartnerDetails();
            setToast({ message: 'Đã cập nhật dữ liệu mới nhất', type: 'success' });
        }
        fetchPartners();
    };

    const getBackendDateParams = () => {
        if (dateType === 'all') return { start_date: '', end_date: '' };
        
        let start = '';
        let end = '';
        const year = filterYear || new Date().getFullYear().toString();
        
        if (dateType === 'year') {
            start = `${year}-01-01T00:00:00`;
            end = `${year}-12-31T23:59:59`;
        } else if (dateType === 'month') {
            if (filterMonth) {
                const m = parseInt(filterMonth);
                const lastDay = new Date(parseInt(year), m, 0).getDate();
                const mStr = m < 10 ? `0${m}` : `${m}`;
                start = `${year}-${mStr}-01T00:00:00`;
                end = `${year}-${mStr}-${lastDay}T23:59:59`;
            } else {
                start = `${year}-01-01T00:00:00`;
                end = `${year}-12-31T23:59:59`;
            }
        } else if (dateType === 'quarter') {
            if (filterQuarter === '1') {
                start = `${year}-01-01T00:00:00`;
                end = `${year}-03-31T23:59:59`;
            } else if (filterQuarter === '2') {
                start = `${year}-04-01T00:00:00`;
                end = `${year}-06-30T23:59:59`;
            } else if (filterQuarter === '3') {
                start = `${year}-07-01T00:00:00`;
                end = `${year}-09-30T23:59:59`;
            } else if (filterQuarter === '4') {
                start = `${year}-10-01T00:00:00`;
                end = `${year}-12-31T23:59:59`;
            } else {
                start = `${year}-01-01T00:00:00`;
                end = `${year}-12-31T23:59:59`;
            }
        } else if (dateType === 'custom') {
            if (startDate) start = `${startDate}T00:00:00`;
            if (endDate) end = `${endDate}T23:59:59`;
        }
        
        return { start_date: start, end_date: end };
    };

    useEffect(() => {
        if (selectedPartner) {
            fetchPartnerDetails();
            fetchDebtCycles();
            if (!urlParamId || parseInt(urlParamId) !== selectedPartner.id) {
                window.history.replaceState(null, '', `#/partner-profile/${selectedPartner.id}`);
            }
        }
    }, [selectedPartner, filterType, dateType, filterYear, filterMonth, filterQuarter, startDate, endDate]);

    const fetchPartnerDetails = async () => {
        if (!selectedPartner) return;
        setLoadingDetails(true);
        try {
            const { start_date, end_date } = getBackendDateParams();
            const params = { 
                filter_type: filterType,
                start_date,
                end_date
            };
            const res = await axios.get(`/api/partners/${selectedPartner.id}/ledger`, { params });
            setLedger(res.data.ledger);
            setStats(prev => ({
                ...prev,
                current_balance: res.data.current_balance
            }));
        } catch (err) {
            setToast({ message: 'Lỗi tải chi tiết giao dịch', type: 'error' });
        } finally {
            setLoadingDetails(false);
        }
    };

    const fetchDebtCycles = async () => {
        if (!selectedPartner) return;
        try {
            const res = await axios.get(`/api/partners/${selectedPartner.id}/debt-cycles`);
            setDebtCycles(res.data);
        } catch (err) {
            console.error('Failed to fetch cycles', err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setShowSearchResults(true);
    };

    const selectPartner = (p) => {
        setSelectedPartner(p);
        setShowSearchResults(false);
        setSearchTerm('');
        setActiveIndex(0);
        searchInputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (!showSearchResults) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => {
                const next = Math.min(prev + 1, (filteredPartners?.length || 1) - 1);
                const container = partnerDropdownRef.current;
                if (container) {
                    const item = container.children[next];
                    if (item) item.scrollIntoView({ block: 'nearest' });
                }
                return next;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => {
                const next = Math.max(prev - 1, 0);
                const container = partnerDropdownRef.current;
                if (container) {
                    const item = container.children[next];
                    if (item) item.scrollIntoView({ block: 'nearest' });
                }
                return next;
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredPartners && filteredPartners[activeIndex]) {
                selectPartner(filteredPartners[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSearchResults(false);
        }
    };

    const receiptVouchers = ledger.filter(o => o.type === 'Voucher' && o.obj && o.obj.type === 'Receipt');

    useEffect(() => {
        if (rangeMode === 'custom' && receiptVouchers.length >= 2) {
            if (!startReceiptId) setStartReceiptId(receiptVouchers[0].id.toString());
            if (!endReceiptId) setEndReceiptId(receiptVouchers[1].id.toString());
        } else if (rangeMode === 'custom' && receiptVouchers.length === 1) {
            if (!startReceiptId) setStartReceiptId(receiptVouchers[0].id.toString());
            if (!endReceiptId) setEndReceiptId(receiptVouchers[0].id.toString());
        }
    }, [rangeMode, receiptVouchers, startReceiptId, endReceiptId]);

    let displayLedger = [...ledger];
    if (rangeMode === 'latest') {
        const latestReceiptIdx = displayLedger.findIndex(o => o.type === 'Voucher' && o.obj && o.obj.type === 'Receipt');
        if (latestReceiptIdx !== -1) {
            displayLedger = displayLedger.slice(0, latestReceiptIdx + 1);
        }
    } else if (rangeMode === 'custom' && startReceiptId && endReceiptId) {
        const idxA = displayLedger.findIndex(o => o.id.toString() === startReceiptId && o.type === 'Voucher');
        const idxB = displayLedger.findIndex(o => o.id.toString() === endReceiptId && o.type === 'Voucher');
        if (idxA !== -1 && idxB !== -1) {
            const minIdx = Math.min(idxA, idxB);
            const maxIdx = Math.max(idxA, idxB);
            displayLedger = displayLedger.slice(minIdx, maxIdx + 1);
        }
    }

    const filteredPartners = React.useMemo(() => {
        if (!searchTerm) return partners;
        const s = searchTerm.toLowerCase();
        const searchId = parseInt(s);
        const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const sNoAccent = removeAccents(s);
        
        return partners.filter((p) => {
            const matchesId = !isNaN(searchId) && p.id === searchId;
            const pNameNorm = (p.name || "").toLowerCase();
            const pPhone = p.phone || "";
            const pAddress = p.address || "";
            return (
                matchesId ||
                pNameNorm.includes(s) ||
                removeAccents(pNameNorm).includes(sNoAccent) ||
                pPhone.includes(s) ||
                pAddress.toLowerCase().includes(s)
            );
        }).slice(0, 100);
    }, [partners, searchTerm]);

    return (
        <div className="w-full bg-transparent font-sans print:bg-white print:text-black">
            <style>
                {`
                @media print {
                    body * { -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    @page { margin: 15mm; }
                    body { background: white !important; }
                    .custom-scrollbar { overflow: visible !important; height: auto !important; }
                    .print-area { width: 100% !important; margin: 0 !important; padding: 20px !important; }
                    table { border-collapse: collapse !important; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #d4a574 !important; padding: 6px 8px; font-size: 10px; text-align: left; }
                    th { background-color: #2d5016/10 !important; text-transform: uppercase; font-weight: 800; color: #2d5016 !important; }
                    .print-row-main { background-color: #fcfbfa !important; font-weight: bold; }
                    .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2d5016; padding-bottom: 20px; }
                    .print-footer { margin-top: 40px; display: grid; grid-template-cols: repeat(3, 1fr); text-align: center; font-size: 11px; }
                }
                .print-only { display: none; }
                `}
            </style>

            {/* Main Content Wrapper */}
            <m.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="pt-2 px-4 pb-24 space-y-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6 relative font-sans no-print"
            >
                {/* Standard Page Header */}
                <m.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0 relative z-[110] px-4 lg:px-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-primary dark:text-[#d4a574] uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                                <Users className="text-primary dark:text-[#d4a574]" size={32} />
                                Hồ sơ đối tác
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Xem thông tin chi tiết khách hàng, nhà cung cấp và công nợ</p>
                            </div>
                        </div>
                    </div>

                    {/* Header Controls & Filter */}
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto relative z-10 justify-end items-center">
                        {/* Search Input using standard POS style */}
                        <div className="relative flex-1 min-w-[320px] lg:min-w-[450px] lg:max-w-2xl no-print" ref={searchRef}>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    ref={searchInputRef}
                                    placeholder="Tìm đối tác (Tên, SĐT, Địa chỉ...)"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    onFocus={() => setShowSearchResults(true)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-11 pr-4 py-3 bg-transparent border border-border rounded-xl text-sm font-bold outline-none focus:border-primary dark:text-white transition-all shadow-none placeholder:text-gray-400 placeholder:font-medium"
                                />
                            </div>

                            <AnimatePresence>
                                {showSearchResults && searchTerm && (
                                    <m.div
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="dropdown-premium absolute top-full left-0 right-0 mt-2 !z-[1000] overflow-hidden shadow-2xl max-h-[450px] overflow-y-auto custom-scrollbar"
                                        ref={partnerDropdownRef}
                                    >
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                                        
                                        {filteredPartners.length > 0 ? (
                                            filteredPartners.map((p, idx) => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => selectPartner(p)}
                                                    className={cn(
                                                        "p-4 cursor-pointer transition-all duration-200 border-b border-border/40 last:border-0 relative overflow-hidden flex justify-between items-center group",
                                                        activeIndex === idx ? "bg-primary text-white" : "hover:bg-primary/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", activeIndex === idx ? "bg-white/20 text-white scale-110 shadow-primary/30" : "bg-primary/10 text-primary")}>
                                                            <User size={24} strokeWidth={2.5} />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0 transition-colors",
                                                                    activeIndex === idx
                                                                        ? "bg-primary text-white border-white/40"
                                                                        : p.is_customer && p.is_supplier ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : p.is_customer ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                                )}>
                                                                    {p.is_customer && p.is_supplier ? "KH & NCC" : p.is_customer ? "KH" : "NCC"}
                                                                </span>
                                                                <p className={cn("font-black uppercase tracking-tight text-sm", activeIndex === idx ? "text-white" : "text-slate-800 dark:text-slate-100")}>{p.name}</p>
                                                            </div>
                                                            <div className={cn("flex items-center gap-4 text-[11px] font-black tracking-wide", activeIndex === idx ? "text-white/70" : "text-slate-400")}>
                                                                <span className="flex items-center gap-1.5"><Phone size={12} strokeWidth={3} className="opacity-50" /> {p.phone || '---'}</span>
                                                                {p.address && <span className="flex items-center gap-1.5 truncate max-w-[180px]"><MapPin size={12} strokeWidth={3} className="opacity-50" /> {p.address}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right relative z-10 flex flex-col items-end gap-1">
                                                        <p className={cn("text-[20px] font-black tabular-nums tracking-tighter leading-none transition-colors", activeIndex === idx ? "text-white" : (p.debt_balance > 0 ? "text-red-650 dark:text-rose-455" : "text-emerald-600 dark:text-emerald-450"))}>
                                                            {formatDebt(p.debt_balance)}
                                                        </p>
                                                        <div className={cn(
                                                            "px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest transition-colors",
                                                            activeIndex === idx 
                                                                ? "bg-white/20 border-white/30 text-white" 
                                                                : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                                                        )}>
                                                            Dư nợ hiện tại
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <Users size={32} className="mx-auto text-slate-350 dark:text-slate-650 mb-2" />
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Không tìm thấy đối tác</p>
                                            </div>
                                        )}

                                        {searchTerm && (
                                            <button
                                                className="w-full p-4 bg-primary text-white font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-t border-white/10"
                                                onClick={() => navigate('/partners', { state: { openAdd: true, initialName: searchTerm } })}
                                            >
                                                <Plus size={16} strokeWidth={3} />
                                                Thêm mới đối tác: "{searchTerm}"
                                            </button>
                                        )}
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </m.div>

                {/* Sub-Header Toolbar Section */}
                {selectedPartner && (
                    <m.div 
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants} 
                        className="pos-card bg-transparent border border-border p-4 rounded-3xl flex flex-wrap gap-4 items-center justify-between shadow-none relative z-50"
                    >
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* filterType select: All, Debt, Cash */}
                            <div className="p-1 pos-card rounded-2xl border border-border flex gap-1 bg-transparent">
                                {['all', 'debt', 'cash'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider",
                                            filterType === type
                                                ? "bg-primary text-white"
                                                : "text-muted hover:text-primary hover:bg-primary/5"
                                        )}
                                    >
                                        {type === 'all' ? 'Tất cả' : type === 'debt' ? 'Dư nợ' : 'Tiền mặt'}
                                    </button>
                                ))}
                            </div>

                            {/* rangeMode select: Full, Latest, Custom */}
                            <div className="p-1 pos-card rounded-2xl border border-border flex gap-1 bg-transparent">
                                {[
                                    { id: 'all', label: 'Hiện Full' },
                                    { id: 'latest', label: 'Trả gần nhất → Nay' },
                                    { id: 'custom', label: 'Tùy chọn' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setRangeMode(m.id);
                                            if (m.id !== 'all') {
                                                setDateType('all');
                                            }
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                            rangeMode === m.id
                                                ? "bg-primary text-white"
                                                : "text-muted hover:text-primary hover:bg-primary/5"
                                        )}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Date filter select: Mọi lúc, Năm, Tháng, Quý, Tùy chọn ngày */}
                            <div className="p-1 pos-card rounded-2xl border border-border flex gap-1 bg-transparent">
                                {[
                                    { id: 'all', label: 'Mọi lúc' },
                                    { id: 'year', label: 'Theo Năm' },
                                    { id: 'month', label: 'Theo Tháng' },
                                    { id: 'quarter', label: 'Theo Quý' },
                                    { id: 'custom', label: 'Tùy chọn ngày' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setDateType(t.id);
                                            if (t.id !== 'all') {
                                                setRangeMode('all');
                                            }
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                            dateType === t.id
                                                ? "bg-primary text-white"
                                                : "text-muted hover:text-primary hover:bg-primary/5"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Additional Date Selectors depending on dateType */}
                            {dateType === 'year' && (
                                <div className="p-1 pos-card rounded-2xl border border-border flex items-center bg-transparent gap-2">
                                    <span className="text-[9px] font-black uppercase text-slate-400 pl-2">Năm</span>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        className="bg-transparent border-none text-[10px] rounded p-1 font-bold outline-none dark:text-white"
                                    >
                                        {[...Array(5)].map((_, i) => {
                                            const y = new Date().getFullYear() - i;
                                            return <option key={y} value={y.toString()}>{y}</option>
                                        })}
                                    </select>
                                </div>
                            )}

                            {dateType === 'month' && (
                                <div className="p-1 pos-card rounded-2xl border border-border flex items-center bg-transparent gap-2">
                                    <span className="text-[9px] font-black uppercase text-slate-400 pl-2">Tháng / Năm</span>
                                    <select
                                        value={filterMonth}
                                        onChange={(e) => setFilterMonth(e.target.value)}
                                        className="bg-transparent border-none text-[10px] rounded p-1 font-bold outline-none dark:text-white"
                                    >
                                        <option value="">Tất cả</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={(i + 1).toString()}>Tháng {i + 1}</option>
                                        ))}
                                    </select>
                                    <span className="text-[10px] font-black text-slate-350 dark:text-slate-650">/</span>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        className="bg-transparent border-none text-[10px] rounded p-1 font-bold outline-none dark:text-white"
                                    >
                                        {[...Array(5)].map((_, i) => {
                                            const y = new Date().getFullYear() - i;
                                            return <option key={y} value={y.toString()}>{y}</option>
                                        })}
                                    </select>
                                </div>
                            )}

                            {dateType === 'quarter' && (
                                <div className="p-1 pos-card rounded-2xl border border-border flex items-center bg-transparent gap-2">
                                    <span className="text-[9px] font-black uppercase text-slate-400 pl-2">Quý / Năm</span>
                                    <select
                                        value={filterQuarter}
                                        onChange={(e) => setFilterQuarter(e.target.value)}
                                        className="bg-transparent border-none text-[10px] rounded p-1 font-bold outline-none dark:text-white"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="1">Quý 1</option>
                                        <option value="2">Quý 2</option>
                                        <option value="3">Quý 3</option>
                                        <option value="4">Quý 4</option>
                                    </select>
                                    <span className="text-[10px] font-black text-slate-350 dark:text-slate-650">/</span>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        className="bg-transparent border-none text-[10px] rounded p-1 font-bold outline-none dark:text-white"
                                    >
                                        {[...Array(5)].map((_, i) => {
                                            const y = new Date().getFullYear() - i;
                                            return <option key={y} value={y.toString()}>{y}</option>
                                        })}
                                    </select>
                                </div>
                            )}

                            {dateType === 'custom' && (
                                <div className="p-1.5 pos-card rounded-2xl border border-border flex items-center bg-transparent gap-2 px-3">
                                    <span className="text-[9px] font-black uppercase text-slate-400">Từ</span>
                                    <CustomDatePicker
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <span className="text-[9px] font-black uppercase text-slate-400">Đến</span>
                                    <CustomDatePicker
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            )}

                            {rangeMode === 'custom' && (
                                <div className="flex gap-2 items-center p-1 pos-card rounded-2xl border border-border bg-transparent">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[7px] text-slate-500 uppercase font-black px-1">Từ lần trả</span>
                                        <select
                                            value={startReceiptId}
                                            onChange={(e) => setStartReceiptId(e.target.value)}
                                            className="bg-transparent border-none text-[9px] rounded p-1 font-bold outline-none dark:text-white"
                                        >
                                            <option value="">-- Chọn --</option>
                                            {receiptVouchers.map(v => (
                                                <option key={v.id} value={v.id.toString()}>
                                                    {v.desc.split(' - ')[0]} #{v.id} ({formatDate(v.date).split(' ')[0]})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-bold self-end mb-1.5">→</span>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[7px] text-slate-500 uppercase font-black px-1">Đến lần trả</span>
                                        <select
                                            value={endReceiptId}
                                            onChange={(e) => setEndReceiptId(e.target.value)}
                                            className="bg-transparent border-none text-[9px] rounded p-1 font-bold outline-none dark:text-white"
                                        >
                                            <option value="">-- Chọn --</option>
                                            {receiptVouchers.map(v => (
                                                <option key={v.id} value={v.id.toString()}>
                                                    {v.desc.split(' - ')[0]} #{v.id} ({formatDate(v.date).split(' ')[0]})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                className="p-3 hover:bg-primary/10 border border-border rounded-xl transition-all text-slate-500 hover:text-primary flex items-center justify-center"
                                title="Làm mới thông tin"
                            >
                                <RefreshCw size={16} className={loadingDetails ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={() => navigate('/invoice-designer?module=PartnerLedger')}
                                className="p-3 hover:bg-primary/10 border border-border rounded-xl transition-all text-slate-400 hover:text-primary flex items-center justify-center"
                                title="Thiết kế mẫu in sổ nợ"
                            >
                                <Info size={16} />
                            </button>
                            <button
                                onClick={handlePrint}
                                className="p-3 hover:bg-primary/10 border border-border rounded-xl transition-all text-slate-550 hover:text-primary flex items-center justify-center"
                                title="In sổ nợ"
                            >
                                <Printer size={16} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="p-3 hover:bg-primary/10 border border-border rounded-xl transition-all text-slate-550 hover:text-primary flex items-center justify-center"
                                title="Xuất Excel sổ nợ"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-3 hover:bg-primary/10 border border-border rounded-xl transition-all text-slate-550 hover:text-primary flex items-center justify-center"
                                title="Chia sẻ hồ sơ"
                            >
                                <Share2 size={16} />
                            </button>
                        </div>
                    </m.div>
                )}

                {/* Dashboard / Profile Area */}
                <div className="space-y-6 relative no-print bg-transparent">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02] dark:opacity-[0.05]">
                        <Sprout className="absolute top-20 left-10 -rotate-12" size={300} />
                        <Wheat className="absolute bottom-20 right-10 rotate-12" size={350} />
                        <Droplets className="absolute top-1/2 left-1/3 -translate-y-1/2" size={200} />
                    </div>

                    {selectedPartner ? (
                        <m.div
                            key={selectedPartner.id}
                            initial="hidden"
                            animate="visible"
                            variants={containerVariants}
                            className="w-full space-y-6"
                        >
                            {/* Identity Section */}
                            <m.div variants={itemVariants} className="pos-card bg-transparent border border-border rounded-2xl shadow-none p-5 flex flex-col md:flex-row items-center md:items-start gap-5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#2d5016] to-[#4a7c59] opacity-5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />

                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2d5016] to-[#4a7c59] flex items-center justify-center text-white shrink-0 relative lg:rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-emerald-950/10">
                                    <span className="text-2xl font-black">{selectedPartner.name ? selectedPartner.name.charAt(0).toUpperCase() : '?'}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#d4a574] border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                        <CheckCircle2 size={10} className="text-white" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 relative z-10 w-full">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-lg md:text-xl font-black tracking-tight text-[#2d5016] dark:text-[#fdfdfb] uppercase">{selectedPartner.name}</h2>
                                                <span className="px-2.5 py-0.5 bg-primary/10 rounded-lg text-[9px] font-black uppercase text-primary border border-border tracking-wider">
                                                    ID: {selectedPartner.id}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                <p className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-350 bg-transparent px-2.5 py-1 rounded-lg border border-border">
                                                    <Phone size={12} className="text-primary dark:text-[#d4a574]" /> {selectedPartner.phone || 'Chưa cung cấp SĐT'}
                                                </p>
                                                <p className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-350 bg-transparent px-2.5 py-1 rounded-lg border border-border">
                                                    <MapPin size={12} className="text-primary dark:text-[#d4a574]" /> {selectedPartner.address || 'Địa chỉ trống'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full lg:w-auto">
                                            <m.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => navigate(`/pos?partner_id=${selectedPartner.id}`)}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-[#2d5016] hover:bg-[#1d350f] text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm whitespace-nowrap"
                                            >
                                                <ShoppingCart size={14} strokeWidth={2.5} />
                                                <span>Giao dịch mới</span>
                                            </m.button>
                                            <m.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2.5 bg-transparent hover:bg-[#d4a574]/10 border border-border rounded-xl text-slate-400 hover:text-[#2d5016] transition-all"
                                            >
                                                <Mail size={14} />
                                            </m.button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3.5 border-t border-border">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#d4a574]/60 mb-0.5">Loại đối tác</p>
                                            <p className="text-[11px] font-black dark:text-slate-200">{selectedPartner.type === 'Both' ? 'Khách & NCC' : selectedPartner.type === 'Customer' ? 'Khách hàng' : 'Nhà cung cấp'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#d4a574]/60 mb-0.5">Dư nợ hiện tại</p>
                                            <p className={cn("text-[12px] font-black tracking-tight", stats.current_balance > 0 ? "text-blue-600" : stats.current_balance < 0 ? "text-red-650 dark:text-red-400" : "text-slate-400")}>
                                                {formatDebt(stats.current_balance)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#d4a574]/60 mb-0.5">Tổng đơn hàng</p>
                                            <p className="text-[11px] font-black text-primary dark:text-[#d4a574]">{displayLedger.filter(item => item.type === 'Order').length} Đơn</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#d4a574]/60 mb-0.5">Trạng thái nợ</p>
                                            <p className="text-[11px] font-black text-[#2d5016] dark:text-[#d4a574] uppercase tracking-wider">
                                                {debtCycles.length > 0 ? (debtCycles[0].status === 'Đang nợ' ? 'Đang nợ' : 'Hết nợ') : 'Chu kỳ mới'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </m.div>

                            {/* Main Timeline View */}
                            <m.div variants={itemVariants} className="pos-card bg-transparent border border-border rounded-3xl shadow-none overflow-hidden min-h-[500px] relative z-10 mt-6">
                                <div className="p-6 border-b border-border flex justify-between items-center bg-transparent">
                                    <h3 className="font-black uppercase tracking-widest text-xs text-[#2d5016] dark:text-[#d4a574] flex items-center gap-2.5">
                                        <History size={16} /> Lịch sử giao dịch chi tiết
                                    </h3>
                                    <div className="text-[10px] font-black text-[#2d5016]/50 dark:text-[#d4a574]/60 uppercase tracking-widest">
                                        Khấu trừ vụ mùa: {displayLedger.length} bản ghi
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                                        <thead className="bg-transparent border-b border-border text-[10px] font-black tracking-widest text-muted uppercase">
                                            <tr>
                                                <th className="w-40 p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Thời gian</th>
                                                <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nội dung giao dịch</th>
                                                <th className="w-32 p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Giá trị</th>
                                                <th className="w-32 p-5 text-[10px] font-black uppercase text-blue-500 tracking-widest text-right">Ghi nợ (+)</th>
                                                <th className="w-32 p-5 text-[10px] font-black uppercase text-red-500 tracking-widest text-right">Thanh toán (-)</th>
                                                <th className="w-40 p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Lũy kế cuối kỳ</th>
                                                <th className="w-12 p-5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {loadingDetails && ledger.length === 0 ? (
                                                <tr><td colSpan="7" className="p-16 text-center text-slate-400 font-bold animate-pulse">HỆ THỐNG ĐANG QUÉT DỮ LIỆU...</td></tr>
                                            ) : displayLedger.length > 0 ? (
                                                (() => {
                                                    const grouped = {};
                                                    const chronoLedger = [...displayLedger];
                                                    const startIndex = (currentPage - 1) * itemsPerPage;
                                                    const paginatedLedger = chronoLedger.slice(startIndex, startIndex + itemsPerPage);
                                                    
                                                    paginatedLedger.forEach(item => {
                                                        const d = new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                                                        if (!grouped[d]) grouped[d] = [];
                                                        grouped[d].push(item);
                                                    });

                                                    return Object.entries(grouped).map(([day, items], gIdx) => (
                                                        <React.Fragment key={day}>
                                                            <tr className="bg-transparent">
                                                                <td colSpan="7" className="px-6 py-3.5 text-[10px] font-black text-[#2d5016] dark:text-[#d4a574]/80 uppercase tracking-widest border-y border-border italic">
                                                                    📅 {day}
                                                                </td>
                                                            </tr>
                                                            {items.map((row, idx) => (
                                                                <LedgerRow key={row.id || `${gIdx}-${idx}`} row={row} onEditOrder={setEditingOrder} />
                                                            ))}
                                                        </React.Fragment>
                                                    ));
                                                })()
                                            ) : (
                                                <tr><td colSpan="7" className="p-20 text-center text-slate-405 font-bold uppercase text-[10px]">Chưa có dữ liệu giao dịch phát sinh</td></tr>
                                            )}
                                        </tbody>
                                        {ledger.length > 0 && (
                                            <tfoot className="bg-transparent border-t border-border">
                                                <tr className="font-bold text-slate-600 dark:text-slate-350">
                                                    <td colSpan="3" className="p-5 text-right text-[10px] uppercase tracking-widest">
                                                        Tổng cộng phát sinh:
                                                    </td>
                                                    <td className="p-5 text-right text-blue-600 dark:text-blue-400">
                                                        {formatNumber(ledger.reduce((sum, item) => sum + (item.increase || 0), 0))}
                                                    </td>
                                                    <td className="p-5 text-right text-red-600 dark:text-red-400">
                                                        {formatNumber(ledger.reduce((sum, item) => sum + (item.decrease || 0), 0))}
                                                    </td>
                                                    <td className="p-5 text-right text-slate-900 dark:text-white tabular-nums">
                                                        {formatNumber(stats.current_balance || 0)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr className="bg-transparent">
                                                    <td colSpan="5" className="p-5 text-right text-xs uppercase font-black text-slate-500 tracking-widest">
                                                        SỐ DƯ CUỐI CHỐT:
                                                    </td>
                                                    <td className="p-5 text-right text-lg font-black text-[#2d5016] dark:text-[#d4a574] tabular-nums">
                                                        {formatNumber(stats.current_balance || 0)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                                {(() => {
                                    const totalItems = displayLedger.length;
                                    const totalPages = Math.ceil(totalItems / itemsPerPage);
                                    const startIndex = (currentPage - 1) * itemsPerPage;
                                    
                                    if (totalPages <= 1) return null;
                                    
                                    return (
                                        <div className="p-4 border-t border-border flex items-center justify-between bg-transparent relative z-10">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} của {totalItems} giao dịch
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className="px-3 py-1.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-30 hover:bg-primary/5 dark:hover:bg-slate-800 transition-all dark:text-emerald-450"
                                                >
                                                    Trước
                                                </button>
                                                <span className="px-3 py-1.5 text-[10px] font-black text-primary dark:text-[#d4a574]">
                                                    Trang {currentPage} / {totalPages}
                                                </span>
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className="px-3 py-1.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-30 hover:bg-primary/5 dark:hover:bg-slate-800 transition-all dark:text-emerald-450"
                                                >
                                                    Sau
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </m.div>
                        </m.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="w-48 h-48 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center animate-pulse">
                                <Users size={80} className="text-slate-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight text-primary dark:text-[#d4a574]">Quản lý Hồ sơ đối tác</h2>
                                <p className="text-slate-400 font-bold">Vui lòng gõ tìm kiếm và chọn một khách hàng/nhà cung cấp ở trên để xem chi tiết</p>
                            </div>
                            <m.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fetchPartners()}
                                className="px-8 py-3 bg-[#2d5016] text-[#fdfdfb] rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-950/15"
                            >
                                Tải danh sách
                            </m.button>
                        </div>
                    )}
                </div>
            </m.div>



            <div className="only-print">
                {selectedPartner && (
                    <PrintTemplate
                        ref={printRef}
                        type="PartnerLedger"
                        data={{
                            ...selectedPartner,
                            type: 'PartnerLedger',
                            details: [...displayLedger].reverse().map(row => ({
                                date: row.date,
                                type: translateType(row.type),
                                ref_id: row.ref_id,
                                desc: row.desc,
                                increase: row.increase,
                                decrease: row.decrease,
                                running_balance: row.running_balance,
                                items: row.details || []
                            })),
                            total_amount: stats.current_balance,
                            current_balance: stats.current_balance
                        }}
                        settings={printSettings}
                    />
                )}
            </div>

            {editingOrder && (
                <OrderEditPopup
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSave={() => {
                        setEditingOrder(null);
                        fetchLedgerDetails();
                        fetchDebtCycles();
                    }}
                />
            )}
            <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
            <LoadingOverlay isVisible={loadingDetails && ledger.length === 0} message="Đang phân tích hồ sơ đối tác..." />
        </div>
    );
}

function LedgerRow({ row, onEditOrder }) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const date = new Date(row.date);

    const getIcon = () => {
        if (row.type === 'Order') return row.desc.includes('Bán') ? <ShoppingCart size={16} /> : <Package size={16} />;
        if (row.type === 'Bank') return <CreditCard size={16} />;
        if (row.type === 'Voucher') return <Receipt size={16} />;
        if (row.type === 'System') return <History size={16} />;
        return <Activity size={16} />;
    }

    const getColor = () => {
        if (row.type === 'System') return 'text-slate-400';
        if (row.type === 'Bank') return 'text-purple-600';
        if (row.increase > 0) return 'text-blue-600';
        if (row.decrease > 0) return 'text-red-650';
        return 'text-slate-400';
    }

    return (
        <>
            <m.tr
                layout="position"
                onClick={() => setExpanded(!expanded)}
                whileHover={{ backgroundColor: 'rgba(45, 80, 22, 0.02)' }}
                className={cn(
                    "group hover:bg-[#2d5016]/5 dark:hover:bg-slate-800/40 transition-all cursor-pointer relative",
                    expanded && "bg-[#2d5016]/5 dark:bg-slate-800/20 shadow-inner"
                )}
            >
                <td className="p-4 border-b border-emerald-50/50 dark:border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-xs font-black dark:text-white uppercase tracking-tight">{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[9px] font-bold text-slate-350 dark:text-slate-650">GIÂY: {date.getSeconds()}</span>
                    </div>
                </td>
                <td className="p-4 border-b border-emerald-50/50 dark:border-slate-800">
                    <div className="flex items-start gap-4">
                        <div className={cn("p-2 shrink-0 mt-0.5 transition-transform group-hover:scale-110", getColor())}>
                            {getIcon()}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-tight dark:text-slate-100 line-clamp-1">{row.desc}</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0",
                                    row.type === 'Order' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800" :
                                        row.type === 'Bank' ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800" :
                                            row.type === 'Voucher' ? "bg-green-50 text-green-650 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800" :
                                                "bg-transparent text-slate-650 border-slate-100 dark:bg-slate-850 dark:text-slate-350 dark:border-slate-800"
                                )}>
                                    {row.type === 'System' ? 'MỞ ĐẦU' : translateType(row.type)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                <span className="text-[#2d5016] dark:text-[#d4a574]">{row.ref_id}</span>
                                <span className="opacity-30">•</span>
                                <span className="uppercase">{translateMethod(row.payment_method)}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td className="p-4 text-right border-b border-emerald-50/50 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">{formatNumber(row.obj?.total_amount || row.obj?.amount || 0)}</span>
                </td>
                <td className="p-4 text-right border-b border-emerald-50/50 dark:border-slate-800">
                    {row.increase > 0 ? (
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400 tabular-nums">+{formatNumber(row.increase)}</span>
                            <span className="text-[8px] font-bold text-blue-400/80 uppercase">Tăng nợ</span>
                        </div>
                    ) : <span className="text-xs text-slate-200 dark:text-slate-800 font-bold">-</span>}
                </td>
                <td className="p-4 text-right border-b border-emerald-50/50 dark:border-slate-800">
                    {row.decrease > 0 ? (
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-red-650 dark:text-red-400 tabular-nums">-{formatNumber(row.decrease)}</span>
                            <span className="text-[8px] font-bold text-red-450 uppercase">Thanh toán</span>
                        </div>
                    ) : <span className="text-xs text-slate-200 dark:text-slate-800 font-bold">-</span>}
                </td>
                <td className="p-4 text-right border-b border-emerald-50/50 dark:border-slate-800">
                    <div className="flex flex-col items-end">
                        <span className={cn(
                            "text-xs font-black tabular-nums transition-colors",
                            row.running_balance > 1000 ? "text-blue-600 dark:text-blue-400" : row.running_balance < -1000 ? "text-red-650 dark:text-red-400" : "text-slate-450"
                        )}>
                            {formatNumber(row.running_balance)}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                            {row.running_balance !== 0 && (
                                <span className={cn("inline-block w-1.5 h-1.5 rounded-full", row.running_balance > 0 ? "bg-blue-500" : "bg-red-500")} />
                            )}
                            <span className="text-[8px] font-black text-slate-350 dark:text-slate-600 uppercase tracking-widest">Balance</span>
                        </div>
                    </div>
                </td>
                <td className="p-4 border-b border-emerald-50/50 dark:border-slate-800 text-right">
                    <ChevronDown size={14} className={cn("text-slate-300 transition-transform duration-500", expanded ? "rotate-180 text-[#2d5016]" : "")} />
                </td>
            </m.tr>

            <AnimatePresence>
                {expanded && (
                    <tr>
                        <td colSpan="7" className="p-0 bg-transparent/50 dark:bg-slate-900/50">
                            <m.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                className="overflow-hidden border-b border-emerald-50/40 dark:border-slate-800"
                            >
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-2">
                                            <Package size={14} /> Chi tiết hàng hóa
                                        </h4>
                                        {row.details && row.details.length > 0 ? (
                                            <div className="bg-[#fdfdfb] dark:bg-slate-950 rounded-[1.8rem] border border-emerald-100/50 dark:border-slate-800 overflow-hidden shadow-sm">
                                                <table className="w-full text-left text-[11px] table-fixed">
                                                    <thead className="bg-emerald-50/20 dark:bg-slate-900/50 border-b border-emerald-55/20 dark:border-slate-800">
                                                        <tr>
                                                            <th className="p-3.5 font-black uppercase text-slate-455 tracking-wider">Sản phẩm / Quy cách</th>
                                                            <th className="w-24 p-3.5 font-black uppercase text-slate-455 tracking-wider text-right">SLượng</th>
                                                            <th className="w-32 p-3.5 font-black uppercase text-slate-455 tracking-wider text-right">Đơn giá</th>
                                                            <th className="w-32 p-3.5 font-black uppercase text-slate-455 tracking-wider text-right">Tổng tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-emerald-50/25 dark:divide-slate-900">
                                                        {row.details.map((d, i) => (
                                                            <tr key={i} className="hover:bg-emerald-50/10 dark:hover:bg-slate-900 transition-colors">
                                                                <td className="p-3.5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50/40 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                                                            <Package size={14} className="text-[#2d5016] dark:text-[#d4a574]/60" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold dark:text-slate-200">{d.product_name}</p>
                                                                            {d.specification && <p className="text-[9px] text-[#2d5016] dark:text-[#d4a574] font-black uppercase tracking-widest mt-0.5">{d.specification}</p>}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3.5 text-right font-black tabular-nums">
                                                                    {d.quantity} <span className="text-[8px] text-slate-400 font-normal uppercase">{d.unit}</span>
                                                                </td>
                                                                <td className="p-3.5 text-right text-slate-500 tabular-nums">
                                                                    {formatNumber(d.unit_price)}
                                                                </td>
                                                                <td className="p-3.5 text-right font-black tabular-nums text-slate-700 dark:text-slate-200">
                                                                    {formatNumber(d.total_price)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-transparent rounded-[1.8rem] border border-dashed border-emerald-100/50 dark:border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                                Giao dịch này không có chi tiết hàng hóa (Chứng từ tiền mặt)
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-2">
                                            <Info size={14} /> Thông tin bổ sung
                                        </h4>
                                        <div className="p-5 bg-[#fdfdfb] dark:bg-slate-950 rounded-[1.8rem] border border-emerald-100/50 dark:border-slate-800 space-y-4 shadow-sm">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider">Người thực hiện</span>
                                                <span className="font-black dark:text-slate-200">{row.user_name || 'Hệ thống'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 font-bold uppercase tracking-wider">Trạng thái</span>
                                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 text-[10px] font-black uppercase tracking-widest">Đã xác nhận</span>
                                            </div>
                                            <div className="pt-3 border-t border-emerald-50/40 dark:border-slate-850 flex gap-2">
                                                {row.type === 'Order' ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onEditOrder) {
                                                                onEditOrder(row.obj);
                                                            }
                                                        }}
                                                        className="flex-1 py-2.5 bg-transparent hover:bg-[#2d5016] border border-[#2d5016]/20 hover:border-transparent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all dark:text-slate-200 flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <Edit2 size={14} /> Sửa đơn
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                                                    >
                                                        Không thể sửa
                                                    </button>
                                                )}
                                                <button className="p-2.5 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all">
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        </td>
                    </tr>
                )}
            </AnimatePresence>
        </>
    );
}
