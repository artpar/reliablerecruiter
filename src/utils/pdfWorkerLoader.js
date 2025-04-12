// src/utils/pdfWorkerLoader.js

/**
 * Creates and initializes a PDF worker
 *
 * @returns {Worker} Initialized PDF worker
 */
export function createPdfWorker() {
    // For development mode
    if (import.meta.env.DEV) {
        // In development, use the worker directly
        return new Worker(new URL('../workers/pdfWorker.js', import.meta.url), {
            type: 'module'
        });
    }

    // For production mode
    else {
        // In production, we need to use the built worker from the assets directory
        // The path needs to match where Vite outputs the worker in production
        const workerPath = new URL('/assets/workers/pdfWorker.js', window.location.origin);
        return new Worker(workerPath, {
            type: 'module'
        });
    }
}

/**
 * Example usage of the PDF worker
 *
 * @param {ArrayBuffer} pdfData - The PDF file data as ArrayBuffer
 * @returns {Promise<string>} - Promise resolving to the extracted text
 */
export function extractTextFromPdf(pdfData) {
    return new Promise((resolve, reject) => {
        const worker = createPdfWorker();

        worker.onmessage = (event) => {
            const { success, result, error } = event.data;

            // When processing is complete, terminate the worker
            worker.terminate();

            if (success) {
                resolve(result);
            } else {
                reject(new Error(error || 'Unknown error in PDF processing'));
            }
        };

        worker.onerror = (error) => {
            worker.terminate();
            reject(new Error(`Worker error: ${error.message}`));
        };

        // Send the PDF data to the worker
        worker.postMessage({ content: pdfData });
    });
}
