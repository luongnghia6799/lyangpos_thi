import fs from 'fs';
import path from 'path';

const nsisDir = path.join(process.cwd(), 'src-tauri', 'target', 'release', 'bundle', 'nsis');

try {
  if (fs.existsSync(nsisDir)) {
    const files = fs.readdirSync(nsisDir);
    const installerFile = files.find(f => f.startsWith('LyangPOS_') && f.endsWith('-setup.exe'));
    
    if (installerFile) {
      const oldPath = path.join(nsisDir, installerFile);
      const newPath = path.join(nsisDir, 'LyangPOS_byLyang.exe');
      fs.renameSync(oldPath, newPath);
      console.log(`\n[*] Da doi ten file cai dat: ${installerFile} -> LyangPOS_byLyang.exe`);
    }
  }
} catch (e) {
  console.error("Loi doi ten file cai dat:", e);
}
