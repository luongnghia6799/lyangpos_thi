const sharp = require('sharp');
const path = require('path');

async function findTransparentInEyes() {
  const image = sharp('public/mascots/lyang-directions.webp');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  
  // Check center cell (cell index 4, col 1, row 1)
  // X: 341 to 682, Y: 341 to 682
  let transparentInsideFace = 0;
  for (let y = 400; y < 620; y++) {
    for (let x = 400; x < 620; x++) {
      const idx = (y * info.width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 200) {
        transparentInsideFace++;
      }
    }
  }
  console.log('Transparent pixels inside face bounding box:', transparentInsideFace);
}

findTransparentInEyes().catch(console.error);
