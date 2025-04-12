import React, { useState, useEffect, useRef } from 'react';
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
    const [pdfText, setPdfText] = useState<string>('');
    const [editedText, setEditedText] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [previewMode, setPreviewMode] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!fileId) return;

        const file = files.find(f => f.id === fileId);
        if (!file) {
            showToast('File not found', 'error');
            setLoading(false);
            return;
        }

        // Process the PDF content
        setLoading(true);
        extractPDFText(file.content as ArrayBuffer)
            .then(text => {
                setPdfText(text);
                setEditedText(text);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error extracting PDF text:', error);
                showToast('Failed to extract text from PDF', 'error');
                setLoading(false);
            });
    }, [fileId, files, showToast]);

    const extractPDFText = async (pdfBuffer: ArrayBuffer): Promise<string> => {
        try {
            // We'll use the existing FileProcessingService via WorkerService
            // This simulates the process for demonstration purposes
            // In a real implementation, you'd use the actual WorkerService

            // Import dynamically to avoid bundling issues
            const { processFile } = await import('../services/FileProcessingService');

            // Get file from context
            const file = files.find(f => f.id === fileId);
            if (!file) throw new Error('File not found');

            // Process the PDF content
            const text = await processFile(pdfBuffer, file.name);

            // Set total pages (simplified - in a real implementation, get this from pdfjs)
            setTotalPages(Math.max(1, Math.ceil(text.length / 3000))); // Rough estimate

            return text;
        } catch (error) {
            console.error('Error in extractPDFText:', error);
            return 'Failed to extract text from PDF. Edit mode is still available.';
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedText(e.target.value);
    };

    const handleSave = async () => {
        if (onSave) {
            onSave(editedText, fileId);
        } else {
            // Default implementation if no onSave prop is provided
            try {
                // Update the file in context with the edited text
                // In a real implementation, you would convert the text back to PDF
                // For demo purposes, we'll just store the text

                dispatch({
                    type: 'UPDATE_FILE_CONTENT',
                    payload: {
                        id: fileId,
                        content: new TextEncoder().encode(editedText).buffer,
                        contentType: 'text/plain', // Note: changing from PDF to text for demo
                    },
                });

                showToast('PDF content updated successfully', 'success');
            } catch (error) {
                console.error('Error saving PDF content:', error);
                showToast('Failed to save PDF content', 'error');
            }
        }
    };

    const handleChangePage = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);

            // In a real implementation, you would extract text for the specific page
            // For demo purposes, we'll simulate pagination by dividing the text
            const pageSize = Math.ceil(pdfText.length / totalPages);
            const startIdx = (newPage - 1) * pageSize;
            const endIdx = Math.min(startIdx + pageSize, pdfText.length);

            // Update editor cursor position
            if (editorRef.current) {
                editorRef.current.focus();
                editorRef.current.setSelectionRange(startIdx, startIdx);
                // Scroll to the position
                const lineHeight = 20; // Approximate line height
                const linesPerPage = pageSize / 50; // Rough estimate of characters per line
                editorRef.current.scrollTop = (newPage - 1) * lineHeight * linesPerPage;
            }
        }
    };

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
                    <div
                        className="w-full h-full bg-white border border-neutral-200 rounded p-4 overflow-auto whitespace-pre-wrap"
                    >
                        {editedText}
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
