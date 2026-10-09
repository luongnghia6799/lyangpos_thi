import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  Check,
  Trash2,
  Sparkles,
  TriangleAlert,
  X as XIcon,
  CircleAlert,
  TrendingDown,
  BadgePercent,
  ArrowLeftRight,
  Clock,
  ReceiptText,
  PackageX,
  PackageCheck,
  Minus,
  Boxes,
  Layers,
  AlertTriangle
} from 'lucide-react';
import Portal from '@/components/widgets/Portal';
import { cn, formatNumber, formatCurrency, normalizeUOM, speakAudioSequence, formatRelativePurchaseDate } from '@/lib/utils';
import MarqueeText from '@/components/widgets/MarqueeText';
import ActiveIngredientTooltip from '@/components/widgets/ActiveIngredientTooltipContent';
import {
  getCartTextPillStyle,
  getCartTextShadowStyle
} from '@/components/modals/CartColorCustomizerModal';

/**
 * High-performance Memoized CartTableRow Component
 * Prevents re-rendering untouched rows when other rows or parent state updates.
 */
const CartTableRow = React.memo(function CartTableRow({
  item,
  index,
  totalRows,
  cartColorConfig,
  productsList = [],
  selectedPartner = null,
  partnerCustomPrices = {},
  partnerLastPurchases = {},
  showLastPurchaseBadge = false,
  posMode = 'Retail',
  blockTabPrice = false,
  isSearchFocused = false,
  searchQuery = '',
  // Callbacks
  onUpdateField,
  onRemove,
  onTogglePack,
  onQuickStockCheck,
  onContextMenu,
  onFocusSearch,
  onChangeSearch,
  onBlurSearch,
  onKeyDownSearch
}) {
  const product = productsList.find(s => s.id === item.product_id) || item;
  const isLoss = item.price < item.cost_price;
  const isBelowNewCost = item.latest_cost_price > 0 && item.price < item.latest_cost_price && item.price >= item.cost_price;
  const isLowPrice = product && item.price < product.sale_price && item.price >= (item.latest_cost_price || item.cost_price);
  const isPriceSynced = product && selectedPartner && partnerCustomPrices[item.product_id] !== undefined && item.price === product.sale_price;
  const stableKey = item.cartId || `prod-${item.product_id || index}`;

  const isComboProduct = Boolean(item.is_combo || product?.is_combo);
  const [showComboDetails, setShowComboDetails] = React.useState(false);
  const [popoutCoords, setPopoutCoords] = React.useState(null);

  // Calculate Combo components stock and shortage status
  const comboDetails = React.useMemo(() => {
    if (!isComboProduct) return null;
    const rawItems = product?.combo_items || item.combo_items || [];
    if (!rawItems || rawItems.length === 0) return null;

    const cartQty = Math.max(1, Math.abs(item.quantity || 1));
    let totalCostPerCombo = 0;

    const components = rawItems.map(ci => {
      const ingProd = productsList.find(p => p.id === ci.product_id);
      const name = ingProd?.name || ci.product_name || 'Sản phẩm';
      const unit = ingProd?.unit || ci.unit || 'Cái';
      const stock = ingProd?.stock !== undefined ? ingProd.stock : 0;
      const minStock = ingProd?.min_stock || 0;
      const reqPerCombo = ci.quantity || 1;
      const totalRequired = reqPerCombo * cartQty;
      const isOutOfStock = stock <= 0;
      const isShortage = stock < totalRequired;
      const isLowStock = !isOutOfStock && (stock <= minStock || stock < 10);
      const maxCombos = Math.floor(stock / reqPerCombo);

      const costPrice = Number(ingProd?.cost_price || 0);
      const latestCostPrice = Number(ingProd?.latest_cost_price || 0);
      const effectiveCostPrice = costPrice > 0 ? costPrice : latestCostPrice;
      const itemCostInCombo = effectiveCostPrice * reqPerCombo;
      totalCostPerCombo += itemCostInCombo;

      return {
        productId: ci.product_id,
        name,
        unit,
        stock,
        reqPerCombo,
        totalRequired,
        isOutOfStock,
        isShortage,
        isLowStock,
        maxCombos,
        costPrice,
        latestCostPrice,
        effectiveCostPrice,
        itemCostInCombo,
        totalItemCostForOrder: itemCostInCombo * cartQty
      };
    });

    const shortageItems = components.filter(c => c.isShortage);
    const outOfStockItems = components.filter(c => c.isOutOfStock);
    const lowStockItems = components.filter(c => c.isLowStock && !c.isShortage);

    let bottleneck = null;
    let minCombos = Infinity;
    components.forEach(c => {
      if (c.maxCombos < minCombos) {
        minCombos = c.maxCombos;
        bottleneck = c;
      }
    });

    return {
      components,
      shortageItems,
      outOfStockItems,
      lowStockItems,
      bottleneck,
      maxCombosTotal: minCombos === Infinity ? 0 : Math.max(0, minCombos),
      totalCostPerCombo,
      totalCostForOrder: totalCostPerCombo * cartQty
    };
  }, [isComboProduct, product?.combo_items, item.combo_items, item.quantity, productsList]);

  // Handle Speech TTS
  const handleTTS = (e) => {
    e.stopPropagation();
    const rawAlias = (product.alias && product.alias.trim()) || (item.alias && item.alias.trim()) || "";
    const alias = rawAlias || item.product_name;
    const qty = item.quantity;
    const speechOrder = localStorage.getItem("pos_tts_cart_speech_order") || "name_first";

    speechOrder === "qty_first"
      ? speakAudioSequence([qty, alias])
      : speakAudioSequence([alias, qty]);
  };

  // Handle AI Consultant
  const handleOpenAI = (e) => {
    e.stopPropagation();
    const ingInfo = (product.active_ingredient || item.active_ingredient)
      ? ` (Hoạt chất: ${product.active_ingredient || item.active_ingredient})`
      : '';
    const query = `Cho tôi biết công dụng, đặc trị bệnh gì, liều lượng pha và phối hợp thuốc của sản phẩm ${product.name || item.product_name}${ingInfo}`;
    window.dispatchEvent(new CustomEvent('lyang_open_ai_consultant', { detail: { query } }));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('lyang_ai_query', { detail: { query } }));
    }, 150);
  };

  // Handle Quick Stock Check
  const handleStockClick = (e) => {
    e.stopPropagation();
    if (product) {
      const rect = e.currentTarget.getBoundingClientRect();
      onQuickStockCheck?.(product, {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
    }
  };

  // Focus Product Search helper
  const focusProductSearch = () => {
    const el = document.getElementById('pos-quick-product-search') || 
               document.querySelector('input[placeholder*="Tìm kiếm sản phẩm"]') || 
               document.querySelector('input[placeholder*="Tên sản phẩm"]');
    if (el) {
      el.focus();
      el.select?.();
    }
  };

  return (
    <m.tr
      layout="position"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: 50,
        scale: 0.95,
        backgroundColor: "rgba(0,0,0,0)",
        transition: { duration: 0.2, ease: "easeIn" }
      }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      id={`cart-row-${index}`}
      className={cn(
        "relative transition-[background-color,border-color] duration-150 group cursor-pointer last:border-b-0",
        cartColorConfig?.enableBorder !== false ? "border-b border-[#8b6f47]/10 dark:border-white/5" : "border-b-0",
        item.isPacked && "line-through decoration-emerald-500/30 opacity-60",
        isSearchFocused ? "z-[3500] bg-primary/[0.08] dark:bg-emerald-500/[0.12]" : "z-[10] hover:z-[9999] group-hover:z-[9999] focus-within:z-[3000] bg-transparent hover:bg-[#2d5016]/[0.045] dark:hover:bg-[#d4a574]/[0.08]"
      )}
      style={{
        borderColor: cartColorConfig?.enableBorder === false
          ? 'transparent'
          : (cartColorConfig?.borderColor !== 'default' ? `${cartColorConfig?.borderColor}25` : undefined)
      }}
      onContextMenu={(e) => onContextMenu?.(e, item, index)}
    >
      {/* 1. STT / Index Column */}
      <td
        onClick={handleTTS}
        title="Bấm để đọc tên và số lượng"
        className="py-2 px-2 text-center tabular-nums cursor-pointer select-none rounded-l-xl group/index-td"
      >
        <div
          style={cartColorConfig?.enableTextPills ? getCartTextPillStyle(cartColorConfig, 'index') : undefined}
          className={cn(
            "w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-black text-xs text-slate-400 dark:text-slate-500 group-hover/index-td:text-emerald-600 dark:group-hover/index-td:text-emerald-400 group-hover/index-td:bg-emerald-500/15 group-hover/index-td:border group-hover/index-td:border-emerald-500/20 group-hover/index-td:scale-110 group-hover/index-td:shadow-xs active:scale-95 transition-all duration-200",
            cartColorConfig?.enableTextPills && "border shadow-xs"
          )}
        >
          {index + 1}
        </div>
      </td>

      {/* 2. Soạn hàng / IsPacked Check Column */}
      <td className="py-2 px-2 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePack?.(index);
          }}
          className={cn(
            "w-8 h-8 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 border-2 cursor-pointer",
            item.isPacked
              ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-105"
              : "bg-transparent border-slate-300/80 dark:border-white/20 text-slate-400/80 dark:text-slate-500 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10 hover:scale-110 active:scale-95 shadow-none hover:shadow-xs"
          )}
        >
          <Check size={16} strokeWidth={3.5} className="transition-transform duration-200" />
        </button>
      </td>

      {/* 3. Tên sản phẩm / Product Name & Badges */}
      <td className="py-2 px-2 relative group-hover/search-row:z-[9999]">
        <div className="relative group/search-row hover:z-[9999]" onContextMenu={(e) => onContextMenu?.(e, item, index)}>
          {isSearchFocused ? (
            <input
              type="text"
              autoComplete="off"
              autoFocus
              style={{
                color: cartColorConfig?.productTextColor && cartColorConfig.productTextColor !== 'default'
                  ? cartColorConfig.productTextColor
                  : undefined
              }}
              className={cn(
                "w-full h-auto py-2.5 pl-4 pr-28 bg-white/10 dark:bg-slate-800/30 rounded-xl border-0 border-transparent outline-none focus:outline-none ring-0 focus:ring-0 focus:ring-transparent focus:border-transparent focus:border-0",
                "text-[17px] font-black tracking-tight transition-all leading-relaxed placeholder:normal-case placeholder:leading-relaxed",
                (!cartColorConfig?.productTextColor || cartColorConfig.productTextColor === 'default') && "text-emerald-900 dark:text-emerald-300",
                "placeholder:text-gray-300",
                item.ai_scanned && "pb-6"
              )}
              value={searchQuery}
              onFocus={(e) => onFocusSearch?.(e, index, item)}
              onChange={onChangeSearch}
              onBlur={onBlurSearch}
              onKeyDown={(e) => onKeyDownSearch?.(e, index, item)}
              id={`row-name-${index}`}
            />
          ) : (
            <div
              onClick={() => onFocusSearch?.(null, index, item)}
              onContextMenu={(e) => onContextMenu?.(e, item, index)}
              className="w-full h-auto py-2 px-3 flex items-center justify-between gap-2.5 cursor-pointer group/marquee-wrap min-h-[44px]"
            >
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    className={cn(
                      "min-w-0 flex items-center gap-2",
                      cartColorConfig?.enableTextPills && "px-2.5 py-1 rounded-2xl border transition-all"
                    )}
                    style={cartColorConfig?.enableTextPills ? getCartTextPillStyle(cartColorConfig, 'name') : undefined}
                  >
                    {(item.active_ingredient || product?.active_ingredient) ? (
                      <ActiveIngredientTooltip activeIngredient={item.active_ingredient || product?.active_ingredient}>
                        <MarqueeText
                          text={item.product_name}
                          onContextMenu={(e) => onContextMenu?.(e, item, index)}
                          style={{
                            color: cartColorConfig?.productTextColor && cartColorConfig.productTextColor !== 'default' ? cartColorConfig.productTextColor : undefined,
                            ...getCartTextShadowStyle(cartColorConfig, cartColorConfig?.productTextColor)
                          }}
                          className={cn(
                            "text-[17px] font-black tracking-tight leading-snug cursor-pointer",
                            (!cartColorConfig?.productTextColor || cartColorConfig.productTextColor === 'default') && "text-emerald-900 dark:text-emerald-300"
                          )}
                          title=""
                        />
                      </ActiveIngredientTooltip>
                    ) : (
                      <MarqueeText
                        text={item.product_name}
                        onContextMenu={(e) => onContextMenu?.(e, item, index)}
                        style={{
                          color: cartColorConfig?.productTextColor && cartColorConfig.productTextColor !== 'default' ? cartColorConfig.productTextColor : undefined,
                          ...getCartTextShadowStyle(cartColorConfig, cartColorConfig?.productTextColor)
                        }}
                        className={cn(
                          "text-[17px] font-black tracking-tight leading-snug",
                          (!cartColorConfig?.productTextColor || cartColorConfig.productTextColor === 'default') && "text-emerald-900 dark:text-emerald-300"
                        )}
                        title={item.product_name}
                      />
                    )}

                    {/* AI Button */}
                    <button
                      type="button"
                      onClick={handleOpenAI}
                      className="group/ai-btn opacity-0 group-hover:opacity-100 group-hover/marquee-wrap:opacity-100 focus:opacity-100 inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-teal-400/20 to-cyan-500/20 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-emerald-700 hover:text-white dark:from-emerald-400/20 dark:via-teal-300/20 dark:to-cyan-400/20 dark:text-emerald-300 dark:hover:from-emerald-400 dark:hover:via-teal-400 dark:hover:to-cyan-400 dark:hover:text-slate-950 border border-emerald-500/30 hover:border-emerald-400 shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300 hover:scale-120 hover:-translate-y-0.5 active:scale-95 shrink-0 cursor-pointer select-none ml-1 relative overflow-hidden backdrop-blur-md"
                      title="Hỏi AI: Tra cứu nhanh công dụng, liều dùng & phối hợp thuốc"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/ai-btn:animate-[shimmer_1.2s_infinite] pointer-events-none" />
                      <Sparkles size={14} strokeWidth={2.6} className="text-emerald-600 dark:text-emerald-300 group-hover/ai-btn:text-white dark:group-hover/ai-btn:text-slate-950 transition-all duration-300 group-hover/ai-btn:rotate-12 group-hover/ai-btn:scale-110 drop-shadow-sm" />
                    </button>
                  </div>
                </div>

                {/* Combo Shortage & Low stock warnings */}
                {isComboProduct && comboDetails && (
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {comboDetails.shortageItems.length > 0 ? (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPopoutCoords({
                            top: rect.top,
                            bottom: rect.bottom,
                            left: rect.left,
                            right: rect.right,
                            width: rect.width,
                            height: rect.height
                          });
                          setShowComboDetails(true);
                        }}
                        className="cursor-pointer px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9.5px] font-black flex items-center gap-1 border border-rose-500/30 dark:border-rose-400/40 shadow-xs hover:bg-rose-500/25 transition-colors"
                        title="Bấm để mở popout xem chi tiết món thiếu"
                      >
                        <PackageX size={11} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>
                          Thiếu: <b>{comboDetails.shortageItems[0].name}</b> (còn {comboDetails.shortageItems[0].stock}/{comboDetails.shortageItems[0].totalRequired} {comboDetails.shortageItems[0].unit})
                          {comboDetails.shortageItems.length > 1 && ` +${comboDetails.shortageItems.length - 1} món`}
                        </span>
                      </span>
                    ) : comboDetails.outOfStockItems.length > 0 ? (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPopoutCoords({
                            top: rect.top,
                            bottom: rect.bottom,
                            left: rect.left,
                            right: rect.right,
                            width: rect.width,
                            height: rect.height
                          });
                          setShowComboDetails(true);
                        }}
                        className="cursor-pointer px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9.5px] font-black flex items-center gap-1 border border-rose-500/30 dark:border-rose-400/40 shadow-xs hover:bg-rose-500/25 transition-colors"
                      >
                        <PackageX size={11} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Hết hàng: <b>{comboDetails.outOfStockItems[0].name}</b></span>
                      </span>
                    ) : comboDetails.lowStockItems.length > 0 ? (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPopoutCoords({
                            top: rect.top,
                            bottom: rect.bottom,
                            left: rect.left,
                            right: rect.right,
                            width: rect.width,
                            height: rect.height
                          });
                          setShowComboDetails(true);
                        }}
                        className="cursor-pointer px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[9.5px] font-black flex items-center gap-1 border border-amber-500/30 dark:border-amber-400/40 shadow-xs hover:bg-amber-500/25 transition-colors"
                      >
                        <CircleAlert size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Sắp hết: <b>{comboDetails.lowStockItems[0].name}</b> (tồn {comboDetails.lowStockItems[0].stock})</span>
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Floating Combo Breakdown Popout */}
                <ComboBreakdownPopout
                  isOpen={showComboDetails}
                  onClose={() => setShowComboDetails(false)}
                  comboDetails={comboDetails}
                  productName={item.product_name}
                  cartQuantity={Math.max(1, Math.abs(item.quantity || 1))}
                  coordinates={popoutCoords}
                />

                {/* AI Scanned badge */}
                <AnimatePresence initial={false}>
                  {item.ai_scanned && (
                    <m.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 4 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 z-10">
                        {item.ai_matched_status === "matched" ? (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/20 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-black flex items-center gap-1.5 border border-emerald-500/30 dark:border-emerald-400/40 shadow-xs shadow-emerald-500/10 w-fit backdrop-blur-md">
                            <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[320px]">{`AI Tự khớp: "${item.ai_original_name}"`}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateField?.(index, "ai_scanned", undefined);
                              }}
                              className="hover:bg-emerald-500/25 rounded-full p-0.5 text-emerald-800 dark:text-emerald-200 transition-all inline-flex items-center justify-center ml-0.5"
                              title="Xác nhận khớp đúng"
                            >
                              <Check size={10} strokeWidth={3} />
                            </button>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/20 text-amber-800 dark:text-amber-300 text-[9.5px] font-black flex items-center gap-1.5 border border-amber-500/30 dark:border-amber-400/40 shadow-xs shadow-amber-500/10 w-fit backdrop-blur-md">
                            <TriangleAlert size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate max-w-[320px]">{`AI không khớp được: "${item.ai_original_name}"`}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateField?.(index, "ai_scanned", undefined);
                              }}
                              className="hover:bg-amber-500/25 rounded-full p-0.5 text-amber-800 dark:text-amber-200 transition-all inline-flex items-center justify-center ml-0.5"
                              title="Bỏ qua cảnh báo"
                            >
                              <XIcon size={10} strokeWidth={3} />
                            </button>
                          </span>
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stock badge & COMBO button & Last purchase badge */}
              <div className="shrink-0 z-10 flex flex-col items-end justify-center gap-1 min-w-0" style={{ contain: "layout style" }}>
                <div className="flex items-center gap-1.5 justify-end">
                  {isComboProduct && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPopoutCoords({
                          top: rect.top,
                          bottom: rect.bottom,
                          left: rect.left,
                          right: rect.right,
                          width: rect.width,
                          height: rect.height
                        });
                        setShowComboDetails(true);
                      }}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10.5px] font-black tracking-wider border flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs select-none backdrop-blur-md",
                        comboDetails?.shortageItems?.length > 0
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                          : (comboDetails?.outOfStockItems?.length > 0 || comboDetails?.lowStockItems?.length > 0)
                            ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/40 hover:bg-amber-500/25"
                      )}
                      title="Bấm để mở popout xem chi tiết tồn kho các món trong Combo"
                    >
                      <Boxes size={11} className="shrink-0" />
                      <span>COMBO</span>
                      {comboDetails?.components?.length > 0 && (
                        <span className="opacity-80 font-mono text-[9.5px]">({comboDetails.components.length})</span>
                      )}
                    </button>
                  )}

                  <div
                    onClick={handleStockClick}
                    className={cn(
                      "relative cursor-pointer px-2.5 py-0.5 rounded-full text-[11px] font-black border transition-colors flex items-center gap-1.5 group/stock whitespace-nowrap shadow-xs select-none backdrop-blur-md",
                      item.stock <= 0
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 dark:border-rose-400/45 hover:bg-rose-500/25"
                        : item.stock < 10
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35 dark:border-amber-400/45 hover:bg-amber-500/25"
                          : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35 dark:border-emerald-400/45 hover:bg-emerald-500/25"
                    )}
                    title="Kiểm tồn nhanh"
                  >
                    <div className="flex items-center gap-1 tabular-nums">
                      {item.stock <= 0 ? (
                        <PackageX size={12} strokeWidth={2.6} className="text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : item.stock < 10 ? (
                        <CircleAlert size={12} strokeWidth={2.6} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <PackageCheck size={12} strokeWidth={2.6} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span className="tabular-nums font-black">{item.stock}</span>
                    </div>
                    {localStorage.getItem('feature_accounting_enabled') !== 'false' && (
                      <>
                        <span className="w-px h-3 bg-current opacity-25 shrink-0" />
                        <div className="inline-flex items-center gap-1 opacity-90 shrink-0 whitespace-nowrap" title="Tồn sổ sách kế toán">
                          <ReceiptText size={11} strokeWidth={2.4} className="shrink-0" />
                          <span className="tabular-nums font-black">
                            {item.accounting_stock !== undefined ? item.accounting_stock : (product?.accounting_stock || 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {showLastPurchaseBadge && partnerLastPurchases && partnerLastPurchases[item.product_id] && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 dark:border-indigo-400/40 text-[10px] font-black shadow-xs tracking-tight select-none whitespace-nowrap transition-colors hover:bg-indigo-500/25 backdrop-blur-md"
                    title={`Lần mua gần nhất: ${formatRelativePurchaseDate(partnerLastPurchases[item.product_id].last_date)} | Giá: ${formatNumber(partnerLastPurchases[item.product_id].last_price)}đ | SL: ${formatNumber(partnerLastPurchases[item.product_id].last_quantity)}`}
                  >
                    <Clock size={11} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Đã mua: {formatRelativePurchaseDate(partnerLastPurchases[item.product_id].last_date)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </td>

      {/* 4. Đơn vị chính (Unit) */}
      <td className="py-2 px-2 text-center">
        <div className="font-bold text-gray-700 dark:text-gray-200">{normalizeUOM(item.unit)}</div>
        {item.secondary_unit && (
          <div className="text-[10px] text-primary dark:text-[#d4a574] font-black uppercase tracking-tighter whitespace-nowrap mt-0.5">
            1 {normalizeUOM(item.secondary_unit)} = {item.multiplier} {normalizeUOM(item.unit)}
          </div>
        )}
      </td>

      {/* 5. Quy đổi (Secondary Unit Qty) */}
      <td className="py-2 px-2">
        {item.secondary_unit ? (
          <div
            className={cn(
              "flex items-center gap-1 h-10 px-2 rounded-2xl transition-all shadow-none",
              cartColorConfig?.enableTextPills ? "border shadow-xs" : "bg-transparent border border-white/20 dark:border-white/10 focus-within:bg-transparent focus-within:border-[#d4a574]/50 focus-within:ring-4 focus-within:ring-[#d4a574]/10"
            )}
            style={cartColorConfig?.enableTextPills ? getCartTextPillStyle(cartColorConfig, 'sec_qty') : undefined}
          >
            <input
              type="number"
              step="any"
              tabIndex={posMode === "Wholesale" ? 0 : -1}
              style={{
                color: (cartColorConfig?.cartValuesColor && cartColorConfig.cartValuesColor !== 'default')
                  ? cartColorConfig.cartValuesColor
                  : undefined
              }}
              className="w-full bg-transparent text-center font-black text-base outline-none placeholder:text-gray-300 text-primary dark:text-[#d4a574]"
              value={item.secondary_qty !== undefined && item.secondary_qty !== null && item.secondary_qty !== ""
                ? (typeof item.secondary_qty === 'number' ? Math.round((item.secondary_qty + Number.EPSILON) * 1000) / 1000 : item.secondary_qty)
                : ""}
              onFocus={(e) => e.target.select()}
              autoComplete="off"
              onChange={(e) => onUpdateField?.(index, "secondary_qty", parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  focusProductSearch();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const next = index + 1;
                  next < totalRows && document.getElementById(`qty-sec-${next}`)?.focus();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prev = index - 1;
                  prev >= 0 ? document.getElementById(`qty-sec-${prev}`)?.focus() : (document.getElementById('working-sec-qty')?.focus());
                }
              }}
              id={`qty-sec-${index}`}
            />
            <span className="text-[10px] font-black text-gray-400 uppercase pr-2">
              {normalizeUOM(item.secondary_unit)}
            </span>
          </div>
        ) : (
          <div className="text-center text-gray-300 italic text-[10px] font-bold">N/A</div>
        )}
      </td>

      {/* 6. Số lượng (Quantity) */}
      <td className="py-2 px-2 group/qty">
        <div className="relative w-full">
          <input
            type="number"
            style={{
              color: (cartColorConfig?.cartValuesColor && cartColorConfig.cartValuesColor !== 'default')
                ? cartColorConfig.cartValuesColor
                : undefined,
              ...(cartColorConfig?.enableTextPills ? getCartTextPillStyle(cartColorConfig, 'qty') : {}),
              ...getCartTextShadowStyle(cartColorConfig, cartColorConfig?.cartValuesColor)
            }}
            className={cn(
              "w-full h-10 text-center outline-none font-black text-lg text-primary dark:text-[#d4a574] transition-all",
              cartColorConfig?.enableTextPills
                ? "rounded-2xl border shadow-xs"
                : "bg-transparent border border-white/20 dark:border-white/10 rounded-2xl focus:bg-transparent focus:border-primary/50 focus:ring-4 focus:ring-primary/10 shadow-none"
            )}
            value={item.quantity}
            onFocus={(e) => e.target.select()}
            autoComplete="off"
            onChange={(e) => onUpdateField?.(index, "quantity", parseFloat(e.target.value) || 0)}
            id={`qty-main-${index}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                focusProductSearch();
              } else if (e.key === "Tab") {
                e.preventDefault();
                if (e.shiftKey) {
                  if (posMode === "Wholesale" && item.secondary_unit) {
                    document.getElementById(`qty-sec-${index}`)?.focus();
                  } else {
                    document.getElementById(`row-name-${index}`)?.focus();
                  }
                } else {
                  blockTabPrice ? e.target.select?.() : document.getElementById(`price-${index}`)?.focus();
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = index + 1;
                next < totalRows && document.getElementById(`qty-main-${next}`)?.focus();
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const prev = index - 1;
                prev >= 0 ? document.getElementById(`qty-main-${prev}`)?.focus() : (document.getElementById('working-main-qty')?.focus() || document.getElementById('pos-working-quantity')?.focus());
              }
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center bg-white/40 dark:bg-black/20 text-[#8b6f47] dark:text-[#d4a574] rounded-full border border-white/50 dark:border-white/10 hover:bg-white/60 active:scale-90 z-[70] transition-all hover:scale-110 opacity-0 group-hover/qty:opacity-100 cursor-pointer"
            onClick={() => onUpdateField?.(index, "quantity", item.quantity * -1)}
            title="Đổi thành Trả Hàng (Âm)"
          >
            <Minus size={10} strokeWidth={3} />
          </button>
        </div>
      </td>

      {/* 7. Đơn giá (Price) */}
      <td className="py-2 px-2 text-right relative hover:z-[4000] focus-within:z-[4000]">
        <div className="flex flex-col items-center gap-1 group/price relative z-[10] group-hover/price:z-[4000] group-focus-within/price:z-[4000]">
          {/* Price Hover Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-1 bg-[#fbf9f4]/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-[#8b6f47]/30 dark:border-white/15 shadow-2xl shadow-[#8b6f47]/10 dark:shadow-black/50 flex items-stretch whitespace-nowrap z-[9999] opacity-0 group-hover/price:opacity-100 group-focus-within/price:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover/price:translate-y-0 group-focus-within/price:translate-y-0 ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
              <span className="text-[9px] uppercase font-black text-slate-500/80 dark:text-slate-400 leading-none mb-1.5 tracking-[0.1em]">
                Vốn TB
              </span>
              <span className="text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums">
                {formatNumber(item.cost_price)}
                <span className="text-[10px] ml-1 opacity-60">đ</span>
              </span>
            </div>
            <div className="w-px my-2 bg-gradient-to-b from-transparent via-[#8b6f47]/20 dark:via-white/15 to-transparent" />
            <div className="flex flex-col items-center px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
              <span className="text-[9px] uppercase font-black text-[#8b6f47] dark:text-[#d4a574] leading-none mb-1.5 tracking-[0.1em]">
                Nhập cuối
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatNumber(item.latest_cost_price || 0)}
                <span className="text-[10px] ml-1 opacity-60">đ</span>
              </span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#fbf9f4]/95 dark:border-t-slate-900/95 drop-shadow-xs" />
          </div>

          <div
            className={cn(
              "relative w-full transition-all",
              cartColorConfig?.enableTextPills && "rounded-2xl border shadow-xs"
            )}
            style={cartColorConfig?.enableTextPills ? getCartTextPillStyle(cartColorConfig, 'price') : undefined}
          >
            <input
              type="text"
              tabIndex={blockTabPrice ? -1 : 0}
              style={{
                color: (cartColorConfig?.cartValuesColor && cartColorConfig.cartValuesColor !== 'default' && item.price > 0 && !isLoss && !(item.latest_cost_price > 0 && item.price < item.latest_cost_price))
                  ? cartColorConfig.cartValuesColor
                  : undefined,
                ...getCartTextShadowStyle(cartColorConfig, cartColorConfig?.cartValuesColor)
              }}
              className={cn(
                "w-full p-2 text-center bg-transparent border-none focus:ring-2 rounded font-black transition-all outline-none",
                item.price === 0
                  ? "text-transparent select-none placeholder:text-transparent"
                  : isLoss
                    ? "text-red-600 dark:text-red-400 focus:ring-red-200 dark:focus:ring-red-900"
                    : isBelowNewCost
                      ? "text-orange-600 dark:text-orange-400 focus:ring-orange-200"
                      : "text-primary dark:text-[#d4a574] focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#4a7c59]/20"
              )}
              value={formatNumber(item.price)}
              onFocus={(e) => e.target.select()}
              autoComplete="off"
              onChange={(e) => {
                const val = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                onUpdateField?.(index, "price", val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  focusProductSearch();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const next = index + 1;
                  next < totalRows && document.getElementById(`price-${next}`)?.focus();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prev = index - 1;
                  prev >= 0 ? document.getElementById(`price-${prev}`)?.focus() : (document.getElementById('working-price')?.focus() || document.getElementById('pos-working-price')?.focus());
                }
              }}
              id={`price-${index}`}
            />
            {item.price === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/35 dark:border-emerald-400/40 shadow-xs shadow-emerald-500/10 backdrop-blur-md">
                  HÀNG TẶNG 0đ
                </span>
              </div>
            )}
          </div>

          {/* Price condition badges */}
          <AnimatePresence mode="wait">
            {isLoss && (
              <m.div
                initial={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, scale: 1, marginTop: 4 }}
                exit={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                key={`loss-${stableKey}`}
                className="overflow-hidden"
              >
                <div className="bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-[9px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5 pointer-events-none border border-rose-500/30 dark:border-rose-400/40">
                  <CircleAlert size={11} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>LỖ VỐN (VỐN: {formatNumber(item.cost_price)}đ)</span>
                </div>
              </m.div>
            )}
            {isBelowNewCost && (
              <m.div
                initial={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, scale: 1, marginTop: 4 }}
                exit={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                key={`below-new-${stableKey}`}
                className="overflow-hidden"
              >
                <div className="bg-orange-500/15 dark:bg-orange-500/25 text-orange-700 dark:text-orange-300 text-[9px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5 pointer-events-none border border-orange-500/30 dark:border-orange-400/40">
                  <TrendingDown size={11} className="text-orange-600 dark:text-orange-400 shrink-0" />
                  <span>DƯỚI VỐN MỚI ({formatNumber(item.latest_cost_price)}đ)</span>
                </div>
              </m.div>
            )}
            {isLowPrice && (
              <m.div
                initial={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, scale: 1, marginTop: 4 }}
                exit={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                key={`low-price-${stableKey}`}
                className="overflow-hidden"
              >
                <div className="bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5 border border-amber-500/30 dark:border-amber-400/40">
                  <BadgePercent size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>GIÁ THẤP ({formatNumber((posMode === 'Wholesale' && product?.bulk_price) || product?.sale_price || item.sale_price)}đ)</span>
                </div>
              </m.div>
            )}
            {isPriceSynced && (
              <m.div
                initial={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, scale: 1, marginTop: 4 }}
                exit={{ height: 0, opacity: 0, scale: 0.85, marginTop: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                key={`sync-${stableKey}`}
                className="overflow-hidden"
              >
                <div className="bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-black whitespace-nowrap z-10 flex items-center gap-1.5 border border-emerald-500/30 dark:border-emerald-400/40">
                  <ArrowLeftRight size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>ĐỒNG BỘ GIÁ</span>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </td>

      {/* 8. Thành tiền (Total Amount) */}
      <td className="py-2 px-4 text-right">
        <div
          style={{
            color: (item.quantity >= 0 && cartColorConfig?.cartValuesColor && cartColorConfig.cartValuesColor !== 'default')
              ? cartColorConfig.cartValuesColor
              : undefined,
            ...(cartColorConfig?.enableTextPills ? getCartTextPillStyle(cartColorConfig, 'amount') : {}),
            ...getCartTextShadowStyle(cartColorConfig, cartColorConfig?.cartValuesColor)
          }}
          className={cn(
            "font-black text-lg transition-all",
            item.quantity < 0 ? "text-red-600 dark:text-red-400" : "text-primary dark:text-[#d4a574]",
            cartColorConfig?.enableTextPills && "px-3 py-1 rounded-2xl border shadow-xs inline-block"
          )}
        >
          {formatNumber(item.price * item.quantity)}
        </div>
        {item.quantity < 0 && (
          <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-rose-500/15 to-red-500/20 text-rose-700 dark:text-rose-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-500/30 dark:border-rose-400/40 shadow-xs shadow-rose-500/10 mt-1 backdrop-blur-md">
            Hàng trả
          </span>
        )}
      </td>

      {/* 9. Nút xóa dòng (Delete Button) */}
      <td className="py-2 px-2 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(index);
          }}
          className="group/del-btn w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-slate-400/80 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-transparent hover:bg-rose-500/15 dark:hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 dark:hover:border-rose-500/40 hover:shadow-[0_0_12px_rgba(244,63,94,0.25)] hover:scale-110 active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Xóa dòng"
        >
          <Trash2 size={17} strokeWidth={2.2} className="transition-transform duration-200 group-hover/del-btn:-rotate-12 group-hover/del-btn:scale-110" />
        </button>
      </td>
    </m.tr>
  );
});

/**
 * Floating Combo Breakdown Popout
 * Displays real-time components inventory, required amounts, and shortage warnings.
 */
const ComboBreakdownPopout = React.memo(function ComboBreakdownPopout({
  isOpen,
  onClose,
  comboDetails,
  productName,
  cartQuantity,
  coordinates
}) {
  const containerRef = React.useRef(null);
  const [style, setStyle] = React.useState({ position: 'fixed', opacity: 0, visibility: 'hidden' });

  React.useEffect(() => {
    if (isOpen && coordinates) {
      const checkPosition = () => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const popW = Math.min(440, winW - 20);
        const popH = 450;

        let top = (coordinates.bottom || coordinates.top) + 6;
        let left = coordinates.left || 16;

        if (left + popW > winW - 12) {
          left = Math.max(12, winW - popW - 12);
        }
        if (left < 12) {
          left = 12;
        }

        if (top + popH > winH - 12) {
          top = Math.max(12, (coordinates.top || coordinates.bottom) - popH - 6);
        }

        setStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${popW}px`,
          maxHeight: `${Math.min(540, winH - 24)}px`,
          zIndex: 999999,
          opacity: 1,
          visibility: 'visible'
        });
      };

      checkPosition();
      const timer = setTimeout(checkPosition, 30);
      return () => clearTimeout(timer);
    } else {
      setStyle({ opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
    }
  }, [isOpen, coordinates]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && comboDetails && (
          <div className="fixed inset-0 z-[999998] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            />

            {/* Popout Box */}
            <m.div
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ duration: 0.15 }}
              style={style}
              onClick={(e) => e.stopPropagation()}
              className="bg-card/98 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto text-foreground"
            >
              {/* Header */}
              <div className="px-3.5 py-2.5 border-b border-border/80 bg-primary/[0.03] flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <Boxes size={14} />
                  </div>
                  <h3 className="text-xs font-black uppercase text-foreground tracking-wide truncate max-w-[280px]" title={productName}>
                    {productName}
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                    ({comboDetails.components.length} món)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <XIcon size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Space-Optimized Summary Mini-Cards (Bright & High-Contrast) */}
              <div className="p-2 bg-white/70 dark:bg-slate-950/40 border-b border-border/80 space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Tồn làm được */}
                  <div className="p-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/40 dark:border-emerald-400/40 shadow-xs flex flex-col justify-center">
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 leading-none truncate">
                      Tồn làm được
                    </span>
                    <span className={cn(
                      "text-xs font-black tabular-nums mt-0.5 leading-tight",
                      comboDetails.maxCombosTotal <= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {comboDetails.maxCombosTotal} <span className="text-[9px] font-bold text-muted-foreground uppercase">bộ</span>
                    </span>
                  </div>

                  {/* Giỏ mua */}
                  <div className="p-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-500/40 dark:border-sky-400/40 shadow-xs flex flex-col justify-center">
                    <span className="text-[8px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 leading-none truncate">
                      Khách mua
                    </span>
                    <span className="text-xs font-black tabular-nums text-sky-600 dark:text-sky-400 mt-0.5 leading-tight">
                      {cartQuantity} <span className="text-[9px] font-bold text-muted-foreground uppercase">bộ</span>
                    </span>
                  </div>

                  {/* Tổng vốn */}
                  <div className="p-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-500/40 dark:border-amber-400/40 shadow-xs flex flex-col justify-center">
                    <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 leading-none truncate">
                      Vốn combo
                    </span>
                    <span className="text-xs font-black tabular-nums text-amber-600 dark:text-amber-400 mt-0.5 leading-tight truncate" title={`${formatNumber(Math.round(comboDetails.totalCostPerCombo))}đ`}>
                      {formatNumber(Math.round(comboDetails.totalCostPerCombo))}đ
                    </span>
                  </div>
                </div>

                {/* Inline Notice for Shortage or Bottleneck */}
                {comboDetails.shortageItems.length > 0 ? (
                  <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1.5">
                    <PackageX size={12} className="text-rose-600 shrink-0" />
                    <span className="truncate">Cảnh báo: Thiếu {comboDetails.shortageItems.length} món trong kho!</span>
                  </div>
                ) : comboDetails.bottleneck ? (
                  <div className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-[9.5px] font-medium flex items-center gap-1.5">
                    <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                    <span className="truncate">
                      Giới hạn: <b>{comboDetails.bottleneck.name}</b> (còn {comboDetails.bottleneck.stock} {comboDetails.bottleneck.unit} → {comboDetails.bottleneck.maxCombos} bộ)
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Space-Optimized Component Mini-Cards */}
              <div className="p-2 overflow-y-auto max-h-[330px] space-y-1.5 custom-scrollbar">
                {comboDetails.components.map((comp, cIdx) => (
                  <div
                    key={cIdx}
                    className={cn(
                      "p-2 px-2.5 rounded-xl border transition-all shadow-2xs hover:shadow-xs",
                      comp.isShortage
                        ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                        : comp.isOutOfStock
                          ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                          : comp.isLowStock
                            ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                            : "bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-primary/50"
                    )}
                  >
                    {/* Line 1: Index + Name + Status Badges + Stock Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground/80 shrink-0">{cIdx + 1}.</span>
                        <span className="font-bold text-xs uppercase text-foreground truncate" title={comp.name}>
                          {comp.name}
                        </span>
                        {comp.isShortage && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[7.5px] font-black uppercase shrink-0">
                            Thiếu {comp.totalRequired - comp.stock}
                          </span>
                        )}
                        {comp.isOutOfStock && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[7.5px] font-black uppercase shrink-0">
                            Hết
                          </span>
                        )}
                      </div>

                      {/* Stock Pill Badge */}
                      <span className={cn(
                        "inline-block px-1.5 py-0.5 rounded-md text-[10.5px] font-black tabular-nums border shrink-0 shadow-2xs",
                        comp.isOutOfStock || comp.isShortage
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                          : comp.isLowStock
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300"
                            : "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      )}>
                        Tồn: {comp.stock} {comp.unit}
                      </span>
                    </div>

                    {/* Line 2: Breakdown requirement + Cost + Max Combos */}
                    <div className="flex items-center justify-between gap-2 mt-1 text-[9.5px] font-medium text-muted-foreground pl-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>1 cb: <b className="text-foreground">{comp.reqPerCombo}</b> {comp.unit}</span>
                        <span>•</span>
                        <span>Cần: <b className="text-foreground">{comp.totalRequired}</b> {comp.unit}</span>
                        <span>•</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                          Vốn: {formatNumber(Math.round(comp.effectiveCostPrice))}đ/{comp.unit}
                          {comp.reqPerCombo > 1 && ` (x${comp.reqPerCombo} = ${formatNumber(Math.round(comp.itemCostInCombo))}đ)`}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        Làm: <b className={comp.maxCombos <= 0 ? "text-rose-600" : "text-foreground"}>{comp.maxCombos}</b> bộ
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-3.5 py-1.5 border-t border-border/80 bg-muted/20 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  LyangPOS • Kiểm tồn Combo
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  Đóng
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
});

export default CartTableRow;
