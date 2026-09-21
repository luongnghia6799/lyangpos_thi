const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processSprite(inputPath, outputPath, isDirection = false) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Crop bottom banner if present (directions image has small text at bottom)
  let rawBuffer;
  if (isDirection) {
    rawBuffer = await image
      .extract({ left: 0, top: 0, width: metadata.width, height: Math.floor(metadata.height * 0.96) })
      .resize(1024, 1024, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });
  } else {
    rawBuffer = await image
      .resize(1024, 1024, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });
  }

  const { data, info } = rawBuffer;
  const numChannels = info.channels;
  const totalPixels = info.width * info.height;
  
  // Create RGBA buffer
  const rgbaBuffer = Buffer.alloc(totalPixels * 4);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * numChannels];
    const g = data[i * numChannels + 1];
    const b = data[i * numChannels + 2];

    rgbaBuffer[i * 4] = r;
    rgbaBuffer[i * 4 + 1] = g;
    rgbaBuffer[i * 4 + 2] = b;

    // Threshold for background transparency (pure white to near white)
    if (r > 245 && g > 245 && b > 245) {
      rgbaBuffer[i * 4 + 3] = 0; // transparent
    } else if (r > 235 && g > 235 && b > 235) {
      // Soft alpha edge
      const alpha = Math.floor((245 - Math.max(r, g, b)) / 10 * 255);
      rgbaBuffer[i * 4 + 3] = Math.max(0, Math.min(255, alpha));
    } else {
      rgbaBuffer[i * 4 + 3] = 255; // solid
    }
  }

  await sharp(rgbaBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(outputPath);

  console.log(`Saved ${outputPath}`);
}

async function main() {
  const dirImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_directions_sheet_1789973225311.jpg');
  const reactImg = path.join('C:', 'Users', 'Administrator', '.gemini', 'antigravity-ide', 'brain', 'd132bc4d-8a9e-4435-b817-3f78fb0b6317', 'lyang_reactions_sheet_1789973366891.jpg');
  
  const outDir = path.join(__dirname, 'public', 'mascots');
  
  await processSprite(dirImg, path.join(outDir, 'lyang-directions.webp'), true);
  await processSprite(reactImg, path.join(outDir, 'lyang-reactions.webp'), false);
  console.log('All Lyang mascot sprites converted successfully!');
}

main().catch(console.error);
