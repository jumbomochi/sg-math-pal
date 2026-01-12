// PDF text extraction using pdf-parse
// Handles multi-page documents and text normalization

import pdf from 'pdf-parse';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  pages: string[];
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

/**
 * Extract text content from a PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
  try {
    const data = await pdf(buffer);

    // Split text into pages (pdf-parse combines all pages)
    // We estimate page breaks by looking for common patterns
    const pages = splitIntoPages(data.text, data.numpages);

    return {
      text: normalizeText(data.text),
      pageCount: data.numpages,
      pages: pages.map(normalizeText),
      metadata: {
        title: data.info?.Title || undefined,
        author: data.info?.Author || undefined,
        creationDate: data.info?.CreationDate
          ? parseDate(data.info.CreationDate)
          : undefined,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract PDF text: ${message}`);
  }
}

/**
 * Split extracted text into approximate pages
 * pdf-parse doesn't preserve page breaks, so we estimate based on content
 */
function splitIntoPages(text: string, pageCount: number): string[] {
  if (pageCount <= 1) {
    return [text];
  }

  // Look for common page break indicators
  const pageBreakPatterns = [
    /\n{3,}/g,                           // Multiple blank lines
    /\bPage\s+\d+\b/gi,                  // "Page X" markers
    /\b\d+\s*\/\s*\d+\b/g,               // "X / Y" page numbers
    /_{10,}/g,                           // Long underscores
    /={10,}/g,                           // Long equals signs
  ];

  // Try to split by page markers first
  let pages: string[] = [];

  // Split by multiple newlines as rough page estimate
  const roughPages = text.split(/\n{4,}/);

  if (roughPages.length >= pageCount) {
    // If we have enough splits, group them into page count
    const pagesPerGroup = Math.ceil(roughPages.length / pageCount);
    for (let i = 0; i < pageCount; i++) {
      const start = i * pagesPerGroup;
      const end = Math.min(start + pagesPerGroup, roughPages.length);
      pages.push(roughPages.slice(start, end).join('\n\n'));
    }
  } else {
    // Otherwise, split evenly by character count
    const charsPerPage = Math.ceil(text.length / pageCount);
    for (let i = 0; i < pageCount; i++) {
      const start = i * charsPerPage;
      const end = Math.min(start + charsPerPage, text.length);

      // Try to break at a sentence or paragraph
      let breakPoint = end;
      if (end < text.length) {
        const nextNewline = text.indexOf('\n', end);
        const nextPeriod = text.indexOf('. ', end);

        if (nextNewline !== -1 && nextNewline < end + 200) {
          breakPoint = nextNewline + 1;
        } else if (nextPeriod !== -1 && nextPeriod < end + 100) {
          breakPoint = nextPeriod + 2;
        }
      }

      pages.push(text.slice(start, breakPoint));
    }
  }

  return pages.filter(p => p.trim().length > 0);
}

/**
 * Normalize extracted text for better AI processing
 */
function normalizeText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/[ \t]+/g, ' ')
    // Preserve paragraph breaks but normalize them
    .replace(/\n{2,}/g, '\n\n')
    // Remove stray control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Normalize dashes
    .replace(/[–—]/g, '-')
    // Normalize ellipsis
    .replace(/\.{3,}/g, '...')
    // Clean up common OCR artifacts
    .replace(/\|/g, 'I')  // Common OCR mistake
    .replace(/[ﬁﬂ]/g, (m) => m === 'ﬁ' ? 'fi' : 'fl')  // Ligatures
    .trim();
}

/**
 * Parse PDF date format to JavaScript Date
 */
function parseDate(pdfDate: string): Date | undefined {
  try {
    // PDF dates are in format: D:YYYYMMDDHHmmss
    const match = pdfDate.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
    if (match) {
      const [, year, month, day, hour = '00', min = '00', sec = '00'] = match;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(min),
        parseInt(sec)
      );
    }
  } catch {
    // Ignore parse errors
  }
  return undefined;
}

/**
 * Validate that a buffer is a valid PDF
 */
export function isValidPDF(buffer: Buffer): boolean {
  // PDF files start with "%PDF-"
  const header = buffer.slice(0, 5).toString('ascii');
  return header === '%PDF-';
}

/**
 * Get approximate size limits for processing
 */
export const PDF_LIMITS = {
  maxFileSizeMB: 10,
  maxPages: 50,
  maxCharsPerRequest: 100000, // Claude context limit consideration
} as const;

/**
 * Check if PDF is within processing limits
 */
export function checkPDFLimits(buffer: Buffer, pageCount?: number): {
  valid: boolean;
  error?: string;
} {
  const sizeMB = buffer.length / (1024 * 1024);

  if (sizeMB > PDF_LIMITS.maxFileSizeMB) {
    return {
      valid: false,
      error: `PDF is too large (${sizeMB.toFixed(1)}MB). Maximum size is ${PDF_LIMITS.maxFileSizeMB}MB.`,
    };
  }

  if (pageCount && pageCount > PDF_LIMITS.maxPages) {
    return {
      valid: false,
      error: `PDF has too many pages (${pageCount}). Maximum is ${PDF_LIMITS.maxPages} pages.`,
    };
  }

  return { valid: true };
}
