'use client';

import { useState, useRef, useCallback } from 'react';
import { ProcessingResult, ApplicantResult } from '@/types';

interface UploadUIProps {
  onProcessingStart: () => void;
  onProcessingComplete: (result: ProcessingResult) => void;
  onError: (error: string) => void;
}

export function UploadUI({ onProcessingStart, onProcessingComplete, onError }: UploadUIProps) {
  const [resumes, setResumes] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jobInputRef = useRef<HTMLInputElement>(null);

  const handleResumeDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    setResumes(prev => [...prev, ...files]);
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setResumes(prev => [...prev, ...files]);
    }
  };

  const handleJobDescriptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setJobDescriptionFile(file);
      setJobDescription(''); // Clear text if file selected
    }
  };

  const removeResume = (index: number) => {
    setResumes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resumes.length === 0) {
      onError('Please upload at least one resume');
      return;
    }

    if (!jobDescription.trim() && !jobDescriptionFile) {
      onError('Please provide a job description');
      return;
    }

    onProcessingStart();
    setIsLoading(true);

    try {
      const formData = new FormData();

      // Add resumes
      resumes.forEach(file => {
        formData.append('resumes', file);
      });

      // Add job description
      if (jobDescriptionFile) {
        formData.append('jobDescription', jobDescriptionFile);
      } else {
        formData.append('jobDescriptionText', jobDescription);
      }

      const response = await fetch('/api/process-resumes', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process resumes');
      }

      const result: ProcessingResult = await response.json();
      onProcessingComplete(result);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Resume Upload Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Resumes</h2>
          <p className="text-sm text-gray-600">Upload multiple resume PDFs (bulk upload supported)</p>

          <div
            onDragEnter={handleResumeDrag}
            onDragLeave={handleResumeDrag}
            onDragOver={handleResumeDrag}
            onDrop={handleResumeDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <input
              ref={resumeInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleResumeFileChange}
              className="hidden"
              disabled={isLoading}
            />

            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v28a4 4 0 004 4h24a4 4 0 004-4V20m-14-12v16m0 0l4-4m-4 4l-4-4"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-gray-700 font-medium">
                Drag and drop PDF files here
              </p>
              <p className="text-gray-600 text-sm">or</p>
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
              >
                Click to browse
              </button>
            </div>
          </div>

          {resumes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Selected Resumes ({resumes.length})
              </p>
              <div className="space-y-2">
                {resumes.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeResume(index)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:text-gray-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Job Description Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Job Description</h2>
          <p className="text-sm text-gray-600">Paste or upload the job description</p>

          <div className="space-y-4">
            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (e.target.value.trim()) {
                  setJobDescriptionFile(null);
                }
              }}
              placeholder="Paste job description here..."
              disabled={isLoading || !!jobDescriptionFile}
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 resize-none"
            />

            {!jobDescription.trim() && (
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">or</p>
                <button
                  type="button"
                  onClick={() => jobInputRef.current?.click()}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                >
                  Upload Job Description PDF
                </button>
              </div>
            )}

            <input
              ref={jobInputRef}
              type="file"
              accept=".pdf"
              onChange={handleJobDescriptionFileChange}
              className="hidden"
              disabled={isLoading}
            />

            {jobDescriptionFile && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-sm text-gray-700">{jobDescriptionFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setJobDescriptionFile(null);
                  }}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || resumes.length === 0 || (!jobDescription.trim() && !jobDescriptionFile)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              Processing...
            </span>
          ) : (
            'Score & Rank Resumes'
          )}
        </button>
      </form>
    </div>
  );
}
