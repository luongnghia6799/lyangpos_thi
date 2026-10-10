import React, { useMemo } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Tv, Coins, User, Copy } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import Portal from '@/components/widgets/Portal';

/**
 * Popover kiểm tra và đồng bộ các máy trạm POS từ xa
 */
export default function RemoteTerminalInspectPopover({
  isOpen,
  anchorRef,
  onClose,
  terminals = [],
  activeTerminalId,
  onInspectTerminal,
  onCopyCart
}) {
  const uniqueTerminals = useMemo(() => {
    const seen = new Set();
    const result = [];
    const sorted = [...terminals].sort((a, b) => {
      const aIsPos = (a.terminal_name || "").includes("MÁY POS") || (a.terminal_id || "").includes("127.0.0.1");
      const bIsPos = (b.terminal_name || "").includes("MÁY POS") || (b.terminal_id || "").includes("127.0.0.1");
      return aIsPos && !bIsPos ? 1 : !aIsPos && bIsPos ? -1 : (b.terminal_id || "").length - (a.terminal_id || "").length;
    });

    for (const term of sorted) {
      const ipOrId = term.ip_address || term.terminal_id;
      if (ipOrId && !seen.has(ipOrId)) {
        seen.add(ipOrId);
        result.push(term);
      }
    }
    return result;
  }, [terminals]);

  if (!isOpen) return null;

  let posStyle = {
    position: "fixed",
    top: "100px",
    right: "100px",
    zIndex: 99999
  };

  if (anchorRef?.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    posStyle = {
      position: "fixed",
      top: `${rect.bottom + 6}px`,
      right: `${Math.max(10, window.innerWidth - rect.right)}px`,
      zIndex: 99999
    };
  }

  return (
    <Portal>
      <AnimatePresence>
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={posStyle}
          className="w-[340px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3.5 space-y-3 text-foreground ring-1 ring-border select-none no-print"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="pb-2 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Tv size={12} className="text-emerald-500" />
                MÁY TRẠM HOẠT ĐỘNG
              </div>
            </span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-rose-500 text-sm font-black p-1 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {uniqueTerminals.length === 0 ? (
              <div className="p-4 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                Không tìm thấy máy trạm nào online
              </div>
            ) : (
              uniqueTerminals.map((term) => {
                const isActive = activeTerminalId === term.terminal_id;
                const totalItems = term.total_items || (term.cart ? term.cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0);
                const isMobile = (term.terminal_id || "").includes("Mobile") || (term.current_page || "").includes("Mobile");
                const totalAmount = term.total_amount || 0;

                return (
                  <div
                    key={term.terminal_id}
                    className={cn(
                      "w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all relative overflow-hidden",
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500 text-foreground shadow-md shadow-emerald-500/5"
                        : "bg-card/60 border-border hover:bg-card"
                    )}
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => onInspectTerminal(term.terminal_id)}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 text-sm",
                          isActive
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-card border-border text-muted-foreground"
                        )}
                      >
                        {isMobile ? <Coins size={16} /> : <Tv size={16} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black uppercase tracking-wide truncate text-foreground">
                          {term.user_name && !term.user_name.includes("Thu ngân")
                            ? `${term.user_name} (${term.ip_address})`
                            : `MÁY POS (${term.ip_address})`}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground truncate flex items-center gap-1">
                          <User size={10} />
                          {term.terminal_name || term.terminal_id}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-0.5">
                        {formatNumber(totalAmount)}đ
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/10 tabular-nums">
                        {totalItems} món
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyCart(term.cart);
                      }}
                      className="p-2 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/20 cursor-pointer shadow-xs"
                      title="Sao chép nhanh giỏ hàng từ máy này"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </m.div>
      </AnimatePresence>
    </Portal>
  );
}
