// src/workers/pdfAnnotationWorker.js
import * as pdfjs from 'pdfjs-dist';

// Set the worker source
const workerVersion = '5.1.91';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.mjs`;


// Handle messages from the main thread
self.onmessage = async (event) => {
    try {
        const request = event.data;
        const {
            pdfBuffer,
            annotations = [],
            action = 'save',
            pageNumber,
            rect,
            searchText,
            options
        } = request;

        let result;

        switch (action) {
            case 'save':
                result = await saveAnnotations(pdfBuffer, annotations);
                break;
            case 'extract':
                result = await extractAnnotations(pdfBuffer);
                break;
            case 'redact':
                result = await applyRedactions(pdfBuffer, annotations);
                break;
            case 'edit':
                result = await applyTextEdits(pdfBuffer, annotations);
                break;
            case 'export':
                result = await exportWithRenderedAnnotations(pdfBuffer, annotations);
                break;
            case 'extractText':
                if (pageNumber !== undefined && rect) {
                    result = await getTextFromRegion(pdfBuffer, pageNumber, rect);
                } else {
                    throw new Error('pageNumber and rect are required for extractText action');
                }
                break;
            case 'search':
                if (searchText) {
                    result = await searchTextInPDF(pdfBuffer, searchText, options);
                } else {
                    throw new Error('searchText is required for search action');
                }
                break;
            case 'summarize':
                result = await createAnnotationSummary(pdfBuffer, annotations);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        // Send the result back to the main thread
        self.postMessage({
            success: true,
            result
        });
    } catch (error) {
        // Send any errors back to the main thread
        self.postMessage({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * Save annotations to the PDF
 * In a real implementation, this would use pdf-lib to add actual PDF annotations
 */
async function saveAnnotations(pdfBuffer, annotations) {
    try {
        // Load the PDF document for inspection
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdfDoc = await loadingTask.promise;

        // Get some info from the PDF for our metadata
        const { info } = await pdfDoc.getMetadata();

        // Custom PDF annotation storage
        // In a real implementation, we'd use proper PDF annotation objects

        // Store annotations as custom data in the PDF using XMP metadata
        // For our demo, we'll append the JSON to the end of the PDF
        const annotationsJson = JSON.stringify({
            annotations,
            version: "1.0",
            timestamp: Date.now(),
            originalMetadata: {
                title: info?.Title || 'Untitled',
                author: info?.Author || 'Unknown',
                creator: info?.Creator || 'HR ToolKit'
            }
        });

        // Convert annotations to Base64 to avoid encoding issues
        const jsonEncoder = new TextEncoder();
        const annotationsData = jsonEncoder.encode(annotationsJson);
        const base64Annotations = arrayBufferToBase64(annotationsData.buffer);

        // Create a marker for our annotation data
        const marker = jsonEncoder.encode('\n%PDF-ANNOTATIONS-HR-TOOLKIT%\n');

        // Combine the original PDF with our annotation data
        const combinedBuffer = new Uint8Array(pdfBuffer.byteLength + marker.length + base64Annotations.length);
        combinedBuffer.set(new Uint8Array(pdfBuffer), 0);
        combinedBuffer.set(marker, pdfBuffer.byteLength);
        combinedBuffer.set(new TextEncoder().encode(base64Annotations), pdfBuffer.byteLength + marker.length);

        return combinedBuffer.buffer;
    } catch (error) {
        console.error('Error saving annotations:', error);
        throw error;
    }
}

/**
 * Extract annotations from a PDF
 */
async function extractAnnotations(pdfBuffer) {
    try {
        // Look for our custom annotations data in the PDF
        const pdfData = new Uint8Array(pdfBuffer);
        const decoder = new TextDecoder();
        const pdfText = decoder.decode(pdfData);

        // Check if our marker exists
        const markerIndex = pdfText.indexOf('%PDF-ANNOTATIONS-HR-TOOLKIT%');
        if (markerIndex === -1) {
            // Also try to find any native PDF annotations (not implemented in this demo)
            // For a real implementation, you would use pdf-lib to extract PDF annotation objects

            // No annotations found
            return [];
        }

        // Extract the Base64 encoded JSON data after our marker
        const base64Data = pdfText.substring(markerIndex + 28); // Skip the marker

        try {
            // Convert Base64 to JSON
            const jsonData = base64ToJson(base64Data);

            // Make sure we have a valid annotations object
            if (jsonData && jsonData.annotations && Array.isArray(jsonData.annotations)) {
                return jsonData.annotations;
            } else {
                return [];
            }
        } catch (parseError) {
            console.error('Error parsing annotations data:', parseError);
            return [];
        }
    } catch (error) {
        console.error('Error extracting annotations:', error);
        throw error;
    }
}

/**
 * Apply redactions to a PDF
 * In a real implementation, this would permanently remove the redacted content
 */
async function applyRedactions(pdfBuffer, redactions) {
    try {
        // In a real implementation, you would:
        // 1. Load the PDF with pdf-lib
        // 2. Identify text and graphics under each redaction rectangle
        // 3. Remove the content from the PDF
        // 4. Draw black rectangles over the redacted areas
        // 5. Remove the original redaction annotations
        // 6. Save the modified PDF

        // For this demo, we'll simulate the process:

        // Load the PDF
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdfDoc = await loadingTask.promise;

        // Mark redactions as applied
        const appliedRedactions = redactions.map(redaction => ({
            ...redaction,
            status: 'applied',
            appliedAt: Date.now()
        }));

        // Extract existing annotations
        const existingAnnotations = await extractAnnotations(pdfBuffer);

        // Filter out redaction annotations that have been applied
        const filteredAnnotations = existingAnnotations.filter(
            ann => !(ann.type === 'redaction' && redactions.some(r => r.id === ann.id))
        );

        // Add new annotations for the applied redactions
        const allAnnotations = [
            ...filteredAnnotations,
            ...appliedRedactions
        ];

        // Save the updated annotations to the PDF
        return await saveAnnotations(pdfBuffer, allAnnotations);
    } catch (error) {
        console.error('Error applying redactions:', error);
        throw error;
    }
}

/**
 * Apply text edits to a PDF
 */
async function applyTextEdits(pdfBuffer, edits) {
    try {
        // In a real implementation, you would:
        // 1. Load the PDF with pdf-lib
        // 2. Locate the text content that needs to be edited
        // 3. Remove the old content
        // 4. Add the new content while preserving formatting
        // 5. Remove the edit annotations
        // 6. Save the modified PDF

        // For this demo, we'll simulate by marking edits as applied:

        // Load the PDF
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdfDoc = await loadingTask.promise;

        // Mark edits as applied
        const appliedEdits = edits.map(edit => ({
            ...edit,
            status: 'applied',
            appliedAt: Date.now()
        }));

        // Extract existing annotations
        const existingAnnotations = await extractAnnotations(pdfBuffer);

        // Filter out edit annotations that have been applied
        const filteredAnnotations = existingAnnotations.filter(
            ann => !(ann.type === 'edit' && edits.some(e => e.id === ann.id))
        );

        // Add new annotations for the applied edits
        const allAnnotations = [
            ...filteredAnnotations,
            ...appliedEdits
        ];

        // Save the updated annotations to the PDF
        return await saveAnnotations(pdfBuffer, allAnnotations);
    } catch (error) {
        console.error('Error applying text edits:', error);
        throw error;
    }
}

/**
 * Export a PDF with annotations rendered directly into the content
 */
async function exportWithRenderedAnnotations(pdfBuffer, annotations) {
    try {
        // In a real implementation, you would:
        // 1. Load the PDF with pdf-lib
        // 2. For each page, render all annotations directly into the content
        //    - Highlights would become colored backgrounds
        //    - Notes would become text boxes
        //    - Redactions would become black rectangles
        //    - Edits would directly replace the text
        // 3. Save the modified PDF without the original annotation objects

        // For this demo, we'll mark annotations as rendered and return the PDF

        // Mark annotations as rendered
        const renderedAnnotations = annotations.map(annotation => ({
            ...annotation,
            rendered: true,
            renderedAt: Date.now()
        }));

        // Save annotations with our custom "rendered" flag
        // In a real implementation, we'd create a new PDF with the annotations drawn into it
        return await saveAnnotations(pdfBuffer, renderedAnnotations);
    } catch (error) {
        console.error('Error exporting PDF with rendered annotations:', error);
        throw error;
    }
}

/**
 * Extract text from a specific region of a PDF page
 */
async function getTextFromRegion(pdfBuffer, pageNumber, rect) {
    try {
        // Load the PDF
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdfDoc = await loadingTask.promise;

        // Get the specified page
        const page = await pdfDoc.getPage(pageNumber);

        // Get the text content
        const textContent = await page.getTextContent();

        // Get the viewport
        const viewport = page.getViewport({ scale: 1.0 });

        // Convert viewport coordinates to PDF coordinates
        const pdfRect = {
            x: rect.x / viewport.scale,
            y: (viewport.height - rect.y - rect.height) / viewport.scale, // PDF coordinates start from bottom-left
            width: rect.width / viewport.scale,
            height: rect.height / viewport.scale
        };

        // Filter text items that fall within the specified region
        let extractedText = '';

        for (const item of textContent.items) {
            const textItem = item; // Type assertion removed

            // Check if the text item is inside our region
            if (
                textItem.transform[4] >= pdfRect.x &&
                textItem.transform[4] <= pdfRect.x + pdfRect.width &&
                textItem.transform[5] >= pdfRect.y &&
                textItem.transform[5] <= pdfRect.y + pdfRect.height
            ) {
                extractedText += textItem.str + ' ';
            }
        }

        return extractedText.trim();
    } catch (error) {
        console.error('Error extracting text from region:', error);
        throw error;
    }
}

/**
 * Search for text in the PDF
 */
async function searchTextInPDF(pdfBuffer, searchText, options) {
    try {
        // Load the PDF
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdfDoc = await loadingTask.promise;

        const results = [];
        const { matchCase = false, wholeWord = false, limitToPages = [] } = options || {};

        // Prepare search text
        const searchPattern = wholeWord ?
            new RegExp(`\\b${escapeRegExp(searchText)}\\b`, matchCase ? '' : 'i') :
            new RegExp(escapeRegExp(searchText), matchCase ? '' : 'i');

        // Determine which pages to search
        const pageNumbers = limitToPages.length > 0 ?
            limitToPages :
            Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);

        // Search each page
        for (const pageNumber of pageNumbers) {
            // Get the page
            const page = await pdfDoc.getPage(pageNumber);

            // Get the text content
            const textContent = await page.getTextContent();

            // Get the viewport for coordinate conversion
            const viewport = page.getViewport({ scale: 1.0 });

            // Process each text item
            for (const item of textContent.items) {
                const textItem = item; // Type assertion removed

                // Check if the text matches
                const matches = textItem.str.match(searchPattern);
                if (matches) {
                    for (const match of matches) {
                        // Find the position of the match in the text item
                        const matchIndex = textItem.str.indexOf(match);
                        if (matchIndex === -1) continue;

                        // Calculate the match position and dimensions
                        // This is a simplified approach - in a real implementation,
                        // you would use the character spacing information
                        const charWidth = textItem.width / textItem.str.length;

                        const matchPosX = textItem.transform[4] + (matchIndex * charWidth);
                        const matchWidth = match.length * charWidth;

                        // Convert PDF coordinates to viewport coordinates
                        const x = matchPosX;
                        const y = viewport.height - textItem.transform[5]; // Convert from PDF to viewport coordinates
                        const width = matchWidth;
                        const height = textItem.height;

                        results.push({
                            pageNumber,
                            rect: { x, y, width, height },
                            matchedText: match
                        });
                    }
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Error searching text in PDF:', error);
        throw error;
    }
}

/**
 * Create a summary of annotations in a PDF
 */
async function createAnnotationSummary(pdfBuffer, annotations) {
    try {
        // In a real implementation, you would:
        // 1. Create a new PDF using pdf-lib
        // 2. Add a title page with summary information
        // 3. For each annotation, create a page with:
        //    - A screenshot of the annotated area
        //    - The annotation text
        //    - Metadata about the annotation
        // 4. Return the new PDF

        // For this demo, we'll create a simple PDF-like structure

        // Group annotations by page
        const annotationsByPage = new Map();

        annotations.forEach(annotation => {
            if (!annotationsByPage.has(annotation.pageNumber)) {
                annotationsByPage.set(annotation.pageNumber, []);
            }
            annotationsByPage.get(annotation.pageNumber).push(annotation);
        });

        // Create summary text
        let summaryText = `PDF Annotation Summary
