import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
import { resolve } from 'path';


const pwaOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'RR.Space',
    short_name: 'RR.Space',
    description: 'Tools for HR professionals and recruiters',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      {
        src: 'logo192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'logo512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'logo512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  workbox: {
    // Add workers directory to precache
    globPatterns: ['**/*.{js,css,html,ico,png,svg,pdf}', 'workers/*.js'],
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
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /\.pdf$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'pdf-files-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
          }
        }
      },
      {
        urlPattern: /\/workers\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'workers-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
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

  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: {
          'pdf-lib': ['pdfjs-dist']
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['pdfjs-dist/build/pdf.worker.min.js', 'pdfjs-dist/build/pdf.worker.mjs']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  }
});
