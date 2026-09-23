const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processCheobingoSprites() {
  const dirImgPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_directions_1790123032049.jpg';
  const reactImgPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_reactions_1790123059608.jpg';
  const outDir = path.join(__dirname, 'public', 'mascots');

  const W = 1080;
  const H = 1080;
  const cellSize = 360;

  async function processSheet(imgPath, targetOut) {
    const rawBuffer = await sharp(imgPath)
      .resize(W, H, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = rawBuffer;
    const channels = info.channels;
    const outRgba = Buffer.alloc(W * H * 4);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const startX = col * cellSize;
        const startY = row * cellSize;

        const isBg = new Uint8Array(cellSize * cellSize);

        function isWhite(cx, cy) {
          const gx = startX + cx;
          const gy = startY + cy;
          const idx = (gy * W + gx) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          return r > 225 && g > 225 && b > 225;
        }

        const queue = [];

        // Seed 4 outer borders of this 360x360 cell
        for (let cx = 0; cx < cellSize; cx++) {
          if (isWhite(cx, 0)) { isBg[0 * cellSize + cx] = 1; queue.push(cx, 0); }
          if (isWhite(cx, cellSize - 1)) { isBg[(cellSize - 1) * cellSize + cx] = 1; queue.push(cx, cellSize - 1); }
        }
        for (let cy = 0; cy < cellSize; cy++) {
          if (isWhite(0, cy) && !isBg[cy * cellSize + 0]) { isBg[cy * cellSize + 0] = 1; queue.push(0, cy); }
          if (isWhite(cellSize - 1, cy) && !isBg[cy * cellSize + (cellSize - 1)]) { isBg[cy * cellSize + (cellSize - 1)] = 1; queue.push(cellSize - 1, cy); }
        }

        let head = 0;
        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];

          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ];

          for (let i = 0; i < 4; i++) {
            const nx = neighbors[i][0];
            const ny = neighbors[i][1];

            if (nx >= 0 && nx < cellSize && ny >= 0 && ny < cellSize) {
              const nIdx = ny * cellSize + nx;
              if (isBg[nIdx] === 0 && isWhite(nx, ny)) {
                isBg[nIdx] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }

        // Apply edge defringe
        for (let cy = 0; cy < cellSize; cy++) {
          for (let cx = 0; cx < cellSize; cx++) {
            const cIdx = cy * cellSize + cx;
            const gx = startX + cx;
            const gy = startY + cy;
            const dstIdx = (gy * W + gx) * 4;

            if (isBg[cIdx] === 1) {
              outRgba[dstIdx + 3] = 0;
              continue;
            }

            let borderDistance = 99;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx < 0 || nx >= cellSize || ny < 0 || ny >= cellSize || isBg[ny * cellSize + nx] === 1) {
                  borderDistance = 1;
                  break;
                }
              }
              if (borderDistance === 1) break;
            }

            const srcIdx = (gy * W + gx) * channels;
            const r = data[srcIdx];
            const g = data[srcIdx + 1];
            const b = data[srcIdx + 2];

            if (borderDistance === 1 && (r + g + b) / 3 > 210) {
              outRgba[dstIdx + 3] = 0; // defringe edge halo
              continue;
            }

            outRgba[dstIdx] = r;
            outRgba[dstIdx + 1] = g;
            outRgba[dstIdx + 2] = b;
            outRgba[dstIdx + 3] = 255;
          }
        }
      }
    }

    await sharp(outRgba, { raw: { width: W, height: H, channels: 4 } })
      .webp({ quality: 95, alphaQuality: 100 })
      .toFile(targetOut);

    console.log(`Saved: ${targetOut}`);
  }

  await processSheet(dirImgPath, path.join(outDir, 'cheobingo-directions.webp'));
  await processSheet(reactImgPath, path.join(outDir, 'cheobingo-reactions.webp'));
}

processCheobingoSprites().catch(console.error);
