import React, { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Clock,
  Plus,
  Loader2
} from "lucide-react";
import { formatNumber, cn } from "../lib/utils";

const QuickAuditPopout = ({
  product,
  isOpen,
  onClose,
  onSave,
  coordinates,
}) => {
  const [actualTotal, setActualTotal] = useState(product?.stock || 0);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Split actual stock into Thung/Le for multi-unit products
  const [thung, setThung] = useState(0);
  const [le, setLe] = useState(0);

  const thungInputRef = useRef(null);
  const leInputRef = useRef(null);
  const singleInputRef = useRef(null);

  const multiplier = product?.multiplier || 1;
  const hasMultipleUnits = multiplier > 1;

  // Track open state to prevent re-initializing when only stock changes
  const prevOpenRef = useRef(false);
  const prevProductIdRef = useRef(null);

  useEffect(() => {
    // Only initialize (reset inputs) when the popout opens OR when auditing a completely different product
    const justOpened = isOpen && !prevOpenRef.current;
    const productChanged = product?.id !== prevProductIdRef.current;

    if (isOpen && (justOpened || productChanged) && product) {
      setActualTotal(product.stock || 0);
      if (hasMultipleUnits) {
        setThung(Math.trunc(product.stock / multiplier));
        setLe(product.stock % multiplier);
      } else {
        setThung(0);
        setLe(product.stock || 0);
      }
      setNote("");

      // Auto focus
      setTimeout(() => {
        if (hasMultipleUnits) {
          thungInputRef.current?.focus();
          thungInputRef.current?.select();
        } else {
          singleInputRef.current?.focus();
          singleInputRef.current?.select();
        }
      }, 100);
      
      prevProductIdRef.current = product.id;
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, product?.id, multiplier, hasMultipleUnits]);

  const containerRef = useRef(null);
  const [adjustedStyle, setAdjustedStyle] = useState({ 
    position: "fixed", 
    opacity: 0, 
    visibility: "hidden",
    pointerEvents: "none"
  });

  useEffect(() => {
    if (isOpen && coordinates) {
      const checkPosition = () => {
        if (!containerRef.current) return;

        const winH = window.innerHeight;
        const winW = window.innerWidth;
        const rect = containerRef.current.getBoundingClientRect();
        const h = rect.height || 400;
        const w = rect.width || 320;

        let top = (coordinates.bottom || coordinates.top) + 8;
        let left = coordinates.left;
        let transform = "translateX(-100%)";
        let origin = "top right";

        // Vertical check
        if (top + h > winH) {
          // Show above the anchor
          top = (coordinates.top || coordinates.bottom) - h - 8;
          origin = "bottom right";
          if (top < 0) {
            top = 10; // fallback to top with margin
            origin = "top right";
          }
        }

        // Horizontal check
        if (left - w < 0) {
          left = coordinates.left;
          transform = "translateX(0)";
          origin = origin.replace("right", "left");
        } else if (left > winW) {
          left = winW - 10;
        }

        setAdjustedStyle({
          position: "fixed",
          top: `${top}px`,
          left: `${left}px`,
          transform,
          transformOrigin: origin,
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
        });
      };

      // Fast calculate first
      checkPosition();
      // Re-check after a frame to be sure about dimensions
      const timer = setTimeout(checkPosition, 50);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setAdjustedStyle({ opacity: 0, pointerEvents: "none" });
    }
  }, [isOpen, coordinates]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleUpdateActual = (newThung, newLe) => {
    const total = newThung * multiplier + newLe;
    setActualTotal(total);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        note: note || `Kiểm nhanh tại POS: ${product.name}`,
        items: [
          {
            product_id: product.id,
            actual_stock: actualTotal,
            system_stock: product.stock,
          },
        ],
      });
      onClose();
    } catch (err) {
      console.error("Quick Audit failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !product) return null;

  const diff = actualTotal - product.stock;

  const popoverVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 300 },
    },
    exit: { opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } },
  };

  return (
    <div
      ref={containerRef}
      style={adjustedStyle}
      className="z-[2000] focus-within:z-[2100]"
    >
      <m.div
        variants={popoverVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-card w-72 rounded-2xl border border-border flex flex-col relative z-10 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 flex items-start justify-between border-b border-border bg-card">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Signature Rotating Icon */}
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0 mt-0.5">
              <RefreshCcw size={20} className="text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground uppercase tracking-wide truncate leading-tight">
                {product.name}
              </h3>
              <div className="flex flex-col items-start gap-1 mt-1">
                <span className="px-1.5 py-0.5 bg-secondary/10 rounded text-[9px] font-bold text-foreground uppercase tracking-wider leading-none">
                  #{product.code || "---"}
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <Clock size={10} className="text-emerald-500 shrink-0" />
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider tabular-nums leading-none">
                    {product.latest_audit ? (() => {
                      const d = new Date(product.latest_audit);
                      const pad = (n) => String(n).padStart(2, "0");
                      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
                    })() : "CHƯA KIỂM KÊ"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Batch Info Chip */}
        {product.latest_stock_entry && (
          <div className="mx-5 mt-4 p-3 bg-background/50 rounded-xl border border-border/85 flex items-center justify-between relative overflow-hidden group/stock">
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-6 h-6 bg-indigo-500/20 rounded-xl flex items-center justify-center shadow-inner">
                <Clock size={12} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-indigo-500/60 dark:text-indigo-400/60 uppercase tracking-widest leading-none mb-0.5">Lô hàng gần nhất</span>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                  {product.latest_stock_entry.date}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end relative z-10">
              <div className="px-2 py-0.5 bg-emerald-500/15 rounded-lg border border-emerald-500/20 flex items-center gap-1 shadow-sm">
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                  {formatNumber(product.latest_stock_entry.quantity)}
                </span>
                <span className="text-[8px] font-bold text-emerald-600/50 dark:text-emerald-400/50 uppercase">
                  {product.unit}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-4 bg-card/50 relative z-10">
          {/* Comparison View */}
          <div className="flex gap-3">
            <div className="flex-1 p-3.5 bg-background/50 rounded-2xl border border-border/80 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Trên máy</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground tabular-nums tracking-tight">
                  {product.stock}
                </span>
                <span className="text-xs font-medium text-muted-foreground uppercase">{product.unit}</span>
              </div>
            </div>
            
            <div className={cn(
              "flex-1 p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-center",
              diff === 0 
                ? "bg-background/30 border-border" 
                : diff > 0 
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                  : "bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]"
            )}>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Lệch</span>
              <div className={cn(
                "flex items-baseline gap-1 font-bold text-xl tabular-nums tracking-tight",
                diff === 0 ? "text-muted-foreground" : diff > 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {diff > 0 ? "+" : ""}{diff}
                <span className="text-xs font-medium uppercase opacity-80">{product.unit}</span>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-3.5">
            {hasMultipleUnits ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative group/in">
                  <input
                    ref={thungInputRef}
                    type="number"
                    className="w-full bg-background/50 dark:bg-slate-800/80 border-2 border-border focus:border-primary focus:bg-background h-12 px-3 rounded-xl text-center font-bold text-lg outline-none tabular-nums dark:text-white transition-all"
                    value={thung || ""}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setThung(val);
                      handleUpdateActual(val, le);
                    }}
                  />
                  <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-card text-[9px] font-bold text-primary uppercase border border-primary/20 rounded-md">
                    {product.secondary_unit}
                  </span>
                </div>
                <div className="relative group/in">
                  <input
                    ref={leInputRef}
                    type="number"
                    className="w-full bg-background/50 dark:bg-slate-800/80 border-2 border-border focus:border-primary focus:bg-background h-12 px-3 rounded-xl text-center font-bold text-lg outline-none tabular-nums dark:text-white transition-all"
                    value={le || ""}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setLe(val);
                      handleUpdateActual(thung, val);
                    }}
                  />
                  <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-card text-[9px] font-bold text-primary uppercase border border-primary/20 rounded-md">
                    Lẻ ({product.unit})
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative group/in">
                <input
                  ref={singleInputRef}
                  type="number"
                  className="w-full bg-background/50 dark:bg-slate-800/80 border-2 border-border focus:border-primary focus:bg-background h-14 rounded-xl text-center font-bold text-2xl outline-none tabular-nums dark:text-white transition-all"
                  value={actualTotal || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setActualTotal(val);
                  }}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background px-2.5 py-1 rounded-lg border border-border">
                  {product.unit}
                </div>
              </div>
            )}
            
            {hasMultipleUnits && (
              <div className="px-3 py-2 bg-primary/10 rounded-xl flex justify-between items-center border border-primary/20">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Tổng quy lẻ</span>
                <span className="text-base font-bold text-primary tabular-nums">
                  {actualTotal} <span className="text-xs font-medium">{product.unit}</span>
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Check size={16} strokeWidth={3} />
                LƯU KIỂM KHO
              </>
            )}
          </button>
        </form>
      </m.div>
    </div>
  );
};

export default QuickAuditPopout;
