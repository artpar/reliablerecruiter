import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface CSVData {
    data: Record<string, any>[];
    headers: string[];
    rawData: string;
}

/**
 * Process a CSV file to extract data
 */
export const processCSV = (content: string | ArrayBuffer): Promise<CSVData> => {
    return new Promise((resolve, reject) => {
        try {
            // Convert ArrayBuffer to string if needed
            const csvString = typeof content === 'string'
                ? content
                : new TextDecoder('utf-8').decode(content);

            Papa.parse(csvString, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || [];

                    resolve({
                        data: results.data as Record<string, any>[],
                        headers,
                        rawData: csvString,
                    });
                },
                error: (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                },
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Process an Excel file to extract data
 */
export const processExcel = (content: ArrayBuffer): Promise<Record<string, CSVData>> => {
    return new Promise((resolve, reject) => {
        try {
            // Parse the workbook
            const workbook = XLSX.read(new Uint8Array(content), {
                type: 'array',
                cellDates: true,
                cellStyles: true,
            });

            const result: Record<string, CSVData> = {};

            // Process each sheet
            workbook.SheetNames.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];

                // Convert to CSV
                const csvString = XLSX.utils.sheet_to_csv(worksheet);

                // Parse CSV data
                const parsedData = Papa.parse(csvString, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                });

                const headers = parsedData.meta.fields || [];

                result[sheetName] = {
                    data: parsedData.data as Record<string, any>[],
                    headers,
                    rawData: csvString,
                };
            });

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Extract text from a PDF file using a Web Worker
 */
import { WorkerService } from './WorkerService';

export const processPDF = (content: ArrayBuffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            // Check if Workers are available in this environment
            if (typeof Worker === 'undefined') {
                throw new Error('Web Workers are not supported in this environment');
            }

            // Use WorkerService to handle the PDF processing
            WorkerService.executeTask<{content: ArrayBuffer, action: string}, string>('pdfWorker', { content, action: 'extract' })
                .then(result => {
                    console.log("Processing PDF", result);
                    resolve(result);
                })
                .catch(error => {
                    console.error('PDF worker error:', error);
                    reject(new Error('Error processing PDF: ' + error.message));
                });
        } catch (error) {
            console.error('Error in processPDF:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    });
};

/**
 * Edit text in a PDF file using a Web Worker
 */
export const editPDF = (content: ArrayBuffer, text: string, pageNumber: number = 1): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        try {
            // Check if Workers are available in this environment
            if (typeof Worker === 'undefined') {
                throw new Error('Web Workers are not supported in this environment');
            }

            // Use WorkerService to handle the PDF editing
            WorkerService.executeTask<{content: ArrayBuffer, action: string, text: string, pageNumber: number}, ArrayBuffer>('pdfEditorWorker', { 
                content, 
                action: 'edit', 
                text, 
                pageNumber 
            })
                .then(result => {
                    console.log("Editing PDF");
                    resolve(result);
                })
                .catch(error => {
                    console.error('PDF editor worker error:', error);
                    reject(new Error('Error editing PDF: ' + error.message));
                });
        } catch (error) {
            console.error('Error in editPDF:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    });
};

/**
 * Create a new PDF from text using a Web Worker
 */
export const createPDFFromText = (text: string): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        try {
            // Check if Workers are available in this environment
            if (typeof Worker === 'undefined') {
                throw new Error('Web Workers are not supported in this environment');
            }

            // Use WorkerService to handle the PDF creation
            WorkerService.executeTask<{action: string, text: string}, ArrayBuffer>('pdfEditorWorker', { 
                action: 'create', 
                text 
            })
                .then(result => {
                    console.log("Creating PDF from text");
                    resolve(result);
                })
                .catch(error => {
                    console.error('PDF editor worker error:', error);
                    reject(new Error('Error creating PDF: ' + error.message));
                });
        } catch (error) {
            console.error('Error in createPDFFromText:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    });
};

/**
 * Process a text file
 */
export const processText = (content: string | ArrayBuffer): Promise<string> => {
    return new Promise((resolve) => {
        const text = typeof content === 'string'
            ? content
            : new TextDecoder('utf-8').decode(content);

        resolve(text);
    });
};

/**
 * Get file extension from file name
 */
export const getFileExtension = (fileName: string): string => {
    return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
};

/**
 * Process file based on its type
 */
export const processFile = async (
    content: string | ArrayBuffer,
    fileName: string
): Promise<any> => {
    const extension = getFileExtension(fileName);

    switch (extension) {
        case 'csv':
            return processCSV(content);
        case 'xlsx':
        case 'xls':
            if (typeof content === 'string') {
                throw new Error('Excel files must be processed as ArrayBuffer');
            }
            return processExcel(content);
        case 'pdf':
            if (typeof content === 'string') {
                throw new Error('PDF files must be processed as ArrayBuffer');
            }

            try {
                return await processPDF(content);
            } catch (error) {
                console.error('PDF processing failed:', error);
                // Provide a fallback message rather than throwing an error
                return 'PDF processing failed. Please try a different file format or paste the content directly.';
            }

        case 'txt':
        case 'json':
        case 'md':
        case 'docx':
        case 'doc':
            return processText(content);
        default:
            throw new Error(`Unsupported file type: ${extension}`);
    }
};

/**
 * Search text in a PDF file using a Web Worker
 */
export interface PDFSearchOptions {
    matchCase?: boolean;
    wholeWord?: boolean;
}

export interface PDFSearchResult {
    pageNumber: number;
    text: string;
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export const searchPDF = (content: ArrayBuffer, searchText: string, options: PDFSearchOptions = {}): Promise<PDFSearchResult[]> => {
    return new Promise((resolve, reject) => {
        try {
            // Check if Workers are available in this environment
            if (typeof Worker === 'undefined') {
                throw new Error('Web Workers are not supported in this environment');
            }

            // Use WorkerService to handle the PDF search
            WorkerService.executeTask<{content: ArrayBuffer, searchText: string, options: PDFSearchOptions, action: string}, PDFSearchResult[]>(
                'pdfSearchWorker', 
                { content, searchText, options, action: 'search' }
            )
                .then(results => {
                    console.log("PDF search results", results);
                    resolve(results);
                })
                .catch(error => {
                    console.error('PDF search worker error:', error);
                    reject(new Error('Error searching PDF: ' + error.message));
                });
        } catch (error) {
            console.error('Error in searchPDF:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    });
};

export default {
    processCSV,
    processExcel,
    processPDF,
    processText,
    getFileExtension,
    processFile,
    searchPDF
};
