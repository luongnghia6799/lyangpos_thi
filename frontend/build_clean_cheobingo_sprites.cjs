const sharp = require('e:/vibe/LyangPOS/LyangPOS_final/frontend/node_modules/sharp');
const path = require('path');
const fs = require('fs');

async function processCleanSpriteSheet(inputJpgPath, outputWebpPath, isDirection = false) {
  const image = sharp(inputJpgPath);
  const rawBuffer = await image
    .resize(1080, 1080, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data } = rawBuffer;
  const W = 1080;
  const H = 1080;
  const cellSize = 360;

  const rowSplits = [0, 362, 721, 1080];
  const colSplits = [0, 345, 715, 1080];

  const outRgba = Buffer.alloc(W * H * 4);

  const targetH = 280;
  const bottomMargin = 20;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      // Directions: swap col 0 and col 2
      const srcCol = isDirection ? (c === 0 ? 2 : c === 2 ? 0 : 1) : c;
      const srcRow = r;

      const yMin = rowSplits[srcRow];
      const yMax = rowSplits[srcRow + 1];
      const xMin = colSplits[srcCol];
      const xMax = colSplits[srcCol + 1];

      const regionW = xMax - xMin;
      const regionH = yMax - yMin;

      const regionData = Buffer.alloc(regionW * regionH * 3);
      for (let y = 0; y < regionH; y++) {
        for (let x = 0; x < regionW; x++) {
          const srcIdx = ((yMin + y) * W + (xMin + x)) * 3;
          const dstIdx = (y * regionW + x) * 3;
          regionData[dstIdx] = data[srcIdx];
          regionData[dstIdx + 1] = data[srcIdx + 1];
          regionData[dstIdx + 2] = data[srcIdx + 2];
        }
      }

      // Flood fill background from 4 outer edges of this slice
      const isBg = new Uint8Array(regionW * regionH);
      function isWhite(x, y) {
        const idx = (y * regionW + x) * 3;
        const bri = (regionData[idx] + regionData[idx + 1] + regionData[idx + 2]) / 3;
        return bri > 140;
      }

      const queue = [];
      for (let x = 0; x < regionW; x++) {
        if (isWhite(x, 0)) { isBg[0 * regionW + x] = 1; queue.push(x, 0); }
        if (isWhite(x, regionH - 1)) { isBg[(regionH - 1) * regionW + x] = 1; queue.push(x, regionH - 1); }
      }
      for (let y = 0; y < regionH; y++) {
        if (isWhite(0, y) && !isBg[y * regionW + 0]) { isBg[y * regionW + 0] = 1; queue.push(0, y); }
        if (isWhite(regionW - 1, y) && !isBg[y * regionW + (regionW - 1)]) { isBg[y * regionW + (regionW - 1)] = 1; queue.push(regionW - 1, y); }
      }

      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];

        const nbrs = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (let i = 0; i < 4; i++) {
          const nx = nbrs[i][0];
          const ny = nbrs[i][1];
          if (nx >= 0 && nx < regionW && ny >= 0 && ny < regionH) {
            const nIdx = ny * regionW + nx;
            if (isBg[nIdx] === 0 && isWhite(nx, ny)) {
              isBg[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      // Build tight foreground
      // For any pixel touching isBg:
      // If brightness > 120, treat as background (completely eliminating white halo)
      // If brightness between 40 and 120, smoothly blend alpha and darken RGB so there is no white fringe
      const charRgbaRaw = Buffer.alloc(regionW * regionH * 4);
      let minX = regionW, maxX = 0, minY = regionH, maxY = 0;

      for (let y = 0; y < regionH; y++) {
        for (let x = 0; x < regionW; x++) {
          const rIdx = y * regionW + x;
          const dstIdx = (y * regionW + x) * 4;

          if (isBg[rIdx] === 1) {
            charRgbaRaw[dstIdx + 3] = 0;
            continue;
          }

          let touchesBg = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= regionW || ny < 0 || ny >= regionH || isBg[ny * regionW + nx] === 1) {
                touchesBg = true;
                break;
              }
            }
            if (touchesBg) break;
          }

          const srcIdx = (y * regionW + x) * 3;
          const red = regionData[srcIdx];
          const green = regionData[srcIdx + 1];
          const blue = regionData[srcIdx + 2];
          const bri = (red + green + blue) / 3;

          if (touchesBg) {
            if (bri > 120) {
              // Too bright on the outer edge -> part of the white halo!
              charRgbaRaw[dstIdx + 3] = 0;
              continue;
            } else if (bri > 45) {
              // Anti-aliased outer stroke: make soft edge with dark ink
              const factor = (120 - bri) / 75; // 0..1
              const alpha = Math.round(factor * 255);
              // Darken color towards stroke color (dark ink)
              charRgbaRaw[dstIdx] = Math.round(red * factor);
              charRgbaRaw[dstIdx + 1] = Math.round(green * factor);
              charRgbaRaw[dstIdx + 2] = Math.round(blue * factor);
              charRgbaRaw[dstIdx + 3] = alpha;
            } else {
              charRgbaRaw[dstIdx] = red;
              charRgbaRaw[dstIdx + 1] = green;
              charRgbaRaw[dstIdx + 2] = blue;
              charRgbaRaw[dstIdx + 3] = 255;
            }
          } else {
            // Inside the mascot
            charRgbaRaw[dstIdx] = red;
            charRgbaRaw[dstIdx + 1] = green;
            charRgbaRaw[dstIdx + 2] = blue;
            charRgbaRaw[dstIdx + 3] = 255;
          }

          if (charRgbaRaw[dstIdx + 3] > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX > maxX || minY > maxY) {
        console.warn(`Cell [${r},${c}] has no foreground!`);
        continue;
      }

      const charW = maxX - minX + 1;
      const charH = maxY - minY + 1;

      // Extract tight box
      const charRgba = Buffer.alloc(charW * charH * 4);
      for (let y = 0; y < charH; y++) {
        for (let x = 0; x < charW; x++) {
          const srcIdx = ((minY + y) * regionW + (minX + x)) * 4;
          const dstIdx = (y * charW + x) * 4;
          charRgba[dstIdx] = charRgbaRaw[srcIdx];
          charRgba[dstIdx + 1] = charRgbaRaw[srcIdx + 1];
          charRgba[dstIdx + 2] = charRgbaRaw[srcIdx + 2];
          charRgba[dstIdx + 3] = charRgbaRaw[srcIdx + 3];
        }
      }

      // Scale character uniformly so height = targetH (280px)
      const scale = Math.min(targetH / charH, 320 / charW);
      const scaledW = Math.round(charW * scale);
      const scaledH = Math.round(charH * scale);

      const resized = await sharp(charRgba, {
        raw: { width: charW, height: charH, channels: 4 }
      })
      .resize(scaledW, scaledH, { fit: 'contain' })
      .raw()
      .toBuffer({ resolveWithObject: true });

      // Anchor character:
      // X: centered in the 360px cell
      // Y: bottom of character sits exactly at (cellSize - bottomMargin) = 340px
      const pasteX = Math.round((cellSize - scaledW) / 2);
      const pasteY = cellSize - bottomMargin - scaledH;

      const cellStartX = c * cellSize;
      const cellStartY = r * cellSize;

      console.log(`Cell [${r},${c}] (from src [${srcRow},${srcCol}]): ${scaledW}x${scaledH}, placed at (${pasteX}, ${pasteY})`);

      for (let y = 0; y < scaledH; y++) {
        for (let x = 0; x < scaledW; x++) {
          const srcIdx = (y * scaledW + x) * 4;
          const a = resized.data[srcIdx + 3];
          if (a > 0) {
            const gx = cellStartX + pasteX + x;
            const gy = cellStartY + pasteY + y;
            if (gx >= cellStartX && gx < cellStartX + cellSize && gy >= cellStartY && gy < cellStartY + cellSize) {
              const dstIdx = (gy * W + gx) * 4;
              outRgba[dstIdx] = resized.data[srcIdx];
              outRgba[dstIdx + 1] = resized.data[srcIdx + 1];
              outRgba[dstIdx + 2] = resized.data[srcIdx + 2];
              outRgba[dstIdx + 3] = a;
            }
          }
        }
      }
    }
  }

  await sharp(outRgba, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(outputWebpPath);

  console.log(`Successfully written: ${outputWebpPath}`);
}

async function main() {
  const dirJpg = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_dir_v3_1790123813034.jpg';
  const reactJpg = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_react_v3_1790123841258.jpg';

  const outDir = 'e:\\vibe\\LyangPOS\\LyangPOS_final\\frontend\\public\\mascots';
  const distDir = 'e:\\vibe\\LyangPOS\\LyangPOS_final\\frontend\\dist\\mascots';

  console.log('--- Generating Clean Directions (NO WHITE BORDER) ---');
  await processCleanSpriteSheet(dirJpg, path.join(outDir, 'cheobingo-directions.webp'), true);
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(path.join(outDir, 'cheobingo-directions.webp'), path.join(distDir, 'cheobingo-directions.webp'));
  }

  console.log('--- Generating Clean Reactions (NO WHITE BORDER) ---');
  await processCleanSpriteSheet(reactJpg, path.join(outDir, 'cheobingo-reactions.webp'), false);
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(path.join(outDir, 'cheobingo-reactions.webp'), path.join(distDir, 'cheobingo-reactions.webp'));
  }

  console.log('ALL DONE CLEANLY!');
}

main().catch(console.error);
