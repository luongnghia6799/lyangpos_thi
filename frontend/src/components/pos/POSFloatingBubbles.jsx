import React, { useRef, useEffect, memo, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Sprout, Phone, Package, MapPin, Wallet, Truck, 
  RefreshCcw, History, Activity, ChevronDown, TrendingUp,
  ArrowLeftRight, ArrowRight, Coins
} from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import OrderNotePopup from '@/components/widgets/OrderNotePopup';
import ShippingInfoPopup from '@/components/widgets/ShippingInfoPopup';
import { 
  getBubbleComputedStyle, 
  getButtonComputedStyle, 
  getBubbleBadgeStyle,
  getBadgeComputedStyle 
} from '@/components/modals/CartColorCustomizerModal';
import { checkIsAdmin } from '@/lib/auth';

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

  hasFertilizer = false,
  fertilizerItems = [],
  onOpenDeliveryReminder,

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
  isAdmin: propIsAdmin,
  cart = [],
  currentProduct = null,
  onMouseDownProfit,
  onMouseUpProfit,
  orderProfit = 0,

  canScrollDown = false,
  onScrollDownCart,
  cartScrollContainerRef
}) {
  const internalAmountPaidRef = useRef(null);
  const activeAmountPaidRef = amountPaidInputRef || internalAmountPaidRef;

  const isClassic = cartColorConfig?.bubbleLayoutStyle === 'classic';
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : (() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return checkIsAdmin(u?.role);
    } catch (e) {
      return false;
    }
  })();
  const partnerStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'partner'), [cartColorConfig]);
  const cashStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'cash'), [cartColorConfig]);
  const totalStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'total'), [cartColorConfig]);
  const paymentStyle = useMemo(() => getBubbleComputedStyle(cartColorConfig, 'payment'), [cartColorConfig]);
  const deliveryBadgeStyle = useMemo(() => getBadgeComputedStyle(cartColorConfig, 'delivery'), [cartColorConfig]);

  const effectiveTotal = isRemoteInspect 
    ? remoteState?.total_amount || (remoteState?.cart || []).reduce((acc, it) => acc + (Number(it.price || it.sale_price) || 0) * (Number(it.quantity) || 1), 0)
    : totalAmount;

  const currentPayMethod = isRemoteInspect ? remoteState?.payment_method || "Cash" : paymentMethod;
  const isCash = currentPayMethod === "Cash";
  const effectiveCashGiven = isRemoteInspect ? remoteState?.cash_given || 0 : cashGiven;
  const effectiveAmountPaid = isRemoteInspect ? (isCash ? effectiveTotal : remoteState?.amount_paid || 0) : amountPaid;
  const effectiveDebtBefore = isRemoteInspect ? (livePartner?.debt_balance || partner?.debt_balance || 0) : debtBeforeOrder;
  const effectiveDebtAfter = isRemoteInspect
    ? (currentPayMethod === "Debt" ? effectiveDebtBefore + (effectiveTotal >= 0 ? effectiveTotal - effectiveAmountPaid : effectiveTotal + effectiveAmountPaid) : effectiveDebtBefore)
    : debtAfterOrder;

  return (
    <>
      {/* 1. Floating Partner Bubble (Bottom-Left) */}
      <m.div
        key="partner-bubble"
        id="partner-bubble"
        data-bubble="partner"
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
          <div className="relative group/partner-wrapper">
            {/* Prominent Fertilizer Delivery Reminder Button perched on top of Partner Bubble */}
            <AnimatePresence>
              {isClassic && hasFertilizer && (
                <m.div
                  key="fertilizer-delivery-reminder-badge"
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
                >
                  <m.button
                    type="button"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={e => {
                      e.stopPropagation();
                      onOpenDeliveryReminder?.();
                    }}
                    style={deliveryBadgeStyle}
                    className="relative overflow-hidden flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 via-[#2d5016] to-[#1d380e] text-white shadow-[0_6px_20px_rgba(45,80,22,0.45)] border-2 border-emerald-300 dark:border-emerald-400 cursor-pointer select-none group/fert hover:brightness-110 active:shadow-sm transition-all whitespace-nowrap"
                    title={`Có mua phân bón (${fertilizerItems?.length || 1} loại)! Bấm để tạo nhanh nhắc nhở chở phân cho ${partner ? partner.name : 'Khách lẻ'}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                    <Truck 
                      size={13} 
                      strokeWidth={2.8} 
                      className="text-white drop-shadow-sm group-hover/fert:translate-x-0.5 transition-transform shrink-0" 
                      style={deliveryBadgeStyle?.color ? { color: deliveryBadgeStyle.color } : undefined} 
                    />
                    <span 
                      className="text-[10px] font-black uppercase tracking-wider text-white drop-shadow-sm whitespace-nowrap" 
                      style={deliveryBadgeStyle?.color ? { color: deliveryBadgeStyle.color } : undefined}
                    >
                      Nhắc Chở Phân ({fertilizerItems?.length || 1})
                    </span>
                  </m.button>
                </m.div>
              )}
            </AnimatePresence>

            <div
              key="partner-card-bubble"
              id="partner-card-bubble"
              data-bubble="partner"
              onClick={e => {
                e.stopPropagation();
                if (partner) {
                  onOpenPartnerHistory?.();
                } else {
                  onOpenPartnerSearch?.();
                }
              }}
              style={partnerStyle}
              className={cn(
                "flex group/partner-bubble cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden",
                isClassic ? "p-3 px-5 min-h-[74px] items-start" : "h-[74px] px-4 items-center"
              )}
            >
              <Sprout 
                className="absolute -right-4 -bottom-4 w-24 h-24 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/partner-bubble:scale-110 group-hover/partner-bubble:-rotate-6 pointer-events-none select-none" 
                style={partnerStyle?.color ? { color: partnerStyle.color, opacity: 0.1 } : undefined} 
              />
              <div 
                className={cn(
                  "flex flex-col justify-center h-full relative z-10",
                  (partner || isRemoteInspect) 
                    ? (isClassic ? "min-w-[190px] max-w-[320px] sm:max-w-[360px]" : "min-w-[170px] max-w-[280px] sm:max-w-[320px]") 
                    : "min-w-[130px] max-w-[200px]"
                )}
              >
                <div className="flex items-center justify-between gap-1.5 leading-none mb-1">
                  <div 
                    className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574]" 
                    style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                  >
                    Đối tác / Khách hàng
                  </div>
                  {isRemoteInspect ? (
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md text-[8.5px] font-black tracking-wider shrink-0 border border-emerald-500/20">
                      MÁY TRẠM
                    </span>
                  ) : (
                    partner && (
                      <span 
                        className={cn(
                          "px-1.5 py-0.5 rounded-md text-[8.5px] font-black tracking-wider shrink-0 border transition-all", 
                          !partnerStyle?.color && "bg-[#8b6f47]/15 dark:bg-[#d4a574]/20 text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/30 dark:border-[#d4a574]/30"
                        )}
                        style={partnerStyle?.color ? { 
                          color: partnerStyle.color, 
                          borderColor: `${partnerStyle.color}40`, 
                          backgroundColor: `${partnerStyle.color}20` 
                        } : undefined}
                      >
                        ID: {partner.id}
                      </span>
                    )
                  )}
                </div>

                <div 
                  className="text-sm sm:text-base font-black text-[#2d5016] dark:text-emerald-400 uppercase leading-snug tracking-tight truncate" 
                  style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                  title={isRemoteInspect ? remoteState?.partner_name || "Khách bán lẻ" : partner ? partner.name : "Khách bán lẻ"}
                >
                  {isRemoteInspect ? remoteState?.partner_name || "Khách bán lẻ" : partner ? partner.name : "Khách bán lẻ"}
                </div>

                {(livePartner?.phone || livePartner?.address || (isClassic && livePartner?.cccd)) ? (
                  <div 
                    className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5"
                    style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}
                  >
                    {livePartner.phone && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Phone size={10} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                        <span>{livePartner.phone}</span>
                      </span>
                    )}
                    {isClassic && livePartner.cccd && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Package size={10} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                        <span>{livePartner.cccd}</span>
                      </span>
                    )}
                    {livePartner.address && (
                      <span className="flex items-center gap-1 min-w-0 truncate">
                        <MapPin size={10} className="text-[#8b6f47] dark:text-[#d4a574] shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                        <span className="truncate">{livePartner.address}</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 italic truncate mt-0.5">
                    {partner ? "Bấm xem lịch sử đối tác" : "Bấm tìm khách hàng (F4)"}
                  </div>
                )}

                {/* Classic mode: Debt inside partner card */}
                {isClassic && (isRemoteInspect ? livePartner?.debt_balance || 0 : (debtAfterOrder !== 0 || debtBeforeOrder !== 0)) && (
                  <div 
                    className="w-full mt-1.5 pt-1 border-t border-[#8b6f47]/15 dark:border-[#d4a574]/15" 
                    style={partnerStyle?.color ? { borderColor: `${partnerStyle.color}25` } : undefined}
                  >
                    <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-[#8b6f47]/10 dark:bg-white/5 border border-[#8b6f47]/20 dark:border-[#d4a574]/20 shadow-xs" style={partnerStyle?.color ? { borderColor: `${partnerStyle.color}30`, backgroundColor: `${partnerStyle.color}15` } : undefined}>
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574]" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined}>
                        <Wallet size={11} className="shrink-0" style={partnerStyle?.color ? { color: partnerStyle.color } : undefined} />
                        <span>Dư nợ:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn("text-xs font-black tabular-nums", debtAfterOrder > 0 ? "text-rose-600 dark:text-rose-400" : debtAfterOrder < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                          {formatNumber(Math.abs(debtAfterOrder))}đ
                        </span>
                        <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md", debtAfterOrder > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" : debtAfterOrder < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500")}>
                          {debtAfterOrder > 0 ? "Khách nợ" : debtAfterOrder < 0 ? "Mình nợ" : "Hết nợ"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* In Classic mode: Show Note & Shipping buttons. In Modern mode: Show docked Debt Delta card */}
          {isClassic ? (
            <>
              {/* Note Bubble Button */}
              <div className="relative group/note-container pointer-events-auto">
                <div
                  id="note-bubble"
                  data-bubble="note"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleNote?.();
                  }}
                  style={getButtonComputedStyle(cartColorConfig, 'note')}
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer border-2 shadow-[0_8px_18px_rgba(139,111,71,0.22)] dark:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_24px_rgba(139,111,71,0.28)] hover:-translate-y-0.5 active:scale-95", 
                    orderNote || isNoteOpen 
                      ? "bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white border-[#2d5016] dark:border-emerald-400 shadow-md shadow-[#2d5016]/25" 
                      : "bg-[#fbf9f4] dark:bg-[#1a1e17] text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/40 dark:border-[#d4a574]/35 hover:border-[#2d5016] dark:hover:border-emerald-400"
                  )}
                  title="Ghi chú hóa đơn"
                >
                  <Package size={18} className={orderNote || isNoteOpen ? "text-white" : "transition-colors"} strokeWidth={2.5} />
                  {orderNote && !isNoteOpen && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800" />
                  )}
                </div>
                <OrderNotePopup
                  isOpen={isNoteOpen}
                  initialNote={orderNote}
                  onClose={onCloseNote}
                  onSave={onChangeOrderNote}
                />
              </div>

              {/* Shipping Bubble Button */}
              <div className="relative group/ship-container pointer-events-auto">
                <div
                  id="ship-bubble"
                  data-bubble="ship"
                  data-shipping-trigger="true"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleShipping?.();
                  }}
                  style={getButtonComputedStyle(cartColorConfig, 'ship')}
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer border-2 shadow-[0_8px_18px_rgba(139,111,71,0.22)] dark:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_24px_rgba(139,111,71,0.28)] hover:-translate-y-0.5 active:scale-95", 
                    shippingStatus === "Shipping" 
                      ? "bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white border-[#2d5016] dark:border-emerald-400 shadow-md shadow-[#2d5016]/25" 
                      : "bg-[#fbf9f4] dark:bg-[#1a1e17] text-[#8b6f47] dark:text-[#d4a574] border-[#8b6f47]/40 dark:border-[#d4a574]/35 hover:border-[#2d5016] dark:hover:border-emerald-400"
                  )}
                  title="Giao hàng tận nơi"
                >
                  <Truck size={18} strokeWidth={2.5} className={shippingStatus === "Shipping" ? "text-white" : "transition-colors"} />
                  {shippingStatus === "Shipping" && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-800" />
                  )}
                </div>
                <ShippingInfoPopup
                  isOpen={shippingStatus === "Shipping"}
                  initialAddress={shippingAddress}
                  initialPhone={shippingPhone}
                  onClose={onCloseShipping}
                  onSave={onSaveShipping}
                />
              </div>
            </>
          ) : (
            /* Modern mode: Debt Delta / Change Bubble */
            <div
              key="debt-card-bubble"
              id="debt-card-bubble"
              data-bubble="debt"
              onClick={e => {
                e.stopPropagation();
                if (partner) {
                  onOpenPartnerHistory?.();
                } else {
                  onOpenPartnerSearch?.();
                }
              }}
              className="h-[74px] min-w-[210px] sm:min-w-[230px] p-2.5 px-3.5 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden flex flex-col justify-between cursor-pointer group/debt-bubble pointer-events-auto transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
              title="Biến động công nợ"
            >
              <div className="absolute -right-2 -bottom-2 opacity-[0.06] dark:opacity-[0.09] text-current pointer-events-none -rotate-6 transition-transform group-hover/debt-bubble:scale-105 select-none">
                <ArrowLeftRight size={44} strokeWidth={1.5} />
              </div>

              {/* Top row: Title + Delta Badge */}
              <div className="flex items-center justify-between relative z-10 pt-0.5">
                <span className="text-[9px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider leading-none flex items-center gap-1">
                  <Wallet size={11} className="shrink-0 text-[#8b6f47] dark:text-[#d4a574]" />
                  <span>{effectiveCashGiven > effectiveTotal ? "Tiền thừa" : "Biến động nợ"}</span>
                </span>
                {effectiveCashGiven > effectiveTotal ? (
                  <m.span
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)] leading-none"
                  >
                    Thối lại
                  </m.span>
                ) : (
                  <m.span
                    key={effectiveDebtAfter > effectiveDebtBefore ? "up" : effectiveDebtAfter < effectiveDebtBefore ? "down" : "same"}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded-full transition-all duration-300 leading-none",
                      effectiveDebtAfter > effectiveDebtBefore
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                        : effectiveDebtAfter < effectiveDebtBefore
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : "bg-black/[0.05] dark:bg-white/[0.05] text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {effectiveDebtAfter > effectiveDebtBefore ? "+ Tăng nợ" : effectiveDebtAfter < effectiveDebtBefore ? "- Giảm nợ" : "Không đổi"}
                  </m.span>
                )}
              </div>

              {/* Bottom row: Before -> Arrow -> After */}
              <div className="flex items-center justify-between gap-1.5 mt-auto relative z-10 pb-0.5">
                {/* Before */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 leading-none mb-0.5">
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Trước</span>
                    {effectiveDebtBefore !== 0 ? (
                      <span className={cn(
                        "text-[7.5px] font-black uppercase px-1 py-0.5 rounded-md border leading-none shrink-0",
                        effectiveDebtBefore > 0 ? "text-rose-600 bg-rose-500/10 border-rose-500/25 dark:text-rose-400" : "text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400"
                      )}>
                        {effectiveDebtBefore > 0 ? "Khách nợ" : "Mình nợ"}
                      </span>
                    ) : (
                      <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase shrink-0 leading-none">Hết nợ</span>
                    )}
                  </div>
                  <m.div
                    key={Math.abs(effectiveDebtBefore)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "text-xs font-black tracking-tight tabular-nums truncate leading-tight",
                      effectiveDebtBefore > 0 ? "text-rose-500" : effectiveDebtBefore < 0 ? "text-emerald-500" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {formatNumber(Math.abs(effectiveDebtBefore))}
                    <span className="text-[9px] font-normal ml-0.5">đ</span>
                  </m.div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground shrink-0 shadow-2xs">
                  <ArrowRight size={10} strokeWidth={2.5} />
                </div>

                {/* After */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-end gap-1 leading-none mb-0.5">
                    {effectiveCashGiven > effectiveTotal ? (
                      <span className="text-[7.5px] font-black uppercase px-1 py-0.5 rounded-md border bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300 leading-none shrink-0">
                        Thối lại
                      </span>
                    ) : effectiveDebtAfter !== 0 ? (
                      <span className={cn(
                        "text-[7.5px] font-black uppercase px-1 py-0.5 rounded-md border leading-none shrink-0",
                        effectiveDebtAfter > 0 ? "text-rose-600 bg-rose-500/10 border-rose-500/25 dark:text-rose-400" : "text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400"
                      )}>
                        {effectiveDebtAfter > 0 ? "Khách nợ" : "Mình nợ"}
                      </span>
                    ) : (
                      <span className="text-[7.5px] font-black uppercase px-1 py-0.5 rounded-md border bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 leading-none shrink-0">
                        Hết nợ
                      </span>
                    )}
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Sau đơn</span>
                  </div>
                  <m.div
                    key={effectiveCashGiven > effectiveTotal ? Math.max(0, effectiveCashGiven - effectiveTotal) : Math.abs(effectiveDebtAfter)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "text-xs sm:text-sm font-black tracking-tight tabular-nums truncate leading-tight",
                      effectiveCashGiven > effectiveTotal
                        ? "text-amber-700 dark:text-amber-400"
                        : effectiveDebtAfter > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : effectiveDebtAfter < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-800 dark:text-white"
                    )}
                  >
                    {formatNumber(effectiveCashGiven > effectiveTotal ? Math.max(0, effectiveCashGiven - effectiveTotal) : Math.abs(effectiveDebtAfter))}
                    <span className="text-[9px] font-normal ml-0.5">đ</span>
                  </m.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </m.div>

      {/* 2. Floating Total & Payment Bubbles (Bottom-Right) */}
      <m.div
        key="total-bubble"
        id="total-bubble"
        data-bubble="total-container"
        layout
        initial={false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18, ease: "easeInOut" } }}
        className="absolute bottom-3 right-3 z-[110] pointer-events-none flex items-end gap-3"
      >
        {/* In Classic mode: Show Cash Given (F1) Bubble when isCash */}
        {isClassic && isCash && (
          <div
            key="cash-bubble"
            id="cash-bubble"
            data-bubble="cash"
            style={cashStyle}
            onClick={() => {
              cashGivenInputRef?.current?.focus();
              cashGivenInputRef?.current?.select();
            }}
            className="pointer-events-auto flex items-start group/cash-calculator cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] p-3 px-4 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden min-w-[190px] h-[74px]"
          >
            <RefreshCcw 
              className="absolute -right-3 -bottom-3 w-20 h-20 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/cash-calculator:scale-110 pointer-events-none select-none" 
              style={cashStyle?.color ? { color: cashStyle.color, opacity: 0.1 } : undefined} 
            />
            <div className="flex flex-col justify-center h-full relative z-10 w-full">
              <span 
                className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] mb-0.5 leading-normal whitespace-nowrap" 
                style={cashStyle?.color ? { color: cashStyle.color } : undefined}
              >
                Khách đưa (F1)
              </span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center min-w-[65px] group/input-wrapper">
                  <span className="invisible whitespace-pre font-black text-lg px-1 pointer-events-none tabular-nums select-none">
                    {formatNumber(cashGiven) || "0"}
                  </span>
                  <input 
                    id="cash-given-compact" 
                    ref={cashGivenInputRef} 
                    type="text" 
                    style={cashStyle?.color ? { color: cashStyle.color } : undefined} 
                    className="absolute inset-0 w-full h-full bg-transparent border-b-2 border-[#8b6f47]/30 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none font-black text-lg text-[#2d5016] dark:text-emerald-400 p-0 tabular-nums transition-all z-10" 
                    value={formatNumber(cashGiven)} 
                    autoComplete="off" 
                    onChange={e => onChangeCashGiven?.(parseFloat(e.target.value.replace(/,/g, "")) || 0)} 
                    onFocus={e => e.target.select()} 
                  />
                </div>
                {cashGiven > 0 && (
                  <div className="flex flex-col items-end border-l border-[#8b6f47]/20 dark:border-[#d4a574]/20 pl-2 py-0.5 overflow-hidden">
                    <span 
                      className="text-[7.5px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase leading-none mb-0.5 whitespace-nowrap" 
                      style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                    >
                      Tiền thối
                    </span>
                    <span className={cn("text-base font-black tabular-nums transition-colors", cashGiven > effectiveTotal ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 opacity-50")}>
                      {formatNumber(Math.max(0, cashGiven - effectiveTotal))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* In Debt mode: Show Amount Paid (F1) Bubble */}
        {!isCash && (
          <div
            key="debt-payment-bubble"
            id="debt-payment-bubble"
            data-bubble="debt-payment"
            style={cashStyle}
            onClick={() => {
              activeAmountPaidRef?.current?.focus();
              activeAmountPaidRef?.current?.select();
            }}
            className="pointer-events-auto flex items-start group/pay-calculator cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] p-3 px-4 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 bg-[#fbf9f4] dark:bg-[#1a1e17] hover:border-[#2d5016] dark:hover:border-emerald-400 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] relative overflow-hidden min-w-[210px] h-[74px]"
          >
            <Coins 
              className="absolute -right-3 -bottom-3 w-20 h-20 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 transition-transform group-hover/pay-calculator:scale-110 pointer-events-none select-none" 
              style={cashStyle?.color ? { color: cashStyle.color, opacity: 0.1 } : undefined} 
            />
            <div className="flex flex-col justify-center h-full relative z-10 w-full">
              <div className="flex items-center justify-between mb-0.5 leading-normal gap-2">
                <span 
                  className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8b6f47] dark:text-[#d4a574] whitespace-nowrap" 
                  style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                >
                  Khách thanh toán (F1):
                </span>
                <div className="flex items-center gap-1 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeAmountPaid?.(effectiveTotal);
                    }}
                    className="px-1.5 py-0.5 bg-emerald-600/15 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-400 dark:hover:text-white rounded-md text-[8px] font-black uppercase tracking-wider border border-emerald-500/30 transition-all cursor-pointer active:scale-95"
                    title="Khách trả toàn bộ tiền đơn này"
                  >
                    Trả hết
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeAmountPaid?.(0);
                    }}
                    className="px-1.5 py-0.5 bg-rose-600/15 hover:bg-rose-600 text-rose-700 hover:text-white dark:text-rose-400 dark:hover:text-white rounded-md text-[8px] font-black uppercase tracking-wider border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                    title="Khách nợ toàn bộ (trả 0đ)"
                  >
                    Nợ hết
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center min-w-[75px] group/input-wrapper flex-1">
                  <span className="invisible whitespace-pre font-black text-lg px-1 pointer-events-none tabular-nums select-none">
                    {formatNumber(effectiveAmountPaid) || "0"}
                  </span>
                  <input 
                    id="debt-amount-paid-compact" 
                    ref={activeAmountPaidRef} 
                    type="text" 
                    readOnly={isRemoteInspect}
                    style={cashStyle?.color ? { color: cashStyle.color } : undefined} 
                    className={cn(
                      "absolute inset-0 w-full h-full bg-transparent border-b-2 border-[#8b6f47]/30 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none font-black text-lg text-[#2d5016] dark:text-emerald-400 p-0 tabular-nums transition-all z-10",
                      isRemoteInspect && "opacity-75 cursor-not-allowed"
                    )}
                    value={formatNumber(effectiveAmountPaid)} 
                    autoComplete="off" 
                    onChange={e => onChangeAmountPaid?.(parseFloat(e.target.value.replace(/,/g, "")) || 0)} 
                    onFocus={e => e.target.select()} 
                  />
                </div>
                <div className="flex flex-col items-end border-l border-[#8b6f47]/20 dark:border-[#d4a574]/20 pl-2 py-0.5 overflow-hidden shrink-0">
                  <span 
                    className="text-[7.5px] font-black uppercase leading-none mb-0.5 whitespace-nowrap" 
                    style={cashStyle?.color ? { color: cashStyle.color } : undefined}
                  >
                    {effectiveAmountPaid > effectiveTotal ? "Giảm nợ cũ" : "Còn nợ đơn"}
                  </span>
                  <span className={cn(
                    "text-base font-black tabular-nums transition-colors", 
                    effectiveAmountPaid > effectiveTotal 
                      ? "text-sky-600 dark:text-sky-400" 
                      : ((effectiveTotal - effectiveAmountPaid) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")
                  )}>
                    {formatNumber(effectiveAmountPaid > effectiveTotal ? (effectiveAmountPaid - effectiveTotal) : Math.max(0, effectiveTotal - effectiveAmountPaid))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Toggle Pill (Cash vs Debt) */}
        {(partner || isRemoteInspect) && (
          <div
            key="payment-toggle-bubble"
            data-bubble="payment"
            style={paymentStyle}
            className="w-[155px] pointer-events-auto flex items-center bg-[#fbf9f4] dark:bg-[#1a1e17] backdrop-blur-xl p-1 rounded-2xl border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/35 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] hover:border-[#2d5016] dark:hover:border-emerald-400 group/payment-toggle relative h-[56px] transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <div
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl shadow-md z-0 pointer-events-none transition-[left] duration-150 ease-out"
              style={{
                ...getBubbleBadgeStyle(cartColorConfig, 'payment'),
                left: isCash ? "4px" : "calc(50%)"
              }}
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
              className={cn("flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-150 relative z-10 gap-0.5 cursor-pointer", isCash ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400")}
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
              className={cn("flex-1 h-full rounded-lg flex flex-col items-center justify-center transition-colors duration-150 relative z-10 gap-0.5 cursor-pointer", !isCash ? "" : "text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400")}
            >
              <History size={13} className={cn(!isCash ? "opacity-100" : "opacity-40")} />
              <span className="text-[9px] font-black uppercase tracking-wider">Ghi nợ</span>
            </button>
          </div>
        )}

        {/* Total Amount Bubble */}
        <div
          key="total-amount-bubble"
          id="total-amount-bubble"
          data-bubble="total"
          onMouseDown={isAdmin ? onMouseDownProfit : undefined}
          onMouseUp={isAdmin ? onMouseUpProfit : undefined}
          onMouseLeave={isAdmin ? onMouseUpProfit : undefined}
          onTouchStart={isAdmin ? onMouseDownProfit : undefined}
          onTouchEnd={isAdmin ? onMouseUpProfit : undefined}
          style={totalStyle}
          className={cn(
            "px-6 py-3 rounded-2xl border-2 bg-[#fbf9f4] dark:bg-[#1a1e17] flex flex-col items-end group/total pointer-events-auto relative overflow-hidden select-none cursor-pointer transition-[border-color,background-color,box-shadow] duration-250",
            (isAdmin && isProfitRevealed) 
              ? "border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.3),0_16px_36px_-2px_rgba(16,185,129,0.35)] dark:shadow-[0_0_0_2px_rgba(52,211,153,0.3),0_20px_40px_-2px_rgba(16,185,129,0.3)] min-w-[215px] sm:min-w-[235px]" 
              : "border-[#8b6f47]/40 dark:border-[#d4a574]/35 shadow-[0_10px_22px_-2px_rgba(139,111,71,0.24)] dark:shadow-[0_12px_24px_-2px_rgba(0,0,0,0.7)] hover:shadow-[0_14px_28px_-2px_rgba(139,111,71,0.3)] hover:border-[#2d5016] dark:hover:border-emerald-400 min-w-[170px]"
          )}
          title={isAdmin ? "Bấm giữ để mở Lợi nhuận bí mật đơn hàng" : "Tổng tiền đơn hàng"}
        >
          <Wallet className="absolute -left-8 -bottom-8 w-36 h-36 text-[#2d5016]/5 dark:text-emerald-500/5 -rotate-12 transition-transform group-hover/total:scale-110 group-hover/total:-rotate-6 pointer-events-none select-none" />

          {/* Secret Profit Ambient Glow */}
          <AnimatePresence>
            {(isAdmin && isProfitRevealed) && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 dark:bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Header Label with Transition */}
          <div className="flex items-center gap-1.5 mb-1 z-10 relative">
            <div 
              className={cn("w-2 h-2 rounded-full transition-all duration-300", (isAdmin && isProfitRevealed) ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping" : "animate-pulse")} 
              style={!(isAdmin && isProfitRevealed) ? { 
                backgroundColor: (cartColorConfig?.bubbleBorderColor && cartColorConfig.bubbleBorderColor !== 'default') 
                  ? cartColorConfig.bubbleBorderColor 
                  : (cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default') 
                    ? cartColorConfig.accentColor 
                    : '#10b981' 
              } : undefined} 
            />
            <div className="flex items-center gap-1.5">
              <span 
                className={cn(
                  "text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transition-colors",
                  (isAdmin && isProfitRevealed) ? "text-emerald-700 dark:text-emerald-300" : "text-[#8b6f47] dark:text-[#d4a574]"
                )} 
                style={(!(isAdmin && isProfitRevealed) && totalStyle?.color) ? { color: totalStyle.color } : undefined}
              >
                Tổng cộng thanh toán
              </span>
              <AnimatePresence>
                {(isAdmin && isProfitRevealed) && (
                  <m.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-1.5 py-0.2 rounded-full text-[7.5px] font-black tracking-widest bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  >
                    BÍ MẬT
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Main Total Number - Always Prominent & Big with spring resize flip */}
          <div className="relative z-10 overflow-hidden flex items-baseline justify-end min-h-[34px] sm:min-h-[38px] w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              <m.div 
                key={`total-${effectiveTotal}`}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, position: "absolute" }}
                transition={{
                  layout: { type: "spring", stiffness: 400, damping: 28 },
                  y: { type: "spring", stiffness: 450, damping: 26 },
                  opacity: { duration: 0.15 },
                  scale: { duration: 0.15 }
                }}
                className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums flex items-baseline gap-1 ml-auto text-[#2d5016] dark:text-emerald-400 whitespace-nowrap"
                style={totalStyle?.color ? { color: totalStyle.color } : undefined}
              >
                {formatNumber(effectiveTotal)}
                <span 
                  className="text-sm font-bold ml-0.5 text-emerald-600 dark:text-emerald-400"
                  style={totalStyle?.color ? { color: totalStyle.color } : undefined}
                >
                  đ
                </span>
              </m.div>
            </AnimatePresence>
          </div>

          {/* Secret Profit Drawer - Revealed smoothly on long-press */}
          <AnimatePresence>
            {(isAdmin && isProfitRevealed) && (
              <m.div
                layout
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{
                  height: { type: "spring", stiffness: 400, damping: 28 },
                  opacity: { duration: 0.18 },
                  marginTop: { duration: 0.18 }
                }}
                className="pt-2 border-t border-emerald-500/25 dark:border-emerald-400/25 flex items-center justify-between gap-3.5 w-full z-10 relative overflow-hidden"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1 leading-none mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Lợi nhuận đơn
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight drop-shadow-xs">
                    +{formatNumber(orderProfit)}đ
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 tabular-nums shrink-0">
                  <TrendingUp size={11} className="text-emerald-600 dark:text-emerald-400" />
                  {effectiveTotal > 0 ? ((orderProfit / effectiveTotal) * 100).toFixed(1) : 0}% lãi
                </span>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.div>

      {/* 3. Floating Scroll Down Cart Indicator */}
      <AnimatePresence>
        {canScrollDown && (
          <m.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={onScrollDownCart}
            className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-[115] cursor-pointer flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fbf9f4] dark:bg-[#1a1e17] border-2 border-[#8b6f47]/50 dark:border-[#d4a574]/50 shadow-[0_8px_20px_-2px_rgba(139,111,71,0.22)] dark:shadow-[0_10px_22px_-2px_rgba(0,0,0,0.6)] text-[#2d5016] dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:border-[#2d5016] dark:hover:border-emerald-400 transition-all duration-150 hover:-translate-y-0.5 hover:scale-105 active:scale-95 select-none group pointer-events-auto"
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
    prev.cartColorConfig?.bubbleLayoutStyle === next.cartColorConfig?.bubbleLayoutStyle &&
    prev.hasFertilizer === next.hasFertilizer &&
    prev.fertilizerItems?.length === next.fertilizerItems?.length &&
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
