import { MASCOT_LIST, playPopSound } from './mascots';

export const BUTTON_MASCOTS_STORAGE_KEY = 'pos_button_mascots';

export const DEFAULT_BUTTON_MASCOT_CONFIG = {
  size: 38,
  top: -26,
  right: 8,
  visible: true,
  characterId: 'active_pill',
  imageUrl: '/assets/images/mascot_active_pill.png'
};

export const BUTTON_MASCOT_QUOTES = [
  'Dạ em ngồi đây canh nút cho chủ quán nè! 🌾',
  'Nhấn nút này là đơn hàng bùng nổ nha! 🚀',
  'Buôn may bán đắt, khách đến tấp nập! 🍀',
  'Em sẵn sàng rồi, chủ quán cứ bấm em đi! ✨',
  'Tuyệt vời quá, một ngày làm việc tràn đầy năng lượng! 🌟',
  'Nút này siêu quan trọng luôn á! 📦',
  'Cố lên nha chủ quán ơi, doanh thu đỉnh chóp! 🏆',
  'Hôm nay quán mình đông khách quá xá! ❤️'
];

export const INTERACTIVE_SELECTOR = `
  button, 
  [role="button"], 
  a.btn, 
  a.button,
  [data-bubble], 
  #partner-card-bubble,
  #cash-bubble,
  #total-bubble,
  #total-amount-bubble,
  .group\\/partner-bubble,
  .group\\/cash-calculator,
  .group\\/total,
  .group\\/payment-toggle,
  .group\\/note-container > div, 
  .group\\/ship-container > div
`;

/**
 * Kiểm tra xem phần tử được click có phải là button hoặc bubble/card hợp lệ không
 */
export function getInteractiveTarget(target) {
  if (!target || typeof target.closest !== 'function') return null;

  // 1. Nút chuẩn hoặc role="button"
  const btn = target.closest('button, [role="button"], a.btn, a.button');
  if (btn) return btn;

  // 2. Các thẻ bubble/card trong POS hoặc giao diện
  const bubble = target.closest(INTERACTIVE_SELECTOR);
  if (bubble) return bubble;

  // 3. Các thẻ có cursor-pointer dạng pill/badge/card nhỏ
  const clickableCard = target.closest('.cursor-pointer');
  if (clickableCard) {
    const tag = clickableCard.tagName.toLowerCase();
    if (!['body', 'html', 'table', 'tbody', 'tr'].includes(tag)) {
      const rect = clickableCard.getBoundingClientRect();
      if (rect.width > 24 && rect.width < 650 && rect.height > 20 && rect.height < 250) {
        return clickableCard;
      }
    }
  }

  return null;
}

/**
 * Lấy danh sách tất cả các button & bubble tương tác trên trang
 */
export function getAllInteractiveElements() {
  if (typeof document === 'undefined') return [];
  const list = Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR));
  return Array.from(new Set(list));
}

/**
 * Trích xuất text ngắn gọn & sạch của một nút bấm hoặc bubble
 */
export function getButtonLabel(btn) {
  if (!btn) return 'Nút / Bubble';

  if (btn.dataset?.bubble) {
    if (btn.dataset.bubble === 'partner') return 'Đối tác / Khách hàng';
    if (btn.dataset.bubble === 'cash') return 'Khách đưa (F1)';
    if (btn.dataset.bubble === 'debt') return 'Thanh toán công nợ (F1)';
    if (btn.dataset.bubble === 'total') return 'Tổng cộng thanh toán';
    if (btn.dataset.bubble === 'note') return 'Ghi chú hóa đơn';
    if (btn.dataset.bubble === 'ship') return 'Giao hàng tận nơi';
    if (btn.dataset.bubble === 'payment') return 'Hình thức thanh toán';
  }

  if (btn.id === 'partner-card-bubble') return 'Đối tác / Khách hàng';
  if (btn.id === 'cash-bubble') return 'Khách đưa (F1)';
  if (btn.id === 'debt-bubble') return 'Thanh toán công nợ (F1)';
  if (btn.id === 'total-amount-bubble' || btn.id === 'total-bubble') return 'Tổng cộng thanh toán';

  const aria = btn.getAttribute('aria-label');
  if (aria && aria.trim()) return aria.trim();

  const title = btn.getAttribute('title');
  if (title && title.trim()) return title.trim();

  // Thử lấy text nội dung
  const rawText = btn.innerText || btn.textContent || '';
  const clean = rawText.replace(/\s+/g, ' ').trim();
  if (clean) {
    return clean.length > 30 ? clean.slice(0, 30) + '...' : clean;
  }

  // Nếu là nút icon không có chữ
  if (btn.id) return `#${btn.id}`;
  return 'Nút / Bubble';
}

