import React, { useRef, useEffect, memo, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Sprout, Phone, Package, MapPin, Wallet, Truck, 
  RefreshCcw, History, Activity, ChevronDown 
} from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import OrderNotePopup from '@/components/widgets/OrderNotePopup';
import ShippingInfoPopup from '@/components/widgets/ShippingInfoPopup';
import { 
  getBubbleComputedStyle, 
  getButtonComputedStyle, 
  getBubbleBadgeStyle 
} from '@/components/modals/CartColorCustomizerModal';

/**
 * POSFloatingBubbles - High-performance isolated component for floating summary bubbles
 * Separated from main POSPage to prevent full-page layout recalculations during order switches and partner updates.
 */
function POSFloatingBubbles({
  partner,
  livePartner,
  debtBeforeOrder = 0,
  debtAfterOrder = 0,
  isRemoteInspect = false,
  remoteState = null,
  cartColorConfig,
  onOpenPartnerHistory,
  onOpenPartnerSearch,

  orderNote = '',
  isNoteOpen = false,
  onToggleNote,
  onCloseNote,
  onChangeOrderNote,

  shippingStatus = null,
  shippingAddress = '',
  shippingPhone = '',
  onToggleShipping,
  onCloseShipping,
  onSaveShipping,

  paymentMethod = 'Cash',
  onSelectPaymentMethod,
  amountPaid = 0,
  onChangeAmountPaid,
  amountPaidInputRef,
  cashGiven = 0,
  onChangeCashGiven,
  cashGivenInputRef,

  totalAmount = 0,
  isProfitRevealed = false,
  cart = [],
  currentProduct = null,
  onMouseDownProfit,
  onMouseUpProfit,
  orderProfit = 0,

  canScrollDown = false,
  onScrollDownCart,
  cartScrollContainerRef
}) {
  const partnerBubbleRef = useRef(null);
  const totalBubbleRef = useRef(null);
  const internalAmountPaidRef = useRef(null);
  const activeAmountPaidRef = amountPaidInputRef || internalAmountPaidRef;
  const lastAppliedHRef = useRef(-1);

  // High-performance ResizeObserver & target calculation isolated to this component
  useEffect(() => {
    if (!cartScrollContainerRef?.current) return;
    if (cartColorConfig?.constrainCartAboveBubbles === false) {
      cartScrollContainerRef.current.style.removeProperty('--cart-bubble-bottom');
      return;
    }

    let rafId = null;

    const measureAndApply = () => {
      if (!cartScrollContainerRef?.current) return;
      const pEl = partnerBubbleRef.current;
      const tEl = totalBubbleRef.current;
      const pH = pEl ? Math.round(pEl.getBoundingClientRect?.().height || pEl.offsetHeight || 0) : 0;
      const tH = tEl ? Math.round(tEl.getBoundingClientRect?.().height || tEl.offsetHeight || 0) : 0;
      const maxH = Math.max(pH, tH);
      const fallback = (partner || isRemoteInspect) ? 100 : 85;
      const targetH = maxH > 30 ? Math.round(maxH + 20) : fallback;

      // Only update if height changed by at least 2px to prevent sub-pixel animation fighting
      if (Math.abs(lastAppliedHRef.current - targetH) >= 2) {
        lastAppliedHRef.current = targetH;
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
  }, [cartColorConfig?.constrainCartAboveBubbles, partner?.id, isRemoteInspect]);

  const partnerStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'partner'), [cartColorConfig]);
  const cashStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'cash'), [cartColorConfig]);
  const totalStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'total'), [cartColorConfig]);
  const paymentStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'payment'), [cartColorConfig]);

  const effectiveTotal = isRemoteInspect 
    ? remoteState?.total_amount || (remoteState?.cart || []).reduce((acc, it) => acc + (Number(it.price || it.sale_price) || 0) * (Number(it.quantity) || 1), 0)
    : totalAmount;

  const currentPayMethod = isRemoteInspect ? remoteState?.payment_method || "Cash" : paymentMethod;
  const isCash = currentPayMethod === "Cash";

  return (
    <>
      {/* 1. Floating Partner Bubble (Bottom-Left) */}
      <m.div
        key="partner-bubble"
        id="partner-bubble"
        data-bubble="partner"
        ref={partnerBubbleRef}
        layout
        initial={false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18, ease: "easeInOut" } }}
        transition={{
          layout: { type: "spring", stiffness: 380, damping: 28, mass: 0.9 },
          type: "spring",
          stiffness: 380,
          damping: 28
        }}
        className="absolute bottom-3 left-3 z-[110] pointer-events-none flex flex-col items-start gap-2.5"
      >
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <m.div
            key="partner-card-bubble"
            id="partner-card-bubble"
            data-bubble="partner"
            layout
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{
              layout: {
                type: "spring",
                stiffness: 380,
                damping: 28,
                mass: 0.9
              },
              scale: { type: "spring", stiffness: 420, damping: 22 },
              y: { type: "spring", stiffness: 420, damping: 22 },
              opacity: { duration: 0.2 }
            }}
            onClick={e => {
              e.stopPropagation();
              if (partner) {
                onOpenPartnerHistory?.();
              } else {
                onOpenPartnerSearch?.();
              }
            }}
            style={partnerStyle}
            className="flex items-start group/partner-bubble cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 p-3 px-5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden"
          >
            <Sprout 
              className="absolute -right-4 -bottom-4 w-28 h-28 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/partner-bubble:scale-110 group-hover/partner-bubble:-rotate-6 pointer-events-none select-none" 
              style={partnerStyle?.color ? { color: partnerStyle.color, opacity: 0.1 } : undefined} 
            />
            <div 
              className={cn(
                "flex flex-col relative z-10",
                (partner || isRemoteInspect) 
                  ? "min-w-[220px] max-w-[380px] sm:max-w-[420px]" 
                  : "min-w-[140px] max-w-[260px]"
              )}
            >
              <div 
                className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] mb-0.5 leading-normal py-0.5" 
                style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
              >
                Đối tác / Khách hàng
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                {isRemoteInspect ? (
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md text-[9px] font-black tracking-wider shrink-0 border border-emerald-500/20">
                    MÁY TRẠM
                  </span>
                ) : (
                  partner && (
                    <m.span 
                      layout="position"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
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
                      ID: {partner.id}
                    </m.span>
                  )
                )}
                <m.div 
                  layout="position"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="text-base font-black text-[#2d5016] dark:text-emerald-400 uppercase leading-normal py-0.5 tracking-tight truncate" 
                  style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                  title={isRemoteInspect ? remoteState?.partner_name || "Khách bán lẻ" : partner ? partner.name : "Khách bán lẻ"}
                >
                  {isRemoteInspect ? remoteState?.partner_name || "Khách bán lẻ" : partner ? partner.name : "Khách bán lẻ"}
                </m.div>
              </div>

              {/* Partner Expanded Details */}
              {livePartner && (
                <m.div
                  key="partner-details-wrapper"
                  initial={{ opacity: 0, height: 0, scale: 0.96 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  transition={{
                    height: {
                      type: "spring",
                      stiffness: 360,
                      damping: 26,
                      mass: 0.9
                    },
                    scale: {
                      type: "spring",
                      stiffness: 360,
                      damping: 26
                    },
                    opacity: { duration: 0.2, ease: "easeOut" }
                  }}
                  className="flex flex-col gap-1 w-full border-l-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 pl-2.5 ml-0.5 overflow-hidden"
                  style={partnerStyle?.color ? { borderColor: `${partnerStyle.color}40` } : undefined}
                >
                    {(livePartner.phone || livePartner.cccd) && (
                      <div 
                        className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-normal py-0.5" 
                        style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                      >
                        {livePartner.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                            <span className="truncate leading-normal">{livePartner.phone}</span>
                          </div>
                        )}
                        {livePartner.cccd && (
                          <div className="flex items-center gap-1">
                            <Package size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                            <span className="truncate leading-normal">{livePartner.cccd}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {livePartner.address && (
                      <div 
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-normal py-0.5" 
                        style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                      >
                        <MapPin size={11} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                        <span className="truncate leading-normal">{livePartner.address}</span>
                      </div>
                    )}

                    {/* Debt summary / fluctuation */}
                    {(isRemoteInspect ? livePartner.debt_balance || 0 : (debtAfterOrder !== 0 || debtBeforeOrder !== 0)) && (
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
                          if (isRemoteInspect) {
                            const a = livePartner.debt_balance || 0;
                            return (
                              <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                                  <Wallet size={11} className="shrink-0" style={tc ? { color: tc } : undefined} />
                                  <span>Dư nợ:</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={cn("text-xs font-black tabular-nums", a > 0 ? "text-rose-600 dark:text-rose-400" : a < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                                    {formatNumber(Math.abs(a))}đ
                                  </span>
                                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md", a > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : a < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                                    {a > 0 ? "Khách nợ" : a < 0 ? "Mình nợ" : "Hết nợ"}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          if (debtAfterOrder - debtBeforeOrder === 0) {
                            return (
                              <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                                  <Wallet size={11} className="shrink-0" style={tc ? { color: tc } : undefined} />
                                  <span>Dư nợ:</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={cn("text-xs font-black tabular-nums", debtBeforeOrder > 0 ? "text-rose-600 dark:text-rose-400" : debtBeforeOrder < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                                    {formatNumber(Math.abs(debtBeforeOrder))}đ
                                  </span>
                                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md", debtBeforeOrder > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : debtBeforeOrder < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                                    {debtBeforeOrder > 0 ? "Khách nợ" : debtBeforeOrder < 0 ? "Mình nợ" : "Hết nợ"}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          const sDelta = debtAfterOrder - debtBeforeOrder;
                          return (
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[#8b6f47] dark:text-[#d4a574]" style={tc ? { color: tc } : undefined}>
                                <span className="flex items-center gap-1">
                                  <Wallet size={11} className="shrink-0" style={tc ? { color: tc } : undefined} />
                                  <span>Biến động nợ</span>
                                </span>
                                <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md", debtAfterOrder > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : debtAfterOrder < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                                  {debtAfterOrder > 0 ? "Khách nợ" : debtAfterOrder < 0 ? "Mình nợ" : "Hết nợ"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={tc ? { borderColor: `${tc}30`, backgroundColor: `${tc}15` } : undefined}>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none mb-0.5" style={tc ? { color: tc, opacity: 0.7 } : undefined}>
                                    Hiện tại
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-through decoration-rose-400/60 tabular-nums" style={tc ? { color: tc, opacity: 0.8 } : undefined}>
                                    {formatNumber(Math.abs(debtBeforeOrder))}đ
                                  </span>
                                </div>
                                <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-tight", sDelta > 0 ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25" : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25")}>
                                  <span>➔</span>
                                  <span>{sDelta > 0 ? `+${formatNumber(sDelta)}` : `-${formatNumber(Math.abs(sDelta))}`}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] font-bold text-rose-500/80 dark:text-rose-400/80 uppercase leading-none mb-0.5">
                                    Sau đơn
                                  </span>
                                  <span className={cn("text-[11px] font-black tabular-nums", debtAfterOrder > 0 ? "text-rose-600 dark:text-rose-400" : debtAfterOrder < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#2d5016] dark:text-emerald-400")}>
                                    {formatNumber(Math.abs(debtAfterOrder))}đ
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
            </div>
          </m.div>

          {/* Note Bubble Button */}
          <m.div layout="position" transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.9 }} className="relative group/note-container pointer-events-auto">
            <m.div
              id="note-bubble"
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
                orderNote || isNoteOpen 
                  ? "bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white border-[#2d5016] dark:border-emerald-400 shadow-md shadow-[#2d5016]/25" 
                  : "bg-[#fbf9f4] dark:bg-[#1a1e17] text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/40 dark:border-[#d4a574]/35 hover:bg-[#8b6f47]/10 hover:border-[#2d5016] hover:text-[#2d5016] dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              )}
              title="Ghi chú hóa đơn"
            >
              <Package size={18} className={orderNote || isNoteOpen ? "text-white" : "transition-colors"} strokeWidth={2.5} />
              <AnimatePresence>
                {orderNote && !isNoteOpen && (
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
            <OrderNotePopup
              isOpen={isNoteOpen}
              initialNote={orderNote}
              onClose={onCloseNote}
              onSave={onChangeOrderNote}
            />
          </m.div>

          {/* Shipping Bubble Button */}
          <m.div layout="position" transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.9 }} className="relative group/ship-container pointer-events-auto">
            <m.div
              id="ship-bubble"
              data-bubble="ship"
              layout
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 450, damping: 22 }}
              onClick={e => {
                e.stopPropagation();
                onToggleShipping?.();
              }}
              style={getButtonComputedStyle(cartColorConfig, 'ship')}
              className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-[border-color,background-color,box-shadow] cursor-pointer border-2 shadow-[0_8px_18px_rgba(139,111,71,0.22)] dark:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_24px_rgba(139,111,71,0.28)]", 
                shippingStatus === "Shipping" 
                  ? "bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white border-[#2d5016] dark:border-emerald-400 shadow-md shadow-[#2d5016]/25" 
                  : "bg-[#fbf9f4] dark:bg-[#1a1e17] text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/40 dark:border-[#d4a574]/35 hover:bg-[#8b6f47]/10 hover:border-[#2d5016] hover:text-[#2d5016] dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              )}
              title="Giao hàng tận nơi"
            >
              <Truck size={18} strokeWidth={2.5} className={shippingStatus === "Shipping" ? "text-white" : "transition-colors"} />
              <AnimatePresence>
                {shippingStatus === "Shipping" && (
                  <m.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-800" 
                  />
                )}
              </AnimatePresence>
            </m.div>
            <ShippingInfoPopup
              isOpen={shippingStatus === "Shipping"}
              initialAddress={shippingAddress}
              initialPhone={shippingPhone}
              onClose={onCloseShipping}
              onSave={onSaveShipping}
            />
          </m.div>
        </div>
      </m.div>

      {/* 2. Floating Total & Payment Bubbles (Bottom-Right) */}
      <m.div
        key="total-bubble"
        id="total-bubble"
        data-bubble="total-container"
        ref={totalBubbleRef}
        layout="position"
        initial={false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18, ease: "easeInOut" } }}
        transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.8 }}
        className="absolute bottom-3 right-3 z-[110] pointer-events-none flex items-center gap-2.5"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isCash ? (
            <m.div
              key="cash-bubble"
              id="cash-bubble"
              data-bubble="cash"
              layout
              initial={{ opacity: 0, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92, x: 20, transition: { duration: 0.18, ease: "easeInOut" } }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              transition={{
                layout: { type: "spring", stiffness: 420, damping: 30 },
                scale: { type: "spring", stiffness: 480, damping: 25 },
                y: { type: "spring", stiffness: 480, damping: 25 },
                opacity: { duration: 0.18 }
              }}
              style={cashStyle}
              onClick={() => {
                cashGivenInputRef?.current?.focus();
                cashGivenInputRef?.current?.select();
              }}
              className="pointer-events-auto flex items-start group/cash-calculator cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 p-3 px-5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden min-w-[200px]"
            >
              <RefreshCcw 
                className="absolute -right-3 -bottom-3 w-24 h-24 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/cash-calculator:scale-110 group-hover/cash-calculator:-rotate-6 pointer-events-none select-none" 
                style={cashStyle?.color ? { color: cashStyle.color, opacity: 0.1 } : undefined} 
              />
              <div className="flex flex-col relative z-10 w-full">
                <span 
                  className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] mb-0.5 leading-normal py-0.5 whitespace-nowrap" 
                  style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                >
                  Khách đưa (F1)
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center min-w-[70px] group/input-wrapper h-full">
                    <span className="invisible whitespace-pre font-black text-xl px-1 pointer-events-none tabular-nums select-none">
                      {formatNumber(cashGiven) || "0"}
                    </span>
                    <input 
                      id="cash-given-compact" 
                      ref={cashGivenInputRef} 
                      type="text" 
                      style={cashStyle?.color ? { color: cashStyle.color } : undefined} 
                      className="absolute inset-0 w-full h-full bg-transparent border-b-2 border-[#8b6f47]/30 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none font-black text-xl text-[#2d5016] dark:text-emerald-400 p-0 tabular-nums transition-all z-10" 
                      value={formatNumber(cashGiven)} 
                      autoComplete="off" 
                      onChange={e => onChangeCashGiven?.(parseFloat(e.target.value.replace(/,/g, "")) || 0)} 
                      onFocus={e => e.target.select()} 
                    />
                  </div>
                  <AnimatePresence>
                    {cashGiven > 0 && (
                      <m.div
                        layout
                        initial={{ opacity: 0, scale: 0.85, width: 0, x: 10 }}
                        animate={{ opacity: 1, scale: 1, width: "auto", x: 0 }}
                        exit={{ opacity: 0, scale: 0.85, width: 0, x: 10 }}
                        transition={{
                          width: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.18 },
                          scale: { duration: 0.18 }
                        }}
                        className="flex flex-col items-end min-w-[85px] border-l border-[#8b6f47]/20 dark:border-[#d4a574]/20 pl-3 py-0.5 overflow-hidden"
                      >
                        <span 
                          className="text-[8px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase leading-none mb-0.5 whitespace-nowrap" 
                          style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                        >
                          Tiền thối
                        </span>
                        <span className={cn("text-xl font-black tabular-nums transition-colors", cashGiven > effectiveTotal ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 opacity-50")}>
                          {formatNumber(Math.max(0, cashGiven - effectiveTotal))}
                        </span>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </m.div>
          ) : (
            <m.div
              key="debt-bubble"
              id="debt-bubble"
              data-bubble="debt"
              layout
              initial={{ opacity: 0, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92, x: 20, transition: { duration: 0.18, ease: "easeInOut" } }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              transition={{
                layout: { type: "spring", stiffness: 420, damping: 30 },
                scale: { type: "spring", stiffness: 480, damping: 25 },
                y: { type: "spring", stiffness: 480, damping: 25 },
                opacity: { duration: 0.18 }
              }}
              style={cashStyle}
              onClick={() => {
                activeAmountPaidRef.current?.focus();
                activeAmountPaidRef.current?.select();
              }}
              className="pointer-events-auto flex items-start group/debt-calculator cursor-pointer transition-[border-color,background-color,box-shadow] duration-200 p-3 px-5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden min-w-[220px]"
            >
              <History 
                className="absolute -right-3 -bottom-3 w-24 h-24 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/debt-calculator:scale-110 group-hover/debt-calculator:-rotate-6 pointer-events-none select-none" 
                style={cashStyle?.color ? { color: cashStyle.color, opacity: 0.1 } : undefined} 
              />
              <div className="flex flex-col relative z-10 w-full">
                <div className="flex items-center justify-between gap-2 mb-0.5 leading-normal py-0.5">
                  <span 
                    className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] whitespace-nowrap" 
                    style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                  >
                    Thanh toán (F1)
                  </span>
                  <div className="flex items-center gap-1">
                    {debtBeforeOrder > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeAmountPaid?.(effectiveTotal);
                        }}
                        className="px-2 py-0.5 bg-[#8b6f47]/20 hover:bg-[#8b6f47] text-[#8b6f47] hover:text-white dark:bg-[#d4a574]/20 dark:hover:bg-[#d4a574] dark:text-[#d4a574] dark:hover:text-slate-900 text-[8px] font-black rounded-full border border-[#8b6f47]/40 dark:border-[#d4a574]/40 shadow-xs hover:scale-105 active:scale-95 transition-all uppercase cursor-pointer whitespace-nowrap"
                        title="Thanh toán tiền đơn hiện tại"
                      >
                        Đơn này
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeAmountPaid?.(effectiveTotal + (debtBeforeOrder > 0 ? debtBeforeOrder : 0));
                      }}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-black rounded-full border border-emerald-400/40 shadow-xs hover:scale-105 active:scale-95 transition-all uppercase cursor-pointer whitespace-nowrap"
                      title="Thanh toán toàn bộ đơn hàng và nợ cũ"
                    >
                      Trả hết
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center min-w-[70px] group/input-wrapper h-full">
                    <span className="invisible whitespace-pre font-black text-xl px-1 pointer-events-none tabular-nums select-none">
                      {formatNumber(amountPaid) || "0"}
                    </span>
                    <input 
                      id="debt-amount-paid-compact" 
                      ref={activeAmountPaidRef} 
                      type="text" 
                      style={cashStyle?.color ? { color: cashStyle.color } : undefined} 
                      className="absolute inset-0 w-full h-full bg-transparent border-b-2 border-[#8b6f47]/30 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none font-black text-xl text-[#2d5016] dark:text-emerald-400 p-0 tabular-nums transition-all z-10" 
                      value={formatNumber(amountPaid)} 
                      autoComplete="off" 
                      onChange={e => onChangeAmountPaid?.(parseFloat(e.target.value.replace(/,/g, "")) || 0)} 
                      onFocus={e => e.target.select()} 
                    />
                  </div>
                  <AnimatePresence>
                    {(debtAfterOrder !== undefined && debtAfterOrder !== null) && (
                      <m.div
                        layout
                        initial={{ opacity: 0, scale: 0.85, width: 0, x: 10 }}
                        animate={{ opacity: 1, scale: 1, width: "auto", x: 0 }}
                        exit={{ opacity: 0, scale: 0.85, width: 0, x: 10 }}
                        transition={{
                          width: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.18 },
                          scale: { duration: 0.18 }
                        }}
                        className="flex flex-col items-end min-w-[85px] border-l border-[#8b6f47]/20 dark:border-[#d4a574]/20 pl-3 py-0.5 overflow-hidden"
                      >
                        <span 
                          className="text-[8px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase leading-none mb-0.5 whitespace-nowrap" 
                          style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                        >
                          Nợ sau đơn
                        </span>
                        <span className={cn(
                          "text-xl font-black tabular-nums transition-colors",
                          debtAfterOrder > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {formatNumber(debtAfterOrder)}
                        </span>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Payment Toggle Pill (Cash vs Debt) */}
        <AnimatePresence mode="popLayout" initial={false}>
          {(partner || isRemoteInspect) && (
            <m.div
              key="payment-toggle-bubble"
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
                onClick={e => {
                  e.stopPropagation();
                  onSelectPaymentMethod?.("Cash");
                }}
                style={{
                  color: isCash 
                    ? (getBubbleBadgeStyle(cartColorConfig, "payment").color || "#ffffff") 
                    : (paymentStyle?.color || undefined)
                }}
                className={cn("flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-200 relative z-10 gap-0.5", isCash ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400")}
              >
                <RefreshCcw size={13} className={cn(isCash ? "opacity-100" : "opacity-40")} />
                <span className="text-[9px] font-black uppercase tracking-wider">Tiền mặt</span>
              </button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onSelectPaymentMethod?.("Debt");
                }}
                style={{
                  color: !isCash 
                    ? (getBubbleBadgeStyle(cartColorConfig, "payment").color || "#ffffff") 
                    : (paymentStyle?.color || undefined)
                }}
                className={cn("flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-200 relative z-10 gap-0.5", !isCash ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400")}
              >
                <History size={13} className={cn(!isCash ? "opacity-100" : "opacity-40")} />
                <span className="text-[9px] font-black uppercase tracking-wider">Ghi nợ</span>
              </button>
            </m.div>
          )}
        </AnimatePresence>

        {/* Total Amount Bubble */}
        <m.div
          key="total-amount-bubble"
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
          onMouseDown={onMouseDownProfit}
          onMouseUp={onMouseUpProfit}
          onMouseLeave={onMouseUpProfit}
          onTouchStart={onMouseDownProfit}
          onTouchEnd={onMouseUpProfit}
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
              Tổng cộng thanh toán
            </span>
          </div>
          <div 
            className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums text-[#2d5016] dark:text-emerald-400 flex items-baseline gap-1 z-10 relative" 
            style={totalStyle?.color ? { color: totalStyle.color } : undefined}
          >
            {formatNumber(effectiveTotal)}
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold ml-0.5" style={totalStyle?.color ? { color: totalStyle.color } : undefined}>
              đ
            </span>
          </div>
          <AnimatePresence>
            {isProfitRevealed && (cart.some(t => t.product_id !== null) || (currentProduct?.product && currentProduct.product.id !== null)) && (
              <m.div
                layout
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                transition={{
                  height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.18 },
                  scale: { duration: 0.18 }
                }}
                className="mt-1 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-1.5 border border-emerald-500/20 z-10 relative overflow-hidden"
              >
                <Activity size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-tight">
                  Lợi nhuận: {formatNumber(orderProfit)}đ
                </span>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </m.div>

      {/* 3. Floating Scroll Down Cart Indicator */}
      <AnimatePresence>
        {canScrollDown && (
          <m.button
            type="button"
            layout
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={onScrollDownCart}
            className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-[115] cursor-pointer flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fbf9f4] dark:bg-[#1a1e17] border-2 border-[#8b6f47]/50 dark:border-[#d4a574]/50 shadow-[0_8px_20px_-2px_rgba(139,111,71,0.22)] dark:shadow-[0_10px_22px_-2px_rgba(0,0,0,0.6)] text-[#2d5016] dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:border-[#2d5016] dark:hover:border-emerald-400 transition-[border-color,background-color,color] duration-150 select-none group pointer-events-auto"
            title="Bấm để cuộn xuống xem các sản phẩm tiếp theo"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d5016] dark:bg-emerald-400" />
            </span>
            <span>Còn sản phẩm bên dưới</span>
            <ChevronDown size={13} strokeWidth={3} className="text-[#8b6f47] dark:text-[#d4a574] group-hover:translate-y-0.5 transition-transform" />
          </m.button>
        )}
      </AnimatePresence>
    </>
  );
}

const arePropsEqual = (prev, next) => {
  return (
    prev.partner?.id === next.partner?.id &&
    prev.partner?.name === next.partner?.name &&
    prev.partner?.debt_balance === next.partner?.debt_balance &&
    prev.livePartner?.id === next.livePartner?.id &&
    prev.debtBeforeOrder === next.debtBeforeOrder &&
    prev.debtAfterOrder === next.debtAfterOrder &&
    prev.isRemoteInspect === next.isRemoteInspect &&
    prev.cartColorConfig === next.cartColorConfig &&
    prev.orderNote === next.orderNote &&
    prev.isNoteOpen === next.isNoteOpen &&
    prev.shippingStatus === next.shippingStatus &&
    prev.shippingAddress === next.shippingAddress &&
    prev.shippingPhone === next.shippingPhone &&
    prev.paymentMethod === next.paymentMethod &&
    prev.amountPaid === next.amountPaid &&
    prev.cashGiven === next.cashGiven &&
    prev.totalAmount === next.totalAmount &&
    prev.isProfitRevealed === next.isProfitRevealed &&
    prev.orderProfit === next.orderProfit &&
    prev.canScrollDown === next.canScrollDown &&
    prev.cart === next.cart &&
    prev.currentProduct === next.currentProduct
  );
};

export default memo(POSFloatingBubbles, arePropsEqual);
