import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tabs, { TabItem } from '../../components/common/Tabs';
import { AnonymizationSettings } from '../ResumeAnonymizer';

interface AnonymizedResume {
    id: string;
    fileName: string;
    originalText: string;
    anonymizedText: string;
    identifiers: { type: string; value: string; index: number }[];
    settings: AnonymizationSettings;
}

interface AnonymizedPreviewProps {
    resumes: AnonymizedResume[];
    selectedResumeId: string | null;
    onSelectResume: (resumeId: string) => void;
}

const AnonymizedPreview: React.FC<AnonymizedPreviewProps> = ({
                                                                 resumes,
                                                                 selectedResumeId,
                                                                 onSelectResume,
                                                             }) => {
    const [viewMode, setViewMode] = useState<'anonymized' | 'original' | 'diff'>('anonymized');

    if (resumes.length === 0) {
        return (
            <Card>
                <div className="text-center py-6 text-neutral-500">
                    <p>No anonymized resumes yet. Please upload and process resumes first.</p>
                </div>
            </Card>
        );
    }

    const selectedResume = selectedResumeId
        ? resumes.find(resume => resume.id === selectedResumeId)
        : resumes[0];

    if (!selectedResume) {
        return (
            <Card>
                <div className="text-center py-6 text-neutral-500">
                    <p>No resume selected.</p>
                </div>
            </Card>
        );
    }

    // Helper to format the identifier type
    const formatIdentifierType = (type: string): string => {
        switch (type) {
            case 'name':
                return 'Name';
            case 'email':
                return 'Email Address';
            case 'phone':
                return 'Phone Number';
            case 'address':
                return 'Physical Address';
            case 'social':
                return 'Social Media Profile';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    // Tabs for navigation between resumes
    const resumeTabs: TabItem[] = resumes.map((resume) => ({
        id: resume.id,
        label: resume.fileName,
        content: <></>, // Content is rendered based on the selected resume
    }));

    return (
        <div className="space-y-4">
            {resumes.length > 1 && (
                <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-md overflow-x-auto">
                    <div className="flex space-x-2">
                        {resumes.map((resume) => (
                            <button
                                key={resume.id}
                                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
                                    selectedResumeId === resume.id
                                        ? 'bg-primary-100 text-primary-700 font-medium'
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                                onClick={() => onSelectResume(resume.id)}
                            >
                                {resume.fileName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Card
                title={`Preview: ${selectedResume.fileName}`}
                className="h-full"
                header={
                    <div className="flex justify-between items-center w-full">
                        <span className="text-lg font-medium text-neutral-800">{selectedResume.fileName}</span>
                        <div className="flex space-x-2">
                            <Button
                                variant={viewMode === 'original' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('original')}
                            >
                                Original
                            </Button>
                            <Button
                                variant={viewMode === 'anonymized' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('anonymized')}
                            >
                                Anonymized
                            </Button>
                            <Button
                                variant={viewMode === 'diff' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('diff')}
                            >
                                Diff View
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    {selectedResume.identifiers.length > 0 && (
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                            <h4 className="text-sm font-medium text-neutral-700 mb-2">Detected Identifiers</h4>
                            <div className="text-sm max-h-40 overflow-y-auto">
                                <table className="min-w-full divide-y divide-neutral-200">
                                    <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Type</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">Value</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-neutral-200">
                                    {selectedResume.identifiers.map((identifier, index) => (
                                        <tr key={index} className="hover:bg-neutral-50">
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700">
                                                {formatIdentifierType(identifier.type)}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-500">
                                                {identifier.value}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="border border-neutral-200 rounded-md bg-white">
                        {viewMode === 'original' && (
                            <div className="p-4 text-sm font-mono whitespace-pre-wrap h-96 overflow-y-auto">
                                {selectedResume.originalText}
                            </div>
                        )}

                        {viewMode === 'anonymized' && (
                            <div className="p-4 text-sm font-mono whitespace-pre-wrap h-96 overflow-y-auto">
                                {selectedResume.anonymizedText}
                            </div>
                        )}

                        {viewMode === 'diff' && (
                            <div className="p-4 text-sm font-mono whitespace-pre-wrap h-96 overflow-y-auto">
                                <DiffView
                                    original={selectedResume.originalText}
                                    anonymized={selectedResume.anonymizedText}
                                    identifiers={selectedResume.identifiers}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

// Component to highlight differences between original and anonymized text
const DiffView: React.FC<{
    original: string;
    anonymized: string;
    identifiers: { type: string; value: string; index: number }[];
}> = ({ original, anonymized, identifiers }) => {
    // Simple way to highlight replaced content
    // This is a basic approach - a real diff would use a proper diff algorithm
    let highlightedText = original;

    // Sort identifiers by index in descending order to avoid position shifts
    const sortedIdentifiers = [...identifiers].sort((a, b) => b.index - a.index);

    sortedIdentifiers.forEach(identifier => {
        // Determine replacement based on type
        let replacement;
        switch (identifier.type) {
            case 'name':
                replacement = '[NAME]';
                break;
            case 'email':
                replacement = '[EMAIL]';
                break;
            case 'phone':
                replacement = '[PHONE]';
                break;
            case 'address':
                replacement = '[ADDRESS]';
                break;
            case 'social':
                replacement = '[SOCIAL MEDIA]';
                break;
            default:
                replacement = `[${identifier.type.toUpperCase()}]`;
        }

        // Create highlighted markup
        const highlightMarkup = `<span class="bg-yellow-100 text-yellow-800 px-1 rounded">${identifier.value}</span>`;

        // Replace the text - assuming non-overlapping identifiers
        const before = highlightedText.substring(0, identifier.index);
        const after = highlightedText.substring(identifier.index + identifier.value.length);
        highlightedText = before + highlightMarkup + after;
    });

    return (
        <div
            className="diff-view"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
        />
    );
};

export default AnonymizedPreview;
