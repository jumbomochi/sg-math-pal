# Batch PDF Question Import - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a batch processing pipeline that extracts questions from 100+ P4 exam paper PDFs into a staging table for review before adding to the main question bank.

**Architecture:** CLI script processes PDFs using existing `pdf-parse` and Claude AI extraction, storing results in `StagedQuestion` table. New Review UI at `/questions/staged` allows filtering, editing, and bulk approval of questions.

**Tech Stack:** Next.js 14, Prisma/SQLite, Anthropic SDK (existing), tsx for scripts

---

## Phase 1: Database Setup

### Task 1.1: Add StagedQuestion Model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add the StagedQuestion model to schema**

Add at the end of `prisma/schema.prisma`:

```prisma
// ==========================================
// STAGED QUESTIONS (Batch Import Review)
// ==========================================

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
  acceptedAnswers   String?  // JSON array of alternatives
  hints             String?  // JSON array
  solution          String?  // Worked solution

  // AI-assigned (editable in review)
  suggestedTopic    String?  // "geometry", "fractions", etc.
  suggestedTier     Int?     // 1-4
  aiConfidence      Float?   // 0.0-1.0
  aiReasoning       String?  // Why AI chose this tier/topic

  // Review workflow
  status            String   @default("pending") // pending, approved, rejected, needs_edit
  reviewNotes       String?  // Notes during review

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

**Step 2: Push schema changes to database**

Run: `npx prisma db push`

Expected: "Your database is now in sync with your Prisma schema."

**Step 3: Generate Prisma client**

Run: `npx prisma generate`

Expected: "Generated Prisma Client"

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add StagedQuestion model for batch import review"
```

---

## Phase 2: Batch Processing Script

### Task 2.1: Create Script File Structure

**Files:**
- Create: `scripts/batch-import-pdfs.ts`

**Step 1: Create the script with imports and CLI argument parsing**

```typescript
#!/usr/bin/env npx tsx
// Batch import PDFs from a folder into StagedQuestion table

import { PrismaClient } from '@prisma/client';
import { extractTextFromPDF, isValidPDF } from '../lib/pdf-extractor';
import { extractQuestionsWithAI } from '../lib/question-ai-extractor';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// CLI arguments
const args = process.argv.slice(2);
const folderArg = args.find(a => a.startsWith('--folder='));
const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
const dryRunArg = args.includes('--dry-run');

const FOLDER = folderArg?.split('=')[1] || './pdfs';
const CONCURRENCY = parseInt(concurrencyArg?.split('=')[1] || '3', 10);
const DRY_RUN = dryRunArg;

const PROGRESS_FILE = path.join(FOLDER, '.import-progress.json');

interface Progress {
  processedFiles: string[];
  failedFiles: { file: string; error: string }[];
  totalQuestions: number;
  startedAt: string;
  lastUpdated: string;
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return {
    processedFiles: [],
    failedFiles: [],
    totalQuestions: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

function saveProgress(progress: Progress): void {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function processPDF(
  filePath: string,
  progress: Progress
): Promise<number> {
  const filename = path.basename(filePath);
  console.log(`\n📄 Processing: ${filename}`);

  try {
    // Read PDF file
    const buffer = fs.readFileSync(filePath);

    if (!isValidPDF(buffer)) {
      throw new Error('Invalid PDF format');
    }

    // Extract text
    const pdfResult = await extractTextFromPDF(buffer);
    console.log(`   📝 Extracted ${pdfResult.pageCount} pages`);

    // Extract questions with AI
    const { questions, metadata } = await extractQuestionsWithAI(pdfResult.text, {
      filename,
    });
    console.log(`   🤖 AI found ${questions.length} questions`);

    if (DRY_RUN) {
      console.log(`   🔍 DRY RUN - would insert ${questions.length} staged questions`);
      return questions.length;
    }

    // Insert into StagedQuestion table
    let insertedCount = 0;
    for (const q of questions) {
      await prisma.stagedQuestion.create({
        data: {
          sourceFile: filename,
          sourcePage: null, // Could be enhanced to track this
          sourceSection: null,
          sourceQuestionNum: q.sourceQuestion?.toString() || null,
          content: q.content,
          answer: q.answer || null,
          answerType: q.answerType || 'numeric',
          acceptedAnswers: q.acceptedAnswers ? JSON.stringify(q.acceptedAnswers) : null,
          hints: q.hints ? JSON.stringify(q.hints) : null,
          solution: q.solution || null,
          suggestedTopic: q.topicSlug,
          suggestedTier: q.tier,
          aiConfidence: q.confidence || null,
          aiReasoning: q.reasoning || null,
          status: q.needsReview ? 'needs_edit' : 'pending',
        },
      });
      insertedCount++;
    }

    console.log(`   ✅ Inserted ${insertedCount} questions`);
    return insertedCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ Error: ${message}`);
    progress.failedFiles.push({ file: filename, error: message });
    return 0;
  }
}

