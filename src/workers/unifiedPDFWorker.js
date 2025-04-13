// src/workers/unifiedPDFWorker.js
// A unified worker for all PDF-related operations

// Import PDF.js as an ES module
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm';

// Configure the worker
const workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// Listen for messages from the main thread
self.onmessage = async (event) => {
  try {
    const { action, content, options } = event.data;

    // Process the PDF based on the action
    let result;
    switch (action) {
      case 'extract':
        result = await extractTextFromPDF(content);
        break;
      case 'search':
        result = await searchTextInPDF(content, options?.searchText, options);
        break;
      case 'extractAnnotations':
        result = await extractAnnotationsFromPDF(content);
        break;
      case 'saveAnnotations':
        result = await saveAnnotationsToPDF(content, options?.annotations);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Send the result back to the main thread
    self.postMessage({ success: true, result });
  } catch (error) {
    // Send any errors back to the main thread
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Extract text from a PDF document
 * 
 * @param {ArrayBuffer} content - The PDF content as an ArrayBuffer
 * @returns {Promise<string>} The extracted text
 */
async function extractTextFromPDF(content) {
  try {
    // Create a copy of the ArrayBuffer
    const pdfDataCopy = new Uint8Array(content.slice(0));

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
        .map((item) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error in extractTextFromPDF:', error);
    throw error;
  }
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
    const { matchCase = false, wholeWord = false } = options;

    // Create a copy of the ArrayBuffer
    const pdfDataCopy = new Uint8Array(content.slice(0));

    // Load the PDF
    const loadingTask = pdfjs.getDocument({ data: pdfDataCopy });
    const pdf = await loadingTask.promise;

    const results = [];

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
      let combinedText = '';

      textContent.items.forEach((item) => {
        let itemText = item.str;
        if (!matchCase) {
          itemText = itemText.toLowerCase();
        }

        combinedText += itemText + ' ';

        // Check for matches
        const matches = itemText.match(regex);
        if (matches) {
          results.push({
            pageNumber: i,
            text: item.str,
            rect: {
              x: item.transform[4],
              y: item.transform[5],
              width: item.width,
              height: item.height
            }
          });
        }
      });

      // Also check combined text for matches that span multiple items
      const matches = combinedText.match(regex);
      if (matches && matches.length > 0) {
        // This is a simplified approach - in a real implementation,
        // you would need to calculate the exact position of matches
        // that span multiple text items
      }
    }

    return results;
  } catch (error) {
    console.error('Error in searchTextInPDF:', error);
    throw error;
  }
}

/**
 * Extract annotations from a PDF document
 * 
 * @param {ArrayBuffer} content - The PDF content as an ArrayBuffer
 * @returns {Promise<Array>} The extracted annotations
 */
async function extractAnnotationsFromPDF(content) {
  try {
    // Create a copy of the ArrayBuffer
    const pdfDataCopy = new Uint8Array(content.slice(0));

    // Load the PDF
    const loadingTask = pdfjs.getDocument({ data: pdfDataCopy });
    const pdf = await loadingTask.promise;

    const annotations = [];

    // Extract annotations from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const annotationsList = await page.getAnnotations();

      // Convert to our annotation format
      annotationsList.forEach((annotation) => {
        annotations.push({
          id: annotation.id || `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: mapAnnotationType(annotation.subtype),
          pageNumber: i,
          rect: {
            x: annotation.rect[0],
            y: annotation.rect[1],
            width: annotation.rect[2] - annotation.rect[0],
            height: annotation.rect[3] - annotation.rect[1]
          },
          content: annotation.contents,
          color: annotation.color ? rgbToHex(annotation.color) : '#ffff00'
        });
      });
    }

    return annotations;
  } catch (error) {
    console.error('Error in extractAnnotationsFromPDF:', error);
    throw error;
  }
}

/**
 * Save annotations to a PDF document
 * 
 * @param {ArrayBuffer} content - The PDF content as an ArrayBuffer
 * @param {Array} annotations - The annotations to save
 * @returns {Promise<ArrayBuffer>} The modified PDF content
 */
async function saveAnnotationsToPDF(content, annotations = []) {
  // In a production environment, you would use PDF-LIB or a similar library
  // to modify the PDF structure and add annotations
  
  // For this example, we'll just return the original content
  // with a note that this is a placeholder for real implementation
  console.log('Saving annotations:', annotations.length);
  
  // Return the original content
  return content;
}

/**
 * Map PDF.js annotation type to our annotation type
 */
function mapAnnotationType(subtype) {
  switch (subtype) {
    case 'Highlight':
      return 'highlight';
    case 'Text':
      return 'note';
    case 'FreeText':
      return 'freetext';
    case 'Square':
      return 'square';
    case 'Circle':
      return 'circle';
    case 'Ink':
      return 'ink';
    default:
      return 'highlight';
  }
}

/**
 * Convert RGB array to hex color
 */
function rgbToHex(rgb) {
  if (!rgb || rgb.length < 3) return '#ffff00';
  
  return '#' + [0, 1, 2].map(i => {
    const hex = Math.round(rgb[i] * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
