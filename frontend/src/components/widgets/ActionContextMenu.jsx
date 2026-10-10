import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as m, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Bot,
  Copy,
  ReceiptText,
  History,
  Trash2,
  Check,
  Sparkles,
  Package,
  UserCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MASCOT_LIST, DEFAULT_MASCOT_CONFIG } from '../../lib/mascots';

const containerVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.94, 
    y: -8,
    transition: {
      duration: 0.15,
      ease: "easeInOut"
    }
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.035,
      delayChildren: 0.015
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -4,
    transition: {
      duration: 0.18,
      ease: "easeInOut",
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    x: -12, 
    y: -2,
    filter: "blur(4px)" 
  },
  visible: { 
    opacity: 1, 
    x: 0, 
    y: 0,
    filter: "blur(0px)",
    transition: { 
      type: "spring", 
      stiffness: 450, 
      damping: 25,
      mass: 0.6
    } 
  },
  exit: { 
    opacity: 0, 
    x: -10, 
    filter: "blur(3px)",
    transition: {
      duration: 0.12,
      ease: "easeIn"
    }
  }
};

/**
 * Custom Context Menu for Product & Partner interactions
 */
export default function ActionContextMenu({
  isOpen,
  position,
  type = 'product', // 'product' | 'partner'
  data = null,      // product object or partner object
  onClose,
  onEdit,
  onConsultAI,
  onViewHistory,
  onDelete,
  extraItems = []
}) {
  const menuRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [mascotConfig, setMascotConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lyang_mascot_config');
      if (saved) return { ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_MASCOT_CONFIG;
  });

  useEffect(() => {
    const handleMascotUpdate = () => {
      try {
        const saved = localStorage.getItem('lyang_mascot_config');
        if (saved) setMascotConfig({ ...DEFAULT_MASCOT_CONFIG, ...JSON.parse(saved) });
      } catch (e) {}
    };
    window.addEventListener('storage', handleMascotUpdate);
    window.addEventListener('lyang_mascot_config_changed', handleMascotUpdate);
    return () => {
      window.removeEventListener('storage', handleMascotUpdate);
      window.removeEventListener('lyang_mascot_config_changed', handleMascotUpdate);
    };
  }, []);

  const currentChar = MASCOT_LIST.find((c) => c.id === mascotConfig?.characterId) || MASCOT_LIST[0];
  const mascotImageUrl = currentChar?.directions || '/mascots/lyang-directions.webp';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const handleScroll = () => {
      onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  // Calculate adjusted positioning to prevent overflowing viewport
  const menuWidth = 248;
  const menuHeight = type === 'product' ? 270 : 230;
  let posX = position?.x || 0;
  let posY = position?.y || 0;

  if (posX + menuWidth > window.innerWidth - 12) {
    posX = Math.max(12, window.innerWidth - menuWidth - 12);
  }
  if (posY + menuHeight > window.innerHeight - 12) {
    posY = Math.max(12, window.innerHeight - menuHeight - 12);
  }

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose?.();
    }, 400);
  };

  const isPartner = type === 'partner';
  const itemName = isPartner ? (data.name || 'Đối tác') : (data.name || data.product_name || 'Sản phẩm');
  const itemSub = isPartner ? (data.phone || 'Không có SĐT') : (data.code || data.product_code || data.unit || 'Sản phẩm');

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999999] pointer-events-auto"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose?.();
        }}
      >
        <m.div
          ref={menuRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            top: posY,
            left: posX,
            backgroundColor: 'color-mix(in srgb, var(--bg-color, #faf8f3) 93%, transparent)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-64 text-slate-800 dark:text-slate-100 rounded-2xl border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-2 overflow-hidden select-none ring-1 ring-black/5 dark:ring-white/5"
        >
          {/* In chìm Mascot (Watermark Background) */}
          <div 
            className="absolute -right-5 -bottom-5 w-36 h-36 pointer-events-none select-none z-0 opacity-[0.14] dark:opacity-[0.18] transition-all duration-300"
            style={{
              backgroundImage: `url("${mascotImageUrl}")`,
              backgroundPosition: '50% 50%',
              backgroundSize: '300% 300%',
              backgroundRepeat: 'no-repeat',
              filter: 'grayscale(25%) contrast(1.1)',
            }}
          />

          {/* Content Layer */}
          <div className="relative z-10">
            {/* Header Preview */}
            <m.div 
              variants={itemVariants}
              className="px-2.5 py-2 mb-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 flex items-center gap-2"
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                isPartner 
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25" 
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
              )}>
                {isPartner ? (
                  <UserCheck size={16} strokeWidth={2.5} />
                ) : (
                  <Package size={16} strokeWidth={2.5} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-xs truncate leading-tight text-slate-900 dark:text-white" title={itemName}>
                  {itemName}
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 truncate font-mono mt-0.5">
                  {itemSub}
                </div>
              </div>
            </m.div>

            <div className="space-y-0.5">
              {/* 1. Edit Action */}
              {onEdit && (
                <m.button
                  type="button"
                  variants={itemVariants}
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onClose?.();
                    onEdit(data);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#8b6f47]/10 dark:hover:bg-emerald-500/15 text-slate-700 dark:text-slate-200 hover:text-[#694e2b] dark:hover:text-emerald-300 transition-colors cursor-pointer group"
                >
                  <Edit3 size={15} className="text-[#8b6f47] dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>{isPartner ? "Sửa thông tin đối tác" : "Xem & Sửa sản phẩm"}</span>
                </m.button>
              )}

              {/* 2. AI Consultation for Product */}
              {!isPartner && onConsultAI && (
                <m.button
                  type="button"
                  variants={itemVariants}
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onClose?.();
                    onConsultAI(data);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer group"
                >
                  <Bot size={15} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="flex-1 text-left">Hỏi Trợ lý AI (Công dụng, liều...)</span>
                  <Sparkles size={12} className="text-emerald-500 animate-pulse" />
                </m.button>
              )}

              {/* 3. Transaction / Debt History for Partner or Price/Stock History for Product */}
              {onViewHistory && (
                <m.button
                  type="button"
                  variants={itemVariants}
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onClose?.();
                    onViewHistory(data);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/10 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                >
                  {isPartner ? (
                    <>
                      <ReceiptText size={15} className="text-blue-500 group-hover:scale-110 transition-transform" />
                      <span>Xem Công nợ / Lịch sử mua</span>
                    </>
                  ) : (
                    <>
                      <History size={15} className="text-blue-500 group-hover:scale-110 transition-transform" />
                      <span>Xem Lịch sử giá & Nhập xuất</span>
                    </>
                  )}
                </m.button>
              )}

              {/* 4. Copy Name or Code */}
              <m.button
                type="button"
                variants={itemVariants}
                whileHover={{ x: 4, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCopyText(itemName)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  {copied ? (
                    <Check size={15} className="text-emerald-500" />
                  ) : (
                    <Copy size={15} className="text-slate-400 group-hover:scale-110 transition-transform" />
                  )}
                  <span>{copied ? "Đã sao chép!" : `Sao chép tên ${isPartner ? "đối tác" : "sản phẩm"}`}</span>
                </div>
              </m.button>

              {/* Extra items (like delete from cart or custom options) */}
              {extraItems.map((item, idx) => (
                <m.button
                  key={idx}
                  type="button"
                  variants={itemVariants}
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onClose?.();
                    item.onClick?.(data);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer group",
                    item.danger 
                      ? "hover:bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                  )}
                >
                  {item.icon && <item.icon size={15} className="group-hover:scale-110 transition-transform" />}
                  <span>{item.label}</span>
                </m.button>
              ))}

              {/* Delete from Cart if provided */}
              {onDelete && (
                <>
                  <m.div variants={itemVariants} className="h-px bg-slate-300/60 dark:bg-white/10 my-1 mx-1" />
                  <m.button
                    type="button"
                    variants={itemVariants}
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onClose?.();
                      onDelete(data);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer group"
                  >
                    <Trash2 size={15} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    <span>Xóa khỏi giỏ hàng</span>
                  </m.button>
                </>
              )}
            </div>
          </div>
        </m.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
