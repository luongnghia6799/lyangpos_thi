const sharp = require('sharp');
const path = require('path');

async function testExactSlices() {
  const imgPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\ae324bbc-f55c-4500-8cbb-40a07a034b54\\cheobingo_dir_v2_1790123553544.jpg';
  const raw = await sharp(imgPath).resize(1080, 1080, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const { data } = raw;
  const W = 1080;

  const rowRanges = [
    [0, 370],
    [371, 710],
    [711, 1080]
  ];

  const colRanges = [
    [0, 360],
    [361, 720],
    [721, 1080]
  ];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const [yMin, yMax] = rowRanges[r];
      const [xMin, xMax] = colRanges[c];

      let minX = 9999, maxX = -1, minY = 9999, maxY = -1;
      for (let y = yMin; y < yMax; y++) {
        for (let x = xMin; x < xMax; x++) {
          const idx = (y * W + x) * 3;
          if (data[idx] < 225 || data[idx+1] < 225 || data[idx+2] < 225) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      console.log(`Cell [${r},${c}]: X=[${minX}, ${maxX}] (w=${maxX-minX+1}), Y=[${minY}, ${maxY}] (h=${maxY-minY+1})`);
    }
  }
}
testExactSlices();
