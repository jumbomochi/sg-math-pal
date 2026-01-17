# Batch PDF Question Import - Design Document

**Date:** 2026-01-17
**Status:** Approved
**Approach:** CLI Script + App Review UI

## Overview

A batch processing pipeline that extracts questions from 100+ P4 exam paper PDFs and stages them for review before adding to the main question bank.

### Data Flow

```
PDFs folder → Batch Script → Claude AI Extraction → Staging Table → Review UI → Approved Questions
     │                              │                      │              │
  /pdfs/                    Extract + auto-tier      StagedQuestion    /questions/staged/
```

### Key Decisions

- Questions land in a **staging table** (not directly in Question table)
- AI **auto-assigns tier** (1-4) based on complexity analysis
- **Topic auto-detected** from question content
- Source metadata preserved (PDF filename, page number, paper section)
- Review UI allows approve, reject, edit, or re-assign tier/topic

### Estimated Yield

P4 papers typically have 15-25 questions each. With 100+ PDFs: **1,500-2,500+ questions**.

---

## Database Schema

### New Model: `StagedQuestion`

```prisma
model StagedQuestion {
  id                String   @id @default(cuid())

  // Source tracking
  sourceFile        String   // "2025_EOY_RedSwastika.pdf"
  sourcePage        Int?     // Page number in PDF
  sourceSection     String?  // "Section A", "Section B", "Section C"
  sourceQuestionNum String?  // "Q5", "Q12a"

  // Extracted content
  content           String   // Question text (LaTeX supported)
  answer            String?  // Extracted answer if found
  answerType        String   @default("numeric")

  // AI-assigned (editable in review)
  suggestedTopic    String?  // "geometry", "fractions", etc.
  suggestedTier     Int?     // 1-4
  aiConfidence      Float?   // 0.0-1.0, how confident AI is
  aiReasoning       String?  // Why AI chose this tier/topic

  // Review workflow
  status            String   @default("pending") // "pending", "approved", "rejected", "needs_edit"
  reviewNotes       String?  // Your notes during review

  // Final values (set when approved)
  finalTopic        String?
  finalTier         Int?

  // Metadata
  extractedAt       DateTime @default(now())
  reviewedAt        DateTime?
  approvedQuestionId String? // Links to Question after approval

  @@index([status])
  @@index([sourceFile])
  @@index([suggestedTopic, suggestedTier])
}
```

---

## Batch Processing Script

**Location:** `scripts/batch-import-pdfs.ts`

### Process Flow

1. Scan `/pdfs` folder for all `*.pdf` files
2. For each PDF:
   a. Extract text using `pdf-parse` (existing lib)
   b. Send to Claude AI with specialized prompt
   c. AI returns structured question array
   d. Insert each question into `StagedQuestion` table
   e. Log progress + errors
3. Generate summary report

### Claude AI Prompt Strategy

The prompt instructs Claude to:
- Identify individual questions (handle multi-part like Q5a, Q5b)
- Extract the question text with proper LaTeX formatting
- Find the answer if present (some papers have answer keys)
- Detect paper section (A/B/C) from formatting patterns
- Assign topic based on content (geometry keywords, fraction notation, etc.)
- Assign tier with reasoning:
  - **Tier 1**: Direct calculation, single-step
  - **Tier 2**: Word problem, 2 steps, standard application
  - **Tier 3**: Requires heuristic (model method, work backwards), 3+ steps
  - **Tier 4**: Non-routine, multiple concepts combined

### Run Command

```bash
npx tsx scripts/batch-import-pdfs.ts --folder ./pdfs --concurrency 3
```

### Features

- **Resume support** - Tracks processed files, skips already-done PDFs
- **Rate limiting** - Respects Claude API limits (3 concurrent by default)
- **Error handling** - Failed PDFs logged, don't block others
- **Progress output** - Visual feedback for 100+ files

---

## Review UI

### Route: `/questions/staged`

### List View

| Column | Description |
|--------|-------------|
| Status | Pending / Needs Edit / Approved / Rejected (filterable) |
| Source | PDF name + question number |
| Preview | First 50 chars of question |
| Topic | AI suggestion with confidence badge |
| Tier | AI suggestion with confidence badge |
| Actions | Approve / Edit / Reject buttons |

