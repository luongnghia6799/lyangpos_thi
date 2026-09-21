const sharp = require('sharp');
const path = require('path');

async function checkSamplePixels() {
  const image = sharp('public/mascots/cap-directions.webp');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  console.log('Top left pixel (0,0):', data[0], data[1], data[2], data[3]);
  
  // Find eye pixel in cap-directions
  // Center frame is roughly 360 to 720 in x and y
  // Let's check center frame eye: around (540, 520)
  const idx = (520 * info.width + 540) * 4;
  console.log('Cap center eye area (540, 520):', data[idx], data[idx+1], data[idx+2], data[idx+3]);
}

checkSamplePixels().catch(console.error);
