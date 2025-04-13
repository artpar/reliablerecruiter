import React, { useEffect, useState } from 'react';
import { useFile } from '../context/FileContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Tabs, { TabItem } from '../components/common/Tabs';
import FileUpload from '../components/common/FileUpload';
import TextArea from '../components/common/TextArea';
import SuggestionList from './jd-checker/SuggestionList';
import PDFAnnotator, { PDFAnnotation } from '../components/PDFAnnotator';
import useToast from '../hooks/useToast';
import { analyzeBiasedLanguage } from '../services/AnalyzeBiasedLanguage';
import { BiasHighlighter } from "./jd-checker/BiasHighlighter";

// No need to initialize here - PDFAnnotator handles it internally now
// The worker source is set in the PDFAnnotator component and will be used in extractBasicTextFromPDF
const JDChecker: React.FC = () => {
    const { files, dispatch } = useFile();
    const { showToast } = useToast();

    const [jobDescription, setJobDescription] = useState<string>('');
    const [improvedJobDescription, setImprovedJobDescription] = useState<string>('');
    const [analysis, setAnalysis] = useState<{ biasedTerms: any[]; score: number; categoryScores?: Record<string, number> } | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [isPDF, setIsPDF] = useState(false);
    const [pdfAnnotations, setPdfAnnotations] = useState<PDFAnnotation[]>([]);
    const [loading, setLoading] = useState(false);
    // Add a key state to force re-rendering of PDFAnnotator when needed
    const [pdfViewerKey, setPdfViewerKey] = useState<string>(`pdf-viewer-${Date.now()}`);

    // Effect to process uploaded file
    useEffect(() => {
        if (!fileId) return;

        const file = files.find(f => f.id === fileId);
        if (!file) {
            console.warn(`File with ID ${fileId} not found in FileContext`);
            return;
        }

        processFile(file);
    }, [fileId, files]);

    const processFile = async (file: any) => {
        try {
            setLoading(true);

            // Check if it's a PDF
            const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            setIsPDF(isPdfFile);

            // For text files, process immediately
            if (!isPdfFile) {
                let text = '';
                if (file.content instanceof ArrayBuffer) {
                    text = new TextDecoder().decode(file.content);
                } else {
                    text = file.content as string;
                }

                setJobDescription(text);
                setImprovedJobDescription(text);
            } else {
                // For PDFs, attempt to extract text
                if (file.content instanceof ArrayBuffer) {
                    try {
                        // Extract text using a simpler approach
                        // Note: We're using a basic text extraction rather than depending
                        // on the separate service since our PDFAnnotator already includes ts-pdf
                        const pdfText = await extractBasicTextFromPDF(file.content);

                        if (pdfText && pdfText.trim()) {
                            setJobDescription(pdfText);
                            setImprovedJobDescription(pdfText);
                        } else {
                            showToast('Could not extract text from PDF. You can still add annotations to the PDF.', 'warning');
                        }

                        // Load any existing annotations from metadata if available
                        if (file.metadata?.annotations) {
                            setPdfAnnotations(file.metadata.annotations);
                        }
                    } catch (error) {
                        console.error('Error processing PDF:', error);
                        showToast('Error extracting text from PDF. You can still view and annotate the document.', 'warning');
                    }
                } else {
                    showToast('Invalid PDF content', 'error');
                }
            }
        } catch (error) {
            console.error('Error processing file:', error);
            showToast('Error processing file', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Simple text extraction using pdfjs directly
    const extractBasicTextFromPDF = async (pdfData: ArrayBuffer): Promise<string> => {
        try {
            // Dynamically import pdfjs
            const pdfjsLib = await import('pdfjs-dist');

            // Set the worker source path before using PDF.js
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsWorkerSrc || 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
            }

            // Create a copy of the ArrayBuffer to prevent detached buffer issues
            const pdfDataCopy = pdfData.slice(0);

            // Load the document
            const loadingTask = pdfjsLib.getDocument(new Uint8Array(pdfDataCopy));
            const pdf = await loadingTask.promise;

            let fullText = '';

            // Extract text from each page
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');

                fullText += pageText + '\n\n';
            }

            return fullText.trim();
        } catch (error) {
            console.error('Error in basic text extraction:', error);
            throw new Error(`Fallback text extraction failed: ${error}`);
        }
    };

    const handleFileUpload = async (files: File[]) => {
        if (files.length > 0) {
            // Reset state
            setFileId(null);
            setAnalysis(null);
            setPdfAnnotations([]);
            setLoading(true);

            try {
                const file = files[0];
                const reader = new FileReader();

                reader.onload = async (event) => {
                    if (event.target && event.target.result) {
                        const fileContent = event.target.result as ArrayBuffer;
                        const uploadedFileId = `file-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;

                        // Create a copy of the ArrayBuffer
                        const contentCopy = fileContent.slice(0);

                        // Add file to FileContext
                        dispatch({
                            type: 'ADD_FILE', payload: {
                                id: uploadedFileId,
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                content: contentCopy
                            }
                        });

                        setFileId(uploadedFileId);
                    }
                };

                reader.onerror = () => {
                    showToast('Error reading file', 'error');
                    setLoading(false);
                };

                reader.readAsArrayBuffer(file);
            } catch (error) {
                console.error('Error uploading file:', error);
                showToast('Error uploading file', 'error');
                setLoading(false);
            }
        }
    };

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            showToast('Please enter a job description', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result = await analyzeBiasedLanguage(jobDescription);
            console.log("Analyzed language:", result);
            setAnalysis(result);
            setImprovedJobDescription(jobDescription);

            // If it's a PDF, we'll create bias annotations in the PDF
            if (isPDF && fileId) {
                console.log("Creating bias annotations for", result.biasedTerms.length, "biased terms");
                createBiasAnnotations(result.biasedTerms);

                // Generate a new key to force PDFAnnotator to re-render with a fresh instance
                setPdfViewerKey(`pdf-viewer-${Date.now()}`);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            showToast('Error analyzing job description', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Convert biased terms to PDF annotations
    const createBiasAnnotations = async (biasedTerms: any[]) => {
        // Check if biasedTerms is valid
        if (!biasedTerms || !Array.isArray(biasedTerms) || biasedTerms.length === 0) {
            console.log('No biased terms to highlight');
            return;
        }

        try {
            // Remove existing bias annotations
            const filteredAnnotations = pdfAnnotations.filter(ann =>
                !(ann.type === 'highlight' && ann.uuid && ann.uuid.startsWith('bias-')));

            // Get the file content to search for term positions
            const file = files.find(f => f.id === fileId);
            if (!file || !(file.content instanceof ArrayBuffer)) {
                console.error('PDF file content not available');
                return;
            }

            // Import the PDFAnnotationService
            const { searchText } = await import('../services/PDFAnnotationService');

            // Create new bias highlight annotations
            const newAnnotations: PDFAnnotation[] = [];

            // Process each biased term to find its position in the PDF
            for (const [index, term] of biasedTerms.entries()) {
                try {
                    // Create a unique ID for this annotation
                    const uuid = `bias-${term.term}-${Date.now()}-${index}`;

                    // Get category-specific color
                    const color = getColorForCategory(term.category);

                    // Search for the term in the PDF to get its position
                    const searchResults = await searchText(file.content as ArrayBuffer, term.term, {
                        matchCase: false,
                        wholeWord: true
                    });

                    if (searchResults && searchResults.length > 0) {
                        // Create an annotation for each occurrence of the term
                        for (const result of searchResults) {
                            const annotation: PDFAnnotation = {
                                type: 'highlight',
                                uuid: `${uuid}-${result.pageNumber}`,
                                pageIndex: result.pageNumber - 1, // Convert from 1-based to 0-based indexing
                                rects: [{
                                    x: result.rect.x,
                                    y: result.rect.y,
                                    width: result.rect.width,
                                    height: result.rect.height
                                }],
                                color,
                                author: 'Bias Checker',
                                dateCreated: new Date().toISOString(),
                                dateModified: new Date().toISOString(),
                                content: `Biased term (${term.category}): ${term.term}\nSuggested alternatives: ${term.alternatives?.join(', ') || 'No alternatives provided'}`,
                            };
                            newAnnotations.push(annotation);
                        }
                    } else {
                        // If term not found, create a default annotation on the first page
                        console.log(`Term "${term.term}" not found in PDF, creating default annotation`);
                        const defaultAnnotation: PDFAnnotation = {
                            type: 'highlight',
                            uuid,
                            pageIndex: 0,
                            rects: [{
                                x: 50,
                                y: 50 + (index * 20), // Stagger annotations if multiple terms not found
                                width: 100,
                                height: 15
                            }],
                            color,
                            author: 'Bias Checker',
                            dateCreated: new Date().toISOString(),
                            dateModified: new Date().toISOString(),
                            content: `Biased term (${term.category}): ${term.term}\nSuggested alternatives: ${term.alternatives?.join(', ') || 'No alternatives provided'}\n(Note: Exact position in PDF not found)`,
                        };
                        newAnnotations.push(defaultAnnotation);
                    }
                } catch (termError) {
                    console.error(`Error processing term "${term.term}":`, termError);
                }
            }

            // Combine existing and new annotations
            const combinedAnnotations = [...filteredAnnotations, ...newAnnotations];
            setPdfAnnotations(combinedAnnotations);

            showToast(`Created ${newAnnotations.length} annotations for biased terms`, 'info');
        } catch (error) {
            console.error('Error creating bias annotations:', error);
            showToast('Error highlighting biased terms in PDF', 'error');
        }
    };

    // Get color for bias category
    const getColorForCategory = (category: string): string => {
        switch (category?.toLowerCase()) {
            case 'gender':
                return 'rgba(255, 105, 180, 0.3)'; // Pink
            case 'age':
                return 'rgba(100, 149, 237, 0.3)'; // Blue
            case 'race':
                return 'rgba(147, 112, 219, 0.3)'; // Purple
            default:
                return 'rgba(255, 255, 0, 0.3)'; // Yellow
        }
    };

    const handleUpdateImprovedText = (updatedText: string) => {
        setImprovedJobDescription(updatedText);
    };

    const handleSaveImproved = async () => {
        if (!fileId) {
            showToast('No file to save to', 'warning');
            return;
        }

        try {
            setLoading(true);

            const file = files.find(f => f.id === fileId);
            if (!file) {
                showToast('File not found', 'error');
                return;
            }

            if (isPDF) {
                // For PDFs, we'll store the improved description in metadata
                const metadata = {
                    ...file.metadata,
                    improvedDescription: improvedJobDescription,
                    lastModified: Date.now()
                };

                dispatch({
                    type: 'UPDATE_FILE_METADATA',
                    payload: {
                        id: fileId,
                        metadata
                    }
                });

                showToast('Improvements saved with PDF', 'success');
            } else {
                // For text files, just update the content
                dispatch({
                    type: 'UPDATE_FILE_CONTENT',
                    payload: {
                        id: fileId,
                        content: improvedJobDescription,
                    },
                });

                showToast('Improvements saved', 'success');
            }
        } catch (error) {
            console.error('Error saving improvements:', error);
            showToast('Error saving improvements', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle saving PDF annotations
    const handleSavePDFAnnotations = (annotations: PDFAnnotation[], pdfFileId: string) => {
        try {
            setLoading(true);

            const file = files.find(f => f.id === pdfFileId);
            if (!file) {
                showToast('PDF file not found', 'error');
                return;
            }

            // Update the annotations in the file metadata
            const metadata = {
                ...file.metadata,
                annotations,
                lastModified: Date.now()
            };

            dispatch({
                type: 'UPDATE_FILE_METADATA',
                payload: {
                    id: pdfFileId,
                    metadata
                }
            });

            // Update local state
            setPdfAnnotations(annotations);

            showToast('PDF annotations saved successfully', 'success');
        } catch (error) {
            console.error('Error saving PDF annotations:', error);
            showToast('Error saving PDF annotations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderTabs = (): TabItem[] => {
        const tabs: TabItem[] = [{
            id: 'editor',
            label: 'Editor',
            content: (
                <div className="space-y-4">
                    {isPDF && fileId ? (
                        <div className="flex h-full min-h-[400px]">
                            <PDFAnnotator
                                key={pdfViewerKey}
                                fileId={fileId}
                                initialAnnotations={pdfAnnotations}
                                onSave={handleSavePDFAnnotations}
                                className="600px"
                            />
                        </div>
                    ) : (
                        <TextArea
                            label="Job Description"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste your job description here or upload a file..."
                            rows={15}
                        />
                    )}

                    <div className="flex justify-between">
                        <FileUpload
                            id="jd-file-upload"
                            label="Upload Job Description"
                            acceptedFileTypes=".txt,.pdf,.docx,.doc"
                            helperText="Supported file types: .txt, .pdf, .docx, .doc"
                            onUpload={handleFileUpload}
                        />
                        <Button
                            variant="primary"
                            onClick={handleAnalyze}
                            isLoading={loading}
                            disabled={!jobDescription.trim()}
                        >
                            Analyze for Bias
                        </Button>
                    </div>
                </div>
            ),
        }];

        if (analysis) {
            tabs.push({
                id: 'analysis',
                label: 'Analysis Results',
                content: (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-neutral-800">
                                Bias Score: {analysis.score}/100
                            </h2>
                            <div className="text-sm text-neutral-600">
                                {analysis.biasedTerms && Array.isArray(analysis.biasedTerms) ? analysis.biasedTerms.length : 0} potential
                                issues found
                            </div>
                        </div>

                        {isPDF ? (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
                                <p className="text-sm text-neutral-600 mb-3">
                                    Biased terms have been highlighted directly in the PDF. Return to the Editor tab to
                                    view them.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const editorTab = document.getElementById('tab-editor');
                                        if (editorTab) editorTab.click();
                                    }}
                                >
                                    Back to PDF Viewer
                                </Button>
                            </div>
                        ) : (
                            <BiasHighlighter text={jobDescription} biasedTerms={analysis.biasedTerms} />
                        )}
                    </div>
                ),
            });

            tabs.push({
                id: 'improved',
                label: 'Improved Version',
                content: (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3">
                            <TextArea
                                label="Improved Job Description"
                                value={improvedJobDescription}
                                onChange={(e) => setImprovedJobDescription(e.target.value)}
                                rows={15}
                            />
                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="primary"
                                    onClick={handleSaveImproved}
                                    isLoading={loading}
                                >
                                    {isPDF ? 'Save with PDF' : 'Save Improved Version'}
                                </Button>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <h3 className="text-lg font-medium text-neutral-800 mb-3">
                                Suggestions
                            </h3>

                            <SuggestionList
                                biasedTerms={analysis.biasedTerms}
                                originalText={jobDescription}
                                improvedText={improvedJobDescription}
                                onUpdate={handleUpdateImprovedText}
                            />
                        </div>
                    </div>
                ),
            });
        }

        return tabs;
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-800">Inclusive Job Description Checker</h1>
                <p className="text-neutral-600 mt-1">
                    Analyze job descriptions for potentially biased language and get suggestions for more inclusive
                    alternatives.
                    {isPDF && " You can annotate the PDF directly to highlight and edit biased terms."}
                </p>
            </div>

            <Card>
                <Tabs tabs={renderTabs()} />
            </Card>
        </div>
    );
};

// Add window type declaration
declare global {
    interface Window {
        pdfjsWorkerSrc?: string;
    }
}

export default JDChecker;