async function main(): Promise<void> {
  console.log('🚀 Batch PDF Import');
  console.log(`   Folder: ${FOLDER}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log('');

  // Check folder exists
  if (!fs.existsSync(FOLDER)) {
    console.error(`❌ Folder not found: ${FOLDER}`);
    process.exit(1);
  }

  // Get all PDF files
  const allFiles = fs.readdirSync(FOLDER).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`📁 Found ${allFiles.length} PDF files`);

  // Load progress
  const progress = loadProgress();
  const pendingFiles = allFiles.filter(f => !progress.processedFiles.includes(f));
  console.log(`⏳ Pending: ${pendingFiles.length} files (${progress.processedFiles.length} already processed)`);

  if (pendingFiles.length === 0) {
    console.log('\n✅ All files already processed!');
    return;
  }

  // Process files with concurrency limit
  let processed = 0;
  for (let i = 0; i < pendingFiles.length; i += CONCURRENCY) {
    const batch = pendingFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (file) => {
        const count = await processPDF(path.join(FOLDER, file), progress);
        return { file, count };
      })
    );

    // Update progress
    for (const { file, count } of results) {
      progress.processedFiles.push(file);
      progress.totalQuestions += count;
      processed++;
    }
    saveProgress(progress);

    console.log(`\n📊 Progress: ${processed}/${pendingFiles.length} files`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total PDFs processed: ${progress.processedFiles.length}`);
  console.log(`Total questions extracted: ${progress.totalQuestions}`);
  console.log(`Failed PDFs: ${progress.failedFiles.length}`);

  if (progress.failedFiles.length > 0) {
    console.log('\n❌ Failed files:');
    for (const { file, error } of progress.failedFiles) {
      console.log(`   - ${file}: ${error}`);
    }
  }

  console.log('\n✅ Done! Review questions at /questions/staged');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Test the script with dry-run**

Run: `npx tsx scripts/batch-import-pdfs.ts --folder=./pdfs --dry-run`

Expected: Script finds PDFs and shows what would be imported without writing to DB.

**Step 3: Commit**

```bash
git add scripts/batch-import-pdfs.ts
git commit -m "feat(scripts): add batch PDF import script"
```

---

### Task 2.2: Create PDFs Folder with Gitignore

**Files:**
- Create: `pdfs/.gitkeep`
- Create: `pdfs/.gitignore`

**Step 1: Create pdfs folder with gitignore**

Create `pdfs/.gitignore`:

```
# Ignore all PDFs (large files)
*.pdf
# But keep the progress file
!.import-progress.json
# Keep gitkeep
!.gitkeep
```

Create `pdfs/.gitkeep` (empty file).

**Step 2: Move existing PDF to pdfs folder**

Run: `mv 2025_EOY_RedSwastika.pdf pdfs/`

**Step 3: Commit**

```bash
git add pdfs/.gitignore pdfs/.gitkeep
git commit -m "chore: add pdfs folder for batch import"
```

---

### Task 2.3: Add npm Script for Batch Import

**Files:**
- Modify: `package.json`

**Step 1: Add script to package.json**

Add to the `"scripts"` section:

```json
"import:pdfs": "tsx scripts/batch-import-pdfs.ts --folder=./pdfs",
"import:pdfs:dry": "tsx scripts/batch-import-pdfs.ts --folder=./pdfs --dry-run"
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add npm scripts for batch PDF import"
```

---

## Phase 3: API Routes for Staged Questions

### Task 3.1: Create Staged Questions List API

**Files:**
- Create: `app/api/staged-questions/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'needs_edit', 'all']).optional(),
  topic: z.string().optional(),
  tier: z.coerce.number().min(1).max(5).optional(),
  sourceFile: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['extractedAt', 'aiConfidence', 'sourceFile']).default('extractedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    const where: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }
    if (query.topic) {
      where.suggestedTopic = query.topic;
    }
    if (query.tier) {
      where.suggestedTier = query.tier;
    }
    if (query.sourceFile) {
      where.sourceFile = { contains: query.sourceFile };
    }

    const [questions, total] = await Promise.all([
      prisma.stagedQuestion.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.offset,
        take: query.limit,
      }),
      prisma.stagedQuestion.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.stagedQuestion.groupBy({
      by: ['status'],
      _count: true,
    });

    const statsByStatus = Object.fromEntries(
      stats.map(s => [s.status, s._count])
    );

    return NextResponse.json({
      questions,
      total,
      stats: {
        pending: statsByStatus.pending || 0,
        approved: statsByStatus.approved || 0,
        rejected: statsByStatus.rejected || 0,
        needs_edit: statsByStatus.needs_edit || 0,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching staged questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staged questions' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test the API**

Run dev server: `npm run dev`

Run: `curl "http://localhost:3001/api/staged-questions?status=pending&limit=10"`

Expected: JSON response with empty questions array (no data yet).

**Step 3: Commit**

```bash
git add app/api/staged-questions/route.ts
git commit -m "feat(api): add staged questions list endpoint"
```

---

### Task 3.2: Create Single Staged Question API

**Files:**
- Create: `app/api/staged-questions/[id]/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  content: z.string().optional(),
  answer: z.string().optional(),
  answerType: z.enum(['exact', 'numeric', 'multiple-choice']).optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  solution: z.string().optional(),
  suggestedTopic: z.string().optional(),
  suggestedTier: z.number().min(1).max(5).optional(),
  finalTopic: z.string().optional(),
  finalTier: z.number().min(1).max(5).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'needs_edit']).optional(),
  reviewNotes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.stagedQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching staged question:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    // Convert arrays to JSON strings for storage
    const updateData: Record<string, unknown> = { ...data };
    if (data.acceptedAnswers) {
      updateData.acceptedAnswers = JSON.stringify(data.acceptedAnswers);
    }
    if (data.hints) {
      updateData.hints = JSON.stringify(data.hints);
    }
    if (data.status) {
      updateData.reviewedAt = new Date();
    }

    const question = await prisma.stagedQuestion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating staged question:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.stagedQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staged question:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/staged-questions/[id]/route.ts
