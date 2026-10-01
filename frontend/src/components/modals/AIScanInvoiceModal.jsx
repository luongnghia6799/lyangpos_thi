import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  TriangleAlert, 
  Camera, 
  Plus, 
  Sparkles, 
  LoaderCircle 
} from 'lucide-react';
import Portal from '@/components/widgets/Portal';

/**
 * High-performance AIScanInvoiceModal using Gemini AI OCR
 */
const AIScanInvoiceModal = React.memo(function AIScanInvoiceModal({
  isOpen = false,
  onClose,
  settings,
  apiKeyInput = '',
  onApiKeyChange,
  previewImages = [],
  onSetPreviewImages,
  onFileChange,
  onStartScan,
  isScanning = false,
  notify
}) {
  if (!isOpen) return null;

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      const imgFiles = Array.from(e.dataTransfer.files).filter(s => s.type.startsWith('image/'));
      if (imgFiles.length > 0) {
        const promises = imgFiles.map(s => new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(s);
        }));
        Promise.all(promises).then(results => {
          onSetPreviewImages(prev => [...prev, ...results]);
          if (notify) notify({ message: `Đã thêm ${imgFiles.length} ảnh thả vào!`, type: 'success' });
        });
      }
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[500000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <m.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0" 
          onClick={onClose} 
        />
        <m.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }} 
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} 
          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col relative z-10 overflow-hidden max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <Bot size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-black text-foreground uppercase tracking-tight leading-relaxed py-0.5 truncate">
                  Quét Đơn Hàng / Hóa Đơn AI
                </h3>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Tự động nhận dạng toa hàng & thêm vào giỏ bán bằng Gemini
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-rose-500 hover:text-white text-muted-foreground transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
            {!settings?.gemini_api_key && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase">
                  <TriangleAlert size={16} /> Cần cấu hình API Key
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Vui lòng nhập <strong>Gemini API Key</strong> của bạn để tiếp tục.
                </p>
                <input 
                  type="password" 
                  value={apiKeyInput} 
                  onChange={e => onApiKeyChange(e.target.value)} 
                  placeholder="Nhập Gemini API Key..." 
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-emerald-500 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500/35 transition-all" 
                />
              </div>
            )}

            <div className="space-y-4 flex flex-col">
              <div 
                onDragOver={e => e.preventDefault()} 
                onDrop={handleDrop} 
                className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 rounded-[2rem] p-6 bg-slate-50/50 dark:bg-slate-800/20 min-h-[260px] relative overflow-hidden group transition-all duration-300"
              >
                {previewImages.length > 0 ? (
                  <div className="w-full h-full flex flex-col space-y-4">
                    <div className="grid grid-cols-3 gap-3 max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
                      {previewImages.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 group/thumb shadow-sm">
                          <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => onSetPreviewImages(prev => prev.filter((_, n) => n !== idx))} 
                            className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all shadow opacity-0 group-hover/thumb:opacity-100 duration-200"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-3">
                      <label htmlFor="pos-scan-image-upload" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95">
                        <Plus size={14} strokeWidth={3} /> Thêm ảnh
                      </label>
                      <button 
                        type="button" 
                        onClick={() => onSetPreviewImages([])} 
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all uppercase tracking-wider shadow-sm active:scale-95"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="pos-scan-image-upload" className="flex flex-col items-center justify-center cursor-pointer space-y-4 w-full h-full py-8">
                    <div className="p-5 bg-emerald-500/10 text-emerald-600 rounded-full group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                      <Camera size={36} />
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">Chụp, tải hoặc dán ảnh (Ctrl + V)</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hỗ trợ Paste Clipboard, Kéo thả & Chọn tệp ảnh</p>
                    </div>
                  </label>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple={true} 
                  capture="environment" 
                  onChange={onFileChange} 
                  className="hidden" 
                  id="pos-scan-image-upload" 
                />
              </div>

              {previewImages.length > 0 && (
                <m.button 
                  whileTap={{ scale: 0.98 }} 
                  onClick={onStartScan} 
                  disabled={isScanning || (!settings?.gemini_api_key && !apiKeyInput)} 
                  className="w-full p-4 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:brightness-110 disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all"
                >
                  {isScanning ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin text-white" />
                      Đang nhận dạng toa hàng bằng AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-white" />
                      Bắt đầu quét và thêm vào giỏ hàng (AI)
                    </>
                  )}
                </m.button>
              )}
            </div>
          </div>
        </m.div>
      </div>
    </Portal>
  );
});

export default AIScanInvoiceModal;
