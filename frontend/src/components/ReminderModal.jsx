import React, { useState, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Plus,
  Trash2,
  Check,
  Clock,
  Calendar,
  Volume2,
  Sparkles,
  Repeat,
  AlertCircle,
  X,
  Play,
  RotateCcw,
  Tag,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { playReminderSound } from '../lib/reminderSound';
import { queryClient } from '../lib/queryClient';
import Portal from './Portal';
import CustomSelect from './CustomSelect';
import CustomDateTimePicker from './CustomDateTimePicker';

const SOUND_THEMES = [
  { id: 'tts', name: 'Đọc Giọng Nói AI (Mặc định)', desc: 'Tự động phát âm Tiếng Việt qua giọng AI' },
  { id: 'bell', name: 'Chuông Ngân', desc: 'Giai điệu 3 nốt thánh thót' },
  { id: 'chime', name: 'Chuông Tinh Thể', desc: 'Âm sắc pha lê trong trẻo' },
  { id: 'urgent', name: 'Báo Động Dồn', desc: 'Âm thanh cảnh báo khẩn cấp' },
  { id: 'gentle', name: 'Êm Ái Nhẹ Nhàng', desc: 'Giai điệu êm dịu thư thái' },
];

const QUICK_PRESETS = [
  { label: '+10 Phút', mins: 10 },
  { label: '+30 Phút', mins: 30 },
  { label: '+1 Giờ', mins: 60 },
  { label: '+2 Giờ', mins: 120 },
  { label: 'Sáng mai (08:00)', tomorrowHour: 8 },
  { label: 'Chiều mai (14:00)', tomorrowHour: 14 },
];

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export default function ReminderModal({ isOpen, onClose }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('pending'); // 'pending', 'all', 'completed'
  const [selectedMonth, setSelectedMonth] = useState(''); // 'YYYY-MM' or ''
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [repeatType, setRepeatType] = useState('once');
  const [soundTheme, setSoundTheme] = useState('tts');
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState('#10b981');
  const [ttsMessage, setTtsMessage] = useState('');

  // Set default time to current time
  const initDefaultTime = () => {
    const now = new Date();
    // Format YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reminders');
      const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setReminders(items);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReminders();
      if (!remindAt) {
        setRemindAt(initDefaultTime());
      }
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRemindAt(initDefaultTime());
    setRepeatType('once');
    setSoundTheme('tts');
    setPriority('medium');
    setColor('#10b981');
    setTtsMessage('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleApplyPreset = (preset) => {
    const now = new Date();
    if (preset.mins) {
      now.setMinutes(now.getMinutes() + preset.mins);
    } else if (preset.tomorrowHour !== undefined) {
      now.setDate(now.getDate() + 1);
      now.setHours(preset.tomorrowHour, 0, 0, 0);
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setRemindAt(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề nhắc nhở!');
      return;
    }
    if (!remindAt) {
      alert('Vui lòng chọn thời gian nhắc nhở!');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        remind_at: remindAt,
        repeat_type: repeatType,
        sound_theme: soundTheme,
        tts_message: ttsMessage.trim() || null,
        priority,
        color,
      };

      if (editingId) {
        await axios.put(`/api/reminders/${editingId}`, payload);
      } else {
        await axios.post('/api/reminders', payload);
      }

      resetForm();
      fetchReminders();
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-counts'] });
    } catch (err) {
      console.error('Failed to save reminder:', err);
      alert('Lưu nhắc nhở thất bại, vui lòng thử lại!');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setDescription(item.description || '');
    if (item.remind_at) {
      const dt = new Date(item.remind_at);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      setRemindAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
    setRepeatType(item.repeat_type || 'once');
    setSoundTheme(item.sound_theme || 'bell');
    setPriority(item.priority || 'medium');
    setColor(item.color || '#10b981');
    setTtsMessage(item.tts_message || '');
    setShowAddForm(true);
  };

  const handleToggleComplete = async (item) => {
    try {
      if (item.status === 'completed') {
        await axios.put(`/api/reminders/${item.id}`, { status: 'pending' });
      } else {
        await axios.post(`/api/reminders/${item.id}/complete`);
      }
      fetchReminders();
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-counts'] });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/reminders/${id}`);
      setConfirmDeleteId(null);
      fetchReminders();
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-counts'] });
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const handleTestSound = (themeToTest) => {
    playReminderSound(
      themeToTest || soundTheme,
      title || 'Nhắc nhở thử nghiệm',
      ttsMessage || title || 'Đây là giọng đọc thử nghiệm chuông nhắc nhở'
    );
  };

  const safeReminders = Array.isArray(reminders) ? reminders : [];

  const filteredReminders = useMemo(() => {
    let list = safeReminders;
    if (filterTab === 'pending') {
      list = list.filter((r) => r.status === 'pending');
    } else if (filterTab === 'completed') {
      list = list.filter((r) => r.status === 'completed');
    }

    if (selectedMonth) {
      list = list.filter((r) => {
        const dateStr = r.remind_at || r.created_at || '';
        return dateStr.startsWith(selectedMonth);
      });
    }

    // Sort: pending -> earliest first; completed & all -> newest first
    return [...list].sort((a, b) => {
      const timeA = new Date(a.remind_at || a.created_at || 0).getTime();
      const timeB = new Date(b.remind_at || b.created_at || 0).getTime();
      if (filterTab === 'pending') {
        return timeA - timeB;
      }
      return timeB - timeA;
    });
  }, [safeReminders, filterTab, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredReminders.length / pageSize));

  const paginatedReminders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReminders.slice(start, start + pageSize);
  }, [filteredReminders, currentPage, pageSize]);

  const pendingCount = useMemo(
    () => safeReminders.filter((r) => r.status === 'pending').length,
    [safeReminders]
  );

  const monthOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Tất cả các tháng' }];
    const now = new Date();
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      opts.push({ value: val, label });
    }
    return opts;
  }, []);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 select-none">
            {/* Backdrop with fade in/out */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Dialog with zoom & fade exit */}
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-3xl bg-[#faf8f3] dark:bg-[#121614] rounded-3xl shadow-2xl border border-[#8b6f47]/30 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Top Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2d5016]/10 via-[#2d5016]/5 to-transparent dark:from-emerald-950/40 border-b border-[#8b6f47]/15 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2d5016] dark:bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                  <span>Trung Tâm Nhắc Nhở & Chuông Báo</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300 font-mono">
                    {pendingCount} đang chờ
                  </span>
                </h3>
                <p className="text-[11px] font-bold text-[#8b6f47] dark:text-[#d4a574]/80">
                  Tạo lịch hẹn & phát âm thanh toàn hệ thống kể cả khi ở tab khác
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3.5 py-2 bg-[#2d5016] dark:bg-emerald-600 hover:bg-[#3d6b20] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  Tạo Nhắc Nhở
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
            {/* Form Create/Edit Reminder with Smooth Height Expansion */}
            <AnimatePresence initial={false}>
              {showAddForm && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <m.form
                    key={editingId ? `edit-${editingId}` : 'new-reminder-form'}
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    onSubmit={handleSave}
                    className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-lg space-y-4 mb-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 flex items-center gap-2">
                      <Sparkles size={14} />
                      {editingId ? 'Chỉnh Sửa Nhắc Nhở' : 'Thêm Mới Nhắc Nhở'}
                    </h4>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-wider"
                    >
                      Hủy Bỏ
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Nội dung nhắc nhở *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Gọi điện cho khách anh Ba chốt đơn phân bón..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Ghi chú chi tiết (Tùy chọn)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Số điện thoại, địa chỉ hoặc lưu ý thêm..."
                        rows={2}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Datetime & Quick Presets */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Thời gian hẹn giờ *
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {QUICK_PRESETS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => handleApplyPreset(p)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[9.5px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <CustomDateTimePicker
                      value={remindAt}
                      onChange={(val) => setRemindAt(val)}
                    />
                  </div>

                  {/* Sound Theme & Repeat & Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Sound Selection with Test Button */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Âm thanh chuông
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTestSound(soundTheme)}
                          className="text-[9px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                        >
                          <Play size={10} /> Nghe thử
                        </button>
                      </div>
                      <CustomSelect
                        value={soundTheme}
                        onChange={(e) => setSoundTheme(e?.target ? e.target.value : e)}
                        options={SOUND_THEMES.map((s) => ({
                          value: s.id,
                          label: s.name,
                        }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                      />
                    </div>

                    {/* Repeat Type */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Lặp lại chu kỳ
                      </label>
                      <CustomSelect
                        value={repeatType}
                        onChange={(e) => setRepeatType(e?.target ? e.target.value : e)}
                        options={[
                          { value: 'once', label: 'Một lần duy nhất' },
                          { value: 'daily', label: 'Hàng ngày (Daily)' },
                          { value: 'weekly', label: 'Hàng tuần (Weekly)' },
                          { value: 'monthly', label: 'Hàng tháng (Monthly)' },
                        ]}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                      />
                    </div>

                    {/* Priority Level */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Mức độ ưu tiên
                      </label>
                      <CustomSelect
                        value={priority}
                        onChange={(e) => setPriority(e?.target ? e.target.value : e)}
                        options={[
                          { value: 'low', label: 'Thấp (Bình thường)' },
                          { value: 'medium', label: 'Trung bình' },
                          { value: 'high', label: 'Rất quan trọng (Gấp)' },
                        ]}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Optional Voice TTS Custom Sentence */}
                  {soundTheme === 'tts' && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Câu giọng đọc tùy chỉnh (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={ttsMessage}
                        onChange={(e) => setTtsMessage(e.target.value)}
                        placeholder="Mặc định: 'Có nhắc nhở: [Tiêu đề nhắc nhở]'"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* Color Tag Selection */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Thẻ màu:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={cn(
                              'w-6 h-6 rounded-full transition-transform active:scale-95 border-2',
                              color === c ? 'scale-110 border-slate-900 dark:border-white shadow-sm' : 'border-transparent'
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#2d5016] dark:bg-emerald-600 hover:bg-[#3d6b20] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all"
                      >
                        {editingId ? 'Cập Nhật' : 'Lưu Nhắc Nhở'}
                      </button>
                    </div>
                  </div>
                </m.form>
              </m.div>
            )}
          </AnimatePresence>

            {/* Filter Tabs & Month Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-[#8b6f47]/15 dark:border-white/10 pb-3">
              {/* Tab Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'pending', label: 'Chưa Xử Lý', count: safeReminders.filter((r) => r.status === 'pending').length },
                  { id: 'all', label: 'Tất Cả', count: safeReminders.length },
                  { id: 'completed', label: 'Đã Xong', count: safeReminders.filter((r) => r.status === 'completed').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFilterTab(tab.id);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0',
                      filterTab === tab.id
                        ? 'bg-[#2d5016] dark:bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                        filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Month Picker & Refresh Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <CustomSelect
                    value={selectedMonth}
                    onChange={(e) => {
                      const val = e?.target ? e.target.value : e;
                      setSelectedMonth(val);
                      setCurrentPage(1);
                    }}
                    options={monthOptions}
                    placeholder="Lọc theo tháng..."
                    className="bg-white dark:bg-slate-800 border border-[#8b6f47]/20 dark:border-slate-700 rounded-xl min-w-[150px] shadow-xs text-xs"
                  />
                </div>

                <button
                  onClick={fetchReminders}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                  title="Tải lại danh sách"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Reminders List */}
            <div className="space-y-2.5">
              {filteredReminders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Bell size={36} className="mx-auto opacity-30 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {filterTab === 'pending'
                      ? 'Không có nhắc nhở nào đang chờ!'
                      : selectedMonth
                      ? `Không có nhắc nhở nào trong tháng ${selectedMonth}.`
                      : 'Chưa có nhắc nhở nào trong danh sách.'}
                  </p>
                  {!showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-1.5 bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2d5016]/20 transition-all"
                    >
                      + Tạo Nhắc Nhở Đầu Tiên
                    </button>
                  )}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {paginatedReminders.map((reminder) => {
                    const isCompleted = reminder.status === 'completed';
                    const dt = reminder.remind_at ? new Date(reminder.remind_at) : null;
                    const isOverdue = dt && dt < new Date() && !isCompleted;

                    return (
                      <m.div
                        key={reminder.id}
                        layout
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92, y: -8 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                        'group p-3.5 rounded-2xl border transition-all flex items-start gap-3 relative overflow-hidden',
                        isCompleted
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                          : isOverdue
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/30 shadow-xs'
                          : 'bg-white/90 dark:bg-slate-900/80 border-[#8b6f47]/20 dark:border-slate-800 shadow-xs hover:border-[#2d5016]/40 dark:hover:border-emerald-500/40'
                      )}
                    >
                      {/* Left Status Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(reminder)}
                        className={cn(
                          'w-6 h-6 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5 border',
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-transparent border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                        )}
                        title={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>

                      {/* Reminder Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'text-sm font-black tracking-tight leading-snug',
                              isCompleted
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            )}
                          >
                            {reminder.title}
                          </span>

                          {/* Tag Color Indicator */}
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: reminder.color || '#10b981' }}
                            title="Thẻ phân loại"
                          />

                          {/* Overdue Badge */}
                          {isOverdue && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-500 text-white animate-pulse">
                              Quá Hạn
                            </span>
                          )}

                          {/* Repeat badge */}
                          {reminder.repeat_type && reminder.repeat_type !== 'once' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                              {reminder.repeat_type === 'daily'
                                ? 'Hàng ngày'
                                : reminder.repeat_type === 'weekly'
                                ? 'Hàng tuần'
                                : 'Hàng tháng'}
                            </span>
                          )}
                        </div>

                        {reminder.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {reminder.description}
                          </p>
                        )}

                        {/* Timing and sound footer */}
                        <div className="flex items-center gap-3 mt-2 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                            <Clock size={12} className="text-[#2d5016] dark:text-emerald-400" />
                            {dt
                              ? dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
                                ' ' +
                                dt.toLocaleDateString('vi-VN', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : '-'}
                          </span>

                          <span className="flex items-center gap-1">
                            <Volume2 size={12} />
                            {SOUND_THEMES.find((s) => s.id === reminder.sound_theme)?.name || 'Chuông'}
                          </span>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                        {confirmDeleteId === reminder.id ? (
                          <m.div
                            initial={{ opacity: 0, scale: 0.9, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 p-1 rounded-xl shadow-xs"
                          >
                            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1.5 whitespace-nowrap">
                              Xóa?
                            </span>
                            <button
                              onClick={() => handleDelete(reminder.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-xs"
                            >
                              Xóa
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Hủy
                            </button>
                          </m.div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleTestSound(reminder.sound_theme)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-amber-500 transition-colors"
                              title="Thử chuông"
                            >
                              <Play size={14} />
                            </button>
                            <button
                              onClick={() => handleEdit(reminder)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-blue-500 transition-colors"
                              title="Sửa"
                            >
                              <Clock size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(reminder.id)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </m.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

            {/* Pagination Controls */}
            {filteredReminders.length > 0 && (
              <div className="pt-3 border-t border-[#8b6f47]/15 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>
                  Hiển thị <span className="text-slate-800 dark:text-slate-200 font-mono">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredReminders.length)}</span> trên tổng số <span className="text-[#2d5016] dark:text-emerald-400 font-mono">{filteredReminders.length}</span> nhắc nhở
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Trang trước"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={cn(
                                'w-7 h-7 rounded-lg text-xs font-mono font-black transition-all',
                                currentPage === p
                                  ? 'bg-[#2d5016] dark:bg-emerald-600 text-white shadow-xs'
                                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                              )}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Trang sau"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </m.div>
      </div>
    )}
  </AnimatePresence>
</Portal>
);
}
