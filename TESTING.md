# ATS Testing Guide

## Quick Start - Running the Application

### 1. Start the Development Server

```bash
cd d:\projects\ats
npm run dev
```

The server will start at **http://localhost:3000**

### 2. Open in Browser

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the ATS home page with:
- Upload Resumes section (drag-and-drop area)
- Job Description input area
- Score & Rank Resumes button

## Testing Workflow

### Option A: Manual Testing with Sample Text

1. **Copy Job Description**
   - Open `test-data/job-description.txt`
   - Copy all the text

2. **Upload to ATS**
   - Paste the job description in the textarea
   - Upload sample resume PDFs (see Option B to convert TXT to PDF)
   - Click "Score & Rank Resumes"

### Option B: Convert Sample Resumes to PDF

The sample resumes in `test-data/` are provided as text files. To convert them to PDF for testing:

#### Using Microsoft Word (Windows)
1. Open each `.txt` file in Word
2. File > Save As
3. Choose "PDF" format
4. Save to `test-data/` folder

#### Using Online Tools
1. Visit https://www.ilovepdf.com/txt-to-pdf
2. Upload text file
3. Download as PDF

#### Using Python (if installed)
```bash
pip install reportlab
python -c "
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

txt_file = 'test-data/resume-1-excellent-match.txt'
pdf_file = 'test-data/resume-1-excellent-match.pdf'

with open(txt_file, 'r') as f:
    text = f.read()

c = canvas.Canvas(pdf_file, pagesize=letter)
y = 750
for line in text.split('\n'):
    c.drawString(50, y, line[:100])
    y -= 15
    if y < 50:
        c.showPage()
        y = 750
c.save()
print(f'Created {pdf_file}')
"
```

### Option C: Quick Testing Steps

1. **Navigate to http://localhost:3000**

2. **Paste Job Description**
   - Copy content from `test-data/job-description.txt`
   - Paste in the textarea
   - Leave "Upload Job Description PDF" option empty

3. **Upload Resumes**
   - Click "Click to browse" or drag-drop resume PDFs
   - Select one or more from:
     - `test-data/resume-1-excellent-match.pdf`
     - `test-data/resume-2-partial-match.pdf`
     - `test-data/resume-3-poor-match.pdf`

4. **Click "Score & Rank Resumes"**
   - Wait for processing (typically 1-5 seconds)
   - Watch for progress indicator

5. **Review Results**
   - Results should show ranked applicants
   - Top result should be "Excellent Match" (~85-95 score)
   - Middle result should be "Partial Match" (~50-70 score)
   - Bottom result should be "Poor Match" (~20-40 score)

## Expected Results

### With Sample Data

**Resume 1 - Excellent Match**
- Expected Score: 80-95/100
- Why: Has React, TypeScript, Node.js, PostgreSQL, AWS, Docker, Kubernetes, GraphQL
- Matched Keywords: react, typescript, nodejs, postgresql, aws, docker, kubernetes

**Resume 2 - Partial Match**
- Expected Score: 45-65/100
- Why: Has React and JavaScript but missing backend, cloud, and many required skills
- Matched Keywords: react, javascript, responsive design
- Missing: typescript, nodejs, postgresql, aws, docker, kubernetes

**Resume 3 - Poor Match**
- Expected Score: 15-35/100
- Why: IT Support background, no software development experience
- Matched Keywords: windows (maybe), network, systems
- Missing: Nearly all software development skills

## Testing Features

### 1. Filter by Score
- Adjust the "Filter by Minimum Score" slider
- Watch the table update in real-time
- Try setting it to 50 to filter out poor matches

### 2. View Details
- Click "View Details" on any applicant
- See detailed score breakdown:
  - TF-IDF Score (keyword extraction)
  - Keyword Score (term matching)
  - Section Score (skill weighting)
  - Phrase Score (multi-word phrases)
- View matched and missing keywords
- See resume sections parsed

### 3. Download CSV
- Click "Download CSV" button
- Opens browser download
- File named like: `ats-results-1708347600000.csv`
- Contains all scores and keywords in spreadsheet format
- Can open with Excel or Google Sheets

### 4. Mobile Responsiveness
- Resize browser window to mobile size (<768px)
- Should show card-based view instead of table
- Test on mobile device if available

## Debugging & Troubleshooting

### Check Terminal Output

Watch the development terminal for:
- Console logs from processing
- Any error messages
- File upload information

### Browser Console Errors

Open DevTools (F12 or Ctrl+Shift+I):
1. Go to Console tab
2. Check for JavaScript errors in red
3. Look for network timing of API calls

### PDF Extraction Issues

If PDFs don't upload:
1. Verify file is actual PDF (not DOCX converted)
2. Check PDF has searchable text (not scanned image)
3. Try uploading the sample TXT version as-is (API should handle)

