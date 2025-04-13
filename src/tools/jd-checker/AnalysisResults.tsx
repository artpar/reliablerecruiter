import React from 'react';
import Button from '../../components/common/Button';
import { BiasHighlighter } from './BiasHighlighter';

interface AnalysisResultsProps {
  analysis: {
    biasedTerms: any[];
    score: number;
    categoryScores?: Record<string, number>;
  };
  jobDescription: string;
  isPDF: boolean;
  onBackToPDF?: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  jobDescription,
  isPDF,
  onBackToPDF
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-800">
          Bias Score: {analysis.score}/100
        </h2>
        <div className="text-sm text-neutral-600">
          {analysis.biasedTerms && Array.isArray(analysis.biasedTerms) ? analysis.biasedTerms.length : 0} potential
          issues found
        </div>
      </div>

      {isPDF ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
          <p className="text-sm text-neutral-600 mb-3">
            Biased terms have been highlighted directly in the PDF. Return to the Editor tab to
            view them.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToPDF}
          >
            Back to PDF Viewer
          </Button>
        </div>
      ) : (
        <BiasHighlighter text={jobDescription} biasedTerms={analysis.biasedTerms} />
      )}
    </div>
  );
};

export default AnalysisResults;
