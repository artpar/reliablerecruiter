import { WorkerService } from './WorkerService';

// Types for annotations
export interface PDFAnnotation {
    id: string;
    type: 'highlight' | 'note' | 'redaction' | 'edit';
    pageNumber: number;
    rect: { x: number; y: number; width: number; height: number };
    content?: string;
    color?: string;
    author?: string;
    createdAt?: number;
    modifiedAt?: number;
}

/**
 * Service for managing PDF annotations
 */
export class PDFAnnotationService {
    /**
     * Save annotations to the PDF document
     * This preserves the original PDF structure and adds annotations as an overlay
     */
    static async saveAnnotations(
        pdfBuffer: ArrayBuffer,
        annotations: PDFAnnotation[]
    ): Promise<ArrayBuffer> {
        try {
            // Add metadata to annotations before saving
            const annotationsWithMetadata = annotations.map(annotation => ({
                ...annotation,
                modifiedAt: Date.now(),
                createdAt: annotation.createdAt || Date.now()
            }));

            // Use the worker to process annotations without blocking the main thread
            return await WorkerService.executeTask<
                { pdfBuffer: ArrayBuffer; annotations: PDFAnnotation[]; action?: string },
                ArrayBuffer
            >('pdfAnnotationWorker', {
                pdfBuffer,
                annotations: annotationsWithMetadata,
                action: 'save'
            });
        } catch (error) {
            console.error('Failed to save annotations:', error);
            throw new Error(`Failed to save annotations: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Extract annotations from a PDF document
     */
    static async extractAnnotations(pdfBuffer: ArrayBuffer): Promise<PDFAnnotation[]> {
        try {
            // Use the worker to extract annotations
            return await WorkerService.executeTask<
                { pdfBuffer: ArrayBuffer; action: string },
                PDFAnnotation[]
            >('pdfAnnotationWorker', {
                pdfBuffer,
                action: 'extract'
            });
        } catch (error) {
            console.error('Failed to extract annotations:', error);
            // Return empty array if extraction fails - we don't want to break the application
            return [];
        }
    }

    /**
     * Apply redactions to a PDF document
     * This permanently removes the redacted content from the PDF
     */
    static async applyRedactions(
        pdfBuffer: ArrayBuffer,
        redactions: PDFAnnotation[]
    ): Promise<ArrayBuffer> {
        try {
            // Filter only redaction annotations
            const redactionAnnotations = redactions.filter(ann => ann.type === 'redaction');

            // Use the worker to apply redactions
            return await WorkerService.executeTask<
                { pdfBuffer: ArrayBuffer; annotations: PDFAnnotation[]; action: string },
                ArrayBuffer
            >('pdfAnnotationWorker', {
                pdfBuffer,
                annotations: redactionAnnotations,
                action: 'redact'
            });
        } catch (error) {
            console.error('Failed to apply redactions:', error);
            throw new Error(`Failed to apply redactions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Apply text edits to a PDF document
     * This replaces the specified text areas with edited content
     */
    static async applyTextEdits(
        pdfBuffer: ArrayBuffer,
        edits: PDFAnnotation[]
    ): Promise<ArrayBuffer> {
        try {
            // Filter only edit annotations
            const editAnnotations = edits.filter(ann => ann.type === 'edit' && ann.content !== undefined);

            // Use the worker to apply text edits
            return await WorkerService.executeTask<
                { pdfBuffer: ArrayBuffer; annotations: PDFAnnotation[]; action: string },
                ArrayBuffer
            >('pdfAnnotationWorker', {
                pdfBuffer,
                annotations: editAnnotations,
                action: 'edit'
            });
        } catch (error) {
            console.error('Failed to apply text edits:', error);
            throw new Error(`Failed to apply text edits: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Export PDF with all annotations rendered as part of the document
     * This creates a new PDF with annotations rendered as part of the content
     */
    static async exportWithRenderedAnnotations(
        pdfBuffer: ArrayBuffer,
        annotations: PDFAnnotation[]
    ): Promise<ArrayBuffer> {
        try {
            // Use the worker to create a new PDF with rendered annotations
            return await WorkerService.executeTask<
                { pdfBuffer: ArrayBuffer; annotations: PDFAnnotation[]; action: string },
                ArrayBuffer
            >('pdfAnnotationWorker', {
                pdfBuffer,
                annotations,
                action: 'export'
            });
        } catch (error) {
            console.error('Failed to export PDF with annotations:', error);
            throw new Error(`Failed to export: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get text content from a specific area of the PDF
     * Useful for extracting text under an annotation
     */
    static async getTextFromRegion(
        pdfBuffer: ArrayBuffer,
        pageNumber: number,
        rect: { x: number; y: number; width: number; height: number }
    ): Promise<string> {
        try {
            // Use the worker to extract text from a specific region
            return await WorkerService.executeTask<
                {
                    pdfBuffer: ArrayBuffer;
                    pageNumber: number;
                    rect: any;
                    action: string
                },
                string
            >('pdfAnnotationWorker', {
                pdfBuffer,
                pageNumber,
                rect,
                action: 'extractText'
            });
        } catch (error) {
            console.error('Failed to extract text from region:', error);
            return '';
        }
    }

    /**
     * Search for text in the PDF and return matching regions
     * Useful for creating annotations based on text search
     */
    static async searchText(
        pdfBuffer: ArrayBuffer,
        searchText: string,
        options?: {
            matchCase?: boolean;
            wholeWord?: boolean;
            limitToPages?: number[];
        }
    ): Promise<Array<{
        pageNumber: number;
        rect: { x: number; y: number; width: number; height: number };
        matchedText: string;
    }>> {
        try {
            // Use the worker to search for text
            return await WorkerService.executeTask<
                {
                    pdfBuffer: ArrayBuffer;
                    searchText: string;
                    options?: any;
                    action: string
                },
                any[]
            >('pdfAnnotationWorker', {
                pdfBuffer,
                searchText,
                options,
                action: 'search'
            });
        } catch (error) {
            console.error('Failed to search text in PDF:', error);
            return [];
        }
    }

    /**
     * Merge two sets of annotations, resolving conflicts
     * Useful when multiple people have annotated the same document
     */
    static mergeAnnotations(
        baseAnnotations: PDFAnnotation[],
        newAnnotations: PDFAnnotation[],
        conflictResolution: 'keepBase' | 'keepNew' | 'keepBoth' = 'keepBoth'
    ): PDFAnnotation[] {
        // Create a map of base annotations by ID for quick lookup
        const baseAnnotationsMap = new Map<string, PDFAnnotation>();
        baseAnnotations.forEach(annotation => {
            baseAnnotationsMap.set(annotation.id, annotation);
        });

        // Create a result array starting with base annotations
        const result: PDFAnnotation[] = [...baseAnnotations];

        // Process each new annotation
        newAnnotations.forEach(newAnnotation => {
            // Check if there's a conflict (same ID)
            if (baseAnnotationsMap.has(newAnnotation.id)) {
                const baseAnnotation = baseAnnotationsMap.get(newAnnotation.id)!;

                // Handle conflict based on resolution strategy
                switch (conflictResolution) {
                    case 'keepBase':
                        // Keep the base annotation (do nothing)
                        break;
                    case 'keepNew':
                        // Replace the base annotation with the new one
                        const baseIndex = result.findIndex(a => a.id === newAnnotation.id);
                        if (baseIndex !== -1) {
                            result[baseIndex] = newAnnotation;
                        }
                        break;
                    case 'keepBoth':
                        // Keep both by generating a new ID for the new annotation
                        const uniqueNewAnnotation = {
                            ...newAnnotation,
                            id: `${newAnnotation.id}-${Date.now()}`
                        };
                        result.push(uniqueNewAnnotation);
                        break;
                }
            } else {
                // No conflict, add the new annotation
                result.push(newAnnotation);
            }
        });

        return result;
    }

    /**
     * Filter annotations by type, page, or other criteria
     */
    static filterAnnotations(
        annotations: PDFAnnotation[],
        filters: {
            types?: ('highlight' | 'note' | 'redaction' | 'edit')[];
            pageNumbers?: number[];
            author?: string;
            afterDate?: number;
            beforeDate?: number;
        }
    ): PDFAnnotation[] {
        return annotations.filter(annotation => {
            // Filter by type
            if (filters.types && !filters.types.includes(annotation.type)) {
                return false;
            }

            // Filter by page number
            if (filters.pageNumbers && !filters.pageNumbers.includes(annotation.pageNumber)) {
                return false;
            }

            // Filter by author
            if (filters.author && annotation.author !== filters.author) {
                return false;
            }

            // Filter by creation date range
            if (annotation.createdAt) {
                if (filters.afterDate && annotation.createdAt < filters.afterDate) {
                    return false;
                }

                if (filters.beforeDate && annotation.createdAt > filters.beforeDate) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Create a PDF with a summary of all annotations
     * Useful for reviewing all annotations in a document
     */
    static async createAnnotationSummary(
        pdfBuffer: ArrayBuffer,
        annotations: PDFAnnotation[]
    ): Promise<ArrayBuffer> {
        try {
            return await WorkerService.executeTask<
                { pdfBuffer: ArrayBuffer; annotations: PDFAnnotation[]; action: string },
                ArrayBuffer
            >('pdfAnnotationWorker', {
                pdfBuffer,
                annotations,
                action: 'summarize'
            });
        } catch (error) {
            console.error('Failed to create annotation summary:', error);
            throw new Error(`Failed to create summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default PDFAnnotationService;
