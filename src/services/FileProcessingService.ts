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
 * Extract text from a PDF file (placeholder - would require PDF.js or similar)
 */
export const processPDF = (content: ArrayBuffer): Promise<string> => {
  // This is a placeholder - in a real app you would use PDF.js or a similar library
  return Promise.resolve('PDF content extraction not implemented');
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
      return processPDF(content);
    case 'txt':
    case 'json':
    case 'md':
      return processText(content);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
};

export default {
  processCSV,
  processExcel,
  processPDF,
  processText,
  processFile,
  getFileExtension,
};
