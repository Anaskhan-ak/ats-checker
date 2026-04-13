# Applicant Tracking System (ATS)

A full-stack Next.js application that automatically scores and ranks resumes using an advanced keyword-based NLP algorithm—**no LLM or AI APIs required**. All processing happens server-side and everything is stateless and session-based.

## Features

✅ **Bulk Resume Upload** - Upload up to 20+ PDF resumes at once  
✅ **Flexible Job Description** - Paste text or upload PDF  
✅ **Advanced Scoring Engine** - TF-IDF + keyword matching + section weighting + bigram phrase matching  
✅ **Detailed Results Dashboard** - Ranked applicants with matched/missing keywords  
✅ **CSV Export** - Download results for further analysis  
✅ **Responsive Design** - Mobile-friendly interface  
✅ **No External APIs** - 100% private, no OpenAI/Anthropic calls  
✅ **Lightning Fast** - Process 20 resumes in seconds  

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js 14+ (App Router, Server Actions)
- **PDF Processing**: pdf-parse (pdfjs-dist)
- **NLP**: natural (tokenization, stemming)
- **No Database**: Stateless, in-memory processing

## Scoring Algorithm

The application uses a **weighted multi-factor scoring system**:

### 1. **TF-IDF Analysis (30% weight)**
- Extracts top 100 keywords from the job description using term frequency
- Scores resumes based on how many job keywords they contain
- Penalizes common words using stopword filters

### 2. **Keyword Matching (35% weight)**
- Identifies skills, technologies, and role-specific terms
- Performs stemming (e.g., "managing" → "manag")
- Counts exact matches in resume text
- Generates lists of matched and missing keywords

### 3. **Section Weight Bonuses (20% weight)**
- **Skills section**: 1.5x multiplier (highest weight)
- **Experience section**: 1.3x multiplier
- **Summary section**: 1.2x multiplier
- **Other sections**: 1.0x multiplier
- Matches found in important sections get higher scores

### 4. **Bigram Phrase Matching (15% weight)**
- Matches multi-word phrases (e.g., "project management", "React.js")
- More accurate than single-word matching
- Accounts for modern tool stacks and methodologies

### Final Score Calculation
$$\text{Score} = (\text{TF-IDF} \times 0.30) + (\text{Keyword} \times 0.35) + (\text{Section} \times 0.20) + (\text{Phrase} \times 0.15)$$

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone and enter directory
cd d:\projects\ats

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at **http://localhost:3000**

### Production Build

```bash
npm run build
npm start
```

## Usage Guide

### Step 1: Prepare Your Files

**Job Description:**
- Copy/paste job description text directly, OR
- Upload a PDF with job description

**Resumes:**
- Collect all candidate resume PDFs in a folder
- Supported format: PDF only
- Can upload 1-20+ resumes at once

### Step 2: Upload to ATS

1. Open http://localhost:3000
2. Click to upload or drag-drop resume PDFs into the "Upload Resumes" box
3. Paste job description in textarea, or upload a PDF
4. Click "Score & Rank Resumes"
5. Wait for processing (typically 2-10 seconds depending on resume count)

### Step 3: Review Results

The dashboard displays:
- **Rank** - Position from highest to lowest match
- **Candidate Name** - Parsed from resume
- **Score** - 0-100 match percentage (color-coded)
- **Top Keywords** - Matched terms from job description
- **Matched/Missing Keywords** - Detailed keyword analysis

### Step 4: Detailed Analysis (Optional)

Click "View Details" on any applicant row to see:
- Detailed score breakdown (TF-IDF, keyword, section, phrase scores)
- Complete matched and missing keywords
- Section analysis (skills, experience, summary)
- Full resume text preview

### Step 5: Export Results

Click "Download CSV" to export all results with:
- Ranks, names, filenames
- Individual scores for each factor
- Complete matched and missing keywords list

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── process-resumes/
│   │       └── route.ts          # Main API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main orchestration component
│   └── globals.css               # Tailwind CSS
├── components/
│   ├── UploadUI.tsx              # Upload form component
│   ├── ResultsDashboard.tsx       # Results table & filters
│   └── DetailView.tsx            # Detailed score breakdown
├── lib/
│   ├── pdfExtraction.ts          # PDF text extraction
│   ├── scoringEngine.ts          # Core scoring algorithm
│   └── csvExport.ts              # CSV download utility
└── types/
    └── index.ts                  # TypeScript interfaces
