import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { m, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User,
  Menu,
  ChevronLeft,
  Check,
  Filter,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
  Layers,
  ShoppingCart,
  FileText,
  Printer
} from 'lucide-react';
import { formatNumber } from '../../lib/utils';
import MobileMenu from '../../components/MobileMenu';
import { cn } from '../../lib/utils';
import { DEFAULT_SETTINGS } from '../../lib/settings';
import PrintTemplate from '../../components/PrintTemplate';

export default function MobileHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Sale, Purchase, Debt
  const [dateRange, setDateRange] = useState('7days'); // today, yesterday, 7days, 30days
  const [printData, setPrintData] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [printOptions] = useState(() => {
    const saved = localStorage.getItem("pos_print_options");
    return saved ? JSON.parse(saved) : {
      showOldDebt: false,
      showPayment: false,
      showRemaining: false,
      showCashGiven: true,
      showChange: true
    };
  });

  useEffect(() => {
    const fetchSettingsAndTemplates = async () => {
      try {
        const [saleTmplRes, settingsRes] = await Promise.all([
          axios.get("/api/print-templates?module=Sale"),
          axios.get("/api/settings")
        ]);
        let combinedSettings = { ...DEFAULT_SETTINGS };
        if (settingsRes.data) combinedSettings = { ...combinedSettings, ...settingsRes.data };
        if (saleTmplRes.data && saleTmplRes.data.length > 0) {
          const defaultTemplate = saleTmplRes.data.find(t => t.is_default) || saleTmplRes.data[0];
          if (defaultTemplate) {
            try {
              const config = JSON.parse(defaultTemplate.config);
              combinedSettings = { ...combinedSettings, ...config };
            } catch (e) {
              console.error(e);
            }
          }
        }
        setSettings(combinedSettings);
      } catch (err) {
        console.error("Failed to load settings in MobileHistory", err);
      }
    };
    fetchSettingsAndTemplates();
  }, []);

  const handlePrint = async () => {
    if (!selectedOrder) return;
    try {
      const res = await axios.get(`/api/orders/${selectedOrder.id}`);
      setPrintData(res.data);
      setTimeout(() => {
        setTimeout(() => window.print(), 500);
        setTimeout(() => setPrintData(null), 1000);
      }, 150);
    } catch (err) {
      console.error("Failed to print transaction", err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // We will pull the list of orders.
      // We will fetch up to 150 items.
      const res = await axios.get('/api/orders?limit=150&page=1');
      setOrders(res.data.items || res.data || []);
    } catch (err) {
      console.error("Failed to fetch transaction history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredOrders = useMemo(() => {
    let res = [...orders];

    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      res = res.filter(o => 
        (o.partner_name || '').toLowerCase().includes(s) ||
        (o.display_id || '').toLowerCase().includes(s) ||
        (o.id || '').toString().includes(s)
      );
    }

    // Type filter
    if (filterType === 'Sale') {
      res = res.filter(o => o.type === 'Sale');
    } else if (filterType === 'Purchase') {
      res = res.filter(o => o.type === 'Purchase');
    } else if (filterType === 'Debt') {
      res = res.filter(o => o.payment_method === 'Debt');
    }

    // Date filter
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    res = res.filter(o => {
      const oDateStr = (o.date || '').split('T')[0] || o.date;
      if (!oDateStr) return true;
      const oDateObj = new Date(oDateStr);

      if (dateRange === 'today') {
        return oDateStr === todayStr;
      } else if (dateRange === 'yesterday') {
        return oDateStr === yesterdayStr;
      } else if (dateRange === '7days') {
        return oDateObj >= sevenDaysAgo;
      } else if (dateRange === '30days') {
        return oDateObj >= thirtyDaysAgo;
      }
      return true;
    });

    return res;
  }, [orders, searchTerm, filterType, dateRange]);

  const [displayLimit, setDisplayLimit] = useState(25);

  useEffect(() => {
    setDisplayLimit(25);
  }, [searchTerm, filterType, dateRange]);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(0, displayLimit);
  }, [filteredOrders, displayLimit]);

  return (
    <div className="p-3 space-y-3 no-print font-sans pb-6">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Filter Controls & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3 space-y-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-slate-400" size={20} />
          <input
            className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl py-2.5 pl-11 pr-10 outline-none font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
            placeholder="Tìm theo đối tác, mã đơn..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="absolute right-3 text-slate-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSearchTerm('')}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Transaction Type Slider */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'All', label: 'Tất cả' },
            { id: 'Sale', label: 'Đơn Bán' },
            { id: 'Purchase', label: 'Đơn Nhập' },
            { id: 'Debt', label: 'Ghi Nợ' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => {
                triggerHaptic && triggerHaptic('light');
                setFilterType(type.id);
              }}
              className={cn(
                "whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border android-touchable",
                filterType === type.id
                  ? "bg-primary text-white border-primary shadow-xs dark:bg-emerald-600 dark:border-emerald-500"
                  : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Date Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: 'yesterday', label: 'Hôm qua' },
            { id: '7days', label: '7 ngày qua' },
            { id: '30days', label: '30 ngày qua' }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => {
                triggerHaptic && triggerHaptic('light');
                setDateRange(range.id);
              }}
              className={cn(
                "whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all border android-touchable",
                dateRange === range.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900"
                  : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Items List */}
      <div className="space-y-2.5">
        {loading && orders.length === 0 && (
          <div className="text-center py-10 text-xs font-bold text-slate-400 uppercase animate-pulse">Đang tải lịch sử giao dịch...</div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-14 text-slate-400 font-medium space-y-2">
            <Layers size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm">Không có giao dịch nào khớp với bộ lọc</p>
          </div>
        )}

        {paginatedOrders.map(order => {
          const isSale = order.type === 'Sale';
          return (
            <m.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedOrder(order)}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 cursor-pointer android-touchable"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold",
                  isSale ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                )}>
                  {isSale ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>

                <div className="min-w-0 pr-2">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {order.partner_name || (isSale ? 'Khách lẻ' : 'Nhà cung cấp')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="font-semibold text-primary dark:text-emerald-400">#{order.display_id || order.id}</span>
                    <span>•</span>
                    <span>{new Date(order.date).toLocaleDateString('vi-VN')} {new Date(order.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={cn(
                  "font-extrabold text-base leading-tight block",
                  isSale ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {isSale ? '+' : '-'}{formatNumber(order.total_amount)}đ
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  {order.payment_method}
                </span>
              </div>
            </m.div>
          );
        })}

        {filteredOrders.length > paginatedOrders.length && (
          <button
            onClick={() => setDisplayLimit(prev => prev + 25)}
            className="w-full py-3 my-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-primary dark:text-emerald-400 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Tải thêm ({paginatedOrders.length}/{filteredOrders.length} giao dịch)</span>
          </button>
        )}
      </div>

      {/* Transaction Details Bottom Sheet Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm android-webview">
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-t-[28px] max-h-[90dvh] flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-area-pb"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={22} />
                </button>
                <div className="text-center">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {selectedOrder.type === 'Sale' ? 'Hóa Đơn Bán Hàng' : 'Hóa Đơn Nhập Hàng'} #{selectedOrder.display_id || selectedOrder.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedOrder.partner_name || (selectedOrder.type === 'Sale' ? 'Khách lẻ' : 'Nhà cung cấp')}
                  </p>
                </div>
                <div className="w-8"></div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh sách sản phẩm</div>

                {(selectedOrder.details || []).map((detail, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-primary/10 text-primary dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                        {detail.quantity}x
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {detail.product_name}
                        </h4>
                        <div className="text-xs text-slate-500 font-medium">
                          {formatNumber(detail.price)}đ / {detail.product_unit || 'Đơn vị'}
                        </div>
                      </div>
                    </div>

                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 shrink-0">
                      {formatNumber(detail.price * detail.quantity)}đ
                    </span>
                  </div>
                ))}

                {/* Summary Box */}
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Tổng tiền giao dịch:</span>
                    <span className="font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                      {formatNumber(selectedOrder.total_amount)}đ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Thanh toán</span>
                      <span className="font-bold">{selectedOrder.payment_method}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Thời gian</span>
                      <span className="font-bold">{new Date(selectedOrder.date).toLocaleTimeString('vi-VN')}</span>
                    </div>
                  </div>

                  {selectedOrder.note && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 italic pt-2 border-t border-slate-200 dark:border-slate-700">
                      Ghi chú: "{selectedOrder.note}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3.5 bg-primary dark:bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/25 active:scale-98 transition-transform flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  <span>In Hóa Đơn</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm uppercase tracking-wider active:scale-98 transition-transform"
                >
                  Đóng
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Template */}
      {printData && printData.details && printData.details.length > 0 && (
        <div className="only-print">
          <PrintTemplate
            data={printData}
            settings={settings}
            type={printData.type || "Sale"}
            showOldDebt={printOptions.showOldDebt}
            showPayment={printOptions.showPayment}
            showRemaining={printOptions.showRemaining}
            showCashGiven={printOptions.showCashGiven}
            showChange={printOptions.showChange}
          />
        </div>
      )}
    </div>
  );
}
