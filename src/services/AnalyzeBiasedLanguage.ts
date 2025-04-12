/**
 * Comprehensive Bias Detector
 *
 * This solution uses established NLP libraries (alex, retext-equality) to detect biased language
 * without requiring hardcoded word lists.
 */

import { VFile } from 'vfile';
import { reporter } from 'vfile-reporter';
import alex from 'alex';
import { unified } from 'unified';
import retextEnglish from 'retext-english';
import retextEquality from 'retext-equality';
import retextStringify from 'retext-stringify';

// Define types for our bias detection results
type BiasCategory = 'gender' | 'age' | 'race' | 'ability' | 'socioeconomic' | 'appearance' | 'other';
type SeverityLevel = 'high' | 'medium' | 'low';

interface BiasedTerm {
    term: string;
    index: number;
    line: number;
    column: number;
    category: BiasCategory;
    severity: SeverityLevel;
    alternatives: string[];
    context: string;
    ruleId?: string;
    source: 'alex' | 'retext-equality';
}

interface BiasAnalysisResult {
    biasedTerms: BiasedTerm[];
    score: number;
    categoryScores: Record<BiasCategory, number>;
    suggestions: string[];
    summary: string;
}

// Category weights for scoring (0-1, sum should be 1)
const categoryWeights: Record<BiasCategory, number> = {
    gender: 0.25,
    age: 0.2,
    race: 0.2,
    ability: 0.15,
    socioeconomic: 0.1,
    appearance: 0.05,
    other: 0.05
};

// Severity weights for scoring
const severityWeights: Record<SeverityLevel, number> = {
    high: 1.0,
    medium: 0.6,
    low: 0.3
};

/**
 * Maps retext rule IDs to our category system
 */
const mapRuleIdToCategory = (ruleId: string): BiasCategory => {
    const categoryMap: Record<string, BiasCategory> = {
        'typography': 'other',
        'general': 'other',
        'inclusive': 'other',
        'pronoun': 'gender',
        'women': 'gender',
        'men': 'gender',
        'gender': 'gender',
        'race': 'race',
        'culture': 'race',
        'nationality': 'race',
        'religion': 'race',
        'ability': 'ability',
        'disability': 'ability',
        'health': 'ability',
        'age': 'age',
        'socioeconomic': 'socioeconomic',
        'appearance': 'appearance',
        'sexual-orientation': 'other'
    };

    // Extract the main category from rule ID
    const mainCategory = ruleId.split('.')[0];
    return categoryMap[mainCategory] || 'other';
};

/**
 * Maps alex severity to our severity levels
 */
const mapAlexSeverity = (severity?: number): SeverityLevel => {
    if (severity === 2) return 'high';
    if (severity === 1) return 'medium';
    return 'low';
};

/**
 * Gets a snippet of text around a biased term for context
 */
const getTermContext = (text: string, index: number, length: number): string => {
    const contextLength = 40;
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + length + contextLength);

    return (start > 0 ? '...' : '') +
        text.substring(start, index) +
        '[' + text.substring(index, index + length) + ']' +
        text.substring(index + length, end) +
        (end < text.length ? '...' : '');
};

/**
 * Analyzes text using alex
 */
