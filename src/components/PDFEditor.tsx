import React, { useState, useEffect, useRef } from 'react';
import { TsPdfViewer, TsPdfViewerOptions } from 'ts-pdf';
import Button from './common/Button';
import Card from './common/Card';
import { useFile } from '../context/FileContext';
import useToast from '../hooks/useToast';

interface PDFEditorProps {
    fileId: string;
    onSave?: (editedContent: string, fileId: string) => void;
    readOnly?: boolean;
    height?: string;
}

const PDFEditor: React.FC<PDFEditorProps> = ({
                                                 fileId,
                                                 onSave,
                                                 readOnly = false,
                                                 height = '600px',
                                             }) => {
    const { files, dispatch } = useFile();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [viewer, setViewer] = useState<TsPdfViewer | null>(null);
    const [pdfText, setPdfText] = useState<string>('');
    const [editedText, setEditedText] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [previewMode, setPreviewMode] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    // Initialize the PDF viewer and extract text
    useEffect(() => {
        if (!containerRef.current || !fileId) return;

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

        // Set up viewer options
        const options: TsPdfViewerOptions = {
            containerSelector: `#pdf-editor-container-${fileId}`,
            userName: 'HR ToolKit User',
            enableHistory: false,
            disableOpenAction: true,
            disableLoadAction: true,
            disableSaveAction: true,
            disableCloseAction: false,
        };

        // Create viewer and extract text
        try {
            // Convert content to appropriate format
            let pdfData: Uint8Array;
            if (file.content instanceof ArrayBuffer) {
                pdfData = new Uint8Array(file.content);
            } else {
                const encoder = new TextEncoder();
                pdfData = encoder.encode(file.content as string);
            }

            // Create viewer
            const pdfViewer = new TsPdfViewer(options);

            // Open PDF and extract text
            pdfViewer.openPdfAsync(pdfData)
                .then(async () => {
                    setViewer(pdfViewer);
                    setTotalPages(pdfViewer.pagesCount);

                    // Extract text using the ts-pdf API
                    try {
                        let fullText = '';

                        // Extract text from each page (ts-pdf doesn't have a built-in method for this)
                        // Using a simplified approach to get text from PDF.js layer if possible
                        for (let i = 1; i <= pdfViewer.pagesCount; i++) {
                            // Try to access the text layer (this is a simplified approach)
                            try {
                                // Wait for page to be rendered
                                await pdfViewer.goToPage(i);

                                // Get text from the text layer if available (simplified approach)
                                const pageContainer = document.querySelector(`#pdf-editor-container-${fileId} .page[data-page-number="${i}"] .textLayer`);
                                if (pageContainer) {
                                    const pageText = pageContainer.textContent || '';
                                    fullText += pageText + '\n\n';
                                }
                            } catch (err) {
                                console.warn(`Could not extract text from page ${i}`, err);
                            }
                        }

                        // If no text was extracted, provide a message
                        if (!fullText.trim()) {
                            fullText = 'Text extraction is not available for this PDF. Please use the PDF Annotator instead for working with this document.';
                        }

                        setPdfText(fullText);
                        setEditedText(fullText);
                        setLoading(false);
                    } catch (error) {
                        console.error('Error extracting text:', error);
                        setPdfText('Text extraction failed. Please use the PDF Annotator instead.');
                        setEditedText('Text extraction failed. Please use the PDF Annotator instead.');
                        setLoading(false);
                    }
                })
                .catch((error) => {
                    console.error('Error opening PDF:', error);
                    showToast('Failed to open PDF', 'error');
                    setLoading(false);
                });

            // Add event listener for page changes
            pdfViewer.addEventListener('pageChanged', (e: CustomEvent) => {
                setCurrentPage(e.detail.pageNumber);
            });

            return () => {
                if (pdfViewer) {
                    pdfViewer.closeAsync().catch(console.error);
                }
            };
        } catch (error) {
            console.error('Error initializing PDF editor:', error);
            showToast('Failed to initialize PDF editor', 'error');
            setLoading(false);
        }
    }, [fileId, files, showToast]);

    // Handle text editing
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedText(e.target.value);
    };

    // Handle saving edited content
    const handleSave = async () => {
        if (onSave) {
            onSave(editedText, fileId);
        } else {
            // Default implementation
            try {
                // Update the file in context with the edited text
                dispatch({
                    type: 'UPDATE_FILE_CONTENT',
                    payload: {
                        id: fileId,
                        content: new TextEncoder().encode(editedText).buffer,
                        contentType: 'text/plain', // Note: changing from PDF to text
                    },
                });

                showToast('PDF content updated successfully', 'success');
            } catch (error) {
                console.error('Error saving PDF content:', error);
                showToast('Failed to save PDF content', 'error');
            }
        }
    };

    // Handle page navigation
    const handleChangePage = (newPage: number) => {
        if (!viewer) return;

        if (newPage > 0 && newPage <= totalPages) {
            viewer.goToPage(newPage);
            setCurrentPage(newPage);

            // If in editor mode, try to update cursor position
            if (!previewMode && editorRef.current) {
                // Approximate the position in text based on page number
                const pageSize = Math.ceil(pdfText.length / totalPages);
                const startIdx = (newPage - 1) * pageSize;

                editorRef.current.focus();
                editorRef.current.setSelectionRange(startIdx, startIdx);

                // Scroll to the position
                const lineHeight = 20; // Approximate line height
                const linesPerPage = pageSize / 50; // Rough estimate of characters per line
                editorRef.current.scrollTop = (newPage - 1) * lineHeight * linesPerPage;
            }
        }
    };

    // Toggle between preview and edit modes
    const togglePreviewMode = () => {
        setPreviewMode(!previewMode);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-neutral-600">Loading PDF content...</span>
            </div>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <button
                        className="px-2 py-1 text-neutral-700 disabled:opacity-50"
                        onClick={() => handleChangePage(currentPage - 1)}
                        disabled={currentPage === 1 || previewMode}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
                    <button
                        className="px-2 py-1 text-neutral-700 disabled:opacity-50"
                        onClick={() => handleChangePage(currentPage + 1)}
                        disabled={currentPage === totalPages || previewMode}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePreviewMode}
                    >
                        {previewMode ? 'Edit Mode' : 'Preview Mode'}
                    </Button>

                    {!readOnly && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={previewMode || editedText === pdfText}
                        >
                            Save Changes
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-grow relative" style={{ height }}>
                {previewMode ? (
                    <div className="flex h-full">
                        {/* PDF Preview */}
                        <div
                            id={`pdf-editor-container-${fileId}`}
                            ref={containerRef}
                            className="w-1/2 h-full border border-neutral-200 rounded"
                        ></div>

                        {/* Text Preview */}
                        <div
                            className="w-1/2 h-full bg-white border border-neutral-200 rounded p-4 overflow-auto whitespace-pre-wrap ml-4"
                        >
                            {editedText}
                        </div>
                    </div>
                ) : (
                    <textarea
                        ref={editorRef}
                        className="w-full h-full p-4 border border-neutral-200 rounded resize-none font-mono text-sm"
                        value={editedText}
                        onChange={handleTextChange}
                        placeholder="PDF content will appear here for editing"
                        readOnly={readOnly}
                    />
                )}
            </div>
        </Card>
    );
};

export default PDFEditor;