git commit -m "feat(api): add single staged question CRUD endpoint"
```

---

### Task 3.3: Create Approve Staged Question API

**Files:**
- Create: `app/api/staged-questions/[id]/approve/route.ts`

**Step 1: Create the approve endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const approveSchema = z.object({
  finalTopic: z.string(),
  finalTier: z.number().min(1).max(5),
  title: z.string().optional(),
  hints: z.array(z.string()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = approveSchema.parse(body);

    // Get the staged question
    const staged = await prisma.stagedQuestion.findUnique({
      where: { id },
    });

    if (!staged) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (staged.status === 'approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 });
    }

    // Find the topic
    const topic = await prisma.topic.findUnique({
      where: { slug: data.finalTopic },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    // Check for duplicates (fuzzy match on content)
    const normalizedContent = staged.content.toLowerCase().replace(/\s+/g, ' ').trim();
    const existingQuestions = await prisma.question.findMany({
      where: { topicId: topic.id },
      select: { id: true, content: true },
    });

    const isDuplicate = existingQuestions.some(q => {
      const existing = q.content.toLowerCase().replace(/\s+/g, ' ').trim();
      // Simple similarity check - could be enhanced
      return existing === normalizedContent ||
        (existing.length > 50 && normalizedContent.includes(existing.slice(0, 50)));
    });

    if (isDuplicate) {
      return NextResponse.json({
        error: 'Potential duplicate question detected',
        warning: true,
      }, { status: 409 });
    }

    // Generate slug
    const sourceSlug = staged.sourceFile
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .slice(0, 20);
    const count = await prisma.question.count({
      where: { topicId: topic.id, tier: data.finalTier },
    });
    const slug = `${data.finalTopic}-t${data.finalTier}-${sourceSlug}-${String(count + 1).padStart(3, '0')}`;

    // Generate title if not provided
    const title = data.title || staged.content.slice(0, 50).replace(/\$.*?\$/g, '').trim() + '...';

    // Create the question
    const question = await prisma.question.create({
      data: {
        topicId: topic.id,
        slug,
        tier: data.finalTier,
        title,
        content: staged.content,
        answer: staged.answer || '',
        answerType: staged.answerType || 'numeric',
        acceptedAnswers: staged.acceptedAnswers,
        hints: data.hints ? JSON.stringify(data.hints) : staged.hints,
        solution: staged.solution,
        source: staged.sourceFile,
        xpValue: [10, 15, 25, 40, 60][data.finalTier - 1] || 10,
      },
    });

    // Update staged question
    await prisma.stagedQuestion.update({
      where: { id },
      data: {
        status: 'approved',
        finalTopic: data.finalTopic,
        finalTier: data.finalTier,
        approvedQuestionId: question.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      questionId: question.id,
      slug: question.slug,
    });
  } catch (error) {
    console.error('Error approving staged question:', error);
    return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/staged-questions/[id]/approve/route.ts
git commit -m "feat(api): add staged question approve endpoint"
```

