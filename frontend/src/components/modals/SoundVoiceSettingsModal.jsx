import React, { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  X, 
  Settings, 
  Music, 
  MessageSquareQuote, 
  ShoppingCart, 
  ReceiptText, 
  Sparkles, 
  Search, 
  TriangleAlert, 
  CircleCheck,
  Banknote,
  Trash2,
  RefreshCw,
  LoaderCircle
} from 'lucide-react';
import { cn, speakNumber, speakAudioSequence, stopAllTTS } from '@/lib/utils';
import { 
  playAddToCartSound, 
  playSuccessSound, 
  playPopSound as playActionSound, 
  playTypingSound as playTypingSoundUtil, 
  playErrorSound,
  precacheCommonTTS,
  cancelPrecacheCommonTTS,
  clearTTSAudioCache
} from '@/lib/utils';

/**
 * High-performance memoized Sound & Voice (TTS) Settings Modal
 */
const SoundVoiceSettingsModal = React.memo(function SoundVoiceSettingsModal({
  isOpen = false,
  onClose,
  products = []
}) {
  const [activeTab, setActiveTab] = useState('general');

  // Sound Themes State
  const [soundThemeCartAdd, setSoundThemeCartAdd] = useState(() => localStorage.getItem('pos_sound_theme_cart_add') || 'barcode_beep');
  const [soundThemeSuccess, setSoundThemeSuccess] = useState(() => localStorage.getItem('pos_sound_theme_success') || 'chime');
  const [soundThemeAction, setSoundThemeAction] = useState(() => localStorage.getItem('pos_sound_theme_action') || 'pop_bubble');
  const [soundThemeTyping, setSoundThemeTyping] = useState(() => localStorage.getItem('pos_sound_theme_typing') || 'mechanical');
  const [soundThemeError, setSoundThemeError] = useState(() => localStorage.getItem('pos_sound_theme_error') || 'buzz_low');
  const [typingSoundEnabled, setTypingSoundEnabled] = useState(() => localStorage.getItem('pos_typing_sound_enabled') !== 'false');

  // TTS Engine State
  const [ttsMode, setTtsMode] = useState(() => localStorage.getItem('pos_tts_mode') || 'female');
  const [speechRate, setSpeechRate] = useState(() => parseFloat(localStorage.getItem('pos_speech_rate')) || 1.4);
  const [speechPitch, setSpeechPitch] = useState(() => parseInt(localStorage.getItem('pos_speech_pitch')) || 0);
  const [speechGap, setSpeechGap] = useState(() => parseInt(localStorage.getItem('pos_speech_gap')) || 150);

  // Content options
  const [readProduct, setReadProduct] = useState(() => localStorage.getItem('pos_tts_read_product') !== 'false');
  const [readQty, setReadQty] = useState(() => localStorage.getItem('pos_tts_read_qty') !== 'false');
  const [readTotal, setReadTotal] = useState(() => localStorage.getItem('pos_tts_read_total') !== 'false');
  const [readThanks, setReadThanks] = useState(() => localStorage.getItem('pos_tts_read_thanks') !== 'false');

  // Templates
  const [speechOrder, setSpeechOrder] = useState(() => localStorage.getItem('pos_tts_cart_speech_order') || 'name_first');
  const [currencyTemplate, setCurrencyTemplate] = useState(() => localStorage.getItem('pos_tts_currency_template') || 'dạ {amount} đồng');
  const [currencyPartnerTemplate, setCurrencyPartnerTemplate] = useState(() => localStorage.getItem('pos_tts_currency_partner_template') || 'dạ {amount} đồng');
  const [thankyouTemplate, setThankyouTemplate] = useState(() => localStorage.getItem('pos_tts_thankyou_template') || 'Cảm ơn quý khách');
  const [thankyouPartnerTemplate, setThankyouPartnerTemplate] = useState(() => localStorage.getItem('pos_tts_thankyou_partner_template') || 'Cảm ơn {partner}');

  // Precache progress state
  const [precacheProgress, setPrecacheProgress] = useState({ active: false, completed: 0, total: 0, currentText: '' });

  useEffect(() => {
    const handleProgress = (e) => {
      if (e.detail) setPrecacheProgress(e.detail);
    };
    window.addEventListener('tts-precache-progress', handleProgress);
    return () => window.removeEventListener('tts-precache-progress', handleProgress);
  }, []);

  const broadcastSetting = (key, value) => {
    try {
      const bc = new BroadcastChannel('pos_data_sync');
      bc.postMessage({ type: 'UI_SETTING_UPDATED', key, value });
      bc.close();
    } catch (e) {}
  };

  const handleVoiceMode = (mode) => {
    setTtsMode(mode);
    localStorage.setItem('pos_tts_mode', mode);
    broadcastSetting('pos_tts_mode', mode);
    if (mode !== 'off') {
      setTimeout(() => precacheCommonTTS(products), 100);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300000] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            onClick={onClose}
          />

          {/* Modal Content */}
          <m.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fcfbf9] dark:bg-[#071510] backdrop-blur-2xl w-full max-w-2xl rounded-[2.5rem] border border-[#8b6f47]/30 dark:border-emerald-500/20 shadow-[0_25px_70px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.6)] overflow-hidden relative p-6 space-y-4 text-foreground max-h-[90vh] flex flex-col box-border z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-1">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#8b6f47]/10 dark:bg-emerald-500/15 border border-[#8b6f47]/25 dark:border-emerald-500/30 text-[#8b6f47] dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                  <Volume2 size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-1 flex items-center gap-2">
                    <span>Cài đặt âm thanh & Giọng đọc</span>
                  </h3>
                  <p className="text-[11px] font-bold text-[#8b6f47]/80 dark:text-emerald-400/70">
                    Tùy biến hiệu ứng Web Audio & Giọng đọc AI thời gian thực
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all hover:rotate-90 cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Nav Tabs */}
            <div className="flex p-1 bg-[#f4efe6] dark:bg-[#040e0a] rounded-2xl gap-1 border border-[#8b6f47]/20 dark:border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={cn(
                  "flex-1 py-2 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "general"
                    ? "bg-white dark:bg-[#0f2e21] text-[#8b6f47] dark:text-emerald-300 shadow-sm border border-[#8b6f47]/25 dark:border-emerald-500/40"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Settings size={14} strokeWidth={2.5} />
                <span>Giọng đọc TTS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sounds")}
                className={cn(
                  "flex-1 py-2 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "sounds"
                    ? "bg-white dark:bg-[#0f2e21] text-[#8b6f47] dark:text-emerald-300 shadow-sm border border-[#8b6f47]/25 dark:border-emerald-500/40"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Music size={14} strokeWidth={2.5} />
                <span>Hiệu ứng âm thanh</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("templates")}
                className={cn(
                  "flex-1 py-2 px-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "templates"
                    ? "bg-white dark:bg-[#0f2e21] text-[#8b6f47] dark:text-emerald-300 shadow-sm border border-[#8b6f47]/25 dark:border-emerald-500/40"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <MessageSquareQuote size={14} strokeWidth={2.5} />
                <span>Mẫu câu thông báo</span>
              </button>
            </div>

            {/* TAB 1: GIỌNG ĐỌC TTS */}
            {activeTab === "general" && (
              <div className="space-y-4 overflow-y-auto max-h-[52vh] pr-1.5 custom-scrollbar">
                {/* Voice Mode Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>Giọng đọc chính (TTS Engine)</span>
                    <span className="text-[10px] text-[#8b6f47] dark:text-emerald-400 font-bold">Edge Neural AI (Tự nhiên)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleVoiceMode("off")}
                      className={cn(
                        "py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-tight flex flex-col items-center gap-1.5 transition-all border cursor-pointer",
                        ttsMode === "off"
                          ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20 scale-[1.02]"
                          : "bg-white dark:bg-[#06140e] text-slate-700 dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/5 hover:bg-[#f4efe6] dark:hover:bg-white/5"
                      )}
                    >
                      <VolumeX size={20} strokeWidth={2.5} />
                      <span>Tắt giọng đọc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVoiceMode("female")}
                      className={cn(
                        "py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-tight flex flex-col items-center gap-1.5 transition-all border cursor-pointer",
                        ttsMode === "female"
                          ? "bg-[#8b6f47] dark:bg-emerald-600 text-white border-[#8b6f47] dark:border-emerald-500 shadow-md shadow-[#8b6f47]/20 dark:shadow-emerald-600/20 scale-[1.02]"
                          : "bg-white dark:bg-[#06140e] text-slate-700 dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/5 hover:bg-[#f4efe6] dark:hover:bg-white/5"
                      )}
                    >
                      <Volume2 size={20} strokeWidth={2.5} />
                      <span>Giọng Nữ (Hoài My)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVoiceMode("male")}
                      className={cn(
                        "py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-tight flex flex-col items-center gap-1.5 transition-all border cursor-pointer",
                        ttsMode === "male"
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20 scale-[1.02]"
                          : "bg-white dark:bg-[#06140e] text-slate-700 dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/5 hover:bg-[#f4efe6] dark:hover:bg-white/5"
                      )}
                    >
                      <Volume2 size={20} strokeWidth={2.5} />
                      <span>Giọng Nam (Nam Minh)</span>
                    </button>
                  </div>
                </div>

                {/* Speed Slider */}
                <div className="space-y-2 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 p-4 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="uppercase tracking-wider text-slate-700 dark:text-slate-300">Tốc độ đọc giọng</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#8b6f47]/15 dark:bg-emerald-500/15 text-[#8b6f47] dark:text-emerald-300 font-mono font-black text-xs">
                      {speechRate}x {speechRate === 1.4 ? "(Chuẩn tối ưu)" : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSpeechRate(val);
                      localStorage.setItem("pos_speech_rate", val.toString());
                    }}
                    className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between gap-1 pt-1">
                    {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => {
                          setSpeechRate(sp);
                          localStorage.setItem("pos_speech_rate", sp.toString());
                          setTimeout(() => precacheCommonTTS(products), 100);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer",
                          speechRate === sp
                            ? "bg-[#8b6f47] dark:bg-emerald-600 text-white shadow-xs"
                            : "bg-white dark:bg-[#06140e] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-[#8b6f47]/20 dark:border-white/5"
                        )}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="space-y-2 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 p-4 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="uppercase tracking-wider text-slate-700 dark:text-slate-300">Tông giọng (Cao - Thấp / Trầm - Bổng)</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#8b6f47]/15 dark:bg-emerald-500/15 text-[#8b6f47] dark:text-emerald-300 font-mono font-black text-xs">
                      {speechPitch === 0 ? "0Hz (Chuẩn tự nhiên)" : speechPitch > 0 ? `+${speechPitch}Hz (Bổng/Trẻ trung)` : `${speechPitch}Hz (Trầm ấm)`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="5"
                    value={speechPitch}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSpeechPitch(val);
                      localStorage.setItem("pos_speech_pitch", val.toString());
                    }}
                    className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {[
                      { val: -20, label: "Trầm ấm (-20)" },
                      { val: -10, label: "Hơi trầm (-10)" },
                      { val: 0, label: "Chuẩn (0)" },
                      { val: 10, label: "Hơi bổng (+10)" },
                      { val: 20, label: "Trong trẻo (+20)" },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setSpeechPitch(item.val);
                          localStorage.setItem("pos_speech_pitch", item.val.toString());
                          setTimeout(() => precacheCommonTTS(products), 100);
                        }}
                        className={cn(
                          "px-1.5 py-1 rounded-lg text-[9.5px] font-black transition-all cursor-pointer text-center truncate",
                          speechPitch === item.val
                            ? "bg-[#8b6f47] dark:bg-emerald-600 text-white shadow-xs"
                            : "bg-white dark:bg-[#06140e] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-[#8b6f47]/20 dark:border-white/5"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speech Gap Slider */}
                <div className="space-y-2 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 p-4 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="uppercase tracking-wider text-slate-700 dark:text-slate-300">Khoảng nghỉ giữa Tên món & Số lượng</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#8b6f47]/15 dark:bg-emerald-500/15 text-[#8b6f47] dark:text-emerald-300 font-mono font-black text-xs">
                      {speechGap}ms {speechGap === 150 ? "(Tự nhiên)" : speechGap === 0 ? "(Liền mạch 0ms)" : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="25"
                    value={speechGap}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSpeechGap(val);
                      localStorage.setItem("pos_speech_gap", val.toString());
                    }}
                    className="w-full accent-[#8b6f47] dark:accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                  <div className="grid grid-cols-6 gap-1 pt-1">
                    {[
                      { val: 0, label: "0ms" },
                      { val: 50, label: "50ms" },
                      { val: 100, label: "100ms" },
                      { val: 150, label: "150ms" },
                      { val: 200, label: "200ms" },
                      { val: 300, label: "300ms" },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setSpeechGap(item.val);
                          localStorage.setItem("pos_speech_gap", item.val.toString());
                        }}
                        className={cn(
                          "px-1.5 py-1 rounded-lg text-[9.5px] font-black transition-all cursor-pointer text-center truncate",
                          speechGap === item.val
                            ? "bg-[#8b6f47] dark:bg-emerald-600 text-white shadow-xs"
                            : "bg-white dark:bg-[#06140e] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-[#8b6f47]/20 dark:border-white/5"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content options */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Tùy chọn đọc nội dung</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !readProduct;
                        setReadProduct(next);
                        localStorage.setItem("pos_tts_read_product", next.toString());
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer",
                        readProduct
                          ? "bg-[#8b6f47]/10 dark:bg-emerald-500/10 border-[#8b6f47]/40 dark:border-emerald-500/40 text-[#694e2b] dark:text-emerald-300 font-black shadow-xs"
                          : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 opacity-60 text-slate-500"
                      )}
                    >
                      <input type="checkbox" checked={readProduct} readOnly className="w-4 h-4 accent-[#8b6f47] dark:accent-emerald-600 rounded" />
                      <div className="flex flex-col">
                        <span>Đọc tên sản phẩm</span>
                        <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 leading-tight">(Chỉ đọc khi có bí danh / alias)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !readQty;
                        setReadQty(next);
                        localStorage.setItem("pos_tts_read_qty", next.toString());
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer",
                        readQty
                          ? "bg-[#8b6f47]/10 dark:bg-emerald-500/10 border-[#8b6f47]/40 dark:border-emerald-500/40 text-[#694e2b] dark:text-emerald-300 font-black shadow-xs"
                          : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 opacity-60 text-slate-500"
                      )}
                    >
                      <input type="checkbox" checked={readQty} readOnly className="w-4 h-4 accent-[#8b6f47] dark:accent-emerald-600 rounded" />
                      <span>Đọc số lượng món</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !readTotal;
                        setReadTotal(next);
                        localStorage.setItem("pos_tts_read_total", next.toString());
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer",
                        readTotal
                          ? "bg-[#8b6f47]/10 dark:bg-emerald-500/10 border-[#8b6f47]/40 dark:border-emerald-500/40 text-[#694e2b] dark:text-emerald-300 font-black shadow-xs"
                          : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 opacity-60 text-slate-500"
                      )}
                    >
                      <input type="checkbox" checked={readTotal} readOnly className="w-4 h-4 accent-[#8b6f47] dark:accent-emerald-600 rounded" />
                      <span>Đọc tổng tiền hóa đơn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !readThanks;
                        setReadThanks(next);
                        localStorage.setItem("pos_tts_read_thanks", next.toString());
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer",
                        readThanks
                          ? "bg-[#8b6f47]/10 dark:bg-emerald-500/10 border-[#8b6f47]/40 dark:border-emerald-500/40 text-[#694e2b] dark:text-emerald-300 font-black shadow-xs"
                          : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 opacity-60 text-slate-500"
                      )}
                    >
                      <input type="checkbox" checked={readThanks} readOnly className="w-4 h-4 accent-[#8b6f47] dark:accent-emerald-600 rounded" />
                      <span>Đọc lời cảm ơn sau lưu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !typingSoundEnabled;
                        setTypingSoundEnabled(next);
                        localStorage.setItem("pos_typing_sound_enabled", next ? "true" : "false");
                        broadcastSetting("pos_typing_sound_enabled", next ? "true" : "false");
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left col-span-2 cursor-pointer",
                        typingSoundEnabled
                          ? "bg-[#8b6f47]/10 dark:bg-emerald-500/10 border-[#8b6f47]/40 dark:border-emerald-500/40 text-[#694e2b] dark:text-emerald-300 font-black shadow-xs"
                          : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 opacity-60 text-slate-500"
                      )}
                    >
                      <input type="checkbox" checked={typingSoundEnabled} readOnly className="w-4 h-4 accent-[#8b6f47] dark:accent-emerald-600 rounded" />
                      <span>Bật tiếng lách cách bàn phím khi gõ tìm kiếm (F2)</span>
                    </button>
                  </div>
                </div>

                {/* Precache Audio Management */}
                <div className="space-y-2.5 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                      <Sparkles size={15} strokeWidth={2.5} /> Tải trước âm thanh giọng đọc (Offline Cache)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={precacheProgress.active}
                      onClick={() => precacheCommonTTS(products)}
                      className="flex-1 py-2 px-3 bg-[#8b6f47] hover:bg-[#6e5433] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {precacheProgress.active ? (
                        <>
                          <LoaderCircle size={14} className="animate-spin" />
                          <span>Đang tải ({precacheProgress.completed}/{precacheProgress.total})...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>Tải trước danh sách đọc ({products.length} món)</span>
                        </>
                      )}
                    </button>

                    {precacheProgress.active && (
                      <button
                        type="button"
                        onClick={() => cancelPrecacheCommonTTS()}
                        className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => clearTTSAudioCache()}
                      className="py-2 px-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 rounded-xl text-xs font-black transition-all cursor-pointer"
                      title="Xóa bộ nhớ đệm âm thanh"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HIỆU ỨNG ÂM THANH */}
            {activeTab === "sounds" && (
              <div className="space-y-3.5 overflow-y-auto max-h-[52vh] pr-1.5 custom-scrollbar">
                {/* 1. Thêm món */}
                <div className="space-y-2.5 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                      <ShoppingCart size={15} strokeWidth={2.5} /> 1. Âm thanh khi thêm món vào giỏ
                    </label>
                    <button
                      type="button"
                      onClick={() => playAddToCartSound(soundThemeCartAdd)}
                      className="text-[11px] font-black text-[#8b6f47] dark:text-emerald-400 hover:underline flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#8b6f47]/10 dark:bg-emerald-500/10 border border-[#8b6f47]/15 dark:border-emerald-500/20 cursor-pointer"
                    >
                      <Volume2 size={12} /><span>Nghe thử</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                    {[
                      { id: 'barcode_beep', label: 'Tít máy quét' },
                      { id: 'bubble_drop', label: 'Giọt nước' },
                      { id: 'laser_blip', label: 'Tia Laser' },
                      { id: 'bell_ding', label: 'Chuông Ting' },
                      { id: 'wood_click', label: 'Gõ thanh mộc' },
                      { id: 'coin_drop', label: 'Thả đồng xu' },
                      { id: 'cyber_pop', label: 'Cyber Pop' },
                      { id: 'off', label: 'Tắt âm', isOff: true }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSoundThemeCartAdd(t.id);
                          localStorage.setItem('pos_sound_theme_cart_add', t.id);
                          playAddToCartSound(t.id);
                          broadcastSetting('pos_sound_theme_cart_add', t.id);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                          soundThemeCartAdd === t.id
                            ? t.isOff
                              ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-black shadow-xs ring-1 ring-rose-500/30"
                              : "bg-[#8b6f47]/15 dark:bg-emerald-500/20 border-[#8b6f47] dark:border-emerald-500 text-[#694e2b] dark:text-emerald-200 font-black shadow-xs ring-1 ring-[#8b6f47]/30 dark:ring-emerald-500/40"
                            : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-[#8b6f47]/40 dark:hover:border-emerald-500/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {t.isOff ? <VolumeX size={13} className="text-rose-500 shrink-0" /> : <Volume2 size={13} className="text-[#8b6f47] dark:text-emerald-400 shrink-0" />}
                          <span className="truncate">{t.label}</span>
                        </div>
                        {soundThemeCartAdd === t.id && (
                          t.isOff ? <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1" /> : <CircleCheck size={14} className="text-[#8b6f47] dark:text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Lưu đơn thành công */}
                <div className="space-y-2.5 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                      <ReceiptText size={15} strokeWidth={2.5} /> 2. Âm thanh hoàn tất / Lưu đơn
                    </label>
                    <button
                      type="button"
                      onClick={() => playSuccessSound(soundThemeSuccess)}
                      className="text-[11px] font-black text-[#8b6f47] dark:text-emerald-400 hover:underline flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#8b6f47]/10 dark:bg-emerald-500/10 border border-[#8b6f47]/15 dark:border-emerald-500/20 cursor-pointer"
                    >
                      <Volume2 size={12} /><span>Nghe thử</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-bold">
                    {[
                      { id: 'chime', label: 'Chuông Triad ngân' },
                      { id: 'cash_register', label: 'Két tiền Cha-ching' },
                      { id: 'digital_pos', label: 'POS Điện tử' },
                      { id: 'mario', label: 'Ăn xu Arcade' },
                      { id: 'subtle_wood', label: 'Gỗ Mộc Marimba' },
                      { id: 'fanfare', label: 'Khải hoàn Fanfare' },
                      { id: 'zen_bell', label: 'Chuông Bát Thiền' },
                      { id: 'coin_clink', label: 'Tiếng Xu Keng' },
                      { id: 'off', label: 'Tắt âm', isOff: true }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSoundThemeSuccess(t.id);
                          localStorage.setItem('pos_sound_theme_success', t.id);
                          playSuccessSound(t.id);
                          broadcastSetting('pos_sound_theme_success', t.id);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                          soundThemeSuccess === t.id
                            ? t.isOff
                              ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-black shadow-xs ring-1 ring-rose-500/30"
                              : "bg-[#8b6f47]/15 dark:bg-emerald-500/20 border-[#8b6f47] dark:border-emerald-500 text-[#694e2b] dark:text-emerald-200 font-black shadow-xs ring-1 ring-[#8b6f47]/30 dark:ring-emerald-500/40"
                            : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-[#8b6f47]/40 dark:hover:border-emerald-500/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {t.isOff ? <VolumeX size={13} className="text-rose-500 shrink-0" /> : <Volume2 size={13} className="text-[#8b6f47] dark:text-emerald-400 shrink-0" />}
                          <span className="truncate">{t.label}</span>
                        </div>
                        {soundThemeSuccess === t.id && (
                          t.isOff ? <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1" /> : <CircleCheck size={14} className="text-[#8b6f47] dark:text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Thao tác click */}
                <div className="space-y-2.5 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                      <Sparkles size={15} strokeWidth={2.5} /> 3. Âm thao tác (Chọn, Đổi tab, Xóa)
                    </label>
                    <button
                      type="button"
                      onClick={() => playActionSound(soundThemeAction)}
                      className="text-[11px] font-black text-[#8b6f47] dark:text-emerald-400 hover:underline flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#8b6f47]/10 dark:bg-emerald-500/10 border border-[#8b6f47]/15 dark:border-emerald-500/20 cursor-pointer"
                    >
                      <Volume2 size={12} /><span>Nghe thử</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                    {[
                      { id: 'pop_bubble', label: 'Bóng nước Pop' },
                      { id: 'click_switch', label: 'Nút bấm sắc' },
                      { id: 'tap_wooden', label: 'Gõ lách cách' },
                      { id: 'beep_soft', label: 'Tít êm dịu' },
                      { id: 'whoosh_subtle', label: 'Lướt gió Whoosh' },
                      { id: 'camera_snap', label: 'Máy ảnh Snap' },
                      { id: 'off', label: 'Tắt âm', isOff: true }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSoundThemeAction(t.id);
                          localStorage.setItem('pos_sound_theme_action', t.id);
                          playActionSound(t.id);
                          broadcastSetting('pos_sound_theme_action', t.id);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                          soundThemeAction === t.id
                            ? t.isOff
                              ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-black shadow-xs ring-1 ring-rose-500/30"
                              : "bg-[#8b6f47]/15 dark:bg-emerald-500/20 border-[#8b6f47] dark:border-emerald-500 text-[#694e2b] dark:text-emerald-200 font-black shadow-xs ring-1 ring-[#8b6f47]/30 dark:ring-emerald-500/40"
                            : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-[#8b6f47]/40 dark:hover:border-emerald-500/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {t.isOff ? <VolumeX size={13} className="text-rose-500 shrink-0" /> : <Volume2 size={13} className="text-[#8b6f47] dark:text-emerald-400 shrink-0" />}
                          <span className="truncate">{t.label}</span>
                        </div>
                        {soundThemeAction === t.id && (
                          t.isOff ? <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1" /> : <CircleCheck size={14} className="text-[#8b6f47] dark:text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Gõ phím tìm kiếm */}
                <div className="space-y-2.5 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                      <Search size={15} strokeWidth={2.5} /> 4. Âm thanh gõ ô tìm kiếm (F2)
                    </label>
                    <button
                      type="button"
                      onClick={() => playTypingSoundUtil(soundThemeTyping)}
                      className="text-[11px] font-black text-[#8b6f47] dark:text-emerald-400 hover:underline flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#8b6f47]/10 dark:bg-emerald-500/10 border border-[#8b6f47]/15 dark:border-emerald-500/20 cursor-pointer"
                    >
                      <Volume2 size={12} /><span>Nghe thử</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                    {[
                      { id: 'mechanical', label: 'Phím cơ Blue' },
                      { id: 'thock_deep', label: 'Phím Thocky' },
                      { id: 'typewriter', label: 'Máy đánh chữ' },
                      { id: 'soft_click', label: 'Màng phím nhẹ' },
                      { id: 'bubble_typing', label: 'Bong bóng nước' },
                      { id: 'retro_beep', label: 'Terminal cổ' },
                      { id: 'off', label: 'Tắt âm', isOff: true }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSoundThemeTyping(t.id);
                          localStorage.setItem('pos_sound_theme_typing', t.id);
                          playTypingSoundUtil(t.id);
                          broadcastSetting('pos_sound_theme_typing', t.id);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                          soundThemeTyping === t.id
                            ? t.isOff
                              ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-black shadow-xs ring-1 ring-rose-500/30"
                              : "bg-[#8b6f47]/15 dark:bg-emerald-500/20 border-[#8b6f47] dark:border-emerald-500 text-[#694e2b] dark:text-emerald-200 font-black shadow-xs ring-1 ring-[#8b6f47]/30 dark:ring-emerald-500/40"
                            : "bg-white dark:bg-[#06140e] border-[#8b6f47]/15 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-[#8b6f47]/40 dark:hover:border-emerald-500/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {t.isOff ? <VolumeX size={13} className="text-rose-500 shrink-0" /> : <Volume2 size={13} className="text-[#8b6f47] dark:text-emerald-400 shrink-0" />}
                          <span className="truncate">{t.label}</span>
                        </div>
                        {soundThemeTyping === t.id && (
                          t.isOff ? <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1" /> : <CircleCheck size={14} className="text-[#8b6f47] dark:text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Cảnh báo & Lỗi */}
                <div className="space-y-2.5 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-rose-500/20 dark:border-rose-500/25">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <TriangleAlert size={15} strokeWidth={2.5} /> 5. Âm cảnh báo & Báo lỗi
                    </label>
                    <button
                      type="button"
                      onClick={() => playErrorSound(soundThemeError)}
                      className="text-[11px] font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                    >
                      <Volume2 size={12} /><span>Nghe thử</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                    {[
                      { id: 'buzz_low', label: 'Rè trầm báo động' },
                      { id: 'glass_bonk', label: 'Gõ kính đanh' },
                      { id: 'chord_warn', label: 'Hợp âm cảnh báo' },
                      { id: 'off', label: 'Tắt âm', isOff: true }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSoundThemeError(t.id);
                          localStorage.setItem('pos_sound_theme_error', t.id);
                          playErrorSound(t.id);
                          broadcastSetting('pos_sound_theme_error', t.id);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                          soundThemeError === t.id
                            ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-black shadow-xs ring-1 ring-rose-500/30"
                            : "bg-white dark:bg-[#06140e] border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-rose-500/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {t.isOff ? <VolumeX size={13} className="text-rose-500 shrink-0" /> : <TriangleAlert size={13} className="text-rose-500 shrink-0" />}
                          <span className="truncate">{t.label}</span>
                        </div>
                        {soundThemeError === t.id && <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MẪU CÂU THÔNG BÁO */}
            {activeTab === "templates" && (
              <div className="space-y-3.5 overflow-y-auto max-h-[52vh] pr-1.5 custom-scrollbar">
                {/* Thứ tự đọc khi quét */}
                <div className="space-y-2.5 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                      <ShoppingCart size={15} strokeWidth={2.5} className="shrink-0" /> Thứ tự đọc khi quét / thêm món
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSpeechOrder("name_first");
                        localStorage.setItem("pos_tts_cart_speech_order", "name_first");
                      }}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer",
                        speechOrder === "name_first"
                          ? "bg-[#8b6f47] dark:bg-emerald-600 text-white border-[#8b6f47] dark:border-emerald-500 shadow-sm"
                          : "bg-white dark:bg-[#06140e] text-slate-700 dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/5"
                      )}
                    >
                      Tên món ➜ Số lượng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpeechOrder("qty_first");
                        localStorage.setItem("pos_tts_cart_speech_order", "qty_first");
                      }}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer",
                        speechOrder === "qty_first"
                          ? "bg-[#8b6f47] dark:bg-emerald-600 text-white border-[#8b6f47] dark:border-emerald-500 shadow-sm"
                          : "bg-white dark:bg-[#06140e] text-slate-700 dark:text-slate-300 border-[#8b6f47]/20 dark:border-white/5"
                      )}
                    >
                      Số lượng ➜ Tên món
                    </button>
                  </div>
                </div>

                {/* Đọc tổng tiền */}
                <div className="space-y-3 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                    <Banknote size={15} strokeWidth={2.5} className="shrink-0" /> Đọc tổng tiền thanh toán
                  </label>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        <span>Mẫu câu (Khách lẻ):</span>
                        <span className="text-[10px] text-[#8b6f47] dark:text-emerald-400 font-mono">Dùng: {'{amount}'}</span>
                      </div>
                      <input
                        type="text"
                        value={currencyTemplate}
                        onChange={(e) => {
                          setCurrencyTemplate(e.target.value);
                          localStorage.setItem("pos_tts_currency_template", e.target.value);
                        }}
                        placeholder="dạ {amount} đồng"
                        className="w-full p-2.5 bg-white dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#8b6f47] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#8b6f47]/40"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        <span>Mẫu câu (Có tên đối tác / khách hàng):</span>
                        <span className="text-[10px] text-[#8b6f47] dark:text-emerald-400 font-mono">Dùng: {'{partner}'}, {'{amount}'}</span>
                      </div>
                      <input
                        type="text"
                        value={currencyPartnerTemplate}
                        onChange={(e) => {
                          setCurrencyPartnerTemplate(e.target.value);
                          localStorage.setItem("pos_tts_currency_partner_template", e.target.value);
                        }}
                        placeholder="dạ {amount} đồng"
                        className="w-full p-2.5 bg-white dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#8b6f47] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#8b6f47]/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Lời cảm ơn */}
                <div className="space-y-3 p-3.5 bg-[#fbf8f2] dark:bg-[#0a1f16]/60 rounded-2xl border border-[#8b6f47]/20 dark:border-emerald-500/20">
                  <label className="text-xs font-black uppercase tracking-wider text-[#8b6f47] dark:text-emerald-400 flex items-center gap-2">
                    <Sparkles size={15} strokeWidth={2.5} className="shrink-0" /> Lời cảm ơn sau bán hàng
                  </label>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        <span>Lời cảm ơn (Khách lẻ):</span>
                      </div>
                      <input
                        type="text"
                        value={thankyouTemplate}
                        onChange={(e) => {
                          setThankyouTemplate(e.target.value);
                          localStorage.setItem("pos_tts_thankyou_template", e.target.value);
                        }}
                        placeholder="Cảm ơn quý khách"
                        className="w-full p-2.5 bg-white dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#8b6f47] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#8b6f47]/40"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        <span>Lời cảm ơn (Có tên khách):</span>
                        <span className="text-[10px] text-[#8b6f47] dark:text-emerald-400 font-mono">Dùng: {'{partner}'}</span>
                      </div>
                      <input
                        type="text"
                        value={thankyouPartnerTemplate}
                        onChange={(e) => {
                          setThankyouPartnerTemplate(e.target.value);
                          localStorage.setItem("pos_tts_thankyou_partner_template", e.target.value);
                        }}
                        placeholder="Cảm ơn quý khách"
                        className="w-full p-2.5 bg-white dark:bg-[#06140e] border border-[#8b6f47]/20 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#8b6f47] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#8b6f47]/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#8b6f47]/20 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  const sampleAmount = "năm mươi nghìn đồng";
                  const samplePartner = "anh Nam";
                  const sampleTotal = (currencyTemplate || "dạ {amount} đồng")
                    .replace("{amount}", sampleAmount)
                    .replace(/{partner}/gi, samplePartner);
                  const sampleThanks = (thankyouTemplate || "Cảm ơn quý khách").replace(/{partner}/gi, samplePartner);
                  const sampleText = activeTab === "templates" 
                    ? `${sampleTotal}. ${sampleThanks}` 
                    : "Đã thêm 2 chai nước khoáng, tổng tiền năm mươi nghìn đồng. Xin cảm ơn quý khách!";
                  speakNumber(sampleText);
                }}
                className="flex-1 py-3 px-4 bg-[#f4efe6] hover:bg-[#eae3d5] dark:bg-[#0a1f16] dark:hover:bg-[#0e291e] border border-[#8b6f47]/20 dark:border-emerald-500/20 rounded-2xl font-black text-xs uppercase tracking-wider text-[#8b6f47] dark:text-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Volume2 size={16} />
                <span>Phát thử giọng mẫu</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-8 bg-gradient-to-r from-[#8b6f47] to-[#6e5433] dark:from-emerald-600 dark:to-teal-600 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#8b6f47]/20 dark:shadow-emerald-600/25 active:scale-98 cursor-pointer"
              >
                Xong & Lưu
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default SoundVoiceSettingsModal;
