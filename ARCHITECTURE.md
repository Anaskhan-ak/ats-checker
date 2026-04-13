# ATS Architecture & Components

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser (React)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Page Component (src/app/page.tsx)                   │   │
│  │ - Manages state (processing, results, errors)       │   │
│  │ - Orchestrates UI components                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Upload UI Component (UploadUI.tsx)                 │   │
│  │ - Drag-drop resume PDFs                             │   │
│  │ - Job description input (text or PDF)               │   │
│  │ - Form submission to API                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Results Dashboard (ResultsDashboard.tsx)            │   │
│  │ - Ranked results table                              │   │
│  │ - Filter by score slider                            │   │
│  │ - CSV export button                                 │   │
│  │ - Detail view navigation                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Detail View (DetailView.tsx)                        │   │
│  │ - Score breakdown (4 factors)                       │   │
│  │ - Matched/missing keywords                          │   │
│  │ - Section analysis                                  │   │
│  │ - Full resume preview                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ (multipart/form-data)
                    HTTP POST Request
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Backend (API)                        │
│                                                              │
│  POST /api/process-resumes (src/app/api/process-resumes/)   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Parse FormData                                    │   │
│  │    - Extract resume files                            │   │
│  │    - Extract job description (text or file)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. PDF Extraction (pdfExtraction.ts)               │   │
│  │    - Convert each resume PDF to text                │   │
│  │    - Extract candidate name from resume             │   │
│  │    - Parse resume sections                          │   │
│  │    - Convert job description PDF to text            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Scoring Engine (scoringEngine.ts)               │   │
│  │    For each resume:                                 │   │
│  │    a) TF-IDF Analysis (30% weight)                  │   │
│  │       - Extract top keywords from job desc          │   │
│  │       - Score resume based on keyword overlap       │   │
│  │    b) Keyword Matching (35% weight)                 │   │
│  │       - Tokenize and stem both texts                │   │
│  │       - Count exact keyword matches                 │   │
│  │       - Identify missing keywords                   │   │
│  │    c) Section Weighting (20% weight)                │   │
│  │       - Score matches in skills (1.5x bonus)        │   │
│  │       - Score matches in experience (1.3x bonus)    │   │
│  │       - Score matches in summary (1.2x bonus)       │   │
│  │    d) Bigram Phrase Matching (15% weight)           │   │
│  │       - Extract 2-word phrases                      │   │
│  │       - Match phrases in resume                     │   │
│  │    e) Calculate final weighted score                │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. Sort & Format Results                            │   │
│  │    - Sort resumes by score (descending)             │   │
│  │    - Attach metadata (name, file, sections)         │   │
│  │    - Generate processing time stats                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 5. Return JSON Response                             │   │
│  │    { results[], processing_time_ms, total_resumes } │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ (JSON)
                 HTTP 200 Response
                           ↓
                 Display Results in UI
