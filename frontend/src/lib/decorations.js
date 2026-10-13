// Library of botanical & aesthetic decorations for freeform page customization

export const DECORATION_TEMPLATES = [
  {
    id: 'terracotta_ficus',
    name: 'Chậu Ficus gốm đất nung',
    category: 'plants',
    defaultWidth: 160,
    defaultHeight: 180,
    svg: `
      <svg viewBox="0 0 200 220" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="potGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E29263"/>
            <stop offset="60%" stop-color="#C8733E"/>
            <stop offset="100%" stop-color="#A85724"/>
          </linearGradient>
          <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#7B9468"/>
            <stop offset="100%" stop-color="#4C653C"/>
          </linearGradient>
          <linearGradient id="leafLight1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#93AB81"/>
            <stop offset="100%" stop-color="#5E794E"/>
          </linearGradient>
        </defs>
        <!-- Soft Shadow -->
        <ellipse cx="100" cy="208" rx="46" ry="7" fill="#000000" opacity="0.12"/>
        <!-- Pot -->
        <rect x="72" y="148" width="56" height="12" rx="5" fill="url(#potGrad1)"/>
        <path d="M76 156 L83 204 Q100 210 117 204 L124 156 Z" fill="url(#potGrad1)"/>
        <path d="M82 160 Q86 198 88 200" stroke="#F5BA97" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
        <!-- Stems -->
        <path d="M100 150 Q100 100 100 50" stroke="#37482D" stroke-width="4" stroke-linecap="round"/>
        <path d="M98 135 Q78 110 58 85" stroke="#37482D" stroke-width="3" stroke-linecap="round"/>
        <path d="M102 135 Q122 110 142 85" stroke="#37482D" stroke-width="3" stroke-linecap="round"/>
        <path d="M97 142 Q68 130 46 118" stroke="#37482D" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M103 142 Q132 130 154 118" stroke="#37482D" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Leaves -->
        <path d="M100 25 C82 50 82 85 100 102 C118 85 118 50 100 25 Z" fill="url(#leafLight1)"/>
        <path d="M55 68 C42 88 52 115 74 120 C80 98 75 78 55 68 Z" fill="url(#leafGrad1)"/>
        <path d="M145 68 C158 88 148 115 126 120 C120 98 125 78 145 68 Z" fill="url(#leafLight1)"/>
        <path d="M40 96 C28 116 42 138 64 138 C66 120 56 104 40 96 Z" fill="url(#leafGrad1)"/>
        <path d="M160 96 C172 116 158 138 136 138 C134 120 144 104 160 96 Z" fill="url(#leafLight1)"/>
      </svg>
    `
  },
  {
    id: 'terracotta_monstera',
    name: 'Chậu Trầu Bà Monstera xẻ',
    category: 'plants',
    defaultWidth: 170,
    defaultHeight: 185,
    svg: `
      <svg viewBox="0 0 200 220" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="potGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#DE8C5A"/>
            <stop offset="100%" stop-color="#9C4B1B"/>
          </linearGradient>
          <linearGradient id="monsteraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6E8C5D"/>
            <stop offset="100%" stop-color="#3D5331"/>
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="208" rx="42" ry="7" fill="#000000" opacity="0.12"/>
        <!-- Pot -->
        <rect x="74" y="152" width="52" height="10" rx="4" fill="url(#potGrad2)"/>
        <path d="M78 160 L85 204 Q100 209 115 204 L122 160 Z" fill="url(#potGrad2)"/>
        <!-- Monstera Stems -->
        <path d="M100 156 Q100 115 88 75" stroke="#334629" stroke-width="3" stroke-linecap="round"/>
        <path d="M102 156 Q118 120 135 80" stroke="#334629" stroke-width="3" stroke-linecap="round"/>
        <!-- Left Monstera Leaf with fenestrations -->
        <path d="M88 75 C60 55 45 80 50 110 C62 125 90 120 100 95 C98 80 92 75 88 75 Z" fill="url(#monsteraGrad)"/>
        <ellipse cx="68" cy="92" rx="4" ry="10" transform="rotate(-25 68 92)" fill="#FAF7F2" opacity="0.9"/>
        <ellipse cx="80" cy="104" rx="3.5" ry="8" transform="rotate(-15 80 104)" fill="#FAF7F2" opacity="0.9"/>
        <!-- Right Monstera Leaf -->
        <path d="M135 80 C162 60 172 90 162 120 C148 132 122 125 115 100 C120 85 130 80 135 80 Z" fill="url(#monsteraGrad)"/>
        <ellipse cx="148" cy="98" rx="4" ry="10" transform="rotate(25 148 98)" fill="#FAF7F2" opacity="0.9"/>
        <ellipse cx="135" cy="110" rx="3.5" ry="8" transform="rotate(15 135 110)" fill="#FAF7F2" opacity="0.9"/>
        <!-- Center young leaf -->
        <path d="M100 156 Q100 100 105 45 C115 55 115 80 105 105" fill="#88A276"/>
      </svg>
    `
  },
  {
    id: 'hanging_eucalyptus',
    name: 'Cành Bạch Đàn rủ góc',
    category: 'branches',
    defaultWidth: 220,
    defaultHeight: 140,
    svg: `
      <svg viewBox="0 0 260 160" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="eucGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8DA77E"/>
            <stop offset="100%" stop-color="#577047"/>
          </linearGradient>
        </defs>
        <!-- Arcing branch -->
        <path d="M0 10 Q100 30 180 75 T255 150" stroke="#524336" stroke-width="3" stroke-linecap="round"/>
        <!-- Leaf pairs along branch -->
        <circle cx="35" cy="14" r="14" fill="url(#eucGrad)" opacity="0.9"/>
        <circle cx="48" cy="24" r="15" fill="url(#eucGrad)"/>
        <circle cx="85" cy="27" r="16" fill="url(#eucGrad)" opacity="0.9"/>
        <circle cx="98" cy="38" r="16" fill="url(#eucGrad)"/>
        <circle cx="135" cy="48" r="15" fill="url(#eucGrad)" opacity="0.9"/>
        <circle cx="148" cy="62" r="15" fill="url(#eucGrad)"/>
        <circle cx="180" cy="78" r="14" fill="url(#eucGrad)" opacity="0.9"/>
        <circle cx="195" cy="94" r="14" fill="url(#eucGrad)"/>
        <circle cx="225" cy="116" r="12" fill="url(#eucGrad)" opacity="0.9"/>
        <circle cx="238" cy="132" r="12" fill="url(#eucGrad)"/>
      </svg>
    `
  },
  {
    id: 'olive_branch',
    name: 'Nhánh Lá Oliu thanh bình',
    category: 'branches',
    defaultWidth: 200,
    defaultHeight: 110,
    svg: `
      <svg viewBox="0 0 240 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="oliveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8BA07B"/>
            <stop offset="100%" stop-color="#4E643E"/>
          </linearGradient>
        </defs>
        <!-- Curved stem -->
        <path d="M10 115 Q100 80 230 25" stroke="#483D33" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Narrow olive leaves -->
        <path d="M45 100 C30 85 45 70 65 85 C55 95 50 100 45 100 Z" fill="url(#oliveGrad)"/>
        <path d="M55 105 C65 125 80 115 75 95 C65 100 60 105 55 105 Z" fill="url(#oliveGrad)"/>
        <path d="M95 80 C80 65 95 50 115 65 C105 75 100 80 95 80 Z" fill="url(#oliveGrad)"/>
        <path d="M105 85 C115 105 130 95 125 75 C115 80 110 85 105 85 Z" fill="url(#oliveGrad)"/>
        <path d="M150 58 C135 43 150 28 170 43 C160 53 155 58 150 58 Z" fill="url(#oliveGrad)"/>
        <path d="M160 63 C170 83 185 73 180 53 C170 58 165 63 160 63 Z" fill="url(#oliveGrad)"/>
        <path d="M205 38 C200 20 220 15 230 25 C220 35 210 38 205 38 Z" fill="url(#oliveGrad)"/>
        <!-- Little Olives -->
        <ellipse cx="88" cy="88" rx="4.5" ry="6" fill="#3D452B" transform="rotate(20 88 88)"/>
        <ellipse cx="142" cy="65" rx="4.5" ry="6" fill="#3D452B" transform="rotate(-15 142 65)"/>
      </svg>
    `
  },
  {
    id: 'succulent_bowl',
    name: 'Chậu Sen Đá mộc mạc',
    category: 'plants',
    defaultWidth: 140,
    defaultHeight: 130,
    svg: `
      <svg viewBox="0 0 160 150" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bowlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E0976E"/>
            <stop offset="100%" stop-color="#AA5829"/>
          </linearGradient>
          <linearGradient id="succPetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#98B88B"/>
            <stop offset="60%" stop-color="#6F9261"/>
            <stop offset="100%" stop-color="#C27A62"/>
          </linearGradient>
        </defs>
        <ellipse cx="80" cy="138" rx="42" ry="6" fill="#000000" opacity="0.12"/>
        <!-- Round terracotta bowl -->
        <path d="M35 105 C35 135 125 135 125 105 Z" fill="url(#bowlGrad)"/>
        <ellipse cx="80" cy="105" rx="45" ry="9" fill="#9C5226"/>
        <!-- Succulent Rosette -->
        <g transform="translate(80, 88)">
          <path d="M0 -38 C-12 -20 -15 0 0 10 C15 0 12 -20 0 -38 Z" fill="url(#succPetal)"/>
          <path d="M-30 -15 C-25 5 -10 12 0 10 C-10 -8 -15 -18 -30 -15 Z" fill="url(#succPetal)"/>
          <path d="M30 -15 C25 5 10 12 0 10 C10 -8 15 -18 30 -15 Z" fill="url(#succPetal)"/>
          <path d="M-22 18 C-10 25 0 18 0 10 C-15 5 -18 10 -22 18 Z" fill="url(#succPetal)"/>
          <path d="M22 18 C10 25 0 18 0 10 C15 5 18 10 22 18 Z" fill="url(#succPetal)"/>
          <circle cx="0" cy="5" r="7" fill="#B37862"/>
        </g>
      </svg>
    `
  },
  {
    id: 'zen_sun',
    name: 'Mặt Trời Đất Nung & Đồi',
    category: 'zen',
    defaultWidth: 150,
    defaultHeight: 150,
    svg: `
      <svg viewBox="0 0 160 160" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ECA072"/>
            <stop offset="100%" stop-color="#DE8C5A"/>
          </radialGradient>
        </defs>
        <!-- Circle Sun -->
        <circle cx="80" cy="70" r="38" fill="url(#sunGrad)"/>
        <!-- Minimalist mountain curves below sun -->
        <path d="M15 135 Q50 95 90 120 Q125 100 150 135 Z" fill="#8CA47C" opacity="0.8"/>
        <path d="M30 145 Q80 115 130 145 Z" fill="#678056"/>
      </svg>
    `
  }
];

