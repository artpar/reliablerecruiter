import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';
import Button from './common/Button';
import Card from './common/Card';
import { useFile } from '../context/FileContext';
import useToast from '../hooks/useToast';

// Set the worker source
const workerVersion = '5.1.91';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.mjs`;

interface Annotation {
    id: string;
    type: 'highlight' | 'note' | 'redaction' | 'edit';
    pageNumber: number;
    rect: { x: number; y: number; width: number; height: number };
    content?: string;
    color?: string;
}

interface PDFAnnotatorProps {
    fileId: string;
    onSave?: (annotations: Annotation[], fileId: string) => void;
    readOnly?: boolean;
    height?: string;
    initialAnnotations?: Annotation[];
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
    const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [scale, setScale] = useState(1.5);
    const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
    const [annotationMode, setAnnotationMode] = useState<'highlight' | 'note' | 'redaction' | 'edit' | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

    console.log("PDFAnnotator.annotations", annotations);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const annotationLayerRef = useRef<HTMLDivElement>(null);

    // Load PDF document
    useEffect(() => {
        if (!fileId) return;

        const file = files.find(f => f.id === fileId);
        if (!file) {
            showToast('File not found', 'error');
            setLoading(false);
            return;
        }

        // Check if it's a PDF
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Not a PDF file', 'error');
            setLoading(false);
            return;
        }

        // Load the PDF
        setLoading(true);
        const loadPDF = async () => {
            try {
                // Create a new Uint8Array from the ArrayBuffer to prevent detachment issues
                let pdfData: Uint8Array;
                if (file.content instanceof ArrayBuffer) {
                    // Make a copy of the ArrayBuffer content
                    pdfData = new Uint8Array(file.content.slice(0));
                    // Store this for potential later use
                    setPdfBytes(pdfData);
                } else {
                    // Handle string content (unlikely for PDF but just in case)
                    const encoder = new TextEncoder();
                    pdfData = encoder.encode(file.content as string);
                    setPdfBytes(pdfData);
                }

                // Load the PDF document
                const loadingTask = pdfjs.getDocument({ data: pdfData });
                const pdf = await loadingTask.promise;

                setPdfDocument(pdf);
                setTotalPages(pdf.numPages);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', error);
                showToast('Failed to load PDF', 'error');
                setLoading(false);
            }
        };

        loadPDF();
    }, [fileId, files, showToast]);

    // Track rendering state to prevent multiple simultaneous renders
    const isRenderingRef = useRef(false);

    // Render PDF page
    useEffect(() => {
        if (!pdfDocument || !canvasRef.current) return;

        // Cancel any existing render tasks
        const cancelPreviousRender = () => {
            if (canvasRef.current) {
                // Clear the canvas to ensure we're starting fresh
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        };

        const renderPage = async () => {
            // If already rendering, don't start another render operation
            if (isRenderingRef.current) {
                return;
            }

            try {
                // Set rendering flag to true
                isRenderingRef.current = true;

                // Cancel any previous rendering
                cancelPreviousRender();

                // Get the page
                const page = await pdfDocument.getPage(currentPage);

                // Set canvas size
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current!;
                const context = canvas.getContext('2d')!;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render the page
                const renderContext = {
                    canvasContext: context,
                    viewport,
                };

                await page.render(renderContext).promise;

                // Update annotation layer size
                if (annotationLayerRef.current) {
                    annotationLayerRef.current.style.width = `${viewport.width}px`;
                    annotationLayerRef.current.style.height = `${viewport.height}px`;
                }
            } catch (error) {
                console.error('Error rendering PDF page:', error);
                showToast('Failed to render PDF page', 'error');
            } finally {
                // Reset rendering flag when done
                isRenderingRef.current = false;
            }
        };

        renderPage();
    }, [pdfDocument, currentPage, scale, showToast]);

    // Render annotations
    useEffect(() => {
        if (!annotationLayerRef.current) return;

        // Clear all existing annotation elements
        const annotationLayer = annotationLayerRef.current;
        annotationLayer.innerHTML = '';

        // Filter annotations for the current page
        const pageAnnotations = annotations.filter(ann => ann.pageNumber === currentPage);

        // Create annotation elements
        pageAnnotations.forEach(annotation => {
            const annotationElement = document.createElement('div');
            annotationElement.className = 'absolute';
            annotationElement.style.left = `${annotation.rect.x}px`;
            annotationElement.style.top = `${annotation.rect.y}px`;
            annotationElement.style.width = `${annotation.rect.width}px`;
            annotationElement.style.height = `${annotation.rect.height}px`;

            // Style based on annotation type
            switch (annotation.type) {
                case 'highlight':
                    annotationElement.style.backgroundColor = annotation.color || 'rgba(255, 255, 0, 0.3)';
                    annotationElement.style.pointerEvents = 'all';
                    annotationElement.style.cursor = 'pointer';
                    break;
                case 'note':
                    annotationElement.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
                    annotationElement.style.border = '1px solid blue';
                    annotationElement.style.pointerEvents = 'all';
                    annotationElement.style.cursor = 'pointer';

                    // Add note content
                    if (annotation.content) {
                        const noteContent = document.createElement('div');
                        noteContent.className = 'mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-sm';
                        noteContent.textContent = annotation.content;
                        annotationElement.appendChild(noteContent);
                    }
                    break;
                case 'redaction':
                    annotationElement.style.backgroundColor = 'black';
                    annotationElement.style.pointerEvents = 'all';
                    annotationElement.style.cursor = 'pointer';
                    break;
                case 'edit':
                    annotationElement.style.border = '1px dashed red';
                    annotationElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                    annotationElement.style.pointerEvents = 'all';
                    annotationElement.style.cursor = 'text';

                    // Add editable content
                    if (annotation.content !== undefined) {
                        const editContent = document.createElement('div');
                        editContent.className = 'w-full h-full p-1 text-sm';
                        editContent.textContent = annotation.content;

                        if (!readOnly) {
                            editContent.contentEditable = 'true';
                            editContent.addEventListener('input', (e) => {
                                // Update annotation content
                                setAnnotations(prevAnnotations =>
                                    prevAnnotations.map(ann =>
                                        ann.id === annotation.id
                                            ? { ...ann, content: (e.target as HTMLDivElement).textContent || '' }
                                            : ann
                                    )
                                );
                            });
                        }

                        annotationElement.appendChild(editContent);
                    }
                    break;
            }

            // Add click handler
            annotationElement.addEventListener('click', () => {
                if (!readOnly) {
                    setSelectedAnnotation(annotation);
                }
            });

            // Add to annotation layer
            annotationLayer.appendChild(annotationElement);
        });
    }, [annotations, currentPage, readOnly]);

    // Drawing annotations
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (readOnly || !annotationMode) return;

        // Get mouse position relative to annotation layer
        const rect = annotationLayerRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setStartPoint({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !startPoint) return;

        // Get current mouse position
        const rect = annotationLayerRef.current!.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Create temporary visual feedback for the drawing
        const tempAnnotation = document.createElement('div');
        tempAnnotation.className = 'absolute';

        // Calculate rectangle dimensions
        const x = Math.min(startPoint.x, currentX);
        const y = Math.min(startPoint.y, currentY);
        const width = Math.abs(currentX - startPoint.x);
        const height = Math.abs(currentY - startPoint.y);

        tempAnnotation.style.left = `${x}px`;
        tempAnnotation.style.top = `${y}px`;
        tempAnnotation.style.width = `${width}px`;
        tempAnnotation.style.height = `${height}px`;

        // Style based on annotation type
        switch (annotationMode) {
            case 'highlight':
                tempAnnotation.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                break;
            case 'note':
                tempAnnotation.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
                tempAnnotation.style.border = '1px solid blue';
                break;
            case 'redaction':
                tempAnnotation.style.backgroundColor = 'black';
                break;
            case 'edit':
                tempAnnotation.style.border = '1px dashed red';
                tempAnnotation.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                break;
        }

        // Replace any existing temp annotation
        const existingTemp = annotationLayerRef.current!.querySelector('.temp-annotation');
        if (existingTemp) {
            annotationLayerRef.current!.removeChild(existingTemp);
        }

        tempAnnotation.classList.add('temp-annotation');
        annotationLayerRef.current!.appendChild(tempAnnotation);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !startPoint || !annotationMode) return;

        // Get end point
        const rect = annotationLayerRef.current!.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        // Calculate rectangle dimensions
        const x = Math.min(startPoint.x, endX);
        const y = Math.min(startPoint.y, endY);
        const width = Math.abs(endX - startPoint.x);
        const height = Math.abs(endY - startPoint.y);

        // Create an annotation if the area is not too small
        if (width > 5 && height > 5) {
            const newAnnotation: Annotation = {
                id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                type: annotationMode,
                pageNumber: currentPage,
                rect: { x, y, width, height },
                content: annotationMode === 'note' || annotationMode === 'edit' ? '' : undefined,
            };

            setAnnotations([...annotations, newAnnotation]);
            setSelectedAnnotation(newAnnotation);
        }

        // Remove temporary annotation
        const tempAnnotation = annotationLayerRef.current!.querySelector('.temp-annotation');
        if (tempAnnotation) {
            annotationLayerRef.current!.removeChild(tempAnnotation);
        }

        setIsDrawing(false);
        setStartPoint(null);
    };

    // Handle page navigation
    const goToPage = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Handle zoom
    const handleZoom = (zoomIn: boolean) => {
        setScale(prevScale => {
            const newScale = zoomIn ? prevScale + 0.2 : prevScale - 0.2;
            return Math.max(0.5, Math.min(3, newScale));
        });
    };

    // Save annotations
    const handleSave = () => {
        if (onSave) {
            onSave(annotations, fileId);
        } else {
            // Default implementation
            try {
                // Save annotations to file metadata
                dispatch({
                    type: 'UPDATE_FILE_METADATA',
                    payload: {
                        id: fileId,
                        metadata: {
                            annotations,
                            lastModified: Date.now(),
                        },
                    },
                });

                showToast('Annotations saved successfully', 'success');
            } catch (error) {
                console.error('Error saving annotations:', error);
                showToast('Failed to save annotations', 'error');
            }
        }
    };

    // Delete selected annotation
    const handleDeleteAnnotation = () => {
        if (selectedAnnotation) {
            setAnnotations(annotations.filter(ann => ann.id !== selectedAnnotation.id));
            setSelectedAnnotation(null);
        }
    };

    // Update annotation content
    const handleUpdateAnnotationContent = (content: string) => {
        if (selectedAnnotation) {
            setAnnotations(annotations.map(ann =>
                ann.id === selectedAnnotation.id
                    ? { ...ann, content }
                    : ann
            ));
        }
    };

    // Toggle annotation mode
    const toggleAnnotationMode = (mode: 'highlight' | 'note' | 'redaction' | 'edit') => {
        setAnnotationMode(current => current === mode ? null : mode);
        setSelectedAnnotation(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-neutral-600">Loading PDF...</span>
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
                            onClick={() => toggleAnnotationMode('highlight')}
                            title="Highlight Text"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'note' ? 'bg-blue-100 text-blue-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => toggleAnnotationMode('note')}
                            title="Add Note"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'redaction' ? 'bg-black text-white' : 'hover:bg-neutral-100'}`}
                            onClick={() => toggleAnnotationMode('redaction')}
                            title="Redact Content"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </button>

                        <button
                            className={`p-2 rounded text-sm ${annotationMode === 'edit' ? 'bg-red-100 text-red-800' : 'hover:bg-neutral-100'}`}
                            onClick={() => toggleAnnotationMode('edit')}
                            title="Edit Content"
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
                <div className="pdf-container relative bg-neutral-200 flex items-center justify-center min-h-full">
                    {/* Canvas for rendering PDF */}
                    <canvas ref={canvasRef} className="shadow-lg"></canvas>

                    {/* Annotation layer */}
                    <div
                        ref={annotationLayerRef}
                        className="absolute top-0 left-0 pointer-events-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    ></div>
                </div>
            </div>

            {/* Annotation details panel */}
            {selectedAnnotation && !readOnly && (
                <div className="mt-4 p-3 border rounded-md bg-neutral-50">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">
                            {selectedAnnotation.type.charAt(0).toUpperCase() + selectedAnnotation.type.slice(1)} Properties
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

                    {(selectedAnnotation.type === 'note' || selectedAnnotation.type === 'edit') && (
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Content
                            </label>
                            <textarea
                                className="w-full p-2 border rounded-md text-sm"
                                rows={3}
                                value={selectedAnnotation.content || ''}
                                onChange={(e) => handleUpdateAnnotationContent(e.target.value)}
                                placeholder={`Enter ${selectedAnnotation.type} content here...`}
                            ></textarea>
                        </div>
                    )}

                    {selectedAnnotation.type === 'highlight' && (
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Highlight Color
                            </label>
                            <div className="flex space-x-2">
                                {['rgba(255, 255, 0, 0.3)', 'rgba(0, 255, 0, 0.3)', 'rgba(0, 255, 255, 0.3)', 'rgba(255, 0, 255, 0.3)'].map((color) => (
                                    <button
                                        key={color}
                                        className="w-6 h-6 rounded-full border"
                                        style={{ backgroundColor: color }}
                                        onClick={() => setAnnotations(annotations.map(ann =>
                                            ann.id === selectedAnnotation.id
                                                ? { ...ann, color }
                                                : ann
                                        ))}
                                    ></button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default PDFAnnotator;
