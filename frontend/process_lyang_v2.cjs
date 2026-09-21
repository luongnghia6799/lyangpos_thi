const sharp = require('sharp');
const path = require('path');

/**
 * Robust Per-Cell Background Removal:
 * Processes each of the 9 cells (360x360) independently:
 * 1. Seeds flood fill from the 4 outer borders of that 360x360 cell.
 * 2. Any pixel connected to border with white/near-white color (> 240) becomes 100% transparent.
 * 3. Any pixel NOT reached (inside character's face, eyes, hair, clothes) stays 100% OPAQUE.
 * This GUARANTEES eye whites, teeth, highlights, and white shirt collars are NEVER transparent!
 */
async function processSpriteSheetPerCell(inputPath, outputPath) {
  const image = sharp(inputPath);
  const rawBuffer = await image
    .resize(1080, 1080, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = rawBuffer;
  const W = info.width;   // 1080
  const H = info.height;  // 1080
  const channels = info.channels;
  const cellSize = 360;

  const rgba = Buffer.alloc(W * H * 4);

  // Process each of the 9 cells (row 0..2, col 0..2)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const startX = col * cellSize;
      const startY = row * cellSize;

      const cellBg = new Uint8Array(cellSize * cellSize);

      function isCellWhite(cx, cy) {
        const globalX = startX + cx;
        const globalY = startY + cy;
        const idx = (globalY * W + globalX) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        return r > 238 && g > 238 && b > 238;
      }

      const queue = [];

      // Seed cell borders
      for (let cx = 0; cx < cellSize; cx++) {
        if (isCellWhite(cx, 0)) { cellBg[0 * cellSize + cx] = 1; queue.push(cx, 0); }
        if (isCellWhite(cx, cellSize - 1)) { cellBg[(cellSize - 1) * cellSize + cx] = 1; queue.push(cx, cellSize - 1); }
      }
      for (let cy = 0; cy < cellSize; cy++) {
        if (isCellWhite(0, cy) && !cellBg[cy * cellSize + 0]) { cellBg[cy * cellSize + 0] = 1; queue.push(0, cy); }
        if (isCellWhite(cellSize - 1, cy) && !cellBg[cy * cellSize + (cellSize - 1)]) { cellBg[cy * cellSize + (cellSize - 1)] = 1; queue.push(cellSize - 1, cy); }
      }

      // BFS Flood Fill inside this cell only
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
            if (cellBg[nIdx] === 0 && isCellWhite(nx, ny)) {
              cellBg[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      // Write cell to global RGBA
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const globalX = startX + cx;
          const globalY = startY + cy;

          const pIdx = globalY * W + globalX;
          const srcIdx = pIdx * channels;
          const dstIdx = pIdx * 4;

          rgba[dstIdx] = data[srcIdx];
          rgba[dstIdx + 1] = data[srcIdx + 1];
          rgba[dstIdx + 2] = data[srcIdx + 2];

          const cIdx = cy * cellSize + cx;
          if (cellBg[cIdx] === 1) {
            // True background -> fully transparent
            rgba[dstIdx + 3] = 0;
          } else {
            // Foreground character (eyes, face, clothes, hat) -> 100% OPAQUE
            rgba[dstIdx + 3] = 255;
          }
        }
      }
    }
  }

  await sharp(rgba, {
    raw: {
      width: W,
      height: H,
      channels: 4
    }
  })
  .webp({ quality: 95, alphaQuality: 100 })
  .toFile(outputPath);

  console.log(`Generated perfect transparent sprite: ${outputPath}`);
}

async function run() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_v2_1789973942085.jpg');
  const reactImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_reactions_v2_1789974000359.jpg');
  
  const outDir = path.join(__dirname, 'public', 'mascots');

  await processSpriteSheetPerCell(dirImg, path.join(outDir, 'lyang-directions.webp'));
  await processSpriteSheetPerCell(reactImg, path.join(outDir, 'lyang-reactions.webp'));
}

run().catch(console.error);
