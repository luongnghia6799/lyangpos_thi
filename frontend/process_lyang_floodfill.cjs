const sharp = require('sharp');
const path = require('path');

/**
 * Flood fill background removal:
 * Only removes connected white background from borders, leaving whites in eyes, shirts, etc. untouched.
 */
async function processSpriteSheetFloodFill(inputPath, outputPath, cropBottomRatio = 1.0) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const srcW = metadata.width;
  const srcH = Math.floor(metadata.height * cropBottomRatio);

  const rawBuffer = await image
    .extract({ left: 0, top: 0, width: srcW, height: srcH })
    .resize(1080, 1080, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = rawBuffer;
  const W = info.width;
  const H = info.height;
  const channels = info.channels;

  // Mask: 0 = not visited, 1 = background (transparent), 2 = foreground (solid)
  const isBg = new Uint8Array(W * H);

  // Helper to test if pixel is near-white background
  function isWhite(x, y) {
    const idx = (y * W + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r > 238 && g > 238 && b > 238;
  }

  // BFS Queue for Flood Fill from outer edges
  const queue = [];

  // Seed boundary pixels
  for (let x = 0; x < W; x++) {
    if (isWhite(x, 0)) { isBg[0 * W + x] = 1; queue.push(x, 0); }
    if (isWhite(x, H - 1)) { isBg[(H - 1) * W + x] = 1; queue.push(x, H - 1); }
  }
  for (let y = 0; y < H; y++) {
    if (isWhite(0, y) && !isBg[y * W + 0]) { isBg[y * W + 0] = 1; queue.push(0, y); }
    if (isWhite(W - 1, y) && !isBg[y * W + (W - 1)]) { isBg[y * W + (W - 1)] = 1; queue.push(W - 1, y); }
  }

  // Also seed grid dividers if they are white
  // Row dividers around y = 360, y = 720
  // Col dividers around x = 360, x = 720
  for (const divY of [Math.floor(H / 3), Math.floor(H * 2 / 3)]) {
    for (let x = 0; x < W; x++) {
      if (isWhite(x, divY) && !isBg[divY * W + x]) {
        isBg[divY * W + x] = 1;
        queue.push(x, divY);
      }
    }
  }
  for (const divX of [Math.floor(W / 3), Math.floor(W * 2 / 3)]) {
    for (let y = 0; y < H; y++) {
      if (isWhite(divX, y) && !isBg[y * W + divX]) {
        isBg[y * W + divX] = 1;
        queue.push(divX, y);
      }
    }
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

      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        const nIdx = ny * W + nx;
        if (isBg[nIdx] === 0 && isWhite(nx, ny)) {
          isBg[nIdx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  // Create RGBA output buffer
  const rgba = Buffer.alloc(W * H * 4);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const pIdx = y * W + x;
      const srcIdx = pIdx * channels;
      const dstIdx = pIdx * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;

      if (isBg[pIdx] === 1) {
        // True background pixel -> make 100% transparent
        rgba[dstIdx + 3] = 0;
      } else {
        // Character foreground pixel -> ALWAYS 100% OPAQUE (fixes eyes & shirt!)
        rgba[dstIdx + 3] = 255;
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

  console.log(`Successfully generated clean transparent sprite: ${outputPath}`);
}

async function run() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_sheet_1789973225311.jpg');
  const reactImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_reactions_sheet_1789973366891.jpg');
  
  const outDir = path.join(__dirname, 'public', 'mascots');

  // Crop 95.8% to cut out bottom text bar "DIRECTIONAL GAZE SPRITE SHEET (3x3 GRID)"
  await processSpriteSheetFloodFill(dirImg, path.join(outDir, 'lyang-directions.webp'), 0.958);
  await processSpriteSheetFloodFill(reactImg, path.join(outDir, 'lyang-reactions.webp'), 1.0);
}

run().catch(console.error);
