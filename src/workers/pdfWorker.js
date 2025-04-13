// public/workers/pdfWorker.js
// This worker uses ESM imports which are compatible with type: 'module'

// Import PDF.js as an ES module
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.1.91/+esm';

// Configure the worker
const workerSrc = 'https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.worker.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// Listen for messages from the main thread
self.onmessage = async (event) => {
  try {
    const { content, action } = event.data;

    // Process the PDF based on the action
    let result;
    switch (action) {
      case 'extract':
        result = await processPDF(content);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Send the result back to the main thread
    self.postMessage({ success: true, result });
  } catch (error) {
    // Send any errors back to the main thread
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// PDF processing function
async function processPDF(content) {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(content) });
    const pdf = await loadingTask.promise;

    let fullText = '';

    // Get the total number of pages
    const numPages = pdf.numPages;

    // Iterate through each page to extract text
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text from the page
        const pageText = textContent.items
            .map((item) => item.str)
            .join(' ');

        fullText += pageText + '\n';
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        // Continue with other pages even if one fails
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error in processPDF:', error);
    throw error;
  }
}
