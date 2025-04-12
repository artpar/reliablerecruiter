// build-worker.js
// Run this with: node build-worker.js

const fs = require('fs');
const path = require('path');
const { build } = require('vite');

async function buildWorker() {
    console.log('Building PDF worker...');

    // Create a temporary Vite config file for the worker
    const workerConfig = `
    import { defineConfig } from 'vite';
    import { resolve } from 'path';
    
    export default defineConfig({
      build: {
        outDir: 'dist/assets/workers',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/workers/pdfWorker.js'),
          formats: ['es'],
          fileName: () => 'pdfWorker.js'
        },
        rollupOptions: {
          external: [],
        }
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        }
      }
    });
  `;

    // Write the temporary config
    fs.writeFileSync('vite.worker.config.js', workerConfig, 'utf-8');

    try {
        // Build the worker with the custom config
        await build({ configFile: 'vite.worker.config.js' });
        console.log('PDF worker build complete!');
    } catch (err) {
        console.error('Error building worker:', err);
    } finally {
        // Clean up the temporary config file
        fs.unlinkSync('vite.worker.config.js');
    }
}

buildWorker();
