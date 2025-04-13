import {PDFAnnotation} from "../components/PDFAnnotator";
import {searchText} from "../services/PDFAnnotationService";

const getColorForCategory = (category: string): string => {
    switch (category?.toLowerCase()) {
        case 'gender':
            return 'rgba(255, 105, 180, 0.3)'; // Pink
        case 'age':
            return 'rgba(100, 149, 237, 0.3)'; // Blue
        case 'race':
            return 'rgba(147, 112, 219, 0.3)'; // Purple
        default:
            return 'rgba(255, 255, 0, 0.3)'; // Yellow
    }
};

export const createBiasAnnotations = async (biasedTerms: any[], file) => {
    // Check if biasedTerms is valid
    if (!biasedTerms || !Array.isArray(biasedTerms) || biasedTerms.length === 0) {
        console.log('No biased terms to highlight');
        return [];
    }

    try {
        // Remove existing bias annotations


        // Import the PDFAnnotationService

        // Create new bias highlight annotations
        const newAnnotations: PDFAnnotation[] = [];

        // Process each biased term to find its position in the PDF
        for (const [index, term] of biasedTerms.entries()) {
            try {
                // Create a unique ID for this annotation
                const uuid = `bias-${term.term}-${Date.now()}-${index}`;

                // Get category-specific color
                const color = getColorForCategory(term.category);

                // Search for the term in the PDF to get its position
                const searchResults = await searchText(file.content as ArrayBuffer, term.term, {
                    matchCase: false, wholeWord: true
                });

                if (searchResults && searchResults.length > 0) {
                    // Create an annotation for each occurrence of the term
                    for (const result of searchResults) {
                        console.log(`Term "${term.term}" found in PDF, creating default annotation`, result);
                        newAnnotations.push({
                            "annotationType": "/Highlight",
                            "uuid": `${uuid}-${result.pageNumber}`,
                            "page": result.pageNumber - 1,
                            "dateCreated": "2025-04-13T12:59:39.422Z",
                            "dateModified": "2025-04-13T12:59:39.422Z",
                            "author": "BiasCheck",
                            "rect": result.rect,
                            "bbox": result.rect,
                            "textContent": term.term,
                            "matrix": [1, 0, 0, 1, 0, 0],
                            "quadPoints": result.quadPoints,
                            "color": [0, 0.5, 0, 0.5],
                            "strokeWidth": 1,
                            "strokeDashGap": [2, 0]
                        });
                    }
                } else {
                    // If term not found, create a default annotation on the first page
                    console.log(`Term "${term.term}" not found in PDF, creating default annotation`, 0);
                    const defaultAnnotation: PDFAnnotation = {
                        "annotationType": "/Highlight",
                        "uuid": `${uuid}-${result.pageNumber}`,
                        "pageId": 3,
                        "dateCreated": "2025-04-13T12:59:39.422Z",
                        "dateModified": "2025-04-13T12:59:39.422Z",
                        "author": "HR ToolKit User",
                        "rect": [414.9545166015625, 162.40908203125, 454.3635986328125, 172.90908203125],
                        "bbox": [414.9545166015625, 162.40908203125, 454.3635986328125, 172.90908203125],
                        "matrix": [1, 0, 0, 1, 0, 0],
                        "quadPoints": [414.9545166015625, 172.90908203125, 451.5133056640625, 172.90908203125, 414.9545166015625, 162.40908203125, 451.5133056640625, 162.40908203125, 451.7385986328125, 172.90908203125, 454.3635986328125, 172.90908203125, 451.7385986328125, 162.40908203125, 454.3635986328125, 162.40908203125],
                        "color": [0, 0, 0, 0.5],
                        "strokeWidth": 2,
                        "strokeDashGap": [3, 0]
                    };
                    newAnnotations.push(defaultAnnotation);
                }
            } catch (termError) {
                console.error(`Error processing term "${term.term}":`, termError);
                throw termError;
            }
        }

        return newAnnotations;

    } catch (error) {
        throw error;
        return []
    }
};
