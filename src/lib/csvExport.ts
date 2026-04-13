import { ApplicantResult } from '@/types';

export function downloadCSV(results: ApplicantResult[]): void {
  // Prepare CSV headers
  const headers = [
    'Rank',
    'Candidate Name',
    'Filename',
    'Score',
    'TF-IDF Score',
    'Keyword Score',
    'Section Score',
    'Phrase Score',
    'Matched Keywords',
    'Missing Keywords'
  ];

  // Prepare CSV rows
  const rows = results.map((result, index) => [
    index + 1,
    result.candidateName,
    result.filename,
    result.score.toFixed(2),
    result.scoring.tfIdfScore.toFixed(2),
    result.scoring.keywordScore.toFixed(2),
    result.scoring.sectionScore.toFixed(2),
    result.scoring.phraseScore.toFixed(2),
    `"${result.scoring.matchedKeywords.join(', ')}"`,
    `"${result.scoring.missingKeywords.join(', ')}"`
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `ats-results-${Date.now()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