Generated: ${new Date().toISOString()}
Total Annotations: ${annotations.length}

`;

        // Add annotation details by page
        annotationsByPage.forEach((pageAnnotations, pageNumber) => {
            summaryText += `\n--- Page ${pageNumber} (${pageAnnotations.length} annotations) ---\n\n`;

            pageAnnotations.forEach((annotation, index) => {
                summaryText += `[${index + 1}] Type: ${annotation.type}\n`;

                if (annotation.content) {
                    summaryText += `    Content: ${annotation.content}\n`;
                }

                summaryText += `    Position: (${Math.round(annotation.rect.x)}, ${Math.round(annotation.rect.y)}, ${Math.round(annotation.rect.width)}x${Math.round(annotation.rect.height)})\n`;

                if (annotation.author) {
                    summaryText += `    Author: ${annotation.author}\n`;
                }

                if (annotation.createdAt) {
                    summaryText += `    Created: ${new Date(annotation.createdAt).toLocaleString()}\n`;
                }

                if (annotation.modifiedAt) {
                    summaryText += `    Modified: ${new Date(annotation.modifiedAt).toLocaleString()}\n`;
                }

                summaryText += `\n`;
            });
        });

        // Encode the summary as a PDF-like file
        // In a real implementation, you would create an actual PDF with pdf-lib
        const summaryEncoder = new TextEncoder();
        const summaryData = summaryEncoder.encode(summaryText);

        // Create a minimal PDF structure with the summary text
        const pdfHeader = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
5 0 obj
<< /Length ${summaryText.length * 2} >>
stream
BT
/F1 10 Tf
50 700 Td
(${summaryText.replace(/[()\\]/g, '\\$&').replace(/\n/g, ') Tj\n50 Td\n(')}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000234 00000 n
0000000300 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${700 + summaryText.length * 2}
%%EOF`;

        return new TextEncoder().encode(pdfHeader).buffer;
    } catch (error) {
        console.error('Error creating annotation summary:', error);
        throw error;
    }
}

