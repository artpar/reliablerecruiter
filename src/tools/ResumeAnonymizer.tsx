import React, {useEffect, useState} from 'react';
import Card from '../components/common/Card';
import Tabs, {TabItem} from '../components/common/Tabs';
import Alert from '../components/common/Alert';
import {FileInfo, useFile} from '../context/FileContext';
import useToast from '../hooks/useToast';
import ResumeUploader from './resume-anonymizer/ResumeUploader';
import AnonymizationSettings from './resume-anonymizer/AnonymizationSettings';
import AnonymizedPreview from './resume-anonymizer/AnonymizedPreview';
import {BatchExport} from './resume-anonymizer/BatchExport';
import {processFile} from '../services/FileProcessingService';
import {analyzePersonalIdentifiers, anonymizeText} from '../services/AnalysisService';

interface AnonymizedResume {
    id: string;
    fileName: string;
    originalText: string;
    anonymizedText: string;
    identifiers: { type: string; value: string; index: number }[];
    settings: AnonymizationSettings;
}

export interface AnonymizationSettings {
    replaceNames: boolean;
    replaceEmails: boolean;
    replacePhones: boolean;
    replaceAddresses: boolean;
    replaceSocial: boolean;
}

const ResumeAnonymizer: React.FC = () => {
    const {state} = useFile();
    const {showToast} = useToast();

    const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
    const [anonymizedResumes, setAnonymizedResumes] = useState<AnonymizedResume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Default anonymization settings
    const [settings, setSettings] = useState<AnonymizationSettings>({
        replaceNames: true, replaceEmails: true, replacePhones: true, replaceAddresses: true, replaceSocial: true,
    });

    // Update uploaded files when files context changes
    useEffect(() => {
        console.log("Files in context:", state.files);
        if (!state.files || Object.keys(state.files).length === 0) {
            return;
        }
        const fileArray = Object.values(state.files);
        console.log("Setting uploaded files:", fileArray);
        setUploadedFiles(fileArray);
    }, [state.files]);

    // Process all uploaded files
    const processResumes = async () => {
        // Get the latest files from context to ensure we have all uploaded files
        const currentFiles = Object.values(state.files);
        console.log("Processing resumes", currentFiles);
        
        if (currentFiles.length === 0) {
            // Only show the warning if we're not in the middle of an upload
            if (!state.isProcessing) {
                showToast('Please upload at least one resume to anonymize', 'warning');
            }
            return;
        }
        
        // Update state with the latest files
        setUploadedFiles(currentFiles);

        setIsProcessing(true);
        setError(null);

        try {
            const newAnonymizedResumes: AnonymizedResume[] = [];

            // Use the current files from context to ensure we have the latest
            const filesToProcess = currentFiles.length > 0 ? currentFiles : uploadedFiles;
            for (const file of filesToProcess) {
                try {
                    // Process file to extract text
                    const content = file.content as ArrayBuffer;
                    const text = await processFile(content, file.name);

                    // For simplicity, if the result is an object (like CSV data), we'll convert it to text
                    const resumeText = typeof text === 'string' ? text : JSON.stringify(text);

                    // Find personal identifiers
                    const {personalIdentifiers} = analyzePersonalIdentifiers(resumeText);

                    // Anonymize text
                    const {anonymizedText} = anonymizeText(resumeText, settings);

                    // Add to processed resumes
                    newAnonymizedResumes.push({
                        id: file.id,
                        fileName: file.name,
                        originalText: resumeText,
                        anonymizedText,
                        identifiers: personalIdentifiers,
                        settings: {...settings},
                    });
                } catch (fileError) {
                    console.error(`Error processing file ${file.name}:`, fileError);
                    showToast(`Error processing ${file.name}`, 'error');
                }
            }

            setAnonymizedResumes(newAnonymizedResumes);

            // Select the first resume for preview if available
            if (newAnonymizedResumes.length > 0 && !selectedResumeId) {
                setSelectedResumeId(newAnonymizedResumes[0].id);
            }

            showToast(`Successfully anonymized ${newAnonymizedResumes.length} resumes`, 'success');
        } catch (err) {
            setError('Error processing resumes. Please try again.');
            console.error('Error processing resumes:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Reprocess a single resume with updated settings
    const updateResumeAnonymization = (resumeId: string, newSettings: AnonymizationSettings) => {
        const resumeToUpdate = anonymizedResumes.find(resume => resume.id === resumeId);
        if (!resumeToUpdate) return;

        // Apply new settings to anonymize text
        const {anonymizedText} = anonymizeText(resumeToUpdate.originalText, newSettings);

        // Update the resume in the state
        setAnonymizedResumes(prevResumes => prevResumes.map(resume => resume.id === resumeId ? {
            ...resume, anonymizedText, settings: {...newSettings}
        } : resume));
    };

    // Handle settings change and apply to selected resume
    const handleSettingsChange = (newSettings: AnonymizationSettings) => {
        setSettings(newSettings);

        // If a resume is selected, update its anonymization with new settings
        if (selectedResumeId) {
            updateResumeAnonymization(selectedResumeId, newSettings);
        }
    };

    // Apply current settings to all resumes
    const applySettingsToAll = () => {
        if (anonymizedResumes.length === 0) return;

        setAnonymizedResumes(prevResumes => prevResumes.map(resume => {
            const {anonymizedText} = anonymizeText(resume.originalText, settings);
            return {
                ...resume, anonymizedText, settings: {...settings}
            };
        }));

        showToast('Settings applied to all resumes', 'success');
    };

    // Get the selected resume
    const selectedResume = selectedResumeId ? anonymizedResumes.find(resume => resume.id === selectedResumeId) : null;

    // Switch between resumes
    const handleResumeSelect = (resumeId: string) => {
        setSelectedResumeId(resumeId);
    };

    // Tab items
    const tabs: TabItem[] = [{
        id: 'upload', label: 'Upload', content: (<ResumeUploader
            uploadedFiles={uploadedFiles}
            onProcess={() => {
                // Only process if we have files
                if (Object.values(state.files).length > 0 || uploadedFiles.length > 0) {
                    processResumes();
                }
            }}
            isProcessing={isProcessing}
        />),
    }, {
        id: 'preview', label: 'Preview & Edit', content: (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
                <AnonymizationSettings
                    settings={settings}
                    onChange={handleSettingsChange}
                    onApplyToAll={applySettingsToAll}
                    disabled={anonymizedResumes.length === 0}
                />
            </div>
            <div className="md:col-span-2">
                <AnonymizedPreview
                    resumes={anonymizedResumes}
                    selectedResumeId={selectedResumeId}
                    onSelectResume={handleResumeSelect}
                />
            </div>
        </div>), disabled: anonymizedResumes.length === 0,
    }, {
        id: 'export',
        label: 'Export',
        content: (<BatchExport resumes={anonymizedResumes}/>),
        disabled: anonymizedResumes.length === 0,
    },];

    return (<div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-neutral-800">Resume Anonymizer</h1>
            <p className="mt-1 text-neutral-600">
                Remove personal identifiers from resumes to reduce unconscious bias in the hiring process.
            </p>
        </div>

        {error && (<Alert type="error" onClose={() => setError(null)}>
            {error}
        </Alert>)}

        <Card>
            <Tabs tabs={tabs}/>
        </Card>
    </div>);
};

export default ResumeAnonymizer;
