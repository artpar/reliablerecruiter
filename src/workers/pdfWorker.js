// public/workers/pdfWorker.js
// This file will be copied directly to the output directory without bundling

// We need to use importScripts for service workers in this context
importScripts('https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.min.js');

// PDF.js will be available as 'pdfjsLib' in the global scope after importScripts

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
async function processPDF(content) {
  try {
    // Use the global pdfjsLib instead of imported pdfjs
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(content) });
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
