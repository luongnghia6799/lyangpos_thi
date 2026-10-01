import React, { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  Printer, 
  ReceiptText, 
  Package, 
  History, 
  Wallet, 
  Coins, 
  HandCoins, 
  RotateCw, 
  Minus, 
  Plus, 
  RotateCcw, 
  Volume2, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Portal from '@/components/widgets/Portal';
import PrintTemplate from '@/components/panels/PrintTemplate';

/**
 * High-performance POS Print Preview & Settings Modal
 */
const POSPrintPreviewModal = React.memo(function POSPrintPreviewModal({
  isOpen = false,
  orderData,
  settings,
  invoiceType = 'Sale',
  onChangeInvoiceType,
  printOptions = {
    showOldDebt: true,
    showPayment: true,
    showRemaining: true,
    showCashGiven: true,
    showChange: true
  },
  onTogglePrintOption,
  onConfirmPrint,
  onReadPacking,
  onClose
}) {
  const [zoomScale, setZoomScale] = useState(1);

  if (!isOpen || !orderData) return null;

  const financialOptions = [
    {
      id: "showOldDebt",
      label: "Hiển thị nợ cũ",
      icon: History,
      color: "text-rose-600 dark:text-rose-400",
      bgActive: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
    },
    {
      id: "showPayment",
      label: "Hiển thị thanh toán",
      icon: Wallet,
      color: "text-emerald-600 dark:text-emerald-400",
      bgActive: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    },
    {
      id: "showRemaining",
      label: "Hiển thị còn lại",
      icon: Coins,
      color: "text-blue-600 dark:text-blue-400",
      bgActive: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
    },
    {
      id: "showCashGiven",
      label: "Hiển thị khách đưa",
      icon: HandCoins,
      color: "text-amber-600 dark:text-amber-400",
      bgActive: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
    },
    {
      id: "showChange",
      label: "Hiển thị tiền thối",
      icon: RotateCw,
      color: "text-cyan-600 dark:text-cyan-400",
      bgActive: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
    }
  ];

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] flex bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 font-sans overflow-hidden">
        {/* Left Settings Sidebar */}
        <m.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 25 }}
          className="w-80 h-full bg-[#faf8f3] dark:bg-[#0c120c] text-slate-800 dark:text-slate-100 border-r border-[#8b6f47]/20 dark:border-white/10 flex flex-col z-50 relative shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[#8b6f47]/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Thiết lập in
              </h3>
            </div>
            <p className="text-[10.5px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mt-1">
              Tùy chỉnh nội dung hiển thị
            </p>
          </div>

          {/* Body Options */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
            <div className="space-y-4">
              {/* Type toggle: Invoice vs Delivery */}
              <div className="flex bg-black/[0.04] dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10 mb-3 gap-1">
                <button
                  type="button"
                  onClick={() => onChangeInvoiceType("Sale")}
                  className={cn(
                    "flex-1 py-2.5 px-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    invoiceType === "Sale"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <ReceiptText size={14} className="shrink-0" strokeWidth={2.5} />
                  <span>Hóa đơn</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeInvoiceType("Delivery")}
                  className={cn(
                    "flex-1 py-2.5 px-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    invoiceType === "Delivery"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                      : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Package size={14} className="shrink-0" strokeWidth={2.5} />
                  <span>Xuất kho</span>
                </button>
              </div>

              {invoiceType === "Delivery" ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
                  Phiếu xuất kho tự động ẩn đơn giá, thành tiền và toàn bộ thông tin công nợ thanh toán.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.15em]">
                      Thông tin tài chính
                    </label>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent ml-3" />
                  </div>
                  <div className="grid gap-2.5">
                    {financialOptions.map(item => {
                      const IconComp = item.icon;
                      const isChecked = printOptions[item.id];
                      return (
                        <m.button
                          key={item.id}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onTogglePrintOption(item.id)}
                          className={cn(
                            "w-full p-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 border group relative cursor-pointer select-none",
                            isChecked
                              ? "bg-white dark:bg-white/[0.08] border-emerald-500/30 dark:border-emerald-500/40 shadow-sm"
                              : "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-70 hover:opacity-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                          )}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                              isChecked ? `${item.bgActive} shadow-xs` : "bg-black/[0.05] dark:bg-white/5 text-slate-400 dark:text-white/30"
                            )}>
                              <IconComp size={18} strokeWidth={2.4} className={cn("transition-transform", isChecked ? "scale-105" : "scale-95")} />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className={cn("text-[12px] font-bold tracking-tight transition-colors", isChecked ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-white/50")}>
                                {item.label}
                              </span>
                              <span className={cn("text-[9px] font-black uppercase tracking-wider", isChecked ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-white/30")}>
                                {isChecked ? "ĐANG HIỆN" : "ĐANG ẨN"}
                              </span>
                            </div>
                          </div>
                          <div className={cn("w-11 h-6 rounded-full relative p-0.5 transition-colors duration-300", isChecked ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20")}>
                            <m.div
                              layout={true}
                              animate={{ x: isChecked ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="w-5 h-5 rounded-full bg-white shadow-md"
                            />
                          </div>
                        </m.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-[#8b6f47]/15 dark:border-white/10 space-y-2.5 bg-white/40 dark:bg-white/[0.02]">
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConfirmPrint(invoiceType)}
              className="group w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all"
            >
              <Printer size={16} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
              <span>{invoiceType === "Delivery" ? "Lưu & In Xuất Kho" : "Lưu & In Ngay"}</span>
            </m.button>

            {onReadPacking && (
              <m.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(236, 72, 153, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                onClick={onReadPacking}
                className="w-full py-3 bg-pink-500/10 text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 rounded-2xl font-bold uppercase tracking-wider text-xs border border-pink-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Volume2 size={16} />
                <span>Đọc Soạn Hàng</span>
              </m.button>
            )}

            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-3 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl font-bold uppercase tracking-wider text-xs border border-black/5 dark:border-white/5 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <X size={16} />
              <span>Đóng nhanh</span>
            </m.button>
          </div>
        </m.div>

        {/* Floating Zoom Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2100] flex items-center gap-2 p-1.5 bg-[#faf8f3]/90 dark:bg-slate-900/90 rounded-2xl border border-[#8b6f47]/20 dark:border-white/15 backdrop-blur-2xl shadow-2xl select-none">
          <m.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoomScale(s => Math.max(0.5, s - 0.1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus size={16} />
          </m.button>
          <div className="px-3 text-xs font-black text-slate-800 dark:text-white min-w-[50px] text-center tabular-nums">
            {Math.round(zoomScale * 100)}%
          </div>
          <m.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoomScale(s => Math.min(2, s + 0.1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors cursor-pointer"
            title="Phóng to"
          >
            <Plus size={16} />
          </m.button>
          <div className="w-[1px] h-5 bg-black/10 dark:bg-white/15 mx-1" />
          <m.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoomScale(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
            title="Reset 100%"
          >
            <RotateCcw size={15} />
          </m.button>
        </div>

        {/* Print Preview Document Area */}
        <div
          className="flex-1 h-full overflow-auto no-scrollbar py-12 px-4 flex flex-col items-center cursor-zoom-out"
          onClick={onClose}
        >
          <m.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: zoomScale, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 220, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="relative keep-white bg-white ring-1 ring-black/10 transform-gpu cursor-default origin-top shadow-2xl rounded-xs"
          >
            <PrintTemplate
              data={orderData}
              settings={settings}
              type={invoiceType || "Sale"}
              isPreview={true}
              showOldDebt={printOptions.showOldDebt}
              showPayment={printOptions.showPayment}
              showRemaining={printOptions.showRemaining}
              showCashGiven={printOptions.showCashGiven}
              showChange={printOptions.showChange}
            />
          </m.div>
          <p className="mt-8 text-[10.5px] font-bold text-white/50 dark:text-white/30 uppercase tracking-[0.25em] font-sans">
            Cuộn để xem toàn bộ hóa đơn • LyangPOS Studio
          </p>
        </div>
      </div>
    </Portal>
  );
});

export default POSPrintPreviewModal;
