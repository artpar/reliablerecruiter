/**
 * Service for analyzing text and data
 */

// Common biased terms that might appear in job descriptions
const biasedTerms: Record<string, string[]> = {
  gender: [
    'rockstar',
    'ninja',
    'guru',
    'superhero',
    'superman',
    'superwoman',
    'chairman',
    'manpower',
    'manmade',
    'mankind',
    'middleman',
    'salesman',
    'saleswoman',
    'policeman',
    'policewoman',
    'fireman',
    'firewoman',
    'spokesman',
    'spokeswoman',
    'steward',
    'stewardess',
    'waitress',
    'waiter',
    'cameraman',
    'camerawomen',
    'strong',
    'assertive',
    'decisive',
    'ambitious',
    'dominant',
    'aggressive',
    'competitive',
    'outspoken',
    'nurturing',
    'supportive',
    'compassionate',
    'collaborative',
    'interpersonal',
    'warm',
    'committed',
    'maternal',
    'paternal',
    'guys',
  ],
  age: [
    'young',
    'energetic',
    'fresh',
    'recent graduate',
    'digital native',
    'junior',
    'senior',
    'seasoned',
    'mature',
    'experienced',
    'veteran',
    'retiree',
    'elderly',
  ],
  race: [
    'native',
    'western',
    'eastern',
    'minority',
    'culture fit',
    'cultural fit',
    'urban',
    'ghetto',
    'exotic',
    'articulate',
  ],
};

// Inclusive alternatives for biased terms
const inclusiveAlternatives: Record<string, string[]> = {
  rockstar: ['expert', 'highly skilled professional', 'talented professional'],
  ninja: ['specialist', 'expert', 'professional'],
  guru: ['subject matter expert', 'authority', 'specialist'],
  superhero: ['high performer', 'achiever', 'top performer'],
  chairman: ['chairperson', 'chair', 'head of committee'],
  manpower: ['workforce', 'staff', 'personnel', 'team'],
  manmade: ['artificial', 'manufactured', 'synthetic', 'human-made'],
  mankind: ['humanity', 'people', 'human beings', 'humankind'],
  middleman: ['intermediary', 'go-between', 'liaison', 'broker'],
  salesman: ['salesperson', 'sales representative', 'sales associate'],
  saleswoman: ['salesperson', 'sales representative', 'sales associate'],
  policeman: ['police officer', 'officer', 'law enforcement officer'],
  policewoman: ['police officer', 'officer', 'law enforcement officer'],
  fireman: ['firefighter', 'fire service officer'],
  firewoman: ['firefighter', 'fire service officer'],
  spokesman: ['spokesperson', 'representative', 'advocate'],
  spokeswoman: ['spokesperson', 'representative', 'advocate'],
  steward: ['flight attendant', 'cabin crew member'],
  stewardess: ['flight attendant', 'cabin crew member'],
  waitress: ['server', 'wait staff', 'waiting staff'],
  waiter: ['server', 'wait staff', 'waiting staff'],
  cameraman: ['camera operator', 'videographer', 'photographer'],
  camerawoman: ['camera operator', 'videographer', 'photographer'],
  young: ['adaptable', 'flexible', 'innovative'],
  energetic: ['motivated', 'dynamic', 'enthusiastic'],
  'recent graduate': ['early career professional', 'entry-level applicant'],
  'digital native': ['digitally proficient', 'tech-savvy', 'technology proficient'],
  junior: ['early career', 'entry-level', 'developing'],
  senior: ['experienced', 'advanced career', 'seasoned'],
  guys: ['team', 'everyone', 'folks', 'people', 'all'],
};

/**
 * Analyze text for biased language
 */
