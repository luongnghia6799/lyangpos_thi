import React from 'react';
import { 
  PackageX, 
  CircleAlert, 
  PackageCheck, 
  ReceiptText, 
  Clock 
} from 'lucide-react';
import { cn, formatNumber, formatRelativePurchaseDate, normalizeUOM } from '@/lib/utils';
import MarqueeText from '@/components/widgets/MarqueeText';

/**
 * Memoized single item in Product Search Dropdown.
 * Only re-renders when its own `isActive` status or data changes.
 */
const ProductSearchItem = React.memo(function ProductSearchItem({
  product,
  isActive = false,
  index,
  colorTheme = { main: '#2d5016', accent: '#d4a574', muted: '#888', accentMuted: '#aaa' },
  showLastPurchaseBadge = false,
  lastPurchase = null,
  accountingEnabled = true,
  displayPrice = null,
  onSelect,
  onHover,
  onQuickStock,
  onContextMenu
}) {
  const price = displayPrice !== null && displayPrice !== undefined ? displayPrice : product.sale_price;

  return (
    <div
      onMouseEnter={() => onHover?.(index)}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect?.(product);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, product);
      }}
      className={cn("dropdown-item flex justify-between items-center", isActive && "active")}
    >
      <div className="flex-1 flex flex-col gap-1.5 relative z-10 min-w-0 overflow-hidden mr-3">
        {/* Row 1: Name + Badges */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <MarqueeText
              text={product.name}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu?.(e, product);
              }}
              isActive={isActive}
              className="font-black tracking-tight leading-relaxed"
              style={{
                color: isActive ? colorTheme.accent : colorTheme.main,
                fontSize: "16px",
                transform: isActive ? "translateX(6px)" : "none",
                transition: "transform 180ms ease, color 180ms ease"
              }}
            />
          </div>

          {product.is_combo && (
            <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/20 to-orange-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black tracking-widest border border-amber-500/30 dark:border-amber-400/40 shadow-xs shadow-amber-500/10">
              COMBO
            </span>
          )}

          {showLastPurchaseBadge && lastPurchase && (
            <span 
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-indigo-500/20 to-violet-500/15 dark:from-indigo-500/25 dark:to-violet-500/30 text-indigo-700 dark:text-indigo-300 text-[10.5px] font-black border border-indigo-500/30 dark:border-indigo-400/40 shadow-xs shadow-indigo-500/10 animate-in fade-in zoom-in-90 duration-200 transition-all hover:scale-105 select-none backdrop-blur-md" 
              title={`Đã mua: ${formatRelativePurchaseDate(lastPurchase.last_date)} (Giá: ${formatNumber(lastPurchase.last_price)}đ)`}
            >
              <Clock size={11} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              Đã mua: {formatRelativePurchaseDate(lastPurchase.last_date)}
            </span>
          )}
        </div>

        {/* Row 2: Stock, Barcode, Unit, Ingredients */}
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex-wrap">
          {/* Stock Badge */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onQuickStock?.(product, {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right
              });
            }}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 group/stock cursor-pointer select-none shadow-xs shrink-0 normal-case border backdrop-blur-md",
              product.stock <= 0
                ? "bg-gradient-to-r from-rose-500/15 via-red-500/20 to-rose-600/15 dark:from-rose-500/25 dark:to-rose-600/30 text-rose-700 dark:text-rose-300 border-rose-500/35 dark:border-rose-400/45 shadow-rose-500/10 hover:border-rose-500/60"
                : product.stock < 10
                  ? "bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-600/15 dark:from-amber-500/25 dark:to-amber-600/30 text-amber-800 dark:text-amber-300 border-amber-500/35 dark:border-amber-400/45 shadow-amber-500/10 hover:border-amber-500/60"
                  : "bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-emerald-600/15 dark:from-emerald-500/25 dark:to-emerald-600/30 text-emerald-800 dark:text-emerald-300 border-emerald-500/35 dark:border-emerald-400/45 shadow-emerald-500/10 hover:border-emerald-500/60"
            )}
            title="Kiểm tồn nhanh"
          >
            <div className="flex items-center gap-1 tabular-nums">
              {product.stock <= 0 ? (
                <PackageX size={12} strokeWidth={2.6} className="text-rose-600 dark:text-rose-400 shrink-0" />
              ) : product.stock < 10 ? (
                <CircleAlert size={12} strokeWidth={2.6} className="text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <PackageCheck size={12} strokeWidth={2.6} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span className="tabular-nums font-black">
                {product.stock}
              </span>
            </div>

            {accountingEnabled && (
              <>
                <span className="w-px h-3 bg-current opacity-25 shrink-0" />
                <div 
                  className="inline-flex items-center gap-1 shrink-0 whitespace-nowrap opacity-90" 
                  title="Tồn sổ sách kế toán"
                >
                  <ReceiptText size={11} strokeWidth={2.4} className="shrink-0" />
                  <span className="tabular-nums font-black">
                    {product.accounting_stock || 0}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Barcode / Code */}
          {product.code && (
            <span className={cn(
              "shrink-0 px-2 py-0.5 rounded-md font-mono text-[9.5px] font-black tabular-nums transition-colors",
              isActive ? "bg-white/20 text-white" : "bg-slate-900/10 dark:bg-white/10 text-slate-600 dark:text-slate-300"
            )}>
              {product.code}
            </span>
          )}

          {/* Main Unit */}
          <span className={cn(
            "px-2.5 py-0.5 rounded-md transition-colors font-bold",
            isActive ? "bg-white/20 text-white" : "bg-black/[0.05] dark:bg-white/[0.08] text-slate-700 dark:text-slate-300"
          )}>
            {normalizeUOM(product.unit)}
          </span>

          {/* Secondary Unit */}
          {product.multiplier > 1 && (
            <span className={isActive ? "text-white/60" : "text-slate-500 opacity-60"}>
              / {normalizeUOM(product.secondary_unit)} (x{product.multiplier})
            </span>
          )}

          {/* Active Ingredient */}
          {product.active_ingredient && (
            <span 
              className="text-[11px] font-bold italic tracking-wide text-slate-400 dark:text-slate-400 normal-case truncate max-w-[280px]" 
              style={{ color: isActive ? colorTheme.accentMuted : colorTheme.muted }} 
              title={product.active_ingredient}
            >
              • {product.active_ingredient}
            </span>
          )}
        </div>
      </div>

      {/* Right Column: Price & Latest Cost Price */}
      <div className="flex items-center gap-4 relative z-10 shrink-0">
        <div className="flex flex-col items-end gap-1">
          <div 
            className="text-[22px] font-black tracking-tighter tabular-nums" 
            style={{ color: isActive ? colorTheme.accent : colorTheme.main }}
          >
            {formatNumber(price)}
          </div>
          <div className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest opacity-80">
            NHẬP CUỐI: {formatNumber(product.latest_cost_price)}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.product?.id === next.product?.id &&
    prev.product?.stock === next.product?.stock &&
    prev.product?.sale_price === next.product?.sale_price &&
    prev.product?.bulk_price === next.product?.bulk_price &&
    prev.product?.cost_price === next.product?.cost_price &&
    prev.product?.latest_cost_price === next.product?.latest_cost_price &&
    prev.product?.name === next.product?.name &&
    prev.isActive === next.isActive &&
    prev.index === next.index &&
    prev.displayPrice === next.displayPrice &&
    prev.showLastPurchaseBadge === next.showLastPurchaseBadge &&
    prev.lastPurchase === next.lastPurchase &&
    prev.accountingEnabled === next.accountingEnabled &&
    prev.product?.accounting_stock === next.product?.accounting_stock
  );
});

export default ProductSearchItem;
