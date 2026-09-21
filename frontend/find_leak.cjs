const sharp = require('sharp');
const path = require('path');

async function findLeak() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_v2_1789973942085.jpg');
  const image = sharp(dirImg);
  const { data, info } = await image.resize(1080, 1080, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });

  const W = 1080;
  const H = 1080;
  const channels = info.channels;
  const cellSize = 360;

  // Center cell: row=1, col=1
  const startX = 360;
  const startY = 360;

  const cellBg = new Uint8Array(cellSize * cellSize);
  const parent = new Int32Array(cellSize * cellSize);
  parent.fill(-1);

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
          parent[nIdx] = cy * cellSize + cx;
          queue.push(nx, ny);
        }
      }
    }
  }

  // Find a target inside the eye/cheek that was marked as bg
  // Eye center is roughly cx = 180, cy = 160
  // Let's find any cellBg === 1 inside (120 <= cx <= 240, 120 <= cy <= 200)
  for (let cy = 120; cy <= 200; cy++) {
    for (let cx = 120; cx <= 240; cx++) {
      const cIdx = cy * cellSize + cx;
      if (cellBg[cIdx] === 1) {
        console.log(`Found background inside face at local (${cx}, ${cy})`);
        // Backtrack path
        let curr = cIdx;
        const path = [];
        while (curr !== -1) {
          const px = curr % cellSize;
          const py = Math.floor(curr / cellSize);
          path.push([px, py]);
          curr = parent[curr];
        }
        console.log('Path from border into face (first 10 steps):', path.slice(0, 10));
        console.log('Path length:', path.length, 'ends at:', path[path.length - 1]);
        return;
      }
    }
  }
}

findLeak().catch(console.error);
