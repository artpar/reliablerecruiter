/**
 * Service for working with PDF annotations
 */
import * as pdfjs from 'pdfjs-dist';

// Set worker source
const workerVersion = '5.1.91';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.mjs`;

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
 * Extract text from PDF
 */
export const extractText = async (pdfData: ArrayBuffer): Promise<string> => {
    try {
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
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
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
        const { matchCase = false, wholeWord = false } = options;

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
    } catch (error) {
        console.error('Error searching PDF:', error);
        throw new Error('Failed to search PDF');
    }
};

/**
 * Extract existing annotations from PDF
 */
export const extractAnnotations = async (pdfData: ArrayBuffer): Promise<PDFAnnotation[]> => {
    try {
        // In a real implementation, this would extract actual PDF annotations
        // For this demo, we'll return a placeholder
        return [];
    } catch (error) {
        console.error('Error extracting annotations:', error);
        throw new Error('Failed to extract annotations');
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
        // In a real implementation, this would save annotations to the PDF
        // For this demo, we'll just return the original PDF data

        // Important: Return a copy of the buffer to avoid detachment issues
        return pdfData.slice(0);
    } catch (error) {
        console.error('Error saving annotations:', error);
        throw new Error('Failed to save annotations');
    }
};

export default {
    extractText,
    searchText,
    extractAnnotations,
    saveAnnotations
};
