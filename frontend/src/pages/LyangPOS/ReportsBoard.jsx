import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Calendar, Filter, Download, ChevronDown,
    TrendingUp, TrendingDown, DollarSign, Package, Users,
    CreditCard, ArrowRight, ArrowLeft, Search, RefreshCw, RefreshCcw,
    Layers, PieChart, Activity, Truck, Coins, Leaf, SprayCan,
    Sprout, Wheat, X, ExternalLink, ArrowUp, ArrowDown
} from 'lucide-react';
import Portal from '../../components/Portal';
import OrderEditPopup from '../../components/OrderEditPopup';
import CustomDatePicker from '../../components/CustomDatePicker';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

// Initial Date Helper - Default to current month
const getInitialRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Helper to format YYYY-MM-DD in local time
    const formatLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return {
        startDate: formatLocal(firstDay),
        endDate: formatLocal(lastDay)
    };
};

export default function ReportsBoard() {
    const savedState = JSON.parse(sessionStorage.getItem('reports_board_state') || '{}');
    const [dateRange, setDateRange] = useState(savedState.dateRange || getInitialRange());
    const [activeTab, setActiveTab] = useState(savedState.activeTab || 'sales'); // sales, customers, purchases, inventory, brands

    // Persist state
    useEffect(() => {
        sessionStorage.setItem('reports_board_state', JSON.stringify({ dateRange, activeTab }));
    }, [dateRange, activeTab]);
    const [loading, setLoading] = useState(false);

    // Data States
    const [products, setProducts] = useState([]);
    const [partners, setPartners] = useState([]);
    const [brands, setBrands] = useState([]);

    // Aggregated Report States
    const [reportKpis, setReportKpis] = useState(null);
    const [salesChart, setSalesChart] = useState(null);
    const [productReport, setProductReport] = useState([]);
    const [partnerReportData, setPartnerReportData] = useState([]);
    const [purchaseReportData, setPurchaseReportData] = useState([]);
    const [inventoryReportData, setInventoryReportData] = useState([]);
    const [brandReportData, setBrandReportData] = useState([]);
    const [purchaseChartData, setPurchaseChartData] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');

    // Pagination (for main report tables)
    const [page, setPage] = useState(1);
    const itemsPerPage = 15;

    // Detail View States
    const [detailOrders, setDetailOrders] = useState([]);
    const [detailConfig, setDetailConfig] = useState(null); // { type, id, name }
    const [detailPage, setDetailPage] = useState(1);
    const [detailTotal, setDetailTotal] = useState(0);
    const [detailLoading, setDetailLoading] = useState(false);

    // Order Viewing State
    const [viewingOrder, setViewingOrder] = useState(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: '', order: 'desc' });
    const [detailSearch, setDetailSearch] = useState('');
    const [debouncedDetailSearch, setDebouncedDetailSearch] = useState('');

    // 1. Fetch Basic Data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // 2. Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // Wait 500ms after user stops typing
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 3. Fetch Report Data when filters/sort changes
    useEffect(() => {
        fetchReportData();
        setPage(1);
    }, [dateRange, activeTab, debouncedSearchTerm, selectedBrand, sortConfig]);

    // 4. Default Sort when Tab changes
    useEffect(() => {
        if (activeTab === 'sales') setSortConfig({ key: 'revenue', order: 'desc' });
        else if (activeTab === 'customers') setSortConfig({ key: 'totalRevenue', order: 'desc' });
        else if (activeTab === 'inventory') setSortConfig({ key: 'exportQty', order: 'desc' });
        else if (activeTab === 'purchases') setSortConfig({ key: 'totalImport', order: 'desc' });
        else if (activeTab === 'brands') setSortConfig({ key: 'revenue', order: 'desc' });
    }, [activeTab]);

    // 5. Debounce Detail Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedDetailSearch(detailSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [detailSearch]);

    // 6. Refetch Detail when debounced search changes
    useEffect(() => {
        if (detailConfig) {
            fetchDetailOrders(detailConfig.type, detailConfig.id, detailConfig.name, 1);
        }
    }, [debouncedDetailSearch]);

    const fetchInitialData = async () => {
        try {
            const [prodRes, partRes] = await Promise.all([
                axios.get('/api/products'),
                axios.get('/api/partners')
            ]);
            setProducts(prodRes.data);
            setPartners(partRes.data);

            // Extract brands unique
            const uniqueBrands = [...new Set(prodRes.data.map(p => p.brand).filter(Boolean))].sort();
            setBrands(uniqueBrands);

        } catch (err) {
            console.error("Error fetching init data", err);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const commonParams = {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
                brand: selectedBrand,
                search: debouncedSearchTerm,
                sort_by: sortConfig.key,
                sort_order: sortConfig.order
            };

            // Fetch summary stats and specific reports in parallel
            const [kpiRes, chartRes, prodRes, partnerRes, invRes, brandRes, purchaseRes, purchaseChartRes] = await Promise.all([
                axios.get('/api/reports/kpis', { params: commonParams }),
                axios.get('/api/reports/sales-chart', { params: commonParams }),
                axios.get('/api/reports/product-sales', { params: { ...commonParams, limit: 100 } }),
                axios.get('/api/reports/partner-sales', { params: commonParams }),
                axios.get('/api/reports/inventory-flow', { params: commonParams }),
                axios.get('/api/reports/brands', { params: commonParams }),
                axios.get('/api/reports/purchase-sales', { params: commonParams }),
                axios.get('/api/reports/purchase-chart', { params: commonParams })
            ]);

            setReportKpis(kpiRes.data);
            setProductReport(prodRes.data);
            setPartnerReportData(partnerRes.data);
            setInventoryReportData(invRes.data);
            setBrandReportData(brandRes.data);
            setPurchaseReportData(purchaseRes.data);
            setPurchaseChartData(purchaseChartRes.data);

            // Format Sales Chart Data
            if (chartRes.data && chartRes.data.length > 0) {
                setSalesChart({
                    labels: chartRes.data.map(d => d.date.split('-').slice(1).join('/')),
                    datasets: [
                        {
                            label: 'Doanh Thu',
                            data: chartRes.data.map(d => d.revenue),
                            borderColor: '#2d5016',
                            backgroundColor: 'rgba(45, 80, 22, 0.03)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 2,
                            pointHoverRadius: 5
                        },
                        {
                            label: 'Lợi Nhuận',
                            data: chartRes.data.map(d => d.profit),
                            borderColor: '#d4a574',
                            backgroundColor: 'rgba(212, 165, 116, 0.03)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 2,
                            pointHoverRadius: 5
                        }
                    ]
                });
            } else {
                setSalesChart(null);
            }
        } catch (err) {
            console.error("Error fetching optimized reports", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailOrders = async (type, id, name, targetPage = 1) => {
        setDetailLoading(true);
        if (targetPage === 1) {
            setDetailOrders([]);
            setDetailConfig({ type, id, name });
        }
        setDetailPage(targetPage);

        try {
            const params = {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
                page: targetPage,
                limit: 15,
                search: debouncedDetailSearch
            };

            if (type === 'partner') params.partner_id = id;
            if (type === 'product') params.product_id = id;
            if (type === 'brand') params.brand = id;

            const res = await axios.get('/api/orders', { params });
            setDetailOrders(res.data.items || []);
            setDetailTotal(res.data.total || 0);
        } catch (err) {
            console.error("Error fetching detail orders", err);
        } finally {
            setDetailLoading(false);
        }
    };

    // Derived reports
    const salesReport = productReport;
    const partnerReport = partnerReportData;
    const purchaseReport = purchaseReportData;
    const inventoryReport = inventoryReportData;
    const brandReport = brandReportData;

    const slowMovingReport = useMemo(() => {
        if (activeTab !== 'inventory') return [];
        const soldProductIds = new Set(productReport.map(p => p.id));
        return products.filter(p => {
            if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return p.stock > 0 && !soldProductIds.has(p.id);
        }).map(p => ({
            ...p,
            value: p.stock * p.cost_price
        })).sort((a, b) => b.value - a.value);
    }, [products, productReport, activeTab, selectedBrand, searchTerm]);

    const brandChartData = useMemo(() => {
        if (activeTab !== 'brands' || !brandReport.length) return null;
        const topBrands = brandReport.slice(0, 6);
        const otherRevenue = brandReport.slice(6).reduce((sum, i) => sum + i.revenue, 0);
        const labels = topBrands.map(b => b.name);
        if (otherRevenue > 0) labels.push('Khác');
        const data = topBrands.map(b => b.revenue);
        if (otherRevenue > 0) data.push(otherRevenue);
        return {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8'],
                borderWidth: 0
            }]
        };
    }, [brandReport, activeTab]);

    const handleExport = async () => {
        let title = "";
        let data = [];
        if (activeTab === 'sales') {
            title = "BaoCao_BanHang";
            data = salesReport.map(i => ({ "Mã SP": i.code, "Tên SP": i.name, "ĐVT": i.unit, "Số lượng": i.qty, "Doanh thu": i.revenue, "Lợi nhuận": i.profit }));
        } else if (activeTab === 'customers') {
            title = "BaoCao_KhachHang";
            data = partnerReport.map(i => ({ "Tên KH": i.name, "SĐT": i.phone, "Số đơn": i.orderCount, "Doanh số": i.totalRevenue, "Nợ tăng": i.debtIncrease }));
        } else if (activeTab === 'purchases') {
            title = "BaoCao_NhapHang";
            data = purchaseReport.map(i => ({ "Nhà CC": i.name, "Số phiếu": i.importCount, "Tổng tiền": i.totalImport }));
        } else if (activeTab === 'inventory') {
            title = "BaoCao_XuatNhapTon";
            data = inventoryReport.map(i => ({ "Sản SP": i.name, "Tồn đầu": i.openingStock, "Nhập": i.importQty, "Xuất": i.exportQty, "Tồn cuối": i.currentStock }));
        } else if (activeTab === 'brands') {
            title = "BaoCao_NhanHang";
            data = brandReport.map(i => ({ "Nhãn hàng": i.name, "Doanh số": i.revenue, "Số lượng": i.qty }));
        }
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        
        const filename = `${title}_${dateRange.startDate}_${dateRange.endDate}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        
        try {
            const { saveOrOpenFile } = await import('../../utils/downloadHelper');
            await saveOrOpenFile(wbout, filename, true);
        } catch (err) {
            console.error("Export Error:", err);
        }
    };

    return (
        <div className="pt-2 px-4 pb-20 w-full transition-colors duration-300 relative">
            <div className="flex-1 flex flex-col overflow-hidden">

            {/* Header & Filters */}
            <div className="bg-transparent flex flex-col gap-2 z-30 sticky top-0 backdrop-blur-md pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-1.5 px-0">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary uppercase flex items-center gap-3 pt-2 pb-0.5 leading-relaxed tracking-tight">
                            <BarChart3 className="text-primary" size={32} />
                            TRUNG TÂM BÁO CÁO
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Phân tích doanh thu, lợi nhuận, dư nợ đối tác và hiệu suất nhãn hàng</p>
                        </div>
                    </div>
                    <button onClick={handleExport} className="pos-card bg-transparent border border-border px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-sm hover:bg-primary/10 transition-all text-primary active:scale-[0.98] shadow-none">
                        <Download size={18} /> Xuất Excel
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-50">
                    <div className="flex items-center gap-2">
                        <CustomDatePicker value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} />
                        <span className="text-primary/50 mx-1 font-bold">→</span>
                        <CustomDatePicker value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} />
                    </div>
                    <button onClick={() => setDateRange(getInitialRange())} className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-transparent text-primary hover:bg-primary/10 border border-[#d4a574]/30 rounded-2xl transition-colors active:scale-[0.98] shadow-none">Tháng này</button>
                    <div className="relative">
                        {searchTerm !== debouncedSearchTerm ? (
                            <RefreshCw className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary animate-spin" size={16} />
                        ) : (
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        )}
                        <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-transparent border border-border rounded-2xl text-sm font-bold w-64 outline-none focus:border-primary transition-colors shadow-none" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden z-20 relative">
                <div className="w-64 bg-transparent border-r border-slate-200/10 dark:border-white/5 flex flex-col p-4 space-y-1 overflow-y-auto">
                    <NavButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<TrendingUp size={18} />} label="Bán Hàng" desc="Doanh thu & Lợi nhuận" />
                    <NavButton active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users size={18} />} label="Khách Hàng" desc="Top mua & Công nợ" />
                    <NavButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={18} />} label="Kho Hàng" desc="Xuất - Nhập - Tồn" />
                    <NavButton active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} icon={<Truck size={18} />} label="Nhập Hàng" desc="Chi tiêu & NCC" />
                    <NavButton active={activeTab === 'brands'} onClick={() => setActiveTab('brands')} icon={<PieChart size={18} />} label="Nhãn Hàng" desc="Thị phần hãng" />
                </div>

                <div className="flex-1 overflow-auto bg-transparent px-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : (
                        <div className="w-full space-y-6">

                            {/* Sales KPIs & Chart */}
                            {activeTab === 'sales' && (
                                <>
                                    <div className="grid grid-cols-4 gap-4">
                                        <KPICard title="Doanh Thu" color="emerald" value={reportKpis?.total_revenue || 0} icon={<Coins />} />
                                        <KPICard title="Lợi Nhuận" color="blue" value={reportKpis?.total_profit || 0} icon={<TrendingUp />} />
                                        <KPICard title="SL Bán" color="purple" value={reportKpis?.total_qty || 0} isNumber icon={<Wheat />} />
                                        <KPICard title="Số Mặt Hàng" color="orange" value={reportKpis?.product_count || 0} isNumber icon={<Leaf />} />
                                    </div>
                                    <div className="pos-card bg-transparent p-6 rounded-2xl border border-border shadow-none">
                                        <h3 className="font-black text-sm text-primary mb-4 flex items-center gap-2 uppercase tracking-wider"><BarChart3 size={20} /> Biểu đồ Doanh Thu & Lợi Nhuận</h3>
                                        <div className="h-80 w-full">
                                            {salesChart && <Line data={salesChart} options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        display: true,
                                                        labels: {
                                                            font: { family: 'Outfit, sans-serif', size: 11, weight: 'bold' },
                                                            color: '#8b6f47',
                                                            usePointStyle: true,
                                                            pointStyle: 'circle',
                                                            padding: 15
                                                        }
                                                    },
                                                    tooltip: {
                                                        backgroundColor: 'rgba(45, 80, 22, 0.95)',
                                                        titleFont: { family: 'Outfit, sans-serif', size: 12, weight: 'bold' },
                                                        bodyFont: { family: 'Outfit, sans-serif', size: 14, weight: 'bold' },
                                                        padding: 12,
                                                        borderRadius: 12
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        grid: { color: 'rgba(212, 165, 116, 0.08)', borderDash: [5, 5] },
                                                        ticks: { font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' }, color: '#8b6f47' }
                                                    },
                                                    x: {
                                                        grid: { display: false },
                                                        ticks: { font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' }, color: '#8b6f47' }
                                                    }
                                                }
                                            }} />}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Purchases Charts */}
                            {activeTab === 'purchases' && purchaseChartData && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Trends Chart */}
                                    <div className="pos-card bg-transparent p-6 rounded-2xl border border-border shadow-none">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-black text-sm text-primary flex items-center gap-2 uppercase tracking-wider"><Activity size={20} className="text-orange-500" /> Biến động nhập hàng</h3>
                                            <div className="text-[10px] font-black bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full uppercase">Tiền hàng</div>
                                        </div>
                                        <div className="h-64 w-full">
                                            <Line
                                                data={{
                                                    labels: purchaseChartData.map(d => d.date.split('-').slice(1).join('/')),
                                                    datasets: [{
                                                        label: 'Tiền nhập',
                                                        data: purchaseChartData.map(d => d.spending),
                                                        borderColor: '#8b6f47',
                                                        backgroundColor: 'rgba(139, 111, 71, 0.03)',
                                                        fill: true,
                                                        tension: 0.4,
                                                        borderWidth: 3,
                                                        pointRadius: 2,
                                                        pointBackgroundColor: '#d4a574'
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(139, 111, 71, 0.95)',
                                                            titleFont: { family: 'Outfit, sans-serif', size: 12, weight: 'bold' },
                                                            bodyFont: { family: 'Outfit, sans-serif', size: 14, weight: 'bold' },
                                                            padding: 12,
                                                            borderRadius: 12
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: { color: 'rgba(212, 165, 116, 0.08)', borderDash: [5, 5] },
                                                            ticks: { font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' }, color: '#8b6f47' }
                                                        },
                                                        x: {
                                                            grid: { display: false },
                                                            ticks: { font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' }, color: '#8b6f47' }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {/* Top Suppliers Chart */}
                                    <div className="pos-card bg-transparent p-6 rounded-2xl border border-border shadow-none">
                                        <h3 className="font-black text-sm text-primary mb-4 flex items-center gap-2 uppercase tracking-wider"><Users size={20} className="text-blue-500" /> Top Nhà cung cấp (Chi)</h3>
                                        <div className="h-64 w-full flex items-center justify-center">
                                            {purchaseReportData.length > 0 ? (
                                                <Doughnut
                                                    data={{
                                                        labels: purchaseReportData.slice(0, 5).map(p => p.name),
                                                        datasets: [{
                                                            data: purchaseReportData.slice(0, 5).map(p => p.totalImport),
                                                            backgroundColor: ['#2d5016', '#4a7c59', '#d4a574', '#8b6f47', '#a3c293'],
                                                            borderWidth: 2,
                                                            borderColor: 'rgba(255, 255, 255, 0.05)',
                                                            hoverOffset: 10
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        cutout: '75%',
                                                        plugins: {
                                                            legend: {
                                                                position: 'right',
                                                                labels: {
                                                                    font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' },
                                                                    color: '#8b6f47',
                                                                    usePointStyle: true,
                                                                    pointStyle: 'circle',
                                                                    padding: 10
                                                                }
                                                            },
                                                            tooltip: {
                                                                backgroundColor: 'rgba(45, 80, 22, 0.95)',
                                                                titleFont: { family: 'Outfit, sans-serif', size: 12, weight: 'bold' },
                                                                bodyFont: { family: 'Outfit, sans-serif', size: 14, weight: 'bold' },
                                                                padding: 12,
                                                                borderRadius: 12
                                                            }
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-slate-400 text-xs font-bold uppercase">Chưa có dữ liệu nhập hàng</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Customer KPIs & Charts */}
                            {activeTab === 'customers' && partnerReportData && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                    {/* Left: Total Debt Summary Indicator */}
                                    <div className="pos-card bg-transparent p-6 rounded-2xl border border-border shadow-none flex flex-col relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <DollarSign size={120} className="text-primary" />
                                        </div>
                                        <h3 className="text-xs font-black text-primary dark:text-[#d4a574] uppercase mb-4 tracking-widest flex items-center gap-2">
                                            <Activity size={16} className="text-primary" /> Tổng nợ toàn hệ thống
                                        </h3>
                                        <div className="relative h-52 w-full flex items-center justify-between gap-2">
                                            {/* Chart container - perfectly centered */}
                                            <div className="relative h-36 w-36 flex-shrink-0 flex items-center justify-center">
                                                <Doughnut
                                                    data={{
                                                        labels: [...partnerReportData].sort((a, b) => b.totalDebt - a.totalDebt).slice(0, 5).map(p => p.name),
                                                        datasets: [{
                                                            data: [...partnerReportData].sort((a, b) => b.totalDebt - a.totalDebt).slice(0, 5).map(p => p.totalDebt),
                                                            backgroundColor: ['#2d5016', '#4a7c59', '#d4a574', '#8b6f47', '#e2c29d'],
                                                            hoverOffset: 6,
                                                            cutout: '76%',
                                                            borderRadius: 0,
                                                            borderWidth: 0,
                                                            borderColor: 'transparent'
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: { display: false },
                                                            tooltip: {
                                                                enabled: false
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Tổng Cộng</span>
                                                    <span className="text-xs font-black text-primary leading-tight">
                                                        {formatNumber(partnerReportData.reduce((sum, p) => sum + (p.totalDebt || 0), 0))}
                                                    </span>
                                                    <span className="text-[7px] font-bold text-slate-400">VNĐ</span>
                                                </div>
                                            </div>
 
                                            {/* Custom legend container */}
                                            <div className="flex-1 flex flex-col justify-center gap-2.5 pr-1 z-10 min-w-0">
                                                {[...partnerReportData].sort((a, b) => b.totalDebt - a.totalDebt).slice(0, 5).map((p, index) => {
                                                    const colors = ['#2d5016', '#4a7c59', '#d4a574', '#8b6f47', '#e2c29d'];
                                                    return (
                                                        <div key={p.name} className="flex items-center justify-between text-[9px] font-bold text-[#8b6f47] gap-1">
                                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index] }} />
                                                                <span className="truncate uppercase tracking-tight" title={p.name}>{p.name}</span>
                                                            </div>
                                                            <span className="text-[9px] font-black text-primary flex-shrink-0 tabular-nums">{formatNumber(p.totalDebt)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Horizontal Risk Chart - Bảng Phong Thần Nợ */}
                                    <div className="lg:col-span-2 pos-card bg-transparent p-6 rounded-2xl border border-border shadow-none">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="text-sm font-black text-primary uppercase flex items-center gap-2">
                                                    <TrendingDown size={20} className="text-primary" /> Phân tích dư nợ hàng đầu
                                                </h3>
                                                <p className="text-[10px] text-[#8b6f47] dark:text-[#d4a574]/60 font-bold uppercase mt-1">Dựa trên tổng công nợ hiện tại</p>
                                            </div>
                                            <button className="bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-none">
                                                KHÁCH NỢ NHIỀU
                                            </button>
                                        </div>
                                        <div className="h-[208px]">
                                            <Line
                                                data={{
                                                    labels: [...partnerReportData].sort((a, b) => b.totalDebt - a.totalDebt).slice(0, 40).map(p => p.name),
                                                    datasets: [{
                                                        label: 'Tiền Nợ',
                                                        data: [...partnerReportData].sort((a, b) => b.totalDebt - a.totalDebt).slice(0, 40).map(p => p.totalDebt),
                                                        showLine: false, // Pure dot chart
                                                        pointRadius: 4.5,
                                                        pointHoverRadius: 8,
                                                        pointBackgroundColor: '#2d5016', // Forest green dots
                                                        pointBorderColor: '#d4a574',    // Gold borders
                                                        pointBorderWidth: 1.5
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: {
                                                            backgroundColor: 'rgba(45, 80, 22, 0.95)',
                                                            padding: 12,
                                                            titleFont: { family: 'Outfit, sans-serif', size: 12, weight: 'bold' },
                                                            bodyFont: { family: 'Outfit, sans-serif', size: 14, weight: 'bold' },
                                                            borderRadius: 12,
                                                            callbacks: {
                                                                title: (context) => `Khách hàng: ${context[0].label}`,
                                                                label: (ctx) => ` Nợ: ${formatNumber(ctx.raw)} VNĐ`
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        x: { grid: { display: false }, ticks: { display: false } },
                                                        y: { grid: { borderDash: [5, 5], color: 'rgba(212, 165, 116, 0.08)' }, ticks: { font: { family: 'Outfit, sans-serif', size: 8, weight: 'bold' }, color: '#8b6f47', callback: (val) => val >= 1e6 ? `${(val / 1e6).toFixed(0)}M` : formatNumber(val) } }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                                {/* Generic Data Table */}
                                <div className="pos-card bg-transparent rounded-2xl border border-border overflow-hidden flex flex-col shadow-none">
                                    <div className="p-4 px-6 border-b border-border bg-primary/5 text-primary font-black uppercase tracking-widest text-xs">
                                        Chi tiết báo cáo
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-primary/5 dark:bg-slate-900/40 border-b border-border sticky top-0 z-10 text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                                                <tr className="border-none">
                                                    {activeTab === 'sales' && (
                                                        <>
                                                            <ThSort label="Sản Phẩm" sortKey="name" current={sortConfig} onSort={setSortConfig} className="py-4" />
                                                            <th className="py-4 px-4 text-center border-r border-[#d4a574]/15 last:border-r-0 whitespace-nowrap text-slate-400 dark:text-slate-500 font-black">ĐVT</th>
                                                            <ThSort label="Số Lượng" sortKey="qty" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                            <ThSort label="Doanh Thu" sortKey="revenue" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                        </>
                                                    )}
                                                    {activeTab === 'customers' && (
                                                        <>
                                                            <ThSort label="Khách Hàng" sortKey="name" current={sortConfig} onSort={setSortConfig} className="py-4" />
                                                            <ThSort label="Số Đơn" sortKey="orderCount" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                            <ThSort label="Doanh Số" sortKey="totalRevenue" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                            <ThSort label="Nợ Tăng" sortKey="debtIncrease" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                            <ThSort label="Tổng Nợ" sortKey="totalDebt" current={sortConfig} onSort={setSortConfig} className="py-4 text-right text-red-600" />
                                                        </>
                                                    )}
                                                    {activeTab === 'inventory' && (
                                                        <>
                                                            <ThSort label="Sản Phẩm" sortKey="name" current={sortConfig} onSort={setSortConfig} className="py-4" />
                                                            <ThSort label="Tồn Đầu" sortKey="openingStock" current={sortConfig} onSort={setSortConfig} className="py-4 text-center" />
                                                            <ThSort label="+ Nhập" sortKey="importQty" current={sortConfig} onSort={setSortConfig} className="py-4 text-center" />
                                                            <ThSort label="- Xuất" sortKey="exportQty" current={sortConfig} onSort={setSortConfig} className="py-4 text-center" />
                                                            <ThSort label="Tồn Cuối" sortKey="currentStock" current={sortConfig} onSort={setSortConfig} className="py-4 text-center" />
                                                        </>
                                                    )}
                                                    {activeTab === 'purchases' && (
                                                        <>
                                                            <ThSort label="Nhà Cung Cấp" sortKey="name" current={sortConfig} onSort={setSortConfig} className="py-4" />
                                                            <ThSort label="Số Phiếu" sortKey="importCount" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                            <ThSort label="Tổng Tiền" sortKey="totalImport" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                        </>
                                                    )}
                                                    {activeTab === 'brands' && (
                                                        <>
                                                            <ThSort label="Nhãn Hàng" sortKey="name" current={sortConfig} onSort={setSortConfig} className="py-4" />
                                                            <ThSort label="Số Lượng" sortKey="qty" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                            <ThSort label="Doanh Số" sortKey="revenue" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                            <ThSort label="Lợi Nhuận" sortKey="profit" current={sortConfig} onSort={setSortConfig} className="py-4 text-right" />
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {activeTab === 'sales' && salesReport.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(row => (
                                                    <tr key={row.id} className="hover:bg-primary/5 transition-colors border-b border-border cursor-pointer group">
                                                        <td className="px-6 py-3.5"><div className="flex justify-between items-center"><div><div className="font-bold text-slate-800 dark:text-white">{row.name}</div><div className="text-xs text-slate-400 font-bold">{row.code}</div></div><button onClick={() => fetchDetailOrders('product', row.id, row.name)} className="p-1.5 opacity-0 group-hover:opacity-100 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"><Search size={14} /></button></div></td>
                                                        <td className="px-6 py-3.5 text-center font-bold text-slate-600 dark:text-slate-400">{row.unit}</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-slate-700 dark:text-slate-300">{formatNumber(row.qty)}</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-emerald-600">{formatNumber(row.revenue)} ₫</td>
                                                    </tr>
                                                ))}
                                                {activeTab === 'customers' && partnerReport.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(row => (
                                                    <tr key={row.id} className="hover:bg-primary/5 transition-colors border-b border-border cursor-pointer group">
                                                        <td className="px-6 py-3.5"><div className="flex justify-between items-center"><button onClick={() => fetchDetailOrders('partner', row.id, row.name)} className="font-black hover:underline text-primary">{row.name}</button><button onClick={() => fetchDetailOrders('partner', row.id, row.name)} className="p-1.5 opacity-0 group-hover:opacity-100 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"><Search size={14} /></button></div></td>
                                                        <td className="px-6 py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{row.orderCount}</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-slate-800 dark:text-white">{formatNumber(row.totalRevenue)} ₫</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-orange-500">{formatNumber(row.debtIncrease)} ₫</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-red-600">{formatNumber(row.totalDebt)} ₫</td>
                                                    </tr>
                                                ))}
                                                {activeTab === 'inventory' && inventoryReport.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(row => (
                                                    <tr key={row.id} className="hover:bg-primary/5 transition-colors border-b border-border cursor-pointer group">
                                                        <td className="px-6 py-3.5"><div className="flex justify-between items-center"><span className="font-bold text-slate-800 dark:text-white">{row.name}</span><button onClick={() => fetchDetailOrders('product', row.id, row.name)} className="p-1.5 opacity-0 group-hover:opacity-100 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"><Search size={14} /></button></div></td>
                                                        <td className="px-6 py-3.5 text-center font-bold text-slate-600 dark:text-slate-400">{formatNumber(row.openingStock)}</td>
                                                        <td className="px-6 py-3.5 text-center font-bold text-blue-600">+{row.importQty}</td>
                                                        <td className="px-6 py-3.5 text-center font-bold text-orange-600">-{row.exportQty}</td>
                                                        <td className="px-6 py-3.5 text-center font-black text-primary">{formatNumber(row.currentStock)}</td>
                                                    </tr>
                                                ))}
                                                {activeTab === 'purchases' && purchaseReport.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(row => (
                                                    <tr key={row.id} className="hover:bg-primary/5 transition-colors border-b border-border cursor-pointer group">
                                                        <td className="px-6 py-3.5"><div className="flex justify-between items-center"><span className="font-bold text-slate-800 dark:text-white">{row.name}</span><button onClick={() => fetchDetailOrders('partner', row.id, row.name)} className="p-1.5 opacity-0 group-hover:opacity-100 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"><Search size={14} /></button></div></td>
                                                        <td className="px-6 py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{row.importCount}</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-orange-600">{formatNumber(row.totalImport)} ₫</td>
                                                    </tr>
                                                ))}
                                                {activeTab === 'brands' && brandReport.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(row => (
                                                    <tr key={row.name} className="hover:bg-primary/5 transition-colors border-b border-border cursor-pointer group">
                                                        <td className="px-6 py-3.5"><div className="flex justify-between items-center"><span className="font-bold text-slate-800 dark:text-white">{row.name}</span><button onClick={() => fetchDetailOrders('brand', row.name, row.name)} className="p-1.5 opacity-0 group-hover:opacity-100 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"><Search size={14} /></button></div></td>
                                                        <td className="px-6 py-3.5 text-right font-bold text-slate-600 dark:text-slate-400">{formatNumber(row.qty)}</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-slate-850 dark:text-slate-200">{formatNumber(row.revenue)} ₫</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-emerald-600">{formatNumber(row.profit)} ₫</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    {(() => {
                                        const currentData = activeTab === 'sales' ? salesReport : activeTab === 'customers' ? partnerReport : activeTab === 'inventory' ? inventoryReport : activeTab === 'purchases' ? purchaseReport : brandReport;
                                        const totalPages = Math.ceil(currentData.length / itemsPerPage);
                                        if (totalPages <= 1) return null;
                                        return (
                                            <div className="p-4 flex justify-between items-center border-t border-border bg-primary/5">
                                                <div className="text-xs font-black text-slate-400 uppercase">Hiển thị {currentData.length} kết quả</div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        disabled={page === 1}
                                                        onClick={() => setPage(page - 1)}
                                                        className="px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary/10 transition-all text-primary"
                                                    >
                                                        <ArrowLeft size={14} className="inline mr-1" /> Trước
                                                    </button>
                                                    <div className="flex items-center text-xs font-black text-slate-400 px-4">Trang {page} / {totalPages}</div>
                                                    <button
                                                        disabled={page === totalPages}
                                                        onClick={() => setPage(page + 1)}
                                                        className="px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary/10 transition-all text-primary"
                                                    >
                                                        Sau <ArrowRight size={14} className="inline ml-1" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                </div>
            </div>

            {/* Optimized Details Modal */}
            <Portal>
                <AnimatePresence>
                    {detailConfig && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setDetailConfig(null)} />
                            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col relative z-20 border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-5 px-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
                                    <div className="flex-1">
                                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{detailConfig.type === 'partner' ? 'Lịch sử khách hàng' : detailConfig.type === 'brand' ? 'Lịch sử nhãn hàng' : 'Các giao dịch SP'}: {detailConfig.name}</h2>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">Tìm thấy {detailTotal} đơn hàng</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input type="text" placeholder="Tìm mã đơn, SĐT..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold w-52 outline-none focus:border-primary text-slate-900 dark:text-white" />
                                        </div>
                                        <button onClick={() => { setDetailConfig(null); setDetailSearch(''); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-rose-500"><X size={22} /></button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-4 relative custom-scrollbar bg-white dark:bg-slate-900">
                                    {detailLoading && <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>}
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                                            <tr className="border-b border-slate-200 dark:border-slate-700 uppercase text-[10px] font-extrabold text-slate-600 dark:text-slate-300 tracking-wider">
                                                <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700">Mã đơn</th>
                                                <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700">Ngày giờ</th>
                                                <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700">Khách hàng</th>
                                                <th className="p-3 text-right border-r border-slate-200 dark:border-slate-700">Tổng tiền</th>
                                                <th className="p-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                                            {detailOrders.map(order => (
                                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                                                    <td className="p-3 font-extrabold text-primary dark:text-emerald-400 text-center">#{order.display_id || order.id}</td>
                                                    <td className="p-3 text-xs text-center font-medium text-slate-600 dark:text-slate-300">{new Date(order.date).toLocaleString('vi-VN')}</td>
                                                    <td className="p-3 font-semibold text-center text-slate-800 dark:text-slate-200">{order.partner_name || 'Khách lẻ'}</td>
                                                    <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">{formatNumber(order.total_amount)} ₫</td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => setViewingOrder(order)} className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all"><ExternalLink size={15} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
                                    <div className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase">Trang {detailPage} / {Math.ceil(detailTotal / 15) || 1}</div>
                                    <div className="flex items-center gap-2">
                                        <button disabled={detailPage === 1 || detailLoading} onClick={() => fetchDetailOrders(detailConfig.type, detailConfig.id, detailConfig.name, detailPage - 1)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-extrabold uppercase tracking-wider disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200">Trước</button>
                                        <button disabled={detailPage >= Math.ceil(detailTotal / 15) || detailLoading} onClick={() => fetchDetailOrders(detailConfig.type, detailConfig.id, detailConfig.name, detailPage + 1)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider disabled:opacity-30 transition-all shadow-xs">Tiếp</button>
                                        <button onClick={() => setDetailConfig(null)} className="ml-3 px-5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">Đóng</button>
                                    </div>
                                </div>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Order Edit Popup Portal */}
            <Portal>
                <AnimatePresence>
                    {viewingOrder && (
                        <OrderEditPopup order={viewingOrder} onClose={() => setViewingOrder(null)} onSave={() => { fetchReportData(); setViewingOrder(null); }} />
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    </div>
    );
}

const NavButton = ({ active, onClick, icon, label, desc }) => (
    <button 
        onClick={onClick} 
        className={cn(
            "w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all duration-300 relative overflow-hidden border border-transparent",
            active 
                ? "bg-primary/10 border-primary/20 text-primary shadow-sm scale-[1.01]" 
                : "hover:bg-[#d4a574]/10 hover:border-border dark:text-slate-400 dark:hover:bg-slate-700/50"
        )}
    >
        {active && (
            <m.div
                layoutId="activeNavIndicator"
                className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
        <div className={cn("p-2.5 rounded-xl transition-all duration-300", active ? "bg-primary text-white shadow-sm" : "bg-[#d4a574]/10 text-[#8b6f47]")}>
            {icon}
        </div>
        <div>
            <div className="font-black text-sm uppercase tracking-wide">{label}</div>
            <div className={cn("text-[10px] font-bold uppercase tracking-wider mt-0.5", active ? "text-primary/70" : "text-[#8b6f47]/60 dark:text-slate-400/60")}>
                {desc}
            </div>
        </div>
    </button>
);

const KPICard = ({ title, value, icon, color, isNumber }) => {
    const iconColors = {
        emerald: 'bg-[#2d5016]/10 text-[#2d5016] dark:bg-[#2d5016]/20 dark:text-[#a3c293]',
        blue: 'bg-[#d4a574]/10 text-[#d4a574] dark:bg-[#d4a574]/20 dark:text-[#f3d9b1]',
        purple: 'bg-[#8b6f47]/10 text-[#8b6f47] dark:bg-[#8b6f47]/20 dark:text-[#d4c3b3]',
        orange: 'bg-[#4a7c59]/10 text-[#4a7c59] dark:bg-[#4a7c59]/20 dark:text-[#a3c293]'
    };
    return (
        <m.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="pos-card bg-transparent rounded-2xl p-5 border border-border shadow-none flex items-center gap-4 group transition-all duration-300 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700 blur-xl pointer-events-none" />
            <div className={cn("p-4 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110", iconColors[color] || iconColors.emerald)}>
                {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
            </div>
            <div className="min-w-0 relative z-10">
                <div className="text-muted text-[10px] font-black uppercase tracking-[0.15em] mb-0.5 truncate">{title}</div>
                <div className="text-xl font-black text-foreground tracking-tight truncate flex items-baseline gap-0.5">
                    {isNumber ? formatNumber(value) : formatCurrency(value)}
                </div>
            </div>
        </m.div>
    );
};

const ThSort = ({ label, sortKey, current, onSort, className }) => {
    const active = current.key === sortKey;
    const isAsc = active && current.order === 'asc';

    const handleSort = () => {
        if (active) {
            onSort({ key: sortKey, order: isAsc ? 'desc' : 'asc' });
        } else {
            onSort({ key: sortKey, order: 'desc' });
        }
    };

    return (
        <th className={cn("cursor-pointer select-none hover:bg-white/5 dark:hover:bg-slate-800/10 transition-colors group py-4 px-4 border-r border-[#d4a574]/15 last:border-r-0 whitespace-nowrap text-center text-slate-400 dark:text-slate-500 font-black", className)} onClick={handleSort}>
            <div className={cn("flex items-center gap-1.5", className?.includes('text-right') ? 'justify-end' : className?.includes('text-center') ? 'justify-center' : 'justify-center')}>
                {label}
                <div className={cn("flex flex-col -space-y-1 opacity-0 group-hover:opacity-100 transition-opacity", active ? "opacity-100" : "")}>
                    <ArrowUp size={10} className={cn(active && isAsc ? "text-[#2d5016] dark:text-[#d4a574]" : "text-slate-300/40")} />
                    <ArrowDown size={10} className={cn(active && !isAsc ? "text-[#2d5016] dark:text-[#d4a574]" : "text-slate-300/40")} />
                </div>
            </div>
        </th>
    );
};
