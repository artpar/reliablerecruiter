import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Export data to a downloadable CSV file
 */
export const exportToCSV = (
  data: Record<string, any>[],
  options: {
    filename?: string;
    headers?: Record<string, string>; // mapping of field name to display name
    includeHeaders?: boolean;
  } = {}
): void => {
  const {
    filename = 'export.csv',
    headers = {},
    includeHeaders = true,
  } = options;
  
  let csvData: string;
  
  if (includeHeaders && Object.keys(headers).length > 0) {
    // Use custom headers
    const headerFields = Object.keys(headers);
    
    // Map data to only include the specified fields with renamed headers
    const mappedData = data.map(row => {
      const newRow: Record<string, any> = {};
      headerFields.forEach(field => {
        newRow[headers[field]] = row[field];
      });
      return newRow;
    });
    
    csvData = Papa.unparse(mappedData);
  } else {
    // Use all fields and their original names
    csvData = Papa.unparse(data);
  }
  
  // Create a blob and trigger download
  downloadFile(csvData, filename, 'text/csv');
};

/**
 * Export data to a downloadable Excel file
 */
export const exportToExcel = (
  data: Record<string, any>[],
  options: {
    filename?: string;
    sheetName?: string;
    headers?: Record<string, string>; // mapping of field name to display name
  } = {}
): void => {
  const {
    filename = 'export.xlsx',
    sheetName = 'Sheet1',
    headers = {},
  } = options;
  
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Process data based on headers
  let processedData: Record<string, any>[];
  
  if (Object.keys(headers).length > 0) {
    // Use custom headers
    const headerFields = Object.keys(headers);
    
    // Map data to only include the specified fields with renamed headers
    processedData = data.map(row => {
      const newRow: Record<string, any> = {};
      headerFields.forEach(field => {
        newRow[headers[field]] = row[field];
      });
      return newRow;
    });
  } else {
    processedData = data;
  }
  
  // Convert to worksheet
  const ws = XLSX.utils.json_to_sheet(processedData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Convert to binary and trigger download
  const excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  const excelBlob = binaryStringToBlob(excelBinary, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  
  // Trigger download
  downloadBlob(excelBlob, filename);
};

/**
 * Export data to a downloadable text file
 */
export const exportToText = (
  content: string,
  options: {
    filename?: string;
  } = {}
): void => {
  const { filename = 'export.txt' } = options;
  
  // Create blob and trigger download
  downloadFile(content, filename, 'text/plain');
};

/**
 * Export data to a downloadable JSON file
 */
export const exportToJSON = (
  data: any,
  options: {
    filename?: string;
    pretty?: boolean;
  } = {}
): void => {
  const { filename = 'export.json', pretty = true } = options;
  
  // Convert data to JSON string
  const jsonContent = pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
  
  // Create blob and trigger download
  downloadFile(jsonContent, filename, 'application/json');
};

/**
 * Export HTML content to a downloadable HTML file
 */
export const exportToHTML = (
  content: string,
  options: {
    filename?: string;
    includeBasicStyles?: boolean;
  } = {}
): void => {
  const { filename = 'export.html', includeBasicStyles = true } = options;
  
  // Add basic styling if requested
  let finalContent = content;
  
  if (includeBasicStyles) {
    finalContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${filename}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          p {
            margin-bottom: 1em;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }
  
  // Create blob and trigger download
  downloadFile(finalContent, filename, 'text/html');
};

/* Helper Functions */

/**
 * Download a string as a file
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
};

/**
 * Download a blob as a file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Convert binary string to blob
 */
const binaryStringToBlob = (binary: string, mimeType: string): Blob => {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return new Blob([bytes], { type: mimeType });
};

export default {
  exportToCSV,
  exportToExcel,
  exportToText,
  exportToJSON,
  exportToHTML,
};
