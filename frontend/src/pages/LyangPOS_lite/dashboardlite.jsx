import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { getLiteTheme } from '../../lib/liteTheme';
import { useLiteThemeSync } from '../../hooks/useLiteThemeSync';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Truck,
  History as HistoryIcon,
  Clock,
  Calendar,
  Users,
  AlertTriangle,
  ArrowRight,
  Zap,
  BookOpen
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, cn } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardLite() {
  const navigate = useNavigate();
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
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { bgColor } = useLiteThemeSync();
  const theme = useMemo(() => getLiteTheme(bgColor), [bgColor]);

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

      const statsRes = await axios.get(`/api/dashboard-stats?year=${year}&month=${month}&day=${day}`);
      setStats(statsRes.data);

      const purchasesRes = await axios.get(`/api/orders?type=Purchase&year=${year}&month=${month}&day=${day}&limit=50&page=1`);
      const purchasesItems = purchasesRes.data.items || purchasesRes.data || [];
      const purchasesSum = purchasesItems.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setTodayPurchases(purchasesSum);

      const ordersRes = await axios.get(`/api/orders?limit=6&page=1`);
      setRecentOrders(ordersRes.data.items || ordersRes.data || []);

      const productsRes = await axios.get('/api/products?filterType=warning&limit=6&page=1');
      setLowStockProducts(productsRes.data.items || productsRes.data || []);

      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const chartRes = await axios.get(`/api/reports/sales-chart?start_date=${startStr}&end_date=${endStr}`);
      setChartData(chartRes.data || []);

    } catch (error) {
      console.error("Failed to fetch dashboard lite stats", error);
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
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 5) return { text: "Chúc ngủ ngon", desc: "Nghỉ ngơi chuẩn bị cho ngày mới bứt phá" };
    if (hour < 11) return { text: "Chào buổi sáng", desc: "Khởi đầu ngày mới tràn đầy năng lượng gặt hái" };
    if (hour < 14) return { text: "Chào buổi trưa", desc: "Nạp năng lượng duy trì hiệu quả công việc" };
    if (hour < 18) return { text: "Chào buổi chiều", desc: "Hoàn thành xuất sắc các mục tiêu vụ mùa" };
    return { text: "Chào buổi tối", desc: "Tổng kết kết quả ngày kinh doanh tốt lành" };
  };

  const greeting = getGreeting();

  const svgChart = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const width = 600;
    const height = 180;
    const padding = { top: 20, right: 15, bottom: 25, left: 15 };
    
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
  }, [chartData]);

  return (
    <div className="lite-bento-container">
      <style>{`
        .lite-bento-container {
          background-color: ${theme.bg};
          color: ${theme.text};
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Be Vietnam Pro', sans-serif !important;
          font-size: 15px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Bento Grid System */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: minmax(140px, auto);
          gap: 1.25rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Bento Cells */
        .bento-cell {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 28px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }

        .bento-cell:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.06);
          border-color: ${theme.accent}50;
        }

        /* Specific Cell Sizes */
        .cell-hero { grid-column: span 8; grid-row: span 2; padding: 2.5rem; background: linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}cc 100%); color: ${theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg}; border: none; box-shadow: 0 20px 40px ${theme.accent}30; }
        .cell-kpi { grid-column: span 4; grid-row: span 1; }
        .cell-chart { grid-column: span 8; grid-row: span 2; }
        .cell-actions { grid-column: span 4; grid-row: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: transparent; border: none; padding: 0; overflow: visible; }
        .cell-action-btn { border: 1px solid ${theme.border}; border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; color: ${theme.text}; text-decoration: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; position: relative; overflow: hidden; }
        .cell-action-btn:hover { transform: translateY(-5px) scale(1.02); }
        
        .action-pos { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.25)); color: #065f46; border-color: rgba(16,185,129,0.3); }
        .action-pos:hover { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 10px 25px rgba(16,185,129,0.3); border-color: #10b981; }

        .action-purchase { background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.25)); color: #92400e; border-color: rgba(245,158,11,0.3); }
        .action-purchase:hover { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; box-shadow: 0 10px 25px rgba(245,158,11,0.3); border-color: #f59e0b; }

        .action-ledger { background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.25)); color: #1e40af; border-color: rgba(59,130,246,0.3); }
        .action-ledger:hover { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; box-shadow: 0 10px 25px rgba(59,130,246,0.3); border-color: #3b82f6; }

        .action-summary { background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.25)); color: #5b21b6; border-color: rgba(139,92,246,0.3); }
        .action-summary:hover { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; box-shadow: 0 10px 25px rgba(139,92,246,0.3); border-color: #8b5cf6; }
        .cell-list-orders { grid-column: span 6; grid-row: span 3; }
        .cell-list-warnings { grid-column: span 6; grid-row: span 3; }

        @media (max-width: 1024px) {
          .cell-hero { grid-column: span 12; }
          .cell-kpi { grid-column: span 6; }
          .cell-chart { grid-column: span 12; }
          .cell-actions { grid-column: span 12; grid-row: span 1; grid-template-columns: repeat(4, 1fr); }
          .cell-list-orders, .cell-list-warnings { grid-column: span 12; }
        }
        @media (max-width: 640px) {
          .cell-actions { grid-template-columns: repeat(2, 1fr); grid-row: span 2; }
          .cell-kpi { grid-column: span 12; }
        }

        /* Typography & Internal Elements */
        .bento-title { font-size: 0.8rem; font-weight: 900; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .bento-value { font-size: 2.2rem; font-weight: 950; letter-spacing: -0.04em; line-height: 1; margin-top: auto; }
        .bento-sub { font-size: 0.7rem; font-weight: 800; opacity: 0.5; margin-top: 0.5rem; }

        /* Hero Specific */
        .hero-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .hero-greeting { font-size: 2.5rem; font-weight: 950; letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 0.5rem; }
        .hero-desc { font-size: 0.9rem; font-weight: 800; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em; }
        .hero-clock { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 0.6rem 1.2rem; border-radius: 99px; font-weight: 900; font-family: monospace; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.3); }
        .hero-stats { display: flex; gap: 3rem; margin-top: auto; }
        .hero-stat-block { display: flex; flex-direction: column; }
        .hero-stat-label { font-size: 0.75rem; font-weight: 900; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4rem; }
        .hero-stat-value { font-size: 3rem; font-weight: 950; letter-spacing: -0.05em; line-height: 1; text-shadow: 0 4px 15px rgba(0,0,0,0.1); }

        /* Chart Specific */
        .lite-chart-svg { width: 100%; height: 100%; overflow: visible; flex: 1; min-height: 150px; }
        .lite-chart-line { fill: none; stroke: ${theme.accent}; stroke-width: 4; stroke-linecap: round; filter: drop-shadow(0 4px 6px ${theme.accent}30); }
        .lite-chart-area { fill: url(#chart-gradient); opacity: 0.2; }
        .lite-chart-dot { fill: ${theme.surface}; stroke: ${theme.accent}; stroke-width: 3; cursor: pointer; transition: all 0.2s; }
        .lite-chart-dot:hover { r: 8; stroke-width: 4; fill: ${theme.accent}; }

        /* List Styling */
        .bento-list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${theme.border}; transition: background 0.2s; }
        .bento-list-item:last-child { border-bottom: none; padding-bottom: 0; }
        .bento-list-title { font-weight: 900; font-size: 0.95rem; margin-bottom: 0.2rem; }
        .bento-list-sub { font-size: 0.75rem; font-weight: 800; opacity: 0.5; }
        .bento-list-right { text-align: right; }
        .bento-list-value { font-weight: 950; font-size: 1.1rem; }
        .bento-badge { font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.5rem; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-top: 0.3rem; }
        
        .badge-sale { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .badge-purchase { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      `}</style>

      <div className="bento-grid">
        
        {/* HERO SECTION */}
        <div className="bento-cell cell-hero">
          <div className="hero-header">
            <div>
              <div className="hero-greeting">{greeting.text}</div>
              <div className="hero-desc">{greeting.desc}</div>
            </div>
            <div className="hero-clock">
              <Clock size={16} />
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-block">
              <div className="hero-stat-label">Lợi Nhuận Hôm Nay</div>
              <div className="hero-stat-value">{formatNumber(stats.profit)}</div>
            </div>
          </div>
          {/* Decorative bg-transparent elements */}
          <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '15%', top: '-10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none' }} />
        </div>

        {/* KPI: REVENUE */}
        <div className="bento-cell cell-kpi">
          <div className="bento-title"><ShoppingCart size={16}/> Doanh Thu</div>
          <div className="bento-value" style={{ color: theme.accent }}>{formatNumber(stats.revenue)}</div>
          <div className="bento-sub">Tiền mặt: {formatNumber(stats.cash_revenue || 0)}</div>
        </div>

        {/* KPI: PURCHASES */}
        <div className="bento-cell cell-kpi">
          <div className="bento-title" style={{ color: '#ef4444' }}><Truck size={16}/> Chi Phí Nhập</div>
          <div className="bento-value" style={{ color: '#ef4444' }}>{formatNumber(todayPurchases)}</div>
          <div className="bento-sub">Dư nợ NCC: {formatNumber(stats.supplier_debt || 0)}</div>
        </div>

        {/* CHART SECTION */}
        <div className="bento-cell cell-chart">
          <div className="bento-title" style={{ marginBottom: '1rem' }}><TrendingUp size={16}/> Doanh Thu 7 Ngày Qua</div>
          <div style={{ flex: 1, position: 'relative' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, fontWeight: 900 }}>ĐANG TẢI...</div>
            ) : !svgChart || svgChart.points.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, fontStyle: 'italic', fontWeight: 800 }}>Chưa có dữ liệu giao dịch.</div>
            ) : (
              <svg viewBox={`0 0 ${svgChart.width} ${svgChart.height}`} className="lite-chart-svg">
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.accent} />
                    <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Grid */}
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = svgChart.padding.top + ratio * (svgChart.height - svgChart.padding.top - svgChart.padding.bottom);
                  return (
                    <line key={idx} x1={svgChart.padding.left} y1={y} x2={svgChart.width - svgChart.padding.right} y2={y} stroke={theme.border} strokeWidth="1" strokeDasharray="4 4" />
                  );
                })}

                <path d={svgChart.areaPath} className="lite-chart-area" />
                <path d={svgChart.linePath} className="lite-chart-line" />

                {svgChart.points.map((pt, idx) => (
                  <text key={idx} x={pt.x} y={svgChart.height - 5} textAnchor="middle" fontSize="10" fontWeight="900" fill={theme.text} style={{ opacity: 0.4 }}>
                    {pt.data.date.split('-').slice(1).reverse().join('/')}
                  </text>
                ))}

                {svgChart.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    className="lite-chart-dot"
                    onMouseEnter={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      const wrapperRect = e.target.closest('svg').getBoundingClientRect();
                      setHoveredPoint({ value: pt.data.revenue, date: pt.data.date, x: rect.left - wrapperRect.left, y: rect.top - wrapperRect.top });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>
            )}
            
            {/* Tooltip */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute', left: hoveredPoint.x, top: hoveredPoint.y - 45,
                background: theme.text, color: theme.bg, padding: '6px 12px',
                borderRadius: '8px', fontWeight: 900, fontSize: '0.75rem',
                pointerEvents: 'none', transform: 'translateX(-50%)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                {formatCurrency(hoveredPoint.value)}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS GRID */}
        <div className="bento-cell cell-actions">
          <Link to="/pos" className="cell-action-btn action-pos">
            <Zap size={28} />
            Bán Hàng
          </Link>
          <Link to="/purchase" className="cell-action-btn action-purchase">
            <Truck size={28} />
            Nhập Hàng
          </Link>
          <Link to="/ledger" className="cell-action-btn action-ledger">
            <BookOpen size={28} />
            Sổ Giao Dịch
          </Link>
          <Link to="/summary" className="cell-action-btn action-summary">
            <TrendingUp size={28} />
            Báo Cáo
          </Link>
        </div>

        {/* RECENT ORDERS LIST */}
        <div className="bento-cell cell-list-orders">
          <div className="bento-title" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><HistoryIcon size={16}/> Giao dịch gần đây</span>
            <Link to="/ledger" style={{ opacity: 0.6, color: theme.text, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Tất cả <ArrowRight size={12}/>
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? <div style={{ opacity: 0.5, fontWeight: 900, textAlign: 'center', padding: '2rem' }}>ĐANG TẢI...</div> : 
             recentOrders.length === 0 ? <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>Chưa có giao dịch.</div> :
             recentOrders.map(order => (
               <div key={order.id} className="bento-list-item">
                 <div>
                   <div className="bento-list-title">{order.partner_name || "Khách lẻ"}</div>
                   <div className="bento-list-sub">#{order.display_id || order.id} • {order.created_by || "Hệ thống"}</div>
                 </div>
                 <div className="bento-list-right">
                   <div className="bento-list-value" style={{ color: order.type === 'Sale' ? theme.accent : "#ef4444" }}>
                     {order.type === 'Sale' ? "+" : "-"}{formatNumber(order.total_amount)}
                   </div>
                   <div className={`bento-badge ${order.type === 'Sale' ? 'badge-sale' : 'badge-purchase'}`}>
                     {order.type === 'Sale' ? "BÁN" : "NHẬP"}
                   </div>
                 </div>
               </div>
             ))
            }
          </div>
        </div>

        {/* LOW STOCK WARNINGS */}
        <div className="bento-cell cell-list-warnings">
          <div className="bento-title" style={{ color: '#f59e0b', marginBottom: '1.5rem' }}>
            <AlertTriangle size={16}/> Cảnh báo sắp hết hàng
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? <div style={{ opacity: 0.5, fontWeight: 900, textAlign: 'center', padding: '2rem' }}>ĐANG TẢI...</div> : 
             lowStockProducts.length === 0 ? <div style={{ opacity: 0.5, fontWeight: 900, textAlign: 'center', padding: '2rem', color: '#10b981' }}>Kho hàng an toàn.</div> :
             lowStockProducts.map(product => (
               <div key={product.id} className="bento-list-item">
                 <div>
                   <div className="bento-list-title">{product.name}</div>
                   <div className="bento-list-sub">Mã: {product.sku}</div>
                 </div>
                 <div className="bento-list-right">
                   <div className="bento-list-value" style={{ color: product.stock <= 0 ? "#ef4444" : "#f59e0b" }}>
                     {product.stock} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{product.unit}</span>
                   </div>
                   <div className="bento-list-sub" style={{ marginTop: '0.2rem' }}>Cần nhập thêm</div>
                 </div>
               </div>
             ))
            }
          </div>
        </div>

      </div>
    </div>
  );
}
