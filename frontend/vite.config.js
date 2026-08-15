import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5001,
    watch: {
      ignored: ['**/src-tauri/**']
    },
    proxy: {
      '/api': 'http://localhost:3579',
      '/fonts': 'http://localhost:3579',
      '/uploads': 'http://localhost:3579',
    },
    fs: {
      allow: [
        path.resolve(__dirname),
        // Dynamically compute and allow the alternate drive letter casing to prevent Windows 403 network issues
        (() => {
          const root = path.resolve(__dirname);
          const drive = root.charAt(0);
          const altDrive = drive === drive.toLowerCase() ? drive.toUpperCase() : drive.toLowerCase();
          return altDrive + root.slice(1);
        })()
      ]
    }
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/node_modules/lucide-react/')) return 'vendor-icons';
            if (id.includes('/node_modules/framer-motion/')) return 'vendor-framer';
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) return 'vendor-charts';
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-export';
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-3d';
            if (id.includes('firebase')) return 'vendor-firebase';
            return 'vendor';
          }
        },
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
  }
})