const analyzeWithAlex = async (text: string): Promise<BiasedTerm[]> => {
    const results: BiasedTerm[] = [];

    try {
        // Process the text with alex
        const file = new VFile({ path: 'text.md', value: text });
        const alexResult = alex(file);

        alexResult.messages.forEach((message) => {
            // Extract position information
            const position = message.position;
            if (!position) return;

            // Find the biased term in the text
            const line = position.start.line;
            const column = position.start.column;
            const index = position.start.offset || 0;

            // Extract the term from the message
            const termMatch = message.actual;
            const term = message.actual;

            // Determine the category
            const ruleId = message.source || '';
            const category = mapRuleIdToCategory(ruleId);

            // Map alex severity to our levels
            const severity = mapAlexSeverity(message.fatal ? 2 : 1);

            // Extract alternatives if available
            const alternativesMatch = message.reason?.match(/Consider using (.+?) instead/i);
            const alternatives = alternativesMatch
                ? alternativesMatch[1].split(/,\s*|or\s*/).map(alt => alt.replace(/'/g, '').trim())
                : [];

            // Get context around the term
            const context = message.reason;

            results.push({
                term,
                index,
                line,
                column,
                category,
                severity,
                alternatives,
                context,
                ruleId,
                source: 'alex'
            });
        });

        return results;
    } catch (error) {
        console.error('Error analyzing with alex:', error);
        return [];
    }
};

/**
 * Analyzes text using retext-equality
 */
const analyzeWithRetextEquality = async (text: string): Promise<BiasedTerm[]> => {
    const results: BiasedTerm[] = [];

    try {
        // Process the text with retext-equality
        const processor = unified()
            .use(retextEnglish)
            .use(retextEquality)
            .use(retextStringify);

        const file = new VFile({ value: text });
        await processor.process(file);

        file.messages.forEach((message) => {
            // Extract position information
            const position = message.position;
            if (!position) return;

            // Find the biased term in the text
            const line = position.start.line;
            const column = position.start.column;
            const index = position.start.offset || 0;

            // Extract the term from the message
            const termMatch = message.actual;
            const term = message.actual;

            // Determine the category
            const ruleId = message.ruleId || message.source || '';
            const category = mapRuleIdToCategory(ruleId);

            // Determine severity based on category
            let severity: SeverityLevel = 'medium';
            if (category === 'gender' || category === 'race') {
                severity = 'high';
            } else if (category === 'other') {
                severity = 'low';
            }

            // Extract alternatives if available
            const alternativesMatch = message.reason?.match(/Consider using (.+)/i);
            const alternatives = alternativesMatch
                ? alternativesMatch[1].split(/,\s*|or\s*/).map(alt => alt.replace(/'/g, '').trim())
                : [];

            // Get context around the term
            const context = message.reason;

            results.push({
                term,
                index,
                line,
                column,
                category,
                severity,
                alternatives,
                context,
                ruleId,
                source: 'retext-equality'
            });
        });

        return results;
    } catch (error) {
        console.error('Error analyzing with retext-equality:', error);
        return [];
    }
};

/**
 * Merge and deduplicate results from multiple analyzers
 */
const mergeResults = (results: BiasedTerm[][]): BiasedTerm[] => {
    const merged: BiasedTerm[] = [];
    const seenTermsAtPositions = new Set<string>();

    // Flatten results
    const allResults = results.flat();

    allResults.forEach(result => {
        const key = `${result.term}:${result.index}`;

        // Check for duplicates
        if (!seenTermsAtPositions.has(key)) {
            merged.push(result);
            seenTermsAtPositions.add(key);
        }
    });

    // Sort by position
    return merged.sort((a, b) => a.index - b.index);
};

/**
 * Generates suggestions based on bias analysis
 */
const generateSuggestions = (
    biasedTerms: BiasedTerm[],
    categoryScores: Record<BiasCategory, number>
): string[] => {
    const suggestions: string[] = [];

    // Add general suggestion if bias is detected
    if (biasedTerms.length > 0) {
        suggestions.push(
            "Consider reviewing your text for potentially biased language and replacing with more inclusive alternatives."
        );
    }

    // Get high severity terms
    const highSeverityTerms = biasedTerms.filter(term => term.severity === 'high');
    if (highSeverityTerms.length > 0) {
        suggestions.push(
            `Priority: Replace ${highSeverityTerms.length} high-severity biased ${highSeverityTerms.length === 1 ? 'term' : 'terms'}.`
        );
    }

    // Add category-specific suggestions for highest scoring categories
    const sortedCategories = Object.entries(categoryScores)
        .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)
        .filter(([_, score]) => score > 20)
        .map(([category]) => category as BiasCategory);

    if (sortedCategories.length > 0) {
        sortedCategories.slice(0, 2).forEach(category => {
            switch (category) {
                case 'gender':
                    suggestions.push("Consider using gender-neutral language throughout your text.");
                    break;
                case 'age':
                    suggestions.push("Review age-related terms that may exclude certain age groups.");
                    break;
                case 'race':
                    suggestions.push("Ensure language is culturally inclusive and avoids racial or ethnic stereotypes.");
                    break;
                case 'ability':
                    suggestions.push("Use person-first language and avoid terms that may stigmatize disabilities.");
                    break;
                case 'socioeconomic':
                    suggestions.push("Be mindful of terms that may reinforce socioeconomic stereotypes or assumptions.");
                    break;
                case 'appearance':
                    suggestions.push("Avoid language that emphasizes physical appearance when not relevant.");
                    break;
            }
        });
    }

    // Add term-specific replacement suggestions for high severity terms
    const uniqueHighSeverityTerms = new Map<string, BiasedTerm>();
    highSeverityTerms.forEach(term => {
        if (!uniqueHighSeverityTerms.has(term.term.toLowerCase())) {
            uniqueHighSeverityTerms.set(term.term.toLowerCase(), term);
        }
    });

    uniqueHighSeverityTerms.forEach((term) => {
        if (term.alternatives && term.alternatives.length > 0) {
            suggestions.push(
                `Replace "${term.term}" with ${term.alternatives.slice(0, 2).map(alt => `"${alt}"`).join(' or ')}.`
            );
        }
    });

    return suggestions;
};

/**
 * Generates a summary of the bias analysis
 */
const generateSummary = (
    biasedTerms: BiasedTerm[],
    categoryScores: Record<BiasCategory, number>,
    overallScore: number
): string => {
    if (biasedTerms.length === 0) {
        return "No biased language detected in the text.";
    }

    // Categorize the bias level
    let biasLevel = "minimal";
    if (overallScore > 50) biasLevel = "significant";
    else if (overallScore > 25) biasLevel = "moderate";
    else if (overallScore > 10) biasLevel = "slight";

    // Count terms by severity
    const highCount = biasedTerms.filter(t => t.severity === 'high').length;
    const mediumCount = biasedTerms.filter(t => t.severity === 'medium').length;
    const lowCount = biasedTerms.filter(t => t.severity === 'low').length;

    // Find the highest scoring categories
    const sortedCategories = Object.entries(categoryScores)
        .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)
        .filter(([_, score]) => score > 0)
        .map(([category, score]) => ({ category: category as BiasCategory, score }));

    let categorySummary = "";
    if (sortedCategories.length > 0) {
        const topCategories = sortedCategories.slice(0, 2);
        categorySummary = ` Primary concerns are in ${topCategories.map(c => c.category).join(' and ')} language.`;
    }

    return `Analysis detected ${biasLevel} bias (score: ${overallScore}/100) with ${biasedTerms.length} potentially biased terms (${highCount} high, ${mediumCount} medium, ${lowCount} low severity).${categorySummary}`;
};

/**
 * Main function to analyze text for biased language
 */
export const analyzeBiasedLanguage = async (text: string, options: {
    includeContext?: boolean,
    categories?: BiasCategory[],
    minSeverity?: SeverityLevel
} = {}): Promise<BiasAnalysisResult> => {
    // Default options
    const {
        includeContext = true,
        categories = ['gender', 'age', 'race', 'ability', 'socioeconomic', 'appearance', 'other'],
        minSeverity = 'low'
    } = options;

    // Run analyses in parallel
    const [alexResults, retextResults] = await Promise.all([
        analyzeWithAlex(text),
        analyzeWithRetextEquality(text)
    ]);

    // Merge and deduplicate results
    let biasedTermsFound = mergeResults([alexResults, retextResults]);

    // Filter by requested categories and severity
    biasedTermsFound = biasedTermsFound.filter(term => {
        // Filter by category
        if (!categories.includes(term.category)) return false;

        // Filter by minimum severity
        if (minSeverity === 'high' && term.severity !== 'high') return false;
        if (minSeverity === 'medium' && term.severity === 'low') return false;

        return true;
    });

    // Calculate category-specific scores
    const categoryScores: Record<BiasCategory, number> = {
        gender: 0,
        age: 0,
        race: 0,
        ability: 0,
        socioeconomic: 0,
        appearance: 0,
        other: 0
    };

    // Count terms by category and severity
    biasedTermsFound.forEach(term => {
        categoryScores[term.category] += severityWeights[term.severity];
    });

    // Word count for normalization
    const wordCount = text.split(/\s+/).length;

    // Normalize category scores to 0-100
    Object.keys(categoryScores).forEach((category) => {
        const typedCategory = category as BiasCategory;
        categoryScores[typedCategory] = Math.min(100, Math.round(
            (categoryScores[typedCategory] / Math.max(1, wordCount)) * 1000
        ));
    });

    // Calculate overall weighted bias score
    let overallScore = 0;
    Object.entries(categoryScores).forEach(([category, score]) => {
        overallScore += score * categoryWeights[category as BiasCategory];
    });

    // Round to nearest integer
    overallScore = Math.round(overallScore);

    // Generate suggestions based on findings
    const suggestions = generateSuggestions(biasedTermsFound, categoryScores);

    // Generate summary
    const summary = generateSummary(biasedTermsFound, categoryScores, overallScore);

    return {
        biasedTerms: biasedTermsFound,
        score: overallScore,
        categoryScores,
        suggestions,
        summary
    };
};

/**
 * Provides suggestions to make a text more inclusive
 */
export const suggestInclusiveRewrite = async (text: string): Promise<string> => {
    const analysis = await analyzeBiasedLanguage(text);
    let rewrittenText = text;

    // Sort terms by index in reverse order to avoid changing positions
    const sortedTerms = [...analysis.biasedTerms].sort((a, b) => b.index - a.index);

    sortedTerms.forEach(term => {
        if (term.alternatives && term.alternatives.length > 0) {
            // Use the first alternative as default
            const replacement = term.alternatives[0];
            rewrittenText =
                rewrittenText.substring(0, term.index) +
                replacement +
                rewrittenText.substring(term.index + term.term.length);
        }
    });

    return rewrittenText;
};

/**
 * Checks if a text meets a specific bias threshold
 */
export const meetsInclusivityStandard = async (
    text: string,
    maxOverallScore: number = 15,
    maxHighSeverityTerms: number = 0
): Promise<boolean> => {
    const analysis = await analyzeBiasedLanguage(text);
    const highSeverityCount = analysis.biasedTerms.filter(t => t.severity === 'high').length;

    return analysis.score <= maxOverallScore && highSeverityCount <= maxHighSeverityTerms;
};
