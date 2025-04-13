import serviceWorkerRegistration from './ServiceWorkerRegistrationService';
import { executePDFGeneralTask, PDFTaskType } from '../workers/PDFWorkerManager';

/**
 * Service for initializing and configuring PDF libraries
 */

// Search result interface
export interface SearchResult {
  pageNumber: number;
  text: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Initialize PDF.js worker for ts-pdf library
 * This must be called before using the PDFAnnotator or PDFEditor components
 *
 * @param workerUrl URL to the PDF.js worker script (optional)
 */
export const initPDFLibrary = async (workerUrl?: string) => {
  // If no worker URL is provided, attempt to use a CDN version
  const defaultWorkerUrl = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const url = workerUrl || defaultWorkerUrl;

  // Set the global PDF.js worker URL
  // This is used by ts-pdf internally
  (window as any).pdfjsWorkerSrc = url;

  // Initialize the service worker system
  await serviceWorkerRegistration.initialize();

  return {
    workerUrl: url,
    serviceWorkerActive: serviceWorkerRegistration.isServiceWorkerActive('/sw.js')
  };
};

/**
 * Extract text content from a PDF
 *
 * @param pdfBuffer The PDF file as an ArrayBuffer
 * @returns Promise with the extracted text
 */
export const extractTextFromPDF = async (pdfBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Make sure service worker is initialized
    if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
      await serviceWorkerRegistration.initialize();
    }

    // Use the service worker to process the PDF
    return await executePDFGeneralTask<string>('extract', pdfBuffer);
  } catch (error) {
    console.error('Failed to extract text from PDF:', error);

    // Fallback to direct processing if service worker fails
    try {
      // Dynamic import of the PDF.js library for direct processing
      const pdfjs = await import('pdfjs-dist');
      
      // Set worker source for direct processing
      const workerVersion = '4.10.38';
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;
      
      // Create a copy of the ArrayBuffer
      const pdfDataCopy = new Uint8Array(pdfBuffer.slice(0));

      // Load the PDF
      const loadingTask = pdfjs.getDocument({ data: pdfDataCopy });
      const pdf = await loadingTask.promise;

      let fullText = '';

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Combine text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (fallbackError) {
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Search for text in a PDF
 *
 * @param pdfBuffer The PDF file as an ArrayBuffer
 * @param searchText The text to search for
 * @param options Search options
 * @returns Promise with search results
 */
export const searchTextInPDF = async (
  pdfBuffer: ArrayBuffer,
  searchText: string,
  options: { matchCase?: boolean; wholeWord?: boolean } = {}
): Promise<SearchResult[]> => {
  try {
    // Make sure service worker is initialized
    if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
      await serviceWorkerRegistration.initialize();
    }

    // Use the service worker to search the PDF
    return await executePDFGeneralTask<SearchResult[]>('search', pdfBuffer, {
      searchText,
      ...options
    });
  } catch (error) {
    console.error('Error searching PDF:', error);
    throw new Error(`PDF search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Execute a PDF task with fallback to direct processing
 * 
 * @param action The PDF task to perform
 * @param pdfBuffer The PDF content
 * @param options Additional options
 * @returns Promise with the result
 */
export const executePDFTaskWithFallback = async <T>(
  action: PDFTaskType,
  pdfBuffer: ArrayBuffer,
  options?: Record<string, any>
): Promise<T> => {
  try {
    // Make sure service worker is initialized
    if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
      await serviceWorkerRegistration.initialize();
    }

    // Use the service worker to process the PDF
    return await executePDFGeneralTask<T>(action, pdfBuffer, options);
  } catch (error) {
    console.error(`Failed to execute PDF task ${action}:`, error);
    throw new Error(`PDF task ${action} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default {
  initPDFLibrary,
  extractTextFromPDF,
  searchTextInPDF,
  executePDFTaskWithFallback
};
