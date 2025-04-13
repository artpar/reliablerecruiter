import React, { useState, useEffect, useRef } from 'react';
import { TsPdfViewer, TsPdfViewerOptions, InkAnnotation, HighlightAnnotation,
    SquareAnnotation, CircleAnnotation, LineAnnotation, PolygonAnnotation,
    PolylineAnnotation, TextAnnotation, FreeTextAnnotation, StampAnnotation,
    AnnotationBase } from 'ts-pdf';
import Card from './common/Card';
import Button from './common/Button';
import { useFile } from '../context/FileContext';
import useToast from '../hooks/useToast';

// Set the PDF.js worker source path globally
// This needs to be done before any ts-pdf components are instantiated
if (typeof window !== 'undefined' && !window.pdfjsWorkerSrc) {
    // Using CDN for the worker file - in production, host this file yourself
    window.pdfjsWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';
    console.log('PDF.js worker source path set:', window.pdfjsWorkerSrc);
}

// Re-export ts-pdf annotation types for external use
export type PDFAnnotation = AnnotationBase;

// Define window property for TypeScript
declare global {
    interface Window {
        pdfjsWorkerSrc: string;
    }
}

interface PDFAnnotatorProps {
    fileId: string;
    onSave?: (annotations: PDFAnnotation[], fileId: string) => void;
    readOnly?: boolean;
    height?: string;
    initialAnnotations?: PDFAnnotation[];
}

