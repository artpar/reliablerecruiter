import serviceWorkerRegistration from './ServiceWorkerRegistrationService';

/**
 * Service for initializing and configuring PDF libraries
 */

// PDF worker message types
interface PDFWorkerMessage {
  action: 'extract' | 'search' | 'annotate';
  content: ArrayBuffer;
  options?: Record<string, any>;
}

// PDF worker response types
interface PDFWorkerResponse {
  success: boolean;
  result?: any;
  error?: string;
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
 * Execute a task in the PDF worker via the service worker
 *
 * @param action The action to perform
 * @param data The data to process
 * @param options Additional options
 * @returns Promise with the result
 */
async function executePDFTask<T>(
    action: PDFWorkerMessage['action'],
    data: ArrayBuffer,
    options?: Record<string, any>
): Promise<T> {
    return new Promise((resolve, reject) => {
        // Create a unique message channel for this request
        const messageChannel = new MessageChannel();

        // Set up the response handler
        messageChannel.port1.onmessage = (event) => {
            const response = event.data as PDFWorkerResponse;

            if (response.success) {
                resolve(response.result as T);
            } else {
                reject(new Error(response.error || 'Unknown error in PDF processing'));
            }

            // Clean up
            messageChannel.port1.close();
        };

        // Check if service worker is active
        if (!navigator.serviceWorker.controller) {
            reject(new Error('Service worker is not active. Please refresh the page.'));
            return;
        }

        // Send the message to the service worker
        navigator.serviceWorker.controller.postMessage({
            type: 'PDF_TASK',
            payload: {
                action,
                content: data,
                options
            }
        }, [messageChannel.port2]);
    });
}

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
        return await executePDFTask<string>('extract', pdfBuffer);
    } catch (error) {
        console.error('Failed to extract text from PDF:', error);

        // Fallback to direct processing if service worker fails
        try {
            // Dynamic import of the PDF.js library for direct processing
            const pdfjs = await import('pdfjs-dist');
            const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
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

            return fullText;
        } catch (fallbackError) {
            throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};

export default {
    initPDFLibrary,
    extractTextFromPDF
};