export const STORAGE_KEY_PREFIX = 'lyang_decorations_';

export function getStoredDecorations(pageKey = 'pos') {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pageKey}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load page decorations', e);
  }
  return [];
}

let saveTimerMap = new Map();

export function saveStoredDecorations(pageKey = 'pos', list = [], debounceMs = 150) {
  if (debounceMs <= 0) {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, JSON.stringify(list));
      const chan = new BroadcastChannel('pos_data_sync');
      chan.postMessage({ type: 'DECORATIONS_UPDATED', pageKey, list });
      chan.close();
    } catch (e) {
      console.error('Failed to save page decorations', e);
    }
    return;
  }

  if (saveTimerMap.has(pageKey)) {
    clearTimeout(saveTimerMap.get(pageKey));
  }

  saveTimerMap.set(pageKey, setTimeout(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, JSON.stringify(list));
      const chan = new BroadcastChannel('pos_data_sync');
      chan.postMessage({ type: 'DECORATIONS_UPDATED', pageKey, list });
      chan.close();
    } catch (e) {
      console.error('Failed to save page decorations', e);
    }
    saveTimerMap.delete(pageKey);
  }, debounceMs));
}

/**
 * Thuật toán tách nền (xóa phông) thông minh bằng HTML5 Canvas:
 * - Tự động quét màu viền và 4 góc biên ảnh (nền trắng, xám, hoặc đơn sắc)
 * - Dùng BFS Flood-fill từ 4 cạnh ngoài viền đi vào, bảo vệ các chi tiết màu trắng bên trong vật thể (mắt, răng, áo...)
 * - Tạo đường viền mềm mại (anti-aliasing) giúp sticker không bị răng cưa
 */
