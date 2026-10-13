import React, { useRef, useEffect, memo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Truck, Phone, FileText, MapPin, Wallet, Coins, CreditCard, ChevronDown 
} from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { 
  getBubbleComputedStyle, 
  getButtonComputedStyle, 
  getBubbleBadgeStyle 
} from '@/components/modals/CartColorCustomizerModal';

/**
 * PurchaseFloatingBubbles - High-performance isolated component for floating summary bubbles in Purchase page
 * Separated from main Purchase page to prevent full-page layout recalculations during supplier changes and payment updates.
 * Provides bouncy, fluid spring animations matching POSFloatingBubbles.
 */
const PurchaseFloatingBubbles = memo(function PurchaseFloatingBubbles({
  selectedPartner = null,
  oldDebt = 0,
  remainingDebt = 0,
  cartColorConfig,
  onOpenPartnerHistory,
  onOpenDailyHistory,

  note = '',
  isNoteOpen = false,
  onToggleNote,

  paymentMethod = 'Cash',
  onSelectPaymentMethod,
  amountPaid = 0,
  onChangeAmountPaid,
  amountPaidInputRef,

  totalAmount = 0,

  canScrollDown = false,
  onScrollDownCart,
  cartScrollContainerRef
}) {
  const partnerBubbleRef = useRef(null);
  const totalBubbleRef = useRef(null);

  // High-performance ResizeObserver & target calculation isolated to this component
  useEffect(() => {
    if (!cartScrollContainerRef?.current) return;
    if (cartColorConfig?.constrainCartAboveBubbles === false) {
      cartScrollContainerRef.current.style.removeProperty('--cart-bubble-bottom');
      return;
    }

    let rafId = null;
    let lastAppliedH = -1;

    const measureAndApply = () => {
      if (!cartScrollContainerRef?.current) return;
      const pEl = partnerBubbleRef.current;
      const tEl = totalBubbleRef.current;
      const pH = pEl ? Math.round(pEl.getBoundingClientRect?.().height || pEl.offsetHeight || 0) : 0;
      const tH = tEl ? Math.round(tEl.getBoundingClientRect?.().height || tEl.offsetHeight || 0) : 0;
      const maxH = Math.max(pH, tH);
      const fallback = selectedPartner ? 100 : 85;
      const targetH = maxH > 30 ? Math.round(maxH + 20) : fallback;

      // Only update if height changed by at least 2px to prevent sub-pixel animation fighting
      if (Math.abs(lastAppliedH - targetH) >= 2) {
        lastAppliedH = targetH;
        cartScrollContainerRef.current.style.setProperty('--cart-bubble-bottom', `${targetH}px`);
      }
    };

    let debounceTimer = null;
    const scheduleMeasure = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(measureAndApply);
      }, 50);
    };

    const ro = new ResizeObserver(scheduleMeasure);
    if (partnerBubbleRef.current) ro.observe(partnerBubbleRef.current);
    if (totalBubbleRef.current) ro.observe(totalBubbleRef.current);

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure, { passive: true });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [cartColorConfig?.constrainCartAboveBubbles, selectedPartner?.id, paymentMethod]);

  const partnerStyle = getBubbleComputedStyle(cartColorConfig, 'partner');
  const cashStyle = getBubbleComputedStyle(cartColorConfig, 'cash');
  const totalStyle = getBubbleComputedStyle(cartColorConfig, 'total');
  const paymentStyle = getBubbleComputedStyle(cartColorConfig, 'payment');
  const isCash = paymentMethod === 'Cash';

  return (
    <>
      {/* 1. Floating Supplier Bubble (Bottom-Left) */}
      <m.div
        key="partner-bubble"
        id="supplier-bubble"
        data-bubble="supplier"
        ref={partnerBubbleRef}
        layout
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18, ease: "easeInOut" } }}
        transition={{
          layout: { type: "spring", stiffness: 300, damping: 18, mass: 0.85 },
          type: "spring",
          stiffness: 350,
          damping: 22
        }}
        className="absolute bottom-3 left-3 z-[110] pointer-events-none flex flex-col items-start gap-2.5"
      >
        <m.div 
          layout 
          transition={{ layout: { type: "spring", stiffness: 300, damping: 18, mass: 0.85 } }} 
          className="flex items-center gap-2.5 pointer-events-auto"
        >
          <m.div
            key="supplier-card-bubble"
            id="supplier-card-bubble"
            data-bubble="supplier-card"
            layout
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{
              layout: {
                type: "spring",
                stiffness: 300,
                damping: 18,
                mass: 0.85
              },
              scale: { type: "spring", stiffness: 420, damping: 22 },
              y: { type: "spring", stiffness: 420, damping: 22 },
              opacity: { duration: 0.2 }
            }}
            onClick={e => {
              e.stopPropagation();
              if (selectedPartner) {
                onOpenPartnerHistory?.();
              } else {
                onOpenDailyHistory?.();
              }
            }}
            style={partnerStyle}
            className="flex items-start group/partner-bubble cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 p-3 px-5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden"
          >
            <Truck 
              className="absolute -right-4 -bottom-4 w-28 h-28 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/partner-bubble:scale-110 group-hover/partner-bubble:-rotate-6 pointer-events-none select-none" 
              style={partnerStyle?.color ? { color: partnerStyle.color, opacity: 0.1 } : undefined} 
            />
            
            {/* Dynamic width container with bouncy spring layout transition */}
            <m.div 
              layout 
              transition={{ layout: { type: "spring", stiffness: 300, damping: 18, mass: 0.85 } }}
              className={cn(
                "flex flex-col relative z-10",
                selectedPartner 
                  ? "min-w-[220px] max-w-[380px] sm:max-w-[420px]" 
                  : "min-w-[140px] max-w-[260px]"
              )}
            >
              <div 
                className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] mb-0.5 leading-normal py-0.5" 
                style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
              >
                Nhà cung cấp / Đối tác
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                {selectedPartner && (
                  <m.span 
                    layout="position"
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider shrink-0 border transition-all", 
                      !partnerStyle?.color && "bg-[#8b6f47]/15 dark:bg-[#d4a574]/20 text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/30 dark:border-[#d4a574]/30"
                    )}
                    style={partnerStyle?.color ? { 
                      color: partnerStyle.color, 
                      borderColor: `${partnerStyle.color}40`, 
                      backgroundColor: `${partnerStyle.color}20` 
                    } : undefined}
                  >
                    ID: {selectedPartner.id}
                  </m.span>
                )}
                <m.div 
                  layout="position"
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="text-base font-black text-[#2d5016] dark:text-emerald-400 uppercase leading-normal py-0.5 tracking-tight truncate" 
                  style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                  title={selectedPartner ? selectedPartner.name : "Nhà cung cấp lẻ"}
                >
                  {selectedPartner ? selectedPartner.name : "Nhà cung cấp lẻ"}
                </m.div>
              </div>

              {/* Supplier Expanded Details */}
              <AnimatePresence initial={false}>
                {selectedPartner && (
                  <m.div
                    key={selectedPartner?.id ? `supplier-${selectedPartner.id}` : "supplier-details"}
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.96 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.96 }}
                    transition={{
                      height: {
                        type: "spring",
                        stiffness: 280,
                        damping: 18,
                        mass: 0.8
                      },
                      scale: {
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      },
                      opacity: { duration: 0.2, ease: "easeOut" }
                    }}
                    className="flex flex-col gap-1 w-full border-l-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 pl-2.5 ml-0.5 overflow-hidden"
                    style={partnerStyle?.color ? { borderColor: `${partnerStyle.color}40` } : undefined}
                  >
                    {(selectedPartner.phone || selectedPartner.tax_code || selectedPartner.cccd) && (
                      <div 
                        className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-normal py-0.5" 
                        style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                      >
                        {selectedPartner.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                            <span className="truncate leading-normal">{selectedPartner.phone}</span>
                          </div>
                        )}
                        {(selectedPartner.tax_code || selectedPartner.cccd) && (
                          <div className="flex items-center gap-1">
                            <FileText size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                            <span className="truncate leading-normal">{selectedPartner.tax_code || selectedPartner.cccd}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedPartner.address && (
                      <div 
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-normal py-0.5" 
                        style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                      >
                        <MapPin size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                        <span className="truncate leading-normal">{selectedPartner.address}</span>
                      </div>
                    )}

                    {/* Debt Status Card */}
                    {(remainingDebt !== 0 || oldDebt !== 0) && (
                      <m.div 
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 18
                        }}
                        className="w-full mt-0.5 pt-1 border-t border-[#8b6f47]/15 dark:border-[#d4a574]/15" 
                        style={partnerStyle?.color ? { borderColor: `${partnerStyle.color}25` } : undefined}
                      >
                        {(() => {
                          const tc = partnerStyle?.color;
                          const deltaDebt = remainingDebt - oldDebt;
                          if (deltaDebt === 0) {
                            return (
                              <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                                  <Wallet size={11} className="shrink-0" style={tc ? { color: tc } : undefined} />
                                  <span>Dư nợ:</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={cn("text-xs font-black tabular-nums", oldDebt < 0 ? "text-rose-600 dark:text-rose-400" : oldDebt > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                                    {formatNumber(Math.abs(oldDebt))}đ
                                  </span>
                                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md", oldDebt < 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : oldDebt > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                                    {oldDebt < 0 ? "Mình nợ" : oldDebt > 0 ? "Họ nợ" : "Hết nợ"}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                                <span className="flex items-center gap-1">
                                  <Wallet size={11} className="shrink-0 text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined} />
                                  <span>Biến động nợ</span>
                                </span>
                                <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md", remainingDebt < 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : remainingDebt > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                                  {remainingDebt < 0 ? "Mình nợ" : remainingDebt > 0 ? "Họ nợ" : "Hết nợ"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none mb-0.5" style={tc ? { color: tc, opacity: 0.7 } : undefined}>
                                    Hiện tại
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-through decoration-rose-400/60 tabular-nums" style={tc ? { color: tc, opacity: 0.8 } : undefined}>
                                    {formatNumber(Math.abs(oldDebt))}đ
                                  </span>
                                </div>
                                <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-tight", deltaDebt < 0 ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25" : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25")}>
                                  <span>➔</span>
                                  <span>{deltaDebt < 0 ? `+${formatNumber(Math.abs(deltaDebt))}` : `-${formatNumber(Math.abs(deltaDebt))}`}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] font-bold text-rose-500/80 dark:text-rose-400/80 uppercase leading-none mb-0.5">
                                    Sau đơn
                                  </span>
                                  <span className={cn("text-[11px] font-black tabular-nums", remainingDebt < 0 ? "text-rose-600 dark:text-rose-400" : remainingDebt > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#2d5016] dark:text-emerald-400")}>
                                    {formatNumber(Math.abs(remainingDebt))}đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </m.div>
                    )}
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          </m.div>

          {/* Mini Action Note Button */}
          <m.div layout="position" transition={{ type: "spring", stiffness: 320, damping: 20 }} className="relative group/note-container pointer-events-auto">
            <m.div 
              id="purchase-note-bubble"
              data-bubble="note"
              layout
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 450, damping: 22 }}
              onClick={e => {
                e.stopPropagation();
                onToggleNote?.();
              }}
              style={getButtonComputedStyle(cartColorConfig, 'note')}
              className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-[border-color,background-color,box-shadow] cursor-pointer border-2 shadow-[0_8px_18px_rgba(139,111,71,0.22)] dark:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_24px_rgba(139,111,71,0.28)]",
                note || isNoteOpen
                  ? "bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white border-[#2d5016] dark:border-emerald-400 shadow-md shadow-[#2d5016]/25"
                  : "bg-[#fbf9f4] dark:bg-[#1a1e17] text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/40 dark:border-[#d4a574]/35 hover:bg-[#8b6f47]/10 hover:border-[#2d5016] hover:text-[#2d5016] dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              )}
              title="Ghi chú đơn nhập"
            >
              <FileText size={18} className={note || isNoteOpen ? "text-white" : "transition-colors"} strokeWidth={2.5} />
              <AnimatePresence>
                {note && !isNoteOpen && (
                  <m.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800" 
                  />
                )}
              </AnimatePresence>
            </m.div>
          </m.div>
        </m.div>
      </m.div>

      {/* 2. Floating Total & Payment Bubble - Bottom Right */}
      <m.div
        key="total-bubble"
        id="purchase-total-bubble"
        data-bubble="total-container"
        ref={totalBubbleRef}
        layout
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18, ease: "easeInOut" } }}
        transition={{
          layout: { type: "spring", stiffness: 300, damping: 18, mass: 0.85 },
          type: "spring",
          stiffness: 350,
          damping: 22
        }}
        className="absolute bottom-3 right-3 z-[110] pointer-events-none flex items-center gap-2.5"
      >
        {/* Cash Bubble (Tiền trả NCC) */}
        <AnimatePresence>
          {isCash && (
            <m.div
              key="purchase-cash-bubble"
              data-bubble="cash"
              layout
              initial={{ opacity: 0, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92, x: 20, transition: { duration: 0.18, ease: "easeOut" } }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              transition={{
                layout: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                type: "spring",
                stiffness: 420,
                damping: 28
              }}
              style={cashStyle}
              className="pointer-events-auto flex items-center bg-[#fbf9f4] dark:bg-[#1a1e17] p-3 pr-5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] hover:border-[#2d5016] dark:hover:border-emerald-400 group/cash-calculator relative min-w-[200px] transition-[border-color,background-color,box-shadow] duration-200"
            >
              <div 
                style={getBubbleBadgeStyle(cartColorConfig, 'cash')} 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0 group-hover/cash-calculator:rotate-12 transition-transform"
              >
                <Coins size={20} style={{ color: getBubbleBadgeStyle(cartColorConfig, 'cash').color || '#ffffff' }} />
              </div>
              <div className="flex flex-col ml-3">
                <span 
                  className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] mb-0.5 whitespace-nowrap" 
                  style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                >
                  Tiền trả NCC (F1)
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center min-w-[70px] group/input-wrapper h-full">
                    <span className="invisible whitespace-pre font-black text-xl px-1 pointer-events-none tabular-nums select-none">
                      {formatNumber(amountPaid) || "0"}
                    </span>
                    <input
                      id="purchase-cash-compact"
                      ref={amountPaidInputRef}
                      type="text"
                      style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                      className="absolute inset-0 w-full h-full bg-transparent border-b-2 border-[#8b6f47]/30 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none font-black text-xl text-[#2d5016] dark:text-emerald-400 p-0 tabular-nums transition-all z-10"
                      value={formatNumber(amountPaid)}
                      autoComplete="off"
                      onChange={(e) => onChangeAmountPaid?.(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Payment Method Toggle Pill */}
        <AnimatePresence mode="popLayout">
          {selectedPartner && (
            <m.div
              key="purchase-payment-toggle-bubble"
              data-bubble="payment"
              layout
              initial={{ opacity: 0, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92, x: 20, transition: { duration: 0.18, ease: "easeOut" } }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              transition={{
                layout: { type: "spring", stiffness: 420, damping: 30 },
                scale: { type: "spring", stiffness: 480, damping: 25 },
                y: { type: "spring", stiffness: 480, damping: 25 },
                opacity: { duration: 0.18 }
              }}
              style={paymentStyle}
              className="w-[155px] pointer-events-auto flex items-center bg-[#fbf9f4] dark:bg-[#1a1e17] backdrop-blur-xl p-1 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] hover:border-[#2d5016] dark:hover:border-emerald-400 group/payment-toggle relative h-[56px] transition-[border-color,background-color,box-shadow] duration-200"
            >
              <m.div 
                className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl shadow-md z-0 pointer-events-none"
                initial={false}
                animate={{
                  left: isCash ? "4px" : "calc(50%)"
                }}
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                style={getBubbleBadgeStyle(cartColorConfig, 'payment')}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPaymentMethod?.('Cash');
                }}
                style={{
                  color: isCash 
                    ? (getBubbleBadgeStyle(cartColorConfig, "payment").color || "#ffffff") 
                    : (paymentStyle?.color || undefined)
                }}
                className={cn(
                  "flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-200 relative z-10 gap-0.5",
                  isCash ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400"
                )}
              >
                <Coins size={13} className={cn(isCash ? "opacity-100" : "opacity-40")} />
                <span className="text-[9px] font-black uppercase tracking-wider">Tiền mặt</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPaymentMethod?.('Debt');
                }}
                style={{
                  color: !isCash 
                    ? (getBubbleBadgeStyle(cartColorConfig, "payment").color || "#ffffff") 
                    : (paymentStyle?.color || undefined)
                }}
                className={cn(
                  "flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-200 relative z-10 gap-0.5",
                  !isCash ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400"
                )}
              >
                <CreditCard size={13} className={cn(!isCash ? "opacity-100" : "opacity-40")} />
                <span className="text-[9px] font-black uppercase tracking-wider">Ghi nợ</span>
              </button>
            </m.div>
          )}
        </AnimatePresence>

        {/* Big Total Bubble */}
        <m.div 
          key="purchase-total-amount-bubble"
          id="total-amount-bubble"
          data-bubble="total"
          layout
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          whileHover={{ scale: 1.015, y: -1 }}
          whileTap={{ scale: 0.985 }}
          transition={{
            layout: { type: "spring", stiffness: 420, damping: 30 },
            scale: { type: "spring", stiffness: 480, damping: 25 },
            y: { type: "spring", stiffness: 480, damping: 25 },
            opacity: { duration: 0.2 }
          }}
          style={totalStyle}
          className="px-6 py-3 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] hover:border-[#2d5016] dark:hover:border-emerald-400 flex flex-col items-end group/total pointer-events-auto relative overflow-hidden transition-[border-color,background-color,box-shadow] duration-200"
        >
          <Wallet className="absolute -left-8 -bottom-8 w-36 h-36 text-[#2d5016]/5 dark:text-emerald-500/5 -rotate-12 transition-transform group-hover/total:scale-110 group-hover/total:-rotate-6 pointer-events-none select-none" />
          <div className="flex items-center gap-1.5 mb-0.5 z-10 relative">
            <div 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ 
                backgroundColor: (cartColorConfig?.bubbleBorderColor && cartColorConfig.bubbleBorderColor !== 'default') 
                  ? cartColorConfig.bubbleBorderColor 
                  : (cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default') 
                    ? cartColorConfig.accentColor 
                    : '#10b981' 
              }} 
            />
            <span 
              className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] flex items-center gap-1.5" 
              style={totalStyle?.color ? { color: totalStyle.color } : undefined}
            >
              Tổng cộng tiền nhập
            </span>
          </div>
          <div 
            className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums text-[#2d5016] dark:text-emerald-400 flex items-baseline gap-1 z-10 relative" 
            style={totalStyle?.color ? { color: totalStyle.color } : undefined}
          >
            {formatNumber(totalAmount)}
            <span 
              className="text-sm text-emerald-600 dark:text-emerald-400 font-bold ml-0.5" 
              style={totalStyle?.color ? { color: totalStyle.color } : undefined}
            >
              đ
            </span>
          </div>
        </m.div>
      </m.div>

      {/* 3. Floating hint that more items are below */}
      <AnimatePresence>
        {canScrollDown && (
          <m.button
            type="button"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onScrollDownCart}
            className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-[115] cursor-pointer flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fbf9f4] dark:bg-[#1a1e17] border-2 border-[#8b6f47]/50 dark:border-[#d4a574]/50 shadow-[0_8px_20px_-2px_rgba(139,111,71,0.22)] dark:shadow-[0_10px_22px_-2px_rgba(0,0,0,0.6)] text-[#2d5016] dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:border-[#2d5016] dark:hover:border-emerald-400 transition-colors select-none group pointer-events-auto"
            title="Bấm để cuộn xuống xem các sản phẩm tiếp theo"
          >
            <span className="relative flex h-2 w-2">
              <span className="inline-flex rounded-full h-2 w-2 bg-[#2d5016] dark:bg-emerald-400" />
            </span>
            <span>Còn sản phẩm bên dưới</span>
            <ChevronDown size={13} strokeWidth={3} className="text-[#8b6f47] dark:text-[#d4a574] group-hover:translate-y-0.5 transition-transform" />
          </m.button>
        )}
      </AnimatePresence>
    </>
  );
});

export default PurchaseFloatingBubbles;
