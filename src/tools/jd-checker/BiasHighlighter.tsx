import React from 'react';

interface BiasHighlighterProps {
  text: string;
  biasedTerms: {
    term: string;
    index: number;
    category: string;
    alternatives: string[];
  }[];
}

const BiasHighlighter: React.FC<BiasHighlighterProps> = ({ text, biasedTerms }) => {
  // Sort biased terms by index
  const sortedTerms = [...biasedTerms].sort((a, b) => a.index - b.index);

  // Create segments of text with highlighted biased terms
  const segments: { text: string; isBiased: boolean; category?: string; term?: string }[] = [];
  let lastIndex = 0;

  sortedTerms.forEach((term) => {
    // Add the text before the biased term
    if (term.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, term.index),
        isBiased: false,
      });
    }

    // Add the biased term
    segments.push({
      text: term.term,
      isBiased: true,
      category: term.category,
      term: term.term,
    });

    lastIndex = term.index + term.term.length;
  });

  // Add the remaining text after the last biased term
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isBiased: false,
    });
  }

  // Get category color
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'gender':
        return 'bg-pink-200 text-pink-800 border-pink-300';
      case 'age':
        return 'bg-blue-200 text-blue-800 border-blue-300';
      case 'race':
        return 'bg-purple-200 text-purple-800 border-purple-300';
      default:
        return 'bg-yellow-200 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md h-96 overflow-y-auto">
      <div className="text-sm mb-3 pb-2 border-b border-neutral-200">
        <span className="font-medium">Legend:</span>{' '}
        <span className="inline-block px-2 py-0.5 bg-pink-200 text-pink-800 border border-pink-300 rounded-md mr-2">Gender</span>
        <span className="inline-block px-2 py-0.5 bg-blue-200 text-blue-800 border border-blue-300 rounded-md mr-2">Age</span>
        <span className="inline-block px-2 py-0.5 bg-purple-200 text-purple-800 border border-purple-300 rounded-md mr-2">Race</span>
        <span className="inline-block px-2 py-0.5 bg-yellow-200 text-yellow-800 border border-yellow-300 rounded-md">Other</span>
      </div>

      <div className="whitespace-pre-wrap overflow-y-auto">
        {segments.map((segment, index) => (
          <React.Fragment key={index}>
            {segment.isBiased ? (
              <span
                className={`px-1 py-0.5 border rounded-md ${getCategoryColor(segment.category || 'other')}`}
                title={`Category: ${segment.category}`}
              >
                {segment.text}
              </span>
            ) : (
              segment.text
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 text-neutral-600 text-sm">
        <span className="font-medium">Found:</span> {biasedTerms.length} potentially biased terms
      </div>
    </div>
  );
};

export default BiasHighlighter;
