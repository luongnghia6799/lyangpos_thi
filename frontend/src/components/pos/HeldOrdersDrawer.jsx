import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Pause, X, Trash2 } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import Portal from '@/components/widgets/Portal';

/**
 * Drawer hiển thị danh sách hóa đơn đang treo / chờ xử lý
 */
export default function HeldOrdersDrawer({
  isOpen,
  heldOrders = [],
  onClose,
  onRestoreOrder,
  onDeleteHeldOrder
}) {
  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[2000] flex justify-end font-sans no-print select-none">
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={onClose}
            />

            {/* Sliding Panel */}
            <m.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 32,
                stiffness: 260
              }}
              className="relative w-full max-w-[440px] h-full bg-[#f8f6f0]/95 dark:bg-[#022c22]/95 backdrop-blur-[100px] flex flex-col border-l border-[#8b6f47]/20 dark:border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-[#8b6f47]/15 dark:border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-700 text-[#8b6f47] dark:text-white">
                  <Pause size={100} />
                </div>
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-amber-500/10 dark:bg-white/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-white/10 shadow-xs">
                      <Pause size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-black text-[14px] text-stone-800 dark:text-white uppercase tracking-tighter leading-none mb-1">
                        Hóa đơn chờ
                      </h3>
                      <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Đang treo ({heldOrders.length})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center bg-stone-200/60 dark:bg-white/10 hover:bg-rose-500/15 dark:hover:bg-rose-500/20 text-stone-500 hover:text-rose-600 dark:text-white/60 dark:hover:text-rose-400 rounded-xl transition-all hover:rotate-90 border border-stone-200/80 dark:border-white/10 cursor-pointer"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Body: Danh sách hóa đơn treo */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-4">
                {heldOrders.length === 0 ? (
                  <div className="text-center py-40 opacity-30 dark:opacity-20">
                    <Pause size={60} strokeWidth={1} className="mx-auto mb-8 text-stone-700 dark:text-white" />
                    <p className="font-black uppercase text-[10px] tracking-[0.4em] text-stone-700 dark:text-white">
                      Trống trải...
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {heldOrders.map((held, idx) => (
                      <m.div
                        key={held.id}
                        id={idx === 0 ? "first-held-card" : undefined}
                        tabIndex={0}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-white/90 dark:bg-white/[0.04] border border-[#8b6f47]/20 dark:border-white/5 rounded-2xl p-4 hover:border-amber-500/50 dark:hover:border-amber-500/40 focus:border-amber-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all group hover:bg-white dark:hover:bg-white/[0.08] outline-none focus:outline-none cursor-pointer shadow-xs hover:shadow-md"
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            const next = e.currentTarget.nextElementSibling;
                            if (next) next.focus();
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            const prev = e.currentTarget.previousElementSibling;
                            if (prev) prev.focus();
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            onRestoreOrder(held);
                          }
                        }}
                      >
                        {/* Partner & Time */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 pr-3 min-w-0">
                            <div className="font-black text-stone-800 dark:text-white uppercase text-xs leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                              {held.partner ? held.partner.name : "KHÁCH BÁN LẺ"}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="text-[8px] font-black text-stone-500 dark:text-white/30 bg-stone-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider tabular-nums border border-stone-200 dark:border-white/5">
                                {held.time}
                              </div>
                              <div className="text-[8px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/20 dark:border-amber-500/10 uppercase tracking-widest">
                                {held.cart?.length || 0} món
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cart preview */}
                        {held.cart && held.cart.length > 0 && (
                          <div className="border-t border-[#8b6f47]/15 dark:border-white/5 mt-2 pt-2 flex flex-wrap gap-1 mb-3">
                            {held.cart.slice(0, 3).map((item, cIdx) => (
                              <div
                                key={cIdx}
                                className="px-1.5 py-0.5 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-md text-[8px] font-black text-amber-700 dark:text-amber-400/90 uppercase flex items-center gap-1 transition-all hover:bg-amber-500/15 dark:hover:bg-amber-500/10"
                              >
                                <span className="truncate max-w-[70px]">{item.product_name}</span>
                                <div className="w-px h-1.5 bg-amber-500/30 dark:bg-amber-500/20" />
                                <span className="text-amber-600 dark:text-amber-300 font-bold">
                                  {formatNumber(item.quantity)}
                                </span>
                              </div>
                            ))}
                            {held.cart.length > 3 && (
                              <div className="px-1.5 py-0.5 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 rounded-md text-[8px] font-black text-stone-500 dark:text-white/30 uppercase tracking-tighter">
                                +{held.cart.length - 3} món
                              </div>
                            )}
                          </div>
                        )}

                        {/* Total & Action Buttons */}
                        <div className="flex justify-between items-center bg-stone-100/90 dark:bg-black/20 p-3 rounded-xl border border-stone-200/80 dark:border-white/5">
                          <div className="text-amber-600 dark:text-amber-400 font-black text-lg tracking-tighter tabular-nums">
                            {formatNumber(held.total)}
                          </div>
                          <div className="flex gap-2">
                            <m.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onDeleteHeldOrder(held.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/20 dark:border-rose-500/10 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
                              title="Xóa hóa đơn chờ"
                            >
                              <Trash2 size={12} strokeWidth={2.5} />
                            </m.button>
                            <m.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onRestoreOrder(held)}
                              className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500/20 dark:hover:bg-amber-500 text-white dark:text-amber-400 dark:hover:text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border border-amber-500 dark:border-amber-500/10 active:scale-95 cursor-pointer shadow-xs"
                            >
                              MỞ LẠI
                            </m.button>
                          </div>
                        </div>
                      </m.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-[#8b6f47]/15 dark:border-white/10">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl border border-stone-300 dark:border-white/10 text-stone-500 dark:text-white/30 font-black uppercase text-[9px] hover:bg-stone-100 dark:hover:bg-white/5 hover:text-stone-800 dark:hover:text-white transition-all tracking-[0.3em] active:scale-[0.98] cursor-pointer"
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
}
