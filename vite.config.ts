import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';


const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'HR ToolKit',
    short_name: 'HR ToolKit',
    description: 'Tools for HR professionals and recruiters',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  workbox: {
    // Cache the PDF worker and other necessary files
    globPatterns: ['**/*.{js,css,html,ico,png,svg,pdf}'],
    // Register route for PDF processing worker
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/unpkg\.com\/pdfjs-dist/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'pdfjs-dist-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      }
    ]
  }
};

export default defineConfig({
  plugins: [react(), tsconfigPaths(), VitePWA(pwaOptions)],
  css: {
    postcss: './postcss.config.js',
  },
  worker: {
    format: 'es',
    plugins: []
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdfjs-dist']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['pdfjs-dist/build/pdf.worker.js']
  },
  resolve: {
    alias: {
      // Add any aliases if needed
    }
  }
});
