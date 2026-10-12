import React, { memo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { User, Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ResizableDropdownContainer from '@/components/widgets/ResizableDropdownContainer';
import PartnerSearchItem from './PartnerSearchItem';

/**
 * POSPartnerDropdown - Isolated partner search dropdown component
 * Separated from POSPage to avoid full-page re-renders during keyboard navigation and search typing.
 */
const POSPartnerDropdown = memo(function POSPartnerDropdown({
  isOpen = false,
  searchQuery = '',
  filteredPartners = [],
  activeIndex = 0,
  scrollRef,
  onHover,
  onSelectRetail,
  onSelectPartner,
  onCreateQuickPartner,
  onContextMenu
}) {
  if (!isOpen) return null;

  const hasSearch = Boolean(searchQuery);
  const itemCount = filteredPartners.length + (hasSearch ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <ResizableDropdownContainer
          key="pos-partner-dropdown"
          id="pos-partner-dropdown"
          dropdownKey="pos-partner-dropdown"
          storageKey="pos_partner_dropdown_size"
          coords={null}
          defaultWidth={600}
          defaultMaxHeight={500}
          className="!z-[3000] frosted-glass dropdown-frosted-glass"
          scrollRef={scrollRef}
          itemCount={itemCount}
        >
          {/* Option: Default Retail Guest (Khách vãng lai) */}
          {!hasSearch && (
            <m.div
              data-index={0}
              className={cn(
                "dropdown-item flex items-center gap-3.5 px-4 py-3.5 transition-all relative cursor-pointer",
                activeIndex === 0 && "active"
              )}
              onMouseMove={() => {
                if (activeIndex !== 0) onHover?.(0);
              }}
              onMouseDown={e => {
                e.preventDefault();
                onSelectRetail?.();
              }}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative z-10 shrink-0 border",
                  activeIndex === 0
                    ? "bg-white/20 text-white border-transparent"
                    : "bg-black/[0.04] dark:bg-white/10 text-slate-700 dark:text-slate-300 border-black/5 dark:border-white/10 shadow-xs"
                )}
              >
                <User size={22} strokeWidth={2.5} />
              </div>
              <div className="relative z-10 py-1">
                <p
                  className={cn(
                    "font-black uppercase tracking-tight text-base md:text-[17px] leading-snug pt-0.5",
                    activeIndex === 0 ? "text-white" : "text-slate-900 dark:text-white"
                  )}
                >
                  KHÁCH VÃNG LAI
                </p>
                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-widest leading-relaxed mt-0.5",
                    activeIndex === 0 ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  MẶC ĐỊNH KHÔNG LƯU NỢ
                </p>
              </div>
            </m.div>
          )}

          {/* List of matched partners */}
          {filteredPartners.map((partner, idx) => {
            const isItemActive = hasSearch ? activeIndex === idx : activeIndex === idx + 1;
            const targetIndex = hasSearch ? idx : idx + 1;
            return (
              <PartnerSearchItem
                key={partner.id}
                partner={partner}
                isActive={isItemActive}
                index={idx}
                targetIndex={targetIndex}
                onHover={(index) => onHover?.(index)}
                onSelect={(selected) => onSelectPartner?.(selected)}
                onContextMenu={(e, p) => onContextMenu?.(e, p)}
              />
            );
          })}

          {/* Option: Quick create new partner */}
          {hasSearch && (
            <div
              className="dropdown-item flex items-center justify-between group/add border-t border-black/5 dark:border-white/5 px-4 py-3 cursor-pointer"
              onMouseDown={e => {
                e.preventDefault();
                onCreateQuickPartner?.(searchQuery);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center group-hover/add:rotate-90 transition-transform text-primary shrink-0">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <div className="py-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-normal">
                    Đối tác mới
                  </p>
                  <p className="text-sm font-black uppercase tracking-tight text-primary leading-snug pt-0.5">
                    Tạo nhanh "{searchQuery}"
                  </p>
                </div>
              </div>
              <ChevronRight size={18} strokeWidth={3} className="opacity-40 group-hover/add:translate-x-1 transition-transform" />
            </div>
          )}
        </ResizableDropdownContainer>
      )}
    </AnimatePresence>
  );
});

export default POSPartnerDropdown;
