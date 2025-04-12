import React from 'react';
import Button from "../../components/common/Button";

interface SuggestionListProps {
  biasedTerms: {
    term: string;
    index: number;
    category: string;
    alternatives: string[];
  }[];
  originalText: string;
  improvedText: string;
  onUpdate: (updatedText: string) => void;
}

const SuggestionList: React.FC<SuggestionListProps> = ({
  biasedTerms,
  originalText,
  improvedText,
  onUpdate,
}) => {
  // Get category label
  const getCategoryLabel = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'gender':
        return 'Gender-biased';
      case 'age':
        return 'Age-biased';
      case 'race':
        return 'Race/Culture-biased';
      default:
        return 'Potentially biased';
    }
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'gender':
        return 'bg-pink-100 text-pink-800';
      case 'age':
        return 'bg-blue-100 text-blue-800';
      case 'race':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Function to replace a term with an alternative
  const handleReplace = (term: string, replacement: string) => {
    // Find the term in the current improvedText
    const termIndex = improvedText.indexOf(term);
    if (termIndex === -1) return;

    // Replace the term with the alternative
    const updatedText =
      improvedText.substring(0, termIndex) +
      replacement +
      improvedText.substring(termIndex + term.length);

    onUpdate(updatedText);
  };

  // Function to get context around a term
  const getContext = (text: string, index: number, contextLength: number = 40): string => {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + contextLength);

    let context = text.substring(start, end);

    // Add ellipsis if needed
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context;
  };

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {biasedTerms.map((term, index) => (
        <div key={index} className="p-3 bg-white border border-neutral-200 rounded-md shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(
                  term.category
                )}`}
              >
                {getCategoryLabel(term.category)}
              </span>
              <div className="mt-2 font-medium">{term.term}</div>
              <div className="mt-1 text-sm text-neutral-500">
                <span className="font-medium"></span>{' '}
                <span className="italic">
                  {term.context}
                </span>
              </div>
            </div>
          </div>

          {term.alternatives && term.alternatives.length > 0 ? (
            <div className="mt-3">
              <div className="text-sm font-medium  mb-2">Suggested alternatives:</div>
              <div className="flex flex-wrap gap-2">
                {term.alternatives.map((alternative, altIndex) => (
                  <Button
                    key={altIndex}
                    variant="outline"
                    size="sm"
                    onClick={() => handleReplace(term.term, alternative)}
                    className={improvedText.includes(alternative) ? 'bg-primary-50' : ''}
                  >
                    {alternative}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-neutral-500 italic">
              No specific alternatives available. Consider rephrasing this term.
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SuggestionList;
