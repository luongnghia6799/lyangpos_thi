import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Clock, 
  X, 
  Check, 
  Calendar, 
  User, 
  Package, 
  Volume2, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import Portal from '../widgets/Portal';
import CustomDateTimePicker from '../forms/CustomDateTimePicker';
import { cn, playSuccessSound, normalizeUOM } from '../../lib/utils';
import { queryClient } from '../../lib/queryClient';

const QUICK_PRESETS = [
  { label: '+30 Phút', mins: 30 },
  { label: '+1 Giờ', mins: 60 },
  { label: '+2 Giờ', mins: 120 },
  { label: 'Chiều nay (14:00)', todayHour: 14 },
  { label: 'Chiều tối (16:30)', todayHour: 16, todayMin: 30 },
  { label: 'Sáng mai (08:00)', tomorrowHour: 8 },
  { label: 'Chiều mai (14:00)', tomorrowHour: 14 },
];

export default function QuickDeliveryReminderModal({
  isOpen,
  onClose,
  partner = null,
  fertilizerItems = [],
  onSuccess = null,
  onOpenFullReminder = null
}) {
  const partnerName = partner?.name || 'Khách lẻ';
  const partnerPhone = partner?.phone || '';
  const partnerAddress = partner?.address || '';

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [ttsMessage, setTtsMessage] = useState('');
  const [priority, setPriority] = useState('high');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to format Date into YYYY-MM-DDTHH:mm
  const formatDateTime = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  // Generate default values when opening
  useEffect(() => {
    if (isOpen) {
      const defaultTitle = `Chở phân cho ${partnerName}`;
      setTitle(defaultTitle);

      // Default time: 1 hour from now
      const defaultDate = new Date();
      defaultDate.setMinutes(defaultDate.getMinutes() + 60);
      setRemindAt(formatDateTime(defaultDate));

      // Build fertilizer item list description
      const lines = [];
      if (fertilizerItems && fertilizerItems.length > 0) {
        lines.push('📦 DANH SÁCH PHÂN CẦN GIAO:');
        fertilizerItems.forEach(item => {
          const qty = item.quantity !== undefined ? item.quantity : 1;
          const unit = item.unit ? ` ${normalizeUOM(item.unit)}` : '';
          const name = item.product_name || item.name || 'Phân bón';
          lines.push(`• ${qty}${unit} - ${name}`);
        });
      }

      const contactInfo = [];
      if (partnerName && partnerName !== 'Khách lẻ') {
        contactInfo.push(`Khách hàng: ${partnerName}`);
      }
      if (partnerPhone) {
        contactInfo.push(`SĐT: ${partnerPhone}`);
      }
      if (partnerAddress) {
        contactInfo.push(`Địa chỉ: ${partnerAddress}`);
      }

      if (contactInfo.length > 0) {
        lines.push('');
        lines.push('📍 THÔNG TIN GIAO HÀNG:');
        lines.push(contactInfo.join(' | '));
      }

      setDescription(lines.join('\n'));
      setTtsMessage(`Có nhắc nhở chở phân cho ${partnerName}`);
      setPriority('high');
      setError(null);
    }
  }, [isOpen, partnerName, partnerPhone, partnerAddress, fertilizerItems]);

  // Apply preset button
  const handleApplyPreset = (preset) => {
    const now = new Date();
    if (preset.mins) {
      now.setMinutes(now.getMinutes() + preset.mins);
    } else if (preset.todayHour !== undefined) {
      now.setHours(preset.todayHour, preset.todayMin || 0, 0, 0);
      if (now <= new Date()) {
        now.setDate(now.getDate() + 1);
      }
    } else if (preset.tomorrowHour !== undefined) {
      now.setDate(now.getDate() + 1);
      now.setHours(preset.tomorrowHour, preset.tomorrowMin || 0, 0, 0);
    }
    setRemindAt(formatDateTime(now));
  };

  // Submit Reminder
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề nhắc nhở');
      return;
    }
    if (!remindAt) {
      setError('Vui lòng chọn thời gian nhắc nhở');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        remind_at: remindAt,
        repeat_type: 'once',
        sound_theme: 'tts',
        tts_message: ttsMessage.trim() || title.trim(),
        priority,
        color: '#2d5016',
      };

      await axios.post('/api/reminders', payload);

      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      try {
        const syncChan = new BroadcastChannel('pos_data_sync');
        syncChan.postMessage({ type: 'REMINDER_UPDATED' });
        syncChan.close();
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('pos_reminders_updated'));

      playSuccessSound();
      if (onSuccess) {
        onSuccess(`Đã tạo nhắc nhở: ${title.trim()}!`);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create delivery reminder:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu nhắc nhở, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Open Full Reminder Modal with prefill
  const handleOpenAdvanced = () => {
    if (onOpenFullReminder) {
      onOpenFullReminder({
        title,
        description,
        remindAt,
        ttsMessage,
        priority,
        color: '#2d5016'
      });
    } else {
      window.dispatchEvent(new CustomEvent('pos_open_reminders', {
        detail: {
          title,
          description,
          remindAt,
          ttsMessage,
          priority,
          color: '#2d5016'
        }
      }));
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 select-none">
            {/* Backdrop with smooth fade in/out */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transform-gpu will-change-transform"
            />

            {/* Modal Dialog with smooth spring / cubic bezier zoom & fade */}
            <m.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg bg-[#faf8f3] dark:bg-[#121614] rounded-3xl shadow-2xl border border-[#8b6f47]/30 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] transform-gpu will-change-transform"
            >
          {/* Header - LyangPOS Signature Zen Botanical Theme */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2d5016]/10 via-[#2d5016]/5 to-transparent dark:from-emerald-950/40 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#8b6f47]/15 dark:bg-emerald-500/15 border border-[#8b6f47]/25 dark:border-emerald-500/30 flex items-center justify-center text-[#2d5016] dark:text-emerald-400 shadow-xs shrink-0">
                <Truck size={20} strokeWidth={2.5} className="text-[#2d5016] dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-wide truncate">
                    Nhắc Nhở Chở Phân
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-black uppercase font-mono shrink-0">
                    Giao hàng
                  </span>
                </div>
                <p className="text-[11px] font-bold text-[#8b6f47] dark:text-[#d4a574]/80 flex items-center gap-1.5 mt-0.5 truncate">
                  <User size={12} strokeWidth={2.5} className="text-[#2d5016] dark:text-emerald-400 shrink-0" />
                  <span>Đối tác: <span className="text-[#2d5016] dark:text-emerald-300 font-black underline">{partnerName}</span></span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Đóng (ESC)"
            >
              <X size={16} strokeWidth={2.8} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-black">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 mb-1.5">
                Tiêu đề nhắc nhở <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Chở phân cho Chú Ba..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#8b6f47]/25 dark:border-white/15 bg-white dark:bg-[#08150f] text-slate-900 dark:text-white text-sm font-black focus:outline-none focus:border-[#2d5016] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#2d5016]/20 transition-all shadow-xs"
              />
            </div>

            {/* Quick Presets for Delivery Time & Custom DateTime Picker */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-[#2d5016] dark:text-emerald-400" />
                  <span>Thời gian nhắc nhở <span className="text-rose-500">*</span></span>
                </span>
                <span className="text-[10px] text-[#8b6f47] dark:text-[#d4a574] font-bold lowercase">
                  Bấm chọn giờ nhanh
                </span>
              </label>

              {/* Preset buttons matching theme */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {QUICK_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-[#8b6f47]/10 dark:bg-emerald-500/15 text-[#2d5016] dark:text-emerald-300 border border-[#8b6f47]/25 dark:border-emerald-500/30 hover:bg-[#2d5016] hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date & Hour Picker matching LyangPOS theme */}
              <CustomDateTimePicker
                value={remindAt}
                onChange={(val) => setRemindAt(val)}
                triggerClassName="bg-white dark:bg-[#08150f] border-[#8b6f47]/25 dark:border-white/15 rounded-xl py-2.5 px-3.5 shadow-xs hover:border-[#2d5016] dark:hover:border-emerald-500"
                placeholder="Chọn ngày và giờ hẹn giao phân..."
              />
            </div>

            {/* Delivery Details & Items */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Package size={13} className="text-[#2d5016] dark:text-emerald-400" />
                  <span>Chi tiết hàng hóa & thông tin giao</span>
                </span>
                {fertilizerItems && fertilizerItems.length > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300 border border-[#2d5016]/20">
                    {fertilizerItems.length} loại phân
                  </span>
                )}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nội dung hàng hóa, ghi chú địa điểm giao, dặn dò..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#8b6f47]/25 dark:border-white/15 bg-white dark:bg-[#08150f] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#2d5016] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#2d5016]/20 transition-all font-sans leading-relaxed shadow-xs"
              />
            </div>

            {/* TTS Voice Announcement Preview */}
            <div className="p-3.5 rounded-2xl bg-[#2d5016]/[0.05] dark:bg-emerald-950/20 border border-[#2d5016]/15 dark:border-emerald-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 flex items-center gap-1.5">
                  <Volume2 size={13} strokeWidth={2.5} className="text-[#2d5016] dark:text-emerald-400" />
                  <span>Giọng đọc AI nhắc nhở qua loa</span>
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300">
                  Tự động phát khi đến giờ
                </span>
              </div>
              <input
                type="text"
                value={ttsMessage}
                onChange={(e) => setTtsMessage(e.target.value)}
                placeholder="Câu nói AI sẽ đọc qua loa..."
                className="w-full px-3 py-1.5 rounded-xl border border-[#8b6f47]/20 dark:border-white/10 bg-white dark:bg-[#08150f] text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-[#2d5016] dark:focus:border-emerald-500"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-white/50 dark:bg-white/[0.02] border-t border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleOpenAdvanced}
              className="text-xs font-black text-[#8b6f47] dark:text-[#d4a574] hover:text-[#2d5016] dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Mở toàn bộ giao diện quản lý nhắc nhở để đặt lặp lại, chọn chuông..."
            >
              <span>Nâng cao</span>
              <ExternalLink size={12} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#2d5016] to-[#3d6820] hover:from-[#355f1a] hover:to-[#467825] dark:from-emerald-600 dark:to-teal-600 active:scale-95 text-white shadow-lg shadow-[#2d5016]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} />
                    <span>LƯU NHẮC NHỞ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </m.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
