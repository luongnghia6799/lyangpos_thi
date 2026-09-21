const sharp = require('sharp');
const path = require('path');

async function checkEyePixels() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_sheet_1789973225311.jpg');
  const image = sharp(dirImg);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  
  // Center face is in cell (col 1, row 1)
  // X: 341 to 682, Y: 341 to 682
  // Eyes are around X: 450 to 580, Y: 480 to 550
  for (let y = 480; y <= 550; y += 10) {
    for (let x = 440; x <= 580; x += 10) {
      const idx = (y * info.width + x) * info.channels;
      console.log(`(${x},${y}) -> R:${data[idx]} G:${data[idx+1]} B:${data[idx+2]}`);
    }
  }
}

checkEyePixels().catch(console.error);
