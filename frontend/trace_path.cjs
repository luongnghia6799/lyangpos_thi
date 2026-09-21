const sharp = require('sharp');
const path = require('path');

async function tracePath() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_v2_1789973942085.jpg');
  const image = sharp(dirImg);
  const { data, info } = await image.resize(1080, 1080, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  
  // Check center cell (startX=360, startY=360)
  // Let's sample a straight line from (360, 520) to (540, 520) - from left border towards nose/eye
  const y = 520;
  for (let x = 360; x <= 540; x += 10) {
    const idx = (y * 1080 + x) * info.channels;
    console.log(`x=${x}, y=${y} -> R:${data[idx]} G:${data[idx+1]} B:${data[idx+2]}`);
  }
}

tracePath().catch(console.error);
