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

        // Validate input
        if (!content || !(content instanceof ArrayBuffer)) {
            throw new Error("Invalid PDF content provided. Expected ArrayBuffer.");
        }
        if (typeof searchText !== 'string') {
            throw new Error("Invalid searchText provided. Expected string.");
        }

        // Process the PDF based on the action
        let result;
        switch (action) {
            case 'search':
                result = await searchTextInPDF(content, searchText, options || {}); // Ensure options is an object
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        // Send the result back to the main thread
        self.postMessage({success: true, result});
    } catch (error) {
        console.error('Error in PDF Search Worker:', error);
        // Send any errors back to the main thread
        self.postMessage({
            success: false, error: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * Creates a rect array [left, top, right, bottom] in page coordinates
 * for a specific substring match within a pdf.js text item.
 * This version uses the transformation matrix for accurate positioning.
 *
 * @param {Object} textItem - The text item object from pdf.js text content.
 * Expected properties: str, width, height, transform.
 * @param {number} startCharIndex - Starting character index within the item's text (item.str).
 * @param {number} endCharIndex - Ending character index (exclusive) within the item's text (item.str).
 * @returns {number[] | null} rect array containing [left, top, right, bottom] in page coordinates,
 * or null if calculation is not possible.
 */
function createRectForSubstring(textItem, startCharIndex, endCharIndex) {
    if (!textItem || typeof textItem !== 'object' || !textItem.transform || !textItem.str) {
        console.warn('Invalid textItem provided to createRectForSubstring');
        return null; // Cannot calculate without valid item
    }

    const { str, width, height, transform } = textItem;
    const textLength = str.length;

    // --- Basic Validation ---
    if (textLength === 0 || width <= 0) {
        // console.warn('Skipping textItem with zero length or width:', str);
        return null; // Cannot calculate for empty or zero-width items
    }
    if (startCharIndex < 0 || endCharIndex > textLength || startCharIndex >= endCharIndex) {
        console.warn(`Invalid char indices [${startCharIndex}, ${endCharIndex}) for text "${str}" (length ${textLength})`);
        return null; // Invalid range
    }
    if (!Array.isArray(transform) || transform.length !== 6) {
        console.error('Invalid transformation matrix:', transform);
        return null; // Cannot calculate without valid transform
    }

    // --- Extract Transformation Matrix Components ---
    // a: Scale X, b: Skew Y, c: Skew X, d: Scale Y, e: Translate X, f: Translate Y (baseline)
    const [a, b, c, d, e, f] = transform;

    // --- Calculate Proportional Width ---
    // Estimate the start and end X coordinates in the item's *local* coordinate system.
    // This assumes characters are distributed proportionally along the item's width.
    // This is an approximation, especially with complex kerning/ligatures, but better than fixed width.
    const startRatio = startCharIndex / textLength;
    const endRatio = endCharIndex / textLength;
    const localStartX = startRatio * width;
    const localEndX = endRatio * width;

    // --- Define Local Y Coordinates ---
    // In pdf.js's local text space, Y often corresponds to ascent/descent relative to baseline (Y=0).
    // `height` might represent the font's bounding box height or ascent+descent.
    // We'll use Y=0 for the baseline and Y=height for an approximate top.
    // Refined approach might involve font metrics if available, but `height` is usually sufficient for highlighting.
    const localBaselineY = 0;
    // Treat height as ascent for highlighting purposes (from baseline up)
    // Adjust if highlighting needs to extend below baseline.
    const localTopY = height;

    // --- Transform Local Corners to Page Coordinates ---
    // Page Point (x, y) = [a, c, e] [localX] + [f]
    //                      [b, d, f] [localY]
    //                      [0, 0, 1] [  1   ]
    // Apply the transformation matrix to the corners of the substring's local bounding box.

    // Bottom-left corner (localX=localStartX, localY=localBaselineY=0)
    const blX = a * localStartX + c * localBaselineY + e; // Simplified: a * localStartX + e
    const blY = b * localStartX + d * localBaselineY + f; // Simplified: b * localStartX + f

    // Top-left corner (localX=localStartX, localY=localTopY=height)
    const tlX = a * localStartX + c * localTopY + e;
    const tlY = b * localStartX + d * localTopY + f;

    // Bottom-right corner (localX=localEndX, localY=localBaselineY=0)
    const brX = a * localEndX + c * localBaselineY + e; // Simplified: a * localEndX + e
    const brY = b * localEndX + d * localBaselineY + f; // Simplified: b * localEndX + f

    // Top-right corner (localX=localEndX, localY=localTopY=height)
    const trX = a * localEndX + c * localTopY + e;
    const trY = b * localEndX + d * localTopY + f;

    // --- Determine Page Bounding Box ---
    // Find the minimum and maximum X and Y coordinates from the transformed corners.
    // This creates an axis-aligned bounding box encompassing the potentially rotated/skewed quad.
    const finalLeft = Math.min(blX, tlX, brX, trX);
    const finalRight = Math.max(blX, tlX, brX, trX);
    const finalBottom = Math.min(blY, tlY, brY, trY);
    const finalTop = Math.max(blY, tlY, brY, trY);

    // --- Return Rect ---
    // Format: [left, top, right, bottom] common in some contexts (like CSS box model)
    // PDF coordinates often have Y increasing upwards, so 'top' means max Y, 'bottom' means min Y.
    // Double-check the coordinate system expected by the highlighting implementation.
    // If highlighting expects [x1, y1, x2, y2] where y1 < y2, adjust accordingly.
    // Assuming [minX, maxY, maxX, minY] for [left, top, right, bottom] with Y increasing upwards.
    return [finalLeft, finalTop, finalRight, finalBottom];
}


/**
 * Creates a quadPoints array from a rect array.
 * QuadPoints are useful for highlighting potentially rotated or skewed text more accurately than a simple rectangle.
 *
 * @param {number[]} rect - Array containing [left, top, right, bottom] coordinates (minX, maxY, maxX, minY).
 * @param {Object} textItem - The original text item, used to get transformed corner points directly.
 * @param {number} startCharIndex - Starting character index.
 * @param {number} endCharIndex - Ending character index.
 * @returns {number[] | null} quadPoints array [blX, blY, brX, brY, tlX, tlY, trX, trY] or null.
 */
function createQuadPointsForSubstring(textItem, startCharIndex, endCharIndex) {
    // Re-use the same logic as createRectForSubstring to get corner points
    // This avoids redundant calculations if both rect and quadPoints are needed.

    if (!textItem || typeof textItem !== 'object' || !textItem.transform || !textItem.str) {
        console.warn('Invalid textItem provided to createQuadPointsForSubstring');
        return null;
    }
    const { str, width, height, transform } = textItem;
    const textLength = str.length;

    if (textLength === 0 || width <= 0 || startCharIndex < 0 || endCharIndex > textLength || startCharIndex >= endCharIndex || !Array.isArray(transform) || transform.length !== 6) {
        // Basic validation failed
        return null;
    }

    const [a, b, c, d, e, f] = transform;
    const startRatio = startCharIndex / textLength;
    const endRatio = endCharIndex / textLength;
    const localStartX = startRatio * width;
    const localEndX = endRatio * width;
    const localBaselineY = 0;
    const localTopY = height;

    // Calculate transformed corners directly
    const blX = a * localStartX + c * localBaselineY + e;
    const blY = b * localStartX + d * localBaselineY + f;
    const tlX = a * localStartX + c * localTopY + e;
    const tlY = b * localStartX + d * localTopY + f;
    const brX = a * localEndX + c * localBaselineY + e;
    const brY = b * localEndX + d * localBaselineY + f;
    const trX = a * localEndX + c * localTopY + e;
    const trY = b * localEndX + d * localTopY + f;

    // PDF QuadPoints order: BottomLeft, BottomRight, TopLeft, TopRight
    // [blX, blY, brX, brY, tlX, tlY, trX, trY] - Check documentation for specific order needed.
    // Annotation standards often use this order.
    return [blX, blY, brX, brY, tlX, tlY, trX, trY];

}

/**
 * Escapes special regular expression characters in a string.
 * @param {string} string - The input string.
 * @returns {string} The string with regex characters escaped.
 */
function escapeRegExp(string) {
    // $& means the whole matched string
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Searches for text within the content of a PDF document.
 *
 * @param {ArrayBuffer} content - The PDF content as an ArrayBuffer.
 * @param {string} searchText - The text to search for.
 * @param {Object} options - Search options:
 * @param {boolean} [options.matchCase=false] - Perform a case-sensitive search.
 * @param {boolean} [options.wholeWord=false] - Match only whole words.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of search result objects.
 * Each object contains { pageNumber, text, rect, bbox, quadPoints }.
 */
async function searchTextInPDF(content, searchText, options = {}) {
    let pdf = null; // Define pdf variable outside the loop
    try {
        const {matchCase = false, wholeWord = false} = options;

        // Use Uint8Array for pdf.js - it's often preferred
        const pdfData = new Uint8Array(content);

        // Load the PDF document
        // Disable auto-fetch and font loading if not needed for search? Check pdf.js options.
        const loadingTask = pdfjs.getDocument({
            data: pdfData,
            useSystemFonts: true, // May improve performance if fonts aren't critical for search logic
        });
        pdf = await loadingTask.promise;

        const results = [];
        const numPages = pdf.numPages;

        // --- Prepare Regex ---
        if (!searchText) return []; // No search text provided
        let pattern = escapeRegExp(searchText);
        if (wholeWord) {
            pattern = `\\b${pattern}\\b`; // Add word boundaries
        }
        const searchRegex = new RegExp(pattern, matchCase ? 'g' : 'gi'); // 'g' for global, 'i' for case-insensitive

        // --- Iterate Through Pages ---
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            let page = null;
            try {
                page = await pdf.getPage(pageNum);
                // Get text content with necessary details for positioning.
                // disableCombineTextItems: false is default and generally preferred for positioning.
                const textContent = await page.getTextContent();

                // --- Iterate Through Text Items on Page ---
                for (const item of textContent.items) {
                    if (!item || typeof item.str !== 'string' || item.str.trim().length === 0) {
                        continue; // Skip items without text
                    }

                    const itemText = item.str;
                    // Use itemText directly with the regex (flags handle case sensitivity)
                    let match;
                    searchRegex.lastIndex = 0; // Reset lastIndex for global regex before each item search

                    while ((match = searchRegex.exec(itemText)) !== null) {
                        const matchStartIndex = match.index;
                        const matchedString = match[0];
                        const matchEndIndex = matchStartIndex + matchedString.length;

                        // --- Calculate Bounding Box and QuadPoints ---
                        // Use the updated function that handles transforms correctly
                        const rect = createRectForSubstring(item, matchStartIndex, matchEndIndex);
                        const quadPoints = createQuadPointsForSubstring(item, matchStartIndex, matchEndIndex);

                        // Only add result if coordinates could be calculated
                        if (rect && quadPoints) {
                            results.push({
                                pageNumber: pageNum,
                                text: matchedString, // The actual matched text
                                // rect: Bounding box [left, top, right, bottom] (Y increases up)
                                rect: rect,
                                // bbox: Often synonymous with rect, provide both if needed
                                bbox: rect,
                                // quadPoints: More precise corners for highlighting
                                quadPoints: quadPoints,
                            });
                        } else {
                            console.warn(`Could not calculate geometry for match "${matchedString}" on page ${pageNum}`);
                        }

                        // If regex is not global, stop after first match in this item
                        if (!searchRegex.global) {
                            break;
                        }
                        // Prevent infinite loops with zero-length matches (e.g., from \b)
                        if (matchedString.length === 0) {
                            searchRegex.lastIndex++;
                        }
                    }
                }
            } finally {
                // --- Cleanup Page Resources ---
                if (page) {
                    // page.cleanup(/*glise=*/true); // Recommended to free memory, especially font data
                    page.cleanup(); // simpler cleanup
                }
            }
        } // End page loop

        return results;

    } catch (error) {
        console.error('Error during PDF text search:', error);
        throw error; // Rethrow to be caught by the onmessage handler
    } finally {
        // --- Cleanup Document Resources ---
        if (pdf) {
            try {
                await pdf.destroy();
            } catch (destroyError) {
                console.error("Error destroying PDF document:", destroyError);
                // Decide if this error should be surfaced or just logged
            }
        }
    }
}
