import React, { useRef, useState } from 'react';
import { useFile } from '../../context/FileContext';
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const { dispatch } = useFile();

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
      for (const file of files) {
        const reader = new FileReader();

        reader.onload = (event) => {
          if (event.target) {
            const fileId = `file-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;

            dispatch({
              type: 'ADD_FILE',
              payload: {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                content: event.target.result,
              },
            });
          }
        };

        reader.readAsArrayBuffer(file);
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

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium  mb-1">
          {label}
        </label>
      )}

      <div
        className={`
          border-2 border-dashed rounded-md p-4 text-center dark:bg-black dark:text-white
          ${dragActive ? '' : 'border-neutral-300 bg-white'}
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
          <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>

          <div className="text-sm">
            <p className="font-medium">Drag and drop files here or</p>
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
