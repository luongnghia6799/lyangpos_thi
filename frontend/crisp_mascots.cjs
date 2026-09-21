const sharp = require('sharp');
const path = require('path');

/**
 * Clean Alpha Extraction without side specks:
 * 1. Process 1080x1080 image.
 * 2. Flood fill with threshold=225 from border.
 * 3. Contract foreground by 1-2px (erosion) to completely eliminate any white fringe/halo.
 * 4. For reactions, scale character to exactly match directions size and anchor vertically to bottom.
 */
async function createCrispMascotSprites() {
  const dirImgPath = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_v5_1789974772538.jpg');
  const reactImgPath = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_reactions_v5_1789974808111.jpg');
  const outDir = path.join(__dirname, 'public', 'mascots');

  const W = 1080;
  const H = 1080;
  const cellSize = 360;

  async function processSheet(imgPath, scaleRatio = 1.0, yOffset = 0) {
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
          return r > 218 && g > 218 && b > 218;
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

        // Apply 1-pixel alpha erosion along edges to shave off white fringe cleanly
        const cellRgba = Buffer.alloc(cellSize * cellSize * 4);

        for (let cy = 0; cy < cellSize; cy++) {
          for (let cx = 0; cx < cellSize; cx++) {
            const cIdx = cy * cellSize + cx;
            const dstIdx = cIdx * 4;

            if (isBg[cIdx] === 1) {
              cellRgba[dstIdx + 3] = 0;
              continue;
            }

            // Check if touches background
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

            const gx = startX + cx;
            const gy = startY + cy;
            const srcIdx = (gy * W + gx) * channels;

            const r = data[srcIdx];
            const g = data[srcIdx + 1];
            const b = data[srcIdx + 2];

            if (borderDistance === 1) {
              // Edge pixel: if it's overly bright from background blend, make it transparent or soften
              const brightness = (r + g + b) / 3;
              if (brightness > 200) {
                cellRgba[dstIdx + 3] = 0; // Cut off white halo
                continue;
              }
            }

            cellRgba[dstIdx] = r;
            cellRgba[dstIdx + 1] = g;
            cellRgba[dstIdx + 2] = b;
            cellRgba[dstIdx + 3] = 255;
          }
        }

        // If scaleRatio != 1.0, scale and position within cell
        let finalCellBuffer = cellRgba;
        if (scaleRatio !== 1.0) {
          const scaledW = Math.round(cellSize * scaleRatio);
          const scaledH = Math.round(cellSize * scaleRatio);
          const resized = await sharp(cellRgba, { raw: { width: cellSize, height: cellSize, channels: 4 } })
            .resize(scaledW, scaledH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .raw()
            .toBuffer({ resolveWithObject: true });

          const ox = Math.floor((cellSize - scaledW) / 2);
          const oy = cellSize - scaledH + yOffset;

          finalCellBuffer = Buffer.alloc(cellSize * cellSize * 4);
          for (let cy = 0; cy < scaledH; cy++) {
            for (let cx = 0; cx < scaledW; cx++) {
              const srcIdx = (cy * scaledW + cx) * 4;
              const dstX = ox + cx;
              const dstY = oy + cy;
              if (dstX >= 0 && dstX < cellSize && dstY >= 0 && dstY < cellSize) {
                const dstIdx = (dstY * cellSize + dstX) * 4;
                finalCellBuffer[dstIdx] = resized.data[srcIdx];
                finalCellBuffer[dstIdx + 1] = resized.data[srcIdx + 1];
                finalCellBuffer[dstIdx + 2] = resized.data[srcIdx + 2];
                finalCellBuffer[dstIdx + 3] = resized.data[srcIdx + 3];
              }
            }
          }
        }

        // Copy cell to outRgba
        for (let cy = 0; cy < cellSize; cy++) {
          for (let cx = 0; cx < cellSize; cx++) {
            const cIdx = (cy * cellSize + cx) * 4;
            const gx = startX + cx;
            const gy = startY + cy;
            const dstIdx = (gy * W + gx) * 4;

            outRgba[dstIdx] = finalCellBuffer[cIdx];
            outRgba[dstIdx + 1] = finalCellBuffer[cIdx + 1];
            outRgba[dstIdx + 2] = finalCellBuffer[cIdx + 2];
            outRgba[dstIdx + 3] = finalCellBuffer[cIdx + 3];
          }
        }
      }
    }

    return sharp(outRgba, { raw: { width: W, height: H, channels: 4 } });
  }

  // Process directions (scale 1.0)
  const dirSharp = await processSheet(dirImgPath, 1.0);
  await dirSharp.webp({ quality: 95, alphaQuality: 100 }).toFile(path.join(outDir, 'lyang-directions.webp'));

  // Process reactions (scale 0.88 to match directions size and position)
  const reactSharp = await processSheet(reactImgPath, 0.88, -2);
  await reactSharp.webp({ quality: 95, alphaQuality: 100 }).toFile(path.join(outDir, 'lyang-reactions.webp'));

  console.log('Finished creating crisp, white-halo-free, perfectly scaled Lyang sprites!');
}

createCrispMascotSprites().catch(console.error);
