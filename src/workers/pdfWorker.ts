// src/workers/pdfWorker.ts
import * as pdfjs from 'pdfjs-dist';

// Set the worker source path directly
// This is a more compatible approach for Vite/web workers
const workerVersion = '5.1.91';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.mjs`;

// Listen for messages from the main thread
self.onmessage = async (event) => {
  try {
    const { content } = event.data;

    // Process the PDF
    const result = await processPDF(content);

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
async function processPDF(content: ArrayBuffer): Promise<string> {
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
            .map((item: any) => item.str)
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

// Export an empty object to make TypeScript happy with the module format
export {};
