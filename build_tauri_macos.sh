#!/usr/bin/env bash
set -e

echo "====================================================================="
echo "   * LYANGPOS - TIEN TRINH DONG GOI MACOS (RUST BACKEND + TAURI) *"
echo "====================================================================="
echo ""

# 1. Kiem tra thu muc goc
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 2. Kiem tra Cargo (Rust)
if ! command -v cargo &> /dev/null; then
    echo "[LOI] Khong tim thay Rust/Cargo! Vui long cai dat Rust truoc."
    exit 1
fi

# 3. Kiem tra Node.js / npm
if ! command -v npm &> /dev/null; then
    echo "[LOI] Khong tim thay Node.js / npm!"
    exit 1
fi

echo "[*] Buoc 1: Cai dat Rust targets cho ca Apple Silicon va Intel..."
rustup target add aarch64-apple-darwin x86_64-apple-darwin

echo ""
echo "[*] Buoc 2: Bien dich Backend Rust che do Release cho ca 2 kien truc..."
cd "$ROOT_DIR/backend-rust"
cargo build --release --target aarch64-apple-darwin --bin backend-rust
cargo build --release --target x86_64-apple-darwin --bin backend-rust

echo ""
echo "[*] Buoc 3: Tao Sidecar Universal va copy vao src-tauri/bin..."
mkdir -p "$ROOT_DIR/frontend/src-tauri/bin"

cp "$ROOT_DIR/backend-rust/target/aarch64-apple-darwin/release/backend-rust" "$ROOT_DIR/frontend/src-tauri/bin/lyang-backend-aarch64-apple-darwin"
cp "$ROOT_DIR/backend-rust/target/x86_64-apple-darwin/release/backend-rust" "$ROOT_DIR/frontend/src-tauri/bin/lyang-backend-x86_64-apple-darwin"

lipo -create -output "$ROOT_DIR/frontend/src-tauri/bin/lyang-backend-universal-apple-darwin" \
  "$ROOT_DIR/backend-rust/target/aarch64-apple-darwin/release/backend-rust" \
  "$ROOT_DIR/backend-rust/target/x86_64-apple-darwin/release/backend-rust"

chmod +x "$ROOT_DIR/frontend/src-tauri/bin/lyang-backend-"*

echo ""
echo "[*] Buoc 4: Cai dat thu vien va build bundle Universal DMG..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi

npx tauri build --target universal-apple-darwin

echo ""
echo "====================================================================="
echo "   * DONG GOI MACOS UNIVERSAL THANH CONG! *"
echo "====================================================================="
echo "[*] File DMG duoc tao tai:"
echo "    frontend/src-tauri/target/universal-apple-darwin/release/bundle/dmg/"
echo ""
