import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getLiteTheme } from '../../lib/liteTheme';
import { useLiteThemeSync } from '../../hooks/useLiteThemeSync';
import {
  Search,
  Eye,
  Calendar,
  X,
  FileText,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Printer,
  History as HistoryIcon,
  Wheat,
  Sprout,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';
import { cn, playPopSound, playSuccessSound } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import PrintTemplate from '../../components/PrintTemplate';
import { DEFAULT_SETTINGS } from '../../lib/settings';
import { useQueryClient } from '@tanstack/react-query';

export default function HistoryLite() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Sale'); // 'Sale' or 'Purchase'
  
  // Date filter states
  const [filterType, setFilterType] = useState('today'); // 'today', 'yesterday', '7days', 'month', 'custom'
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 15;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

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

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`/api/print-templates?module=${activeTab}`);
      if (res.data && res.data.length > 0) {
        const defaultTemplate = res.data.find(t => t.is_default) || res.data[0];
        if (defaultTemplate) {
          try {
            setSettings(prev => ({ ...prev, ...JSON.parse(defaultTemplate.config) }));
          } catch (e) { console.error(e); }
        }
      }
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        type: activeTab,
        page,
        limit,
      };

      if (dateRange.start) {
        params.start_date = `${dateRange.start}T00:00:00`;
      }
      if (dateRange.end) {
        params.end_date = `${dateRange.end}T23:59:59`;
      }
      if (searchQuery) {
        params.search_partner = searchQuery;
      }

      const res = await axios.get('/api/orders', { params });
      if (res.data.items) {
        setOrders(res.data.items);
        setTotalPages(res.data.pages);
        setTotalItems(res.data.total);
      } else {
        setOrders(res.data || []);
        setTotalPages(1);
        setTotalItems(res.data?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
      showToast("LỖI KHI TẢI DANH SÁCH ĐƠN HÀNG!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, activeTab, dateRange.start, dateRange.end, searchQuery]);

  useEffect(() => {
    fetchSettings();
  }, [activeTab]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id) => {
    setConfirm({
      title: "Xác nhận xóa giao dịch",
      message: "Bạn có chắc chắn muốn XÓA đơn hàng này? Thao tác này sẽ tự động thu hồi/phục hồi lại số lượng tồn kho sản phẩm và trừ công nợ đối tác.",
      type: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/orders/${id}`);
          showToast("ĐÃ XÓA GIAO DỊCH THÀNH CÔNG!");
          if (selectedOrder?.id === id) {
            setSelectedOrder(null);
          }
          fetchOrders();
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['partners'] });
        } catch (err) {
          showToast(err.response?.data?.error || "Lỗi khi xóa đơn hàng", "error");
        }
      }
    });
  };

  const handleReloadOrder = (order) => {
    if (order.type === 'Sale') {
      const cartData = order.details.map(d => ({
        id: Math.random().toString(36).substr(2, 9),
        product_id: d.product_id,
        name: d.product_name,
        price: d.price,
        quantity: d.quantity,
        unit: d.product_unit || d.unit || "",
        stock: d.product_stock || d.stock || 0
      }));
      localStorage.setItem('pos_lite_cart', JSON.stringify(cartData));
      
      const partner = order.partner_id ? { id: order.partner_id, name: order.partner_name, phone: order.partner_phone, address: order.partner_address } : null;
      localStorage.setItem('pos_lite_partner', JSON.stringify(partner));
      localStorage.setItem('pos_lite_payment_method', order.payment_method || "Cash");
      localStorage.setItem('pos_lite_note', order.note || "");
      
      navigate("/pos");
      showToast("ĐÃ NẠP ĐƠN HÀNG LÊN MÀN HÌNH BÁN HÀNG LITE!");
    } else {
      const cartData = order.details.map(d => ({
        id: Math.random().toString(36).substr(2, 9),
        product_id: d.product_id,
        name: d.product_name,
        price: d.price,
        quantity: d.quantity,
        unit: d.product_unit || d.unit || "",
        stock: d.product_stock || d.stock || 0
      }));
      localStorage.setItem('purchase_lite_cart', JSON.stringify(cartData));
      
      const partner = order.partner_id ? { id: order.partner_id, name: order.partner_name, phone: order.partner_phone, address: order.partner_address } : null;
      localStorage.setItem('purchase_lite_partner', JSON.stringify(partner));
      localStorage.setItem('purchase_lite_payment_method', order.payment_method || "Cash");
      localStorage.setItem('purchase_lite_note', order.note || "");
      
      navigate("/purchase");
      showToast("ĐÃ NẠP ĐƠN HÀNG LÊN MÀN HÌNH NHẬP HÀNG LITE!");
    }
  };

  const handlePrint = (order) => {
    axios.get(`/api/orders/${order.id}`)
      .then(res => {
        setSelectedOrder(res.data);
        setTimeout(() => {
          window.print();
        }, 300);
      })
      .catch(err => {
        console.error("Print reload failed", err);
        showToast("Không thể tải thông tin in ấn", "error");
      });
  };

  return (
    <div className="lite-his-container">
      <style>{`
        .lite-his-container {
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

        .lite-his-header {
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

        .lite-his-title {
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

        .lite-his-segment {
          display: flex;
          padding: 3px;
          background-color: ${theme.inputBg};
          border: 1px solid ${theme.border};
          border-radius: 12px;
        }

        .lite-his-segment-btn {
          padding: 0.55rem 1.4rem;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          border-radius: 9px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .lite-his-body {
          display: flex;
          flex: 1;
          height: calc(100vh - 75px);
          overflow: hidden;
        }

        .lite-his-left {
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

        .lite-his-filter-bar {
          padding: 1.25rem;
          border-bottom: 1px solid ${theme.border};
          display: flex;
          gap: 1rem;
          flex-direction: column;
          background-color: ${theme.surface};
        }

        .lite-his-capsules {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .lite-his-capsule-btn {
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

        .lite-his-capsule-btn:hover {
          border-color: ${theme.accent}70;
        }

        .lite-his-capsule-btn.active {
          background-color: ${theme.accent};
          color: ${theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg} !important;
          border-color: ${theme.accent};
        }

        .lite-his-custom-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lite-his-label {
          font-size: 0.65rem;
          font-weight: 900;
          opacity: 0.45;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.25rem;
          display: block;
        }

        .lite-his-input {
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

        .lite-his-input:focus {
          border-color: ${theme.accent};
        }

        .lite-his-order-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .lite-his-order-card {
          padding: 1.1rem;
          border-radius: 16px;
          border: 1px solid ${theme.border};
          background-color: ${theme.surface};
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.01);
        }

        .lite-his-order-card:hover {
          border-color: ${theme.accent}60;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.03);
        }

        .lite-his-order-card.active {
          background-color: ${theme.accent} !important;
          border-color: ${theme.accent} !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.08);
        }

        .lite-his-order-card.active * {
          color: ${theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg} !important;
        }

        .lite-his-order-card.active .opacity-muted {
          opacity: 0.7 !important;
        }

        .lite-his-pagination {
          padding: 0.9rem 1.25rem;
          border-top: 1px solid ${theme.border};
          background-color: ${theme.surface};
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.01);
        }

        .lite-his-pagination-btn {
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

        .lite-his-pagination-btn:hover:not(:disabled) {
          border-color: ${theme.accent};
          background-color: ${theme.surface};
        }

        .lite-his-pagination-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .lite-his-right {
          flex: 1;
          background-color: ${theme.bg};
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .lite-his-details-container {
          flex: 1;
          overflow-y: auto;
          padding: 2.5rem;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background-color: ${theme.bg};
        }

        .lite-detail-card {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 20px;
          padding: 2.5rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .lite-detail-header {
          border-bottom: 1px solid ${theme.border};
          padding-bottom: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .lite-detail-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: ${theme.accent};
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .lite-detail-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          font-size: 0.8rem;
        }

        .lite-detail-meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .lite-detail-meta-label {
          font-weight: 800;
          opacity: 0.5;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.05em;
        }

        .lite-detail-meta-value {
          font-weight: 900;
          color: ${theme.text};
        }

        .lite-detail-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }

        .lite-detail-table th {
          text-align: left;
          padding: 0.75rem 0;
          font-size: 0.7rem;
          font-weight: 900;
          color: ${theme.text};
          opacity: 0.5;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid ${theme.border};
        }

        .lite-detail-table td {
          padding: 1rem 0;
          border-bottom: 1px solid ${theme.border};
          vertical-align: middle;
        }

        .lite-detail-product-name {
          font-weight: 800;
          font-size: 0.85rem;
          color: ${theme.text};
        }

        .lite-detail-product-price {
          font-size: 0.7rem;
          font-weight: 800;
          opacity: 0.6;
          margin-top: 0.2rem;
        }

        .lite-detail-summary {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: flex-end;
          padding-top: 1rem;
        }

        .lite-detail-summary-row {
          display: flex;
          justify-content: space-between;
          width: 250px;
          font-size: 0.85rem;
          font-weight: 800;
          color: ${theme.text};
          opacity: 0.8;
        }

        .lite-detail-summary-total {
          display: flex;
          justify-content: space-between;
          width: 250px;
          font-size: 1.25rem;
          font-weight: 950;
          color: ${theme.accent};
          padding-top: 0.75rem;
          border-top: 1px solid ${theme.border};
          margin-top: 0.25rem;
        }

        .lite-his-details-footer {
          padding: 1.25rem 2.5rem;
          background-color: ${theme.surface};
          border-top: 1px solid ${theme.border};
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          z-index: 10;
        }

        .lite-his-btn-action {
          padding: 0.65rem 1.2rem;
          border-radius: 10px;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.75rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }

        .lite-his-btn-edit {
          background-color: ${theme.accent};
          color: ${theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg} !important;
        }
        
        .lite-his-btn-edit:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .lite-his-btn-delete {
          background-color: rgba(239, 68, 68, 0.08);
          color: #ef4444 !important;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .lite-his-btn-delete:hover {
          background-color: #ef4444;
          color: #ffffff !important;
          transform: translateY(-1px);
        }

        .lite-his-btn-print {
          background-color: ${theme.inputBg};
          color: ${theme.text};
          border: 1px solid ${theme.border};
        }

        .lite-his-btn-print:hover {
          border-color: ${theme.accent};
          background-color: ${theme.surface};
        }

        .opacity-muted {
          opacity: 0.55;
        }
      `}</style>

      {/* Top Header */}
      <header className="lite-his-header">
        <h1 className="lite-his-title">
          <HistoryIcon size={22} />
          Nhật ký giao dịch
        </h1>

        <div className="lite-his-segment">
          <button 
            className="lite-his-segment-btn"
            style={{
              backgroundColor: activeTab === 'Sale' ? theme.accent : 'transparent',
              color: activeTab === 'Sale' ? (theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg) : theme.text
            }}
            onClick={() => { setActiveTab('Sale'); setPage(1); setSelectedOrder(null); }}
          >
            <Wheat size={14} /> Bán Hàng
          </button>
          <button 
            className="lite-his-segment-btn"
            style={{
              backgroundColor: activeTab === 'Purchase' ? theme.accent : 'transparent',
              color: activeTab === 'Purchase' ? (theme.bg === "#faf8f3" || theme.bg === "#e2eed5" ? "#ffffff" : theme.bg) : theme.text
            }}
            onClick={() => { setActiveTab('Purchase'); setPage(1); setSelectedOrder(null); }}
          >
            <Sprout size={14} /> Nhập Hàng
          </button>
        </div>
      </header>

      {/* Main split-screen container */}
      <div className="lite-his-body">
        {/* Left order lists & filters */}
        <section className="lite-his-left">
          <div className="lite-his-filter-bar">
            {/* Quick date capsules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="lite-his-label">Thời gian giao dịch</span>
              <div className="lite-his-capsules">
                <button 
                  className={cn("lite-his-capsule-btn", filterType === 'today' && "active")}
                  onClick={() => setFilterType('today')}
                >
                  Hôm nay
                </button>
                <button 
                  className={cn("lite-his-capsule-btn", filterType === 'yesterday' && "active")}
                  onClick={() => setFilterType('yesterday')}
                >
                  Hôm qua
                </button>
                <button 
                  className={cn("lite-his-capsule-btn", filterType === '7days' && "active")}
                  onClick={() => setFilterType('7days')}
                >
                  7 ngày qua
                </button>
                <button 
                  className={cn("lite-his-capsule-btn", filterType === 'month' && "active")}
                  onClick={() => setFilterType('month')}
                >
                  Tháng này
                </button>
                <button 
                  className={cn("lite-his-capsule-btn", filterType === 'custom' && "active")}
                  onClick={() => setFilterType('custom')}
                >
                  Tự chọn
                </button>
              </div>
            </div>

            {/* Custom Date Picker Inputs */}
            {filterType === 'custom' && (
              <div className="lite-his-custom-dates">
                <div>
                  <label className="lite-his-label">Từ ngày</label>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, start: e.target.value }));
                      setPage(1);
                    }}
                    className="lite-his-input"
                  />
                </div>
                <div>
                  <label className="lite-his-label">Đến ngày</label>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, end: e.target.value }));
                      setPage(1);
                    }}
                    className="lite-his-input"
                  />
                </div>
              </div>
            )}
            
            {/* Search filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label className="lite-his-label">Tìm đối tác & mã đơn</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Nhập tên đối tác hoặc mã đơn..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="lite-his-input"
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

          <div className="lite-his-order-list">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', opacity: 0.5, fontWeight: 900 }}>ĐANG TẢI...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, fontStyle: 'italic' }}>Không tìm thấy giao dịch nào.</div>
            ) : (
              orders.map(order => (
                <div 
                  key={order.id} 
                  className={cn("lite-his-order-card", selectedOrder?.id === order.id && "active")}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 950, fontSize: '0.9rem' }}>
                        #{order.display_id || order.id}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.partner_name || "Khách lẻ"}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                      <div style={{ fontWeight: 950, fontSize: '1rem', color: activeTab === 'Sale' ? theme.accent : "#ef4444" }}>
                        {formatNumber(order.total_amount)}
                      </div>
                      <div className="opacity-muted" style={{ fontSize: '0.62rem', fontWeight: 900, marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {order.payment_method === 'Cash' ? 'TIỀN MẶT' : 'GHI NỢ'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '0.7rem', fontWeight: 800 }} className="opacity-muted">
                    <span>🕒 {formatDate(order.date)}</span>
                    <span>👤 {order.created_by || "Hệ thống"}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Left Pagination */}
          <div className="lite-his-pagination">
            <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Trang {page} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="lite-his-pagination-btn"
              >
                Trước
              </button>
              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="lite-his-pagination-btn"
              >
                Sau
              </button>
            </div>
          </div>
        </section>

        {/* Right Detail Inspection (Styled as thermal print sheet) */}
        <section className="lite-his-right">
          {selectedOrder ? (
            <>
              <div className="lite-his-details-container">
                <div className="lite-detail-card">
                  <div className="lite-detail-header">
                    <div className="lite-detail-title">
                      {selectedOrder.type === 'Sale' ? 'HÓA ĐƠN BÁN HÀNG' : 'HÓA ĐƠN NHẬP HÀNG'}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 800 }}>
                      #{selectedOrder.display_id || selectedOrder.id}
                    </div>
                  </div>

                  <div className="lite-detail-meta">
                    <div className="lite-detail-meta-item">
                      <span className="lite-detail-meta-label">Thời gian</span>
                      <span className="lite-detail-meta-value">{formatDate(selectedOrder.date)}</span>
                    </div>
                    <div className="lite-detail-meta-item">
                      <span className="lite-detail-meta-label">Nhân viên</span>
                      <span className="lite-detail-meta-value">{selectedOrder.created_by || "Hệ thống"}</span>
                    </div>
                    <div className="lite-detail-meta-item">
                      <span className="lite-detail-meta-label">Đối tác</span>
                      <span className="lite-detail-meta-value">{selectedOrder.partner_name || "Khách lẻ"}</span>
                    </div>
                    <div className="lite-detail-meta-item">
                      <span className="lite-detail-meta-label">Thanh toán</span>
                      <span className="lite-detail-meta-value">
                        {selectedOrder.payment_method === 'Cash' ? "TIỀN MẶT" : "GHI NỢ"}
                      </span>
                    </div>
                    {selectedOrder.partner_phone && (
                      <div className="lite-detail-meta-item">
                        <span className="lite-detail-meta-label">Điện thoại</span>
                        <span className="lite-detail-meta-value">{selectedOrder.partner_phone}</span>
                      </div>
                    )}
                  </div>

                  <table className="lite-detail-table" style={{ marginTop: '1.5rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>Sản phẩm</th>
                        <th style={{ width: '20%', textAlign: 'center' }}>SL</th>
                        <th style={{ width: '30%', textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.details?.map((detail, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="lite-detail-product-name">{detail.product_name}</div>
                            <div className="lite-detail-product-price">
                              {formatNumber(detail.price)} {detail.unit ? ` / ${detail.unit}` : ''}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 900 }}>
                            {detail.quantity}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 900 }}>
                            {formatNumber(detail.price * detail.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="lite-detail-summary">
                    <div className="lite-detail-summary-row">
                      <span>Tổng tiền hàng:</span>
                      <span>{formatNumber(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="lite-detail-summary-row">
                      <span>Đã thanh toán:</span>
                      <span>{formatNumber(selectedOrder.amount_paid || 0)}</span>
                    </div>
                    {selectedOrder.total_amount - (selectedOrder.amount_paid || 0) > 0 && (
                      <div className="lite-detail-summary-row" style={{ color: '#ef4444', opacity: 1 }}>
                        <span>Còn nợ:</span>
                        <span>
                          {formatNumber(selectedOrder.total_amount - (selectedOrder.amount_paid || 0))}
                        </span>
                      </div>
                    )}
                    <div className="lite-detail-summary-total">
                      <span>TỔNG CỘNG:</span>
                      <span>{formatNumber(selectedOrder.total_amount)}</span>
                    </div>
                  </div>

                  {selectedOrder.note && (
                    <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: `${theme.inputBg}`, borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, opacity: 0.8 }}>
                      Ghi chú: {selectedOrder.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="lite-his-details-footer">
                <button 
                  onClick={() => handleDelete(selectedOrder.id)}
                  className="lite-his-btn-action lite-his-btn-delete"
                >
                  <Trash2 size={15} /> Xóa đơn hàng
                </button>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    onClick={() => handlePrint(selectedOrder)}
                    className="lite-his-btn-action lite-his-btn-print"
                  >
                    <Printer size={15} /> In hóa đơn
                  </button>
                  <button 
                    onClick={() => handleReloadOrder(selectedOrder)}
                    className="lite-his-btn-action lite-his-btn-edit"
                  >
                    <Edit size={15} /> Nạp & sửa đơn
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.35 }}>
              <Eye size={44} style={{ color: theme.accent }} />
              <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.78rem', marginTop: '1.2rem', letterSpacing: '0.08em' }}>
                Chọn một giao dịch để xem hóa đơn chi tiết
              </div>
            </div>
          )}
        </section>
      </div>

      {confirm && (
        <ConfirmModal
          isOpen={!!confirm}
          title={confirm.title}
          message={confirm.message}
          type={confirm.type}
          onConfirm={() => {
            confirm.onConfirm();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Hidden print templates */}
      {selectedOrder && (
        <div className="only-print">
          <PrintTemplate 
            data={selectedOrder} 
            settings={settings}
            type={activeTab}
            showOldDebt={false}
            showPayment={true}
            showRemaining={true}
            showCashGiven={true}
            showChange={true}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "no-print fixed top-4 left-1/2 -translate-x-1/2 px-10 py-5 border-4 font-black z-50 text-2xl shadow-2xl",
          toast.type === "error" ? "bg-red-900 border-red-500 text-white" : "bg-green-900 border-green-500 text-white"
        )}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