/**
 * Tạo một khóa nhận diện duy nhất và ổn định cho nút bấm hoặc bubble
 */
export function getButtonSignature(btn) {
  if (!btn) return null;

  // Nếu nút đã được gắn data attribute từ trước
  const existingKey = btn.getAttribute('data-pos-mascot-key');
  if (existingKey) return existingKey;

  // 1. Nếu là bubble cụ thể
  if (btn.id === 'total-amount-bubble') {
    const key = 'btn_bubble_total';
    btn.setAttribute('data-pos-mascot-key', key);
    return key;
  }
  if (btn.id === 'total-bubble') {
    const childTotal = btn.querySelector('#total-amount-bubble');
    if (childTotal) {
      const key = 'btn_bubble_total';
      childTotal.setAttribute('data-pos-mascot-key', key);
      return key;
    }
    const key = 'btn_bubble_total';
    btn.setAttribute('data-pos-mascot-key', key);
    return key;
  }
  if (btn.dataset?.bubble) {
    const key = `btn_bubble_${btn.dataset.bubble}`;
    btn.setAttribute('data-pos-mascot-key', key);
    return key;
  }
  if (btn.id === 'cash-bubble') {
    const key = 'btn_bubble_cash';
    btn.setAttribute('data-pos-mascot-key', key);
    return key;
  }
  if (btn.id === 'partner-card-bubble') {
    const key = 'btn_bubble_partner';
    btn.setAttribute('data-pos-mascot-key', key);
    return key;
  }

  // 2. Nếu có ID duy nhất
  if (btn.id && btn.id.trim()) {
    const key = `btn_id_${btn.id.trim()}`;
    btn.setAttribute('data-pos-mascot-key', key);
    return key;
  }

  // 3. Dựa trên pathname hiện tại + nhãn nút + vị trí trong danh sách các nút cùng nhãn
  const pathname = (typeof window !== 'undefined' ? window.location.pathname : 'global')
    .replace(/[^a-zA-Z0-9]/g, '_') || 'root';

  const label = getButtonLabel(btn).replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');

  const allElements = getAllInteractiveElements();
  const sameLabelElements = allElements.filter((b) => getButtonLabel(b) === getButtonLabel(btn));
  const index = Math.max(0, sameLabelElements.indexOf(btn));

  const key = `btn_${pathname}_${label || 'btn'}_${index}`;
  btn.setAttribute('data-pos-mascot-key', key);
  return key;
}

/**
 * Tìm lại nút bấm hoặc bubble trong DOM theo signature
 */
