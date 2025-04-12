// src/tools/JDChecker.tsx
import React, { useState, useEffect } from 'react';
import useToast from "../hooks/useToast";
import { useFile } from "../context/FileContext";
import AnalysisService from "../services/AnalysisService";
import FileProcessingService from "../services/FileProcessingService";
import { isPWA } from '../registerServiceWorker';

// Component imports
import Tabs from "../components/common/Tabs";
import Card from "../components/common/Card";
import JDInput from "./jd-checker/JDInput";
import FileUpload from "../components/common/FileUpload";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import SuggestionList from "./jd-checker/SuggestionList";
import JDPreview from "./jd-checker/JDPreview";
import BiasHighlighter from "./jd-checker/BiasHighlighter";
import BiasVisualizer from "./jd-checker/BiasVisualizer";

const JDChecker: React.FC = () => {
    const { showToast } = useToast();
    const { state: fileState } = useFile();

    const [activeTab, setActiveTab] = useState('input');
    const [jobDescription, setJobDescription] = useState('');
    const [analysisResults, setAnalysisResults] = useState<{
        biasedTerms: { term: string; index: number; category: string; alternatives: string[] }[];
        score: number;
    } | null>(null);
    const [improvedJD, setImprovedJD] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPwaMode, setIsPwaMode] = useState(false);

    // Check if running in PWA mode on component mount
    useEffect(() => {
        setIsPwaMode(isPWA());
    }, []);

    // Analyze job description for biased language
    const analyzeJobDescription = async (text: string) => {
        if (!text.trim()) {
            showToast('Please enter or upload a job description', 'error');
            return;
        }

        setIsAnalyzing(true);
        setJobDescription(text);

        try {
            // Analyze the job description
            const results = await AnalysisService.analyzeBiasedLanguage(text);
            console.log("Analyzing language: ", results);
            setAnalysisResults(results);

            // Auto-generate improved version
            if (results.biasedTerms.length > 0) {
                let improved = text;

                // Apply replacements in reverse order to maintain correct indices
                [...results.biasedTerms]
                    .sort((a, b) => b.index - a.index)
                    .forEach((term) => {
                        if (term.alternatives && term.alternatives.length > 0) {
                            const replacement = term.alternatives[0];
                            improved = improved.substring(0, term.index) + replacement + improved.substring(term.index + term.term.length);
                        }
                    });

                setImprovedJD(improved);
            } else {
                setImprovedJD(text);
            }

            // Navigate to results tab
            setActiveTab('results');

            showToast(
                results.biasedTerms.length > 0
                    ? `Found ${results.biasedTerms.length} potentially biased terms`
                    : 'No biased terms found in the job description',
                results.biasedTerms.length > 0 ? 'warning' : 'success'
            );

        } catch (error) {
            console.error('Error analyzing job description:', error);
            showToast('Error analyzing job description', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];

        try {
            // Read file content as ArrayBuffer
            const fileContentBuffer = await file.arrayBuffer();

            // Process the file
            const content = await FileProcessingService.processFile(fileContentBuffer, file.name);

            // Extract text content based on file type
            let textContent = '';

            if (typeof content === 'string') {
                textContent = content;
            } else if (content && 'data' in content) {
                // For CSV data, join all fields with spaces
                textContent = content.data
                    .map((row) => Object.values(row).join(' '))
                    .join('\n');
            }

            if (textContent) {
                // Analyze the extracted text
                analyzeJobDescription(textContent);
            } else {
                showToast('Could not extract text from the file', 'error');
            }
        } catch (error) {
            console.error('Error processing file:', error);
            showToast(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    // Handle updating the job description with suggestions
    const handleUpdateJobDescription = (updatedJD: string) => {
        setImprovedJD(updatedJD);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-neutral-800">Inclusive JD Checker</h1>
            <p className="mt-2 text-neutral-600 max-w-3xl">
                Scan job descriptions for biased or exclusionary language and get suggestions
                for more inclusive alternatives.
                {isPwaMode && <span className="ml-2 text-primary-600">(Running in PWA mode)</span>}
            </p>

            <div className="mt-6">
                <Tabs
                    tabs={[
                        {
                            id: 'input',
                            label: 'Input JD',
                            content: (
                                <Card className="mt-4">
                                    <h2 className="text-xl font-semibold text-neutral-700 mb-4">Enter Job Description</h2>

                                    <JDInput
                                        onAnalyze={analyzeJobDescription}
                                        isAnalyzing={isAnalyzing}
                                    />

                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium text-neutral-700 mb-2">Or Upload a File</h3>
                                        <FileUpload
                                            id="jd-file-upload"
                                            acceptedFileTypes=".txt,.doc,.docx,.pdf,.html"
                                            helperText="Upload a job description file (TXT, DOC, DOCX, PDF, HTML)"
                                            onUpload={handleFileUpload}
                                        />
                                        {isPwaMode && (
                                            <p className="mt-2 text-xs text-primary-600">
                                                <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                PDF processing is running locally on your device in PWA mode
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            onClick={() => {
                                                if (jobDescription) {
                                                    analyzeJobDescription(jobDescription);
                                                } else {
                                                    showToast('Please enter or upload a job description', 'error');
                                                }
                                            }}
                                            isLoading={isAnalyzing}
                                            disabled={isAnalyzing}
                                            variant="primary"
                                            rightIcon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                                                </svg>
                                            }
                                        >
                                            Analyze Job Description
                                        </Button>
                                    </div>
                                </Card>
                            ),
                        },
                        {
                            id: 'results',
                            label: 'Results',
                            content: (
                                <div className="mt-4">
                                    {analysisResults ? (
                                        <>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <Card>
                                                    <h2 className="text-xl font-semibold text-neutral-700 mb-4">Analysis Results</h2>

                                                    <div className="mb-4">
                                                        <div className="flex items-center mb-2">
                                                            <span className="font-medium text-neutral-700 mr-2">Bias Score:</span>
                                                            <div className="relative w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`absolute top-0 left-0 h-full ${
                                                                        analysisResults.score < 20
                                                                            ? 'bg-success-500'
                                                                            : analysisResults.score < 50
                                                                                ? 'bg-warning-500'
                                                                                : 'bg-danger-500'
                                                                    }`}
                                                                    style={{width: `${analysisResults.score}%`}}
                                                                />
                                                            </div>
                                                            <span className="ml-2 font-medium">{analysisResults.score}%</span>
                                                        </div>

                                                        <p className="text-sm text-neutral-600">
                                                            {analysisResults.score < 20
                                                                ? 'This job description has low bias and is mostly inclusive.'
                                                                : analysisResults.score < 50
                                                                    ? 'This job description has some biased language that could be improved.'
                                                                    : 'This job description contains significant biased language and needs improvement.'
                                                            }
                                                        </p>
                                                    </div>

                                                    {analysisResults.biasedTerms.length > 0 ? (
                                                        <div>
                                                            <h3 className="font-medium text-neutral-700 mb-2">Biased Terms Found:</h3>
                                                            <BiasHighlighter
                                                                text={jobDescription}
                                                                biasedTerms={analysisResults.biasedTerms}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Alert type="success" title="No biased terms found">
                                                            This job description uses inclusive language. Great job!
                                                        </Alert>
                                                    )}
                                                </Card>

                                                <Card>
                                                    <h2 className="text-xl font-semibold text-neutral-700 mb-4">Suggested Improvements</h2>

                                                    {analysisResults.biasedTerms.length > 0 ? (
                                                        <SuggestionList
                                                            biasedTerms={analysisResults.biasedTerms}
                                                            originalText={jobDescription}
                                                            onUpdate={handleUpdateJobDescription}
                                                            improvedText={improvedJD}
                                                        />
                                                    ) : (
                                                        <p className="text-neutral-600">
                                                            No improvements needed. Your job description already uses
                                                            inclusive language.
                                                        </p>
                                                    )}
                                                </Card>
                                            </div>

                                            {analysisResults.biasedTerms.length > 0 && (
                                                <Card className="mt-6">
                                                    <h2 className="text-xl font-semibold text-neutral-700 mb-4">Bias Visualization</h2>
                                                    <BiasVisualizer biasedTerms={analysisResults.biasedTerms} />
                                                </Card>
                                            )}

                                            <Card className="mt-6">
                                                <h2 className="text-xl font-semibold text-neutral-700 mb-4">Improved Job Description</h2>
                                                <JDPreview
                                                    originalText={jobDescription}
                                                    improvedText={improvedJD}
                                                    biasedTerms={analysisResults.biasedTerms}
                                                />
                                            </Card>
                                        </>
                                    ) : (
                                        <Card>
                                            <Alert type="info">
                                                Please enter or upload a job description and click "Analyze Job Description"
                                                to see results.
                                            </Alert>
                                        </Card>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                    activeTabId={activeTab}
                    onChange={setActiveTab}
                />
            </div>
        </div>
    );
};

export default JDChecker;
