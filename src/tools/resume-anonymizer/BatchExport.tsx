import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import DataTable, { ColumnDefinition } from '../../components/common/DataTable';
import useToast from '../../hooks/useToast';
import { AnonymizationSettings } from '../ResumeAnonymizer';
import { exportToText, exportToHTML, exportToCSV, exportToJSON } from '../../services/ExportService';
import { saveAs } from 'file-saver';

interface AnonymizedResume {
    id: string;
    fileName: string;
    originalText: string;
    anonymizedText: string;
    identifiers: { type: string; value: string; index: number }[];
    settings: AnonymizationSettings;
}

interface BatchExportProps {
    resumes: AnonymizedResume[];
}

type ExportFormat = 'txt' | 'html' | 'csv' | 'json' | 'zip';

export const BatchExport: React.FC<BatchExportProps> = ({ resumes }) => {
    if (resumes.length === 0) {
        return (
            <Card>
                <div className="text-center py-8">
                    <svg
                        className="mx-auto h-12 w-12 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-neutral-900">No anonymized resumes</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                        Please upload and process resumes first.
                    </p>
                </div>
            </Card>
        );
    }
    const { showToast } = useToast();
    const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
    const [isExporting, setIsExporting] = useState(false);
    const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Handle export format change
    const handleFormatChange = (value: string) => {
        setExportFormat(value as ExportFormat);
    };

    // Toggle select all resumes
    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedResumes([]);
        } else {
            setSelectedResumes(resumes.map(resume => resume.id));
        }
        setSelectAll(!selectAll);
    };

    // Toggle individual resume selection
    const toggleResumeSelection = (resumeId: string) => {
        if (selectedResumes.includes(resumeId)) {
            setSelectedResumes(prev => prev.filter(id => id !== resumeId));
            setSelectAll(false);
        } else {
            setSelectedResumes(prev => [...prev, resumeId]);
            if (selectedResumes.length + 1 === resumes.length) {
                setSelectAll(true);
            }
        }
    };

    // Column definitions for the data table
    const columns: ColumnDefinition<AnonymizedResume>[] = [
        {
            header: '',
            accessor: (item) => (
                <input
                    type="checkbox"
                    checked={selectedResumes.includes(item.id)}
                    onChange={() => toggleResumeSelection(item.id)}
                    className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
            ),
            width: 'w-10',
        },
        {
            header: 'File Name',
            accessor: 'fileName',
            sortable: true,
        },
        {
            header: 'Identifiers Found',
            accessor: (item) => item.identifiers.length.toString(),
            sortable: true,
        },
        {
            header: 'Anonymization',
            accessor: (item) => {
                const enabledSettings = Object.entries(item.settings)
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => key.replace('replace', ''))
                    .join(', ');
                return enabledSettings || 'None';
            },
        },
        {
            header: 'Actions',
            accessor: (item) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSingleExport(item)}
                >
                    Export
                </Button>
            ),
        },
    ];

    // Format options
    const formatOptions = [
        { value: 'txt', label: 'Text Files (.txt)' },
        { value: 'html', label: 'HTML Files (.html)' },
        { value: 'csv', label: 'CSV File (all resumes in one file)' },
        { value: 'json', label: 'JSON File (all resumes in one file)' },
        { value: 'zip', label: 'ZIP Archive (all formats)' }
    ];

    // Helper function to export a single resume
    const handleSingleExport = (resume: AnonymizedResume) => {
        const { fileName, anonymizedText } = resume;
        const baseName = fileName.split('.')[0];

        setIsExporting(true);

        try {
            switch (exportFormat) {
                case 'txt':
                    exportToText(anonymizedText, { filename: `${baseName}-anonymized.txt` });
                    break;
                case 'html':
                    exportToHTML(
                        `<pre>${anonymizedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
                        { filename: `${baseName}-anonymized.html`, includeBasicStyles: true }
                    );
                    break;
                case 'csv':
                    exportToCSV(
                        [{ fileName, content: anonymizedText }],
                        { filename: `${baseName}-anonymized.csv` }
                    );
                    break;
                case 'json':
                    exportToJSON(
                        { fileName, content: anonymizedText, exportDate: new Date().toISOString() },
                        { filename: `${baseName}-anonymized.json`, pretty: true }
                    );
                    break;
                case 'zip':
                    // In a real implementation, this would create a zip with multiple formats
                    showToast('ZIP export for single resumes is not implemented in this demo.', 'info');
                    return;
            }

            showToast(`Exported ${fileName} successfully`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast(`Error exporting ${fileName}`, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    // Handle batch export
    const handleBatchExport = async () => {
        if (selectedResumes.length === 0) {
            showToast('Please select at least one resume to export', 'warning');
            return;
        }

        setIsExporting(true);

        try {
            const selectedResumeData = resumes.filter(resume =>
                selectedResumes.includes(resume.id)
            );

            switch (exportFormat) {
                case 'txt':
                    if (selectedResumeData.length === 1) {
                        // Single export
                        const resume = selectedResumeData[0];
                        exportToText(resume.anonymizedText, {
                            filename: `${resume.fileName.split('.')[0]}-anonymized.txt`
                        });
                    } else {
                        // For multiple files, we'd typically use a zip library
                        // For this demo, we'll do individual exports with a small delay
                        for (const resume of selectedResumeData) {
                            exportToText(resume.anonymizedText, {
                                filename: `${resume.fileName.split('.')[0]}-anonymized.txt`
                            });
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    }
                    break;

                case 'html':
                    if (selectedResumeData.length === 1) {
                        const resume = selectedResumeData[0];
                        exportToHTML(
                            `<pre>${resume.anonymizedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
                            {
                                filename: `${resume.fileName.split('.')[0]}-anonymized.html`,
                                includeBasicStyles: true
                            }
                        );
                    } else {
                        for (const resume of selectedResumeData) {
                            exportToHTML(
                                `<pre>${resume.anonymizedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
                                {
                                    filename: `${resume.fileName.split('.')[0]}-anonymized.html`,
                                    includeBasicStyles: true
                                }
                            );
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    }
                    break;

                case 'csv':
                    // Export all as a single CSV file
                    exportToCSV(
                        selectedResumeData.map(resume => ({
                            fileName: resume.fileName,
                            identifiersFound: resume.identifiers.length,
                            content: resume.anonymizedText.substring(0, 1000) + '...' // Truncate for CSV
                        })),
                        {
                            filename: `anonymized-resumes-${new Date().toISOString().slice(0, 10)}.csv`,
                            headers: {
                                fileName: 'File Name',
                                identifiersFound: 'Identifiers Found',
                                content: 'Content Preview'
                            }
                        }
                    );
                    break;

                case 'json':
                    // Export all as a single JSON file
                    exportToJSON(
                        {
                            exportDate: new Date().toISOString(),
                            count: selectedResumeData.length,
                            resumes: selectedResumeData.map(resume => ({
                                fileName: resume.fileName,
                                identifiersFound: {
                                    count: resume.identifiers.length,
                                    types: resume.identifiers.reduce((acc, curr) => {
                                        acc[curr.type] = (acc[curr.type] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                                },
                                content: resume.anonymizedText
                            }))
                        },
                        {
                            filename: `anonymized-resumes-${new Date().toISOString().slice(0, 10)}.json`,
                            pretty: true
                        }
                    );
                    break;

                case 'zip':
                    // In a production app, this would create a zip with all formats
                    showToast('ZIP export would be implemented with JSZip in a real application', 'info');
                    break;
            }

            showToast(`Exported ${selectedResumeData.length} resume(s) successfully`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Error exporting resumes', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    // Return the main component
    return (
        <div className="space-y-6">
            <Card title="Export Options">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-end">
                            <Select
                                label="Export Format"
                                options={formatOptions}
                                value={exportFormat}
                                onChange={handleFormatChange}
                            />
                        </div>
                        <div className="flex items-middle">
                            <Button
                                variant="outline"
                                onClick={handleBatchExport}
                                isLoading={isExporting}
                                disabled={selectedResumes.length === 0 || isExporting}
                                className="w-full"
                            >
                                {isExporting ? 'Exporting...' : `Export ${selectedResumes.length} Selected Resume(s)`}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-2 text-sm text-neutral-600">
                        <p>Select the resumes you want to export and choose your preferred format.</p>
                    </div>
                </div>
            </Card>

            <Card title={`Anonymized Resumes (${resumes.length})`}>
                <div className="mb-3 flex items-center">
                    <input
                        type="checkbox"
                        id="select-all"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="select-all" className="ml-2 text-sm text-neutral-700">
                        Select All
                    </label>
                    <div className="ml-auto text-sm text-neutral-500">
                        {selectedResumes.length} of {resumes.length} selected
                    </div>
                </div>

                <DataTable
                    data={resumes}
                    columns={columns}
                    keyField="id"
                    striped
                    hoverable
                    emptyMessage="No resumes have been processed yet."
                />
            </Card>
        </div>
    );
};

// Helper function to export a single resume
const handleSingleExport = (resume: AnonymizedResume) => {
    const { fileName, anonymizedText } = resume;
    const baseName = fileName.split('.')[0];

    setIsExporting(true);

    try {
        switch (exportFormat) {
            case 'txt':
                exportToText(anonymizedText, { filename: `${baseName}-anonymized.txt` });
                break;
            case 'html':
                exportToHTML(
                    `<pre>${anonymizedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
                    { filename: `${baseName}-anonymized.html`, includeBasicStyles: true }
                );
                break;
            case 'csv':
                exportToCSV(
                    [{ fileName, content: anonymizedText }],
                    { filename: `${baseName}-anonymized.csv` }
                );
                break;
            case 'json':
                exportToJSON(
                    { fileName, content: anonymizedText, exportDate: new Date().toISOString() },
                    { filename: `${baseName}-anonymized.json`, pretty: true }
                );
                break;
            case 'zip':
                // In a real implementation, this would create a zip with multiple formats
                showToast('ZIP export for single resumes is not implemented in this demo.', 'info');
                return;
        }

        showToast(`Exported ${fileName} successfully`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast(`Error exporting ${fileName}`, 'error');
    } finally {
        setIsExporting(false);
    }
};
const handleBatchExport = async () => {
    if (selectedResumes.length === 0) {
        showToast('Please select at least one resume to export', 'warning');
        return;
    }

    setIsExporting(true);

    try {
        const selectedResumeData = resumes.filter(resume =>
            selectedResumes.includes(resume.id)
        );

        switch (exportFormat) {
            case 'txt':
                if (selectedResumeData.length === 1) {
                    // Single export
                    const resume = selectedResumeData[0];
                    exportToText(resume.anonymizedText, {
                        filename: `${resume.fileName.split('.')[0]}-anonymized.txt`
                    });
                } else {
                    // For multiple files, we'd typically use a zip library
                    // For this demo, we'll do individual exports with a small delay
                    for (const resume of selectedResumeData) {
                        exportToText(resume.anonymizedText, {
                            filename: `${resume.fileName.split('.')[0]}-anonymized.txt`
                        });
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
                break;

            case 'html':
                if (selectedResumeData.length === 1) {
                    const resume = selectedResumeData[0];
                    exportToHTML(
                        `<pre>${resume.anonymizedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
                        {
                            filename: `${resume.fileName.split('.')[0]}-anonymized.html`,
                            includeBasicStyles: true
                        }
                    );
                } else {
                    for (const resume of selectedResumeData) {
                        exportToHTML(
                            `<pre>${resume.anonymizedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
                            {
                                filename: `${resume.fileName.split('.')[0]}-anonymized.html`,
                                includeBasicStyles: true
                            }
                        );
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
                break;

            case 'csv':
                // Export all as a single CSV file
                exportToCSV(
                    selectedResumeData.map(resume => ({
                        fileName: resume.fileName,
                        identifiersFound: resume.identifiers.length,
                        content: resume.anonymizedText.substring(0, 1000) + '...' // Truncate for CSV
                    })),
                    {
                        filename: `anonymized-resumes-${new Date().toISOString().slice(0, 10)}.csv`,
                        headers: {
                            fileName: 'File Name',
                            identifiersFound: 'Identifiers Found',
                            content: 'Content Preview'
                        }
                    }
                );
                break;

            case 'json':
                // Export all as a single JSON file
                exportToJSON(
                    {
                        exportDate: new Date().toISOString(),
                        count: selectedResumeData.length,
                        resumes: selectedResumeData.map(resume => ({
                            fileName: resume.fileName,
                            identifiersFound: {
                                count: resume.identifiers.length,
                                types: resume.identifiers.reduce((acc, curr) => {
                                    acc[curr.type] = (acc[curr.type] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            },
                            content: resume.anonymizedText
                        }))
                    },
                    {
                        filename: `anonymized-resumes-${new Date().toISOString().slice(0, 10)}.json`,
                        pretty: true
                    }
                );
                break;

            case 'zip':
                // In a production app, this would create a zip with all formats
                showToast('ZIP export would be implemented with JSZip in a real application', 'info');
                break;
        }

        showToast(`Exported ${selectedResumeData.length} resume(s) successfully`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting resumes', 'error');
    } finally {
        setIsExporting(false);
    }
};
