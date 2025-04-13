import React, {useEffect, useRef, useState} from 'react';
import {AnnotationDto, TsPdfViewer, TsPdfViewerOptions} from 'ts-pdf';
import Card from './common/Card';
import {useFile} from '../context/FileContext';
import useToast from '../hooks/useToast';

// Set the PDF.js worker source path globally only once
if (typeof window !== 'undefined' && !window.pdfjsWorkerSrc) {
    window.pdfjsWorkerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    console.log('PDF.js worker source path set:', window.pdfjsWorkerSrc);
}

// Re-export ts-pdf annotation types for external use
export type PDFAnnotation = AnnotationDto;

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
}

const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
                                                       fileId,
                                                       onSave,
                                                       readOnly = false,
                                                       className = "",
                                                       height = '600px',
                                                       initialAnnotations = [],
                                                   }) => {
    // console.log(`PDFAnnotator rendering with fileId: ${fileId}`);

    const {files} = useFile();
    const {showToast} = useToast();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const [debugInfo, setDebugInfo] = useState<string[]>([]);

    // Create a unique container ID for this specific instance
    const containerId = useRef(`pdf-container-${Math.random().toString(36).substring(2)}`);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<TsPdfViewer | null>(null);

    // Add debug log function
    const addDebugLog = (message: string) => {
        // console.log(`PDFAnnotator Debug: ${message}`);
        // setDebugInfo(prev => [...prev, message]);
    };

    // Reset when fileId changes
    useEffect(() => {
        setLoading(true);
        setError(null);
        // setDebugInfo([`New fileId received: ${fileId}`]);

        // Clean up previous viewer if needed
        if (viewerRef.current) {
            addDebugLog('Cleaning up previous viewer');
            try {
                viewerRef.current.closePdfAsync().catch(e => {
                    console.error('Error closing previous viewer:', e);
                });
                viewerRef.current = null;
            } catch (err) {
                console.error('Error in cleanup:', err);
            }
        }
    }, [fileId]);

    useEffect(() => {
        console.log('Pdf viewer:', viewerRef.current, initialAnnotations);
        if (viewerRef.current) {
            viewerRef.current.importAnnotationsAsync(initialAnnotations).then(e => {
                console.log('importAnnotationsAsync');
            })
        }
    }, [initialAnnotations]);


    // Initialize PDF viewer
    useEffect(() => {
        if (!fileId) {
            addDebugLog('No fileId provided');
            return;
        }

        addDebugLog(`Starting initialization for fileId: ${fileId}`);

        // Store current mountState for cancellation
        let isMounted = true;

        const initViewer = async () => {
            try {
                addDebugLog('Checking for file');

                // Get the file
                const file = files.find(f => f.id === fileId);
                if (!file) {
                    addDebugLog(`File not found with id: ${fileId}`);
                    setError('File not found');
                    setLoading(false);
                    return;
                }

                addDebugLog(`Found file: ${file.name}`);

                // Check if it's a PDF
                if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                    addDebugLog(`Not a PDF file: ${file.type}, ${file.name}`);
                    setError('Not a PDF file');
                    setLoading(false);
                    return;
                }

                // Wait for DOM to be ready
                await new Promise(resolve => setTimeout(resolve, 500));
                if (!isMounted) {
                    addDebugLog('Component unmounted during initialization');
                    return;
                }

                // Get the container element
                addDebugLog(`Looking for container with id: ${containerId.current}`);
                const containerElement = document.getElementById(containerId.current);
                if (!containerElement) {
                    addDebugLog('Container element not found in DOM');
                    setError('Container element not found');
                    setLoading(false);
                    return;
                }

                addDebugLog('Container found, creating viewer options');

                // Set up viewer options
                const options: TsPdfViewerOptions = {
                    containerSelector: `#${containerId.current}`,
                    userName: 'HR ToolKit User',
                    enableHistory: true,
                    disableOpenAction: true,
                    disableLoadAction: readOnly,
                    disableSaveAction: readOnly,
                    disableCloseAction: false,
                    disableRotation: false,
                    workerSource: window.pdfjsWorkerSrc,
                    annotChangeCallback: detail => {
                        console.log("AnnotationChange Callback", initialAnnotations, detail);
                    }
                };

                addDebugLog('Creating PDF viewer');

                try {
                    // Create a new viewer instance
                    const pdfViewer = new TsPdfViewer(options);
                    addDebugLog('Viewer created successfully');

                    // Prepare PDF data
                    addDebugLog('Preparing PDF data');
                    let pdfData: Uint8Array;

                    if (file.content instanceof ArrayBuffer) {
                        addDebugLog('Content is ArrayBuffer, converting to Uint8Array');
                        const contentCopy = file.content.slice(0);
                        pdfData = new Uint8Array(contentCopy);
                    } else {
                        addDebugLog('Content is string, encoding to Uint8Array');
                        const encoder = new TextEncoder();
                        pdfData = encoder.encode(file.content as string);
                    }

                    addDebugLog(`PDF data prepared, length: ${pdfData.length}`);

                    // Store viewer in ref
                    viewerRef.current = pdfViewer;

                    // Open the PDF
                    addDebugLog('Opening PDF...');
                    await pdfViewer.openPdfAsync(pdfData);

                    if (!isMounted) {
                        addDebugLog('Component unmounted after opening PDF');
                        pdfViewer.closePdfAsync().catch(console.error);
                        return;
                    }

                    addDebugLog('PDF opened successfully');

                    // Update state
                    setLoading(false);

                } catch (error: any) {
                    addDebugLog(`Error creating/opening PDF viewer: ${error.message}`);
                    setError(`Failed to initialize PDF viewer: ${error.message}`);
                    setLoading(false);

                    if (viewerRef.current) {
                        try {
                            viewerRef.current.closePdfAsync().catch(console.error);
                            viewerRef.current = null;
                        } catch (e) {
                            console.error('Error closing viewer after failed init:', e);
                        }
                    }
                }

            } catch (err: any) {
                addDebugLog(`Unexpected error: ${err.message}`);
                setError(`An unexpected error occurred: ${err.message}`);
                setLoading(false);
            }
        };

        initViewer();

        return () => {
            isMounted = false;
            addDebugLog('Initialization useEffect cleanup');
        };
    }, [fileId, files, readOnly, showToast]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('PDFAnnotator unmounting');
            if (viewerRef.current) {
                try {
                    viewerRef.current.closePdfAsync().catch(console.error);
                } catch (err) {
                    console.error('Error during unmount cleanup:', err);
                }
            }
        };
    }, []);

    if (error) {
        return (<Card className="pdf-annotator-container" style={{height}}>
                <div className="pdf-error-container">
                    <p className="error-message">{error}</p>
                    <div className="debug-info">
                        Error loading PDF
                        {/*<h4>Debug Info:</h4>*/}
                        {/*<ul>*/}
                        {/*    {debugInfo.map((log, i) => (*/}
                        {/*        <li key={i}>{log}</li>*/}
                        {/*    ))}*/}
                        {/*</ul>*/}
                    </div>
                </div>
            </Card>);
    }

    return (<div className={className + " pdf-annotator-container h-full"}
                 style={{height, overflow: 'hidden', width: '100%'}}>
            <div
                id={containerId.current}
                ref={containerRef}
                className="pdf-content h-full"
                style={{minHeight: '400px', width: '100%', position: 'relative'}}
            >
                {loading && (<div className="pdf-loading" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.8)',
                        zIndex: 10
                    }}>
                        <p>Loading PDF... Please wait</p>
                    </div>)}
            </div>
        </div>);
};

export default PDFAnnotator;
