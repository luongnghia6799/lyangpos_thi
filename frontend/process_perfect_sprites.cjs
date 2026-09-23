const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processPerfectGrid(inputPath, outputPath, isReaction = false) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const W = 1080;
  const H = 1080;
  const cellSize = 360;

  const rawBuffer = await image
    .resize(W, H, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = rawBuffer;
  const channels = info.channels;

  const outRgba = Buffer.alloc(W * H * 4);

  // Target dimensions for normalized alignment
  // Each character will be scaled so that its height fits comfortably inside 285px
  // and anchored so the bottom of the body sits exactly 22px from the bottom of the cell (y = 338).
  const targetMaxH = 285;
  const bottomMargin = 20;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const startX = c * cellSize;
      const startY = r * cellSize;

      // Step 1: Flood fill background within this cell
      const isBg = new Uint8Array(cellSize * cellSize);

      function isWhite(cx, cy) {
        const gx = startX + cx;
        const gy = startY + cy;
        const idx = (gy * W + gx) * channels;
        const red = data[idx];
        const green = data[idx + 1];
        const blue = data[idx + 2];
        return red > 225 && green > 225 && blue > 225;
      }

      const queue = [];

      // Seed cell borders
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

      // Step 2: Find exact bounding box of character in this cell
      let minX = cellSize, maxX = 0, minY = cellSize, maxY = 0;
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const cIdx = cy * cellSize + cx;
          if (isBg[cIdx] === 0) {
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
          }
        }
      }

      // Ignore noise if empty
      if (minX > maxX || minY > maxY) continue;

      const charW = maxX - minX + 1;
      const charH = maxY - minY + 1;

      // Step 3: Extract character into a clean cropped buffer
      const charBuffer = Buffer.alloc(charW * charH * 4);
      for (let cy = 0; cy < charH; cy++) {
        for (let cx = 0; cx < charW; cx++) {
          const origCx = minX + cx;
          const origCy = minY + cy;
          const cIdx = origCy * cellSize + origCx;
          const dstIdx = (cy * charW + cx) * 4;

          if (isBg[cIdx] === 1) {
            charBuffer[dstIdx + 3] = 0;
          } else {
            // Defringe edge
            let touchesBg = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = origCx + dx;
                const ny = origCy + dy;
                if (nx < 0 || nx >= cellSize || ny < 0 || ny >= cellSize || isBg[ny * cellSize + nx] === 1) {
                  touchesBg = true;
                  break;
                }
              }
              if (touchesBg) break;
            }

            const gx = startX + origCx;
            const gy = startY + origCy;
            const srcIdx = (gy * W + gx) * channels;
            const red = data[srcIdx];
            const green = data[srcIdx + 1];
            const blue = data[srcIdx + 2];

            if (touchesBg && (red + green + blue) / 3 > 215) {
              charBuffer[dstIdx + 3] = 0;
            } else {
              charBuffer[dstIdx] = red;
              charBuffer[dstIdx + 1] = green;
              charBuffer[dstIdx + 2] = blue;
              charBuffer[dstIdx + 3] = 255;
            }
          }
        }
      }

      // Step 4: Scale to target size
      // Scale uniformly so height fits targetMaxH (around 285px)
      const scale = Math.min(targetMaxH / charH, (cellSize - 40) / charW, 1.0);
      const scaledW = Math.round(charW * scale);
      const scaledH = Math.round(charH * scale);

      const resized = await sharp(charBuffer, {
        raw: { width: charW, height: charH, channels: 4 }
      })
      .resize(scaledW, scaledH, { fit: 'contain' })
      .raw()
      .toBuffer({ resolveWithObject: true });

      // Step 5: Center horizontally, anchor bottom to (cellSize - bottomMargin - scaledH)
      const pasteX = Math.round((cellSize - scaledW) / 2);
      const pasteY = cellSize - bottomMargin - scaledH;

      console.log(`Cell [${r},${c}] scaled to ${scaledW}x${scaledH}, placed at (${pasteX}, ${pasteY})`);

      for (let cy = 0; cy < scaledH; cy++) {
        for (let cx = 0; cx < scaledW; cx++) {
          const srcIdx = (cy * scaledW + cx) * 4;
          const alpha = resized.data[srcIdx + 3];
          if (alpha > 0) {
            const dstX = startX + pasteX + cx;
            const dstY = startY + pasteY + cy;
            if (dstX >= startX && dstX < startX + cellSize && dstY >= startY && dstY < startY + cellSize) {
              const dstIdx = (dstY * W + dstX) * 4;
              outRgba[dstIdx] = resized.data[srcIdx];
              outRgba[dstIdx + 1] = resized.data[srcIdx + 1];
              outRgba[dstIdx + 2] = resized.data[srcIdx + 2];
              outRgba[dstIdx + 3] = alpha;
            }
          }
        }
      }
    }
  }

  await sharp(outRgba, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(outputPath);

  console.log(`Successfully generated clean aligned sheet: ${outputPath}`);
}

async function run() {
  const dirImg = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_dir_v2_1790123553544.jpg';
  const reactImg = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_reactions_1790123059608.jpg';

  const outDir = path.join(__dirname, 'public', 'mascots');

  console.log('Processing Directions...');
  await processPerfectGrid(dirImg, path.join(outDir, 'cheobingo-directions.webp'), false);

  console.log('Processing Reactions...');
  await processPerfectGrid(reactImg, path.join(outDir, 'cheobingo-reactions.webp'), true);

  console.log('DONE!');
}

run().catch(console.error);
