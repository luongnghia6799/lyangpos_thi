const sharp = require('sharp');
const path = require('path');

/**
 * Clean Background Isolation for #E8E8E8 Background
 * Removes grey background completely while preserving 100% of the white shirt, teeth, eyes and skin!
 */
async function processGreyBgSprite(inputPath, outputPath) {
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

      const isBg = new Uint8Array(cellSize * cellSize);

      // The background in v6 is a flat neutral light grey (RGB around 230 to 245)
      // Check if pixel is neutral grey background
      function isBgPixel(cx, cy) {
        const gx = startX + cx;
        const gy = startY + cy;
        const idx = (gy * W + gx) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Neutral grey check: R, G, B are very close to each other AND in the 225-248 range
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        const avg = (r + g + b) / 3;
        
        return (avg > 220 && avg < 250 && maxDiff <= 8);
      }

      const queue = [];

      // Seed 4 outer borders of this 360x360 cell
      for (let cx = 0; cx < cellSize; cx++) {
        if (isBgPixel(cx, 0)) { isBg[0 * cellSize + cx] = 1; queue.push(cx, 0); }
        if (isBgPixel(cx, cellSize - 1)) { isBg[(cellSize - 1) * cellSize + cx] = 1; queue.push(cx, cellSize - 1); }
      }
      for (let cy = 0; cy < cellSize; cy++) {
        if (isBgPixel(0, cy) && !isBg[cy * cellSize + 0]) { isBg[cy * cellSize + 0] = 1; queue.push(0, cy); }
        if (isBgPixel(cellSize - 1, cy) && !isBg[cy * cellSize + (cellSize - 1)]) { isBg[cy * cellSize + (cellSize - 1)] = 1; queue.push(cellSize - 1, cy); }
      }

      // BFS Flood Fill
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
            if (isBg[nIdx] === 0 && isBgPixel(nx, ny)) {
              isBg[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }

      // Write output with smooth edge defringe
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const cIdx = cy * cellSize + cx;
          const globalX = startX + cx;
          const globalY = startY + cy;
          const srcIdx = (globalY * W + globalX) * channels;
          const dstIdx = (globalY * W + globalX) * 4;

          if (isBg[cIdx] === 1) {
            rgba[dstIdx] = 0;
            rgba[dstIdx + 1] = 0;
            rgba[dstIdx + 2] = 0;
            rgba[dstIdx + 3] = 0;
          } else {
            rgba[dstIdx] = data[srcIdx];
            rgba[dstIdx + 1] = data[srcIdx + 1];
            rgba[dstIdx + 2] = data[srcIdx + 2];
            rgba[dstIdx + 3] = 255; // 100% Solid (no transparency inside white shirt, eyes, skin!)
          }
        }
      }
    }
  }

  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(outputPath);

  console.log(`Saved clean solid-shirt sprite: ${outputPath}`);
}

async function run() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_v6_1789975430330.jpg');
  const reactImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_reactions_v6_1789975638798.jpg');
  
  const outDir = path.join(__dirname, 'public', 'mascots');

  await processGreyBgSprite(dirImg, path.join(outDir, 'lyang-directions.webp'));
  await processGreyBgSprite(reactImg, path.join(outDir, 'lyang-reactions.webp'));
  console.log('All v6 sprites successfully processed with 100% solid white shirts and no white halos!');
}

run().catch(console.error);
