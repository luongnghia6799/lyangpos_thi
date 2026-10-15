import React, { memo } from 'react';
import { Plus } from 'lucide-react';
import ResizableDropdownContainer from '@/components/widgets/ResizableDropdownContainer';
import ProductSearchItem from './ProductSearchItem';
import { cn } from '../../lib/utils';

/**
 * POSProductDropdown - Isolated product search dropdown for both main and cart-row editing
 * Separated from POSPage to avoid full-page re-renders during keyboard navigation and search typing.
 */
const POSProductDropdown = memo(function POSProductDropdown({
  id = 'pos-product-dropdown',
  dropdownKey = 'pos-product-dropdown',
  storageKey = 'pos_product_dropdown_size',
  coords,
  scrollRef,
  products = [],
  activeIndex = 0,
  searchQuery = '',
  colorTheme,
  showLastPurchaseBadge = false,
  partnerLastPurchases = {},
  isAccountingFeatureEnabled = false,
  getCustomPrice,
  onHover,
  onSelect,
  onQuickStock,
  onContextMenu,
  onCreateNewProduct
}) {
  if (!searchQuery || !coords || coords.top <= 0) return null;

  return (
    <ResizableDropdownContainer
      key={id}
      id={id}
      dropdownKey={dropdownKey}
      storageKey={storageKey}
      coords={coords}
      defaultWidth={720}
      defaultMaxHeight={480}
      scrollRef={scrollRef}
      itemCount={products.length}
    >
      {products.map((prod, idx) => {
        const displayPrice = getCustomPrice ? getCustomPrice(prod) : undefined;
        return (
          <ProductSearchItem
            key={prod.id}
            product={prod}
            isActive={idx === activeIndex}
            index={idx}
            colorTheme={colorTheme}
            displayPrice={displayPrice}
            showLastPurchaseBadge={showLastPurchaseBadge}
            lastPurchase={partnerLastPurchases?.[prod.id]}
            accountingEnabled={isAccountingFeatureEnabled}
            onHover={(i) => {
              if (activeIndex !== i) onHover?.(i);
            }}
            onSelect={(selectedProd) => onSelect?.(selectedProd)}
            onQuickStock={(p, c) => onQuickStock?.(p, c)}
            onContextMenu={(e, p) => onContextMenu?.(e, p)}
          />
        );
      })}

      {searchQuery && (
        <div
          className={cn(
            "dropdown-item flex items-center justify-between gap-3 cursor-pointer group/quick-add transition-all duration-150 select-none",
            products.length === 0 ? "p-4" : "p-3 border-t border-[#8b6f47]/15 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]"
          )}
          onClick={() => onCreateNewProduct?.(searchQuery.trim())}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-[#d4a574] flex items-center justify-center shrink-0 group-hover/quick-add:scale-110 group-hover/quick-add:bg-white/20 group-hover/quick-add:text-white transition-all shadow-xs">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
              {products.length === 0 && (
                <span className="text-[10px] font-black uppercase tracking-wider text-primary/70 dark:text-[#d4a574]/80 group-hover/quick-add:text-white/80">
                  Chưa có trong danh mục
                </span>
              )}
              <div className="text-xs font-black uppercase tracking-tight truncate group-hover/quick-add:text-white text-primary dark:text-[#d4a574]">
                Thêm sản phẩm mới: <span className="underline underline-offset-2">"{searchQuery.trim()}"</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary/10 dark:bg-white/10 text-primary dark:text-[#d4a574] group-hover/quick-add:bg-white/20 group-hover/quick-add:text-white border border-primary/20 dark:border-white/10 font-mono shadow-2xs">
            <span>Thêm nhanh</span>
          </div>
        </div>
      )}
    </ResizableDropdownContainer>
  );
});

export default POSProductDropdown;

