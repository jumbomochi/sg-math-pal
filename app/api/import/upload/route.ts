// POST /api/import/upload
// Handles PDF upload, creates ImportedPDF record, and extracts questions

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  extractTextFromPDF,
  isValidPDF,
  checkPDFLimits,
} from '@/lib/pdf-extractor';
import { extractQuestionsWithAI } from '@/lib/question-ai-extractor';
import { Tier } from '@/lib/import-types';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const source = formData.get('source') as string | null;
    const yearStr = formData.get('year') as string | null;
    const defaultTierStr = formData.get('defaultTier') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF
    if (!isValidPDF(buffer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    // Check size limits
    const limitsCheck = checkPDFLimits(buffer);
    if (!limitsCheck.valid) {
      return NextResponse.json(
        { success: false, error: limitsCheck.error },
        { status: 400 }
      );
    }

    // Parse optional fields
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const defaultTier = defaultTierStr
      ? (parseInt(defaultTierStr, 10) as Tier)
      : undefined;

    // Create ImportedPDF record
    const importRecord = await prisma.importedPDF.create({
      data: {
        filename: file.name,
        source: source || undefined,
        year: year && !isNaN(year) ? year : undefined,
        defaultTier: defaultTier && defaultTier >= 1 && defaultTier <= 5 ? defaultTier : undefined,
        status: 'processing',
      },
    });

    // Extract text from PDF
    let pdfResult;
    try {
      pdfResult = await extractTextFromPDF(buffer);
    } catch (extractError) {
      await prisma.importedPDF.update({
        where: { id: importRecord.id },
        data: {
          status: 'failed',
          errorMessage: `PDF extraction failed: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`,
        },
      });

      return NextResponse.json(
        {
          success: false,
          importId: importRecord.id,
          error: 'Failed to extract text from PDF',
        },
        { status: 500 }
      );
    }

    // Check page limits
    const pageLimits = checkPDFLimits(buffer, pdfResult.pageCount);
    if (!pageLimits.valid) {
      await prisma.importedPDF.update({
        where: { id: importRecord.id },
        data: {
          status: 'failed',
          errorMessage: pageLimits.error,
        },
      });

      return NextResponse.json(
        {
          success: false,
          importId: importRecord.id,
          error: pageLimits.error,
        },
        { status: 400 }
      );
    }

    // Extract questions using Claude AI
    let extractionResult;
    try {
      extractionResult = await extractQuestionsWithAI(pdfResult.text, {
        filename: file.name,
        source: source || undefined,
        year: year && !isNaN(year) ? year : undefined,
        defaultTier,
        totalPages: pdfResult.pageCount,
      });
    } catch (aiError) {
      await prisma.importedPDF.update({
        where: { id: importRecord.id },
        data: {
          status: 'failed',
          errorMessage: `AI extraction failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`,
        },
      });

      return NextResponse.json(
        {
          success: false,
          importId: importRecord.id,
          error: 'Failed to extract questions with AI',
        },
        { status: 500 }
      );
    }

    // Check if any questions were found
    if (extractionResult.questions.length === 0) {
      await prisma.importedPDF.update({
        where: { id: importRecord.id },
        data: {
          status: 'failed',
          errorMessage: 'No questions found in PDF',
        },
      });

      return NextResponse.json(
        {
          success: false,
          importId: importRecord.id,
          error: 'No questions found in the PDF. Please ensure the PDF contains math questions.',
        },
        { status: 400 }
      );
    }

    // Store extracted data and update status
    await prisma.importedPDF.update({
      where: { id: importRecord.id },
      data: {
        status: 'ready_for_review',
        questionsCount: extractionResult.questions.length,
        extractedData: JSON.stringify({
          questions: extractionResult.questions,
          metadata: extractionResult.metadata,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      status: 'ready_for_review',
      questionsFound: extractionResult.questions.length,
      message: `Successfully extracted ${extractionResult.questions.length} question(s) from ${file.name}`,
    });
  } catch (error) {
    console.error('Import upload error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process upload',
      },
      { status: 500 }
    );
  }
}
