/**
 * Utility functions for PDF processing
 */

/**
 * Extract text from a PDF document
 * @param pdfData ArrayBuffer containing the PDF data
 * @returns Promise resolving to the extracted text
 */
export const extractBasicTextFromPDF = async (pdfData: ArrayBuffer): Promise<string> => {
  try {
    // Dynamically import pdfjs
    const pdfjsLib = await import('pdfjs-dist');

    // Set the worker source path before using PDF.js
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsWorkerSrc || 'https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.worker.min.mjs';
    }

    // Create a copy of the ArrayBuffer to prevent detached buffer issues
    const pdfDataCopy = pdfData.slice(0);

    // Load the document
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(pdfDataCopy));
    const pdf = await loadingTask.promise;

    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error in basic text extraction:', error);
    throw new Error(`Fallback text extraction failed: ${error}`);
  }
};

/**
 * Get color for a bias category
 * @param category The bias category
 * @returns Color string in rgba format
 */
export const getColorForCategory = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'gender':
      return 'rgba(255, 105, 180, 0.3)'; // Pink
    case 'age':
      return 'rgba(100, 149, 237, 0.3)'; // Blue
    case 'race':
      return 'rgba(147, 112, 219, 0.3)'; // Purple
    default:
      return 'rgba(255, 255, 0, 0.3)'; // Yellow
  }
};
