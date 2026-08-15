import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Landmark,
    FileSpreadsheet,
    Upload,
    CheckCircle2,
    AlertCircle,
    Package,
    ArrowRight,
    Search,
    RefreshCw,
    Save,
    X,
    Columns,
    AlertTriangle,
    Database,
    Tag,
    Calculator,
    CornerDownRight,
    ArrowUpDown,
    ChevronDown,
    Check
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import QuickAuditPopout from '../../components/QuickAuditPopout';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import SearchableSelect from '../../components/SearchableSelect';
import { createPortal } from 'react-dom';

export default function AccountingInventory() {
    const [view, setView] = useState('list'); // 'list' or 'import'
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDiscrepancyOnly, setShowDiscrepancyOnly] = useState(false);
    const [showOnlyCoded, setShowOnlyCoded] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const [fileData, setFileData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({ code: '', stock: '', price: '' });
    const [analyzing, setAnalyzing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
    const [matchedData, setMatchedData] = useState([]);
    const [importSearch, setImportSearch] = useState('');
    const [importFilter, setImportFilter] = useState('all'); // all, unmatched, matched, discrepancy
    const [importShowOnlyCoded, setImportShowOnlyCoded] = useState(false);
    const [importSort, setImportSort] = useState({ key: null, direction: 'asc' });
    const [importPage, setImportPage] = useState(1);
    const [importItemsPerPage, setImportItemsPerPage] = useState(20);

    const [showMatchModal, setShowMatchModal] = useState(false);
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [selectedMatchDataId, setSelectedMatchDataId] = useState(null);

    // Quick Audit state
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [auditProduct, setAuditProduct] = useState(null);
    const [auditCoords, setAuditCoords] = useState(null);
    const queryClient = useQueryClient();

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showMatchModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showMatchModal]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showMatchModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showMatchModal]);

    // Fetch all products for matching
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products?limit=10000'); // Get all for matching
            setProducts(res.data.items || res.data);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Không thể tải danh mục sản phẩm");
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAnalyzing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length < 2) {
                    toast.error("File Excel không có dữ liệu!");
                    return;
                }

                const head = data[0].map(h => (h || '').toString().trim());
                setHeaders(head);

                // Convert back to objects with headers
                const rows = XLSX.utils.sheet_to_json(ws);
                setFileData(rows);

                // Smart mapping suggestion
                const suggest = { code: '', stock: '', price: '' };
                head.forEach(h => {
                    const norm = h.toLowerCase();
                    if (norm.includes('mã') || norm.includes('code') || norm.includes('id')) suggest.code = h;
                    if (norm.includes('tồn') || norm.includes('kho') || norm.includes('stock')) suggest.stock = h;
                    if (norm.includes('giá') || norm.includes('đơn giá') || norm.includes('price')) suggest.price = h;
                });
                setMapping(suggest);

                setStep(2);
            } catch (err) {
                console.error(err);
                toast.error("Lỗi khi đọc file Excel");
            } finally {
                setAnalyzing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const startMatching = () => {
        if (!mapping.code || !mapping.stock || !mapping.price) {
            toast.error("Vui lòng chọn đầy đủ các cột cần thiết!");
            return;
        }

        const result = fileData.map((row, idx) => {
            const excelCode = (row[mapping.code] || '').toString().trim();
            const excelStock = parseFloat(row[mapping.stock]) || 0;
            const excelPrice = parseFloat(row[mapping.price]) || 0;

            const matched = products.find(p => p.code === excelCode || p.name === excelCode);

            return {
                id: idx,
                excelCode,
                excelStock,
                excelPrice,
                excelRow: row,
                matchedProduct: matched || null,
                status: matched ? 'matched' : 'unmatched'
            };
        });

        setMatchedData(result);
        setStep(3);
        setImportPage(1);
    };

    const handleManualMatch = (product) => {
        if (selectedMatchDataId === null) return;

        setMatchedData(prev => prev.map(item => {
            if (item.id === selectedMatchDataId) {
                return { ...item, matchedProduct: product, status: 'matched' };
            }
            return item;
        }));

        setShowMatchModal(false);
        setSelectedMatchDataId(null);
    };

    const filteredImportData = useMemo(() => {
        return matchedData.filter(item => {
            const matchesSearch = !importSearch ||
                item.excelCode.toLowerCase().includes(importSearch.toLowerCase()) ||
                (item.matchedProduct?.name || '').toLowerCase().includes(importSearch.toLowerCase());

            let matchesFilter = true;
            if (importFilter === 'unmatched') matchesFilter = item.status === 'unmatched';
            if (importFilter === 'matched') matchesFilter = item.status === 'matched';
            if (importFilter === 'discrepancy') matchesFilter = item.status === 'matched' && (item.excelStock !== (item.matchedProduct?.stock || 0));

            const matchesCoded = !importShowOnlyCoded || (item.matchedProduct && item.matchedProduct.code);

            return matchesSearch && matchesFilter && matchesCoded;
        });
    }, [matchedData, importSearch, importFilter, importShowOnlyCoded]);

    const sortedImportData = useMemo(() => {
        let items = [...filteredImportData];
        if (importSort.key) {
            items.sort((a, b) => {
                let aVal, bVal;
                if (importSort.key === 'status') { aVal = a.status; bVal = b.status; }
                else if (importSort.key === 'excelCode') { aVal = a.excelCode; bVal = b.excelCode; }
                else if (importSort.key === 'excelStock') { aVal = a.excelStock; bVal = b.excelStock; }
                else if (importSort.key === 'diff') {
                    aVal = a.matchedProduct ? (a.excelStock - a.matchedProduct.stock) : -999999;
                    bVal = b.matchedProduct ? (b.excelStock - b.matchedProduct.stock) : -999999;
                }
                else { aVal = a[importSort.key]; bVal = b[importSort.key]; }

                if (aVal < bVal) return importSort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return importSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [filteredImportData, importSort]);

    const paginatedImportData = useMemo(() => {
        const start = (importPage - 1) * importItemsPerPage;
        return sortedImportData.slice(start, start + importItemsPerPage);
    }, [sortedImportData, importPage, importItemsPerPage]);

    const handleUpdate = async () => {
        const updateList = matchedData
            .filter(item => item.matchedProduct)
            .map(item => ({
                id: item.matchedProduct.id,
                accounting_price: item.excelPrice,
                accounting_stock: item.excelStock
            }));

        if (updateList.length === 0) {
            toast.error("Chưa có sản phẩm nào được khớp để cập nhật!");
            return;
        }

        setUpdating(true);
        try {
            const res = await axios.post('/api/products/bulk-accounting-update', updateList);
            toast.success(res.data.message);
            await fetchProducts();
            setIsUpdateSuccess(true);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi cập nhật vào hệ thống");
        } finally {
            setUpdating(false);
        }
    };

    const handleExportImportData = async () => {
        if (sortedImportData.length === 0) {
            toast.error("Không có dữ liệu để xuất!");
            return;
        }

        const exportData = sortedImportData.map(item => {
            const diff = item.matchedProduct ? (item.excelStock - item.matchedProduct.stock) : 0;
            const diffValue = diff * item.excelPrice;

            return {
                "Mã hàng (Excel)": item.excelCode,
                "Tên sản phẩm (Hệ thống)": item.matchedProduct?.name || "Chưa khớp",
                "Mã hàng (Hệ thống)": item.matchedProduct?.code || "---",
                "Đơn vị tính": item.matchedProduct?.unit || "---",
                "Số lượng Excel": item.excelStock,
                "Số lượng POS": item.matchedProduct?.stock ?? "---",
                "Chênh lệch": diff,
                "Giá trị chênh lệch": diffValue,
                "Đơn giá (Kế toán)": item.excelPrice,
                "Trạng thái": item.status === 'matched' ? 'Đã khớp' : 'Chưa khớp'
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Doi_Soat_Kho");

        // Auto-size columns
        const colWidths = Object.keys(exportData[0]).map(key => ({
            wch: Math.max(key.length, ...exportData.map(row => String(row[key]).length)) + 2
        }));
        ws['!cols'] = colWidths;

        const filename = `Bao_Cao_Doi_Soat_Kho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        try {
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(wbout, filename, true);
            toast.success("Đã xuất file báo cáo chênh lệch!");
        } catch (err) {
            console.error("Export Error:", err);
            toast.error("Lỗi khi xuất file");
        }
    };

    const handleExportDashboardData = async () => {
        if (sortedProducts.length === 0) {
            toast.error("Không có dữ liệu để xuất!");
            return;
        }

        const exportData = sortedProducts.map(p => {
            const diff = (p.accounting_stock || 0) - (p.stock || 0);
            const totalValue = (p.accounting_price || 0) * (p.accounting_stock || 0);

            return {
                "Mã hàng": p.code || "---",
                "Tên sản phẩm": p.name,
                "Đơn vị tính": p.unit || "---",
                "Tồn Kế toán": p.accounting_stock || 0,
                "Tồn Thực tế (POS)": p.stock || 0,
                "Chênh lệch": diff,
                "Đơn giá (Kế toán)": p.accounting_price || 0,
                "Tổng giá trị (Kế toán)": totalValue
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ton_Kho_Ke_Toan");

        // Auto-size columns
        const colWidths = Object.keys(exportData[0]).map(key => ({
            wch: Math.max(key.length, ...exportData.map(row => String(row[key]).length)) + 2
        }));
        ws['!cols'] = colWidths;

        const filename = `Bao_Cao_Kho_Ke_Toan_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        try {
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(wbout, filename, true);
            toast.success("Đã xuất file báo cáo kho kế toán!");
        } catch (err) {
            console.error("Export Error:", err);
            toast.error("Lỗi khi xuất file");
        }
    };

    const stats = useMemo(() => {
        if (view !== 'import') return { total: 0, matched: 0, unmatched: 0, discrepancyQty: 0, discrepancyValue: 0 };
        const matchedItems = matchedData.filter(i => i.status === 'matched');
        const totalExcelValue = matchedItems.reduce((sum, i) => sum + (i.excelPrice * i.excelStock), 0);
        const totalPosValue = matchedItems.reduce((sum, i) => sum + (i.excelPrice * (i.matchedProduct?.stock || 0)), 0);

        return {
            total: matchedData.length,
            matched: matchedItems.length,
            unmatched: matchedData.filter(i => i.status === 'unmatched').length,
            discrepancyQty: matchedItems.reduce((sum, i) => sum + (i.excelStock - (i.matchedProduct?.stock || 0)), 0),
            discrepancyValue: totalExcelValue - totalPosValue
        };
    }, [matchedData, view]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));

            const hasDiscrepancy = (p.accounting_stock || 0) !== (p.stock || 0);
            const hasCode = p.code && p.code.trim() !== '';

            let matches = matchesSearch;
            if (showDiscrepancyOnly) matches = matches && hasDiscrepancy;
            if (showOnlyCoded) matches = matches && hasCode;

            return matches;
        });
    }, [products, searchQuery, showDiscrepancyOnly, showOnlyCoded]);

    const sortedProducts = useMemo(() => {
        let sortableItems = [...filteredProducts];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle diff calculation for sorting
                if (sortConfig.key === 'diff') {
                    aValue = (a.accounting_stock || 0) - (a.stock || 0);
                    bValue = (b.accounting_stock || 0) - (b.stock || 0);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredProducts, sortConfig]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedProducts.slice(start, start + itemsPerPage);
    }, [sortedProducts, currentPage, itemsPerPage]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20" />;
        return sortConfig.direction === 'asc'
            ? <ChevronDown size={12} className="ml-1 rotate-180 text-emerald-500" />
            : <ChevronDown size={12} className="ml-1 text-emerald-500" />;
    };

    const handleQuickAuditSave = async (auditData) => {
        try {
            await axios.post("/api/inventory/audit", auditData);
            toast.success("Đã cập nhật kho thành công!");
            queryClient.invalidateQueries(["products"]);
            const syncChannel = new BroadcastChannel("pos_data_sync");
            syncChannel.postMessage({ type: "PRODUCT_UPDATED" });
            syncChannel.close();
            fetchProducts();
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi cập nhật kho");
            throw err;
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, showDiscrepancyOnly, showOnlyCoded]);

    useEffect(() => {
        setImportPage(1);
    }, [importSearch, importFilter]);

    const globalStats = useMemo(() => {
        const withStock = products.filter(p => (p.accounting_stock || 0) !== 0 || (p.stock || 0) !== 0);
        const discrepancyCount = products.filter(p => (p.accounting_stock || 0) !== (p.stock || 0)).length;
        const totalAccountingValue = products.reduce((sum, p) => sum + ((p.accounting_price || 0) * (p.accounting_stock || 0)), 0);

        return {
            total: products.length,
            withStock: withStock.length,
            discrepancy: discrepancyCount,
            totalValue: totalAccountingValue
        };
    }, [products]);

    return (
        <div className="pt-2 px-4 pb-20 w-full transition-colors">
            <div className="max-w-[1800px] mx-auto space-y-10 pb-32">
                {/* Header */}
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-4 md:px-0">
                    <div className="flex items-center gap-6 relative z-10">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
                                <Landmark className="text-slate-900 dark:text-white" size={32} />
                                Kho Kế Toán
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                                    view === 'list' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {view === 'list' ? 'Dashboard' : 'Import Mode'}
                                </span>
                                <p className="text-xs font-bold text-slate-400">
                                    {view === 'list' ? 'Giám sát chênh lệch tồn kho thời gian thực' : 'Quy trình đối soát dữ liệu từ tệp Excel'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        {view === 'list' && (
                            <div className="flex items-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleExportDashboardData}
                                    className="px-6 py-4 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black flex items-center gap-3 shadow-lg hover:border-emerald-500 hover:text-emerald-600 transition-all"
                                >
                                    <FileSpreadsheet size={20} />
                                    <span className="tracking-wide uppercase text-xs">Xuất báo cáo</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setView('import'); setStep(1); }}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-black transition-all group"
                                >
                                    <Upload size={20} className="group-hover:translate-y-[-2px] transition-transform" />
                                    <span className="tracking-wide uppercase text-sm">Đối soát Excel mới</span>
                                </motion.button>
                            </div>
                        )}
                        {view === 'import' && (
                            <>
                                {step === 3 && (
                                    <div className="flex items-center gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleExportImportData}
                                            className="px-6 py-4 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black flex items-center gap-3 shadow-lg hover:border-emerald-500 hover:text-emerald-600 transition-all"
                                        >
                                            <FileSpreadsheet size={20} />
                                            <span className="tracking-wide uppercase text-xs">Xuất báo cáo</span>
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleUpdate}
                                            disabled={updating || isUpdateSuccess}
                                            className={cn(
                                                "px-8 py-4 text-white rounded-2xl font-black flex items-center gap-3 shadow-2xl transition-all disabled:opacity-50",
                                                isUpdateSuccess ? "bg-slate-400" : "bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700"
                                            )}
                                        >
                                            {updating ? <RefreshCw className="animate-spin" size={20} /> : (isUpdateSuccess ? <CheckCircle2 size={20} /> : <Save size={20} />)}
                                            <span className="tracking-wide uppercase text-sm">
                                                {isUpdateSuccess ? 'Đã cập nhật xong' : `Cập nhật ${stats.matched} mặt hàng`}
                                            </span>
                                        </motion.button>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        if (isUpdateSuccess) {
                                            setView('list');
                                            setStep(1);
                                            setFileData([]);
                                            setIsUpdateSuccess(false);
                                        } else if (step > 1) {
                                            setStep(step - 1);
                                        } else {
                                            setView('list');
                                        }
                                    }}
                                    className="px-6 py-4 bg-transparent text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                                >
                                    {isUpdateSuccess ? 'Hoàn tất & Đóng' : (step === 1 ? 'Hủy bỏ' : 'Quay lại')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6">
                    {/* View 1: Dashboard / List View */}
                    {view === 'list' && (
                        <div className="space-y-6">
                            {/* Dashboard Stats */}
                            {/* Dashboard Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-transparent backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-900/5 group hover:y-[-4px] transition-all duration-300">
                                    <div className="flex items-start justify-between">
                                        <div className="w-14 h-14 bg-transparent rounded-2xl flex items-center justify-center text-slate-600 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
                                            <Package size={28} />
                                        </div>
                                        <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">{globalStats.total}</p>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tổng danh mục</p>
                                        <div className="h-1.5 w-full bg-transparent rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-slate-400 w-full" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-transparent backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-xl shadow-emerald-900/5 group hover:y-[-4px] transition-all duration-300">
                                    <div className="flex items-start justify-between">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
                                            <Database size={28} />
                                        </div>
                                        <p className="text-4xl font-black text-emerald-600 tabular-nums tracking-tighter">{globalStats.withStock}</p>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em]">Mặt hàng có tồn</p>
                                        <div className="h-1.5 w-full bg-emerald-100 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${(globalStats.withStock / globalStats.total) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className={cn(
                                    "p-6 rounded-[2rem] border backdrop-blur-md shadow-xl transition-all duration-500 group hover:y-[-4px]",
                                    globalStats.discrepancy > 0 ? "bg-rose-50/50 border-rose-100 shadow-rose-900/5" : "bg-transparent border-white shadow-slate-900/5"
                                )}>
                                    <div className="flex items-start justify-between">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500",
                                            globalStats.discrepancy > 0 ? "bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white" : "bg-transparent text-slate-400"
                                        )}>
                                            <AlertTriangle size={28} />
                                        </div>
                                        <p className={cn("text-4xl font-black tabular-nums tracking-tighter", globalStats.discrepancy > 0 ? "text-rose-600" : "text-slate-900")}>
                                            {globalStats.discrepancy}
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lệch Tồn KT/POS</p>
                                        <div className="h-1.5 w-full bg-rose-100 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-rose-500" style={{ width: `${(globalStats.discrepancy / globalStats.total) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden group hover:y-[-4px] transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                                            <Calculator size={28} />
                                        </div>
                                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{globalStats.totalValue.toLocaleString()}đ</p>
                                    </div>
                                    <div className="mt-4 relative z-10">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tổng trị giá kho KT</p>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters & Actions */}
                            {/* Filters & Actions Bar */}
                            <div className="bg-transparent backdrop-blur-xl p-5 rounded-[2.5rem] border border-white shadow-xl shadow-slate-900/5 flex flex-col xl:flex-row items-center gap-6">
                                <div className="relative flex-1 group w-full">
                                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Khám phá danh mục, mã hàng hoặc tên sản phẩm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-transparent/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-transparent rounded-2xl outline-none font-bold text-sm text-slate-800 transition-all placeholder:text-slate-400 shadow-inner"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-4 shrink-0">
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-4 rounded-2xl cursor-pointer select-none border-2 transition-all group",
                                            showDiscrepancyOnly ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-transparent hover:border-slate-100 text-slate-600"
                                        )}
                                        onClick={() => setShowDiscrepancyOnly(!showDiscrepancyOnly)}
                                    >
                                        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-all", showDiscrepancyOnly ? "bg-rose-500" : "bg-transparent group-hover:bg-slate-200")}>
                                            {showDiscrepancyOnly && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Lệch tồn kho</span>
                                    </div>

                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-4 rounded-2xl cursor-pointer select-none border-2 transition-all group",
                                            showOnlyCoded ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-transparent hover:border-slate-100 text-slate-600"
                                        )}
                                        onClick={() => setShowOnlyCoded(!showOnlyCoded)}
                                    >
                                        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-all", showOnlyCoded ? "bg-emerald-500" : "bg-transparent group-hover:bg-slate-200")}>
                                            {showOnlyCoded && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Có mã hàng</span>
                                    </div>

                                    <div className="w-px h-10 bg-transparent mx-2 hidden xl:block" />

                                    <button
                                        onClick={() => fetchProducts()}
                                        className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all active:scale-95"
                                        title="Làm mới dữ liệu"
                                    >
                                        <RefreshCw size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* List Table */}
                            <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl shadow-slate-900/10 overflow-hidden min-h-[600px] flex flex-col">
                                <div className="overflow-x-auto overflow-y-visible">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-900 text-white">
                                            <tr>
                                                <th
                                                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] w-40 cursor-pointer hover:bg-slate-800 transition-colors first:rounded-tl-[3rem]"
                                                    onClick={() => handleSort('code')}
                                                >
                                                    <div className="flex items-center gap-3">Mã hàng <SortIcon columnKey="code" /></div>
                                                </th>
                                                <th
                                                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] cursor-pointer hover:bg-slate-800 transition-colors"
                                                    onClick={() => handleSort('name')}
                                                >
                                                    <div className="flex items-center gap-3">Tên sản phẩm <SortIcon columnKey="name" /></div>
                                                </th>
                                                <th
                                                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-right cursor-pointer hover:bg-slate-800 transition-colors"
                                                    onClick={() => handleSort('stock')}
                                                >
                                                    <div className="flex items-center justify-end gap-3 text-emerald-300">Kho POS <SortIcon columnKey="stock" /></div>
                                                </th>
                                                <th
                                                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-right cursor-pointer hover:bg-slate-800 transition-colors"
                                                    onClick={() => handleSort('accounting_stock')}
                                                >
                                                    <div className="flex items-center justify-end gap-3 text-blue-300">Kho KT <SortIcon columnKey="accounting_stock" /></div>
                                                </th>
                                                <th
                                                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-right cursor-pointer hover:bg-slate-800 transition-colors"
                                                    onClick={() => handleSort('diff')}
                                                >
                                                    <div className="flex items-center justify-end gap-3 text-rose-300">Lệch <SortIcon columnKey="diff" /></div>
                                                </th>
                                                <th
                                                    className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-right cursor-pointer hover:bg-slate-800 transition-colors"
                                                    onClick={() => handleSort('accounting_price')}
                                                >
                                                    <div className="flex items-center justify-end gap-3 text-amber-300">Đơn giá KT <SortIcon columnKey="accounting_price" /></div>
                                                </th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] last:rounded-tr-[3rem]">Gợi ý xử lý</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedProducts.map((p) => {
                                                const diff = (p.accounting_stock || 0) - (p.stock || 0);
                                                const suggestType = (p.stock > (p.accounting_stock || 0)) ? 'import' : (p.stock < (p.accounting_stock || 0)) ? 'export' : null;

                                                return (
                                                    <motion.tr
                                                        layout
                                                        key={p.id}
                                                        className="group hover:bg-emerald-500/[0.02] transition-colors"
                                                    >
                                                        <td className="px-8 py-6 border-r border-slate-50">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-black text-slate-500 bg-transparent px-3 py-1.5 rounded-xl uppercase tracking-wider group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                                                    {p.code || 'CHƯA CẬP NHẬT'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 border-r border-slate-50">
                                                            <div className="max-w-xs">
                                                                <h4 className="text-sm font-black text-slate-900 leading-tight uppercase group-hover:text-emerald-600 transition-colors">{p.name}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Tag size={12} className="text-slate-300" />
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.unit || 'Đơn vị'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-slate-500 tabular-nums border-r border-slate-50">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-base group-hover:scale-110 transition-transform origin-right">{p.stock}</span>
                                                                <span className="text-[9px] text-slate-300 uppercase font-black">Thực tế</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-blue-600 bg-blue-500/[0.02] tabular-nums border-r border-slate-50">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-base group-hover:scale-110 transition-transform origin-right">{p.accounting_stock || 0}</span>
                                                                <span className="text-[9px] text-blue-300 uppercase font-black">Sổ sách</span>
                                                            </div>
                                                        </td>
                                                        <td className={cn(
                                                            "px-8 py-6 text-right font-black tabular-nums border-r border-slate-50",
                                                            diff > 0 ? "text-emerald-600 bg-emerald-50/20" : diff < 0 ? "text-rose-600 bg-rose-50/20" : "text-slate-200"
                                                        )}>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-lg tracking-tighter">
                                                                    {diff > 0 ? '+' : ''}{diff !== 0 ? diff : '0'}
                                                                </span>
                                                                {diff !== 0 && (
                                                                    <span className="text-[9px] uppercase font-black opacity-60"> lệch {Math.abs(diff)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-slate-900 tabular-nums border-r border-slate-50">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-base">{(p.accounting_price || 0).toLocaleString()} <span className="text-[10px] font-medium text-slate-400">đ</span></span>
                                                                <p className="text-[9px] text-slate-300 uppercase font-black">Giá nhập KT</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 relative">
                                                            {suggestType === 'import' && (
                                                                <motion.div
                                                                    initial={{ x: 10, opacity: 0 }}
                                                                    animate={{ x: 0, opacity: 1 }}
                                                                    className="flex items-center gap-3 text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-2xl w-fit shadow-sm border border-emerald-100 group-hover:shadow-emerald-200 transition-all duration-300"
                                                                >
                                                                    <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                                                                        <RefreshCw size={12} className="animate-spin-slow" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">Thực tế nhiều hơn</span>
                                                                        <span className="text-[10px] font-black text-emerald-800 uppercase leading-none">Nhập hóa đơn thêm</span>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                            {suggestType === 'export' && (
                                                                <motion.div
                                                                    initial={{ x: 10, opacity: 0 }}
                                                                    animate={{ x: 0, opacity: 1 }}
                                                                    className="flex items-center gap-3 text-rose-600 bg-rose-50 px-5 py-2.5 rounded-2xl w-fit shadow-sm border border-rose-100 group-hover:shadow-rose-200 transition-all duration-300"
                                                                >
                                                                    <div className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center text-white">
                                                                        <ArrowRight size={12} />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">Sổ sách nhiều hơn</span>
                                                                        <span className="text-[10px] font-black text-rose-800 uppercase leading-none">Xuất hóa đơn ra</span>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                            {!suggestType && (
                                                                <div className="flex items-center gap-3 text-slate-300 px-5 py-2.5">
                                                                    <CheckCircle2 size={16} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Tuyệt vời - Cân đối</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={(e) => {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setAuditProduct(p);
                                                                        setAuditCoords({
                                                                            top: rect.top,
                                                                            bottom: rect.bottom,
                                                                            left: rect.left,
                                                                            right: rect.right
                                                                        });
                                                                        setIsAuditOpen(true);
                                                                    }}
                                                                    className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all scale-75 group-hover:scale-100"
                                                                    title="Kiểm kho nhanh"
                                                                >
                                                                    <RefreshCw size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {paginatedProducts.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center py-32 bg-transparent/50 backdrop-blur-sm">
                                        <div className="w-20 h-20 bg-slate-200 rounded-[2rem] flex items-center justify-center text-slate-400 mb-6 shadow-inner animate-pulse">
                                            <Search size={40} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Không tìm thấy dữ liệu</h3>
                                        <p className="text-slate-400 font-medium mt-2">Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination Section */}
                            <div className="flex flex-col md:flex-row items-center justify-between bg-transparent backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-2xl shadow-slate-900/5 gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg">
                                        <p className="text-xs font-black uppercase tracking-widest">
                                            Trang <span className="text-emerald-400">{currentPage}</span> / {Math.ceil(filteredProducts.length / itemsPerPage)}
                                        </p>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                                        Hiển thị {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredProducts.length, currentPage * itemsPerPage)} trong {filteredProducts.length} mặt hàng
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-transparent p-1.5 rounded-2xl mr-2">
                                        {[20, 50, 100].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => { setItemsPerPage(val); setCurrentPage(1); }}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    itemsPerPage === val ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            className="w-12 h-12 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ArrowRight size={20} className="rotate-180" />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {[...Array(Math.min(5, Math.ceil(filteredProducts.length / itemsPerPage)))].map((_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={cn(
                                                            "w-12 h-12 rounded-2xl font-black text-sm transition-all border-2",
                                                            currentPage === pageNum ? "bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-white border-transparent text-slate-400 hover:border-slate-100"
                                                        )}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            className="w-12 h-12 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'import' && (
                        <div className="space-y-6">
                            {/* Step 1: Upload */}
                            {step === 1 && (
                                <div className="bg-transparent p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto mt-10">
                                    <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-8">
                                        <FileSpreadsheet size={48} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 mb-4">Nhập dữ liệu từ Excel</h2>
                                    <p className="text-slate-500 font-medium mb-10 max-w-sm">Tải lên file Excel chứa tồn kho cuối kỳ và giá kế toán để bắt đầu đối soát.</p>

                                    <div className="relative group w-full">
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="border-3 border-dashed border-slate-200 group-hover:border-emerald-500/50 rounded-3xl p-10 transition-all bg-transparent group-hover:bg-emerald-50 text-center">
                                            <Upload className={cn("mx-auto mb-4 transition-all duration-300", analyzing ? "animate-bounce text-emerald-600" : "text-slate-300 group-hover:text-emerald-500")} size={40} />
                                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest leading-none">
                                                {analyzing ? "Đang xử lý..." : "Chọn hoặc kéo thả file vào đây"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Mapping */}
                            {step === 2 && (
                                <div className="bg-transparent p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-3xl mx-auto">
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                                        <Columns className="text-emerald-600" size={24} />
                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thiết lập Cột Dữ Liệu</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cột Mã Sản Phẩm / Tên</label>
                                                <p className="text-xs text-slate-400 mb-4 italic">Hệ thống sẽ dùng cột này để tìm sản phẩm trong danh mục.</p>
                                            </div>
                                            <select
                                                value={mapping.code}
                                                onChange={(e) => setMapping({ ...mapping, code: e.target.value })}
                                                className="w-full bg-transparent border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                                            >
                                                <option value="">-- Chọn cột --</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cột Tồn Kho Kế Toán</label>
                                                <p className="text-xs text-slate-400 mb-4 italic">Số lượng tồn kho được ghi nhận trên sổ sách/file.</p>
                                            </div>
                                            <select
                                                value={mapping.stock}
                                                onChange={(e) => setMapping({ ...mapping, stock: e.target.value })}
                                                className="w-full bg-transparent border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                                            >
                                                <option value="">-- Chọn cột --</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cột Giá Kế Toán</label>
                                                <p className="text-xs text-slate-400 mb-4 italic">Đơn giá sản phẩm tính theo góc nhìn kế toán.</p>
                                            </div>
                                            <select
                                                value={mapping.price}
                                                onChange={(e) => setMapping({ ...mapping, price: e.target.value })}
                                                className="w-full bg-transparent border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                                            >
                                                <option value="">-- Chọn cột --</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-12 flex justify-end">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startMatching}
                                            className="px-10 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black flex items-center gap-3 shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                                        >
                                            TIẾP TỤC: ĐỐI SOÁT
                                            <ArrowRight size={20} />
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Preview */}
                            {step === 3 && (
                                <div className="space-y-8">
                                    {/* Summary Stats for Import */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-transparent backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-xl shadow-slate-900/5 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center text-slate-500">
                                                    <FileSpreadsheet size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng bản ghi</p>
                                                    <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.total}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-transparent backdrop-blur-md p-6 rounded-[2rem] border border-emerald-50 shadow-xl shadow-emerald-900/5 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Đã khớp mã</p>
                                                    <p className="text-2xl font-black text-emerald-600 tabular-nums">{stats.matched}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "bg-transparent backdrop-blur-md p-6 rounded-[2rem] border shadow-xl shadow-rose-900/5 transition-all",
                                            stats.unmatched > 0 ? "border-rose-100" : "border-white"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stats.unmatched > 0 ? "bg-rose-50 text-rose-600" : "bg-transparent text-slate-400")}>
                                                    <AlertCircle size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chưa khớp mã</p>
                                                    <p className={cn("text-2xl font-black tabular-nums", stats.unmatched > 0 ? "text-rose-600" : "text-slate-900")}>
                                                        {stats.unmatched}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400">
                                                    <Calculator size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lệch giá trị</p>
                                                    <p className={cn("text-xl font-black tabular-nums", stats.discrepancyValue >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                        {stats.discrepancyValue > 0 ? '+' : ''}{stats.discrepancyValue.toLocaleString()}đ
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Import Actions & Filters Bar */}
                                    <div className="bg-transparent backdrop-blur-xl p-5 rounded-[2.5rem] border border-white shadow-xl shadow-slate-900/5 flex flex-col xl:flex-row items-center gap-6">
                                        <div className="relative flex-1 group w-full">
                                            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm trong dữ liệu Excel vừa tải..."
                                                value={importSearch}
                                                onChange={(e) => setImportSearch(e.target.value)}
                                                className="w-full pl-14 pr-6 py-4 bg-transparent/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-transparent rounded-2xl outline-none font-bold text-sm text-slate-800 transition-all placeholder:text-slate-400 shadow-inner"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 bg-transparent p-1.5 rounded-2xl">
                                            {[
                                                { id: 'all', label: 'Tất cả' },
                                                { id: 'unmatched', label: 'Chưa khớp', color: 'rose' },
                                                { id: 'matched', label: 'Đã khớp', color: 'emerald' },
                                                { id: 'discrepancy', label: 'Lệch tồn', color: 'amber' }
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setImportFilter(f.id)}
                                                    className={cn(
                                                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                        importFilter === f.id
                                                            ? (f.id === 'unmatched' ? "bg-rose-500 text-white shadow-lg" :
                                                                f.id === 'matched' ? "bg-emerald-500 text-white shadow-lg" :
                                                                    f.id === 'discrepancy' ? "bg-amber-500 text-white shadow-lg" :
                                                                        "bg-slate-900 text-white shadow-lg")
                                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                                                    )}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="h-8 w-px bg-slate-200 mx-2 hidden xl:block" />

                                        <button
                                            onClick={() => setImportShowOnlyCoded(!importShowOnlyCoded)}
                                            className={cn(
                                                "flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border-2",
                                                importShowOnlyCoded
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 shadow-sm"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-lg flex items-center justify-center transition-colors",
                                                importShowOnlyCoded ? "bg-emerald-500" : "bg-transparent"
                                            )}>
                                                {importShowOnlyCoded && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Chỉ hiện mặt hàng có mã</span>
                                        </button>
                                    </div>

                                    {/* Import Preview Table */}
                                    <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl shadow-slate-900/10 overflow-hidden min-h-[600px] flex flex-col">
                                        <div className="overflow-x-auto overflow-y-visible">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-900 text-white">
                                                    <tr>
                                                        <th
                                                            className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] cursor-pointer hover:bg-slate-800 transition-colors first:rounded-tl-[3rem]"
                                                            onClick={() => setImportSort({ key: 'excelCode', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}
                                                        >
                                                            Sản Phẩm (Excel)
                                                        </th>
                                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-right">Kho Thực Tế (POS)</th>
                                                        <th
                                                            className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-right cursor-pointer hover:bg-slate-800 transition-colors"
                                                            onClick={() => setImportSort({ key: 'excelStock', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}
                                                        >
                                                            Kho Kế Toán (Excel)
                                                        </th>
                                                        <th
                                                            className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-right cursor-pointer hover:bg-slate-800 transition-colors"
                                                            onClick={() => setImportSort({ key: 'diff', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}
                                                        >
                                                            Chênh lệch
                                                        </th>
                                                        <th
                                                            className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] cursor-pointer hover:bg-slate-800 transition-colors last:rounded-tr-[3rem]"
                                                            onClick={() => setImportSort({ key: 'status', direction: importSort.direction === 'asc' ? 'desc' : 'asc' })}
                                                        >
                                                            Trạng thái khớp mã
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {paginatedImportData.map((item) => {
                                                        const diff = item.matchedProduct ? (item.excelStock - item.matchedProduct.stock) : 0;
                                                        const diffValue = diff * item.excelPrice;

                                                        return (
                                                            <tr key={item.id} className="group hover:bg-emerald-500/[0.02] transition-colors">
                                                                <td className="px-8 py-6 border-r border-slate-50">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                                                            <FileSpreadsheet size={24} />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <h4 className="text-sm font-black text-slate-700 truncate group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{item.excelCode}</h4>
                                                                            <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-transparent rounded-xl w-fit">
                                                                                <Tag size={12} className="text-slate-400" />
                                                                                <span className="text-[10px] font-black text-slate-500 uppercase">Giá KT: {item.excelPrice.toLocaleString()}đ</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 text-right font-black border-r border-slate-50">
                                                                    {item.matchedProduct ? (
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-base text-slate-500">{item.matchedProduct.stock}</span>
                                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.matchedProduct.unit || 'Đơn vị'}</span>
                                                                        </div>
                                                                    ) : <span className="text-slate-200 italic font-black uppercase text-[10px]">Chưa khớp</span>}
                                                                </td>
                                                                <td className="px-8 py-6 text-right font-black bg-emerald-500/[0.02] border-r border-slate-50">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-base text-emerald-600">{item.excelStock}</span>
                                                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Excel</span>
                                                                    </div>
                                                                </td>
                                                                <td className={cn(
                                                                    "px-8 py-6 text-right font-black border-r border-slate-50",
                                                                    item.matchedProduct && diff !== 0 ? (diff > 0 ? "bg-emerald-50/20" : "bg-rose-50/20") : ""
                                                                )}>
                                                                    {item.matchedProduct ? (
                                                                        <div className="flex flex-col items-end">
                                                                            <span className={cn("text-lg tracking-tighter", diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-slate-200")}>
                                                                                {diff > 0 ? '+' : ''}{diff}
                                                                            </span>
                                                                            {diff !== 0 && (
                                                                                <span className={cn("text-[9px] font-black uppercase tracking-widest leading-none", diff > 0 ? "text-emerald-400" : "text-rose-400")}>
                                                                                    {diff > 0 ? 'Thừa' : 'Thiếu'} ({diffValue.toLocaleString()}đ)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : <span className="text-slate-200 italic font-black uppercase text-[10px]">---</span>}
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    {item.matchedProduct ? (
                                                                        <div className="flex items-center justify-between group/match">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm transition-transform group-hover/match:scale-110">
                                                                                    <Package size={20} />
                                                                                </div>
                                                                                <div className="max-w-[200px]">
                                                                                    <p className="text-xs font-black text-slate-800 truncate uppercase leading-none mb-1">{item.matchedProduct.name}</p>
                                                                                    <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest">{item.matchedProduct.code}</p>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedMatchDataId(item.id);
                                                                                    setShowMatchModal(true);
                                                                                }}
                                                                                className="p-3 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-300 transition-all shadow-hover active:scale-90"
                                                                                title="Đổi sản phẩm khớp"
                                                                            >
                                                                                <RefreshCw size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.02, x: 5 }}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            onClick={() => {
                                                                                setSelectedMatchDataId(item.id);
                                                                                setShowMatchModal(true);
                                                                            }}
                                                                            className="w-full flex items-center justify-center gap-3 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all"
                                                                        >
                                                                            <CornerDownRight size={14} />
                                                                            KHỚP THỦ CÔNG
                                                                        </motion.button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {paginatedImportData.length === 0 && (
                                            <div className="flex-1 flex flex-col items-center justify-center py-32 bg-transparent/50 backdrop-blur-sm">
                                                <div className="w-20 h-20 bg-slate-200 rounded-[2rem] flex items-center justify-center text-slate-400 mb-6 shadow-inner animate-pulse">
                                                    <Search size={40} />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Không có dữ liệu phù hợp</h3>
                                                <p className="text-slate-400 font-medium mt-2 text-center max-w-xs">Hãy thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các mặt hàng khác.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Import Pagination */}
                                    <div className="flex flex-col md:flex-row items-center justify-between bg-transparent backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-2xl shadow-slate-900/5 gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg">
                                                <p className="text-xs font-black uppercase tracking-widest">
                                                    Trang <span className="text-emerald-400">{importPage}</span> / {Math.ceil(filteredImportData.length / importItemsPerPage)}
                                                </p>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                                                Hiển thị {Math.min(filteredImportData.length, (importPage - 1) * importItemsPerPage + 1)} - {Math.min(filteredImportData.length, importPage * importItemsPerPage)} trong {filteredImportData.length} dòng
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center bg-transparent p-1.5 rounded-2xl mr-2">
                                                {[20, 50, 100].map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => { setImportItemsPerPage(val); setImportPage(1); }}
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                            importItemsPerPage === val ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={importPage === 1}
                                                    onClick={() => setImportPage(importPage - 1)}
                                                    className="w-12 h-12 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:text-emerald-600 transition-all disabled:opacity-30"
                                                >
                                                    <ArrowRight size={20} className="rotate-180" />
                                                </button>
                                                <button
                                                    disabled={importPage >= Math.ceil(filteredImportData.length / importItemsPerPage)}
                                                    onClick={() => setImportPage(importPage + 1)}
                                                    className="w-12 h-12 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:text-emerald-600 transition-all disabled:opacity-30"
                                                >
                                                    <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Match Modal - Using Portal to escape transformed parents */}
            <AnimatePresence>
                {showMatchModal && createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowMatchModal(false); setSelectedMatchDataId(null); }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white overflow-hidden relative z-10"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center shadow-inner">
                                            <Search size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 leading-none">Khớp sản phẩm thủ công</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mt-3">
                                                Ghép nối với mã Excel: <span className="text-rose-500">{matchedData.find(i => i.id === selectedMatchDataId)?.excelCode}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setShowMatchModal(false); setSelectedMatchDataId(null); }}
                                        className="w-12 h-12 flex items-center justify-center bg-transparent hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-transparent p-6 rounded-[2rem] border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Chọn sản phẩm từ danh mục hệ thống</label>
                                        </div>
                                        <div className="relative z-[60]">
                                            <SearchableSelect
                                                options={products}
                                                displayValue={(p) => `${p.name} (${p.code || 'N/A'})`}
                                                valueKey="id"
                                                onChange={(val) => {
                                                    const product = products.find(p => p.id === val);
                                                    if (product) handleManualMatch(product);
                                                }}
                                                placeholder="Tìm tên sản phẩm, hoạt chất, mã hàng..."
                                                className="!bg-white !rounded-2xl !py-3 !px-4 !ring-2 !ring-slate-100 focus-within:!ring-emerald-500/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div className="text-xs text-blue-700 font-medium leading-relaxed">
                                            <b>Lưu ý:</b> Việc khớp thủ công sẽ ghi đè các kết quả tự động trước đó. Sản phẩm được chọn sẽ được cập nhật tồn kho và giá theo dữ liệu từ file Excel này.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-slate-900 flex justify-between items-center group">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Yêu cầu xác nhận trước khi lưu</p>
                                <button
                                    onClick={() => { setShowMatchModal(false); setSelectedMatchDataId(null); }}
                                    className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black text-xs hover:bg-slate-700 transition-all uppercase tracking-widest"
                                >
                                    Đóng cửa sổ
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>

            {isAuditOpen && auditProduct && createPortal(
                <QuickAuditPopout
                    product={auditProduct}
                    isOpen={isAuditOpen}
                    coordinates={auditCoords}
                    onClose={() => {
                        setIsAuditOpen(false);
                        setAuditProduct(null);
                    }}
                    onSave={handleQuickAuditSave}
                />,
                document.body
            )}
        </div>
    );
}