```

## Component Details

### 1. Frontend Layer

#### `src/app/page.tsx` (Main Page)
- **Purpose**: Root page component, state management orchestrator
- **State**:
  - `processing`: boolean (shows loading spinner)
  - `result`: ProcessingResult | null (stores API response)
  - `error`: string | null (shows error messages)
- **Flow**:
  - Renders UploadUI initially
  - On form submit → sets processing=true → calls API
  - On API success → sets result → shows ResultsDashboard
  - On "Back to Upload" → resets state → shows UploadUI

#### `src/components/UploadUI.tsx` (Upload Form)
- **Purpose**: Form for selecting and uploading files
- **Features**:
  - Drag-and-drop zone for resume PDFs
  - Textarea for pasting job description
  - File input for uploading PDFs
  - File list with remove buttons
  - Submit button with disabled state management
- **Events**:
  - `onProcessingStart()`: Triggers loading state
  - `onProcessingComplete()`: Receives results
  - `onError()`: Displays error message
- **Form Data**:
  - Constructs FormData with files and text
  - Posts to `/api/process-resumes`

#### `src/components/ResultsDashboard.tsx` (Results Table)
- **Purpose**: Displays ranked resumes in table format
- **Features**:
  - Sortable/filterable results table
  - Score range slider (0-100)
  - Stats cards (top score, average, etc.)
  - CSV export button
  - Mobile-responsive card view
  - Click details button → shows DetailView
- **Data**:
  - Reads from ProcessingResult
  - Filters based on score slider
  - Color codes scores (green 80+, yellow 60+, orange 40+, red <40)

#### `src/components/DetailView.tsx` (Applicant Details)
- **Purpose**: Detailed breakdown for single applicant
- **Displays**:
  - Overall score (large, color-coded)
  - 4 factor scores with progress bars:
    - TF-IDF Score
    - Keyword Score
    - Section Score
    - Phrase Score
  - Matched keywords (green badges)
  - Missing keywords (red badges)
  - Section analysis (skills, experience, summary)
  - Full resume text collapsible section
- **Navigation**: Back button to return to results table

### 2. Backend Layer

#### `src/app/api/process-resumes/route.ts` (API Endpoint)
- **Method**: POST
- **Input**: FormData with files
- **Processing Steps**:
  1. Parse FormData
  2. Validate inputs (at least 1 resume, job description)
  3. Call PDF extraction functions
  4. Call scoring engine for each resume
  5. Sort by score descending
  6. Return JSON response
- **Error Handling**:
  - Returns 400 for missing files
  - Returns 500 for extraction/processing errors
  - Logs errors to console
- **Type**: `export const maxDuration = 60` (60 second timeout)

#### `src/lib/pdfExtraction.ts` (PDF Processing)
- **Function**: `extractTextFromPDF(buffer: Buffer): Promise<string>`
  - Uses pdf-parse library with pdfjs-dist
  - Converts Buffer to Uint8Array
  - Extracts text from all pages
  - Handles extraction errors gracefully

- **Function**: `extractCandidateName(resumeText: string): string`
  - Finds first non-email line in resume
  - Treats as candidate name
  - Limits length and cleans formatting

- **Function**: `extractSections(resumeText: string): { skills, experience, summary, other }`
  - Uses regex patterns to find section headers
  - Looks for "Skills", "Experience", "Summary" patterns
  - Returns parsed sections for weighted scoring

### 3. Scoring Engine (`src/lib/scoringEngine.ts`)

#### Architecture
```
scoreResume(jobDesc, resumeText, sections)
├─ calculateTFIDF() → TF-IDF score (30%)
├─ calculateKeywordMatching() → Keyword score (35%)
├─ calculateSectionWeightedScore() → Section score (20%)
├─ matchBigrams() → Phrase score (15%)
└─ Combine scores → Final 0-100 score
```

#### Component Functions

**`tokenizeAndClean(text: string): string[]`**
- Uses WordTokenizer from 'natural' library
- Filters stopwords (common words)
- Applies Porter stemming (e.g., "managing" → "manag")
- Returns array of clean tokens

**`extractKeywords(text: string, topN: number = 150): string[]`**
- Tokenizes job description
- Counts term frequencies
- Sorts by frequency descending
- Returns top N keywords (default 150)

**`calculateTFIDF(jobDesc, resumeText)`**
- Gets top 100 keywords from job description
- Counts how many are in resume
- Ratio: (matched keywords / total keywords) * 100
- Returns score (max 100) and matched terms

**`calculateKeywordMatching(jobDesc, resumeText)`**
- Gets top 120 keywords
- Tokenizes resume
- Counts exact matches (after stemming)
- Returns keyword score (max 50) and match count

**`calculateSectionWeightedScore(jobDesc, sections)`**
- For each section (skills, experience, summary, other):
  - Tokenize section text
  - Count keyword matches
  - Apply section weight (skills 1.5x, exp 1.3x, etc.)
  - Calculate weighted score
- Average weighted scores across sections
- Returns section score (max 30)

**`matchBigrams(jobDesc, resumeText)`**
- Extracts 2-word phrases from both texts
- Counts phrase matches
- Returns phrase score (max 20) and matched phrases

**`scoreResume(jobDesc, resumeText, sections)`**
- Calls all scoring functions
- Combines with weights:
  - TF-IDF × 0.30
  - Keyword × 0.35
  - Section × 0.20
  - Phrase × 0.15
- Returns ScoringDetails object

### 4. Utilities

#### `src/lib/csvExport.ts`
- **Function**: `downloadCSV(results: ApplicantResult[])`
- Creates CSV string with headers:
  - Rank, Name, Filename, Score, TF-IDF, Keyword, Section, Phrase, Matched Keywords, Missing Keywords
- Converts to Blob
- Triggers browser download
- Filename: `ats-results-{timestamp}.csv`

#### `src/types/index.ts`
- Defines all TypeScript interfaces:
  - `ScoringDetails` - Individual score breakdown
  - `ApplicantResult` - Full result for one applicant
  - `ProcessingResult` - API response with all results
  - `UploadedFile` - File metadata and content
  - `SectionWeightsConfig` - Weight multipliers

## Data Flow

### Happy Path (Successful Processing)

```
User loads page
    ↓
