import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Truck,
  History as HistoryIcon,
  Clock,
  Menu,
  AlertTriangle,
  ArrowRight,
  Zap,
  BookOpen,
  DollarSign,
  Package,
  ListChecks,
  Users,
  ClipboardList,
  Store,
  Sparkles
} from 'lucide-react';
import { formatNumber } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import MobileMenu from '../../components/MobileMenu';
import { checkIsAdmin } from '../../lib/auth';
import useMobileNative from '../../hooks/useMobileNative';

export default function MobileDashboard() {
  const navigate = useNavigate();
  const { triggerHaptic } = useMobileNative();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check user role
  const currentUser = useMemo(() => {
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }, []);

  const isAdmin = checkIsAdmin(currentUser?.role);

  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    customer_debt: 0,
    supplier_debt: 0,
    expiry: { near: 0, expired: 0 },
    low_stock: 0,
  });
  const [todayPurchases, setTodayPurchases] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [year, month, day] = todayStr.split('-');

      if (isAdmin) {
        const statsRes = await axios.get(`/api/dashboard-stats?year=${year}&month=${month}&day=${day}`);
        setStats(statsRes.data);

        const purchasesRes = await axios.get(`/api/orders?type=Purchase&year=${year}&month=${month}&day=${day}&limit=50&page=1`);
        const purchasesItems = purchasesRes.data.items || purchasesRes.data || [];
        const purchasesSum = purchasesItems.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        setTodayPurchases(purchasesSum);

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        const chartRes = await axios.get(`/api/reports/sales-chart?start_date=${startStr}&end_date=${endStr}`);
        setChartData(chartRes.data || []);
      }

      const ordersRes = await axios.get(`/api/orders?limit=4&page=1`);
      setRecentOrders(ordersRes.data.items || ordersRes.data || []);

      const productsRes = await axios.get('/api/products?filterType=warning&limit=4&page=1');
      setLowStockProducts(productsRes.data.items || productsRes.data || []);

    } catch (error) {
      console.error("Failed to fetch dashboard stats for mobile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const syncChannel = new BroadcastChannel('pos_data_sync');
    syncChannel.onmessage = (e) => {
      if (e.data.type === 'PARTNER_UPDATED' || e.data.type === 'ORDER_CREATED') {
        fetchData();
      }
    };
    return () => syncChannel.close();
  }, [isAdmin]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 5) return { text: "Chúc ngủ ngon", desc: "Chuẩn bị năng lượng cho ngày mới bứt phá" };
    if (hour < 11) return { text: "Chào buổi sáng", desc: "Chúc bạn một ngày làm việc hiệu quả và thành công!" };
    if (hour < 14) return { text: "Chào buổi trưa", desc: "Nạp năng lượng duy trì hiệu suất làm việc tốt nhất" };
    if (hour < 18) return { text: "Chào buổi chiều", desc: "Hoàn thành xuất sắc các mục tiêu đơn hàng hôm nay" };
    return { text: "Chào buổi tối", desc: "Tổng kết công việc kinh doanh ngày hôm nay" };
  };

  const greeting = getGreeting();

  const svgChart = useMemo(() => {
    if (!isAdmin || !chartData || chartData.length === 0) return null;
    const width = 500;
    const height = 150;
    const padding = { top: 15, right: 15, bottom: 20, left: 15 };
    
    const maxVal = Math.max(...chartData.map(d => d.revenue), 100000);
    
    const points = chartData.map((d, index) => {
      const x = padding.left + (index / (chartData.length - 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - (d.revenue / maxVal) * (height - padding.top - padding.bottom);
      return { x, y, data: d };
    });
    
    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY1 = points[i-1].y;
        const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY2 = points[i].y;
        linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
      }
    }
    
    let areaPath = "";
    if (points.length > 0) {
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
    }
    
    return { width, height, points, linePath, areaPath, padding };
  }, [chartData, isAdmin]);

  return (
    <div className="p-3 space-y-3.5 no-print font-sans pb-12">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Header Banner */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-tr from-primary to-emerald-600 dark:from-emerald-700 dark:to-teal-600 rounded-3xl p-5 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">{greeting.text}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] backdrop-blur-sm">
              {currentUser?.name || (isAdmin ? 'Quản trị viên' : 'Nhân viên')}
            </span>
          </div>

          <h2 className="text-lg font-extrabold tracking-tight mt-1.5 leading-snug">
            {greeting.desc}
          </h2>

          {/* Show Profit ONLY for Admin */}
          {isAdmin ? (
            <div className="mt-5 pt-3 border-t border-white/20">
              <span className="text-xs font-semibold text-emerald-100">Lợi nhuận hôm nay</span>
              <div className="text-2xl font-black tracking-tight mt-0.5">
                {formatNumber(stats.profit)} <span className="text-sm font-normal opacity-90">đ</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-emerald-200" />
                <span className="text-xs font-bold text-emerald-100">Hệ thống sẵn sàng bán hàng</span>
              </div>
              <span className="text-[11px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-lg">
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
          <Sparkles size={110} strokeWidth={2.5} />
        </div>
      </m.div>

      {/* Admin Financial KPI Cards (Hidden for Standard Users) */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3">
          {/* Revenue */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-primary dark:text-emerald-400">
              <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                <ShoppingCart size={16} />
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Doanh thu</span>
            </div>
            <div className="mt-3">
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {formatNumber(stats.revenue)}đ
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Tổng thu hôm nay</span>
            </div>
          </m.div>

          {/* Costs */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-rose-500">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                <Truck size={16} />
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Nhập hàng</span>
            </div>
            <div className="mt-3">
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {formatNumber(todayPurchases)}đ
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Tổng chi phí nhập</span>
            </div>
          </m.div>

          {/* Customer Debt */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Khách nợ</span>
            </div>
            <div className="mt-3">
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {formatNumber(stats.customer_debt)}đ
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Phải thu KH</span>
            </div>
          </m.div>

          {/* Supplier Debt */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-amber-500">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                <TrendingDown size={16} />
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Nợ NCC</span>
            </div>
            <div className="mt-3">
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {formatNumber(stats.supplier_debt)}đ
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Phải trả NCC</span>
            </div>
          </m.div>
        </div>
      )}

      {/* 7-Day Revenue Sparkline (Admin Only) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-primary dark:text-emerald-400" />
            <span>Doanh thu 7 ngày gần nhất</span>
          </div>
          <div className="h-[120px] flex items-center justify-center relative">
            {loading ? (
              <span className="text-xs font-bold text-slate-400">Đang tải biểu đồ...</span>
            ) : !svgChart || svgChart.points.length === 0 ? (
              <span className="text-xs font-medium text-slate-400 italic">Chưa có dữ liệu doanh thu</span>
            ) : (
              <svg viewBox={`0 0 ${svgChart.width} ${svgChart.height}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={svgChart.areaPath} fill="url(#chart-gradient)" />
                <path d={svgChart.linePath} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                {svgChart.points.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
                    <text x={pt.x} y={svgChart.height - 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">
                      {pt.data.date.split('-')[2]}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Quick Action Operations Menu (All Users) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Zap size={16} className="text-amber-500" />
          <span>Thao tác nhanh</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => { triggerHaptic('light'); navigate('/mobile-pos'); }}
            className="bg-primary dark:bg-emerald-600 text-white p-3.5 rounded-xl flex items-center justify-between font-bold text-xs shadow-md shadow-primary/20 active:scale-95 transition-all android-touchable"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>Bán Hàng</span>
            </div>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => { triggerHaptic('light'); navigate('/mobile-orders'); }}
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 p-3.5 rounded-xl flex items-center justify-between font-bold text-xs active:scale-95 transition-all android-touchable border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-blue-500" />
              <span>Soạn Đơn</span>
            </div>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => { triggerHaptic('light'); navigate('/mobile-inventory'); }}
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 p-3.5 rounded-xl flex items-center justify-between font-bold text-xs active:scale-95 transition-all android-touchable border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-500" />
              <span>Kiểm Kho</span>
            </div>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => { triggerHaptic('light'); navigate('/mobile-history'); }}
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 p-3.5 rounded-xl flex items-center justify-between font-bold text-xs active:scale-95 transition-all android-touchable border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-amber-500" />
              <span>Sổ Giao Dịch</span>
            </div>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Low Stock Warning Section (All Users) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="text-xs font-bold text-amber-500 flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={16} />
            <span>Cảnh báo sắp hết hàng</span>
          </div>
          {isAdmin && (
            <span className="text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
              {stats.low_stock || lowStockProducts.length || 0} sản phẩm
            </span>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-3 text-xs font-bold text-slate-400">Đang kiểm tra tồn kho...</div>
          ) : lowStockProducts.length === 0 ? (
            <div className="text-center py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
              Kho hàng an toàn! Không có sản phẩm nào sắp hết.
            </div>
          ) : (
            lowStockProducts.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="min-w-0 pr-3">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">Mã: {p.sku || p.code || '---'}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400">{p.stock || p.current_stock || 0} {p.unit}</span>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Cần nhập</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
