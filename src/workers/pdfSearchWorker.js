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
 * @param {number} startCharIndex - Starting character index within the text
 * @param {number} endCharIndex - Ending character index within the text
 * @returns {number[]} rect array containing [left, top, right, bottom]
 */
function createRectFromTextObject(textObj, startCharIndex, endCharIndex) {
    if (!textObj || typeof textObj !== 'object') {
        throw new Error('Input must be a valid text object');
    }

    const { text, width, height, transform } = textObj;

    if (!Array.isArray(transform) || transform.length !== 6) {
        throw new Error('transformationMatrix must be an array with exactly 6 values [a, b, c, d, e, f]');
    }

    // Extract values from transformation matrix
    // a is Scale_x
    // b is Shear_x
    // c is Shear_y
    // d is Scale_y
    // e is offset x
    // f is offset y
    const [a, b, c, d, e, f] = transform;

    // Calculate character width (approximate)
    const charWidth = width / text.length;

    // Calculate start and end positions for the specific substring
    const startX = e + (startCharIndex * charWidth);
    const matchWidth = (endCharIndex - startCharIndex) * charWidth;

    // Calculate coordinates for the specific matched text
    const left = startX;
    const top = f - height;
    const right = left + matchWidth;
    const bottom = f;

    return [left, top + 10, right, bottom + 10];
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
 * Helper function to escape special characters in regex
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Search for text in a PDF document with word-level precision
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

        // Create regex pattern for search
        let pattern = searchText;
        if (wholeWord) {
            pattern = `\\b${escapeRegExp(pattern)}\\b`;
        }
        const searchRegex = new RegExp(pattern, matchCase ? 'g' : 'gi');

        // Search each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({scale: 1.0});

            // Process each text item individually for more precise matches
            for (const item of textContent.items) {
                const itemText = item.str;
                const searchableText = matchCase ? itemText : itemText.toLowerCase();
                const searchableQuery = matchCase ? searchText : searchText.toLowerCase();

                // Find all matches in this text item
                let match;
                while ((match = searchRegex.exec(searchableText)) !== null) {
                    const matchStartIndex = match.index;
                    const matchEndIndex = matchStartIndex + match[0].length;

                    // Create a text object with all necessary properties
                    const textObj = {
                        text: itemText,
                        width: item.width,
                        height: item.height || 12, // Default height if not provided
                        transform: item.transform
                    };

                    // Calculate the exact bounding box for this match
                    const rect = createRectFromTextObject(textObj, matchStartIndex, matchEndIndex);
                    const quadPoints = createQuadPointsFromRect(rect);

                    results.push({
                        pageNumber: i,
                        text: match[0],
                        rect: rect,
                        bbox: rect,
                        quadPoints: quadPoints,
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
