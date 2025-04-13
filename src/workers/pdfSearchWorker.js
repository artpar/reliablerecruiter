// src/workers/pdfSearchWorker.js
// Worker for PDF search operations

// Import PDF.js as an ES module
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.1.91/+esm';

// Configure the worker
const workerSrc = 'https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.worker.min.mjs';
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
 * Creates a rect array from a text object with position, dimensions, and transform
 *
 * @param {Object} textObj - The text object containing position and dimension data
 * @param {string} textObj.text - The text content
 * @param {number} textObj.x - The x coordinate of the text position
 * @param {number} textObj.y - The y coordinate of the text position
 * @param {number} textObj.width - The width of the text
 * @param {number} textObj.height - The height of the text
 * @param {number[]} textObj.transform - The transformation matrix [a, b, c, d, e, f]
 * @returns {number[]} rect array containing [left, top, right, bottom]
 */
function createRectFromTextObject(textObj) {
    if (!textObj || typeof textObj !== 'object') {
        throw new Error('Input must be a valid text object');
    }

    const { width, height, transform } = textObj;

    if (!Array.isArray(transform) || transform.length !== 6) {
        throw new Error('transformationMatrix must be an array with exactly 6 values [a, b, c, d, e, f]');
    }

    // Extract values from transformation matrix
    // [a, b, c, d, e, f] where e and f are the translation components
    const [a, b, c, d, e, f] = transform;

    // Calculate coordinates based on the transformation matrix
    const left = e; // x-coordinate of the top-left corner
    const top = f - height; // y-coordinate of the top-left corner
    const right = left + width; // x-coordinate of the bottom-right corner
    const bottom = f; // y-coordinate of the bottom-right corner

    return [left, top, right, bottom];
}


/**
 * Creates a quadPoints array from a rect array
 * @param {number[]} rect - Array containing [left, top, right, bottom] coordinates
 * @returns {number[]} quadPoints array containing 8 values defining the four corners
 */
function createQuadPointsFromRect(rect) {
    if (!Array.isArray(rect) || rect.length !== 4) {
        throw new Error('rect must be an array with exactly 4 values [left, top, right, bottom]');
    }

    const [left, top, right, bottom] = rect;

    // The quadPoints array contains 8 values representing four points in this order:
    // [bottom-left-x, bottom-left-y, bottom-right-x, bottom-right-y, top-left-x, top-left-y, top-right-x, top-right-y]
    return [
        left, bottom,   // bottom-left point
        right, bottom,  // bottom-right point
        left, top,      // top-left point
        right, top      // top-right point
    ];
}


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
            console.log("PageSearch[" + i + "]", page)
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
                    console.log("Item match", searchText, matchStartItem)
                    const rect = createRectFromTextObject(matchStartItem);
                    const quadBoxes = createQuadPointsFromRect(rect);
                    results.push({
                        pageNumber: i,
                        text: match[0],
                        rect: rect,
                        bbox: rect,
                        quadPoints: quadBoxes,
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
