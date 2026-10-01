import React from 'react';
import { motion as m } from 'framer-motion';
import { Tv, ExternalLink, X } from 'lucide-react';
import axios from 'axios';
import Portal from '@/components/widgets/Portal';

/**
 * PackingDisplayModeModal - Select App Window vs Browser Cast TV mode
 */
const PackingDisplayModeModal = React.memo(function PackingDisplayModeModal({
  isOpen = false,
  onClose
}) {
  if (!isOpen) return null;

  const handleOpenTauriWindow = async () => {
    onClose();
    const winLabel = "packing-display-" + Date.now();
    const url = "/#/packing-display";
    const WebviewWindowClass = window.__TAURI__?.webviewWindow?.WebviewWindow || window.__TAURI__?.window?.WebviewWindow;
    if (WebviewWindowClass) {
      try {
        new WebviewWindowClass(winLabel, {
          url,
          title: "Màn hình soạn hàng",
          width: 1000,
          height: 800,
          center: true
        });
        return;
      } catch (err) {
        console.error("Failed to create WebviewWindow from global namespace", err);
      }
    }
    window.open(window.location.origin + "/#/packing-display", "_blank", "width=1200,height=800,menubar=no,status=no,toolbar=no,location=no");
  };

  const handleOpenBrowserForCast = async () => {
    onClose();
    const serverIp = localStorage.getItem("server_ip");
    const url = (serverIp ? `http://${serverIp}:3579` : "http://localhost:3579") + "/#/packing-display";
    try {
      await axios.post("/api/open-external-chrome", { url });
      return;
    } catch (err) {
      console.error("Failed to open Chrome via backend API, falling back", err);
    }
    window.open(url, "_blank", "width=1200,height=800,menubar=no,status=no,toolbar=no,location=no");
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[300000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <m.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 backdrop-blur-2xl w-full max-w-sm rounded-[2rem] border border-white dark:border-white/10 overflow-hidden relative p-6 space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-primary dark:text-[#d4a574]">
              <Tv size={20} className="shrink-0" />
              <h3 className="font-black text-lg uppercase tracking-tight">Màn hình soạn hàng</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-normal">
            Chọn phương thức hiển thị màn hình soạn hàng. Sử dụng trình duyệt Chrome/Edge nếu bạn muốn <span className="text-[#059669] dark:text-[#34d399] font-black">truyền màn hình (Cast) lên TV</span>.
          </p>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleOpenTauriWindow}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Tv size={16} strokeWidth={2.5} />
              <span>Mở trong cửa sổ App (Tauri)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenBrowserForCast}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} strokeWidth={2.5} />
              <span>Mở trong Trình duyệt (Để Cast TV)</span>
            </button>
          </div>
        </m.div>
      </div>
    </Portal>
  );
});

export default PackingDisplayModeModal;
