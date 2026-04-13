import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';

// Set up the worker for server-side PDF processing
function setupPDFWorker() {
  try {
    // Try to find and configure the worker path for pdf.js
    const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js');
    if (fs.existsSync(workerPath)) {
      // Set up environment variable for pdf.js worker
      (global as any).pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.min.js');
    }
  } catch (error) {
    console.warn('Could not set up PDF worker:', error);
  }
}

// Initialize worker on module load
setupPDFWorker();

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = new Uint8Array(buffer);
    const pdf = new PDFParse({ data });
    const textResult = await pdf.getText();
    await pdf.destroy();
    return (textResult.text || '');
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function extractCandidateName(resumeText: string): string {
  const lines = resumeText.split('\n');
  
  // Usually the first meaningful line or look for common patterns
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 0 && line.length < 100 && !line.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      // Skip email addresses
      return line.replace(/[\n\r]+/g, ' ').substring(0, 80);
    }
  }
  
  return 'Unknown Candidate';
}

export function extractSections(resumeText: string): { skills: string; experience: string; summary: string; other: string } {
  const text = resumeText.toLowerCase();
  const lines = resumeText.split('\n');
  
  const sections = {
    skills: '',
    experience: '',
    summary: '',
    other: resumeText
  };
  
  let currentSection = 'other';
  const skillsPattern = /^[\s]*(skills|technical skills|competencies|expertise|languages|tools)[\s]*[:]*\s*$/i;
  const experiencePattern = /^[\s]*(experience|professional experience|work history|employment|career)[\s]*[:]*\s*$/i;
  const summaryPattern = /^[\s]*(summary|objective|profile|about|professional summary)[\s]*[:]*\s*$/i;
  
  let skillsContent = '';
  let experienceContent = '';
  let summaryContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    
    if (skillsPattern.test(line)) {
      currentSection = 'skills';
      continue;
    }
    if (experiencePattern.test(line)) {
      currentSection = 'experience';
      continue;
    }
    if (summaryPattern.test(line)) {
      currentSection = 'summary';
      continue;
    }
    
    // Check if we're hitting a new section header
    if (line.match(/^[\s]*[A-Z][A-Z\s]+[:]*\s*$/) && line.trim().length < 50) {
      if (!skillsPattern.test(line) && !experiencePattern.test(line) && !summaryPattern.test(line)) {
        currentSection = 'other';
      }
    }
    
    if (currentSection === 'skills') {
      skillsContent += line + '\n';
    } else if (currentSection === 'experience') {
      experienceContent += line + '\n';
    } else if (currentSection === 'summary') {
      summaryContent += line + '\n';
    }
  }
  
  sections.skills = skillsContent.trim();
  sections.experience = experienceContent.trim();
  sections.summary = summaryContent.trim();
  
  return sections;
}
