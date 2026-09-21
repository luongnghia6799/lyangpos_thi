const sharp = require('sharp');
const path = require('path');

async function measureBoxes() {
  const dirImg = sharp('public/mascots/lyang-directions.webp');
  const reactImg = sharp('public/mascots/lyang-reactions.webp');

  const { data: dData, info: dInfo } = await dirImg.raw().toBuffer({ resolveWithObject: true });
  const { data: rData, info: rInfo } = await reactImg.raw().toBuffer({ resolveWithObject: true });

  function getCellBBox(data, info, row, col) {
    const cellSize = 360;
    const startX = col * cellSize;
    const startY = row * cellSize;

    let minX = cellSize, maxX = 0, minY = cellSize, maxY = 0;

    for (let cy = 0; cy < cellSize; cy++) {
      for (let cx = 0; cx < cellSize; cx++) {
        const globalX = startX + cx;
        const globalY = startY + cy;
        const alpha = data[(globalY * info.width + globalX) * 4 + 3];

        if (alpha > 50) {
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
        }
      }
    }

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }

  console.log('--- DIRECTIONS (Center Cell: row 1, col 1) ---');
  const dCenter = getCellBBox(dData, dInfo, 1, 1);
  console.log('Center Direction:', dCenter);

  console.log('--- REACTIONS (Blink Cell: row 0, col 0 & Star-eyes: row 1, col 1) ---');
  const rBlink = getCellBBox(rData, rInfo, 0, 0);
  const rCenter = getCellBBox(rData, rInfo, 1, 1);
  console.log('Reaction Blink (0,0):', rBlink);
  console.log('Reaction Star (1,1):', rCenter);
}

measureBoxes().catch(console.error);