const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
                                                       fileId,
                                                       onSave,
                                                       readOnly = false,
                                                       height = '600px',
                                                       initialAnnotations = [],
                                                   }) => {
    const { files, dispatch } = useFile();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [viewer, setViewer] = useState<TsPdfViewer | null>(null);
    const [annotations, setAnnotations] = useState<PDFAnnotation[]>(initialAnnotations);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [scale, setScale] = useState(1.5);
    const [selectedAnnotation, setSelectedAnnotation] = useState<PDFAnnotation | null>(null);
    const [annotationMode, setAnnotationMode] = useState<'ink' | 'highlight' | 'square' | 'circle' | 'text' | 'freetext' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize PDF viewer
    useEffect(() => {
        if (!containerRef.current || !fileId) return;

        const file = files.find(f => f.id === fileId);
        if (!file) {
            showToast('File not found', 'error');
            setLoading(false);
            setError('File not found');
            return;
        }

        // Check if it's a PDF
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Not a PDF file', 'error');
            setLoading(false);
            setError('Not a PDF file');
            return;
        }

        // Ensure we have the worker source set
        if (!window.pdfjsWorkerSrc) {
            window.pdfjsWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';
            console.log('PDF.js worker source path set in component:', window.pdfjsWorkerSrc);
        }

        // Set up the options for the viewer
        const options: TsPdfViewerOptions = {
            containerSelector: `#pdf-container-${fileId}`,
            userName: 'HR ToolKit User',
            enableHistory: true,
            disableOpenAction: true,
            disableLoadAction: readOnly,
            disableSaveAction: readOnly,
            disableCloseAction: false,
            disableRotation: false,
            workerSource: window.pdfjsWorkerSrc, // Explicitly provide the worker source
        };

        // Create and initialize the viewer
        try {
            console.log('Creating TsPdfViewer with options:', options);
            const pdfViewer = new TsPdfViewer(options);

            // If we have the content as ArrayBuffer, convert to Uint8Array
            let pdfData: Uint8Array;
            if (file.content instanceof ArrayBuffer) {
                pdfData = new Uint8Array(file.content);
            } else {
                // Handle string content (unlikely for PDF but just in case)
                const encoder = new TextEncoder();
                pdfData = encoder.encode(file.content as string);
            }

            // Open the PDF
            console.log('Opening PDF...');
            pdfViewer.openPdfAsync(pdfData)
                .then(() => {
                    console.log('PDF opened successfully');
                    setViewer(pdfViewer);
                    setTotalPages(pdfViewer.pagesCount);
                    setLoading(false);
                    setError(null);

                    // Import initial annotations if any
                    if (initialAnnotations?.length) {
                        console.log('Importing initial annotations:', initialAnnotations.length);
                        importAnnotations(initialAnnotations);
                    }
                })
                .catch((error) => {
                    console.error('Error opening PDF:', error);
                    showToast('Failed to open PDF: ' + error.message, 'error');
                    setLoading(false);
                    setError('Failed to open PDF: ' + error.message);
                });

            // Add event listeners for page change and annotations
            pdfViewer.addEventListener('pageChanged', (e: CustomEvent) => {
                console.log('Page changed:', e.detail.pageNumber);
                setCurrentPage(e.detail.pageNumber);
            });

            pdfViewer.addEventListener('annotationCreated', (e: CustomEvent) => {
                console.log('Annotation created');
                updateAnnotationsState();
            });

            pdfViewer.addEventListener('annotationDeleted', (e: CustomEvent) => {
                console.log('Annotation deleted');
                updateAnnotationsState();
            });

            pdfViewer.addEventListener('annotationUpdated', (e: CustomEvent) => {
                console.log('Annotation updated');
                updateAnnotationsState();
            });

            return () => {
                // Cleanup
                if (pdfViewer) {
                    console.log('Closing PDF viewer');
                    pdfViewer.closeAsync().catch(console.error);
                }
            };
        } catch (error: any) {
            console.error('Error initializing PDF viewer:', error);
            showToast('Failed to initialize PDF viewer: ' + error.message, 'error');
            setLoading(false);
            setError('Failed to initialize PDF viewer: ' + error.message);
        }
    }, [fileId, files, showToast, readOnly, initialAnnotations]);

    // Update annotations state from viewer
    const updateAnnotationsState = () => {
        if (!viewer) return;

        try {
            const currentAnnotations = viewer.getAllAnnotations();
            setAnnotations(currentAnnotations);
        } catch (error) {
            console.error('Error getting annotations:', error);
        }
    };

    // Import annotations into the viewer
    const importAnnotations = (annotations: PDFAnnotation[]) => {
        if (!viewer) return;

        try {
            // Clear existing annotations first
            viewer.deleteAllAnnotations();

            // Import each annotation
            annotations.forEach(annotation => {
                try {
                    viewer.importAnnotation(annotation);
                } catch (error) {
                    console.error('Error importing annotation:', error, annotation);
                }
            });

            updateAnnotationsState();
        } catch (error) {
            console.error('Error importing annotations:', error);
            showToast('Failed to import annotations', 'error');
        }
    };

    // Set the annotation mode
    const setAnnotationTool = (mode: 'ink' | 'highlight' | 'square' | 'circle' | 'text' | 'freetext' | null) => {
        if (!viewer) return;

        setAnnotationMode(mode);

        if (mode === null) {
            viewer.setViewerMode('text-selection'); // Default mode
            return;
        }

        viewer.setViewerMode('annotation');

        switch (mode) {
            case 'ink':
                viewer.setAnnotationCreateMode('ink');
                break;
            case 'highlight':
                viewer.setAnnotationCreateMode('highlight');
                break;
            case 'square':
                viewer.setAnnotationCreateMode('square');
                break;
            case 'circle':
                viewer.setAnnotationCreateMode('circle');
                break;
            case 'text':
                viewer.setAnnotationCreateMode('text');
                break;
            case 'freetext':
                viewer.setAnnotationCreateMode('freetext');
                break;
            default:
                viewer.setViewerMode('text-selection');
        }
    };

    // Handle page navigation
    const goToPage = (pageNumber: number) => {
        if (!viewer) return;

        if (pageNumber >= 1 && pageNumber <= totalPages) {
            viewer.goToPage(pageNumber);
            setCurrentPage(pageNumber);
        }
    };

    // Handle zoom
    const handleZoom = (zoomIn: boolean) => {
        if (!viewer) return;

        if (zoomIn) {
            viewer.zoomIn();
        } else {
            viewer.zoomOut();
        }

        // Update scale state (approximate as we don't have direct access to the scale value)
        setScale(prevScale => {
            const newScale = zoomIn ? prevScale + 0.2 : prevScale - 0.2;
            return Math.max(0.5, Math.min(3, newScale));
        });
    };

    // Save annotations
    const handleSave = () => {
        if (!viewer) return;

        try {
            const currentAnnotations = viewer.getAllAnnotations();

            if (onSave) {
                onSave(currentAnnotations, fileId);
            } else {
                // Default implementation to save annotations to file metadata
                dispatch({
                    type: 'UPDATE_FILE_METADATA',
                    payload: {
                        id: fileId,
                        metadata: {
                            annotations: currentAnnotations,
                            lastModified: Date.now(),
                        },
                    },
                });

                showToast('Annotations saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving annotations:', error);
            showToast('Failed to save annotations', 'error');
        }
    };

    // Delete selected annotation
    const handleDeleteAnnotation = () => {
        if (!viewer || !selectedAnnotation) return;

        try {
            viewer.deleteAnnotation(selectedAnnotation);
            setSelectedAnnotation(null);
            updateAnnotationsState();
        } catch (error) {
            console.error('Error deleting annotation:', error);
            showToast('Failed to delete annotation', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-neutral-600">Loading PDF...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Error Loading PDF</h3>
                <p className="text-neutral-600 mb-4">{error}</p>
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Reload Page
                </Button>
            </div>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 border-b border-neutral-200 pb-3">
                <div className="flex items-center space-x-2">
                    <button
                        className="p-1 rounded hover:bg-neutral-100"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        className="p-1 rounded hover:bg-neutral-100"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div className="border-l border-neutral-300 h-6 mx-2"></div>

                    <button
                        className="p-1 rounded hover:bg-neutral-100"
                        onClick={() => handleZoom(false)}
                        disabled={scale <= 0.5}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>

                    <span className="text-sm">{Math.round(scale * 100)}%</span>

                    <button
                        className="p-1 rounded hover:bg-neutral-100"
                        onClick={() => handleZoom(true)}
                        disabled={scale >= 3}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {!readOnly && (
                    <div className="flex items-center space-x-2">
                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'highlight' ? 'bg-yellow-100 text-yellow-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => setAnnotationTool(annotationMode === 'highlight' ? null : 'highlight')}
                            title="Highlight Text"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'text' ? 'bg-blue-100 text-blue-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => setAnnotationTool(annotationMode === 'text' ? null : 'text')}
                            title="Add Note"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'ink' ? 'bg-red-100 text-red-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => setAnnotationTool(annotationMode === 'ink' ? null : 'ink')}
                            title="Ink Tool"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'square' ? 'bg-green-100 text-green-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => setAnnotationTool(annotationMode === 'square' ? null : 'square')}
                            title="Add Square"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'circle' ? 'bg-purple-100 text-purple-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => setAnnotationTool(annotationMode === 'circle' ? null : 'circle')}
                            title="Add Circle"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'freetext' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => setAnnotationTool(annotationMode === 'freetext' ? null : 'freetext')}
                            title="Add Free Text"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>

                        <div className="border-l border-neutral-300 h-6 mx-2"></div>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                        >
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>

            {/* PDF Viewer */}
            <div className="relative flex-grow overflow-auto" style={{ height }}>
                <div
                    id={`pdf-container-${fileId}`}
                    ref={containerRef}
                    className="w-full h-full"
                ></div>
            </div>

            {/* Annotation details panel (when an annotation is selected) */}
            {selectedAnnotation && !readOnly && (
                <div className="mt-4 p-3 border rounded-md bg-neutral-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">
                            Annotation Properties
                        </h3>
                        <button
                            className="text-red-600 hover:text-red-800"
                            onClick={handleDeleteAnnotation}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-sm text-neutral-600">
                        <p>Type: {selectedAnnotation.type}</p>
                        {selectedAnnotation.author && <p>Author: {selectedAnnotation.author}</p>}
                        {selectedAnnotation.dateCreated && (
                            <p>Created: {new Date(selectedAnnotation.dateCreated).toLocaleString()}</p>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default PDFAnnotator;
