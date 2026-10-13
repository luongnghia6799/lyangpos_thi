// Library of aesthetic decorations for freeform page customization
export const DECORATION_TEMPLATES = [];

export const STORAGE_KEY_PREFIX = 'lyang_decorations_';

export function getStoredDecorations(pageKey = 'pos') {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pageKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Chỉ lưu giữ sticker ảnh custom của người dùng, tự động dọn sạch các preset sticker cũ
        return parsed.filter(item => Boolean(item.customImgUrl));
      }
    }
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
