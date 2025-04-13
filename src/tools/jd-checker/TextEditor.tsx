import React from 'react';
import TextArea from '../../components/common/TextArea';

interface TextEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = "Paste your job description here or upload a file...",
  rows = 15,
  label = "Job Description"
}) => {
  return (
    <TextArea
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  );
};

export default TextEditor;
