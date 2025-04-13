import { PDFAnnotation } from '../../components/PDFAnnotator';
import { getColorForCategory } from './PDFUtils';

/**
 * Convert biased terms to PDF annotations
 * @param biasedTerms Array of biased terms
 * @param existingAnnotations Existing PDF annotations
 * @returns New array of annotations
 */
export const createBiasAnnotations = (
  biasedTerms: any[],
  existingAnnotations: PDFAnnotation[]
): PDFAnnotation[] => {
  // Check if biasedTerms is valid
  if (!biasedTerms || !Array.isArray(biasedTerms) || biasedTerms.length === 0) {
    console.log('No biased terms to highlight');
    return existingAnnotations;
  }

  try {
    // Remove existing bias annotations
    const filteredAnnotations = existingAnnotations.filter(ann =>
      !(ann.type === 'highlight' && ann.uuid && ann.uuid.startsWith('bias-')));

    // Create new bias highlight annotations
    const newAnnotations: PDFAnnotation[] = biasedTerms.map((term, index) => {
      // Create a unique ID for this annotation
      const uuid = `bias-${term.term}-${Date.now()}-${index}`;

      // Get category-specific color
      const color = getColorForCategory(term.category);

      // TODO: Create highlight annotation
      // Note: in a real implementation, you would need to
      // find the actual position of this text in the PDF
      return {
        type: 'highlight',
        uuid,
        pageIndex: 0, // We'll default to first page since we don't know the actual position
        rects: [], // This would need to contain the actual position of the term in the PDF
        color,
        author: 'Bias Checker',
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        content: `Biased term (${term.category}): ${term.term}\nSuggested alternatives: ${term.alternatives?.join(', ') || 'No alternatives provided'}`,
        // Add more properties as needed by ts-pdf library
      };
    });

    // Combine existing and new annotations
    return [...filteredAnnotations, ...newAnnotations];
  } catch (error) {
    console.error('Error creating bias annotations:', error);
    throw new Error(`Error creating bias annotations: ${error}`);
  }
};