export function removeImageBackground(dataUrl, tolerance = 36) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      if (w <= 0 || h <= 0) {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Thu thập mẫu màu từ 4 góc và các điểm biên
      const samplePoints = [
        [0, 0],
        [w - 1, 0],
        [0, h - 1],
        [w - 1, h - 1],
        [Math.floor(w / 2), 0],
        [Math.floor(w / 2), h - 1],
        [0, Math.floor(h / 2)],
        [w - 1, Math.floor(h / 2)]
      ];

      const bgCandidates = [];
      for (const [sx, sy] of samplePoints) {
        const p = (sy * w + sx) * 4;
        if (data[p + 3] > 40) { // Điểm ảnh không trong suốt
          bgCandidates.push({ r: data[p], g: data[p + 1], b: data[p + 2] });
        }
      }

      // Xác định màu nền tham chiếu chính (trung bình các mẫu viền không trong suốt)
      let bgR = 255, bgG = 255, bgB = 255;
      if (bgCandidates.length > 0) {
        const sum = bgCandidates.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
        bgR = Math.round(sum.r / bgCandidates.length);
        bgG = Math.round(sum.g / bgCandidates.length);
        bgB = Math.round(sum.b / bgCandidates.length);
      }

      const visited = new Uint8Array(w * h);
      const queue = [];

      // Khởi tạo hàng đợi với toàn bộ các điểm ảnh ở 4 đường viền bao quanh ảnh
      for (let x = 0; x < w; x++) {
        queue.push(x, 0);
        queue.push(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        queue.push(0, y);
        queue.push(w - 1, y);
      }

      const colorDistance = (r1, g1, b1, r2, g2, b2) => {
        return Math.sqrt(
          (r1 - r2) * (r1 - r2) +
          (g1 - g2) * (g1 - g2) +
          (b1 - b2) * (b1 - b2)
        );
      };

      let head = 0;
      while (head < queue.length) {
        const x = queue[head++];
        const y = queue[head++];
        const idx = y * w + x;

        if (visited[idx]) continue;
        visited[idx] = 1;

        const pIdx = idx * 4;
        const r = data[pIdx];
        const g = data[pIdx + 1];
        const b = data[pIdx + 2];
        const a = data[pIdx + 3];

        // Nếu điểm ảnh đã trong suốt từ trước (ví dụ ảnh đã crop/PNG):
        // Vẫn lan truyền sang các lân cận để tiếp tục tẩy nền các vùng bao quanh
        if (a === 0) {
          if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
          if (x < w - 1 && !visited[idx + 1]) queue.push(x + 1, y);
          if (y > 0 && !visited[idx - w]) queue.push(x, y - 1);
          if (y < h - 1 && !visited[idx + w]) queue.push(x, y + 1);
          continue;
        }

        const distToBg = colorDistance(r, g, b, bgR, bgG, bgB);

        // Kiểm tra tương đồng với bất kỳ điểm góc nào
        let matchesAnyCorner = false;
        for (const c of bgCandidates) {
          if (colorDistance(r, g, b, c.r, c.g, c.b) <= tolerance) {
            matchesAnyCorner = true;
            break;
          }
        }

        // Nhận diện nền trắng/xám sáng phổ biến (chụp sản phẩm studio / sticker)
        const isNearWhite = (r > 218 && g > 218 && b > 218) && (Math.max(r, g, b) - Math.min(r, g, b) < 25);

        if (distToBg <= tolerance || matchesAnyCorner || isNearWhite) {
          data[pIdx + 3] = 0; // Làm trong suốt hoàn toàn

          // Lan truyền sang 4 lân cận
          if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
          if (x < w - 1 && !visited[idx + 1]) queue.push(x + 1, y);
          if (y > 0 && !visited[idx - w]) queue.push(x, y - 1);
          if (y < h - 1 && !visited[idx + w]) queue.push(x, y + 1);
        }
      }

      // Làm mềm viền (Soft Edge / Feathering) để ảnh không bị răng cưa
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const pIdx = idx * 4;
          if (data[pIdx + 3] > 0) {
            const hasTransparentNeighbor = 
              data[(idx - 1) * 4 + 3] === 0 ||
              data[(idx + 1) * 4 + 3] === 0 ||
              data[(idx - w) * 4 + 3] === 0 ||
              data[(idx + w) * 4 + 3] === 0;

            if (hasTransparentNeighbor) {
              const dist = colorDistance(data[pIdx], data[pIdx + 1], data[pIdx + 2], bgR, bgG, bgB);
              const isWhiteEdge = data[pIdx] > 210 && data[pIdx + 1] > 210 && data[pIdx + 2] > 210;
              if (dist <= tolerance * 1.4 || isWhiteEdge) {
                data[pIdx + 3] = Math.round(data[pIdx + 3] * 0.35); // Khử viền răng cưa
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      let outUrl = canvas.toDataURL('image/png');
      resolve(outUrl);
    };
    img.src = dataUrl;
  });
}
