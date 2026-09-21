const sharp = require('sharp');
const path = require('path');

async function checkLyangRaw() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_sheet_1789973225311.jpg');
  const image = sharp(dirImg);
  const metadata = await image.metadata();
  console.log('Original JPG dimensions:', metadata.width, metadata.height);

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  console.log('Top left pixel:', data[0], data[1], data[2]);
  
  // Center frame eye in JPG: approx (512, 512)
  // Let's check some pixels around eye
  for (let dy = -10; dy <= 10; dy += 5) {
    for (let dx = -10; dx <= 10; dx += 5) {
      const x = Math.floor(info.width / 2) + dx;
      const y = Math.floor(info.height / 2) + dy;
      const idx = (y * info.width + x) * info.channels;
      console.log(`Pos (${x}, ${y}): RGB(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
    }
  }
}

checkLyangRaw().catch(console.error);
