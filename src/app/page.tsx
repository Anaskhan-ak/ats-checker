'use client';

import { useState } from 'react';
import { UploadUI } from '@/components/UploadUI';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { downloadCSV } from '@/lib/csvExport';
import { ProcessingResult } from '@/types';

export default function Home() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  if (result) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <ResultsDashboard
          result={result}
          onBack={() => {
            setResult(null);
            setProcessing(false);
          }}
          onDownloadCSV={downloadCSV}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">ATS</h1>
            <p className="text-xl text-gray-600 font-medium">
              Applicant Tracking System
            </p>
            <p className="text-gray-600 max-w-2xl">
              Advanced resume scoring and ranking engine using keyword matching, TF-IDF analysis, 
              and intelligent section weighting. No AI APIs required.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="m-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <svg className="animate-spin h-16 w-16 text-blue-600" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    strokeWidth="4"
                    stroke="currentColor"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">Processing Resumes...</p>
                <p className="text-gray-600 mt-2">Extracting text, analyzing keywords, and scoring matches</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        {!processing && (
          <UploadUI
            onProcessingStart={() => setProcessing(true)}
            onProcessingComplete={(result) => {
              setProcessing(false);
              setResult(result);
            }}
            onError={handleError}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Scoring Algorithm</h3>
              <p className="text-sm text-gray-600">
                Combines TF-IDF analysis, keyword matching, intelligent section weighting, and bigram phrase matching for accurate resume scoring.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Bulk resume upload (20+ PDFs)</li>
                <li>✓ Text & PDF job descriptions</li>
                <li>✓ Detailed scoring breakdown</li>
                <li>✓ CSV export results</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">No External APIs</h3>
              <p className="text-sm text-gray-600">
                All processing happens server-side. No OpenAI, Anthropic, or LLM APIs. 100% private and secure.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>Built with Next.js, Tailwind CSS, and Natural Language Processing</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
