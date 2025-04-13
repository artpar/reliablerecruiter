// src/workers/pdfSearchWorker.js
// Worker for PDF search operations

// Import PDF.js as an ES module
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm';

// Configure the worker
const workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// Listen for messages from the main thread
self.onmessage = async (event) => {
    try {
        const {content, searchText, options, action} = event.data;

        // Process the PDF based on the action
        let result;
        switch (action) {
            case 'search':
                result = await searchTextInPDF(content, searchText, options);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        // Send the result back to the main thread
        self.postMessage({success: true, result});
    } catch (error) {
        // Send any errors back to the main thread
        self.postMessage({
            success: false, error: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * Search for text in a PDF document
 *
 * @param {ArrayBuffer} content - The PDF content as an ArrayBuffer
 * @param {string} searchText - The text to search for
 * @param {Object} options - Search options
 * @returns {Promise<Array>} The search results
 */
async function searchTextInPDF(content, searchText, options = {}) {
    try {
        const {matchCase = false, wholeWord = false} = options;

        // Create a copy of the ArrayBuffer
        const pdfDataCopy = new Uint8Array(content.slice(0));

        // Load the PDF
        const loadingTask = pdfjs.getDocument({data: pdfDataCopy});
        const pdf = await loadingTask.promise;

        const results = [];

        // Search each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({scale: 1.0});

            // Create regex pattern for search
            let pattern = searchText;
            if (!matchCase) {
                pattern = pattern.toLowerCase();
            }

            if (wholeWord) {
                pattern = `\\b${escapeRegExp(pattern)}\\b`;
            }

            const regex = new RegExp(pattern, matchCase ? 'g' : 'gi');

            // Process text items
            let pageText = '';
            const textItems = [];

            // Collect all text items with their positions
            textContent.items.forEach((item) => {
                const itemText = item.str;
                textItems.push({
                    text: itemText,
                    x: item.transform[4],
                    y: item.transform[5],
                    width: item.width,
                    height: item.height || 12, // Default height if not provided
                    transform: item.transform
                });

                pageText += itemText + ' ';
            });

            // Search in the combined text
            if (!matchCase) {
                pageText = pageText.toLowerCase();
            }

            let match;
            const searchRegex = new RegExp(pattern, matchCase ? 'g' : 'gi');

            while ((match = searchRegex.exec(pageText)) !== null) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;

                // Find which text items contain this match
                // This is a simplified approach - in a real implementation,
                // you would need more precise text position calculation
                let currentPos = 0;
                let matchStartItem = null;
                let matchEndItem = null;

                for (const item of textItems) {
                    const itemStart = currentPos;
                    const itemEnd = currentPos + item.text.length + 1; // +1 for the space

                    if (matchStartItem === null && matchStart < itemEnd) {
                        matchStartItem = item;
                    }

                    if (matchEndItem === null && matchEnd <= itemEnd) {
                        matchEndItem = item;
                    }

                    if (matchStartItem !== null && matchEndItem !== null) {
                        break;
                    }

                    currentPos = itemEnd;
                }

                if (matchStartItem) {
                    results.push({
                        pageNumber: i, text: match[0], rect: {
                            x: matchStartItem.x,
                            y: matchStartItem.y,
                            width: matchStartItem.width,
                            height: matchStartItem.height
                        }
                    });
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Error in searchTextInPDF:', error);
        throw error;
    }
}

/**
 * Helper function to escape special characters in regex
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
