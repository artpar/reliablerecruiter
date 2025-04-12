import React, { useState, ComponentType } from 'react';
import { useFile } from '../context/FileContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import PDFEditor from '../components/PDFEditor';
import useToast from '../hooks/useToast';

// Props that will be injected by the HOC
export interface PDFEditingProps {
    isPDFFile: boolean;
    pdfFileId: string | null;
    openPDFEditor: () => void;
    contentFromPDF: string;
    saveToPDF: (content: string) => void;
}

// Props expected by the HOC
interface WithPDFEditingOptions {
    allowEditing?: boolean;
}

/**
 * Higher-Order Component that adds PDF editing capabilities to any component
 *
 * @param WrappedComponent The component to wrap with PDF editing capabilities
 * @param options Configuration options
 */
export const withPDFEditing = <P extends object>(
    WrappedComponent: ComponentType<P & PDFEditingProps>,
    options: WithPDFEditingOptions = {}
) => {
    const { allowEditing = true } = options;

    const WithPDFEditing: React.FC<P> = (props) => {
        const { files, saveEditedContent } = useFile();
        const { showToast } = useToast();

        const [pdfFileId, setPdfFileId] = useState<string | null>(null);
        const [isPDFFile, setIsPDFFile] = useState(false);
        const [contentFromPDF, setContentFromPDF] = useState('');
        const [isEditorOpen, setIsEditorOpen] = useState(false);

        // Function to set the PDF file to be edited
        const setPDFFile = (fileId: string) => {
            const file = files.find(f => f.id === fileId);
            if (file) {
                const isPdf = file.type === 'application/pdf' ||
                    file.name.toLowerCase().endsWith('.pdf');

                setPdfFileId(fileId);
                setIsPDFFile(isPdf);
            }
        };

        // Function to open the PDF editor modal
        const openPDFEditor = () => {
            if (pdfFileId && isPDFFile) {
                setIsEditorOpen(true);
            } else {
                showToast('No PDF file available to edit', 'warning');
            }
        };

        // Function to save content back to the PDF
        const saveToPDF = (content: string) => {
            if (pdfFileId && isPDFFile) {
                saveEditedContent(pdfFileId, content, 'text/plain');
                showToast('Content saved to PDF', 'success');
            } else {
                showToast('No PDF file available to save to', 'warning');
            }
        };

        // Handle content extracted from the PDF
        const handlePDFTextExtracted = (text: string, fileId: string) => {
            if (fileId === pdfFileId) {
                setContentFromPDF(text);
            }
        };

        // Handle saving edited content back to the PDF
        const handlePDFSave = (editedContent: string, fileId: string) => {
            saveEditedContent(fileId, editedContent, 'text/plain');
            setContentFromPDF(editedContent);
            setIsEditorOpen(false);
            showToast('PDF content updated', 'success');
        };

        const pdfEditingProps: PDFEditingProps = {
            isPDFFile,
            pdfFileId,
            openPDFEditor,
            contentFromPDF,
            saveToPDF
        };

        // Add a method to the enhanced component's prototype so other components can call it
        const EnhancedComponent = WrappedComponent as any;
        EnhancedComponent.setPDFFile = setPDFFile;

        return (
            <>
                <EnhancedComponent
                    {...props}
                    {...pdfEditingProps}
                />

                <Modal
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    title="Edit PDF Content"
                    size="lg"
                >
                    {pdfFileId && (
                        <div className="h-[70vh]">
                            <PDFEditor
                                fileId={pdfFileId}
                                onSave={handlePDFSave}
                                readOnly={!allowEditing}
                                height="100%"
                            />
                        </div>
                    )}
                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                            Close
                        </Button>
                    </div>
                </Modal>
            </>
        );
    };

    return WithPDFEditing;
};

export default withPDFEditing;
