// build-worker.js
// Run this with: node build-worker.js

const fs = require('fs');
const path = require('path');
const { build } = require('vite');

// Get all worker files from the src/workers directory
function getWorkerFiles() {
    const workersDir = path.resolve(__dirname, 'src/workers');
    return fs.readdirSync(workersDir)
        .filter(file => file.endsWith('.js'))
        .map(file => ({
            name: file,
            path: path.join(workersDir, file),
            outputName: file // Keep the same filename for output
        }));
}

async function buildWorkers() {
    const workers = getWorkerFiles();
    console.log(`Building ${workers.length} workers: ${workers.map(w => w.name).join(', ')}`);

    for (const worker of workers) {
        await buildWorker(worker);
    }
    
    console.log('All workers built successfully!');
}

async function buildWorker(worker) {
    console.log(`Building worker: ${worker.name}...`);

    // Create a temporary Vite config file for the worker
    const workerConfig = `
    import { defineConfig } from 'vite';
    import { resolve } from 'path';
    
    export default defineConfig({
      build: {
        outDir: 'dist/assets/workers',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/workers/${worker.name}'),
          formats: ['es'],
          fileName: () => '${worker.name}'
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
        console.log(`Worker ${worker.name} build complete!`);
    } catch (err) {
        console.error(`Error building worker ${worker.name}:`, err);
    } finally {
        // Clean up the temporary config file
        fs.unlinkSync('vite.worker.config.js');
    }
}

buildWorkers();
