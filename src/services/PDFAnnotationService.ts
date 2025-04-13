/**
 * Service for working with PDF annotations
 */
import serviceWorkerRegistration from './ServiceWorkerRegistrationService';
import { executePDFAnnotationTask } from '../workers/PDFWorkerManager';
import { SearchResult } from './PDFService';
import {WorkerService} from "./WorkerService";

// PDFAnnotation interface
export interface PDFAnnotation {
  id: string;
  type: 'highlight' | 'note' | 'redaction' | 'edit' | 'square' | 'circle' | 'ink' | 'freetext';
  pageNumber: number;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  color?: string;
}

/**
 * Extract text from PDF
 */
export const extractText = async (pdfData: ArrayBuffer): Promise<string> => {
  try {
    // Make sure service worker is initialized
    if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
      await serviceWorkerRegistration.initialize();
    }

    // Use the service worker to process the PDF
    return await executePDFAnnotationTask<string>('extract', pdfData);
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Search for text in PDF
 */
export const searchText = async (
  pdfData: ArrayBuffer,
  searchText: string,
  options: { matchCase?: boolean; wholeWord?: boolean } = {}
): Promise<SearchResult[]> => {
  try {
    // Make sure service worker is initialized
    if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
      await serviceWorkerRegistration.initialize();
    }

    // Use the service worker to search the PDF
    return await WorkerService.executeTask('pdfSearchWorker', {
      content: pdfData,
      action: "search",
      searchText: searchText,
      options: options
    });
    return await executePDFAnnotationTask<SearchResult[]>('search', pdfData, {
      searchText,
      ...options
    });
  } catch (error) {
    console.error('Error searching PDF:', error);
    throw new Error(`PDF search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Extract existing annotations from PDF
 */
export const extractAnnotations = async (pdfData: ArrayBuffer): Promise<PDFAnnotation[]> => {
  try {
    // Make sure service worker is initialized
    if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
      await serviceWorkerRegistration.initialize();
    }

    // Use the service worker to extract annotations
    return await executePDFAnnotationTask<PDFAnnotation[]>('extractAnnotations', pdfData);
  } catch (error) {
    console.error('Error extracting annotations from PDF:', error);
    throw new Error(`Failed to extract annotations from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Save annotations to PDF
 */
export const saveAnnotations = async (
  pdfData: ArrayBuffer,
  annotations: PDFAnnotation[]
): Promise<ArrayBuffer> => {
  try {
    // Make sure service worker is initialized
    if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
      await serviceWorkerRegistration.initialize();
    }

    // Use the service worker to save annotations
    return await executePDFAnnotationTask<ArrayBuffer>('saveAnnotations', pdfData, { annotations });
  } catch (error) {
    console.error('Error saving annotations to PDF:', error);
    throw new Error(`Failed to save annotations to PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default {
  extractText,
  searchText,
  extractAnnotations,
  saveAnnotations
};
