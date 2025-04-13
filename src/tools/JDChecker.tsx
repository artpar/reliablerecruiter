import React, {useEffect, useState} from 'react';
import {useFile} from '../context/FileContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Tabs, {TabItem} from '../components/common/Tabs';
import FileUpload from '../components/common/FileUpload';
import TextArea from '../components/common/TextArea';
import SuggestionList from './jd-checker/SuggestionList';
import PDFAnnotator from '../components/PDFAnnotator';
import useToast from '../hooks/useToast';
import analyzeBiasedLanguage from '../services/AnalysisService';
import PDFAnnotationService, {PDFAnnotation} from '../services/PDFAnnotationService';
import {BiasHighlighter} from "./jd-checker/BiasHighlighter"

const JDChecker: React.FC = () => {
    const {files} = useFile();
    const {showToast} = useToast();

    const [jobDescription, setJobDescription] = useState('');
    const [improvedJobDescription, setImprovedJobDescription] = useState('');
    const [analysis, setAnalysis] = useState<{ biasedTerms: any[]; score: number } | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [isPDF, setIsPDF] = useState(false);
    const [pdfAnnotations, setPdfAnnotations] = useState<PDFAnnotation[]>([]);
    const [loading, setLoading] = useState(false);

    // Effect to process uploaded file
    useEffect(() => {
        if (fileId) {
            const file = files.find(f => f.id === fileId);
            if (file) {
                processFile(file);
            }
        }
    }, [fileId, files]);

    const processFile = async (file: any) => {
        setLoading(true);
        try {
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
                // For PDFs, we'll extract text from annotations in the PDF viewer
                // Try to load existing annotations
                if (file.content instanceof ArrayBuffer) {
                    try {
                        const annotations = await PDFAnnotationService.extractAnnotations(file.content);
                        if (annotations.length > 0) {
                            setPdfAnnotations(annotations);
                        }
                    } catch (error) {
                        console.error('Error loading annotations:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing file:', error);
            showToast('Error processing file', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (files: File[]) => {
        if (files.length > 0) {
            // Reset state
            setFileId(null);
            setAnalysis(null);
            setPdfAnnotations([]);

            // The file ID will be available in the FileContext after upload
            setTimeout(() => {
                const uploadedFileId = `file-${Date.now()}-${files[0].name.replace(/[^a-zA-Z0-9]/g, '-')}`;
                setFileId(uploadedFileId);
            }, 100);
        }
    };

    const handleAnalyze = () => {
        if (!jobDescription.trim()) {
            showToast('Please enter a job description', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result = analyzeBiasedLanguage(jobDescription);
            setAnalysis(result);
            setImprovedJobDescription(jobDescription);

            // If it's a PDF, create annotations for biased terms
            if (isPDF && fileId) {
                createBiasAnnotations(result.biasedTerms);
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
        // If there are existing bias annotations, remove them
        const filteredAnnotations = pdfAnnotations.filter(
            ann => ann.type !== 'highlight' || !ann.id.startsWith('bias-')
        );

        // We need to search the PDF for each biased term
        const file = files.find(f => f.id === fileId);
        if (!file || !(file.content instanceof ArrayBuffer)) return;

        const newAnnotations: PDFAnnotation[] = [];

        try {
            // For each biased term, search the PDF and create highlight annotations
            for (const term of biasedTerms) {
                const searchResults = await PDFAnnotationService.searchText(
                    file.content,
                    term.term,
                    {matchCase: false, wholeWord: true}
                );

                for (const result of searchResults) {
                    const color = getColorForCategory(term.category);

                    newAnnotations.push({
                        id: `bias-${term.term}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        type: 'highlight',
                        pageNumber: result.pageNumber,
                        rect: result.rect,
                        color,
                        content: `Biased term (${term.category}): ${term.term}\nSuggested alternatives: ${term.alternatives.join(', ')}`
                    });
                }
            }

            // Update annotations
            const combinedAnnotations = [...filteredAnnotations, ...newAnnotations];
            setPdfAnnotations(combinedAnnotations);

            // Show count
            showToast(`Created ${newAnnotations.length} annotations for biased terms`, 'info');
        } catch (error) {
            console.error('Error creating bias annotations:', error);
            showToast('Error highlighting biased terms in PDF', 'error');
        }
    };

    // Get color for bias category
    const getColorForCategory = (category: string): string => {
        switch (category.toLowerCase()) {
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

            if (isPDF && file.content instanceof ArrayBuffer) {
                // For PDFs, create edit annotations for the improvements
                const editAnnotations: PDFAnnotation[] = [];

                // In a real implementation, you would compare the original and improved
                // text to create specific edit annotations for each change
                // For this demo, we'll create a simple note annotation

                editAnnotations.push({
                    id: `edit-improvements-${Date.now()}`,
                    type: 'note',
                    pageNumber: 1,
                    rect: {x: 50, y: 50, width: 200, height: 150},
                    content: 'Improvements made to job description:\n\n' + improvedJobDescription.substring(0, 500) +
                        (improvedJobDescription.length > 500 ? '...' : '')
                });

                // Combine with existing annotations
                const updatedAnnotations = [...pdfAnnotations.filter(ann => !ann.id.startsWith('edit-improvements-')), ...editAnnotations];

                // Save the annotations to the PDF
                const updatedPdfBuffer = await PDFAnnotationService.saveAnnotations(
                    file.content,
                    updatedAnnotations
                );

                // Update the file in FileContext
                const {dispatch} = useFile();
                dispatch({
                    type: 'UPDATE_FILE_CONTENT',
                    payload: {
                        id: fileId,
                        content: updatedPdfBuffer,
                    },
                });

                setPdfAnnotations(updatedAnnotations);
                showToast('Improvements saved to PDF as annotations', 'success');
            } else {
                // For text files, just update the content
                const {dispatch} = useFile();
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

    // Handle PDF text extraction from highlighted regions
    const handlePDFTextExtracted = (annotations: PDFAnnotation[]) => {
        // Combine all text from edit annotations
        let extractedText = '';

        const editAnnotations = annotations.filter(ann => ann.type === 'edit' && ann.content);
        if (editAnnotations.length > 0) {
            extractedText = editAnnotations.map(ann => ann.content).join('\n\n');
        }

        if (extractedText) {
            setJobDescription(extractedText);
            setImprovedJobDescription(extractedText);
        }
    };

    // Handle PDF annotation save
    const handleSaveAnnotations = async (annotations: PDFAnnotation[], pdfFileId: string) => {
        try {
            setLoading(true);

            const file = files.find(f => f.id === pdfFileId);
            if (!file || !(file.content instanceof ArrayBuffer)) {
                showToast('PDF file not found or invalid', 'error');
                return;
            }

            // Save annotations to the PDF
            const updatedPdfBuffer = await PDFAnnotationService.saveAnnotations(
                file.content,
                annotations
            );

            // Update file in context
            const {dispatch} = useFile();
            dispatch({
                type: 'UPDATE_FILE_CONTENT',
                payload: {
                    id: pdfFileId,
                    content: updatedPdfBuffer,
                },
            });

            // Update local state
            setPdfAnnotations(annotations);

            showToast('PDF annotations saved successfully', 'success');

            // Extract text from edit annotations for analysis
            handlePDFTextExtracted(annotations);
        } catch (error) {
            console.error('Error saving PDF annotations:', error);
            showToast('Error saving PDF annotations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderTabs = (): TabItem[] => {
        const tabs: TabItem[] = [
            {
                id: 'editor',
                label: 'Editor',
                content: (
                    <div className="space-y-4">
                        {isPDF && fileId ? (
                            <div className="h-[600px]">
                                <PDFAnnotator
                                    fileId={fileId}
                                    initialAnnotations={pdfAnnotations}
                                    onSave={handleSaveAnnotations}
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
                                disabled={isPDF ? pdfAnnotations.length === 0 && !jobDescription.trim() : !jobDescription.trim()}
                            >
                                Analyze for Bias
                            </Button>
                        </div>
                    </div>
                ),
            }
        ];

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
                                {analysis.biasedTerms.length} potential issues found
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
                            <BiasHighlighter text={jobDescription} biasedTerms={analysis.biasedTerms}/>
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
                                    {isPDF ? 'Save as PDF Annotation' : 'Save Improved Version'}
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
                <Tabs tabs={renderTabs()}/>
            </Card>
        </div>
    );
};

export default JDChecker;
