import { WorkerService } from './WorkerService';

/**
 * Service for initializing and configuring PDF libraries
 */

/**
 * Initialize PDF.js worker for ts-pdf library
 * This must be called before using the PDFAnnotator or PDFEditor components
 *
 * @param workerUrl URL to the PDF.js worker script
 */
export const initPDFLibrary = (workerUrl?: string) => {
    // If no worker URL is provided, attempt to use a CDN version
    // Note: In production, you should host this file yourself
    const defaultWorkerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';
    const url = workerUrl || defaultWorkerUrl;

    // Set the global PDF.js worker URL
    // This is used by ts-pdf internally
    (window as any).pdfjsWorkerSrc = url;

    return {
        workerUrl: url
    };
};

/**
 * Extract text content from a PDF
 */
export const extractTextFromPDF = async (pdfBuffer: ArrayBuffer): Promise<string> => {
    try {
        // Use the existing worker service to process the PDF
        return await WorkerService.executeTask<{content: ArrayBuffer}, string>(
            'pdfWorker',
            { content: pdfBuffer, action: "extract" }
        );
    } catch (error) {
        console.error('Failed to extract text from PDF:', error);
        throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}


export default {
    initPDFLibrary, extractTextFromPDF
};
