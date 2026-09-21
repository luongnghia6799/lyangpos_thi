const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Tat cache de khong bi lock file tren Windows
sharp.cache(false);

async function optimizeMascots() {
  const mascotDir = path.join(__dirname, '..', 'public', 'mascots');
  if (!fs.existsSync(mascotDir)) {
    console.log('Khong tim thay thu muc mascots:', mascotDir);
    return;
  }

  const files = fs.readdirSync(mascotDir).filter(f => f.endsWith('.webp'));
  console.log(`\n=== 1. TOI UU ${files.length} FILE MASCOT WEBP ===`);

  let totalOld = 0;
  let totalNew = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(mascotDir, file);
    const inputBuf = fs.readFileSync(filePath);
    const oldSize = inputBuf.length;
    totalOld += oldSize;

    try {
      const buffer = await sharp(inputBuf)
        .resize(600, 600, { fit: 'fill' })
        .webp({ quality: 80, effort: 5 })
        .toBuffer();

      fs.writeFileSync(filePath, buffer);
      totalNew += buffer.length;
    } catch (err) {
      console.error(`Loi khi toi uu ${file}:`, err.message);
      totalNew += oldSize;
    }
  }

  const savedMB = ((totalOld - totalNew) / (1024 * 1024)).toFixed(2);
  const oldMB = (totalOld / (1024 * 1024)).toFixed(2);
  const newMB = (totalNew / (1024 * 1024)).toFixed(2);
  const pct = Math.round((1 - totalNew / totalOld) * 100);
  console.log(`[*] Mascots: ${oldMB} MB -> ${newMB} MB (Giam ${savedMB} MB, tiet kiem ${pct}%)`);
}

async function optimizeWallpapers() {
  const wallpaperDir = path.join(__dirname, '..', 'src', 'assets', 'wallpapers');
  if (!fs.existsSync(wallpaperDir)) return;

  const files = fs.readdirSync(wallpaperDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));
  console.log(`\n=== 2. TOI UU ${files.length} FILE WALLPAPERS ===`);

  let totalOld = 0;
  let totalNew = 0;

  for (const file of files) {
    const filePath = path.join(wallpaperDir, file);
    const inputBuf = fs.readFileSync(filePath);
    const oldSize = inputBuf.length;
    totalOld += oldSize;

    try {
      const meta = await sharp(inputBuf).metadata();
      let pipeline = sharp(inputBuf);
      if (meta.width > 1920) {
        pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
      }

      let buffer;
      if (file.endsWith('.png')) {
        buffer = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
      } else {
        buffer = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      }

      if (buffer.length < oldSize) {
        fs.writeFileSync(filePath, buffer);
        totalNew += buffer.length;
      } else {
        totalNew += oldSize;
      }
    } catch (err) {
      console.error(`Loi toi uu wallpaper ${file}:`, err.message);
      totalNew += oldSize;
    }
  }

  const savedMB = ((totalOld - totalNew) / (1024 * 1024)).toFixed(2);
  const oldMB = (totalOld / (1024 * 1024)).toFixed(2);
  const newMB = (totalNew / (1024 * 1024)).toFixed(2);
  console.log(`[*] Wallpapers: ${oldMB} MB -> ${newMB} MB (Giam ${savedMB} MB)`);
}

async function optimizeHeavyImages() {
  console.log(`\n=== 3. TOI UU CAC ANH NEN NANG KHAC ===`);
  const targets = [
    path.join(__dirname, '..', 'public', 'assets', 'images', 'rice_field_bg.png'),
    path.join(__dirname, '..', 'public', 'assets', 'images', 'plant_doctor.png'),
    path.join(__dirname, '..', 'public', 'pos_table_abstract_bg.png'),
    path.join(__dirname, '..', 'public', 'assets', 'images', 'minimal_agri_bg.png'),
    path.join(__dirname, '..', 'public', 'assets', 'images', 'cute_farmer_boy.png'),
    path.join(__dirname, '..', 'public', 'doraemon.png'),
    path.join(__dirname, '..', 'public', 'assets', 'images', 'user_mascot.png'),
    path.join(__dirname, '..', 'src', 'assets', 'wallpaper_default.jpg')
  ];

  let totalOld = 0;
  let totalNew = 0;

  for (const filePath of targets) {
    if (!fs.existsSync(filePath)) continue;
    const inputBuf = fs.readFileSync(filePath);
    const oldSize = inputBuf.length;
    totalOld += oldSize;

    try {
      const meta = await sharp(inputBuf).metadata();
      let pipeline = sharp(inputBuf);
      if (meta.width > 1920) {
        pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
      }

      let buffer;
      if (filePath.endsWith('.png')) {
        buffer = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
      } else {
        buffer = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      }

      if (buffer.length < oldSize) {
        fs.writeFileSync(filePath, buffer);
        totalNew += buffer.length;
      } else {
        totalNew += oldSize;
      }
    } catch (err) {
      console.error(`Loi toi uu ${path.basename(filePath)}:`, err.message);
      totalNew += oldSize;
    }
  }

  const savedMB = ((totalOld - totalNew) / (1024 * 1024)).toFixed(2);
  const oldMB = (totalOld / (1024 * 1024)).toFixed(2);
  const newMB = (totalNew / (1024 * 1024)).toFixed(2);
  console.log(`[*] Anh nen khac: ${oldMB} MB -> ${newMB} MB (Giam ${savedMB} MB)`);
}

async function main() {
  console.log('>>> BAT DAU TOI UU DUNG LUONG TAI NGUYEN CHO LYANGPOS <<<');
  const t0 = Date.now();
  await optimizeMascots();
  await optimizeWallpapers();
  await optimizeHeavyImages();
  console.log(`\n Hoan tat sau ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
}

main().catch(console.error);
