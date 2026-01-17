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
    const { questions } = await extractQuestionsWithAI(pdfResult.text, {
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
          sourcePage: null,
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
