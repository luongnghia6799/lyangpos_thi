import React from 'react';
import { motion as m } from 'framer-motion';
import { User, Phone, MapPin } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import MarqueeText from '@/components/widgets/MarqueeText';

/**
 * Memoized single item in Partner Search Dropdown.
 * Only re-renders when its own `isActive` status or partner data changes.
 */
const PartnerSearchItem = React.memo(function PartnerSearchItem({
  partner,
  isActive = false,
  index,
  targetIndex,
  onSelect,
  onHover,
  onContextMenu
}) {
  const debt = partner.debt_balance || 0;

  return (
    <m.div
      key={partner.id}
      data-index={targetIndex}
      onMouseMove={() => onHover?.(targetIndex)}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect?.(partner);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, partner);
      }}
      className={cn(
        "dropdown-item flex justify-between items-center px-4 py-3 transition-all relative cursor-pointer",
        isActive && "active"
      )}
    >
      <div className="flex items-center gap-3.5 relative z-10 min-w-0 pr-3">
        <div
          className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all border",
            isActive
              ? "bg-white/20 text-white border-transparent"
              : "bg-black/[0.04] dark:bg-white/10 text-slate-700 dark:text-slate-300 border-black/5 dark:border-white/10 shadow-xs"
          )}
        >
          <User size={22} strokeWidth={2.5} />
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 py-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 transition-colors",
                isActive
                  ? "bg-white/20 border-white/40 text-white"
                  : partner.is_customer && partner.is_supplier
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                    : partner.is_customer
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400"
              )}
            >
              {partner.is_customer && partner.is_supplier
                ? "KH & NCC"
                : partner.is_customer
                  ? "KH"
                  : "NCC"}
            </span>

            <div className="min-w-0 flex-1 overflow-hidden">
              <MarqueeText
                text={partner.name}
                isActive={isActive}
                className={cn(
                  "font-black tracking-tight text-base md:text-[17px] leading-snug",
                  isActive ? "text-white" : "text-slate-900 dark:text-white"
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-3.5 text-xs font-bold tracking-wide transition-colors leading-relaxed",
              isActive ? "text-white/80" : "text-slate-500 dark:text-slate-400"
            )}
          >
            <span className="flex items-center gap-1 shrink-0">
              <Phone size={12} strokeWidth={2.5} className="opacity-60" />
              {partner.phone || "---"}
            </span>
            {partner.address && (
              <span className="flex items-center gap-1 truncate max-w-[220px]">
                <MapPin size={12} strokeWidth={2.5} className="opacity-60" />
                {partner.address}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right relative z-10 flex flex-col items-end gap-1 shrink-0 pl-2">
        <p
          className={cn(
            "text-2xl font-black tabular-nums tracking-tight leading-snug pt-0.5 transition-colors",
            isActive
              ? "text-white"
              : debt > 0
                ? "text-[#d93025] dark:text-rose-400"
                : debt < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[#0f9d58] dark:text-emerald-400 font-bold"
          )}
        >
          {(debt > 0 ? "+" : "") + formatNumber(Math.abs(debt))}
        </p>
        <div
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors border",
            isActive
              ? "bg-white/20 border-white/40 text-white"
              : "border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300 bg-black/[0.03] dark:bg-white/[0.05]"
          )}
        >
          {debt > 0 ? "KHÁCH NỢ" : debt < 0 ? "MÌNH NỢ" : "HẾT NỢ"}
        </div>
      </div>
    </m.div>
  );
});

export default PartnerSearchItem;
