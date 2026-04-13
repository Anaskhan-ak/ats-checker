export interface ScoringDetails {
  totalScore: number;
  tfIdfScore: number;
  keywordScore: number;
  sectionScore: number;
  phraseScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  // Add weightings used
  weights: {
    tfIdf: number;
    keyword: number;
    section: number;
    phrase: number;
  };
}

export interface ApplicantResult {
  filename: string;
  candidateName: string;
  score: number;
  scoring: ScoringDetails;
  rawText: string;
  sections: {
    skills: string;
    experience: string;
    summary: string;
    other: string;
  };
}

export interface UploadedFile {
  filename: string;
  content: string;
}

export interface SectionWeightsConfig {
  skills: number;
  experience: number;
  summary: number;
  other: number;
}

export interface ScoringParameters {
  jobDescriptionText: string;
  resumes: UploadedFile[];
}

export interface ProcessingResult {
  results: ApplicantResult[];
  processing_time_ms: number;
  total_resumes: number;
  job_description_length: number;
}
