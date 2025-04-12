import React from 'react';
import FileUpload from '../../components/common/FileUpload';
import Button from '../../components/common/Button';
import {FileInfo} from '../../context/FileContext';

interface ResumeUploaderProps {
    uploadedFiles: FileInfo[];
    onProcess: () => void;
    isProcessing: boolean;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({
                                                           uploadedFiles,
                                                           onProcess,
                                                           isProcessing,
                                                       }) => {
    // Define accepted file types
    const acceptedFileTypes = '.pdf,.doc,.docx,.txt,.rtf';

    // Format file size in a readable way
    const formatFileSize = (size: number): string => {
        if (size < 1024) return `${size} B`;
        else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        else return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <FileUpload
                    id="resume-files"
                    label="Upload Resumes"
                    acceptedFileTypes={acceptedFileTypes}
                    multiple={true}
                    maxSize={10 * 1024 * 1024} // 10 MB
                    helperText="Upload one or more resumes in PDF, Word, or text format (max 10MB each)"
                />

                <div className="flex justify-end mt-4">
                    <Button
                        variant="success"
                        onClick={onProcess}
                        isLoading={isProcessing}
                        disabled={uploadedFiles.length === 0 || isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Anonymize Resumes'}
                    </Button>
                </div>
            </div>

            {uploadedFiles.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">Uploaded Files
                        ({uploadedFiles.length})</h3>
                    <div
                        className="border border-neutral-200 rounded-md divide-y divide-neutral-200 max-h-60 overflow-y-auto">
                        {uploadedFiles.map((file) => (
                            <div key={file.id} className="p-3 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="mr-3 text-neutral-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-800 truncate max-w-xs">{file.name}</p>
                                        <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-2 text-xs text-neutral-500">
                        Supported file types: PDF, DOC, DOCX, TXT, RTF
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeUploader;
