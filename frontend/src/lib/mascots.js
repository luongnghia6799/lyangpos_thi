import mascotsData from './mascots_list.json';

// Danh sach Mascot duoc chon cho LyangPOS
export const MASCOT_LIST = mascotsData.map((m) => ({
  ...m,
  avatar: m.avatar || `/mascots/avatar-${m.id}.webp`
}));

export const MASCOT_CATEGORIES = [
  { id: 'all', label: 'Tất cả (' + MASCOT_LIST.length + ')' },
  { id: 'animal', label: 'Thú cưng & Động vật' },
  { id: 'human', label: 'Con người & Nghề nghiệp' },
  { id: 'robot', label: 'Rô-bốt & Thiết bị' },
  { id: 'art', label: 'Nghệ thuật & Pixel' },
  { id: 'object', label: 'Đồ vật & Độc lạ' }
];

export const MASCOT_QUOTES = [
  'Chúc bạn một ngày buôn may bán đắt! 🍀',
  'Nhớ kiểm tra tồn kho thường xuyên nhé! 📦',
  'Khách hàng hài lòng là niềm vui lớn nhất! ❤️',
  'Đừng quên uống nước và giữ sức khỏe nha! 💧',
  'Doanh thu hôm nay sẽ bùng nổ đấy! 🚀',
  'Hôm nay bạn trông rất tuyệt vời! ✨',
  'Lưu hóa đơn đầy đủ để sổ sách rõ ràng nhé! 📑',
  'Cảm ơn bạn đã luôn chăm chỉ làm việc! 🌟',
  'Cần in hóa đơn hay kiểm kho cứ để LyangPOS lo! 🛒',
  'Nghỉ tay một chút nếu thấy mỏi mắt nhé! 👀'
];

export const DEFAULT_MASCOT_CONFIG = {
  enabled: true,
  characterId: 'lyang',
  size: 110,
  opacity: 1,
  showQuotes: true,
  soundEnabled: true,
  locked: false,
  position: null
};

export const playPopSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
};
