// GET /api/import/status/[id]
// Returns the current status of a PDF import

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { StatusResponse, ExtractedQuestion, ImportMetadata } from '@/lib/import-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Import ID is required' },
        { status: 400 }
      );
    }

    const importRecord = await prisma.importedPDF.findUnique({
      where: { id },
    });

    if (!importRecord) {
      return NextResponse.json(
        { error: 'Import not found' },
        { status: 404 }
      );
    }

    // Build response
    const response: StatusResponse = {
      id: importRecord.id,
      status: importRecord.status as StatusResponse['status'],
      questionsFound: importRecord.questionsCount,
      errorMessage: importRecord.errorMessage || undefined,
    };

    // Add progress indicator for processing status
    if (importRecord.status === 'processing') {
      response.progress = 50; // Simple progress indicator
    } else if (importRecord.status === 'ready_for_review') {
      response.progress = 100;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Status check error:', error);

    return NextResponse.json(
      { error: 'Failed to check import status' },
      { status: 500 }
    );
  }
}

// Also support getting the extracted questions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (action !== 'get_questions') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const importRecord = await prisma.importedPDF.findUnique({
      where: { id },
    });

    if (!importRecord) {
      return NextResponse.json(
        { error: 'Import not found' },
        { status: 404 }
      );
    }

    if (importRecord.status !== 'ready_for_review') {
      return NextResponse.json(
        { error: 'Questions not ready for review' },
        { status: 400 }
      );
    }

    if (!importRecord.extractedData) {
      return NextResponse.json(
        { error: 'No extracted data found' },
        { status: 404 }
      );
    }

    // Parse stored extracted data
    const extractedData = JSON.parse(importRecord.extractedData) as {
      questions: ExtractedQuestion[];
      metadata: ImportMetadata;
    };

    return NextResponse.json({
      importId: importRecord.id,
      questions: extractedData.questions,
      metadata: {
        ...extractedData.metadata,
        filename: importRecord.filename,
        source: importRecord.source,
        year: importRecord.year,
      },
    });
  } catch (error) {
    console.error('Get questions error:', error);

    return NextResponse.json(
      { error: 'Failed to get questions' },
      { status: 500 }
    );
  }
}