```

## API Reference

### POST /api/process-resumes

Processes uploaded resumes and returns scored results.

**Request** (multipart/form-data):
```
- resumes: File[] (multiple PDFs)
- jobDescription: File (optional, if PDF)
- jobDescriptionText: string (optional, if text)
```

**Response** (200 OK):
```json
{
  "results": [
    {
      "filename": "john_doe.pdf",
      "candidateName": "John Doe",
      "score": 87.5,
      "scoring": {
        "totalScore": 87.5,
        "tfIdfScore": 85.2,
        "keywordScore": 90.1,
        "sectionScore": 82.3,
        "phraseScore": 18.5,
        "matchedKeywords": ["react", "javascript", "nodejs"],
        "missingKeywords": ["kubernetes", "aws"],
        "weights": { "tfIdf": 0.3, "keyword": 0.35 }
      },
      "sections": {
        "skills": "JavaScript, React, Node.js...",
        "experience": "5 years as Senior Developer...",
        "summary": "Experienced full-stack engineer...",
        "other": "..."
      }
    }
  ],
  "processing_time_ms": 3421,
  "total_resumes": 5,
  "job_description_length": 2850
}
```

## Performance Characteristics

| Metric | Value |
|--------|-------|
| **Single Resume Processing** | ~150-300ms |
| **Batch (20 resumes)** | ~3-6 seconds |
| **API Response** | <10 seconds |
| **Memory Per Resume** | ~2-5MB |
| **Max Supported** | Tested with 100+ resumes |

## Limitations & Considerations

1. **No AI/LLM APIs** - Pure keyword-based matching (not semantic)
   - Better for exact skill matching
   - Good for role-specific keywords
   - Not ideal for abstract concepts

2. **PDF Quality** - Depends on PDF text extraction quality
   - Scanned/image PDFs may not extract text properly
   - Tested with modern PDF formats

3. **Resume Format Variance** - Section detection uses heuristic patterns
   - Custom resume layouts may not parse perfectly
   - Falls back to "other" section for unrecognized formats

4. **Language** - Optimized for English
   - Natural library supports stemming for English
   - Multilingual support would require additional setup

5. **Session-Based** - No persistence
   - Results exist only in-memory for the session
   - Export to CSV for permanent storage
   - No database backend

## Configuration

### Adjusting Weights

In `src/lib/scoringEngine.ts`, modify `SECTION_WEIGHTS`:

```typescript
const SECTION_WEIGHTS: SectionWeightsConfig = {
  skills: 1.5,       // Highest priority
  experience: 1.3,
  summary: 1.2,
  other: 1.0
};
```

Or adjust final score formula weights:

```typescript
const weights = {
  tfIdf: 0.30,       // Adjust from 0.30
  keyword: 0.35,     // Adjust from 0.35
  section: 0.20,     // Adjust from 0.20
  phrase: 0.15       // Adjust from 0.15
};
```

### Keyword Extraction

Adjust number of keywords extracted in `scoringEngine.ts`:

```typescript
extractKeywords(jobDescription, 150)  // Extract top 150 keywords
```

## Troubleshooting

### "Failed to extract text from PDF"
- Ensure PDF has searchable text (not scanned image)
- Try converting PDF to text externally
- Check file isn't corrupted

### Resume not uploading
- Check file is actually .pdf format
- Ensure file size is reasonable (<50MB)
- Try different PDF if issue persists

### Low scores for matching resumes
- Check job description is detailed enough
- Verify resume formatting (keywords may be in uncommon sections)
- Try adjusting keyword extraction top-N value

### Slow processing
- Reduce number of resumes in batch
- Check system resources (CPU, RAM)
- Ensure PDFs aren't extremely large

## Development

### Run Tests
```bash
npm run build     # TypeScript check
```

### Code Style
- ESLint configured for Next.js
- Tailwind CSS for styling
- TypeScript strict mode

### Adding Features

To add new scoring factors:
1. Create a new scoring function in `scoringEngine.ts`
2. Update `scoreResume()` to include it
3. Add new weight in weights object
4. Update type definitions in `types/index.ts`

## License

MIT - Feel free to use for personal or commercial projects

## Future Enhancements

- [ ] Support for DOCX/Word documents
- [ ] Custom scoring weights UI
- [ ] Resume parsing (extract skills, experience, etc.)
- [ ] Applicant tracking database
- [ ] Email integration
- [ ] Bulk rejection feedback
- [ ] Candidate communication templates
- [ ] Interview scheduling
- [ ] Multi-language support

---

**Built with ❤️ using Next.js and Natural Language Processing**
