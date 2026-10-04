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
            <span className="shrink-0 px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black tracking-widest">
              COMBO
            </span>
          )}

          {showLastPurchaseBadge && lastPurchase && (
            <span 
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-600 dark:bg-indigo-600 text-white text-[11px] font-black border border-indigo-700 dark:border-indigo-500 shadow-xs animate-in fade-in zoom-in-90 duration-200 transition-all hover:scale-105 select-none" 
              title={`Đã mua: ${formatRelativePurchaseDate(lastPurchase.last_date)} (Giá: ${formatNumber(lastPurchase.last_price)}đ)`}
            >
              <Clock size={11} className="text-white shrink-0" />
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
              "px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 group/stock cursor-pointer select-none shadow-xs shrink-0 normal-case",
              product.stock <= 0
                ? "bg-rose-600 text-white"
                : product.stock < 10
                  ? "bg-amber-500 text-slate-950"
                  : "bg-[#2d5016] dark:bg-emerald-600 text-white"
            )}
            title="Kiểm tồn nhanh"
          >
            <div className="flex items-center gap-1 tabular-nums">
              {product.stock <= 0 ? (
                <PackageX size={12} strokeWidth={2.8} className="text-white shrink-0" />
              ) : product.stock < 10 ? (
                <CircleAlert size={12} strokeWidth={2.8} className="text-slate-950 shrink-0" />
              ) : (
                <PackageCheck size={12} strokeWidth={2.8} className="text-white shrink-0" />
              )}
              <span className={cn("tabular-nums font-black", product.stock < 10 && product.stock > 0 ? "text-slate-950" : "text-white")}>
                {product.stock}
              </span>
            </div>

            {accountingEnabled && (
              <>
                <span className={cn("w-px h-3 shrink-0", product.stock < 10 && product.stock > 0 ? "bg-slate-950/30" : "bg-white/40")} />
                <div 
                  className={cn("inline-flex items-center gap-1 shrink-0 whitespace-nowrap", product.stock < 10 && product.stock > 0 ? "text-slate-950" : "text-white/90")} 
                  title="Tồn sổ sách kế toán"
                >
                  <ReceiptText size={11} strokeWidth={2.4} className={cn("shrink-0", product.stock < 10 && product.stock > 0 ? "text-slate-950" : "text-white")} />
                  <span className={cn("tabular-nums font-black", product.stock < 10 && product.stock > 0 ? "text-slate-950" : "text-white")}>
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
});

export default ProductSearchItem;
