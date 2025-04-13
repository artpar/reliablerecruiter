import React from 'react';
import TextArea from '../../components/common/TextArea';
import Button from '../../components/common/Button';
import SuggestionList from './SuggestionList';

interface ImprovedVersionProps {
  improvedJobDescription: string;
  setImprovedJobDescription: (text: string) => void;
  jobDescription: string;
  biasedTerms: any[];
  onSave: () => void;
  loading: boolean;
  isPDF: boolean;
}

const ImprovedVersion: React.FC<ImprovedVersionProps> = ({
  improvedJobDescription,
  setImprovedJobDescription,
  jobDescription,
  biasedTerms,
  onSave,
  loading,
  isPDF
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImprovedJobDescription(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3">
        <TextArea
          label="Improved Job Description"
          value={improvedJobDescription}
          onChange={handleChange}
          rows={15}
        />
        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            onClick={onSave}
            isLoading={loading}
          >
            {isPDF ? 'Save with PDF' : 'Save Improved Version'}
          </Button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="text-lg font-medium text-neutral-800 mb-3">
          Suggestions
        </h3>

        <SuggestionList
          biasedTerms={biasedTerms}
          originalText={jobDescription}
          improvedText={improvedJobDescription}
          onUpdate={setImprovedJobDescription}
        />
      </div>
    </div>
  );
};

export default ImprovedVersion;
