const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processCleanSpriteSheet(inputJpgPath, outputWebpPath, isReaction = false) {
  const image = sharp(inputJpgPath);
  const rawBuffer = await image
    .resize(1080, 1080, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data } = rawBuffer;
  const W = 1080;
  const H = 1080;
  const cellSize = 360;

  // True gaps measured from image projections
  const rowRanges = [
    [0, 370],
    [371, 708],
    [709, 1080]
  ];

  const colRanges = [
    [0, 360],
    [361, 720],
    [721, 1080]
  ];

  const outRgba = Buffer.alloc(W * H * 4);

  // Standard target height and bottom anchor
  const targetH = 280;
  const bottomMargin = 20; // 20px of guaranteed clean transparent padding at bottom

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const [yMin, yMax] = rowRanges[r];
      const [xMin, xMax] = colRanges[c];

      const regionW = xMax - xMin;
      const regionH = yMax - yMin;

      // Extract this region's raw data
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
        return regionData[idx] > 225 && regionData[idx + 1] > 225 && regionData[idx + 2] > 225;
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

      // Find tight foreground bounds
      let minX = regionW, maxX = 0, minY = regionH, maxY = 0;
      for (let y = 0; y < regionH; y++) {
        for (let x = 0; x < regionW; x++) {
          const idx = y * regionW + x;
          if (isBg[idx] === 0) {
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

      // Extract foreground to buffer with defringing
      const charRgba = Buffer.alloc(charW * charH * 4);
      for (let y = 0; y < charH; y++) {
        for (let x = 0; x < charW; x++) {
          const rx = minX + x;
          const ry = minY + y;
          const rIdx = ry * regionW + rx;
          const dstIdx = (y * charW + x) * 4;

          if (isBg[rIdx] === 1) {
            charRgba[dstIdx + 3] = 0;
          } else {
            let touchesBg = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = rx + dx;
                const ny = ry + dy;
                if (nx < 0 || nx >= regionW || ny < 0 || ny >= regionH || isBg[ny * regionW + nx] === 1) {
                  touchesBg = true;
                  break;
                }
              }
              if (touchesBg) break;
            }

            const srcIdx = (ry * regionW + rx) * 3;
            const red = regionData[srcIdx];
            const green = regionData[srcIdx + 1];
            const blue = regionData[srcIdx + 2];

            if (touchesBg && (red + green + blue) / 3 > 218) {
              charRgba[dstIdx + 3] = 0;
            } else {
              charRgba[dstIdx] = red;
              charRgba[dstIdx + 1] = green;
              charRgba[dstIdx + 2] = blue;
              charRgba[dstIdx + 3] = 255;
            }
          }
        }
      }

      // Scale character uniformly so height = targetH (280px)
      // and max width fits inside 320px
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

      console.log(`Cell [${r},${c}]: orig ${charW}x${charH} -> scaled ${scaledW}x${scaledH}, placed at cell pos (${pasteX}, ${pasteY})`);

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
  const dirJpg = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_dir_v2_1790123553544.jpg';
  const reactJpg = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_reactions_1790123059608.jpg';

  const outDir = path.join(__dirname, 'public', 'mascots');

  console.log('--- Processing Directions ---');
  await processCleanSpriteSheet(dirJpg, path.join(outDir, 'cheobingo-directions.webp'), false);

  console.log('--- Processing Reactions ---');
  await processCleanSpriteSheet(reactJpg, path.join(outDir, 'cheobingo-reactions.webp'), true);

  console.log('ALL DONE CLEANLY!');
}

main().catch(console.error);
