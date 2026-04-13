import { PorterStemmer, WordTokenizer } from 'natural';
import { ScoringDetails, SectionWeightsConfig, ApplicantResult } from '@/types';

const SECTION_WEIGHTS: SectionWeightsConfig = {
  skills: 1.5,      // Highest weight for skills section matches
  experience: 1.3,
  summary: 1.2,
  other: 1.0
};

const STOPWORDS: Set<string> = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'so', 'than', 'too', 'very',
  'just', 'also', 'about', 'above', 'after', 'again', 'before', 'between', 'during'
]);

const tokenizer = new WordTokenizer();

function tokenizeAndClean(text: string): string[] {
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  return tokens
    .filter(token => token.length > 2 && !STOPWORDS.has(token) && /[a-z]/.test(token))
    .map(token => PorterStemmer.stem(token));
}

function extractKeywords(jobDescriptionText: string, topN: number = 150): string[] {
  const tokens = tokenizeAndClean(jobDescriptionText);
  const frequencyMap = new Map<string, number>();
  
  tokens.forEach(token => {
    frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
  });
  
  // Sort by frequency and take top N
  const sorted = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(entry => entry[0]);
  
  return sorted;
}

function calculateTFIDF(jobDescription: string, resumeText: string): { tfIdfScore: number; matchedTerms: string[] } {
  const keywords = extractKeywords(jobDescription, 100);
  const resumeTokens = tokenizeAndClean(resumeText);
  const resumeTokenFreq = new Map<string, number>();
  
  resumeTokens.forEach(token => {
    resumeTokenFreq.set(token, (resumeTokenFreq.get(token) || 0) + 1);
  });
  
  let matchCount = 0;
  const matchedTerms: Set<string> = new Set();
  
  keywords.forEach(keyword => {
    if (resumeTokenFreq.has(keyword)) {
      matchCount++;
      matchedTerms.add(keyword);
    }
  });
  
  const score = (matchCount / keywords.length) * 100;
  return {
    tfIdfScore: Math.min(score, 100),
    matchedTerms: Array.from(matchedTerms)
  };
}

function extractBigrams(text: string): string[] {
  const tokens = text.toLowerCase().split(/[\s\-,./()[\]:;]+/).filter(t => t.length > 0);
  const bigrams: string[] = [];
  
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = tokens[i] + ' ' + tokens[i + 1];
    if (bigram.length > 4 && !STOPWORDS.has(tokens[i]) && !STOPWORDS.has(tokens[i + 1])) {
      bigrams.push(bigram);
    }
  }
  
  return bigrams;
}

function matchBigrams(jobDescription: string, resumeText: string): { phraseScore: number; matchedPhrases: string[] } {
  const jobBigrams = extractBigrams(jobDescription);
  const resumeBigrams = extractBigrams(resumeText);
  const resumeBigramSet = new Set(resumeBigrams);
  
  let matchCount = 0;
  const matchedPhrases: Set<string> = new Set();
  
  jobBigrams.forEach(bigram => {
    if (resumeBigramSet.has(bigram)) {
      matchCount++;
      matchedPhrases.add(bigram);
    }
  });
  
  if (jobBigrams.length === 0) return { phraseScore: 0, matchedPhrases: [] };
  
  // Phrase matching is worth 20 points max
  const score = (matchCount / jobBigrams.length) * 20;
  return {
    phraseScore: Math.min(score, 20),
    matchedPhrases: Array.from(matchedPhrases)
  };
}

function calculateSectionWeightedScore(
  jobDescription: string,
  sections: { skills: string; experience: string; summary: string; other: string }
): { sectionScore: number; sectionMatches: Map<string, number> } {
  const keywords = extractKeywords(jobDescription, 80);
  const keywordSet = new Set(keywords);
  const sectionMatchMap = new Map<string, number>();
  
  let totalWeightedMatches = 0;
  let totalWeight = 0;
  
  (Object.entries(sections) as [keyof typeof sections, string][]).forEach(([sectionName, sectionText]) => {
    if (sectionText.length === 0) return;
    
    const tokens = tokenizeAndClean(sectionText);
    let matchCount = 0;
    
    tokens.forEach(token => {
      if (keywordSet.has(token)) {
        matchCount++;
      }
    });
    
    const weight = SECTION_WEIGHTS[sectionName];
    const weightedMatches = (matchCount / Math.max(tokens.length, 1)) * weight * 100;
    
    sectionMatchMap.set(sectionName, weightedMatches);
    totalWeightedMatches += weightedMatches;
    totalWeight += weight;
  });
  
  const score = totalWeight > 0 ? (totalWeightedMatches / totalWeight) * 30 : 0;
  return {
    sectionScore: Math.min(score, 30),
    sectionMatches: sectionMatchMap
  };
}

function calculateKeywordMatching(jobDescription: string, resumeText: string): { keywordScore: number; exactMatches: number; totalKeywords: number } {
  const keywords = extractKeywords(jobDescription, 120);
  const resumeTokens = tokenizeAndClean(resumeText);
  const resumeTokenSet = new Set(resumeTokens);
  
  let exactMatches = 0;
  keywords.forEach(keyword => {
    if (resumeTokenSet.has(keyword)) {
      exactMatches++;
    }
  });
  
  // Keyword matching is worth 50 points max
  const score = (exactMatches / keywords.length) * 50;
  return {
    keywordScore: Math.min(score, 50),
    exactMatches,
    totalKeywords: keywords.length
  };
}

export function scoreResume(jobDescription: string, resumeText: string, sections: { skills: string; experience: string; summary: string; other: string }): ScoringDetails {
  // Calculate individual scores
  const { tfIdfScore, matchedTerms: tfIdfMatches } = calculateTFIDF(jobDescription, resumeText);
  const { phraseScore, matchedPhrases } = matchBigrams(jobDescription, resumeText);
  const { sectionScore } = calculateSectionWeightedScore(jobDescription, sections);
  const { keywordScore, exactMatches, totalKeywords } = calculateKeywordMatching(jobDescription, resumeText);
  
  // Extract missing keywords (keywords not in resume)
  const keywords = extractKeywords(jobDescription, 100);
  const resumeTokens = new Set(tokenizeAndClean(resumeText));
  const missingKeywords = keywords.filter(k => !resumeTokens.has(k)).slice(0, 15);
  
  // Combine scores with weights
  const weights = {
    tfIdf: 0.30,
    keyword: 0.35,
    section: 0.20,
    phrase: 0.15
  };
  
  const totalScore = 
    (tfIdfScore * weights.tfIdf) +
    (keywordScore * weights.keyword) +
    (sectionScore * weights.section) +
    (phraseScore * weights.phrase);
  
  return {
    totalScore: Math.round(totalScore * 100) / 100,
    tfIdfScore: Math.round(tfIdfScore * 100) / 100,
    keywordScore: Math.round(keywordScore * 100) / 100,
    sectionScore: Math.round(sectionScore * 100) / 100,
    phraseScore: Math.round(phraseScore * 100) / 100,
    matchedKeywords: Array.from(new Set([...tfIdfMatches, ...matchedPhrases])).slice(0, 20),
    missingKeywords: missingKeywords,
    weights
  };
}

export function extractKeywordsFromJobDescription(jobDescription: string, topN: number = 50): string[] {
  return extractKeywords(jobDescription, topN);
}

export { extractKeywords };
