import React from 'react';
import FileUpload from '../../components/common/FileUpload';

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  return (
    <FileUpload
      id="jd-file-upload"
      label="Upload Job Description"
      acceptedFileTypes=".txt,.pdf,.docx,.doc"
      helperText="Supported file types: .txt, .pdf, .docx, .doc"
      onUpload={onFileUpload}
    />
  );
};

export default FileUploader;
