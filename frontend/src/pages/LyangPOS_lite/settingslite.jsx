import React, { useState, useMemo } from 'react';
import { Settings, Save, Palette, CheckCircle, ChevronLeft, Volume2, VolumeX, Type, Monitor } from 'lucide-react';
import { getLiteTheme } from '../../lib/liteTheme';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { useLiteThemeSync } from '../../hooks/useLiteThemeSync';

export default function SettingsLite() {
  const navigate = useNavigate();
  const { bgColor, fontSize, soundMuted, graphicsMode, changeTheme, changeFontSize, toggleSound, setGraphicsMode } = useLiteThemeSync();

  const theme = useMemo(() => getLiteTheme(bgColor), [bgColor]);

  const themes = [
    { id: "#050505", name: "Dark Night", icon: "🌙" },
    { id: "#f4ecd8", name: "Paper Creamy", icon: "📜" },
    { id: "#e8f5e9", name: "Tea Sage", icon: "🌿" }
  ];

  const handleSaveTheme = (color) => {
    changeTheme(color);
  };

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <style>{`
        .settings-card {
          background-color: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 24px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }
        .theme-btn {
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .theme-btn.active {
          border-color: ${theme.accent};
          transform: scale(1.02);
          box-shadow: 0 10px 20px ${theme.accent}30;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: theme.text }}>
              Cài Đặt Lite
            </h1>
            <p className="text-sm font-bold opacity-60 uppercase tracking-widest mt-1">
              Tùy chỉnh giao diện và hệ thống
            </p>
          </div>
        </div>

        <div className="settings-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
              <Palette size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Màu Sắc Giao Diện</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themes.map(t => (
              <m.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                key={t.id}
                onClick={() => handleSaveTheme(t.id)}
                className={`theme-btn w-full p-6 rounded-2xl flex flex-col items-center justify-center gap-4 ${bgColor === t.id ? 'active' : ''}`}
                style={{ backgroundColor: t.id === '#050505' ? '#12151c' : t.id === '#e8f5e9' ? '#e2eed5' : '#faf8f3', color: t.id === '#050505' ? '#e2e8f0' : '#2c2e3b' }}
              >
                <span className="text-4xl">{t.icon}</span>
                <span className="font-black text-lg uppercase tracking-widest">{t.name}</span>
                {bgColor === t.id && (
                  <div className="absolute top-4 right-4 text-emerald-500">
                    <CheckCircle size={24} />
                  </div>
                )}
              </m.button>
            ))}
          </div>
        </div>

        <div className="settings-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
              <Settings size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Hệ Thống</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.subSurface }}>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
                  {soundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </div>
                <div>
                  <h3 className="font-bold">Âm thanh hệ thống</h3>
                  <p className="text-xs opacity-60">Bật/tắt các tiếng "tít tít" khi thao tác</p>
                </div>
              </div>
              <button
                onClick={() => toggleSound(!soundMuted)}
                className="w-12 h-6 rounded-full transition-colors relative"
                style={{ backgroundColor: soundMuted ? theme.muted + '40' : theme.accent }}
              >
                <div 
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ left: soundMuted ? '4px' : '28px' }}
                />
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border gap-4" style={{ borderColor: theme.border, backgroundColor: theme.subSurface }}>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
                  <Type size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Cỡ chữ hiển thị</h3>
                  <p className="text-xs opacity-60">Điều chỉnh độ lớn chữ toàn màn hình Lite</p>
                </div>
              </div>
              <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
                {["14px", "16px", "18px", "20px"].map(sz => (
                  <button
                    key={sz}
                    onClick={() => changeFontSize(sz)}
                    className="px-4 py-1.5 rounded-md text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: fontSize === sz ? theme.accent : 'transparent',
                      color: fontSize === sz ? '#fff' : theme.text
                    }}
                  >
                    {sz === "14px" ? "Nhỏ" : sz === "16px" ? "Vừa" : sz === "18px" ? "Lớn" : "Rất lớn"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border gap-4" style={{ borderColor: theme.border, backgroundColor: theme.subSurface }}>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>
                  <Monitor size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Hiệu ứng đồ họa</h3>
                  <p className="text-xs opacity-60">Chế độ siêu nhẹ tắt kính mờ giúp CPU/GPU nghỉ ngơi 99%</p>
                </div>
              </div>
              <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
                {[{ id: 'high', label: 'Đẹp (Tốn GPU)' }, { id: 'eco', label: 'Siêu Nhẹ (1% GPU)' }].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setGraphicsMode(m.id)}
                    className="px-4 py-1.5 rounded-md text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: graphicsMode === m.id ? theme.accent : 'transparent',
                      color: graphicsMode === m.id ? '#fff' : theme.text
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm font-bold opacity-60 mt-8">Các cài đặt khác như Máy in, Mạng, được dùng chung từ hệ thống gốc. Xin vui lòng truy cập giao diện Quản Trị để cấu hình chuyên sâu.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
