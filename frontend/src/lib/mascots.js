// Cấu hình danh sách nhân vật Mascot cho LyangPOS
export const MASCOT_LIST = [
  {
    id: 'fox',
    name: 'Cáo Foxy',
    desc: 'Nhanh nhẹn & Thông minh',
    directions: '/mascots/fox-directions.webp',
    reactions: '/mascots/fox-reactions.webp',
    color: '#f97316',
    emoji: '🦊'
  },
  {
    id: 'cat',
    name: 'Mèo Meo',
    desc: 'Lém lỉnh & Chiêu tài lộc',
    directions: '/mascots/cat-directions.webp',
    reactions: '/mascots/cat-reactions.webp',
    color: '#fbbf24',
    emoji: '🐱'
  },
  {
    id: 'bear',
    name: 'Gấu Bự',
    desc: 'Đáng yêu & Tràn đầy năng lượng',
    directions: '/mascots/bear-directions.webp',
    reactions: '/mascots/bear-reactions.webp',
    color: '#a16207',
    emoji: '🐻'
  },
  {
    id: 'bunny',
    name: 'Thỏ BunBun',
    desc: 'Dễ thương & Nhanh nhẹn',
    directions: '/mascots/bunny-directions.webp',
    reactions: '/mascots/bunny-reactions.webp',
    color: '#f472b6',
    emoji: '🐰'
  },
  {
    id: 'frog',
    name: 'Ếch Xanh',
    desc: 'Vui tươi & May mắn',
    directions: '/mascots/frog-directions.webp',
    reactions: '/mascots/frog-reactions.webp',
    color: '#22c55e',
    emoji: '🐸'
  },
  {
    id: 'dino',
    name: 'Khủng Long Dino',
    desc: 'Tí hon & Hăng say bán hàng',
    directions: '/mascots/dino-directions.webp',
    reactions: '/mascots/dino-reactions.webp',
    color: '#10b981',
    emoji: '🦖'
  },
  {
    id: 'panda',
    name: 'Gấu Trúc Panda',
    desc: 'Bình tĩnh & Đem lại thịnh vượng',
    directions: '/mascots/panda-directions.webp',
    reactions: '/mascots/panda-reactions.webp',
    color: '#334155',
    emoji: '🐼'
  },
  {
    id: 'otter',
    name: 'Rái Cá Ottie',
    desc: 'Năng động & Hài hước',
    directions: '/mascots/otter-directions.webp',
    reactions: '/mascots/otter-reactions.webp',
    color: '#b45309',
    emoji: '🦦'
  },
  {
    id: 'gearbot',
    name: 'Rô-bốt Geary',
    desc: 'Trợ lý tính toán siêu tốc',
    directions: '/mascots/gearbot-directions.webp',
    reactions: '/mascots/gearbot-reactions.webp',
    color: '#6366f1',
    emoji: '🤖'
  },
  {
    id: 'penguin',
    name: 'Cánh Cụt Pingu',
    desc: 'Mát mẻ & Siêng năng',
    directions: '/mascots/penguin-directions.webp',
    reactions: '/mascots/penguin-reactions.webp',
    color: '#0284c7',
    emoji: '🐧'
  }
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
  characterId: 'fox',
  size: 110, // px
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
  } catch (e) {
    // ignore audio error
  }
};
