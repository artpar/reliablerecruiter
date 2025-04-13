import React, {useRef, useState, useEffect} from 'react';
import {useFile} from '../../context/FileContext';
import Button from './Button';

interface FileUploadProps {
    id: string;
    label?: string;
    helperText?: string;
    error?: string;
    acceptedFileTypes?: string; // e.g. ".pdf,.doc,.docx"
    maxSize?: number; // in bytes
    multiple?: boolean;
    onUpload?: (files: File[]) => void;
    cacheKey?: string; // Optional unique key for localStorage caching
}

interface CachedFileInfo {
    id: string;
    name: string;
    type: string;
    size: number;
    lastModified?: number;
    content: string; // Base64 encoded content
}

const FileUpload: React.FC<FileUploadProps> = ({
                                                   id,
                                                   label = 'Upload file',
                                                   helperText,
                                                   error,
                                                   acceptedFileTypes,
                                                   maxSize,
                                                   multiple = false,
                                                   onUpload,
                                                   cacheKey = 'fileUpload', // Default cache key
                                               }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [cachedFiles, setCachedFiles] = useState<CachedFileInfo[]>([]);
    const {dispatch} = useFile();
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Unique localStorage key combining component id and provided cacheKey
    const storageKey = `${cacheKey}-${id}`;

    // Load cached files on component mount - only once
    useEffect(() => {
        if (initialLoadDone) return;

        try {
            const cachedData = localStorage.getItem(storageKey);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData) as CachedFileInfo[];
                setCachedFiles(parsedData);

                // Restore files from cache to the file context
                const restoredFiles: File[] = [];
                parsedData.forEach(cachedFile => {
                    // Convert base64 content back to ArrayBuffer
                    const binaryString = atob(cachedFile.content);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Add the file to the context
                    dispatch({
                        type: 'ADD_FILE',
                        payload: {
                            id: cachedFile.id,
                            name: cachedFile.name,
                            type: cachedFile.type,
                            size: cachedFile.size,
                            content: bytes.buffer,
                        },
                    });

                    // Create a blob from the content for the onUpload callback
                    const blob = new Blob([bytes], { type: cachedFile.type });
                    // @ts-ignore - We're adding properties to make it File-like
                    blob.name = cachedFile.name;
                    // @ts-ignore
                    blob.lastModified = cachedFile.lastModified || Date.now();
                    restoredFiles.push(blob as File);
                });

                // Trigger onUpload callback if files were restored from cache
                if (onUpload && restoredFiles.length > 0) {
                    onUpload(restoredFiles);
                }
            }
        } catch (error) {
            console.error('Error loading cached file data:', error);
            localStorage.removeItem(storageKey); // Clear potentially corrupted data
        }

        setInitialLoadDone(true);
    }, [storageKey, dispatch, initialLoadDone]);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const validateFiles = (files: FileList | null): File[] => {
        if (!files || files.length === 0) return [];

        const validFiles: File[] = [];
        const errors: string[] = [];

        Array.from(files).forEach(file => {
            // Check file type if acceptedFileTypes is provided
            if (acceptedFileTypes) {
                const fileTypes = acceptedFileTypes.split(',');
                const fileExtension = '.' + file.name.split('.').pop();

                if (!fileTypes.includes(fileExtension) && !fileTypes.includes(file.type)) {
                    errors.push(`File "${file.name}" has an invalid file type. Accepted types: ${acceptedFileTypes}`);
                    return;
                }
            }

            // Check file size if maxSize is provided
            if (maxSize && file.size > maxSize) {
                const maxSizeMB = Math.round(maxSize / 1024 / 1024 * 10) / 10;
                const fileSizeMB = Math.round(file.size / 1024 / 1024 * 10) / 10;
                errors.push(`File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            setFileError(errors.join('\n'));
        } else {
            setFileError(null);
        }

        return validFiles;
    };

    const processFiles = async (files: File[]) => {
        if (files.length === 0) return;

        try {
            // Process files one by one with Promise.all to handle multiple files efficiently
            const newCachedFilesPromises = files.map(file => {
                return new Promise<CachedFileInfo>((resolve, reject) => {
                    const reader = new FileReader();
                    const fileId = `file-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;

                    reader.onload = (event) => {
                        if (event.target) {
                            // Get array buffer result
                            const arrayBuffer = event.target.result as ArrayBuffer;

                            // Convert array buffer to base64 for storage
                            const uint8Array = new Uint8Array(arrayBuffer);
                            let binaryString = '';
                            for (let i = 0; i < uint8Array.length; i++) {
                                binaryString += String.fromCharCode(uint8Array[i]);
                            }
                            const base64String = btoa(binaryString);

                            // Create cached file info with full content
                            const cachedFileInfo: CachedFileInfo = {
                                id: fileId,
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                lastModified: file.lastModified,
                                content: base64String
                            };

                            // Add file to context
                            dispatch({
                                type: 'ADD_FILE',
                                payload: {
                                    id: fileId,
                                    name: file.name,
                                    type: file.type,
                                    size: file.size,
                                    content: arrayBuffer,
                                },
                            });

                            resolve(cachedFileInfo);
                        } else {
                            reject(new Error('File read failed'));
                        }
                    };

                    reader.onerror = () => {
                        reject(new Error('Error reading file'));
                    };

                    reader.readAsArrayBuffer(file);
                });
            });

            // Wait for all files to be processed
            const newCachedFiles = await Promise.all(newCachedFilesPromises);

            // Update cached files state and localStorage
            const updatedCachedFiles = multiple ? [...cachedFiles, ...newCachedFiles] : newCachedFiles;
            setCachedFiles(updatedCachedFiles);

            // Store in localStorage
            try {
                localStorage.setItem(storageKey, JSON.stringify(updatedCachedFiles));
            } catch (storageError) {
                console.error('Error storing files in localStorage:', storageError);
                setFileError('Failed to cache files (storage limit exceeded). Your files are uploaded but won\'t persist on page refresh.');

                // If localStorage fails (likely due to quota exceeded), we keep the files in memory
                // but they won't persist between page refreshes
            }

            if (onUpload) {
                onUpload(files);
            }
        } catch (err) {
            setFileError('Error reading file');
            console.error('Error reading file:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const validFiles = validateFiles(e.target.files);
        processFiles(validFiles);

        // Reset the input to allow uploading the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const validFiles = validateFiles(e.dataTransfer.files);
        processFiles(validFiles);
    };

    // Clear cached files
    const handleClearCache = () => {
        localStorage.removeItem(storageKey);
        setCachedFiles([]);
        // Also notify the context to remove these files
        cachedFiles.forEach(file => {
            dispatch({
                type: 'REMOVE_FILE',
                payload: { id: file.id }
            });
        });
    };

    return (
        <div className="mb-4">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium mb-1">
                    {label}
                </label>
            )}

            <div
                className={`
                    border-2 border-dashed rounded-md p-4 text-center dark:bg-black dark:text-white
                    ${dragActive ? 'border-primary-400' : 'border-neutral-300 bg-white'}
                    ${error || fileError ? 'border-danger-300' : ''}
                    transition-colors duration-200
                `}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    id={id}
                    type="file"
                    className="hidden"
                    accept={acceptedFileTypes}
                    multiple={multiple}
                    onChange={handleChange}
                />

                <div className="space-y-2 flex flex-col items-center justify-center py-3">
                    <svg
                        className="w-10 h-10 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>

                    <div className="text-sm">
                        <p className="font-medium">
                            {cachedFiles.length > 0
                                ? `${cachedFiles.length} file${cachedFiles.length > 1 ? 's' : ''} selected`
                                : 'Drag and drop files here or'}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClick}
                            className="mt-2"
                        >
                            Browse files
                        </Button>
                        {acceptedFileTypes && (
                            <p className="mt-1 text-xs text-neutral-400">
                                Accepted file types: {acceptedFileTypes}
                            </p>
                        )}
                        {maxSize && (
                            <p className="text-xs text-neutral-400">
                                Maximum file size: {Math.round(maxSize / 1024 / 1024 * 10) / 10}MB
                            </p>
                        )}
                    </div>
                </div>

                {/* Display cached files information */}
                {cachedFiles.length > 0 && (
                    <div className="mt-3 border-t border-neutral-200 pt-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">Cached Files</h4>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearCache}
                                className="text-xs text-danger-600"
                            >
                                Clear
                            </Button>
                        </div>
                        <ul className="text-left text-sm">
                            {cachedFiles.map((file) => (
                                <li
                                    key={file.id}
                                    className="truncate text-neutral-600 cursor-pointer hover:text-primary-500"
                                    onClick={() => {
                                        // You could implement functionality to select a specific file here
                                        console.log("Selected file:", file.name);
                                    }}
                                >
                                    {file.name} ({Math.round(file.size / 1024)}KB)
                                </li>
                            )).slice(0, 3)}
                            {cachedFiles.length > 3 && (
                                <li className="text-neutral-400 text-xs">
                                    +{cachedFiles.length - 3} more file(s)
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            {helperText && !error && !fileError && (
                <p className="mt-1 text-sm text-neutral-400">{helperText}</p>
            )}

            {(error || fileError) && (
                <p className="mt-1 text-sm text-danger-600">{error || fileError}</p>
            )}
        </div>
    );
};

export default FileUpload;