export function findButtonBySignature(signature) {
  if (!signature || typeof document === 'undefined') return null;

  // 1. Thử tìm bằng data attribute
  const byAttr = document.querySelector(`[data-pos-mascot-key="${signature}"]`);
  if (byAttr) return byAttr;

  // 2. Thử tìm bằng bubble
  if (signature.startsWith('btn_bubble_')) {
    const bubbleType = signature.replace('btn_bubble_', '');
    if (bubbleType === 'total') {
      const byTotal = document.getElementById('total-amount-bubble') ||
                      document.getElementById('purchase-total-bubble') ||
                      document.querySelector('#total-bubble [data-bubble="total"]') ||
                      document.querySelector('[data-bubble="total"]') ||
                      document.getElementById('total-bubble');
      if (byTotal) {
        byTotal.setAttribute('data-pos-mascot-key', signature);
        return byTotal;
      }
    }
    const byBubble = (bubbleType === 'cash' ? document.getElementById('cash-bubble') : null) ||
      (bubbleType === 'partner' ? document.getElementById('partner-card-bubble') : null) ||
      document.querySelector(`[data-bubble="${bubbleType}"]`);
    if (byBubble) {
      byBubble.setAttribute('data-pos-mascot-key', signature);
      return byBubble;
    }
  }

  // 3. Thử tìm bằng ID
  if (signature.startsWith('btn_id_')) {
    const id = signature.replace('btn_id_', '');
    const byId = document.getElementById(id);
    if (byId) {
      byId.setAttribute('data-pos-mascot-key', signature);
      return byId;
    }
  }

  // 4. Quét tất cả interactive elements trên trang hiện tại để khớp signature
  const allElements = getAllInteractiveElements();
  for (const b of allElements) {
    if (b.getAttribute('data-pos-mascot-key') === signature) {
      return b;
    }
  }
  for (const b of allElements) {
    if (getButtonSignature(b) === signature) {
      return b;
    }
  }

  return null;
}

/**
 * Đọc danh sách Mascot nút bấm từ LocalStorage
 */
export function getStoredButtonMascots() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const saved = localStorage.getItem(BUTTON_MASCOTS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[ButtonMascots] Error parsing localStorage:', e);
  }
  return {};
}

/**
 * Lưu danh sách Mascot nút bấm vào LocalStorage và phát sự kiện đồng bộ
 */
export function saveButtonMascots(mascots) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(BUTTON_MASCOTS_STORAGE_KEY, JSON.stringify(mascots));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_button_mascots_updated', { detail: mascots }));
      try {
        const chan = new BroadcastChannel('pos_button_mascots_sync');
        chan.postMessage({ type: 'BUTTON_MASCOTS_UPDATED', value: mascots });
        chan.close();
      } catch (err) {}
    }
  } catch (e) {
    console.error('[ButtonMascots] Error saving to localStorage:', e);
  }
}

/**
 * Thêm hoặc cập nhật Mascot cho một nút bấm
 */
export function setButtonMascot(signature, config = {}) {
  const current = getStoredButtonMascots();
  const merged = {
    ...DEFAULT_BUTTON_MASCOT_CONFIG,
    ...(current[signature] || {}),
    ...config,
    id: signature,
    updatedAt: Date.now()
  };
  current[signature] = merged;
  saveButtonMascots(current);
  return merged;
}

/**
 * Gỡ bỏ Mascot khỏi nút bấm
 */
export function removeButtonMascot(signature) {
  const current = getStoredButtonMascots();
  if (current[signature]) {
    delete current[signature];
    saveButtonMascots(current);
    return true;
  }
  return false;
}

/**
 * Lấy config ảnh đại diện cho mascot
 */
export function getMascotImageInfo(characterId) {
  if (!characterId || characterId === 'active_pill' || characterId === 'lyang_pill') {
    return {
      type: 'image',
      url: '/assets/images/mascot_active_pill.png',
      name: 'Lí An (Sidebar)',
      isSprite: false
    };
  }

  const char = MASCOT_LIST.find((c) => c.id === characterId);
  if (char) {
    return {
      type: 'sprite',
      url: char.directions || '/mascots/lyang-directions.webp',
      name: char.name,
      emoji: char.emoji,
      isSprite: true
    };
  }

  return {
    type: 'image',
    url: '/assets/images/mascot_active_pill.png',
    name: 'Lí An (Sidebar)',
    isSprite: false
  };
}