// Helper function to escape regular expression special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper function to convert Base64 to JSON
function base64ToJson(base64String) {
    try {
        // Clean up the base64 string (may contain PDF artifacts)
        const cleanedBase64 = base64String.replace(/[^A-Za-z0-9+/=]/g, '');

        // Decode Base64 to binary string
        const binaryString = atob(cleanedBase64);

        // Convert to UTF-8
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert to text and parse JSON
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(bytes);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error converting Base64 to JSON:', error);
        throw error;
    }
}

// Helper function to get bounds of text elements
function getTextBounds(textItem, viewport) {
    // This is a simplified approach - in real implementation,
    // you would need to handle text direction, rotation, etc.
    const x = textItem.transform[4];
    const y = viewport.height - textItem.transform[5]; // Convert to viewport coordinates
    const width = textItem.width;
    const height = textItem.height;

    return {
        x,
        y,
        width,
        height
    };
}

// Helper function to get all fonts in a PDF
async function getAllFontsInPDF(pdfDoc) {
    const fontMap = new Map();

    // Get all pages
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const operatorList = await page.getOperatorList();

        // Extract font references
        for (let j = 0; j < operatorList.fnArray.length; j++) {
            if (operatorList.fnArray[j] === pdfjs.OPS.setFont) {
                const fontId = operatorList.argsArray[j][0];
                if (!fontMap.has(fontId)) {
                    fontMap.set(fontId, {
                        id: fontId,
                        usageCount: 0,
                        pages: new Set()
                    });
                }

                const fontInfo = fontMap.get(fontId);
                fontInfo.usageCount++;
                fontInfo.pages.add(i);
            }
        }
    }

    return Array.from(fontMap.values());
}

// Export statement removed as it's not needed in plain JavaScript for a service worker