Sees UploadUI component
    ↓
Uploads 2 resumes + job description
    ↓
Clicks "Score & Rank Resumes"
    ↓
UploadUI calls onProcessingStart()
    ↓
Creates FormData with files
    ↓
POST to /api/process-resumes
    ↓
Backend extracts PDFs
    ↓
Backend scores each resume (4 factors)
    ↓
Backend sorts results by score
    ↓
Returns JSON with results array
    ↓
UploadUI calls onProcessingComplete(result)
    ↓
Components re-render with ResultsDashboard
    ↓
User sees ranked resumes table
    ↓
Can click "View Details" for any applicant
    ↓
Shows DetailView with score breakdown
    ↓
Can download CSV results
```

### Error Path

```
API fails (PDF extraction error, etc.)
    ↓
Catch block in route.ts
    ↓
console.error() logs error
    ↓
Returns 500 JSON error response
    ↓
Fetch rejects in UploadUI
    ↓
onError() called with error message
    ↓
Error displayed in red alert box
    ↓
User can try again
```

## Performance Optimizations

1. **Server-Side Processing**
   - All heavy computation on backend
   - Frontend only renders UI

2. **Efficient Tokenization**
   - Single pass through text
   - Stopword filtering early
   - Stem caching possible (not implemented)

3. **Section Detection**
   - Regex patterns for header detection
   - Split text once, reuse for multiple analyses

4. **Batch Processing**
   - Processes multiple resumes sequentially
   - No parallel processing to avoid memory spike

5. **Data Structures**
   - Uses Map for O(1) keyword lookup
   - Set for unique keyword deduplication

## Security Considerations

1. **No Database**: No data persistence, reducing attack surface
2. **Server-Side Processing**: File contents never exposed to client until parsed
3. **Input Validation**: 
   - File type checking (PDF only)
   - Text length limits on forms
4. **Error Boundaries**: Generic error messages to users, detailed logs server-side
5. **No API Keys**: No external service credentials exposed

## Scalability Considerations

1. **Current Limits**:
   - Tested with 100+ resumes
   - ~5KB-15KB per resume in memory
   - Total: 100 × 10KB = 1MB typical load

2. **Potential Bottlenecks**:
   - PDF extraction is slowest operation (150-300ms per resume)
   - Sequential processing (not parallel)
   - All in Node.js single thread

3. **Improvements Possible**:
   - Worker threads for parallel PDF extraction
   - Caching of extracted text
   - Database persistence for batch history
   - Queue system for large batch uploads

---

**Architecture designed for simplicity, clarity, and performance without external dependencies.**
