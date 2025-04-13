/**
 * Service for working with PDF annotations
 */
import serviceWorkerRegistration from './ServiceWorkerRegistrationService';

// Import pdfjs dynamically to avoid direct worker initialization
// We'll use the service worker approach instead

// PDFAnnotation interface
export interface PDFAnnotation {
    id: string;
    type: 'highlight' | 'note' | 'redaction' | 'edit';
    pageNumber: number;
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    content?: string;
    color?: string;
}

// Search result interface
interface SearchResult {
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
 * Execute a task in the PDF worker via the service worker
 *
 * @param action The action to perform
 * @param data The data to process
 * @param options Additional options
 * @returns Promise with the result
 */
async function executePDFAnnotationTask<T>(
    action: string,
    data: ArrayBuffer,
    options?: Record<string, any>
): Promise<T> {
    return new Promise((resolve, reject) => {
        // Create a unique message channel for this request
        const messageChannel = new MessageChannel();

        // Set up the response handler
        messageChannel.port1.onmessage = (event) => {
            const response = event.data;

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
            type: 'PDF_ANNOTATION_TASK',
            payload: {
                action,
                content: data,
                options
            }
        }, [messageChannel.port2]);
    });
}

/**
 * Extract text from PDF
 */
export const extractText = async (pdfData: ArrayBuffer): Promise<string> => {
    try {
        // Make sure service worker is initialized
        if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
            await serviceWorkerRegistration.initialize();
        }

        // Use the service worker to process the PDF
        return await executePDFAnnotationTask<string>('extract', pdfData);
    } catch (error) {
        console.error('Error extracting text from PDF:', error);

        // Fallback to direct processing if service worker fails
        try {
            // Dynamically import pdfjs for direct processing
            const pdfjs = await import('pdfjs-dist');

            // Set worker source for direct processing
            const workerVersion = '4.10.38';
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;

            // Create a copy of the ArrayBuffer
            const pdfDataCopy = new Uint8Array(pdfData.slice(0));

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

            return fullText;
        } catch (fallbackError) {
            throw new Error('Failed to extract text from PDF');
        }
    }
};

/**
 * Search for text in PDF
 */
export const searchText = async (
    pdfData: ArrayBuffer,
    searchText: string,
    options: { matchCase?: boolean; wholeWord?: boolean } = {}
): Promise<SearchResult[]> => {
    try {
        // Make sure service worker is initialized
        if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
            await serviceWorkerRegistration.initialize();
        }

        // Use the service worker to search the PDF
        return await executePDFAnnotationTask<SearchResult[]>('search', pdfData, {
            searchText,
            ...options
        });
    } catch (error) {
        console.error('Error searching PDF:', error);

        // Fallback to direct processing if service worker fails
        try {
            const { matchCase = false, wholeWord = false } = options;

            // Dynamically import pdfjs for direct processing
            const pdfjs = await import('pdfjs-dist');

            // Set worker source for direct processing
            const workerVersion = '4.10.38';
            pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.mjs`;

            // Create a copy of the ArrayBuffer
            const pdfDataCopy = new Uint8Array(pdfData.slice(0));

            // Load the PDF
            const loadingTask = pdfjs.getDocument({ data: pdfDataCopy });
            const pdf = await loadingTask.promise;

            const results: SearchResult[] = [];

            // Search each page
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const viewport = page.getViewport({ scale: 1.0 });

                // Create regex pattern for search
                let pattern = searchText;
                if (!matchCase) {
                    pattern = pattern.toLowerCase();
                }

                if (wholeWord) {
                    pattern = `\\b${pattern}\\b`;
                }

                const regex = new RegExp(pattern, matchCase ? 'g' : 'gi');

                // Process text items
                let lastMatchedItem: any = null;
                let combinedText = '';

                textContent.items.forEach((item: any) => {
                    let itemText = item.str;
                    if (!matchCase) {
                        itemText = itemText.toLowerCase();
                    }

                    combinedText += itemText + ' ';

                    // Check for matches
                    const matches = itemText.match(regex);
                    if (matches) {
                        matches.forEach(() => {
                            // Get match position
                            const index = itemText.search(regex);

                            // Calculate rectangle for the match
                            const x = item.transform[4];
                            const y = viewport.height - item.transform[5];

                            // Approximate width based on font size and text length
                            const width = searchText.length * (item.width / item.str.length || 8);
                            const height = item.height || 14;

                            results.push({
                                pageNumber: i,
                                text: searchText,
                                rect: {
                                    x,
                                    y: y - height,
                                    width,
                                    height
                                }
                            });
                        });
                    }
                });

                // Also check combined text for matches that might span across multiple items
                const globalMatches = combinedText.match(regex);
                if (globalMatches) {
                    // Process global matches if needed
                    // This is a simplification - would need more complex logic to handle cross-item matches
                }
            }

            return results;
        } catch (fallbackError) {
            throw new Error('Failed to search PDF');
        }
    }
};

/**
 * Extract existing annotations from PDF
 */
export const extractAnnotations = async (pdfData: ArrayBuffer): Promise<PDFAnnotation[]> => {
    try {
        // Make sure service worker is initialized
        if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
            await serviceWorkerRegistration.initialize();
        }

        // Use the service worker to extract annotations
        return await executePDFAnnotationTask<PDFAnnotation[]>('extractAnnotations', pdfData);
    } catch (error) {
        console.error('Error extracting annotations:', error);

        // Fallback to direct processing
        // In a real implementation, this would extract actual PDF annotations
        // For this demo, we'll return a placeholder
        return [];
    }
};

/**
 * Save annotations to PDF
 */
export const saveAnnotations = async (
    pdfData: ArrayBuffer,
    annotations: PDFAnnotation[]
): Promise<ArrayBuffer> => {
    try {
        // Make sure service worker is initialized
        if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
            await serviceWorkerRegistration.initialize();
        }

        // Use the service worker to save annotations
        return await executePDFAnnotationTask<ArrayBuffer>('saveAnnotations', pdfData, { annotations });
    } catch (error) {
        console.error('Error saving annotations:', error);

        // Fallback to direct processing
        // In a real implementation, this would save annotations to the PDF
        // For this demo, we'll just return the original PDF data
        return pdfData.slice(0);
    }
};

export default {
    extractText,
    searchText,
    extractAnnotations,
    saveAnnotations
};
