// OCR extraction for scanned PDFs using Tesseract.js and PDF.js
// Converts PDF pages to images, then runs OCR on each page

import { createCanvas } from 'canvas';
import Tesseract from 'tesseract.js';

// Dynamic import for pdfjs-dist to handle ESM module
import { createRequire } from 'module';
import path from 'path';

let pdfjsLib: typeof import('pdfjs-dist/legacy/build/pdf.mjs');

async function getPdfJs() {
  if (!pdfjsLib) {
    // Use legacy build for better Node.js compatibility
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Set worker source using absolute path
    const require = createRequire(import.meta.url);
    const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
  }
  return pdfjsLib;
}

interface OCRResult {
  text: string;
  pageCount: number;
  pages: string[];
  confidence: number;
}

/**
 * Extract text from a PDF using OCR
 * @param pdfBuffer - The PDF file as a Buffer
 * @param options - OCR options
 * @returns Extracted text and metadata
 */
export async function extractTextWithOCR(
  pdfBuffer: Buffer,
  options: {
    language?: string;
    scale?: number;
    onProgress?: (page: number, total: number) => void;
  } = {}
): Promise<OCRResult> {
  const { language = 'eng', scale = 2.0, onProgress } = options;

  // Get pdfjs-dist dynamically
  const pdfjs = await getPdfJs();

  // Load PDF document with worker disabled for Node.js
  const pdfData = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjs.getDocument({
    data: pdfData,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pages: string[] = [];
  let totalConfidence = 0;

  // Create a single Tesseract worker for efficiency
  const worker = await Tesseract.createWorker(language);

  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, numPages);
      }

      // Get the page
      const page = await pdf.getPage(pageNum);

      // Get viewport at specified scale
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // Render page to canvas
      await page.render({
        canvasContext: context as any,
        viewport,
      }).promise;

      // Convert canvas to PNG buffer
      const imageBuffer = canvas.toBuffer('image/png');

      // Run OCR on the image
      const { data } = await worker.recognize(imageBuffer);

      pages.push(data.text);
      totalConfidence += data.confidence;

      // Clean up page resources
      page.cleanup();
    }
  } finally {
    // Terminate worker
    await worker.terminate();
  }

  const fullText = pages.join('\n\n');
  const avgConfidence = totalConfidence / numPages;

  return {
    text: fullText,
    pageCount: numPages,
    pages,
    confidence: avgConfidence,
  };
}

/**
 * Check if PDF text extraction yielded meaningful content
 * @param text - Extracted text
 * @returns true if text appears to be meaningful (not just watermarks)
 */
export function hasMinimalContent(text: string): boolean {
  if (!text) return false;

  // Remove common watermarks and noise
  const cleanText = text
    .replace(/www\.\w+\.(com|org|net)/gi, '')
    .replace(/KiasuExamPaper/gi, '')
    .replace(/\d+/g, '') // Remove standalone numbers
    .replace(/\s+/g, ' ')
    .trim();

  // Check if there's meaningful content (at least 100 chars of actual text)
  return cleanText.length > 100;
}
