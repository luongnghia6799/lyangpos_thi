const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeTransparentChibi() {
  const inputPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_2d_chibi_1790122900049.jpg';
  const outDir = path.join(__dirname, 'public', 'assets', 'images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outputPath = path.join(outDir, 'cheobingo.png');

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const W = metadata.width;
  const H = metadata.height;

  const rawBuffer = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = rawBuffer;
  const channels = info.channels;

  const isBg = new Uint8Array(W * H);

  function isWhite(x, y) {
    const idx = (y * W + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r > 238 && g > 238 && b > 238;
  }

  const queue = [];

  // Seed all 4 outer borders of image
  for (let x = 0; x < W; x++) {
    if (isWhite(x, 0)) { isBg[0 * W + x] = 1; queue.push(x, 0); }
    if (isWhite(x, H - 1)) { isBg[(H - 1) * W + x] = 1; queue.push(x, H - 1); }
  }
  for (let y = 0; y < H; y++) {
    if (isWhite(0, y) && !isBg[y * W + 0]) { isBg[y * W + 0] = 1; queue.push(0, y); }
    if (isWhite(W - 1, y) && !isBg[y * W + (W - 1)]) { isBg[y * W + (W - 1)] = 1; queue.push(W - 1, y); }
  }

  // BFS Flood Fill from outer edges
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
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        const nIdx = ny * W + nx;
        if (isBg[nIdx] === 0 && isWhite(nx, ny)) {
          isBg[nIdx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  const rgba = Buffer.alloc(W * H * 4);

  let minX = W, maxX = 0, minY = H, maxY = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      const dstIdx = idx * 4;
      const srcIdx = idx * channels;

      if (isBg[idx] === 1) {
        rgba[dstIdx] = 0;
        rgba[dstIdx + 1] = 0;
        rgba[dstIdx + 2] = 0;
        rgba[dstIdx + 3] = 0;
      } else {
        // Track bounding box of character
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Check if edge touches background for anti-aliasing / defringing
        let touchesBg = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && isBg[ny * W + nx] === 1) {
              touchesBg = true;
              break;
            }
          }
          if (touchesBg) break;
        }

        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];

        if (touchesBg && (r + g + b) / 3 > 220) {
          // Soften white halo
          rgba[dstIdx] = r;
          rgba[dstIdx + 1] = g;
          rgba[dstIdx + 2] = b;
          rgba[dstIdx + 3] = 0;
        } else {
          rgba[dstIdx] = r;
          rgba[dstIdx + 1] = g;
          rgba[dstIdx + 2] = b;
          rgba[dstIdx + 3] = 255;
        }
      }
    }
  }

  // Crop to character with small padding
  const pad = 20;
  const cropLeft = Math.max(0, minX - pad);
  const cropTop = Math.max(0, minY - pad);
  const cropW = Math.min(W - cropLeft, (maxX - minX) + pad * 2);
  const cropH = Math.min(H - cropTop, (maxY - minY) + pad * 2);

  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .png({ quality: 100 })
    .toFile(outputPath);

  console.log(`Saved transparent mascot: ${outputPath} (${cropW}x${cropH})`);
}

makeTransparentChibi().catch(console.error);
