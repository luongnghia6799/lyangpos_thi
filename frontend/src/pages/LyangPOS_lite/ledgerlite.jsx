import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getLiteTheme } from '../../lib/liteTheme';
import { useLiteThemeSync } from '../../hooks/useLiteThemeSync';
import {
  Search,
  Calendar,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { formatNumber, formatDate, cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function LedgerLite() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date filter states
  const [viewMode, setViewMode] = useState('transactions'); // 'transactions', 'movements'
  const [filterType, setFilterType] = useState('today'); // 'today', 'yesterday', '7days', 'month', 'custom'
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

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
      setPage(1);
    }
  }, [filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'transactions') {
        const orderParams = { 
          start_date: `${dateRange.start}T00:00:00`, 
          end_date: `${dateRange.end}T23:59:59`,
          search_partner: searchQuery,
          search_id: searchQuery
        };
        
        const voucherParams = { 
          start_date: `${dateRange.start}T00:00:00`, 
          end_date: `${dateRange.end}T23:59:59`,
          search_partner: searchQuery, 
          search_id: searchQuery 
        };

        const [resOrders, resVouchers] = await Promise.all([
          axios.get('/api/orders', { params: orderParams }),
          axios.get('/api/cash-vouchers', { params: voucherParams })
        ]);

        const ordersData = Array.isArray(resOrders.data) ? resOrders.data : (resOrders.data.items || []);
        const vouchersData = Array.isArray(resVouchers.data) ? resVouchers.data : (resVouchers.data.items || []);

        const combined = [
          ...ordersData.map(o => ({ ...o, isVoucher: false })),
          ...vouchersData.map(v => ({
            ...v,
            isVoucher: true,
            display_id: v.type === 'Receipt' ? `PT-${v.id}` : `PC-${v.id}`,
            total_amount: v.amount,
            partner_name: v.partner_name || 'Hệ thống'
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const filtered = searchQuery
          ? combined.filter(t => 
              (t.partner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
              (t.display_id || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
          : combined;

        setTransactions(filtered);
      } else {
        // Fetch product movements
        const movementParams = {
          start_date: dateRange.start,
          end_date: dateRange.end
        };
        const res = await axios.get('/api/reports/product-movement', { params: movementParams });
        let movementsData = Array.isArray(res.data) ? res.data : [];
        
        if (searchQuery) {
          movementsData = movementsData.filter(m => 
            (m.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.partner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.order_id || '').toString().includes(searchQuery.toLowerCase())
          );
        }
        setTransactions(movementsData);
      }
    } catch (err) {
      console.error("Failed to fetch ledger data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange.start, dateRange.end, searchQuery, viewMode]);

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;
  const pagedTransactions = transactions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="lite-ledger-container">
      <style>{`
        .lite-ledger-container {
          background-color: ${theme.bg};
          color: ${theme.text};
          height: 100vh;
          width: 100%;
          font-family: 'Be Vietnam Pro', sans-serif !important;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-size: 15px;
        }

        .lite-ledger-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 2rem;
          background-color: ${theme.surface};
          border-bottom: 1px solid ${theme.border};
          flex-wrap: wrap;
          gap: 1rem;
          z-index: 10;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }

        .lite-ledger-title {
          font-size: 1.6rem;
          font-weight: 900;
          color: ${theme.accent};
          text-transform: uppercase;
          letter-spacing: -0.03em;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin: 0;
        }

        .lite-ledger-body {
          display: flex;
          flex: 1;
          height: calc(100vh - 75px);
          overflow: hidden;
        }

        .lite-ledger-left {
          width: 40%;
          min-width: 360px;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid ${theme.border};
          background-color: ${theme.subSurface};
          height: 100%;
          overflow: hidden;
        }

        .lite-ledger-filter-bar {
          padding: 1.25rem;
          border-bottom: 1px solid ${theme.border};
          display: flex;
          gap: 1rem;
          flex-direction: column;
          background-color: ${theme.surface};
        }

        .lite-ledger-capsules {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .lite-ledger-capsule-btn {
          padding: 0.35rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 850;
          text-transform: uppercase;
          border-radius: 99px;
          border: 1px solid ${theme.border};
          background-color: ${theme.inputBg};
          color: ${theme.text};
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .lite-ledger-capsule-btn:hover {
          border-color: ${theme.accent}70;
        }

        .lite-ledger-capsule-btn.active {
          background-color: ${theme.accent};
          color: ${theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg} !important;
          border-color: ${theme.accent};
        }

        .lite-ledger-custom-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lite-ledger-label {
          font-size: 0.65rem;
          font-weight: 900;
          opacity: 0.45;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.25rem;
          display: block;
        }

        .lite-ledger-input {
          background-color: ${theme.inputBg};
          border: 1px solid ${theme.border};
          color: ${theme.text};
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          outline: none;
          font-size: 0.8rem;
          font-weight: 800;
          width: 100%;
          transition: border-color 0.2s;
        }

        .lite-ledger-input:focus {
          border-color: ${theme.accent};
        }

        .lite-ledger-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .lite-ledger-card {
          padding: 1.1rem;
          border-radius: 16px;
          border: 1px solid ${theme.border};
          background-color: ${theme.surface};
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.01);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lite-ledger-card:hover {
          border-color: ${theme.accent}60;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.03);
        }

        .lite-ledger-pagination {
          padding: 0.9rem 1.25rem;
          border-top: 1px solid ${theme.border};
          background-color: ${theme.surface};
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.01);
        }

        .lite-ledger-pagination-btn {
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          background-color: ${theme.inputBg};
          color: ${theme.text};
          border: 1px solid ${theme.border};
          cursor: pointer;
          transition: all 0.2s;
        }

        .lite-ledger-pagination-btn:hover:not(:disabled) {
          border-color: ${theme.accent};
          background-color: ${theme.surface};
        }

        .lite-ledger-pagination-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .lite-ledger-right {
          flex: 1;
          background-color: ${theme.bg};
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .lite-ledger-details-container {
          flex: 1;
          overflow-y: auto;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: ${theme.bg};
          opacity: 0.5;
        }
        
        .opacity-muted {
          opacity: 0.55;
        }
      `}</style>

      {/* Top Header */}
      <header className="lite-ledger-header">
        <h1 className="lite-ledger-title">
          <BookOpen size={22} />
          Sổ Giao Dịch
        </h1>
      </header>

      {/* Main split-screen container */}
      <div className="lite-ledger-body">
        {/* Left lists & filters */}
        <section className="lite-ledger-left" style={{ width: '100%', maxWidth: '100%' }}>
          <div className="lite-ledger-filter-bar">
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                className={cn("lite-ledger-capsule-btn", viewMode === 'transactions' && "active")}
                onClick={() => { setViewMode('transactions'); setPage(1); }}
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem' }}
              >
                Nhật ký giao dịch
              </button>
              <button
                className={cn("lite-ledger-capsule-btn", viewMode === 'movements' && "active")}
                onClick={() => { setViewMode('movements'); setPage(1); }}
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem' }}
              >
                Biến động hàng hóa
              </button>
            </div>

            {/* Quick date capsules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="lite-ledger-label">Thời gian giao dịch</span>
              <div className="lite-ledger-capsules">
                <button 
                  className={cn("lite-ledger-capsule-btn", filterType === 'today' && "active")}
                  onClick={() => setFilterType('today')}
                >
                  Hôm nay
                </button>
                <button 
                  className={cn("lite-ledger-capsule-btn", filterType === 'yesterday' && "active")}
                  onClick={() => setFilterType('yesterday')}
                >
                  Hôm qua
                </button>
                <button 
                  className={cn("lite-ledger-capsule-btn", filterType === '7days' && "active")}
                  onClick={() => setFilterType('7days')}
                >
                  7 ngày qua
                </button>
                <button 
                  className={cn("lite-ledger-capsule-btn", filterType === 'month' && "active")}
                  onClick={() => setFilterType('month')}
                >
                  Tháng này
                </button>
                <button 
                  className={cn("lite-ledger-capsule-btn", filterType === 'custom' && "active")}
                  onClick={() => setFilterType('custom')}
                >
                  Tự chọn
                </button>
              </div>
            </div>

            {/* Custom Date Picker Inputs */}
            {filterType === 'custom' && (
              <div className="lite-ledger-custom-dates">
                <div>
                  <label className="lite-ledger-label">Từ ngày</label>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, start: e.target.value }));
                      setPage(1);
                    }}
                    className="lite-ledger-input"
                  />
                </div>
                <div>
                  <label className="lite-ledger-label">Đến ngày</label>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, end: e.target.value }));
                      setPage(1);
                    }}
                    className="lite-ledger-input"
                  />
                </div>
              </div>
            )}
            
            {/* Search filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label className="lite-ledger-label">
                {viewMode === 'transactions' ? 'Tìm đối tác & mã giao dịch' : 'Tìm sản phẩm, đối tác, mã GD'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder={viewMode === 'transactions' ? "Nhập tên đối tác hoặc mã GD..." : "Nhập tên sản phẩm, đối tác..."}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="lite-ledger-input"
                  style={{ paddingRight: '2.2rem' }}
                />
                {searchQuery ? (
                  <button 
                    onClick={() => { setSearchQuery(''); setPage(1); }}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                )}
              </div>
            </div>
          </div>

          <div className="lite-ledger-list">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', opacity: 0.5, fontWeight: 900 }}>ĐANG TẢI...</div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, fontStyle: 'italic' }}>Không tìm thấy giao dịch nào.</div>
            ) : (
              pagedTransactions.map((item, idx) => {
                if (viewMode === 'transactions') {
                  let badgeClass = "";
                  let badgeText = "";
                  
                  if (item.isVoucher) {
                    badgeText = item.type === 'Receipt' ? 'PHIẾU THU' : 'PHIẾU CHI';
                    badgeClass = item.type === 'Receipt' ? "color: #3b82f6;" : "color: #ef4444;";
                  } else {
                    badgeText = item.type === 'Sale' ? 'BÁN HÀNG' : 'NHẬP HÀNG';
                    badgeClass = item.type === 'Sale' ? "color: #10b981;" : "color: #f59e0b;";
                  }

                  return (
                    <div key={`${item.isVoucher ? 'v' : 'o'}-${item.id}`} className="lite-ledger-card">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 950, fontSize: '0.9rem' }}>
                            #{item.display_id || item.id}
                          </div>
                          <div style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 900, 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: '4px',
                            border: '1px solid currentColor',
                            opacity: 0.8,
                            ...(!item.isVoucher ? (item.type === 'Sale' ? {color: '#10b981'} : {color: '#f59e0b'}) : (item.type === 'Receipt' ? {color: '#3b82f6'} : {color: '#ef4444'}))
                          }}>
                            {badgeText}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', marginTop: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.partner_name || "Khách hàng"}
                        </div>
                        <div style={{ fontSize: '0.68rem', marginTop: '0.2rem', fontWeight: 800 }} className="opacity-muted">
                          <span>🕒 {formatDate(item.date)}</span>
                          {item.note && <span style={{ marginLeft: '0.5rem' }}>• {item.note}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                        <div style={{ 
                          fontWeight: 950, 
                          fontSize: '1rem', 
                          color: (item.isVoucher && item.type === 'Payment') || (!item.isVoucher && item.type === 'Purchase') ? "#ef4444" : "#10b981" 
                        }}>
                          {((item.isVoucher && item.type === 'Payment') || (!item.isVoucher && item.type === 'Purchase') ? '-' : '+')}
                          {formatNumber(item.total_amount)}
                        </div>
                        <div className="opacity-muted" style={{ fontSize: '0.62rem', fontWeight: 900, marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {item.payment_method === 'Debt' ? 'GHI NỢ' : (item.payment_method || 'TIỀN MẶT')}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Movement Item
                  const isSale = item.type === 'Xuất' || item.type === 'Sale';
                  return (
                    <div key={`mov-${idx}-${item.order_id}`} className="lite-ledger-card">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 950, fontSize: '0.85rem', opacity: 0.7 }}>
                            #{item.order_id}
                          </div>
                          <div style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 900, 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: '4px',
                            border: '1px solid currentColor',
                            opacity: 0.8,
                            color: isSale ? '#10b981' : '#f59e0b'
                          }}>
                            {isSale ? 'BÁN / XUẤT' : 'NHẬP KHO'}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 950, marginTop: '0.3rem' }}>
                          {item.product_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', marginTop: '0.1rem', fontWeight: 800 }} className="opacity-muted">
                          {item.partner_name || "Khách lẻ"} • 🕒 {formatDate(item.date)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                        <div style={{ 
                          fontWeight: 950, 
                          fontSize: '1rem', 
                          color: isSale ? "#10b981" : "#f59e0b" 
                        }}>
                          {isSale ? '-' : '+'}{item.quantity}
                        </div>
                        <div className="opacity-muted" style={{ fontSize: '0.62rem', fontWeight: 900, marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Giá: {formatNumber(item.price)}
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>

          <div className="lite-ledger-pagination">
            <button 
              className="lite-ledger-pagination-btn"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>
              TRANG {page} / {totalPages}
            </span>
            <button 
              className="lite-ledger-pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
