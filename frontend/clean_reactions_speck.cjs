const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function cleanSpecks() {
  const file = path.join(__dirname, 'public', 'mascots', 'cheobingo-reactions.webp');
  const buffer = fs.readFileSync(file);
  
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  const W = info.width;
  let cleaned = 0;
  
  for (let y = 720; y < 1080; y++) {
    for (let x = 360; x < 420; x++) {
      const idx = (y * W + x) * 4;
      if (data[idx + 3] > 0) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        cleaned++;
      }
    }
  }
  
  console.log(`Cleaned ${cleaned} stray pixels in cell [2,1]`);
  
  const outWebp = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 95, alphaQuality: 100 })
    .toBuffer();
    
  fs.writeFileSync(file, outWebp);
  console.log('Reactions webp successfully cleaned and updated directly via buffer!');
}

cleanSpecks().catch(console.error);
