import React, {useEffect, useRef, useState} from 'react';
import {AnnotationBase, TsPdfViewer, TsPdfViewerOptions} from 'ts-pdf';
import Card from './common/Card';
import Button from './common/Button';
import {useFile} from '../context/FileContext';
import useToast from '../hooks/useToast';

// Set the PDF.js worker source path globally
// This needs to be done before any ts-pdf components are instantiated
if (typeof window !== 'undefined' && !window.pdfjsWorkerSrc) {
    // Using CDN for the worker file - in production, host this file yourself
    window.pdfjsWorkerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
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
    className?: string;
    initialAnnotations?: PDFAnnotation[];
    key?: string; // Added key prop for React to detect changes
}

const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
                                                       fileId,
                                                       onSave,
                                                       readOnly = false,
                                                       className = "",
                                                       height = '600px',
                                                       initialAnnotations = [],
                                                   }) => {
    const {files, dispatch} = useFile();
    const {showToast} = useToast();

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
    // Generate a unique ID for this instance
    const instanceId = useRef<string>(`pdf-container-${fileId}-${Date.now()}`);
    console.log("PDFAnnotator", instanceId, initialAnnotations);

    // Cleanup function to be called on component unmount
    useEffect(() => {
        return () => {
            // Close the viewer if it exists
            if (viewer) {
                try {
                    console.log('Closing PDF viewer on unmount');
                    viewer.closePdfAsync().catch(console.error);
                } catch (err) {
                    console.warn('Error closing PDF viewer during unmount:', err);
                }
            }
        };
    }, [viewer]);

    // Initialize PDF viewer
    useEffect(() => {
        if (!containerRef.current || !fileId) return;

        // Get the file
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

        // Set up the options for the viewer
        const options: TsPdfViewerOptions = {
            containerSelector: `#${instanceId.current}`,
            userName: 'HR ToolKit User',
            enableHistory: true,
            disableOpenAction: true,
            disableLoadAction: readOnly,
            disableSaveAction: readOnly,
            disableCloseAction: false,
            disableRotation: false,
            workerSource: window.pdfjsWorkerSrc, // Explicitly provide the worker source
        };

        // Create a variable to track if the component is still mounted
        let isMounted = true;

        try {
            console.log('Creating TsPdfViewer with options:', options);
            let pdfViewer: TsPdfViewer | null = null;

            // Small delay to ensure DOM is fully ready
            setTimeout(() => {
                if (!isMounted) return;

                try {
                    // Create a new viewer instance
                    pdfViewer = new TsPdfViewer(options);

                    // If we have the content as ArrayBuffer, convert to Uint8Array
                    let pdfData: Uint8Array;
                    if (file.content instanceof ArrayBuffer) {
                        try {
                            // Create a new copy of the ArrayBuffer to prevent detached buffer issues
                            const contentCopy = file.content.slice(0);
                            pdfData = new Uint8Array(contentCopy);
                        } catch (error) {
                            console.error('Error creating Uint8Array from ArrayBuffer:', error);
                            throw new Error('Failed to process PDF data: ' + error.message);
                        }
                    } else {
                        // Handle string content (unlikely for PDF but just in case)
                        const encoder = new TextEncoder();
                        pdfData = encoder.encode(file.content as string);
                    }

                    // Open the PDF
                    console.log('Opening PDF...');
                    pdfViewer.openPdfAsync(pdfData)
                        .then(() => {
                            if (!isMounted) return;

                            console.log('PDF opened successfully');
                            setViewer(pdfViewer);
                            setTotalPages(pdfViewer!.pagesCount);
                            setLoading(false);
                            setError(null);

                            // Import initial annotations if any
                            if (initialAnnotations?.length) {
                                console.log('Importing initial annotations:', initialAnnotations.length);
                                importAnnotations(initialAnnotations);
                            }
                        })
                        .catch((error) => {
                            if (!isMounted) return;

                            console.error('Error opening PDF:', error);
                            showToast('Failed to open PDF: ' + error.message, 'error');
                            setLoading(false);
                            setError('Failed to open PDF: ' + error.message);
                        });
                } catch (error: any) {
                    if (!isMounted) return;

                    console.error('Error initializing PDF viewer:', error);
                    showToast('Failed to initialize PDF viewer: ' + error.message, 'error');
                    setLoading(false);
                    setError('Failed to initialize PDF viewer: ' + error.message);
                }
            }, 50);

            return () => {
                // Mark component as unmounted
                isMounted = false;

                // Cleanup
                if (pdfViewer) {
                    console.log('Closing PDF viewer');
                    try {
                        pdfViewer.closePdfAsync().catch(console.error);
                        setViewer(null);
                    } catch (err) {
                        console.warn('Error during PDF viewer cleanup:', err);
                    }
                }
            };
        } catch (error: any) {
            console.error('Error initializing PDF viewer:', error);
            showToast('Failed to initialize PDF viewer: ' + error.message, 'error');
            setLoading(false);
            setError('Failed to initialize PDF viewer: ' + error.message);
            return () => {
                isMounted = false;
            };
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
                    type: 'UPDATE_FILE_METADATA', payload: {
                        id: fileId, metadata: {
                            annotations: currentAnnotations, lastModified: Date.now(),
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

    // Navigation helpers
    const handlePreviousPage = () => goToPage(currentPage - 1);
    const handleNextPage = () => goToPage(currentPage + 1);
    const handleZoomIn = () => handleZoom(true);
    const handleZoomOut = () => handleZoom(false);
    const handleSaveAnnotations = () => handleSave();

    if (error) {
        return (<Card className="pdf-annotator-container" style={{height}}>
            <div className="pdf-error-container">
                <p className="error-message">{error}</p>
            </div>
        </Card>);
    }

    return (
        <div className={className + " pdf-annotator-container h-full"} style={{height, overflow: 'hidden', width: '100%'}}>
            <div className="pdf-toolbar">
                {!readOnly && (<div className="annotation-tools">
                    <Button
                        onClick={() => setAnnotationMode(annotationMode === 'highlight' ? null : 'highlight')}
                        variant={annotationMode === 'highlight' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Highlight
                    </Button>
                    <Button
                        onClick={() => setAnnotationMode(annotationMode === 'ink' ? null : 'ink')}
                        variant={annotationMode === 'ink' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Ink
                    </Button>
                    <Button
                        onClick={() => setAnnotationMode(annotationMode === 'square' ? null : 'square')}
                        variant={annotationMode === 'square' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Square
                    </Button>
                    <Button
                        onClick={() => setAnnotationMode(annotationMode === 'circle' ? null : 'circle')}
                        variant={annotationMode === 'circle' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Circle
                    </Button>
                    <Button
                        onClick={() => setAnnotationMode(annotationMode === 'text' ? null : 'text')}
                        variant={annotationMode === 'text' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Text
                    </Button>
                    <Button
                        onClick={() => setAnnotationMode(annotationMode === 'freetext' ? null : 'freetext')}
                        variant={annotationMode === 'freetext' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Free Text
                    </Button>
                    {selectedAnnotation && (<Button
                        onClick={handleDeleteAnnotation}
                        variant="danger"
                        size="sm"
                    >
                        Delete
                    </Button>)}
                </div>)}
                <div className="navigation-tools">
                    <Button
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1 || loading}
                        size="sm"
                    >
                        Previous
                    </Button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages || loading}
                        size="sm"
                    >
                        Next
                    </Button>
                    <Button
                        onClick={handleZoomIn}
                        disabled={loading}
                        size="sm"
                    >
                        Zoom In
                    </Button>
                    <Button
                        onClick={handleZoomOut}
                        disabled={loading}
                        size="sm"
                    >
                        Zoom Out
                    </Button>
                    {onSave && (<Button
                        onClick={handleSaveAnnotations}
                        variant="success"
                        size="sm"
                        disabled={loading}
                    >
                        Save Annotations
                    </Button>)}
                </div>
            </div>
            <div
                id={instanceId.current}
                ref={containerRef}
                key={instanceId.current} // Add key to force React to recreate this element
                className="pdf-content h-full"
                style={{minHeight: '400px', width: '100%', position: 'relative'}}
            >
                {loading && (<div className="pdf-loading">
                    <p>Loading PDF...</p>
                </div>)}
            </div>
        </div>);
};

export default PDFAnnotator;
