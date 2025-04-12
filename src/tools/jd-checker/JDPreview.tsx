import React, { useState } from 'react';
import ExportService from "../../services/ExportService";
import Tabs from "../../components/common/Tabs";
import TextArea from "../../components/common/TextArea";
import Button from "../../components/common/Button";

interface JDPreviewProps {
  originalText: string;
  improvedText: string;
  biasedTerms: {
    term: string;
    index: number;
    category: string;
    alternatives: string[];
  }[];
}

const JDPreview: React.FC<JDPreviewProps> = ({
  originalText,
  improvedText,
  biasedTerms,
}) => {
  const [editableText, setEditableText] = useState(improvedText);
  const [showDiff, setShowDiff] = useState(true);

  // Update editable text when improved text changes
  React.useEffect(() => {
    setEditableText(improvedText);
  }, [improvedText]);

  // Handle text change in the editable version
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(e.target.value);
  };

  // Handle export to different formats
  const handleExport = (format: 'text' | 'html' | 'doc') => {
    switch (format) {
      case 'text':
        ExportService.exportToText(editableText, { filename: 'improved-job-description.txt' });
        break;
      case 'html':
        ExportService.exportToHTML(
          `<h1>Improved Job Description</h1><div>${editableText.replace(/\n/g, '<br/>')}</div>`,
          { filename: 'improved-job-description.html' }
        );
        break;
      case 'doc':
        // Simple HTML-based DOC export
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Improved Job Description</title>
          </head>
          <body>
            <h1>Improved Job Description</h1>
            <div style="font-family: Arial, sans-serif; line-height: 1.5; margin: 20px 0;">
              ${editableText.replace(/\n/g, '<br/>')}
            </div>
          </body>
          </html>
        `;

        ExportService.exportToHTML(htmlContent, {
          filename: 'improved-job-description.doc',
        });
        break;
    }
  };

  // Create highlighted version showing differences
  const highlightDifferences = () => {
    let result = improvedText;
    let offset = 0;

    // Get all the replacement terms and their positions
    const replacements: { original: string; replacement: string; index: number }[] = [];

    biasedTerms.forEach((term) => {
      const originalTerm = term.term;

      // Find if this term has been replaced in the improved text
      if (!improvedText.includes(originalTerm, term.index + offset)) {
        // Find what it was replaced with
        for (const alternative of term.alternatives) {
          const altIndex = improvedText.indexOf(alternative, Math.max(0, term.index + offset - 5));

          if (altIndex !== -1 && Math.abs(altIndex - (term.index + offset)) < 10) {
            replacements.push({
              original: originalTerm,
              replacement: alternative,
              index: altIndex,
            });

            // Adjust offset for future replacements
            offset += alternative.length - originalTerm.length;
            break;
          }
        }
      }
    });

    // Sort replacements by index in reverse order to maintain indices
    replacements.sort((a, b) => b.index - a.index);

    // Apply highlighting
    replacements.forEach(({ replacement, index }) => {
      result = result.substring(0, index) +
              `<span class="bg-success-200 text-success-800 px-1 py-0.5 rounded-md border border-success-300">${replacement}</span>` +
              result.substring(index + replacement.length);
    });

    return result;
  };

  return (
    <div>
      <Tabs
        tabs={[
          {
            id: 'improved',
            label: 'Improved Version',
            content: (
              <div>
                <div className="mb-4 flex items-center">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={showDiff}
                      onChange={(e) => setShowDiff(e.target.checked)}
                      className="mr-2"
                    />
                    Highlight changes
                  </label>
                </div>

                {showDiff ? (
                  <div
                    className="p-4 border border-neutral-200 rounded-md bg-white whitespace-pre-wrap max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: highlightDifferences().replace(/\n/g, '<br/>') }}
                  />
                ) : (
                  <TextArea
                    value={editableText}
                    onChange={handleTextChange}
                    rows={10}
                  />
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport('text')}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    }
                  >
                    Export as TXT
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('html')}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    }
                  >
                    Export as HTML
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('doc')}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    }
                  >
                    Export as DOC
                  </Button>
                </div>
              </div>
            ),
          },
          {
            id: 'original',
            label: 'Original Version',
            content: (
              <div className="p-4 border border-neutral-200 rounded-md bg-white whitespace-pre-wrap max-h-96 overflow-y-auto">
                {originalText}
              </div>
            ),
          },
          {
            id: 'comparison',
            label: 'Side by Side',
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-neutral-700 mb-2">Original</h3>
                  <div className="p-4 border border-neutral-200 rounded-md bg-white h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {originalText}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-700 mb-2">Improved</h3>
                  <div className="p-4 border border-neutral-200 rounded-md bg-white h-[400px] overflow-y-auto">
                    {showDiff ? (
                      <div
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: highlightDifferences().replace(/\n/g, '<br/>') }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{editableText}</div>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
        ]}
        defaultTabId="improved"
      />
    </div>
  );
};

export default JDPreview;