---

### Task 3.4: Create Bulk Actions API

**Files:**
- Create: `app/api/staged-questions/bulk/route.ts`

**Step 1: Create the bulk actions endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'delete']),
  ids: z.array(z.string()).min(1).max(100),
  // For bulk approve
  defaultTopic: z.string().optional(),
  defaultTier: z.number().min(1).max(5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, defaultTopic, defaultTier } = bulkActionSchema.parse(body);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    if (action === 'reject') {
      const result = await prisma.stagedQuestion.updateMany({
        where: { id: { in: ids } },
        data: { status: 'rejected', reviewedAt: new Date() },
      });
      processed = result.count;
    } else if (action === 'delete') {
      const result = await prisma.stagedQuestion.deleteMany({
        where: { id: { in: ids } },
      });
      processed = result.count;
    } else if (action === 'approve') {
      // Bulk approve requires iterating (need to create Question records)
      for (const id of ids) {
        try {
          const staged = await prisma.stagedQuestion.findUnique({ where: { id } });
          if (!staged || staged.status === 'approved') continue;

          const topic = defaultTopic || staged.suggestedTopic || staged.finalTopic;
          const tier = defaultTier || staged.suggestedTier || staged.finalTier;

          if (!topic || !tier) {
            errors.push(`${id}: Missing topic or tier`);
            failed++;
            continue;
          }

          const topicRecord = await prisma.topic.findUnique({ where: { slug: topic } });
          if (!topicRecord) {
            errors.push(`${id}: Invalid topic ${topic}`);
            failed++;
            continue;
          }

          // Generate slug
          const sourceSlug = staged.sourceFile
            .replace(/\.pdf$/i, '')
            .replace(/[^a-z0-9]+/gi, '-')
            .toLowerCase()
            .slice(0, 20);
          const count = await prisma.question.count({
            where: { topicId: topicRecord.id, tier },
          });
          const slug = `${topic}-t${tier}-${sourceSlug}-${String(count + 1).padStart(3, '0')}`;
          const title = staged.content.slice(0, 50).replace(/\$.*?\$/g, '').trim() + '...';

          const question = await prisma.question.create({
            data: {
              topicId: topicRecord.id,
              slug,
              tier,
              title,
              content: staged.content,
              answer: staged.answer || '',
              answerType: staged.answerType || 'numeric',
              acceptedAnswers: staged.acceptedAnswers,
              hints: staged.hints,
              solution: staged.solution,
              source: staged.sourceFile,
              xpValue: [10, 15, 25, 40, 60][tier - 1] || 10,
            },
          });

          await prisma.stagedQuestion.update({
            where: { id },
            data: {
              status: 'approved',
              finalTopic: topic,
              finalTier: tier,
              approvedQuestionId: question.id,
              reviewedAt: new Date(),
            },
          });

          processed++;
        } catch (err) {
          errors.push(`${id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          failed++;
        }
      }
    }

    return NextResponse.json({
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in bulk action:', error);
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/staged-questions/bulk/route.ts
git commit -m "feat(api): add bulk actions endpoint for staged questions"
```

---

## Phase 4: Review UI

### Task 4.1: Create Staged Questions List Page

**Files:**
- Create: `app/questions/staged/page.tsx`

**Step 1: Create the page**

```tsx
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { StagedQuestionList } from './StagedQuestionList';

export const dynamic = 'force-dynamic';

async function getStats() {
  const stats = await prisma.stagedQuestion.groupBy({
    by: ['status'],
    _count: true,
  });

  const total = await prisma.stagedQuestion.count();

  return {
    pending: stats.find(s => s.status === 'pending')?._count || 0,
    approved: stats.find(s => s.status === 'approved')?._count || 0,
    rejected: stats.find(s => s.status === 'rejected')?._count || 0,
    needs_edit: stats.find(s => s.status === 'needs_edit')?._count || 0,
    total,
  };
}

async function getSourceFiles() {
  const files = await prisma.stagedQuestion.findMany({
    select: { sourceFile: true },
    distinct: ['sourceFile'],
    orderBy: { sourceFile: 'asc' },
  });
  return files.map(f => f.sourceFile);
}

export default async function StagedQuestionsPage() {
  const [stats, sourceFiles] = await Promise.all([getStats(), getSourceFiles()]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Staged Questions</h1>
      <p className="text-gray-600 mb-6">Review and approve questions extracted from PDFs</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Pending" value={stats.pending} color="bg-yellow-100 text-yellow-800" />
        <StatCard label="Needs Edit" value={stats.needs_edit} color="bg-orange-100 text-orange-800" />
        <StatCard label="Approved" value={stats.approved} color="bg-green-100 text-green-800" />
        <StatCard label="Rejected" value={stats.rejected} color="bg-red-100 text-red-800" />
        <StatCard label="Total" value={stats.total} color="bg-blue-100 text-blue-800" />
      </div>

      <Suspense fallback={<div>Loading questions...</div>}>
        <StagedQuestionList sourceFiles={sourceFiles} />
      </Suspense>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/questions/staged/page.tsx
git commit -m "feat(ui): add staged questions page with stats"
```

---

### Task 4.2: Create Staged Question List Component

**Files:**
- Create: `app/questions/staged/StagedQuestionList.tsx`

**Step 1: Create the list component**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, Edit2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { ReviewModal } from './ReviewModal';

interface StagedQuestion {
  id: string;
  sourceFile: string;
  sourceQuestionNum: string | null;
  content: string;
  answer: string | null;
  suggestedTopic: string | null;
  suggestedTier: number | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
  status: string;
  extractedAt: string;
}

interface Props {
  sourceFiles: string[];
}

export function StagedQuestionList({ sourceFiles }: Props) {
  const [questions, setQuestions] = useState<StagedQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewQuestion, setReviewQuestion] = useState<StagedQuestion | null>(null);

  // Filters
  const [status, setStatus] = useState<string>('pending');
  const [topic, setTopic] = useState<string>('');
  const [tier, setTier] = useState<string>('');
  const [sourceFile, setSourceFile] = useState<string>('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const topics = ['geometry', 'fractions', 'number-patterns', 'whole-numbers', 'decimals', 'word-problems'];

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status,
      limit: String(limit),
      offset: String(page * limit),
    });
    if (topic) params.set('topic', topic);
    if (tier) params.set('tier', tier);
    if (sourceFile) params.set('sourceFile', sourceFile);

    const res = await fetch(`/api/staged-questions?${params}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [status, topic, tier, sourceFile, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selected.size === 0) return;

    const confirmed = action === 'delete'
      ? confirm(`Delete ${selected.size} questions? This cannot be undone.`)
      : true;
    if (!confirmed) return;

    await fetch('/api/staged-questions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: Array.from(selected) }),
    });

    setSelected(new Set());
    fetchQuestions();
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map(q => q.id)));
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(0); }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="pending">Pending</option>
          <option value="needs_edit">Needs Edit</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>

        <select
          value={topic}
          onChange={e => { setTopic(e.target.value); setPage(0); }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All Topics</option>
          {topics.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={tier}
          onChange={e => { setTier(e.target.value); setPage(0); }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All Tiers</option>
          {[1, 2, 3, 4, 5].map(t => (
            <option key={t} value={t}>Tier {t}</option>
          ))}
        </select>

        <select
          value={sourceFile}
          onChange={e => { setSourceFile(e.target.value); setPage(0); }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All Sources</option>
          {sourceFiles.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
          <span className="font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')}>
            <Check className="w-4 h-4 mr-1" /> Approve All
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
            <X className="w-4 h-4 mr-1" /> Reject All
          </Button>
          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleBulkAction('delete')}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No questions found</div>
      ) : (
        <>
          <div className="mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size === questions.length}
                onChange={selectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Select all on this page</span>
            </label>
          </div>

          <div className="space-y-3">
            {questions.map(q => (
              <Card key={q.id} className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggleSelect(q.id)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {q.sourceFile}
                      </span>
                      {q.sourceQuestionNum && (
                        <span className="text-xs text-gray-500">Q{q.sourceQuestionNum}</span>
                      )}
                      {q.suggestedTopic && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {q.suggestedTopic}
                        </span>
                      )}
                      {q.suggestedTier && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          Tier {q.suggestedTier}
                        </span>
                      )}
                      {q.aiConfidence !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          q.aiConfidence >= 0.8 ? 'bg-green-100 text-green-800' :
                          q.aiConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(q.aiConfidence * 100)}% conf
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2">{q.content}</p>
                    {q.answer && (
                      <p className="text-xs text-gray-500 mt-1">Answer: {q.answer}</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setReviewQuestion(q)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewQuestion && (
        <ReviewModal
          question={reviewQuestion}
          onClose={() => setReviewQuestion(null)}
          onSaved={() => {
            setReviewQuestion(null);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/questions/staged/StagedQuestionList.tsx
git commit -m "feat(ui): add staged question list component with filters"
```

---

### Task 4.3: Create Review Modal Component

**Files:**
- Create: `app/questions/staged/ReviewModal.tsx`

**Step 1: Create the review modal**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Check, AlertTriangle } from 'lucide-react';
import { MathDisplay } from '@/components/math/MathDisplay';

interface StagedQuestion {
  id: string;
  sourceFile: string;
  sourceQuestionNum: string | null;
  content: string;
  answer: string | null;
  answerType?: string;
  suggestedTopic: string | null;
  suggestedTier: number | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
  hints?: string | null;
  solution?: string | null;
  status: string;
}

interface Props {
  question: StagedQuestion;
  onClose: () => void;
  onSaved: () => void;
}

const topics = ['geometry', 'fractions', 'number-patterns', 'whole-numbers', 'decimals', 'word-problems'];

export function ReviewModal({ question, onClose, onSaved }: Props) {
  const [content, setContent] = useState(question.content);
  const [answer, setAnswer] = useState(question.answer || '');
  const [answerType, setAnswerType] = useState(question.answerType || 'numeric');
  const [selectedTopic, setSelectedTopic] = useState(question.suggestedTopic || '');
  const [selectedTier, setSelectedTier] = useState(question.suggestedTier || 2);
  const [hints, setHints] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question.hints) {
      try {
        setHints(JSON.parse(question.hints));
      } catch {
        setHints([]);
      }
    }
  }, [question.hints]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        handleApprove();
      }
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        handleReject();
      }
      if (e.key >= '1' && e.key <= '4' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        setSelectedTier(parseInt(e.key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTopic, selectedTier, content, answer]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await fetch(`/api/staged-questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          answer,
          answerType,
          suggestedTopic: selectedTopic,
          suggestedTier: selectedTier,
          hints,
          status: 'pending',
        }),
      });
      onSaved();
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTopic || !selectedTier) {
      setError('Please select topic and tier');
      return;
    }
    if (!answer) {
      setError('Please provide an answer');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staged-questions/${question.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalTopic: selectedTopic,
          finalTier: selectedTier,
          hints,
        }),
      });

      const data = await res.json();
      if (data.warning) {
        if (!confirm('Potential duplicate detected. Approve anyway?')) {
          setSaving(false);
          return;
        }
        // Force approve - would need another API call
      }
      if (!res.ok) throw new Error(data.error);

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await fetch(`/api/staged-questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      onSaved();
    } catch {
      setError('Failed to reject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Review Question</h2>
              <p className="text-sm text-gray-500">
                {question.sourceFile}
                {question.sourceQuestionNum && ` - Q${question.sourceQuestionNum}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* AI Reasoning */}
          {question.aiReasoning && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
              <div className="font-medium text-blue-800 mb-1">AI Analysis</div>
              <p className="text-blue-700">{question.aiReasoning}</p>
              {question.aiConfidence !== null && (
                <p className="text-blue-600 mt-1">Confidence: {Math.round(question.aiConfidence * 100)}%</p>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-2">Preview</div>
            <MathDisplay content={content} />
          </div>

          {/* Content Editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Question Content (LaTeX supported)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className="w-full border rounded-lg p-3 font-mono text-sm"
            />
          </div>

          {/* Answer */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Answer</label>
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Answer Type</label>
              <select
                value={answerType}
                onChange={e => setAnswerType(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                <option value="numeric">Numeric</option>
                <option value="exact">Exact Match</option>
                <option value="multiple-choice">Multiple Choice</option>
              </select>
            </div>
          </div>

          {/* Topic and Tier */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Topic</label>
              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select topic...</option>
                {topics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tier (press 1-4)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`flex-1 py-2 rounded-lg border-2 font-medium transition-colors ${
                      selectedTier === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hints */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Hints (optional)</label>
            {hints.map((hint, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={hint}
                  onChange={e => {
                    const newHints = [...hints];
                    newHints[i] = e.target.value;
                    setHints(newHints);
                  }}
                  className="flex-1 border rounded-lg p-2 text-sm"
                  placeholder={`Hint ${i + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHints(hints.filter((_, j) => j !== i))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {hints.length < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHints([...hints, ''])}
              >
                Add Hint
              </Button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-gray-500">
              Shortcuts: <kbd className="bg-gray-100 px-1 rounded">A</kbd> Approve,{' '}
              <kbd className="bg-gray-100 px-1 rounded">R</kbd> Reject,{' '}
              <kbd className="bg-gray-100 px-1 rounded">1-4</kbd> Set tier
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReject} disabled={saving}>
                <X className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                Save Changes
              </Button>
              <Button onClick={handleApprove} disabled={saving}>
                <Check className="w-4 h-4 mr-1" /> Approve
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/questions/staged/ReviewModal.tsx
git commit -m "feat(ui): add review modal with keyboard shortcuts"
```

---

### Task 4.4: Add Navigation Link to Staged Questions

**Files:**
- Modify: `components/layout/Header.tsx`

**Step 1: Find and update Header to add link**

Add a link to `/questions/staged` in the navigation. Look for existing navigation links and add:

```tsx
<Link href="/questions/staged" className="...existing classes...">
  Review Queue
</Link>
```

**Step 2: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(ui): add navigation link to staged questions"
```

---

## Phase 5: Testing & Validation

### Task 5.1: Test Full Pipeline

**Step 1: Run the batch import script on test PDFs**

Run: `npm run import:pdfs`

Expected: Script processes PDFs in `./pdfs/` folder and inserts questions into StagedQuestion table.

**Step 2: Open the review UI**

Navigate to: `http://localhost:3001/questions/staged`

Expected: See stats cards and list of pending questions.

**Step 3: Test the review workflow**

- Click on a question to open review modal
- Edit content, change topic/tier
- Use keyboard shortcuts (A, R, 1-4)
- Approve a question and verify it appears in main Questions list

**Step 4: Test bulk actions**

- Select multiple questions
- Use bulk approve/reject
- Verify status changes

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during testing"
```

---

### Task 5.2: Final Commit and Summary

**Step 1: Verify all features work**

Run through complete workflow:
1. PDFs in `./pdfs/`
2. Run `npm run import:pdfs`
3. Review at `/questions/staged`
4. Approve questions
5. See questions in main bank

**Step 2: Update design doc with any changes**

If implementation differed from design, update `docs/plans/2026-01-17-batch-pdf-import-design.md`.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete batch PDF import system

- StagedQuestion model for review workflow
- CLI batch script with resume support
- Review UI with filters and keyboard shortcuts
- Bulk actions for approve/reject
- Duplicate detection on approval"
```

---

## Quick Reference

### Commands

```bash
# Import PDFs
npm run import:pdfs          # Run batch import
npm run import:pdfs:dry      # Dry run (no DB writes)

# Database
npx prisma db push           # Apply schema changes
npx prisma studio            # Open DB GUI

# Development
npm run dev                  # Start dev server
```

### Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | StagedQuestion model |
| `scripts/batch-import-pdfs.ts` | Batch import CLI |
| `app/api/staged-questions/route.ts` | List API |
| `app/api/staged-questions/[id]/route.ts` | CRUD API |
| `app/api/staged-questions/[id]/approve/route.ts` | Approve API |
| `app/api/staged-questions/bulk/route.ts` | Bulk actions API |
| `app/questions/staged/page.tsx` | Review page |
| `app/questions/staged/StagedQuestionList.tsx` | List component |
| `app/questions/staged/ReviewModal.tsx` | Review modal |

### Keyboard Shortcuts (Review Modal)

| Key | Action |
|-----|--------|
| `A` | Approve & close |
| `R` | Reject & close |
| `1-4` | Set tier |
| `Esc` | Close modal |
