const sharp = require('sharp');
const path = require('path');

async function testBounds() {
  const imgPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_dir_v2_1790123553544.jpg';
  const raw = await sharp(imgPath).resize(1080, 1080, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const W = 1080, H = 1080, cellSize = 360;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let minX = cellSize, maxX = 0, minY = cellSize, maxY = 0;
      for (let cy = 0; cy < cellSize; cy++) {
        for (let cx = 0; cx < cellSize; cx++) {
          const gx = c * cellSize + cx;
          const gy = r * cellSize + cy;
          const idx = (gy * W + gx) * 3;
          const isWhite = data[idx] > 230 && data[idx+1] > 230 && data[idx+2] > 230;
          if (!isWhite) {
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
          }
        }
      }
      console.log(`Cell [${r},${c}]: X=[${minX}, ${maxX}] (w=${maxX-minX}), Y=[${minY}, ${maxY}] (h=${maxY-minY})`);
    }
  }
}
testBounds();
