import React, { useState, useEffect, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, X, Volume2, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { playReminderSound } from '../lib/reminderSound';
import { queryClient } from '../lib/queryClient';
import Portal from './Portal';

export default function GlobalReminderAlert({ onOpenManager }) {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const alertedIdsRef = useRef(new Set());
  const soundIntervalRef = useRef(null);

  const fetchDueReminders = useCallback(async () => {
    try {
      const res = await axios.get('/api/reminders?status=pending');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      const now = new Date();

      const dues = list.filter((item) => {
        if (!item.remind_at) return false;
        const dt = new Date(item.remind_at);
        return dt <= now;
      });

      if (dues.length > 0) {
        // Find new ones that haven't been alerted in this session
        const newDues = dues.filter((item) => !alertedIdsRef.current.has(item.id));
        if (newDues.length > 0) {
          newDues.forEach((item) => {
            alertedIdsRef.current.add(item.id);
            // Trigger sound & TTS for the newest reminder
            playReminderSound(
              item.sound_theme || 'tts',
              item.title,
              item.tts_message
            );
          });

          setActiveAlerts((prev) => {
            const map = new Map();
            [...prev, ...newDues].forEach((r) => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {
      // Backend may be starting up
    }
  }, []);

  // 1. Initial check & interval polling every 5s (as fallback if WS reconnects)
  useEffect(() => {
    fetchDueReminders();
    const timer = setInterval(fetchDueReminders, 6000);
    return () => clearInterval(timer);
  }, [fetchDueReminders]);

  // 2. Real-time WebSocket Event Listener for immediate alert
  useEffect(() => {
    const handleReminderEvent = (e) => {
      const event = e.detail;
      if (event && event.type === 'REMINDER_DUE') {
        const item = event.payload;
        if (item && item.id) {
          if (!alertedIdsRef.current.has(item.id)) {
            alertedIdsRef.current.add(item.id);
            playReminderSound(
              item.sound_theme || 'tts',
              item.title,
              item.tts_message
            );
          }
          setActiveAlerts((prev) => {
            const exists = prev.some((p) => p.id === item.id);
            if (exists) return prev;
            return [item, ...prev];
          });
        }
      } else if (event && (event.type === 'REMINDER_UPDATED' || event.type === 'REMINDER_DELETED')) {
        const item = event.payload;
        if (item && item.id) {
          if (item.status === 'completed' || item.status === 'dismissed' || event.type === 'REMINDER_DELETED') {
            setActiveAlerts((prev) => prev.filter((r) => r.id !== item.id));
          }
        }
      }
    };

    window.addEventListener('pos_reminder_event', handleReminderEvent);
    return () => {
      window.removeEventListener('pos_reminder_event', handleReminderEvent);
    };
  }, []);

  // 3. Repeat sound every 25s if active alerts are unacknowledged
  useEffect(() => {
    if (activeAlerts.length > 0) {
      if (!soundIntervalRef.current) {
        soundIntervalRef.current = setInterval(() => {
          if (activeAlerts.length > 0) {
            const topItem = activeAlerts[0];
            playReminderSound(topItem?.sound_theme || 'tts', topItem?.title, topItem?.tts_message);
          }
        }, 25000);
      }
    } else {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    }
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
    };
  }, [activeAlerts]);

  // Actions
  const handleComplete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.post(`/api/reminders/${id}/complete`);
      setActiveAlerts((prev) => prev.filter((r) => r.id !== id));
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-counts'] });
    } catch (err) {
      console.error('Failed to complete reminder:', err);
    }
  };

  const handleSnooze = async (id, minutes, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.post(`/api/reminders/${id}/snooze`, { minutes });
      alertedIdsRef.current.delete(id); // Allow re-alerting when snooze expires
      setActiveAlerts((prev) => prev.filter((r) => r.id !== id));
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-counts'] });
    } catch (err) {
      console.error('Failed to snooze reminder:', err);
    }
  };

  const handleDismiss = (id, e) => {
    if (e) e.stopPropagation();
    setActiveAlerts((prev) => prev.filter((r) => r.id !== id));
  };

  if (activeAlerts.length === 0) return null;

  return (
    <Portal>
      <div className="fixed top-5 right-5 z-[9999999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-3 select-none">
        <AnimatePresence mode="popLayout">
          {activeAlerts.map((reminder, idx) => {
            const priorityColor =
              reminder.priority === 'high'
                ? 'from-rose-500/20 via-rose-600/10 to-amber-500/10 border-rose-500/40 text-rose-500'
                : reminder.priority === 'low'
                ? 'from-sky-500/20 via-sky-600/10 to-emerald-500/10 border-sky-500/40 text-sky-500'
                : 'from-amber-500/25 via-emerald-600/10 to-emerald-500/10 border-amber-500/40 text-amber-500';

            return (
              <m.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 80, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={cn(
                  'pointer-events-auto relative overflow-hidden rounded-3xl p-4 shadow-2xl backdrop-blur-2xl border',
                  'bg-[#fcfbf9]/95 dark:bg-[#121614]/95 text-slate-800 dark:text-slate-100',
                  'border-amber-500/30 dark:border-emerald-500/30 shadow-amber-500/10'
                )}
                style={{
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 25px rgba(245, 158, 11, 0.15)',
                }}
              >
                {/* Glowing Aura Accent */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 animate-pulse"
                  style={{ backgroundColor: reminder.color || '#f59e0b' }}
                />

                {/* Header Info */}
                <div className="flex items-start justify-between gap-2.5 relative z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md animate-bounce"
                      style={{ backgroundColor: reminder.color || '#f59e0b' }}
                    >
                      <Bell size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Nhắc Nhở Đến Hạn 🔔
                        </span>
                        {reminder.repeat_type && reminder.repeat_type !== 'once' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase">
                            {reminder.repeat_type === 'daily'
                              ? 'Hàng ngày'
                              : reminder.repeat_type === 'weekly'
                              ? 'Hàng tuần'
                              : 'Hàng tháng'}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mt-1 truncate">
                        {reminder.title}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDismiss(reminder.id, e)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                    title="Đóng cảnh báo"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Description Body if any */}
                {reminder.description && (
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 pl-1 relative z-10 line-clamp-2">
                    {reminder.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 relative z-10 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleSnooze(reminder.id, 5, e)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border border-slate-300/40 dark:border-slate-700 flex items-center gap-1"
                    >
                      <Clock size={12} />
                      +5p
                    </button>
                    <button
                      onClick={(e) => handleSnooze(reminder.id, 15, e)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border border-slate-300/40 dark:border-slate-700 flex items-center gap-1"
                    >
                      <Clock size={12} />
                      +15p
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {onOpenManager && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenManager();
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Chi tiết
                      </button>
                    )}
                    <button
                      onClick={(e) => handleComplete(reminder.id, e)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider shadow-md hover:shadow-emerald-500/25 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Check size={13} strokeWidth={3} />
                      Xong
                    </button>
                  </div>
                </div>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Portal>
  );
}
