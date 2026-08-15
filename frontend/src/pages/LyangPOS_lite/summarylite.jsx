import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getLiteTheme } from '../../lib/liteTheme';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Truck,
  History as HistoryIcon,
  Sprout,
  Wheat,
  Clock,
  Calendar,
  Users,
  Percent,
  Package,
  Award,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, cn } from '../../lib/utils';
import { useLiteThemeSync } from "../../hooks/useLiteThemeSync";
import { Link } from 'react-router-dom';

export default function SummaryLite() {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('month'); // 'today', 'yesterday', '7days', 'month', 'custom'
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const offset = start.getTimezoneOffset();
    const localStart = new Date(start.getTime() - (offset * 60 * 1000));
    return {
      start: localStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  });

  const [salesKPI, setSalesKPI] = useState({
    total_revenue: 0,
    total_profit: 0,
    order_count: 0,
    product_count: 0,
    total_qty: 0
  });

  const [salesChart, setSalesChart] = useState([]);
  const [purchaseChart, setPurchaseChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [debtStats, setDebtStats] = useState({
    customer_debt: 0,
    supplier_debt: 0,
    customer_debt_list: [],
    supplier_debt_list: []
  });
  
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { bgColor } = useLiteThemeSync();
  const theme = useMemo(() => getLiteTheme(bgColor), [bgColor]);

  const getRangeDates = (type) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (type === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (type === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yestStr = yesterday.toISOString().split('T')[0];
      return { start: yestStr, end: yestStr };
    }
    if (type === '7days') {
      const start = new Date();
      start.setDate(today.getDate() - 6);
      const startStr = start.toISOString().split('T')[0];
      return { start: startStr, end: todayStr };
    }
    if (type === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const offset = start.getTimezoneOffset();
      const localStart = new Date(start.getTime() - (offset * 60 * 1000));
      const startStr = localStart.toISOString().split('T')[0];
      return { start: startStr, end: todayStr };
    }
    return { start: todayStr, end: todayStr };
  };

  useEffect(() => {
    if (filterType !== 'custom') {
      const range = getRangeDates(filterType);
      setDateRange(range);
    }
  }, [filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: `${dateRange.start}T00:00:00`,
        end_date: `${dateRange.end}T23:59:59`
      };

      // 1. Fetch Sales KPI
      const kpisRes = await axios.get('/api/reports/kpis', { params });
      setSalesKPI(kpisRes.data);

      // 2. Fetch Sales daily chart
      const salesChartRes = await axios.get('/api/reports/sales-chart', { params });
      setSalesChart(salesChartRes.data || []);

      // 3. Fetch Purchases daily chart
      const purchaseChartRes = await axios.get('/api/reports/purchase-chart', { params });
      setPurchaseChart(purchaseChartRes.data || []);

      // 4. Fetch Top Selling Products
      const topProductsRes = await axios.get('/api/reports/product-sales', {
        params: { ...params, limit: 5 }
      });
      setTopProducts(topProductsRes.data || []);

      // 5. Fetch Debt Stats
      const todayStr = new Date().toISOString().split('T')[0];
      const [year, month, day] = todayStr.split('-');
      const debtRes = await axios.get(`/api/dashboard-stats?year=${year}&month=${month}&day=${day}`);
      setDebtStats({
        customer_debt: debtRes.data.customer_debt || 0,
        supplier_debt: debtRes.data.supplier_debt || 0,
        customer_debt_list: debtRes.data.customer_debt_list || [],
        supplier_debt_list: debtRes.data.supplier_debt_list || []
      });

    } catch (error) {
      console.error("Failed to fetch reports summary lite data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate combined chart data (Sales & Purchases aligned by date)
  const combinedChartData = useMemo(() => {
    const map = {};
    salesChart.forEach(d => {
      map[d.date] = { date: d.date, revenue: d.revenue || 0, profit: d.profit || 0, spending: 0 };
    });
    purchaseChart.forEach(d => {
      if (map[d.date]) {
        map[d.date].spending = d.spending || 0;
      } else {
        map[d.date] = { date: d.date, revenue: 0, profit: 0, spending: d.spending || 0 };
      }
    });
    
    // Sort by date ascending
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [salesChart, purchaseChart]);

  // Sum spending from purchase chart to get total spending
  const totalSpending = useMemo(() => {
    return purchaseChart.reduce((sum, d) => sum + (d.spending || 0), 0);
  }, [purchaseChart]);

  // SVG Chart Coordinates calculation
  const svgChart = useMemo(() => {
    if (!combinedChartData || combinedChartData.length === 0) return null;
    
    const width = 600;
    const height = 160;
    const padding = { top: 20, right: 15, bottom: 25, left: 15 };
    
    const maxVal = Math.max(
      ...combinedChartData.map(d => Math.max(d.revenue || 0, d.spending || 0)),
      100000
    );
    
    const points = combinedChartData.map((d, index) => {
      const x = padding.left + (index / (combinedChartData.length - 1)) * (width - padding.left - padding.right);
      const yRevenue = height - padding.bottom - ((d.revenue || 0) / maxVal) * (height - padding.top - padding.bottom);
      const ySpending = height - padding.bottom - ((d.spending || 0) / maxVal) * (height - padding.top - padding.bottom);
      return { x, yRevenue, ySpending, data: d };
    });
    
    // Sales Line path
    let salesLinePath = "";
    if (points.length > 0) {
      salesLinePath = `M ${points[0].x} ${points[0].yRevenue}`;
      for (let i = 1; i < points.length; i++) {
        const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY1 = points[i-1].yRevenue;
        const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY2 = points[i].yRevenue;
        salesLinePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].yRevenue}`;
      }
    }
    
    // Purchase Line path
    let purchaseLinePath = "";
    if (points.length > 0) {
      purchaseLinePath = `M ${points[0].x} ${points[0].ySpending}`;
      for (let i = 1; i < points.length; i++) {
        const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY1 = points[i-1].ySpending;
        const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY2 = points[i].ySpending;
        purchaseLinePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].ySpending}`;
      }
    }
    
    // Area paths
    let salesAreaPath = "";
    if (points.length > 0) {
      salesAreaPath = `${salesLinePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
    }
    
    let purchaseAreaPath = "";
    if (points.length > 0) {
      purchaseAreaPath = `${purchaseLinePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
    }
    
    return { width, height, points, salesLinePath, purchaseLinePath, salesAreaPath, purchaseAreaPath, padding };
  }, [combinedChartData]);

  // Max quantity among top products for relative progress bar calculation
  const maxProductQty = useMemo(() => {
    if (topProducts.length === 0) return 1;
    return Math.max(...topProducts.map(p => p.qty), 1);
  }, [topProducts]);

  return (
    <div className="lite-sum-container">
      <style>{`
        .lite-sum-container {
          background-color: ${theme.bg};
          color: ${theme.text};
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Be Vietnam Pro', sans-serif !important;
          font-size: 15px;
          overflow-y: auto;
        }

        .lite-sum-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .lite-sum-greeting h2 {
          font-size: 2.4rem;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          color: ${theme.accent};
          text-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }

        .lite-sum-greeting p {
          margin: 0.35rem 0 0 0;
          font-weight: 850;
          opacity: 0.55;
          text-transform: uppercase;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
        }

        .lite-sum-clock {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          padding: 0.65rem 1.25rem;
          border-radius: 14px;
          font-weight: 850;
          font-family: monospace !important;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }

        .lite-sum-filter-card {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 24px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .lite-sum-capsules {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .lite-sum-capsule-btn {
          padding: 0.5rem 1.2rem;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          border-radius: 99px;
          border: 1px solid ${theme.border};
          background-color: ${theme.inputBg};
          color: ${theme.text};
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .lite-sum-capsule-btn:hover {
          border-color: ${theme.accent}60;
        }

        .lite-sum-capsule-btn.active {
          background-color: ${theme.accent};
          color: ${theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg} !important;
          border-color: ${theme.accent};
        }

        .lite-sum-custom-dates {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lite-sum-label {
          font-size: 0.65rem;
          font-weight: 900;
          opacity: 0.45;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.3rem;
          display: block;
        }

        .lite-sum-input {
          background-color: ${theme.inputBg};
          border: 1px solid ${theme.border};
          color: ${theme.text};
          padding: 0.6rem 0.9rem;
          border-radius: 9px;
          outline: none;
          font-size: 0.82rem;
          font-weight: 800;
          transition: border-color 0.2s;
        }

        .lite-sum-input:focus {
          border-color: ${theme.accent};
        }

        .lite-sum-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .lite-sum-card {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 22px;
          padding: 1.75rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .lite-sum-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.06);
          border-color: ${theme.accent}60;
        }

        .lite-sum-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background-color: ${theme.inputBg};
          color: ${theme.accent};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.2rem;
        }

        .lite-sum-card-title {
          font-size: 0.72rem;
          font-weight: 900;
          opacity: 0.45;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-bottom: 0.6rem;
        }

        .lite-sum-card-value {
          font-size: 1.95rem;
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .lite-sum-card-sub {
          font-size: 0.72rem;
          font-weight: 800;
          margin-top: 1rem;
          opacity: 0.65;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid ${theme.border};
          padding-top: 0.75rem;
        }

        .lite-sum-chart-panel {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 24px;
          padding: 1.75rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .lite-sum-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1.5px solid ${theme.border};
          padding-bottom: 0.9rem;
        }

        .lite-sum-panel-title {
          font-size: 0.9rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: ${theme.accent};
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .lite-sum-chart-legends {
          display: flex;
          gap: 1.25rem;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .lite-sum-legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .lite-sum-legend-color {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }

        .lite-chart-wrapper {
          position: relative;
          width: 100%;
        }

        .lite-chart-svg {
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .lite-chart-line-sales {
          fill: none;
          stroke: ${theme.accent};
          stroke-width: 3.5;
          stroke-linecap: round;
        }

        .lite-chart-line-purchases {
          fill: none;
          stroke: #ef4444;
          stroke-width: 3.5;
          stroke-linecap: round;
        }

        .lite-chart-area-sales {
          fill: url(#sales-gradient);
          opacity: 0.12;
        }

        .lite-chart-area-purchases {
          fill: url(#purchase-gradient);
          opacity: 0.08;
        }

        .lite-chart-dot-sales {
          fill: ${theme.surface};
          stroke: ${theme.accent};
          stroke-width: 3;
          cursor: pointer;
        }

        .lite-chart-dot-purchases {
          fill: ${theme.surface};
          stroke: #ef4444;
          stroke-width: 3;
          cursor: pointer;
        }

        .lite-chart-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.88);
          color: #ffffff;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
          font-family: monospace;
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          white-space: nowrap;
          transform: translate(-50%, -100%);
        }

        .lite-sum-details-sections {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .lite-sum-details-sections {
            grid-template-columns: 1fr;
          }
        }

        .lite-sum-panel {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 24px;
          padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .lite-sum-list {
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
        }

        .lite-sum-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          background-color: ${theme.subSurface};
          border: 1px solid ${theme.border};
          transition: all 0.2s ease;
        }

        .lite-sum-item:hover {
          border-color: ${theme.accent}40;
          background-color: ${theme.surface};
        }

        .lite-sum-progress-bar-container {
          width: 100%;
          height: 6px;
          background-color: ${theme.inputBg};
          border-radius: 99px;
          margin-top: 0.6rem;
          overflow: hidden;
        }

        .lite-sum-progress-bar-fill {
          height: 100%;
          background-color: ${theme.accent};
          border-radius: 99px;
          transition: width 0.4s ease;
        }

        .lite-sum-debt-summary-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .lite-sum-debt-widget {
          background-color: ${theme.subSurface};
          border: 1px solid ${theme.border};
          padding: 1.2rem;
          border-radius: 18px;
          text-align: center;
        }
      `}</style>

      {/* Header section */}
      <header className="lite-sum-header">
        <div className="lite-sum-greeting">
          <h2>Tổng hợp báo cáo</h2>
          <p>Hiệu quả hoạt động & Chỉ số kinh doanh Lite</p>
        </div>

        <div className="lite-sum-clock">
          <Calendar size={15} style={{ color: theme.accent }} />
          <span>
            {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </span>
          <span style={{ opacity: 0.3 }}>|</span>
          <Clock size={15} style={{ color: theme.accent }} />
          <span>
            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Date Filter Panel */}
      <section className="lite-sum-filter-card">
        <div>
          <span className="lite-sum-label">Chọn kỳ báo cáo</span>
          <div className="lite-sum-capsules">
            <button 
              className={cn("lite-sum-capsule-btn", filterType === 'today' && "active")}
              onClick={() => setFilterType('today')}
            >
              Hôm nay
            </button>
            <button 
              className={cn("lite-sum-capsule-btn", filterType === 'yesterday' && "active")}
              onClick={() => setFilterType('yesterday')}
            >
              Hôm qua
            </button>
            <button 
              className={cn("lite-sum-capsule-btn", filterType === '7days' && "active")}
              onClick={() => setFilterType('7days')}
            >
              7 ngày qua
            </button>
            <button 
              className={cn("lite-sum-capsule-btn", filterType === 'month' && "active")}
              onClick={() => setFilterType('month')}
            >
              Tháng này
            </button>
            <button 
              className={cn("lite-sum-capsule-btn", filterType === 'custom' && "active")}
              onClick={() => setFilterType('custom')}
            >
              Tự chọn khoảng ngày
            </button>
          </div>
        </div>

        {filterType === 'custom' && (
          <div className="lite-sum-custom-dates">
            <div>
              <label className="lite-sum-label">Từ ngày</label>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="lite-sum-input"
              />
            </div>
            <div>
              <label className="lite-sum-label">Đến ngày</label>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="lite-sum-input"
              />
            </div>
          </div>
        )}
      </section>

      {/* KPI Cards Grid */}
      <section className="lite-sum-grid">
        <div className="lite-sum-card">
          <div className="lite-sum-card-icon">
            <ShoppingCart size={20} />
          </div>
          <div className="lite-sum-card-title">Tổng Doanh Thu Bán</div>
          <div className="lite-sum-card-value" style={{ color: theme.accent }}>
            {formatNumber(salesKPI.total_revenue)}
          </div>
          <div className="lite-sum-card-sub">
            <span>Số lượng đơn: {salesKPI.order_count}</span>
            <span>SL bán: {salesKPI.total_qty} sản phẩm</span>
          </div>
        </div>

        <div className="lite-sum-card">
          <div className="lite-sum-card-icon" style={{ color: "#ef4444" }}>
            <Truck size={20} />
          </div>
          <div className="lite-sum-card-title">Tổng Chi Nhập Hàng</div>
          <div className="lite-sum-card-value" style={{ color: "#ef4444" }}>
            {formatNumber(totalSpending)}
          </div>
          <div className="lite-sum-card-sub">
            <span>Ước lượng chi phí</span>
            <span>Thực tế nhập kho</span>
          </div>
        </div>

        <div className="lite-sum-card">
          <div className="lite-sum-card-icon" style={{ color: salesKPI.total_profit >= 0 ? "#10b981" : "#ef4444" }}>
            <TrendingUp size={20} />
          </div>
          <div className="lite-sum-card-title">Lợi Nhuận Gộp</div>
          <div className="lite-sum-card-value" style={{ color: salesKPI.total_profit >= 0 ? "#10b981" : "#ef4444" }}>
            {formatNumber(salesKPI.total_profit)}
          </div>
          <div className="lite-sum-card-sub">
            <span>Tỷ suất LN gộp:</span>
            <span>
              {salesKPI.total_revenue > 0 
                ? `${Math.round((salesKPI.total_profit / salesKPI.total_revenue) * 100)}%` 
                : "0%"}
            </span>
          </div>
        </div>

        <div className="lite-sum-card">
          <div className="lite-sum-card-icon" style={{ color: "#3b82f6" }}>
            <Percent size={20} />
          </div>
          <div className="lite-sum-card-title">Chỉ số giao dịch</div>
          <div className="lite-sum-card-value" style={{ color: "#3b82f6" }}>
            {salesKPI.order_count > 0 
              ? formatNumber(Math.round(salesKPI.total_revenue / salesKPI.order_count)) 
              : "0"}
          </div>
          <div className="lite-sum-card-sub">
            <span>Doanh thu trung bình / Đơn hàng</span>
          </div>
        </div>
      </section>

      {/* SVG Comparative Chart */}
      <section className="lite-sum-chart-panel">
        <div className="lite-sum-panel-header">
          <div className="lite-sum-panel-title">
            <TrendingUp size={18} />
            <span>Biểu đồ so sánh thu chi</span>
          </div>
          <div className="lite-sum-chart-legends">
            <div className="lite-sum-legend-item">
              <div className="lite-sum-legend-color" style={{ backgroundColor: theme.accent }}></div>
              <span>Doanh Thu Bán</span>
            </div>
            <div className="lite-sum-legend-item">
              <div className="lite-sum-legend-color" style={{ backgroundColor: '#ef4444' }}></div>
              <span>Chi Nhập Hàng</span>
            </div>
          </div>
        </div>

        <div className="lite-chart-wrapper">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', opacity: 0.5, fontWeight: 900 }}>ĐANG TẢI BIỂU ĐỒ...</div>
          ) : !svgChart || svgChart.points.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', opacity: 0.5, fontStyle: 'italic' }}>Không có dữ liệu biểu diễn cho khoảng thời gian này.</div>
          ) : (
            <>
              <svg 
                viewBox={`0 0 ${svgChart.width} ${svgChart.height}`} 
                className="lite-chart-svg"
              >
                <defs>
                  <linearGradient id="sales-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.accent} />
                    <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="purchase-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = svgChart.padding.top + ratio * (svgChart.height - svgChart.padding.top - svgChart.padding.bottom);
                  return (
                    <line 
                      key={idx}
                      x1={svgChart.padding.left}
                      y1={y}
                      x2={svgChart.width - svgChart.padding.right}
                      y2={y}
                      stroke={theme.border}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Areas */}
                <path d={svgChart.salesAreaPath} className="lite-chart-area-sales" />
                <path d={svgChart.purchaseAreaPath} className="lite-chart-area-purchases" />

                {/* Lines */}
                <path d={svgChart.salesLinePath} className="lite-chart-line-sales" />
                <path d={svgChart.purchaseLinePath} className="lite-chart-line-purchases" />

                {/* X Axis Labels */}
                {svgChart.points.map((pt, idx) => {
                  // Only display label for subset of points if there are too many, to avoid overlap
                  const showLabel = svgChart.points.length <= 15 || idx % Math.ceil(svgChart.points.length / 10) === 0;
                  if (!showLabel) return null;
                  return (
                    <text
                      key={idx}
                      x={pt.x}
                      y={svgChart.height - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={theme.text}
                      style={{ opacity: 0.5 }}
                    >
                      {pt.data.date.split('-').slice(1).reverse().join('/')}
                    </text>
                  );
                })}

                {/* Interactive Sales Circles */}
                {svgChart.points.map((pt, idx) => (
                  <circle
                    key={`sales-dot-${idx}`}
                    cx={pt.x}
                    cy={pt.yRevenue}
                    r="4.5"
                    className="lite-chart-dot-sales"
                    onMouseEnter={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      const wrapperRect = e.target.closest('.lite-chart-wrapper').getBoundingClientRect();
                      setHoveredPoint({
                        revenue: pt.data.revenue,
                        spending: pt.data.spending,
                        date: pt.data.date,
                        x: rect.left - wrapperRect.left + rect.width / 2,
                        y: rect.top - wrapperRect.top - 8
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}

                {/* Interactive Purchase Circles */}
                {svgChart.points.map((pt, idx) => (
                  <circle
                    key={`purch-dot-${idx}`}
                    cx={pt.x}
                    cy={pt.ySpending}
                    r="4.5"
                    className="lite-chart-dot-purchases"
                    onMouseEnter={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      const wrapperRect = e.target.closest('.lite-chart-wrapper').getBoundingClientRect();
                      setHoveredPoint({
                        revenue: pt.data.revenue,
                        spending: pt.data.spending,
                        date: pt.data.date,
                        x: rect.left - wrapperRect.left + rect.width / 2,
                        y: rect.top - wrapperRect.top - 8
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>

              {/* Chart Tooltip */}
              {hoveredPoint && (
                <div 
                  className="lite-chart-tooltip"
                  style={{ 
                    left: hoveredPoint.x, 
                    top: hoveredPoint.y 
                  }}
                >
                  <div style={{ opacity: 0.6, fontSize: '8px', marginBottom: '4px', textTransform: 'uppercase' }}>{hoveredPoint.date}</div>
                  <div style={{ color: theme.accent }}>Bán: {formatCurrency(hoveredPoint.revenue)}</div>
                  <div style={{ color: '#ef4444', marginTop: '2px' }}>Nhập: {formatCurrency(hoveredPoint.spending)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Two Column Grid: Top Products & Debts */}
      <section className="lite-sum-details-sections">
        {/* Left Side: Top Products */}
        <div className="lite-sum-panel">
          <div className="lite-sum-panel-header">
            <div className="lite-sum-panel-title">
              <Award size={18} />
              <span>Top 5 sản phẩm bán chạy</span>
            </div>
          </div>

          <div className="lite-sum-list">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', opacity: 0.5, fontWeight: 900 }}>ĐANG TẢI...</div>
            ) : topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontStyle: 'italic' }}>Không có dữ liệu sản phẩm trong kỳ.</div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p.id || idx} className="lite-sum-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 950, color: theme.accent, marginRight: '0.5rem', opacity: 0.8 }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.88rem' }}>{p.name}</span>
                      <span style={{ fontSize: '0.68rem', opacity: 0.5, fontWeight: 800, marginLeft: '6px' }}>({p.unit || 'Đơn vị'})</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 950, fontSize: '1rem', color: theme.accent }}>{p.qty}</span>
                      <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 800, marginTop: '0.1rem' }}>
                        D.Thu: {formatNumber(p.revenue)}
                      </div>
                    </div>
                  </div>
                  <div className="lite-sum-progress-bar-container">
                    <div 
                      className="lite-sum-progress-bar-fill"
                      style={{ width: `${(p.qty / maxProductQty) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Cumulative Debt Summary */}
        <div className="lite-sum-panel" style={{ height: 'fit-content' }}>
          <div className="lite-sum-panel-header">
            <div className="lite-sum-panel-title" style={{ color: "#f59e0b" }}>
              <Users size={18} />
              <span>Số dư công nợ toàn thời gian</span>
            </div>
          </div>

          <div className="lite-sum-debt-summary-row">
            <div className="lite-sum-debt-widget">
              <div style={{ fontSize: '0.62rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Phải thu khách hàng
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#f59e0b', letterSpacing: '-0.02em' }}>
                {formatNumber(debtStats.customer_debt)}
              </div>
            </div>
            
            <div className="lite-sum-debt-widget">
              <div style={{ fontSize: '0.62rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Phải trả nhà cung cấp
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#ef4444', letterSpacing: '-0.02em' }}>
                {formatNumber(debtStats.supplier_debt)}
              </div>
            </div>
          </div>

          {/* Top 3 Customers with Debt */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
              Danh sách nợ khách hàng lớn nhất
            </div>
            <div className="lite-sum-list" style={{ gap: '0.5rem' }}>
              {loading ? (
                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Đang tải...</div>
              ) : debtStats.customer_debt_list.length === 0 ? (
                <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '0.8rem' }}>Không có nợ khách hàng.</div>
              ) : (
                debtStats.customer_debt_list.slice(0, 3).map((p, idx) => (
                  <div key={p.id || idx} className="lite-sum-item" style={{ padding: '0.65rem 1rem', borderRadius: '12px' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>{p.name}</span>
                    <span style={{ fontWeight: 900, fontFamily: 'monospace', color: '#f59e0b' }}>{formatNumber(p.balance)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top 3 Suppliers with Debt */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
              Danh sách nợ nhà cung cấp lớn nhất
            </div>
            <div className="lite-sum-list" style={{ gap: '0.5rem' }}>
              {loading ? (
                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Đang tải...</div>
              ) : debtStats.supplier_debt_list.length === 0 ? (
                <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '0.8rem' }}>Không có nợ nhà cung cấp.</div>
              ) : (
                debtStats.supplier_debt_list.slice(0, 3).map((p, idx) => (
                  <div key={p.id || idx} className="lite-sum-item" style={{ padding: '0.65rem 1rem', borderRadius: '12px' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>{p.name}</span>
                    <span style={{ fontWeight: 900, fontFamily: 'monospace', color: '#ef4444' }}>{formatNumber(Math.abs(p.balance))}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
