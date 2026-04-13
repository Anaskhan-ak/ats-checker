'use client';

import { ApplicantResult } from '@/types';

interface DetailViewProps {
  applicant: ApplicantResult;
  onBack: () => void;
}

export function DetailView({ applicant, onBack }: DetailViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{applicant.candidateName}</h1>
          <p className="text-gray-600 text-sm mt-1">{applicant.filename}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Back to Results
        </button>
      </div>

      {/* Overall Score */}
      <div className={`${getScoreColor(applicant.score)} rounded-lg p-6 border-2 border-current`}>
        <p className="text-sm font-semibold opacity-75 mb-2">Overall Match Score</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">{applicant.score.toFixed(1)}</span>
          <span className="text-2xl opacity-75">/100</span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">TF-IDF Score</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-blue-600">{applicant.scoring.tfIdfScore.toFixed(1)}</span>
            <p className="text-xs text-gray-600 mb-1">({(applicant.scoring.weights.tfIdf * 100).toFixed(0)}% weight)</p>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${Math.min(applicant.scoring.tfIdfScore, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">Keyword Match Score</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-purple-600">{applicant.scoring.keywordScore.toFixed(1)}</span>
            <p className="text-xs text-gray-600 mb-1">({(applicant.scoring.weights.keyword * 100).toFixed(0)}% weight)</p>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600"
              style={{ width: `${Math.min(applicant.scoring.keywordScore, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">Section Weight Score</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-green-600">{applicant.scoring.sectionScore.toFixed(1)}</span>
            <p className="text-xs text-gray-600 mb-1">({(applicant.scoring.weights.section * 100).toFixed(0)}% weight)</p>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600"
              style={{ width: `${Math.min(applicant.scoring.sectionScore, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase font-semibold text-gray-600 mb-2">Phrase Match Score</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-orange-600">{applicant.scoring.phraseScore.toFixed(1)}</span>
            <p className="text-xs text-gray-600 mb-1">({(applicant.scoring.weights.phrase * 100).toFixed(0)}% weight)</p>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600"
              style={{ width: `${Math.min(applicant.scoring.phraseScore, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Matched Keywords */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Matched Keywords</h2>
        {applicant.scoring.matchedKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {applicant.scoring.matchedKeywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                ✓ {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No matched keywords found</p>
        )}
      </div>

      {/* Missing Keywords */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Missing Keywords</h2>
        {applicant.scoring.missingKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {applicant.scoring.missingKeywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                ✗ {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">All important keywords are present!</p>
        )}
      </div>

      {/* Section Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Analysis</h2>
        <div className="space-y-4">
          {applicant.sections.summary && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Summary/Objective</h3>
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                {applicant.sections.summary}
              </p>
            </div>
          )}
          {applicant.sections.skills && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                {applicant.sections.skills}
              </p>
            </div>
          )}
          {applicant.sections.experience && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                {applicant.sections.experience}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Resume Preview */}
      <details className="bg-white border border-gray-200 rounded-lg">
        <summary className="cursor-pointer px-6 py-4 font-semibold text-gray-900 hover:bg-gray-50">
          View Full Resume Text
        </summary>
        <div className="border-t border-gray-200 p-6 bg-gray-50 max-h-96 overflow-y-auto">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
            {applicant.rawText}
          </pre>
        </div>
      </details>
    </div>
  );
}
