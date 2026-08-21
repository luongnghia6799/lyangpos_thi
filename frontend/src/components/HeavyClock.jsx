import React, { useState, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import { cn } from '../lib/utils';

const HeavyClock = ({ variant = 'posnew', gpuDisabled = false, className = '' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalTime = gpuDisabled ? 60000 : 1000;
    const timer = setInterval(() => setCurrentTime(new Date()), intervalTime);
    return () => clearInterval(timer);
  }, [gpuDisabled]);

  if (variant === 'purchase') {
    const lunarObj = Lunar.fromDate(currentTime);
    return (
      <div className={cn(
        "group/clock flex items-center justify-between gap-2 sm:gap-2.5",
        "bg-[#8b6f47]/[0.06] hover:bg-[#8b6f47]/[0.1] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",
        "border border-[#8b6f47]/20 dark:border-white/10 hover:border-[#2d5016]/40 dark:hover:border-emerald-400/30",
        "rounded-xl px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-md shadow-xs",
        "select-none cursor-default transition-all duration-300 w-full sm:w-auto",
        className
      )}>
        {/* Left: Solar Date & Lunar / Weekday */}
        <div className="flex flex-col items-start justify-center leading-none min-w-0">
          <div className="text-[11px] sm:text-[11.5px] font-black text-[#2d5016] dark:text-[#e8dfd5] tracking-tight tabular-nums">
            {currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
          </div>
          <div className="flex items-center gap-1 text-[7.5px] sm:text-[8px] font-black text-[#8b6f47] dark:text-[#d4a574] tracking-tight uppercase mt-0.5">
            <span>{currentTime.toLocaleDateString("vi-VN", { weekday: "short" })}</span>
            <span className="opacity-40">•</span>
            <span className="text-[#2d5016]/90 dark:text-emerald-400/90 font-black">
              ÂM {lunarObj.getDay()}/{lunarObj.getMonth()}
            </span>
          </div>
        </div>

        {/* Proportional Divider */}
        <div className="w-px h-4.5 sm:h-5 bg-gradient-to-b from-transparent via-[#8b6f47]/30 dark:via-white/20 to-transparent shrink-0 mx-0.5" />

        {/* Right: Time */}
        <div className="flex items-baseline font-black text-[13.5px] sm:text-[15px] text-[#2d5016] dark:text-emerald-400 tabular-nums tracking-tight leading-none drop-shadow-xs">
          <span>{currentTime.getHours().toString().padStart(2, "0")}</span>
          <span className="text-[#8b6f47] dark:text-[#d4a574] px-0.5 animate-pulse">:</span>
          <span>{currentTime.getMinutes().toString().padStart(2, "0")}</span>
        </div>
      </div>
    );
  }

  if (variant === 'posnew') {
    return (
      <div className={cn(
        "flex items-center gap-3 bg-gradient-to-br from-amber-500/15 via-white/70 to-amber-200/5 dark:from-emerald-500/10 dark:via-slate-900/80 dark:to-amber-900/10 backdrop-blur-2xl rounded-2xl px-4 py-2.5 border border-[#8b6f47]/25 dark:border-white/10 shadow-[0_15px_35px_rgba(45,80,22,0.06)] relative overflow-hidden group/clock transition-all hover:shadow-[#2d5016]/10",
        className
      )}>
        <div className="flex flex-col items-end leading-tight pr-3 border-r border-[#8b6f47]/20 dark:border-white/10">
          <span className="text-[9px] font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-[0.2em]">{currentTime.toLocaleDateString("vi-VN", { weekday: "short" })}</span>
          <span className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574] tabular-nums">{currentTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-baseline font-black text-2xl tracking-tighter tabular-nums gap-0.5">
            <span className="text-[#2d5016] dark:text-white drop-shadow-sm">{currentTime.getHours().toString().padStart(2, "0")}</span>
            <span className="text-[#8b6f47] dark:text-[#d4a574]">:</span>
            <span className="text-[#2d5016] dark:text-white drop-shadow-sm">{currentTime.getMinutes().toString().padStart(2, "0")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-[#2d5016] dark:text-emerald-400 tabular-nums mb-1">{currentTime.getSeconds().toString().padStart(2, "0")}</span>
            <div className="w-5 h-1 bg-[#2d5016]/10 dark:bg-white/5 rounded-full overflow-hidden">
              <m.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full bg-[#2d5016] dark:bg-emerald-400" />
            </div>
          </div>
        </div>
        <div className="w-9 h-9 bg-[#2d5016]/10 dark:bg-emerald-400/10 text-[#2d5016] dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover/clock:rotate-12 transition-all shadow-none border border-[#2d5016]/10">
          <Clock size={18} strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  if (variant === 'pos') {
    return (
      <div className={cn(
        "group/clock flex items-center gap-3 bg-[#8b6f47]/5 dark:bg-slate-900/40 backdrop-blur-xl rounded-full px-4 py-1.5 border border-[#8b6f47]/20 dark:border-white/10 shadow-lg shadow-black/5 hover:scale-105 active:scale-95 transition-all duration-500 cursor-default",
        className
      )}>
        <div className="flex flex-col items-end leading-none">
          <span className="text-[9px] font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">
            {currentTime.toLocaleDateString("vi-VN", { weekday: "short" })}
          </span>
          <span className="text-[11px] font-black text-[#8b6f47] dark:text-[#d4a574] tabular-nums">
            {currentTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </span>
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#8b6f47]/20 dark:via-white/10 to-transparent" />

        <div className="flex items-center gap-3">
          <div className="flex items-baseline font-black text-2xl tracking-tighter tabular-nums gap-1">
            <span className="text-[#2d5016] dark:text-white drop-shadow-sm">
              {currentTime.getHours().toString().padStart(2, "0")}
            </span>
            <span className="text-[#8b6f47] dark:text-[#d4a574] font-bold">:</span>
            <span className="text-[#2d5016] dark:text-white drop-shadow-sm">
              {currentTime.getMinutes().toString().padStart(2, "0")}
            </span>
          </div>

          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="18"
                className="stroke-[#8b6f47]/10 dark:stroke-white/5"
                strokeWidth="3"
                fill="none"
              />
              <m.circle
                cx="20"
                cy="20"
                r="18"
                className="stroke-[#2d5016] dark:stroke-emerald-400"
                strokeWidth="3"
                fill="none"
                strokeDasharray="113.1"
                initial={{ strokeDashoffset: 113.1 }}
                animate={{ strokeDashoffset: 113.1 - (113.1 * currentTime.getSeconds()) / 60 }}
                transition={{ duration: 1, ease: "linear" }}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#2d5016] dark:text-emerald-400 tabular-nums">
              {currentTime.getSeconds().toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default React.memo(HeavyClock);
