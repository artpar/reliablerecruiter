// src/utils/pdfWorkerLoader.js

/**
 * Creates and initializes a PDF worker
 *
 * @returns {Worker} Initialized PDF worker
 */
export function createPdfWorker() {
    // For both development and production, use the worker from the public directory
    // This ensures the worker is available in both environments
    const workerUrl = new URL('/workers/pdfWorker.js', window.location.origin);

    return new Worker(workerUrl, {
        type: 'module'
    });
}
export function createPdfEditorWorker() {
    // For both development and production, use the worker from the public directory
    // This ensures the worker is available in both environments
    const workerUrl = new URL('/workers/pdfEditorWorker.js', window.location.origin);

    return new Worker(workerUrl, {
        type: 'module'
    });
}

/**
 * Process a PDF file to extract text
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