export const analyzeBiasedLanguage = (text: string): {
  biasedTerms: { term: string; index: number; category: string; alternatives: string[] }[];
  score: number;
} => {
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  const biasedTermsFound: { term: string; index: number; category: string; alternatives: string[] }[] = [];
  
  // Check for each category of biased terms
  Object.entries(biasedTerms).forEach(([category, terms]) => {
    terms.forEach((term) => {
      let index = lowerText.indexOf(term.toLowerCase());
      
      while (index !== -1) {
        // Check if the term is a whole word (not part of another word)
        const beforeChar = index === 0 ? ' ' : lowerText[index - 1];
        const afterChar = index + term.length >= lowerText.length ? ' ' : lowerText[index + term.length];
        
        if (!/[a-zA-Z0-9]/.test(beforeChar) && !/[a-zA-Z0-9]/.test(afterChar)) {
          const alternatives = inclusiveAlternatives[term] || [];
          
          biasedTermsFound.push({
            term: text.substring(index, index + term.length), // Use original case
            index,
            category,
            alternatives,
          });
        }
        
        index = lowerText.indexOf(term.toLowerCase(), index + 1);
      }
    });
  });
  
  // Calculate bias score (0-100, where 0 is unbiased)
  const wordCount = text.split(/\s+/).length;
  const biasScore = Math.min(
    100,
    Math.round((biasedTermsFound.length / Math.max(1, wordCount)) * 1000)
  );
  
  return {
    biasedTerms: biasedTermsFound,
    score: biasScore,
  };
};

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
      type: 'email',
      value: match[0],
      index: match.index,
    });
  }
  
  // Phone pattern (simple version)
  const phonePattern = /\b(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g;
  
  while ((match = phonePattern.exec(text)) !== null) {
    personalIdentifiers.push({
      type: 'phone',
      value: match[0],
      index: match.index,
    });
  }
  
  // Address pattern (simple detection)
  const addressPattern = /\b\d+\s+[A-Za-z\s]+\b(Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Place|Pl)\b/gi;
  
  while ((match = addressPattern.exec(text)) !== null) {
    personalIdentifiers.push({
      type: 'address',
      value: match[0],
      index: match.index,
    });
  }
  
  // Name detection (based on common patterns)
  // This is simplified and would be more complex in a real application
  const namePatterns = [
    // Common name indicators
    /\b(Name|Full Name|I am|My name is)\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)(\s+[A-Z][a-z]+)?\b/g,
    // First line of resume often contains name
    /^\s*([A-Z][a-z]+\s+[A-Z][a-z]+)(\s+[A-Z][a-z]+)?\s*$/m,
  ];
  
  namePatterns.forEach((pattern) => {
    while ((match = pattern.exec(text)) !== null) {
      const name = match[2] || match[1];
      if (name && name.length > 4) { // Simple check to avoid short matches
        personalIdentifiers.push({
          type: 'name',
          value: name,
          index: match.index + (match[0].indexOf(name) || 0),
        });
      }
    }
  });
  
  // LinkedIn URL
  const linkedinPattern = /\b(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\b/gi;
  
  while ((match = linkedinPattern.exec(text)) !== null) {
    personalIdentifiers.push({
      type: 'social',
      value: match[0],
      index: match.index,
    });
  }
  
  // GitHub URL
  const githubPattern = /\b(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+\b/gi;
  
  while ((match = githubPattern.exec(text)) !== null) {
    personalIdentifiers.push({
      type: 'social',
      value: match[0],
      index: match.index,
    });
  }
  
  return {
    personalIdentifiers,
  };
};

/**
 * Anonymize text by removing or replacing personal identifiers
 */
export const anonymizeText = (
  text: string,
  options: {
    replaceNames?: boolean;
    replaceEmails?: boolean;
    replacePhones?: boolean;
    replaceAddresses?: boolean;
    replaceSocial?: boolean;
  } = {}
): {
  anonymizedText: string;
  replacements: { original: string; replacement: string; type: string }[];
} => {
  const {
    replaceNames = true,
    replaceEmails = true,
    replacePhones = true,
    replaceAddresses = true,
    replaceSocial = true,
  } = options;
  
  const { personalIdentifiers } = analyzePersonalIdentifiers(text);
  let anonymizedText = text;
  const replacements: { original: string; replacement: string; type: string }[] = [];
  
  // Sort identifiers by index in reverse order (to avoid index shifting when replacing)
  const sortedIdentifiers = [...personalIdentifiers].sort((a, b) => b.index - a.index);
  
  sortedIdentifiers.forEach((identifier) => {
    const { type, value, index } = identifier;
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
      anonymizedText = anonymizedText.substring(0, index) + 
                      replacement + 
                      anonymizedText.substring(index + value.length);
      
      replacements.push({
        original: value,
        replacement,
        type,
      });
    }
  });
  
  return {
    anonymizedText,
    replacements,
  };
};

/**
 * Analyze diversity representation in data
 */
export const analyzeDiversity = (
  data: Record<string, any>[],
  attributeFields: { [key: string]: string }
): Record<string, Record<string, number>> => {
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
export const analyzeSkills = (
  data: Record<string, any>[],
  skillField: string
): Record<string, number> => {
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
  analyzeBiasedLanguage,
  analyzePersonalIdentifiers,
  anonymizeText,
  analyzeDiversity,
  analyzeSkills,
};
