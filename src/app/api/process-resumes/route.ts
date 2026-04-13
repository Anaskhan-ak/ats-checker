import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, extractCandidateName, extractSections } from '@/lib/pdfExtraction';
import { scoreResume } from '@/lib/scoringEngine';
import { ProcessingResult, ApplicantResult, UploadedFile } from '@/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    
    // Extract job description
    const jobDescriptionFile = formData.get('jobDescription') as File;
    const jobDescriptionText = formData.get('jobDescriptionText') as string;
    
    let finalJobDescription = jobDescriptionText || '';
    
    if (jobDescriptionFile) {
      const buffer = Buffer.from(await jobDescriptionFile.arrayBuffer());
      finalJobDescription = await extractTextFromPDF(buffer);
    }
    
    if (!finalJobDescription.trim()) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }
    
    // Extract resumes
    const resumeFiles = formData.getAll('resumes') as File[];
    
    if (resumeFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one resume file is required' },
        { status: 400 }
      );
    }
    
    // Extract text from each resume
    const resumeData: UploadedFile[] = [];
    
    for (const file of resumeFiles) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await extractTextFromPDF(buffer);
        resumeData.push({
          filename: file.name,
          content: text
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        // Continue with other files
      }
    }
    
    if (resumeData.length === 0) {
      return NextResponse.json(
        { error: 'Failed to extract text from any resume files' },
        { status: 400 }
      );
    }
    
    // Score each resume
    const results: ApplicantResult[] = resumeData.map(resume => {
      const candidateName = extractCandidateName(resume.content);
      const sections = extractSections(resume.content);
      const scoring = scoreResume(finalJobDescription, resume.content, sections);
      
      return {
        filename: resume.filename,
        candidateName,
        score: scoring.totalScore,
        scoring,
        rawText: resume.content,
        sections
      };
    });
    
    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    const processingTime = Date.now() - startTime;
    
    const response: ProcessingResult = {
      results,
      processing_time_ms: processingTime,
      total_resumes: resumeData.length,
      job_description_length: finalJobDescription.length
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in process-resumes:', error);
    return NextResponse.json(
      { error: `Failed to process resumes: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
