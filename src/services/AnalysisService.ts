/**
 * Service for analyzing text and data
 */
import {analyzeBiasedLanguage} from "./AnalyzeBiasedLanguage";

/**
 * Analyze personal identifiers in text
 */
export const analyzePersonalIdentifiers = (text: string): {
    personalIdentifiers: { type: string; value: string; index: number }[];
} => {
    const personalIdentifiers: { type: string; value: string; index: number }[] = [];

    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;

    while ((match = emailPattern.exec(text)) !== null) {
        personalIdentifiers.push({
            type: 'email', value: match[0], index: match.index,
        });
    }

    // Phone pattern (simple version)
    const phonePattern = /\b(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g;

    while ((match = phonePattern.exec(text)) !== null) {
        personalIdentifiers.push({
            type: 'phone', value: match[0], index: match.index,
        });
    }

    // Address pattern (simple detection)
    const addressPattern = /\b\d+\s+[A-Za-z\s]+\b(Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Place|Pl)\b/gi;

    while ((match = addressPattern.exec(text)) !== null) {
        personalIdentifiers.push({
            type: 'address', value: match[0], index: match.index,
        });
    }

    // Name detection (based on common patterns)
    // This is simplified and would be more complex in a real application
    const namePatterns = [// Common name indicators
        /\b(Name|Full Name|I am|My name is)\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)(\s+[A-Z][a-z]+)?\b/g, // First line of resume often contains name
        /^\s*([A-Z][a-z]+\s+[A-Z][a-z]+)(\s+[A-Z][a-z]+)?\s*$/m,];

    namePatterns.forEach((pattern) => {
        while ((match = pattern.exec(text)) !== null) {
            const name = match[2] || match[1];
            if (name && name.length > 4) { // Simple check to avoid short matches
                personalIdentifiers.push({
                    type: 'name', value: name, index: match.index + (match[0].indexOf(name) || 0),
                });
            }
        }
    });

    // LinkedIn URL
    const linkedinPattern = /\b(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\b/gi;

    while ((match = linkedinPattern.exec(text)) !== null) {
        personalIdentifiers.push({
            type: 'social', value: match[0], index: match.index,
        });
    }

    // GitHub URL
    const githubPattern = /\b(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+\b/gi;

    while ((match = githubPattern.exec(text)) !== null) {
        personalIdentifiers.push({
            type: 'social', value: match[0], index: match.index,
        });
    }

    return {
        personalIdentifiers,
    };
};

/**
 * Anonymize text by removing or replacing personal identifiers
 */
export const anonymizeText = (text: string, options: {
    replaceNames?: boolean;
    replaceEmails?: boolean;
    replacePhones?: boolean;
    replaceAddresses?: boolean;
    replaceSocial?: boolean;
} = {}): {
    anonymizedText: string; replacements: { original: string; replacement: string; type: string }[];
} => {
    const {
        replaceNames = true, replaceEmails = true, replacePhones = true, replaceAddresses = true, replaceSocial = true,
    } = options;

    const {personalIdentifiers} = analyzePersonalIdentifiers(text);
    let anonymizedText = text;
    const replacements: { original: string; replacement: string; type: string }[] = [];

    // Sort identifiers by index in reverse order (to avoid index shifting when replacing)
    const sortedIdentifiers = [...personalIdentifiers].sort((a, b) => b.index - a.index);

    sortedIdentifiers.forEach((identifier) => {
        const {type, value, index} = identifier;
        let replacement = '';
        let shouldReplace = false;

        switch (type) {
            case 'name':
                if (replaceNames) {
                    replacement = '[NAME]';
                    shouldReplace = true;
                }
                break;
            case 'email':
                if (replaceEmails) {
                    replacement = '[EMAIL]';
                    shouldReplace = true;
                }
                break;
            case 'phone':
                if (replacePhones) {
                    replacement = '[PHONE]';
                    shouldReplace = true;
                }
                break;
            case 'address':
                if (replaceAddresses) {
                    replacement = '[ADDRESS]';
                    shouldReplace = true;
                }
                break;
            case 'social':
                if (replaceSocial) {
                    replacement = '[SOCIAL MEDIA]';
                    shouldReplace = true;
                }
                break;
        }

        if (shouldReplace) {
            anonymizedText = anonymizedText.substring(0, index) + replacement + anonymizedText.substring(index + value.length);

            replacements.push({
                original: value, replacement, type,
            });
        }
    });

    return {
        anonymizedText, replacements,
    };
};

/**
 * Analyze diversity representation in data
 */
export const analyzeDiversity = (data: Record<string, any>[], attributeFields: {
    [key: string]: string
}): Record<string, Record<string, number>> => {
    const result: Record<string, Record<string, number>> = {};

    // Initialize result object with attribute categories
    Object.keys(attributeFields).forEach((category) => {
        result[category] = {};
    });

    // Count occurrences of each attribute value
    data.forEach((item) => {
        Object.entries(attributeFields).forEach(([category, field]) => {
            const value = item[field];

            if (value) {
                const normalizedValue = String(value).trim();

                if (normalizedValue) {
                    result[category][normalizedValue] = (result[category][normalizedValue] || 0) + 1;
                }
            }
        });
    });

    return result;
};

/**
 * Analyze skill distribution in data
 */
export const analyzeSkills = (data: Record<string, any>[], skillField: string): Record<string, number> => {
    const skills: Record<string, number> = {};

    data.forEach((item) => {
        const skillValue = item[skillField];

        if (skillValue) {
            // Handle both string and array formats
            if (Array.isArray(skillValue)) {
                skillValue.forEach((skill) => {
                    const normalizedSkill = String(skill).trim().toLowerCase();
                    if (normalizedSkill) {
                        skills[normalizedSkill] = (skills[normalizedSkill] || 0) + 1;
                    }
                });
            } else if (typeof skillValue === 'string') {
                // Split by commas if it's a comma-separated string
                skillValue.split(/,|;/).forEach((skill) => {
                    const normalizedSkill = skill.trim().toLowerCase();
                    if (normalizedSkill) {
                        skills[normalizedSkill] = (skills[normalizedSkill] || 0) + 1;
                    }
                });
            }
        }
    });

    return skills;
};

export default {
    analyzeBiasedLanguage, analyzePersonalIdentifiers, anonymizeText, analyzeDiversity, analyzeSkills,
};
