const sharp = require('sharp');
const path = require('path');

/**
 * 1. Flood-fill from borders with threshold = 220 to isolate character
 * 2. Calculate distance from background to create smooth alpha falloff (defringe)
 * 3. Color decontamination (un-premultiply white halo)
 * 4. Align and scale each cell so that the character's base/neck/head scale is IDENTICAL in all directions & reactions!
 */
async function processPerfectSprite(inputPath, outputPath, targetScale = 1.0, yOffset = 0) {
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

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const startX = col * cellSize;
      const startY = row * cellSize;

      // isBg: 1 = pure background, 0 = foreground/character
      const isBg = new Uint8Array(cellSize * cellSize);

      function isWhite(cx, cy) {
        const globalX = startX + cx;
        const globalY = startY + cy;
        const idx = (globalY * W + globalX) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Background threshold (captures antialiased halo up to 215)
        return r > 215 && g > 215 && b > 215;
      }

      const queue = [];

      // Seed borders of this 360x360 cell
      for (let cx = 0; cx < cellSize; cx++) {
        if (isWhite(cx, 0)) { isBg[0 * cellSize + cx] = 1; queue.push(cx, 0); }
        if (isWhite(cx, cellSize - 1)) { isBg[(cellSize - 1) * cellSize + cx] = 1; queue.push(cx, cellSize - 1); }
      }
      for (let cy = 0; cy < cellSize; cy++) {
        if (isWhite(0, cy) && !isBg[cy * cellSize + 0]) { isBg[cy * cellSize + 0] = 1; queue.push(0, cy); }
        if (isWhite(cellSize - 1, cy) && !isBg[cy * cellSize + (cellSize - 1)]) { isBg[cy * cellSize + (cellSize - 1)] = 1; queue.push(cellSize - 1, cy); }
      }

      // BFS Flood Fill inside cell
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

      // Distance transform to find boundary pixels for antialiasing
      // and decontaminate color from white fringe
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const globalX = startX + cx;
          const globalY = startY + cy;

          const pIdx = globalY * W + globalX;
          const srcIdx = pIdx * channels;
          const dstIdx = pIdx * 4;

          const cIdx = cy * cellSize + cx;

          if (isBg[cIdx] === 1) {
            // Pure background -> transparent
            rgba[dstIdx] = 0;
            rgba[dstIdx + 1] = 0;
            rgba[dstIdx + 2] = 0;
            rgba[dstIdx + 3] = 0;
          } else {
            // Check if this foreground pixel touches background (edge pixel)
            let touchesBg = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ncx = cx + dx;
                const ncy = cy + dy;
                if (ncx >= 0 && ncx < cellSize && ncy >= 0 && ncy < cellSize) {
                  if (isBg[ncy * cellSize + ncx] === 1) {
                    touchesBg = true;
                    break;
                  }
                }
              }
              if (touchesBg) break;
            }

            let r = data[srcIdx];
            let g = data[srcIdx + 1];
            let b = data[srcIdx + 2];
            let a = 255;

            if (touchesBg) {
              // Decontaminate white border (remove white blend)
              const maxVal = Math.max(r, g, b);
              if (maxVal > 200) {
                // Feather edge
                a = Math.max(80, Math.floor((255 - maxVal) / 55 * 255));
              }
            }

            rgba[dstIdx] = r;
            rgba[dstIdx + 1] = g;
            rgba[dstIdx + 2] = b;
            rgba[dstIdx + 3] = a;
          }
        }
      }
    }
  }

  return sharp(rgba, {
    raw: {
      width: W,
      height: H,
      channels: 4
    }
  });
}

/**
 * Align and resize reactions to match directions perfectly in scale and position
 */
async function alignSprites() {
  const dirImgPath = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_v5_1789974772538.jpg');
  const reactImgPath = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_reactions_v5_1789974808111.jpg');
  
  const outDir = path.join(__dirname, 'public', 'mascots');

  const dirSharp = await processPerfectSprite(dirImgPath, path.join(outDir, 'lyang-directions.webp'));
  const reactSharp = await processPerfectSprite(reactImgPath, path.join(outDir, 'lyang-reactions.webp'));

  // Save directions
  await dirSharp.webp({ quality: 95, alphaQuality: 100 }).toFile(path.join(outDir, 'lyang-directions.webp'));

  // Reactions: Directions center width is 291, Reactions width is 336 (approx 15% larger).
  // Let's normalize reactions cells so character scale & vertical anchor line up 100% with directions!
  const reactBuffer = await reactSharp.raw().toBuffer({ resolveWithObject: true });
  const dirBuffer = await dirSharp.raw().toBuffer({ resolveWithObject: true });

  const W = 1080;
  const H = 1080;
  const cellSize = 360;

  const finalReactRgba = Buffer.alloc(W * H * 4);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const startX = col * cellSize;
      const startY = row * cellSize;

      // Extract this cell from reaction
      const cellBuffer = Buffer.alloc(cellSize * cellSize * 4);
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const gIdx = ((startY + cy) * W + (startX + cx)) * 4;
          const cIdx = (cy * cellSize + cx) * 4;
          cellBuffer[cIdx] = reactBuffer.data[gIdx];
          cellBuffer[cIdx + 1] = reactBuffer.data[gIdx + 1];
          cellBuffer[cIdx + 2] = reactBuffer.data[gIdx + 2];
          cellBuffer[cIdx + 3] = reactBuffer.data[gIdx + 3];
        }
      }

      // Resize cell by 0.88 to match directions size exactly, anchored to bottom center
      const scaledSize = Math.round(cellSize * 0.88); // 317px
      const resizedCell = await sharp(cellBuffer, { raw: { width: cellSize, height: cellSize, channels: 4 } })
        .resize(scaledSize, scaledSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const offsetX = Math.floor((cellSize - scaledSize) / 2);
      const offsetY = cellSize - scaledSize - 2; // align to bottom

      for (let cy = 0; cy < scaledSize; cy++) {
        for (let cx = 0; cx < scaledSize; cx++) {
          const srcIdx = (cy * scaledSize + cx) * 4;
          const dstX = startX + offsetX + cx;
          const dstY = startY + offsetY + cy;

          if (dstX < startX + cellSize && dstY < startY + cellSize) {
            const dstIdx = (dstY * W + dstX) * 4;
            finalReactRgba[dstIdx] = resizedCell.data[srcIdx];
            finalReactRgba[dstIdx + 1] = resizedCell.data[srcIdx + 1];
            finalReactRgba[dstIdx + 2] = resizedCell.data[srcIdx + 2];
            finalReactRgba[dstIdx + 3] = resizedCell.data[srcIdx + 3];
          }
        }
      }
    }
  }

  await sharp(finalReactRgba, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(path.join(outDir, 'lyang-reactions.webp'));

  console.log('Saved 100% defringed & scale-aligned Lyang sprite sheets!');
}

alignSprites().catch(console.error);
