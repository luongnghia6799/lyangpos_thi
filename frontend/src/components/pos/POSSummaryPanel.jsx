import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Coins, 
  Banknote, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  Pause, 
  Save, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  BookOpen, 
  ReceiptText, 
  ArrowLeftRight, 
  HandCoins, 
  RotateCw, 
  Leaf, 
  Users, 
  Phone, 
  MapPin, 
  Package, 
  History,
  Activity,
  ShoppingBag
} from 'lucide-react';
import { cn, formatNumber, formatCurrency, formatDate } from '@/lib/utils';
import MarqueeText from '@/components/widgets/MarqueeText';
import DynamicIcon from '@/components/widgets/DynamicIcon';
import CustomSelect from '@/components/forms/CustomSelect';
import { getBubbleComputedStyle, getButtonComputedStyle, getBubbleBadgeStyle } from '@/components/modals/CartColorCustomizerModal';

/**
 * POSSummaryPanel - Standalone High-Performance Summary & Payment Sidebar / Bottom Panel
 */
const POSSummaryPanel = React.memo(function POSSummaryPanel({
  mode = 'sidebar', // 'sidebar' | 'bottom'
  isSidebarExpanded = true,
  onToggleSidebar,
  bottomHeight = 105,
  onBottomHeightResize,
  onResetBottomHeight,
  isResizingBottom = false,

  // Partner info
  partner,
  partnerDebt = 0,
  debtBeforeOrder = 0,
  debtAfterOrder = 0,
  onOpenPartnerHistory,
  onFocusPartnerSearch,

  // Remote Inspect / Multi-terminal
  isRemoteInspect = false,
  remoteState = null,
  activeTerminalId = null,
  onRemoteAction,

  // Cart Data & Pricing
  cart = [],
  totalAmount = 0,
  isProfitRevealed = false,
  orderProfit = 0,
  onMouseDownProfit,
  onMouseUpProfit,

  // Payment State
  paymentMethod = 'Cash',
  onSelectPaymentMethod,
  amountPaid = 0,
  onChangeAmountPaid,
  cashGiven = 0,
  onChangeCashGiven,
  cashGivenInputRef,
  selectedBankId,
  onChangeBankId,
  bankList = [],

  // Shipping Info
  shippingActive = false,
  onToggleShipping,
  shippingAddress = '',
  onChangeShippingAddress,
  shippingPhone = '',
  onChangeShippingPhone,
  shippingCount = 0,
  onOpenShippingPanel,

  // Order Note
  orderNote = '',
  onChangeOrderNote,

  // Quick Actions & Modals
  onOpenQuickDebt,
  onOpenQuickVoucher,
  onHoldOrder,
  onSaveOrder,
  onSaveAndPrintOrder,
  isSaving = false,

  // Prev / Next Order
  onNavigateOrder,
  historyOrderIndex = 0,

  // Theme & Styling
  cartColorConfig,
  onToggleTheme,

  // Partner popout
  partnerPopoutOpen = false,
  onTogglePartnerPopout,
  partnerPopoutRef,
  partnerPopoutType = 'debt',
  onChangePartnerPopoutType,
  isPartnerHistoryLoading = false,
  lastDebtTx = null,
  lastCashTx = null,
  onSelectHistoryTx
}) {
  const isBottom = mode === 'bottom';

  // Derived variables for display
  const effectiveTotal = isRemoteInspect
    ? remoteState?.total_amount || (remoteState?.cart || []).reduce((acc, it) => acc + (Number(it.price || it.sale_price) || 0) * (Number(it.quantity) || 1), 0)
    : totalAmount;

  const effectivePartner = isRemoteInspect ? remoteState?.partner : partner;
  const effectivePartnerName = isRemoteInspect
    ? remoteState?.partner_name || effectivePartner?.name || "Khách máy trạm"
    : partner ? partner.name : "Khách bán lẻ";

  const effectiveDebt = effectivePartner?.debt_balance || 0;
  const effectivePayMethod = isRemoteInspect ? remoteState?.payment_method || "Cash" : paymentMethod;
  const effectiveCartLength = isRemoteInspect ? (remoteState?.cart || []).length : cart.length;
  const effectiveAmountPaid = isRemoteInspect ? (effectivePayMethod === "Cash" ? effectiveTotal : remoteState?.amount_paid || 0) : amountPaid;
  const effectiveCashGiven = isRemoteInspect ? remoteState?.cash_given || 0 : cashGiven;
  const effectiveDebtBefore = isRemoteInspect ? effectiveDebt : debtBeforeOrder;
  const effectiveDebtAfter = isRemoteInspect
    ? (effectivePayMethod === "Debt" ? effectiveDebtBefore + (effectiveTotal >= 0 ? effectiveTotal - effectiveAmountPaid : effectiveTotal + effectiveAmountPaid) : effectiveDebtBefore)
    : debtAfterOrder;

  // ==========================================
  // RENDER BOTTOM BAR MODE
  // ==========================================
  if (isBottom) {
    return (
      <div
        style={{
          minHeight: `${bottomHeight}px`,
          height: `${bottomHeight}px`
        }}
        className={cn(
          "relative mt-1 p-1 px-1.5 rounded-2xl shrink-0 no-print flex flex-col justify-center overflow-visible transition-[height] duration-75 bg-transparent border-0 shadow-none",
          isResizingBottom && "select-none"
        )}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={onBottomHeightResize}
          onDoubleClick={onResetBottomHeight}
          className="absolute -top-1.5 left-0 right-0 h-3 cursor-row-resize flex items-center justify-center group/resize-bar z-30 select-none"
          title="Kéo lên/xuống để chỉnh chiều cao (Nhấp đúp để đặt lại mặc định)"
        >
          <div
            className={cn(
              "w-16 h-1 rounded-full transition-all shadow-sm",
              isResizingBottom
                ? "bg-emerald-500 h-1.5 w-24 shadow-emerald-500/50"
                : "bg-slate-400/40 dark:bg-slate-600/40 group-hover/resize-bar:bg-emerald-500 group-hover/resize-bar:h-1.5 group-hover/resize-bar:w-20"
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-stretch w-full h-full relative z-10">
          {/* 1. Partner & Quick Sổ Nợ / Thu Chi (Cols: 2) */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="md:col-span-2 flex flex-col justify-between gap-1 min-w-0 h-full"
          >
            <div
              onClick={() => {
                effectivePartner ? onOpenPartnerHistory?.(effectivePartner) : onFocusPartnerSearch?.();
              }}
              className={cn(
                "flex-1 min-h-[34px] relative overflow-hidden p-1 px-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] min-w-0 flex flex-col justify-between group/debt-card select-none",
                effectiveDebt > 0
                  ? "bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#881337] dark:from-[#4c0519] dark:via-[#881337] dark:to-[#4c0519] text-white border-rose-400/50 shadow-[0_0_18px_rgba(244,63,94,0.35)] hover:shadow-[0_0_25px_rgba(244,63,94,0.55)]"
                  : effectiveDebt < 0
                  ? "bg-gradient-to-br from-[#14532d] via-[#166534] to-[#14532d] text-white border-emerald-400/50 shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.55)]"
                  : "bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] dark:from-[#0d281e] dark:via-[#164230] dark:to-[#0d281e] text-white border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)]"
              )}
              style={{
                ...getBubbleComputedStyle(cartColorConfig, 'partner'),
                ...(effectiveDebt <= 0 && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default'
                  ? {
                      background: `linear-gradient(135deg, ${cartColorConfig.accentColor}, ${cartColorConfig.borderColor !== 'default' ? cartColorConfig.borderColor : cartColorConfig.accentColor}dd)`,
                      borderColor: cartColorConfig.borderColor !== 'default' ? cartColorConfig.borderColor : `${cartColorConfig.accentColor}80`,
                      boxShadow: cartColorConfig.enableGlow !== false ? `0 0 20px ${cartColorConfig.accentColor}35` : undefined
                    }
                  : {})
              }}
              title={effectivePartner ? `Xem lịch sử nợ của ${effectivePartnerName}` : "Chưa chọn đối tác"}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -right-1.5 -bottom-2 opacity-15 text-white pointer-events-none -rotate-6 transition-transform group-hover/debt-card:scale-110 select-none">
                <Wallet size={42} strokeWidth={1.5} />
              </div>
              <div className="flex items-center justify-between w-full relative z-10 pt-0.5">
                <span
                  className={cn("text-[9px] font-black uppercase tracking-wider leading-normal", effectiveDebt > 0 ? "text-rose-200" : "text-emerald-200")}
                  style={getBubbleComputedStyle(cartColorConfig, "partner")?.color ? { color: getBubbleComputedStyle(cartColorConfig, "partner").color } : undefined}
                >
                  DƯ NỢ
                </span>
                {effectivePartner && effectiveDebt !== 0 && (
                  <m.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 transition-all leading-normal border shadow-xs",
                      effectiveDebt > 0 ? "bg-white/20 text-rose-100 border-white/30" : "bg-white/20 text-emerald-100 border-white/30"
                    )}
                  >
                    {effectiveDebt > 0 ? "Khách nợ" : "Mình nợ"}
                  </m.span>
                )}
              </div>
              <m.div
                key={Math.abs(effectiveDebt || 0)}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={getBubbleComputedStyle(cartColorConfig, "partner")?.color ? { color: getBubbleComputedStyle(cartColorConfig, "partner").color } : undefined}
                className="text-sm lg:text-base font-black tracking-tight tabular-nums truncate leading-tight mt-auto text-right pb-0.5 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] relative z-10"
              >
                {formatNumber(Math.abs(effectiveDebt || 0))}
                <span className="text-[10px] font-normal ml-0.5 opacity-85">đ</span>
              </m.div>
            </div>

            <div className="flex-1 min-h-[26px] max-h-9 flex items-stretch gap-1">
              <button
                type="button"
                onClick={onOpenQuickDebt}
                style={getButtonComputedStyle(cartColorConfig, 'buttons')}
                className="relative overflow-hidden flex-1 h-full flex items-center justify-center rounded-xl border border-primary/25 dark:border-primary/30 bg-card/40 text-foreground text-[9px] font-black hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-[0_0_12px_var(--primary-color)]/25 transition-all text-center tracking-wider shadow-xs hover:scale-[1.02] active:scale-[0.98] group/sno backdrop-blur-sm cursor-pointer"
                title="Sổ ghi nợ"
              >
                <div className="absolute -right-1 -bottom-2 opacity-[0.09] dark:opacity-[0.13] text-current pointer-events-none -rotate-6 transition-transform group-hover/sno:scale-115 select-none">
                  <History size={30} strokeWidth={1.8} />
                </div>
                <span className="relative z-10">SỔ NỢ</span>
              </button>
              <button
                type="button"
                onClick={onOpenQuickVoucher}
                style={getButtonComputedStyle(cartColorConfig, 'buttons')}
                className="relative overflow-hidden flex-1 h-full flex items-center justify-center rounded-xl border border-primary/25 dark:border-primary/30 bg-card/40 text-foreground text-[9px] font-black hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-[0_0_12px_var(--primary-color)]/25 transition-all text-center tracking-wider shadow-xs hover:scale-[1.02] active:scale-[0.98] group/thuchi backdrop-blur-sm cursor-pointer"
                title="Thu / Chi"
              >
                <div className="absolute -right-1 -bottom-2 opacity-[0.09] dark:opacity-[0.13] text-current pointer-events-none -rotate-6 transition-transform group-hover/thuchi:scale-115 select-none">
                  <Coins size={30} strokeWidth={1.8} />
                </div>
                <span className="relative z-10">THU/CHI</span>
              </button>
            </div>
          </m.div>

          {/* 2. Payment Methods & Amount Paid Input (Cols: 3) */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="md:col-span-3 flex flex-col justify-between gap-1 h-full"
          >
            <div className="flex-1 min-h-[26px] max-h-9 flex items-stretch w-full gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isRemoteInspect) {
                    onRemoteAction?.({ payment_method: 'Cash' });
                  } else {
                    onSelectPaymentMethod('Cash');
                    onChangeAmountPaid(effectiveTotal);
                  }
                }}
                className={cn(
                  "relative overflow-hidden flex-1 h-full rounded-xl flex items-center justify-center text-[9px] font-black tracking-wider transition-all active:scale-95 cursor-pointer group/cash backdrop-blur-sm",
                  effectivePayMethod === "Cash"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_18px_rgba(16,185,129,0.45)] border border-emerald-400/60"
                    : "bg-card/40 text-foreground border border-primary/25 dark:border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-[0_0_12px_var(--primary-color)]/20"
                )}
                style={effectivePayMethod === 'Cash' && cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default'
                  ? {
                      background: `linear-gradient(90deg, ${cartColorConfig.accentColor}, ${cartColorConfig.borderColor !== 'default' ? cartColorConfig.borderColor : cartColorConfig.accentColor})`,
                      borderColor: cartColorConfig.borderColor !== 'default' ? cartColorConfig.borderColor : `${cartColorConfig.accentColor}80`,
                      boxShadow: cartColorConfig.enableGlow !== false ? `0 0 18px ${cartColorConfig.accentColor}50` : undefined
                    }
                  : undefined}
              >
                <div className={cn("absolute -right-1 -bottom-2 pointer-events-none -rotate-6 transition-transform group-hover/cash:scale-110 select-none", effectivePayMethod === "Cash" ? "opacity-25 text-white" : "opacity-[0.09] dark:opacity-[0.13] text-current")}>
                  <Banknote size={34} strokeWidth={1.8} />
                </div>
                <span className="relative z-10">TIỀN MẶT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isRemoteInspect) {
                    onRemoteAction?.({ payment_method: 'Debt' });
                  } else {
                    onSelectPaymentMethod('Debt');
                    onChangeAmountPaid(0);
                  }
                }}
                className={cn(
                  "relative overflow-hidden flex-1 h-full rounded-xl flex items-center justify-center text-[9px] font-black tracking-wider transition-all active:scale-95 cursor-pointer group/debt backdrop-blur-sm",
                  effectivePayMethod === "Debt"
                    ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_18px_rgba(244,63,94,0.45)] border border-rose-400/60"
                    : "bg-card/40 text-foreground border border-primary/25 dark:border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-[0_0_12px_var(--primary-color)]/20"
                )}
              >
                <div className={cn("absolute -right-1 -bottom-2 pointer-events-none -rotate-6 transition-transform group-hover/debt:scale-110 select-none", effectivePayMethod === "Debt" ? "opacity-25 text-white" : "opacity-[0.09] dark:opacity-[0.13] text-current")}>
                  <CreditCard size={34} strokeWidth={1.8} />
                </div>
                <span className="relative z-10">CÔNG NỢ</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectPaymentMethod('Transfer')}
                className={cn(
                  "relative overflow-hidden flex-1 h-full rounded-xl flex items-center justify-center text-[9px] font-black tracking-wider transition-all active:scale-95 cursor-pointer group/ck backdrop-blur-sm",
                  effectivePayMethod === "Transfer"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_18px_rgba(59,130,246,0.45)] border border-blue-400/60"
                    : "bg-card/40 text-foreground border border-primary/25 dark:border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-[0_0_12px_var(--primary-color)]/20"
                )}
              >
                <div className={cn("absolute -right-1 -bottom-2 pointer-events-none -rotate-6 transition-transform group-hover/ck:scale-110 select-none", effectivePayMethod === "Transfer" ? "opacity-25 text-white" : "opacity-[0.09] dark:opacity-[0.13] text-current")}>
                  <Sparkles size={34} strokeWidth={1.8} />
                </div>
                <span className="relative z-10">C/K</span>
              </button>
            </div>

            {effectivePayMethod === "Transfer" ? (
              <CustomSelect
                className="flex-1 min-h-[30px] max-h-10 w-full p-1 bg-card/40 border border-primary/25 dark:border-primary/30 rounded-xl font-bold text-xs outline-none text-foreground flex items-center shadow-xs focus-within:border-primary focus-within:shadow-[0_0_15px_var(--primary-color)]/25 backdrop-blur-sm"
                value={selectedBankId}
                onChange={val => onChangeBankId(val)}
                options={bankList.map(b => ({
                  value: b.id,
                  label: `${b.bank_name} - ${b.account_number}`
                }))}
              />
            ) : (
              <div className="flex-1 min-h-[30px] max-h-10 relative overflow-hidden flex items-center bg-card/40 rounded-xl border border-primary/25 dark:border-primary/30 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-[0_0_16px_var(--primary-color)]/30 group/pay-input transition-all duration-300 backdrop-blur-sm">
                <div className="absolute right-16 -bottom-3 opacity-[0.06] dark:opacity-[0.08] text-foreground pointer-events-none -rotate-6 select-none">
                  <Package size={42} strokeWidth={1.5} />
                </div>
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase tracking-widest pointer-events-none z-10">
                  Thanh toán:
                </span>
                <input
                  type="text"
                  readOnly={effectivePayMethod === "Cash" || effectivePayMethod === "Pending" || isRemoteInspect}
                  className={cn(
                    "w-full h-full pl-22 pr-3 text-right font-black text-base md:text-lg outline-none !border-none !shadow-none bg-transparent tabular-nums flex items-center transition-colors duration-300 relative z-10",
                    effectivePayMethod === "Cash" || effectivePayMethod === "Pending" || isRemoteInspect
                      ? "text-primary/70 cursor-not-allowed"
                      : "text-primary"
                  )}
                  value={formatNumber(effectiveAmountPaid)}
                  onChange={e => onChangeAmountPaid(parseFloat(e.target.value.replace(/,/g, "")) || 0)}
                />
                {!isRemoteInspect && (effectivePayMethod === "Debt" || effectivePayMethod === "Transfer") && (
                  <button
                    type="button"
                    onClick={() => onChangeAmountPaid(effectiveTotal + (effectiveDebtBefore > 0 ? effectiveDebtBefore : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/pay-input:opacity-100 focus-within:opacity-100 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 text-[8.5px] font-black uppercase rounded-md border border-white/40 dark:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-200 active:scale-95 z-30 cursor-pointer"
                    title="Thanh toán toàn bộ đơn hàng và nợ cũ"
                  >
                    Trả hết
                  </button>
                )}
              </div>
            )}
          </m.div>

          {/* 3. Debt Delta / Change Display (Cols: 3) */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="md:col-span-3 h-full p-1.5 px-3 rounded-2xl bg-card/40 border border-primary/25 dark:border-primary/30 flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_0_18px_var(--primary-color)]/20 hover:border-primary/50 transition-all duration-300 relative overflow-hidden group/debt-change backdrop-blur-md"
          >
            <div className="absolute -right-2 -bottom-2 opacity-[0.06] dark:opacity-[0.09] text-current pointer-events-none -rotate-6 transition-transform group-hover/debt-change:scale-105 select-none">
              <ArrowLeftRight size={48} strokeWidth={1.5} />
            </div>
            <div className="flex items-center justify-between relative z-10 pt-0.5">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider leading-normal">
                {effectiveCashGiven > effectiveTotal ? "Tiền thừa" : "Biến động nợ"}
              </span>
              {effectiveCashGiven > effectiveTotal ? (
                <m.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] leading-normal"
                >
                  Thối lại
                </m.span>
              ) : (
                <m.span
                  key={effectiveDebtAfter > effectiveDebtBefore ? "up" : effectiveDebtAfter < effectiveDebtBefore ? "down" : "same"}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-full transition-all duration-300 leading-normal",
                    effectiveDebtAfter > effectiveDebtBefore
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                      : effectiveDebtAfter < effectiveDebtBefore
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : "bg-black/[0.05] dark:bg-white/[0.05] text-muted-foreground"
                  )}
                >
                  {effectiveDebtAfter > effectiveDebtBefore ? "+ Tăng nợ" : effectiveDebtAfter < effectiveDebtBefore ? "- Giảm nợ" : "Không đổi"}
                </m.span>
              )}
            </div>

            <div className="flex items-center justify-between gap-1.5 mt-auto relative z-10">
              {/* Before */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 leading-normal mb-0.5">
                  <span className="text-[8.5px] font-bold text-muted-foreground uppercase leading-normal">Trước</span>
                  {effectiveDebtBefore !== 0 ? (
                    <span className={cn(
                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border leading-normal shrink-0",
                      effectiveDebtBefore > 0 ? "text-rose-600 bg-rose-500/10 border-rose-500/25 dark:text-rose-400" : "text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400"
                    )}>
                      {effectiveDebtBefore > 0 ? "Khách nợ" : "Mình nợ"}
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-muted-foreground uppercase shrink-0 leading-normal">Hết nợ</span>
                  )}
                </div>
                <m.div
                  key={Math.abs(effectiveDebtBefore)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "text-xs lg:text-sm font-black tracking-tight tabular-nums truncate leading-tight transition-colors duration-300",
                    effectiveDebtBefore > 0 ? "text-rose-500" : effectiveDebtBefore < 0 ? "text-emerald-500" : "text-muted-foreground"
                  )}
                >
                  {formatNumber(Math.abs(effectiveDebtBefore))}
                  <span className="text-[9px] font-normal ml-0.5">đ</span>
                </m.div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground shrink-0">
                <ArrowRight size={11} strokeWidth={2.5} />
              </div>

              {/* After */}
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-end gap-1 leading-normal mb-0.5">
                  {effectiveCashGiven > effectiveTotal ? (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-300 leading-normal shrink-0">
                      Thối lại
                    </span>
                  ) : effectiveDebtAfter !== 0 ? (
                    <span className={cn(
                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border leading-normal shrink-0",
                      effectiveDebtAfter > 0 ? "text-rose-600 bg-rose-500/10 border-rose-500/25 dark:text-rose-400" : "text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400"
                    )}>
                      {effectiveDebtAfter > 0 ? "Khách nợ" : "Mình nợ"}
                    </span>
                  ) : (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 leading-normal shrink-0">
                      Hết nợ
                    </span>
                  )}
                  <span className="text-[8.5px] font-bold text-muted-foreground uppercase leading-normal">Sau đơn</span>
                </div>
                <m.div
                  key={effectiveCashGiven > effectiveTotal ? Math.max(0, effectiveCashGiven - effectiveTotal) : Math.abs(effectiveDebtAfter)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "text-sm lg:text-base font-black tracking-tight tabular-nums truncate leading-tight transition-colors duration-300",
                    effectiveCashGiven > effectiveTotal
                      ? "text-amber-700 dark:text-amber-400"
                      : effectiveDebtAfter > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : effectiveDebtAfter < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  )}
                >
                  {formatNumber(effectiveCashGiven > effectiveTotal ? Math.max(0, effectiveCashGiven - effectiveTotal) : Math.abs(effectiveDebtAfter))}
                  <span className="text-[9px] font-normal ml-0.5">đ</span>
                </m.div>
              </div>
            </div>
          </m.div>

          {/* 4. Total Amount & Action Buttons (Cols: 4) */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="md:col-span-4 flex items-stretch gap-1.5 h-full"
          >
            {/* Main Total Bubble */}
            <div
              onMouseDown={onMouseDownProfit}
              onMouseUp={onMouseUpProfit}
              onMouseLeave={onMouseUpProfit}
              onTouchStart={onMouseDownProfit}
              onTouchEnd={onMouseUpProfit}
              onClick={() => effectivePartner ? onOpenPartnerHistory?.(effectivePartner) : null}
              className="flex-1 h-full p-1.5 px-3.5 rounded-2xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white flex flex-col justify-between relative overflow-hidden select-none active:scale-[0.98] transition-all cursor-pointer min-h-0 border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)] group/total-main"
              style={{
                ...getBubbleComputedStyle(cartColorConfig, 'total'),
                ...(cartColorConfig?.accentColor && cartColorConfig.accentColor !== 'default'
                  ? {
                      background: `linear-gradient(135deg, ${cartColorConfig.accentColor}, ${cartColorConfig.borderColor !== 'default' ? cartColorConfig.borderColor : cartColorConfig.accentColor}dd)`,
                      borderColor: cartColorConfig.borderColor !== 'default' ? cartColorConfig.borderColor : `${cartColorConfig.accentColor}80`,
                      boxShadow: cartColorConfig.enableGlow !== false ? `0 0 25px ${cartColorConfig.accentColor}40` : undefined
                    }
                  : {})
              }}
              title="Bấm để xem lịch sử, bấm giữ để xem lợi nhuận đơn"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -right-3 -bottom-4 text-white/15 pointer-events-none -rotate-12 transition-transform group-hover/total-main:scale-110 group-hover/total-main:-rotate-6 select-none">
                <Wallet size={76} strokeWidth={1.2} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <span
                  className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-200"
                  style={getBubbleComputedStyle(cartColorConfig, "total")?.color ? { color: getBubbleComputedStyle(cartColorConfig, "total").color } : undefined}
                >
                  {isProfitRevealed ? "LỢI NHUẬN ĐƠN" : "TỔNG CỘNG ĐƠN HÀNG"}
                </span>
                {isProfitRevealed ? (
                  <span className="px-1.5 py-0.2 bg-white/20 rounded-lg text-[7px] font-black tracking-widest">BÍ MẬT</span>
                ) : (
                  <m.span
                    key={effectiveCartLength}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-lg bg-white/20 text-emerald-100 backdrop-blur-md shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                  >
                    {effectiveCartLength} món
                  </m.span>
                )}
              </div>
              <m.div
                key={isProfitRevealed ? orderProfit : effectiveTotal}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                style={getBubbleComputedStyle(cartColorConfig, "total")?.color ? { color: getBubbleComputedStyle(cartColorConfig, "total").color } : undefined}
                className="text-2xl md:text-3xl font-black tracking-tight truncate leading-tight tabular-nums mt-auto relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              >
                {formatNumber(isProfitRevealed ? orderProfit : effectiveTotal)}
                <span className="text-xs font-normal ml-0.5 opacity-90">đ</span>
              </m.div>
            </div>

            {/* Hold, Save, Print and Order Nav Buttons */}
            <div className="flex flex-col justify-between gap-1 shrink-0 min-w-[135px] h-full">
              <div className="flex-1 min-h-[28px] max-h-11 flex items-stretch gap-1 justify-between">
                <m.button
                  whileTap={{ scale: 0.95 }}
                  disabled={effectiveCartLength === 0 || isRemoteInspect}
                  onClick={onHoldOrder}
                  style={getButtonComputedStyle(cartColorConfig, 'hold')}
                  className="relative overflow-hidden flex-1 h-full bg-card/40 text-foreground rounded-xl flex items-center justify-center border border-primary/25 dark:border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-[0_0_14px_var(--primary-color)]/30 transition-all shadow-xs disabled:opacity-30 disabled:cursor-not-allowed group/btn-pause backdrop-blur-sm cursor-pointer"
                  title="Tạm đơn [F4]"
                >
                  <div className="absolute -right-1 -bottom-2 opacity-[0.08] dark:opacity-[0.12] text-current pointer-events-none -rotate-6 transition-transform group-hover/btn-pause:scale-115 select-none">
                    <Pause size={28} strokeWidth={1.8} />
                  </div>
                  <DynamicIcon id="pos.hold_btn" defaultIcon={Pause} label="Nút Tạm Đơn POS" size={16} strokeWidth={2.5} className="relative z-10" />
                </m.button>

                <m.button
                  whileTap={{ scale: 0.95 }}
                  disabled={effectiveCartLength === 0 || isSaving}
                  onClick={() => onSaveOrder(false)}
                  style={getButtonComputedStyle(cartColorConfig, 'save')}
                  className="relative overflow-hidden flex-1 h-full bg-card/40 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center border border-emerald-600/30 dark:border-emerald-400/30 hover:bg-emerald-500/15 hover:border-emerald-500/50 hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] transition-all shadow-xs group/btn-save backdrop-blur-sm cursor-pointer"
                  title="Lưu đơn [Ctrl+S]"
                >
                  <div className="absolute -right-1 -bottom-2 opacity-[0.08] dark:opacity-[0.12] text-current pointer-events-none -rotate-6 transition-transform group-hover/btn-save:scale-115 select-none">
                    <Save size={28} strokeWidth={1.8} />
                  </div>
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin relative z-10" />
                  ) : (
                    <DynamicIcon id="pos.save_btn" defaultIcon={Save} label="Nút Lưu Đơn POS" size={16} strokeWidth={2.5} className="relative z-10" />
                  )}
                </m.button>

                <m.button
                  whileTap={{ scale: 0.95 }}
                  disabled={effectiveCartLength === 0 || isSaving}
                  onClick={() => onSaveAndPrintOrder(true)}
                  style={getButtonComputedStyle(cartColorConfig, 'save_print')}
                  className="relative overflow-hidden flex-1 h-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_rgba(16,185,129,0.65)] border border-emerald-400/50 hover:scale-[1.02] active:scale-95 transition-all group/btn-print cursor-pointer"
                  title="Lưu và In hóa đơn [F9]"
                >
                  <div className="absolute -right-1 -bottom-2 text-white/15 pointer-events-none -rotate-6 transition-transform group-hover/btn-print:scale-115 select-none">
                    <Printer size={28} strokeWidth={1.8} />
                  </div>
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                  ) : (
                    <DynamicIcon id="pos.print_btn" defaultIcon={Printer} label="Nút Lưu & In Đơn POS" size={17} strokeWidth={2.5} className="relative z-10" />
                  )}
                </m.button>
              </div>

              {/* Prev / Next Order Navigation */}
              <div className="flex-1 min-h-[26px] max-h-8 flex items-stretch gap-1.5 w-full">
                <m.button
                  onClick={() => onNavigateOrder('prev')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 h-full rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-400/25 flex items-center justify-center shadow-xs hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                  title="Xem đơn trước"
                >
                  <ChevronLeft size={18} strokeWidth={2.8} />
                </m.button>
                <m.button
                  onClick={() => onNavigateOrder('next')}
                  disabled={historyOrderIndex === 0}
                  whileHover={historyOrderIndex === 0 ? {} : { scale: 1.03 }}
                  whileTap={historyOrderIndex === 0 ? {} : { scale: 0.95 }}
                  className={cn(
                    "flex-1 h-full rounded-xl border flex items-center justify-center shadow-xs transition-all",
                    historyOrderIndex === 0
                      ? "bg-black/[0.03] dark:bg-white/[0.03] text-emerald-700/30 dark:text-emerald-400/30 border-black/5 dark:border-white/5 cursor-not-allowed"
                      : "bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-400/25 hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
                  )}
                  title="Xem đơn kế tiếp"
                >
                  <ChevronRight size={18} strokeWidth={2.8} />
                </m.button>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER RIGHT SIDEBAR MODE
  // ==========================================
  return (
    <m.div
      initial={false}
      animate={{
        width: isSidebarExpanded ? "360px" : "90px"
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="flex flex-col bg-transparent min-h-0 relative z-[3000] shrink-0"
    >
      <div className="p-1 transition-colors relative flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {isSidebarExpanded ? (
            /* EXPANDED SIDEBAR */
            <m.div
              key="expanded-sidebar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="h-full flex flex-col relative bg-transparent border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/20 rounded-3xl p-3.5 shadow-2xl shadow-[#8b6f47]/10 dark:shadow-black/50 text-slate-800 dark:text-white"
            >
              {/* Collapse Button */}
              <m.button
                whileHover={{ scale: 1.15, x: 2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleSidebar(false)}
                className="absolute -left-5 top-7 w-9 h-9 bg-[#f6f2ea] dark:bg-[#151311] hover:bg-[#8b6f47] hover:text-white dark:hover:bg-[#d4a574] dark:hover:text-slate-900 rounded-full flex items-center justify-center text-[#8b6f47] dark:text-[#d4a574] border-2 border-[#8b6f47]/40 dark:border-[#d4a574]/40 z-[60] shadow-md hover:border-[#8b6f47] dark:hover:border-[#d4a574] transition-all cursor-pointer"
                title="Thu gọn bảng thanh toán"
              >
                <ChevronRight size={18} strokeWidth={3.5} />
              </m.button>

              <div className="flex flex-col gap-3 relative z-10 flex-1 overflow-y-auto pr-1 pb-1 scroll-smooth custom-scrollbar">
                {/* 1. Customer Info Card & Popout */}
                <div className="space-y-2.5">
                  <div
                    onClick={() => {
                      partner ? onOpenPartnerHistory?.(partner) : onFocusPartnerSearch?.();
                    }}
                    className="bg-transparent p-3 rounded-2xl border border-[#8b6f47]/25 dark:border-[#d4a574]/20 shadow-sm hover:border-[#2d5016]/40 dark:hover:border-emerald-500/40 transition-colors group/partner-sidebar cursor-pointer relative overflow-hidden"
                  >
                    <Users className="absolute -right-3 -bottom-3 w-20 h-20 text-[#8b6f47]/10 dark:text-[#d4a574]/10 -rotate-12 pointer-events-none select-none" />
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-[0.15em] whitespace-nowrap">
                            KHÁCH HÀNG
                          </span>
                          {partner && (
                            <span className="bg-[#8b6f47]/15 dark:bg-[#d4a574]/20 text-[#8b6f47] dark:text-[#d4a574] border border-[#8b6f47]/30 dark:border-[#d4a574]/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                              #{partner.id}
                            </span>
                          )}
                        </div>
                        {partner && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenPartnerHistory?.(partner);
                            }}
                            className="w-7 h-7 rounded-full bg-[#8b6f47]/15 hover:bg-[#2d5016] hover:text-white text-[#8b6f47] dark:text-[#d4a574] flex items-center justify-center border border-[#8b6f47]/30 dark:border-[#d4a574]/30 transition-all cursor-pointer shrink-0 z-20 partner-popout-trigger shadow-xs"
                            title="Xem lịch sử giao dịch"
                          >
                            <History size={13} strokeWidth={2.8} />
                          </button>
                        )}
                      </div>

                      <div className="font-black text-[#2d5016] dark:text-emerald-400 text-lg uppercase leading-normal">
                        <MarqueeText text={partner ? partner.name : "KHÁCH BÁN LẺ"} isActive={true} className="font-black text-[#2d5016] dark:text-emerald-400 text-lg uppercase leading-normal" />
                      </div>

                      {partner && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {partner.phone && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-black/[0.03] dark:bg-white/5 border border-[#8b6f47]/15 dark:border-white/10 px-2.5 py-1 rounded-xl w-full max-w-full overflow-hidden">
                              <Phone size={11} strokeWidth={3} className="shrink-0 text-[#8b6f47] dark:text-[#d4a574]" />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <MarqueeText text={partner.phone} isActive={true} className="text-xs font-bold text-slate-700 dark:text-slate-200" />
                              </div>
                            </div>
                          )}
                          {partner.address && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-black/[0.03] dark:bg-white/5 border border-[#8b6f47]/15 dark:border-white/10 px-2.5 py-1 rounded-xl w-full max-w-full overflow-hidden">
                              <MapPin size={11} strokeWidth={3} className="shrink-0 text-[#8b6f47] dark:text-[#d4a574]" />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <MarqueeText text={partner.address} isActive={true} className="text-xs font-bold text-slate-700 dark:text-slate-200" />
                              </div>
                            </div>
                          )}
                          {partner.cccd && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-black/[0.03] dark:bg-white/5 border border-[#8b6f47]/15 dark:border-white/10 px-2.5 py-1 rounded-xl w-full max-w-full overflow-hidden">
                              <Package size={11} strokeWidth={3} className="shrink-0 text-indigo-500" />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <MarqueeText text={`CCCD: ${partner.cccd}`} isActive={true} className="text-xs font-bold text-slate-700 dark:text-slate-200" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Note Textarea */}
                  <div className="relative bg-transparent rounded-xl border border-[#8b6f47]/20 dark:border-[#d4a574]/20 focus-within:border-[#2d5016] dark:focus-within:border-emerald-400/50 focus-within:ring-2 focus-within:ring-[#2d5016]/10 transition-colors shadow-2xs">
                    <div className="absolute left-3 top-3 text-[#8b6f47] dark:text-[#d4a574] z-10">
                      <Leaf size={16} />
                    </div>
                    <textarea
                      placeholder="Ghi chú đơn bán..."
                      className="w-full pl-9 pr-3 py-2.5 bg-transparent outline-none resize-none h-14 text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 italic"
                      value={orderNote}
                      onChange={e => onChangeOrderNote(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Total Amount Card */}
                <div className="space-y-2.5 pt-0.5">
                  <div
                    onClick={() => partner ? onOpenPartnerHistory?.(partner) : null}
                    className="bg-gradient-to-br from-[#1a3812] via-[#2d5016] to-[#1e3a10] text-white p-4.5 rounded-2xl border-2 border-emerald-400/50 relative overflow-hidden group/total-card flex flex-col justify-between cursor-pointer shadow-xl shadow-[#2d5016]/20"
                    title={partner ? "Xem lịch sử giao dịch khách hàng" : "Xem lịch sử đơn hàng"}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                    <ShoppingBag size={84} strokeWidth={1} className="absolute -right-3 -bottom-4 text-white/[0.08] pointer-events-none -rotate-12 select-none" />
                    <div className="w-full flex items-center justify-start relative z-10 mb-1">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/90 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-300" />
                        TỔNG CỘNG ĐƠN HÀNG
                      </div>
                    </div>
                    <div className="text-3xl lg:text-4xl font-black text-center text-white tracking-tight drop-shadow-md whitespace-nowrap overflow-hidden relative z-10">
                      {formatNumber(totalAmount)}
                      <span className="text-base font-bold opacity-80 ml-1">đ</span>
                    </div>
                  </div>

                  {/* Debt Summary Row */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-transparent border border-[#8b6f47]/20 dark:border-[#d4a574]/20 p-2.5 px-3.5 rounded-xl shadow-2xs hover:border-[#8b6f47]/35 transition-colors">
                      <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">
                        NỢ TRƯỚC ĐƠN:
                      </span>
                      <span className="font-black text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatNumber(debtBeforeOrder)}
                      </span>
                    </div>

                    {partner && (
                      <div className="flex justify-between items-center bg-transparent border border-[#8b6f47]/20 dark:border-[#d4a574]/20 p-2.5 px-3.5 rounded-xl shadow-2xs hover:border-[#8b6f47]/35 transition-colors">
                        <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">
                          NỢ HIỆN TẠI:
                        </span>
                        <span className="font-black text-sm text-amber-600 dark:text-amber-400 tabular-nums">
                          {formatNumber(partner.debt_balance || 0)}
                        </span>
                      </div>
                    )}

                    {/* Shipping Row */}
                    <div className="flex justify-between items-center bg-transparent border border-[#8b6f47]/20 dark:border-[#d4a574]/20 p-2.5 px-3.5 rounded-xl shadow-2xs hover:border-[#8b6f47]/35 transition-colors">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-[#2d5016] dark:text-emerald-400" />
                        <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] uppercase tracking-wider">
                          GIAO HÀNG TẬN NƠI:
                        </span>
                      </div>
                      <label
                        onClick={e => {
                          e.preventDefault();
                          onToggleShipping();
                        }}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <input type="checkbox" checked={!!shippingActive} readOnly={true} className="sr-only" />
                        <div className={cn(
                          "w-10 h-5.5 rounded-full transition-colors duration-200 relative border",
                          shippingActive ? "bg-[#2d5016] border-[#2d5016]" : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        )}>
                          <div className={cn(
                            "absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-md",
                            shippingActive ? "translate-x-[18px]" : "translate-x-0"
                          )} />
                        </div>
                      </label>
                    </div>

                    {shippingActive && (
                      <div className="overflow-hidden space-y-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl border border-[#8b6f47]/20 dark:border-emerald-500/30 p-3 mt-2 shadow-xs">
                        <input
                          type="text"
                          placeholder="Địa chỉ giao hàng..."
                          className="w-full p-2.5 bg-transparent border border-[#8b6f47]/20 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none"
                          value={shippingAddress}
                          onChange={e => onChangeShippingAddress(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Số điện thoại nhận hàng..."
                          className="w-full p-2.5 bg-transparent border border-[#8b6f47]/20 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:border-[#2d5016] dark:focus:border-emerald-400 outline-none"
                          value={shippingPhone}
                          onChange={e => onChangeShippingPhone(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Quick Action Buttons for Partner */}
                    {partner && (
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <m.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={onOpenQuickDebt}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/[0.03] dark:bg-white/[0.04] text-[#2d5016] dark:text-emerald-300 border border-[#8b6f47]/30 dark:border-emerald-500/50 hover:bg-[#2d5016] hover:text-white dark:hover:bg-emerald-600 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                        >
                          <BookOpen size={14} strokeWidth={2.5} />
                          <span>Ghi nợ</span>
                        </m.button>
                        <m.button
                          whileHover={{ y: -2, scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={onOpenQuickVoucher}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black/[0.03] dark:bg-white/[0.04] text-[#2d5016] dark:text-emerald-300 border border-[#8b6f47]/30 dark:border-emerald-500/50 hover:bg-[#2d5016] hover:text-white dark:hover:bg-emerald-600 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                        >
                          <ReceiptText size={14} strokeWidth={2.5} />
                          <span>Thu/Chi</span>
                        </m.button>
                      </div>
                    )}

                    {/* Payment Mode Selector */}
                    <div className="flex flex-col gap-2.5 pt-1">
                      <div className="flex bg-black/[0.03] dark:bg-white/[0.04] p-1.5 rounded-xl border border-[#8b6f47]/25 dark:border-[#d4a574]/20 gap-1.5 shadow-inner">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPaymentMethod("Cash");
                            onChangeAmountPaid(totalAmount);
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[10px] font-black cursor-pointer",
                            paymentMethod === "Cash"
                              ? "bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white shadow-md shadow-[#2d5016]/25 border border-emerald-400/30"
                              : "text-[#8b6f47] dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          TIỀN MẶT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPaymentMethod("Debt");
                            onChangeAmountPaid(0);
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[10px] font-black cursor-pointer",
                            paymentMethod === "Debt"
                              ? "bg-gradient-to-r from-[#8b6f47] to-[#b38f5d] dark:from-[#b38f5d] dark:to-[#d4a574] text-white shadow-md shadow-[#8b6f47]/25 border border-amber-300/30"
                              : "text-[#8b6f47] dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          CÔNG NỢ
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPaymentMethod("Transfer")}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[10px] font-black cursor-pointer",
                            paymentMethod === "Transfer"
                              ? "bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-600/25 border border-blue-400/30"
                              : "text-[#8b6f47] dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          C/K
                        </button>
                      </div>

                      {/* Bank Select if Transfer */}
                      {paymentMethod === "Transfer" && (
                        <div className="relative overflow-hidden flex items-center justify-between p-2.5 pl-3.5 bg-transparent border-2 border-blue-400/30 dark:border-blue-500/30 rounded-xl shadow-2xs">
                          <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase whitespace-nowrap">
                            TK Nhận:
                          </div>
                          <CustomSelect
                            className="w-full min-w-0 border-none shadow-none text-right justify-end font-bold text-xs bg-transparent text-slate-800 dark:text-white outline-none"
                            value={selectedBankId}
                            onChange={val => onChangeBankId(val)}
                            options={bankList.map(t => ({
                              value: t.id,
                              label: `${t.bank_name} - ${t.account_number}`
                            }))}
                          />
                        </div>
                      )}

                      {/* Cash Given Input */}
                      <div className="relative bg-transparent border-2 border-[#8b6f47]/25 dark:border-[#d4a574]/25 focus-within:border-[#2d5016] dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-[#2d5016]/15 rounded-xl shadow-2xs">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8b6f47] dark:text-emerald-300 uppercase z-10">
                          KHÁCH ĐƯA (F1):
                        </div>
                        <input
                          ref={cashGivenInputRef}
                          type="number"
                          className="w-full p-2.5 pl-36 text-right rounded-xl font-black text-xl outline-none bg-transparent text-[#2d5016] dark:text-white tabular-nums"
                          value={cashGiven === 0 ? "" : cashGiven}
                          placeholder="0"
                          id="cash-given-sidebar"
                          autoComplete="off"
                          onChange={e => onChangeCashGiven(parseFloat(e.target.value) || 0)}
                          onFocus={e => e.target.select()}
                        />
                      </div>

                      {/* Amount Paid Input */}
                      <div className="relative group/pay-sidebar bg-transparent border-2 border-[#8b6f47]/25 dark:border-[#d4a574]/25 focus-within:border-[#2d5016] dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-[#2d5016]/15 rounded-xl shadow-2xs">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8b6f47] dark:text-emerald-300 uppercase z-10">
                          THANH TOÁN:
                        </div>
                        <input
                          type="text"
                          readOnly={paymentMethod === "Cash" || paymentMethod === "Pending"}
                          className={cn(
                            "w-full p-2.5 pl-28 pr-4 text-right rounded-xl font-black text-xl outline-none bg-transparent tabular-nums",
                            paymentMethod === "Cash" || paymentMethod === "Pending"
                              ? "text-slate-400 dark:text-emerald-400/50 cursor-not-allowed"
                              : "text-[#2d5016] dark:text-white"
                          )}
                          value={formatNumber(amountPaid)}
                          autoComplete="off"
                          onChange={e => onChangeAmountPaid(parseFloat(e.target.value.replace(/,/g, "")) || 0)}
                        />
                        {(paymentMethod === "Debt" || paymentMethod === "Transfer") && (
                          <button
                            type="button"
                            onClick={() => onChangeAmountPaid(totalAmount + (debtBeforeOrder > 0 ? debtBeforeOrder : 0))}
                            className="absolute right-3 -top-2.5 opacity-0 group-hover/pay-sidebar:opacity-100 focus-within:opacity-100 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black rounded-full border border-emerald-400/40 shadow-md hover:scale-105 active:scale-95 z-30 uppercase cursor-pointer"
                            title="Thanh toán toàn bộ đơn hàng và nợ cũ"
                          >
                            Trả hết
                          </button>
                        )}
                      </div>

                      {/* Change Returned Bubble */}
                      {cashGiven > totalAmount && (
                        <div className="flex justify-between items-center bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-900/60 dark:via-teal-900/40 dark:to-emerald-900/60 border-2 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 p-3 px-4 rounded-xl shadow-xs overflow-hidden">
                          <span className="text-[10px] font-black uppercase tracking-wider">TIỀN THỐI LẠI:</span>
                          <span className="font-black text-base text-emerald-800 dark:text-emerald-300 tabular-nums">
                            {formatNumber(Math.max(0, cashGiven - totalAmount))}đ
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Bottom Action Buttons in Sidebar */}
              <div className="pt-2 space-y-2 border-t border-[#8b6f47]/20 dark:border-white/10 shrink-0">
                {/* Debt After Order Display Card */}
                <div className={cn(
                  "py-3.5 px-4.5 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden group/debt-card transition-all",
                  debtAfterOrder > 0
                    ? "bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 text-white border-2 border-rose-400/50 shadow-rose-600/30"
                    : "bg-gradient-to-br from-[#1a3812] via-[#2d5016] to-[#1e3a10] text-white border-2 border-emerald-400/50 shadow-[#2d5016]/20"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                  <div className="min-w-0 flex flex-col justify-center relative z-10">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] block mb-0.5 leading-tight",
                      debtAfterOrder > 0 ? "text-rose-200/90" : "text-emerald-200/90"
                    )}>
                      NỢ SAU ĐƠN:
                    </span>
                    <span className="text-3xl font-black tracking-tight block leading-tight tabular-nums text-white drop-shadow-md">
                      {formatNumber(Math.abs(debtAfterOrder))}
                      <span className="text-base font-bold opacity-80 ml-1">đ</span>
                    </span>
                  </div>
                  <Coins className="text-white/20 shrink-0 ml-2 select-none relative z-10" size={36} />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <m.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={cart.length === 0}
                      onClick={onHoldOrder}
                      className="flex-1 bg-transparent text-[#8b6f47] dark:text-[#d4a574] border-2 border-[#8b6f47]/35 dark:border-[#d4a574]/35 hover:bg-[#8b6f47] hover:text-white rounded-xl font-black py-2.5 text-sm uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      <Pause size={18} strokeWidth={2.5} />
                      <span>TẠM</span>
                    </m.button>
                    <m.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={cart.length === 0 || isSaving}
                      onClick={() => onSaveOrder(false)}
                      className="flex-1 bg-transparent text-[#2d5016] dark:text-emerald-400 border-2 border-[#2d5016]/40 dark:border-emerald-500/40 hover:bg-[#2d5016] hover:text-white dark:hover:bg-emerald-600 rounded-xl font-black py-2.5 text-sm uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      <Save size={18} strokeWidth={2.5} />
                      <span>LƯU</span>
                    </m.button>
                  </div>

                  <m.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={cart.length === 0 || isSaving}
                    onClick={() => onSaveAndPrintOrder(true)}
                    className="w-full bg-gradient-to-r from-[#2d5016] via-emerald-600 to-[#1e3a10] hover:brightness-110 text-white rounded-2xl flex items-center justify-center py-3.5 h-14 text-2xl font-black uppercase tracking-widest gap-2.5 shadow-xl shadow-[#2d5016]/25 border-2 border-emerald-400/40 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isSaving ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Printer size={24} strokeWidth={2.5} />
                        <span>IN</span>
                      </>
                    )}
                  </m.button>
                </div>
              </div>
            </m.div>
          ) : (
            /* MINI COLLAPSED SIDEBAR */
            <m.div
              key="mini-sidebar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="flex flex-col items-center py-6 gap-5 h-full relative z-10 no-print bg-transparent"
            >
              {/* Partner Icon & Popout */}
              <div
                onClick={onTogglePartnerPopout}
                style={getButtonComputedStyle(cartColorConfig, 'partner')}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors relative cursor-pointer partner-popout-trigger shadow-md shadow-[#8b6f47]/5",
                  partner
                    ? "bg-transparent text-[#2d5016] dark:text-emerald-400 border-[#8b6f47]/35 dark:border-[#d4a574]/35 hover:border-[#2d5016] dark:hover:border-emerald-400 hover:bg-[#8b6f47]/10"
                    : "bg-transparent text-[#8b6f47]/70 dark:text-[#d4a574]/70 border-[#8b6f47]/25 dark:border-[#d4a574]/25 hover:bg-black/5 dark:hover:bg-white/10"
                )}
                title={partner ? `Khách: ${partner.name}` : "Chưa chọn khách"}
              >
                <Activity size={24} />
                {partner && (
                  <div className="absolute -top-1.5 -right-2 bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border border-white/40 shadow-xs transition-transform z-20">
                    #{partner.id}
                  </div>
                )}
              </div>

              {/* Action Buttons in Mini Sidebar */}
              <div className="flex flex-col items-center gap-3.5 shrink-0 relative z-[50]">
                {partner && (
                  <m.button
                    whileHover={{ scale: 1.08, rotate: 5 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onOpenQuickDebt}
                    style={getButtonComputedStyle(cartColorConfig, 'quick_debt')}
                    className="w-14 h-14 bg-transparent text-[#8b6f47] dark:text-[#d4a574] rounded-2xl flex items-center justify-center border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 hover:border-[#2d5016] dark:hover:border-emerald-400 hover:text-[#2d5016] dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors group/qd relative overflow-hidden shadow-md shadow-[#8b6f47]/5 cursor-pointer"
                    title="Ghi nợ nhanh"
                  >
                    <BookOpen size={22} strokeWidth={2.5} className="relative z-20" />
                  </m.button>
                )}

                {partner && (
                  <m.button
                    whileHover={{ scale: 1.08, rotate: -5 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onOpenQuickVoucher}
                    style={getButtonComputedStyle(cartColorConfig, 'quick_voucher')}
                    className="w-14 h-14 bg-transparent text-[#8b6f47] dark:text-[#d4a574] rounded-2xl flex items-center justify-center border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 hover:border-[#2d5016] dark:hover:border-emerald-400 hover:text-[#2d5016] dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors group/qv relative overflow-hidden shadow-md shadow-[#8b6f47]/5 cursor-pointer"
                    title="Lập phiếu nhanh"
                  >
                    <ReceiptText size={22} strokeWidth={2.5} className="relative z-20" />
                  </m.button>
                )}

                <div className="relative group/ship-mini">
                  <m.button
                    whileHover={{ scale: 1.08, rotate: 8 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onOpenShippingPanel}
                    className="w-14 h-14 bg-transparent text-[#2d5016] dark:text-emerald-400 rounded-2xl flex items-center justify-center border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 hover:border-[#2d5016] dark:hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-[#2d5016] transition-colors group/ship relative overflow-hidden shadow-md shadow-[#8b6f47]/5 cursor-pointer"
                    title="Quản lý giao hàng"
                  >
                    <Truck size={22} strokeWidth={2.5} className="relative z-20" />
                  </m.button>
                  {shippingCount > 0 && (
                    <div className="absolute -top-1.5 -right-2 min-w-[20px] h-[20px] bg-gradient-to-tr from-[#2d5016] to-emerald-600 text-white text-[9px] font-black tracking-wider rounded-full border border-white/40 shadow-xs flex items-center justify-center px-1.5 z-20">
                      <span className="relative flex h-1.5 w-1.5 mr-0.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-200" />
                      </span>
                      {shippingCount}
                    </div>
                  )}
                </div>
              </div>

              {/* Expand Toggle Button */}
              <div className="flex-1 flex items-center justify-center w-full min-h-[60px] relative">
                <m.button
                  whileHover={{ scale: 1.08, x: -2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onToggleSidebar(true)}
                  style={getButtonComputedStyle(cartColorConfig, 'toggle')}
                  className="w-14 h-14 bg-transparent text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400 border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 hover:border-[#2d5016] dark:hover:border-emerald-400 rounded-2xl flex items-center justify-center transition-colors shadow-md shadow-[#8b6f47]/5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                  title="Mở rộng bảng thanh toán"
                >
                  <ChevronLeft size={28} strokeWidth={3.5} />
                </m.button>
              </div>

              {/* Hold, Save, Print Icons */}
              <div className="flex flex-col gap-3 pb-4 px-3">
                <m.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onHoldOrder}
                  disabled={cart.length === 0}
                  style={getButtonComputedStyle(cartColorConfig, 'hold')}
                  className="w-14 h-14 bg-transparent text-[#8b6f47] dark:text-[#d4a574] rounded-2xl flex items-center justify-center border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 hover:border-[#2d5016] dark:hover:border-emerald-400 hover:text-[#2d5016] transition-colors shadow-md shadow-[#8b6f47]/5 disabled:opacity-40 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                  title="Treo đơn"
                >
                  <Pause size={20} strokeWidth={2.5} />
                </m.button>

                <m.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onSaveOrder(false)}
                  disabled={cart.length === 0 || isSaving}
                  style={getButtonComputedStyle(cartColorConfig, 'save')}
                  className="w-14 h-14 bg-transparent text-[#2d5016] dark:text-emerald-400 rounded-2xl flex items-center justify-center border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 hover:border-[#2d5016] dark:hover:border-emerald-400 hover:bg-emerald-500/10 transition-colors shadow-md shadow-[#8b6f47]/5 disabled:opacity-40 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                  title="Lưu đơn"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-[#2d5016]/20 border-t-[#2d5016] dark:border-emerald-400/20 dark:border-t-emerald-400 rounded-full animate-spin" />
                  ) : (
                    <Save size={22} strokeWidth={2.5} />
                  )}
                </m.button>

                <m.button
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onSaveAndPrintOrder(true)}
                  disabled={cart.length === 0 || isSaving}
                  style={getButtonComputedStyle(cartColorConfig, 'save_print')}
                  className="w-14 h-14 bg-gradient-to-tr from-[#2d5016] to-emerald-600 dark:from-emerald-700 dark:to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-[0_10px_22px_rgba(45,80,22,0.35)] dark:shadow-[0_10px_22px_rgba(16,185,129,0.35)] hover:shadow-[0_14px_28px_rgba(45,80,22,0.45)] hover:from-emerald-700 hover:to-emerald-500 disabled:opacity-30 disabled:pointer-events-none transition-all relative overflow-hidden group/print-mini border-2 border-emerald-500/50 dark:border-emerald-400/50 cursor-pointer"
                  title="Lưu & In đơn"
                >
                  {isSaving ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Printer size={24} strokeWidth={2.5} className="relative z-10" />
                  )}
                </m.button>

                {onToggleTheme && (
                  <m.button
                    whileHover={{ scale: 1.08, rotate: 180 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onToggleTheme}
                    style={getButtonComputedStyle(cartColorConfig, 'theme')}
                    className="w-14 h-14 bg-transparent text-[#8b6f47] dark:text-[#d4a574] border-2 border-[#8b6f47]/30 dark:border-[#d4a574]/30 hover:border-[#2d5016] dark:hover:border-emerald-400 hover:text-[#2d5016] transition-colors shadow-md shadow-[#8b6f47]/5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded-2xl flex items-center justify-center"
                    title="Chuyển đổi giao diện Sáng / Tối"
                  >
                    <ArrowLeftRight size={20} strokeWidth={2.5} />
                  </m.button>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
});

export default POSSummaryPanel;
