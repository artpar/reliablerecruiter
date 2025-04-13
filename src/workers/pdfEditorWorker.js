// src/workers/pdfEditorWorker.js
import * as pdfjs from 'pdfjs-dist';

// Set the worker source path
const workerVersion = '4.10.38';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

// Listen for messages from the main thread
self.onmessage = async (event) => {
    try {
        const { action, content, text, pageNumber } = event.data;

        let result;
        switch (action) {
            case 'extract':
                result = await extractPDFText(content);
                break;
            case 'edit':
                if (text === undefined) {
                    throw new Error('Text is required for edit action');
                }
                result = await editPDFText(content, text, pageNumber || 1);
                break;
            case 'create':
                if (text === undefined) {
                    throw new Error('Text is required for create action');
                }
                result = await createPDFFromText(text);
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

// Extract text from a PDF
async function extractPDFText(content) {
    try {
        // Load the PDF document
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(content) });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Get the total number of pages
        const numPages = pdf.numPages;

        // Iterate through each page to extract text
        for (let i = 1; i <= numPages; i++) {
            try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Extract text from the page
                const pageText = textContent.items
                    .map((item) => item.str)
                    .join(' ');

                fullText += pageText + '\n\n';
            } catch (pageError) {
                console.error(`Error processing page ${i}:`, pageError);
                // Continue with other pages even if one fails
            }
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error in extractPDFText:', error);
        throw error;
    }
}

// Edit text in a PDF
async function editPDFText(content, text, pageNumber) {
    // In a real implementation, you would use PDF-LIB or a similar library
    // to modify the PDF structure and replace text while maintaining formatting

    // For demonstration purposes, we'll simulate editing by creating a new PDF
    try {
        // Load the original PDF to get the total number of pages
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(content) });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        // Extract text from all pages
        const pageTexts = [];
        for (let i = 1; i <= numPages; i++) {
            try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map((item) => item.str)
                    .join(' ');

                pageTexts.push(pageText);
            } catch (error) {
                pageTexts.push(''); // Empty placeholder for failed pages
            }
        }

        // Replace text on the specified page
        if (pageNumber > 0 && pageNumber <= pageTexts.length) {
            pageTexts[pageNumber - 1] = text;
        }

        // Combine all texts and create a new PDF
        const combinedText = pageTexts.join('\n\n');
        return await createPDFFromText(combinedText);
    } catch (error) {
        console.error('Error in editPDFText:', error);
        throw error;
    }
}

// Create a new PDF from text (simplified version)
async function createPDFFromText(text) {
    // In a real implementation, you would use PDF-LIB or jsPDF
    // For demonstration purposes, we'll create a simple PDF structure

    // This is a very simplified PDF structure
    const pdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${text.length * 2} >>
stream
BT
/F1 12 Tf
36 700 Td
(${text.replace(/[()\\]/g, '\\$&')}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000216 00000 n
0000000283 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + text.length * 2}
%%EOF`;

    const encoder = new TextEncoder();
    return encoder.encode(pdfContent).buffer;
}
