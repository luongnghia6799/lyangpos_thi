import React, { useState, useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Lunar } from 'lunar-javascript';


const HeavyClock = ({ variant = 'posnew', gpuDisabled = false }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalTime = variant === 'purchase' ? 30000 : (gpuDisabled ? 60000 : 1000);
    const timer = setInterval(() => setCurrentTime(new Date()), intervalTime);
    return () => clearInterval(timer);
  }, [gpuDisabled, variant]);

  if (variant === 'posnew') {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-br from-amber-500/15 via-white/70 to-amber-200/5 dark:from-amber-500/20 dark:via-slate-900/80 dark:to-amber-900/10 backdrop-blur-2xl rounded-2xl px-4 py-2.5 border border-white/60 dark:border-white/10 shadow-[0_15px_35px_rgba(245,158,11,0.08)] relative overflow-hidden group/clock transition-all hover:shadow-amber-500/20">
        <div className="flex flex-col items-end leading-tight pr-3 border-r border-slate-200/50 dark:border-white/10">
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{currentTime.toLocaleDateString("vi-VN", { weekday: "short" })}</span>
          <span className="text-[10px] font-black text-slate-400 tabular-nums">{currentTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-baseline font-black text-2xl tracking-tighter tabular-nums gap-0.5">
            <span className="text-slate-900 dark:text-white drop-shadow-sm">{currentTime.getHours().toString().padStart(2, "0")}</span>
            <span className="text-primary">:</span>
            <span className="text-slate-900 dark:text-white drop-shadow-sm">{currentTime.getMinutes().toString().padStart(2, "0")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-primary tabular-nums mb-1">{currentTime.getSeconds().toString().padStart(2, "0")}</span>
            <div className="w-5 h-1 bg-primary/10 dark:bg-white/5 rounded-full overflow-hidden">
              <m.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full bg-primary/60" />
            </div>
          </div>
        </div>
        <div className="w-9 h-9 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl flex items-center justify-center group-hover/clock:rotate-12 transition-all shadow-none border border-primary/10">
          <Clock size={18} strokeWidth={3} />
        </div>
      </div>
    );
  }

  if (variant === 'pos') {
    return (
      <div className="group/clock flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-full px-4 py-1.5 border border-slate-200/50 dark:border-white/10 shadow-lg shadow-black/5 hover:scale-105 active:scale-95 transition-all duration-500 cursor-default">
        <div className="flex flex-col items-end leading-none">
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">
            {currentTime.toLocaleDateString("vi-VN", { weekday: "short" })}
          </span>
          <span className="text-[11px] font-black text-slate-400 tabular-nums">
            {currentTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </span>
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-200 dark:via-white/10 to-transparent" />

        <div className="flex items-center gap-3">
          <div className="flex items-baseline font-black text-2xl tracking-tighter tabular-nums gap-1">
            <span className="text-slate-900 dark:text-white drop-shadow-sm">
              {currentTime.getHours().toString().padStart(2, "0")}
            </span>
            <span className="text-primary font-bold">:</span>
            <span className="text-slate-900 dark:text-white drop-shadow-sm">
              {currentTime.getMinutes().toString().padStart(2, "0")}
            </span>
          </div>

          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="18"
                className="stroke-slate-100 dark:stroke-white/5"
                strokeWidth="3"
                fill="none"
              />
              <m.circle
                cx="20"
                cy="20"
                r="18"
                className="stroke-primary"
                strokeWidth="3"
                fill="none"
                strokeDasharray="113.1"
                initial={{ strokeDashoffset: 113.1 }}
                animate={{ strokeDashoffset: 113.1 - (113.1 * currentTime.getSeconds()) / 60 }}
                transition={{ duration: 1, ease: "linear" }}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary tabular-nums">
              {currentTime.getSeconds().toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'purchase') {
    return (
      <div className="flex items-center gap-2.5 bg-transparent rounded-xl px-3 py-1.5 select-none cursor-default border border-black/10 dark:border-white/10 transition-colors">
          <div className="flex flex-col items-start leading-none justify-center">
              <span className="text-[11px] font-bold text-slate-800 dark:text-white tracking-tight">
                  {currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-[8px] font-black text-amber-600 dark:text-[#d4a574] tracking-tighter mt-0.5 uppercase">
                  {currentTime.toLocaleDateString("vi-VN", { weekday: "short" })} • Âm {Lunar.fromDate(currentTime).getDay()}/{Lunar.fromDate(currentTime).getMonth()}
              </span>
          </div>
          <div className="w-[1px] h-5 bg-black/10 dark:bg-white/10" />
          <div className="text-[14px] font-black text-slate-800 dark:text-white tabular-nums tracking-tight leading-none">
              {currentTime.getHours().toString().padStart(2, "0")}:{currentTime.getMinutes().toString().padStart(2, "0")}
          </div>
      </div>
    );
  }

  return null;
};

export default React.memo(HeavyClock);
