import { useState, useCallback } from 'react';
import { useFile, FileInfo } from '../context/FileContext';

interface FileUploadOptions {
  acceptedFileTypes?: string[];
  maxSize?: number; // in bytes
  multiple?: boolean;
  validateFile?: (file: File) => string | null;
}

interface FileUploadResult {
  isLoading: boolean;
  error: string | null;
  uploadFile: (files: FileList | File[]) => Promise<FileInfo[]>;
  clearError: () => void;
}

export const useFileUpload = (options: FileUploadOptions = {}): FileUploadResult => {
  const { dispatch } = useFile();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validateFiles = useCallback(
    (files: FileList | File[]): { validFiles: File[]; errors: string[] } => {
      const validFiles: File[] = [];
      const errors: string[] = [];
      const fileArray = Array.from(files);

      if (!options.multiple && fileArray.length > 1) {
        errors.push('Only one file can be uploaded at a time');
        return { validFiles: [], errors };
      }

      fileArray.forEach((file) => {
        // Check file type if acceptedFileTypes is provided
        if (options.acceptedFileTypes && options.acceptedFileTypes.length > 0) {
          const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
          const fileType = file.type.toLowerCase();
          
          const isValidType = options.acceptedFileTypes.some(type => {
            // Handle both MIME types and file extensions
            if (type.startsWith('.')) {
              return type.toLowerCase() === fileExtension;
            } else {
              return fileType.includes(type.toLowerCase());
            }
          });
          
          if (!isValidType) {
            errors.push(`File "${file.name}" has an invalid file type`);
            return;
          }
        }

        // Check file size if maxSize is provided
        if (options.maxSize && file.size > options.maxSize) {
          const maxSizeMB = Math.round(options.maxSize / 1024 / 1024 * 10) / 10;
          const fileSizeMB = Math.round(file.size / 1024 / 1024 * 10) / 10;
          errors.push(`File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB`);
          return;
        }

        // Custom validation if provided
        if (options.validateFile) {
          const validationError = options.validateFile(file);
          if (validationError) {
            errors.push(validationError);
            return;
          }
        }

        validFiles.push(file);
      });

      return { validFiles, errors };
    },
    [options.acceptedFileTypes, options.maxSize, options.multiple, options.validateFile]
  );

  const uploadFile = useCallback(
    async (files: FileList | File[]): Promise<FileInfo[]> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { validFiles, errors } = validateFiles(files);
        
        if (errors.length > 0) {
          setError(errors.join('\n'));
          setIsLoading(false);
          return [];
        }
        
        const fileInfos: FileInfo[] = [];
        
        for (const file of validFiles) {
          const fileId = `file-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
          
          // Read file content
          const content = await readFileAsArrayBuffer(file);
          
          const fileInfo: FileInfo = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content,
          };
          
          // Dispatch to file context
          dispatch({
            type: 'ADD_FILE',
            payload: fileInfo,
          });
          
          fileInfos.push(fileInfo);
        }
        
        return fileInfos;
      } catch (err) {
        setError('Error uploading file');
        console.error('Error uploading file:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, validateFiles]
  );

  return {
    isLoading,
    error,
    uploadFile,
    clearError,
  };
};

// Helper function to read file as ArrayBuffer
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        resolve(event.target.result as ArrayBuffer);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export default useFileUpload;
