const sharp = require('sharp');
const path = require('path');

async function testMainComponent() {
  const imgPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_dir_v2_1790123553544.jpg';
  const raw = await sharp(imgPath).resize(1080, 1080, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const { data } = raw;
  const W = 1080, H = 1080, cellSize = 360;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const startX = c * cellSize;
      const startY = r * cellSize;

      const isFg = new Uint8Array(cellSize * cellSize);

      // Identify foreground pixels (non-white)
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const gx = startX + cx;
          const gy = startY + cy;
          const idx = (gy * W + gx) * 3;
          const isWhite = data[idx] > 220 && data[idx+1] > 220 && data[idx+2] > 220;
          if (!isWhite) {
            isFg[cy * cellSize + cx] = 1;
          }
        }
      }

      // Find largest connected component of foreground
      const visited = new Uint8Array(cellSize * cellSize);
      let bestComponent = [];

      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const idx = cy * cellSize + cx;
          if (isFg[idx] === 1 && visited[idx] === 0) {
            // BFS component
            const comp = [];
            const queue = [cx, cy];
            visited[idx] = 1;
            let head = 0;
            while (head < queue.length) {
              const x = queue[head++];
              const y = queue[head++];
              comp.push([x, y]);

              const nbrs = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
              for (let i = 0; i < 4; i++) {
                const nx = nbrs[i][0];
                const ny = nbrs[i][1];
                if (nx >= 0 && nx < cellSize && ny >= 0 && ny < cellSize) {
                  const nIdx = ny * cellSize + nx;
                  if (isFg[nIdx] === 1 && visited[nIdx] === 0) {
                    visited[nIdx] = 1;
                    queue.push(nx, ny);
                  }
                }
              }
            }

            if (comp.length > bestComponent.length) {
              bestComponent = comp;
            }
          }
        }
      }

      let minY = cellSize, maxY = 0;
      for (let i = 0; i < bestComponent.length; i++) {
        const y = bestComponent[i][1];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      console.log(`Cell [${r},${c}]: main component pixels = ${bestComponent.length}, Y range = [${minY}, ${maxY}]`);
    }
  }
}
testMainComponent();
