'use client';

import { useState } from 'react';
import { ProcessingResult, ApplicantResult } from '@/types';
import { DetailView } from './DetailView';

interface ResultsDashboardProps {
  result: ProcessingResult;
  onBack: () => void;
  onDownloadCSV: (results: ApplicantResult[]) => void;
}

export function ResultsDashboard({ result, onBack, onDownloadCSV }: ResultsDashboardProps) {
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantResult | null>(null);
  const [filterScore, setFilterScore] = useState<number>(0);

  const filteredResults = result.results.filter(r => r.score >= filterScore);

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

  if (selectedApplicant) {
    return (
      <DetailView
        applicant={selectedApplicant}
        onBack={() => setSelectedApplicant(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ATS Results</h1>
            <p className="text-gray-600 mt-1">
              {result.total_resumes} resumes processed in {result.processing_time_ms}ms
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Back to Upload
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Total Resumes</p>
            <p className="text-2xl font-bold text-gray-900">{result.total_resumes}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Top Score</p>
            <p className={`text-2xl font-bold ${getScoreBgColor(result.results[0]?.score || 0)}`}>
              {result.results[0]?.score.toFixed(1) || 'N/A'}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Average Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {(result.results.reduce((sum, r) => sum + r.score, 0) / result.total_resumes).toFixed(1)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-sm">Job Description</p>
            <p className="text-2xl font-bold text-gray-900">
              {(result.job_description_length / 1000).toFixed(1)}K chars
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="w-full sm:w-auto">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Filter by Minimum Score: {filterScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value))}
            className="w-full sm:w-48"
          />
        </div>
        <button
          onClick={() => onDownloadCSV(filteredResults)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l4-6m-4 6l-4-6" />
          </svg>
          Download CSV
        </button>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Candidate Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Filename</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Top Keywords</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No results match the selected filter
                  </td>
                </tr>
              ) : (
                filteredResults.map((result, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">#{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{result.candidateName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">{result.filename}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${getScoreColor(result.score)}`}>
                        {result.score.toFixed(1)}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {result.scoring.matchedKeywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {kw}
                          </span>
                        ))}
                        {result.scoring.matchedKeywords.length > 3 && (
                          <span className="inline-block text-xs text-gray-600">+{result.scoring.matchedKeywords.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedApplicant(result)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {filteredResults.map((result, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">#{index + 1} {result.candidateName}</p>
                <p className="text-xs text-gray-600 font-mono mt-1">{result.filename}</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${getScoreColor(result.score)}`}>
                {result.score.toFixed(1)}/100
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Top Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {result.scoring.matchedKeywords.slice(0, 4).map((kw, i) => (
                  <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelectedApplicant(result)}
              className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm py-2 border border-blue-200 rounded"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
