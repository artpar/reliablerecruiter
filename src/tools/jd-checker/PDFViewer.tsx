import React from 'react';
import PDFAnnotator, { PDFAnnotation } from '../../components/PDFAnnotator';

interface PDFViewerProps {
  fileId: string;
  pdfViewerKey: string;
  annotations: PDFAnnotation[];
  onSave: (annotations: PDFAnnotation[], fileId: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  fileId, 
  pdfViewerKey, 
  annotations, 
  onSave 
}) => {
  return (
    <div className="flex h-full min-h-[400px]">
      <PDFAnnotator
        key={pdfViewerKey}
        fileId={fileId}
        initialAnnotations={annotations}
        onSave={onSave}
        className="600px"
      />
    </div>
  );
};

export default PDFViewer;