### API Response Check

In DevTools Network tab:
1. Click "Score & Rank Resumes"
2. Look for POST request to `/api/process-resumes`
3. Click it and view Response tab
4. Should show JSON with results array

## Performance Testing

### Single Resume
Upload one resume and measure:
- Expected: 200-500ms to process
- File size: Check DevTools Network tab

### Batch Processing
Upload all test resumes (3 files):
- Expected: 1-3 seconds total
- Watch progress indicator

### Large Scale
Try uploading 10-20 resumes (duplicate the test files):
- Expected: 5-15 seconds
- Monitor browser memory usage
- Check CPU usage in Task Manager

## Manual Code Testing

### Test Scoring Algorithm

Edit `src/lib/scoringEngine.ts` and add console logging:

```typescript
export function scoreResume(...) {
  // ... existing code ...
  
  console.log('Debug Scoring:');
  console.log('TF-IDF Score:', tfIdfScore);
  console.log('Keyword Score:', keywordScore);
  console.log('Section Score:', sectionScore);
  console.log('Phrase Score:', phraseScore);
  console.log('Final Score:', totalScore);
  
  return { /* ... */ };
}
```

Then rebuild and test in browser console.

### Test PDF Extraction

```bash
# Add test script in package.json
"test:pdf": "node -e \"...\"" 

# Or run directly in Node:
node -e "
const { extractTextFromPDF } = require('./dist/lib/pdfExtraction');
const fs = require('fs');
const buffer = fs.readFileSync('test-data/resume-1-excellent-match.pdf');
extractTextFromPDF(buffer).then(text => {
  console.log('Extracted text:', text.substring(0, 200));
});
"
```

## Test Scenarios

### Scenario 1: Perfect Match
- Job description: Senior Full-Stack Engineer role
- Resume: Has all required skills
- Expected: Top score (85+)

### Scenario 2: Overqualified
- Job description: Junior Developer role
- Resume: Senior engineer with many extra skills
- Expected: High score (80+) but may have "missing" keywords that aren't really necessary

### Scenario 3: Underqualified
- Job description: Senior role with strict requirements
- Resume: Junior developer with basic skills
- Expected: Low score (30-50)

### Scenario 4: Different Background
- Job description: Full-stack web development
- Resume: Data scientist with Python and ML
- Expected: Medium-low score (40-60) - has some overlap but different focus

### Scenario 5: Typos/Variations
- Job description: "React" and "javascript"
- Resume: "ReactJS" and "JavaScript"
- Expected: Should match due to stemming algorithms

## Tips for Best Results

1. **Use Detailed Job Descriptions**
   - More keywords = more accurate scoring
   - Include required and preferred skills
   - Mention specific technologies

2. **Resumes Should Have Clear Sections**
   - Use "SKILLS" header for skills section
   - Use "EXPERIENCE" or "WORK HISTORY" for experience
   - Use "SUMMARY" or "OBJECTIVE" for summary
   - Section detection improves scoring accuracy

3. **Testing Multiple Scenarios**
   - Try with 1 resume, then 5, then 20
   - Try different job descriptions
   - Compare scoring across batches

## Supported File Formats

✅ **PDF** - Full support (primary format)
✅ **Paste Text** - Job descriptions as plain text
❌ **DOCX** - Not supported (convert to PDF first)
❌ **XLSX** - Not supported
❌ **RTF** - Not supported (may work if PDF-compatible)
❌ **Images/Scans** - Not supported (requires OCR)

## Performance Benchmarks

| Operation | Time |
|-----------|------|
| PDF parse 1 resume | 150-300ms |
| Extract text | 50-100ms |
| Score 1 resume | 50-100ms |
| Rank 5 resumes | 1-2s |
| Rank 20 resumes | 3-6s |
| CSV export | 100-200ms |

## Next Steps After Testing

1. **Modify Test Data**
   - Create resumes matching your job descriptions
   - Test with real job postings
   - Experiment with different weights

2. **Adjust Scoring**
   - In `scoringEngine.ts`, experiment with:
     - Weight values (30%, 35%, etc.)
     - Section multipliers
     - Keyword extraction count
     - Stopwords list

3. **Deploy**
   - Run `npm run build`
   - Deploy to Vercel or your preferred host
   - Test in production environment

4. **Integrate**
   - Consider connecting to a database
   - Add user authentication
   - Build job posting import
   - Create applicant pipeline

## Contact & Support

For issues or questions:
1. Check README_ATS.md for detailed documentation
2. Review scoring algorithm in `src/lib/scoringEngine.ts`
3. Check browser DevTools for errors
4. Verify file formats are correct

---

**Happy Testing! 🚀**
