import React, { memo } from 'react';
import { Plus } from 'lucide-react';
import ResizableDropdownContainer from '@/components/widgets/ResizableDropdownContainer';
import ProductSearchItem from './ProductSearchItem';

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

      {searchQuery && products.length === 0 && (
        <div
          className="dropdown-item flex items-center justify-center gap-3 font-black uppercase text-[12px] tracking-widest border-t border-transparent cursor-pointer"
          onClick={() => onCreateNewProduct?.(searchQuery)}
        >
          <Plus size={18} strokeWidth={3} />
          <span>Thêm sản phẩm mới: "{searchQuery}"</span>
        </div>
      )}
    </ResizableDropdownContainer>
  );
});

export default POSProductDropdown;