### Bulk Actions Toolbar

- Select multiple → Approve all / Reject all
- Filter by: status, topic, tier, source file, confidence level
- Sort by: date extracted, confidence (low first for review), source

### Edit/Review Modal

```
┌─────────────────────────────────────────────────────┐
│  Source: 2025_EOY_RedSwastika.pdf - Q12 (Page 5)   │
├─────────────────────────────────────────────────────┤
│  Question Preview (rendered with KaTeX)             │
│  ┌─────────────────────────────────────────────┐   │
│  │ A rectangle has length 12 cm...              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Content (editable)     Answer: [40    ]           │
│  [textarea with LaTeX]  Type:   [numeric ▼]        │
│                                                     │
│  Topic: [geometry ▼]    Tier: [● 1 ○ 2 ○ 3 ○ 4]   │
│  AI said: "Tier 2 - standard area calculation"     │
│  Confidence: 87%                                    │
│                                                     │
│  Hints (optional):                                  │
│  [Add hints during review or leave for later]      │
│                                                     │
│  [Reject]  [Save & Next]  [Approve & Next]         │
└─────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

- `A` - Approve & next
- `R` - Reject & next
- `E` - Edit mode
- `1-4` - Set tier
- `←/→` - Previous/next question

---

## Approval Flow

### When "Approve" is clicked:

1. Validate required fields (content, answer, topic, tier)
2. Generate unique slug: `{topic}-t{tier}-{source}-{seq}` (e.g., `geo-t2-redswastika2025-012`)
3. Create new `Question` record with:
   - Content, answer, answerType from staged
   - Topic + tier (final choices)
   - Source metadata preserved
   - Auto-generate basic hints if none provided
4. Update `StagedQuestion`:
   - Set `status = "approved"`
   - Link `approvedQuestionId` to new Question
5. Show confirmation toast, advance to next pending question

### Bulk Approve Logic

- Same flow, batched in transaction
- Only processes questions where topic + tier are confirmed
- Skips any with missing required fields (flags for manual review)

### Stats Dashboard

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Pending  │ │ Approved │ │ Rejected │ │ Total    │
│   847    │ │   612    │ │    41    │ │  1,500   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Duplicate Detection

- Before approval, check for similar questions (fuzzy match on content)
- Warn if potential duplicate found, let user decide

---

## Implementation Plan

### Phase 1: Database Setup
- Add `StagedQuestion` model to Prisma schema
- Run migration
- Create API routes for CRUD operations

### Phase 2: Batch Script
- Create `scripts/batch-import-pdfs.ts`
- Implement PDF text extraction
- Design and test Claude AI prompt
- Add progress tracking and resume support
- Error handling and logging

### Phase 3: Review UI
- Create `/questions/staged` page
- Build list view with filters and sorting
- Build edit/review modal
- Implement keyboard shortcuts
- Add bulk actions

### Phase 4: Approval Flow
- Implement single approve logic
- Implement bulk approve
- Add duplicate detection
- Add stats dashboard

---

## File Structure

```
sg-math-pal/
├── pdfs/                           # PDF source folder (gitignored)
│   ├── 2025_EOY_RedSwastika.pdf
│   └── ... (100+ PDFs)
├── scripts/
│   └── batch-import-pdfs.ts        # Batch processing script
├── prisma/
│   └── schema.prisma               # + StagedQuestion model
├── app/
│   ├── questions/
│   │   └── staged/
│   │       ├── page.tsx            # List view
│   │       └── StagedQuestionList.tsx
│   └── api/
│       └── staged-questions/
│           ├── route.ts            # GET list, POST approve
│           └── [id]/
│               └── route.ts        # GET, PATCH, DELETE single
└── components/
    └── staged/
        ├── StagedQuestionCard.tsx
        ├── ReviewModal.tsx
        └── BulkActions.tsx
```

---

## Notes

- P4 exam papers map primarily to Tiers 1-3, with challenging Section C questions reaching Tier 4
- Claude API rate limiting: default 3 concurrent requests
- Resume support via tracking processed files in `pdfs/.import-progress.json`
