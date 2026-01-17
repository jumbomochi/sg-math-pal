// Claude AI integration for extracting math questions from PDF text
// Uses Anthropic SDK to process and structure questions

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  ExtractedQuestion,
  ClaudeExtractionResponse,
  TopicSlug,
  Tier,
  ImportMetadata,
} from './import-types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for question extraction
const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting math questions from Singapore Primary School exam papers. Your task is to parse the provided text and identify individual math questions.

For each question found, extract:
1. **Question text** - The complete question, converting mathematical expressions to LaTeX notation
2. **Answer** - The expected correct answer
3. **Topic** - One of: geometry, fractions, number-patterns, whole-numbers, decimals, word-problems
4. **Tier** - Difficulty level 1-5 based on Singapore math curriculum

## Topic Classification Guide:
- **geometry**: Area, perimeter, angles, shapes, symmetry, spatial reasoning
- **fractions**: Fraction operations, mixed numbers, equivalent fractions, fraction word problems
- **number-patterns**: Sequences, patterns, algebraic thinking, finding rules
- **whole-numbers**: Basic operations, place value, factors, multiples, prime numbers
- **decimals**: Decimal operations, conversion, rounding, decimal word problems
- **word-problems**: Multi-step problems, speed-distance-time, ratio, percentage (if not fitting above)

## Tier Assignment Guide (Singapore Primary Math):
IMPORTANT: Be strict with tier assignment. Most school exam questions are Tier 1-2.

- **Tier 1 (Iron)**: Basic computation, direct application, standard word problems (1-2 steps)
  - Example: "Calculate 3/4 + 1/2"
  - Example: "Mary has 15 apples. She gives 3 to John. How many does she have left?"
  - Example: "Find the area of a rectangle 5cm by 8cm"
  - Most Section A and simple Section B questions belong here

- **Tier 2 (Bronze)**: Singapore heuristics required (model method, work backwards, gap & difference, before-after)
  - Example: "After giving away 2/5 of his marbles, Ali had 36 left. How many did he have at first?"
  - Example: "John has twice as many stickers as Mary. Together they have 45 stickers."
  - Requires drawing bar models or working backwards

- **Tier 3 (Silver)**: Multi-step heuristics, non-routine problems, challenging school paper questions
  - Example: "The ratio of boys to girls was 3:5. After 12 boys left, the ratio became 1:3..."
  - Combines multiple concepts or requires creative problem-solving
  - SASMO qualifying round level

- **Tier 4 (Gold)**: Competition-level challenging questions (NMOS, SASMO finals level)
  - Requires advanced heuristics or unusual approaches
  - Multi-concept problems with tricky conditions
  - Would challenge most P4-P5 students even with guidance

- **Tier 5 (Platinum)**: Olympiad level only (SMO Junior, RIPMWC)
  - Proof-based problems or exceptional difficulty
  - Rarely found in regular school papers
  - Only assign if question would appear in actual olympiad

## LaTeX Formatting:
- Fractions: \\frac{numerator}{denominator}
- Multiplication: \\times
- Division: \\div
- Inline math: $expression$
- Block math: $$expression$$

## Output Format:
Return valid JSON with this structure:
{
  "questions": [
    {
      "questionNumber": <number or null>,
      "title": "<short descriptive title, 3-8 words>",
      "content": "<full question text with $LaTeX$ formatting>",
      "answer": "<the answer>",
      "answerType": "exact" | "numeric" | "multiple-choice",
      "acceptedAnswers": ["<alternative>", "<answers>"],
      "topic": "<topic-slug>",
      "tier": <1-5>,
      "hints": ["<hint 1>", "<hint 2>", "<hint 3>"],
      "solution": "<step by step solution>",
      "heuristic": "<problem-solving approach if applicable>",
      "confidence": <0.0-1.0>,
      "reasoning": "<why you chose this topic and tier>"
    }
  ],
  "metadata": {
    "totalQuestionsFound": <number>,
    "paperType": "exam" | "worksheet" | "practice",
    "estimatedGradeLevel": "P3" | "P4" | "P5" | "P6" | null
  }
}

Be thorough but precise. Only extract actual math questions, not instructions or headers.
If a question is unclear or incomplete, set confidence to a lower value and note in reasoning.`;

/**
 * Extract questions from PDF text using Claude AI
 */
export async function extractQuestionsWithAI(
  pdfText: string,
  metadata: Partial<ImportMetadata> = {}
): Promise<{
  questions: ExtractedQuestion[];
  metadata: ImportMetadata;
}> {
  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  // Split text into chunks if too long (Claude has context limits)
  const chunks = splitIntoChunks(pdfText);
  const allQuestions: ExtractedQuestion[] = [];
  let globalMetadata: ImportMetadata = {
    filename: metadata.filename || 'unknown.pdf',
    source: metadata.source,
    year: metadata.year,
    defaultTier: metadata.defaultTier,
  };

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkContext =
      chunks.length > 1
        ? `\n\n[Processing section ${i + 1} of ${chunks.length}]`
        : '';

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Extract all math questions from this exam paper text:${chunkContext}\n\n---\n\n${chunk}`,
          },
        ],
      });

      // Parse Claude's response
      const content = response.content[0];
      if (content.type !== 'text') {
        console.warn('Unexpected response type from Claude:', content.type);
        continue;
      }

      const parsed = parseClaudeResponse(content.text);

      // Convert to ExtractedQuestion format
      const questions = parsed.questions.map((q, index) => ({
        tempId: `q-${Date.now()}-${i}-${index}`,
        topicSlug: q.topic as TopicSlug,
        tier: q.tier as Tier,
        title: q.title,
        content: q.content,
        answer: q.answer,
        answerType: q.answerType,
        acceptedAnswers: q.acceptedAnswers,
        hints: q.hints,
        solution: q.solution,
        heuristic: q.heuristic,
        sourceQuestion: q.questionNumber ?? undefined,
        confidence: q.confidence,
        needsReview: q.confidence < 0.7,
        reasoning: q.reasoning,
      }));

      allQuestions.push(...questions);

      // Update metadata from first successful extraction
      if (i === 0 && parsed.metadata) {
        globalMetadata = {
          ...globalMetadata,
          paperType: parsed.metadata.paperType,
          estimatedGradeLevel: parsed.metadata.estimatedGradeLevel,
        };
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      // Continue with other chunks
    }
  }

  // Deduplicate questions (in case of overlapping chunks)
  const uniqueQuestions = deduplicateQuestions(allQuestions);

  return {
    questions: uniqueQuestions,
    metadata: {
      ...globalMetadata,
      totalPages: chunks.length,
    },
  };
}

/**
 * Split text into manageable chunks for Claude
 */
function splitIntoChunks(text: string, maxCharsPerChunk = 15000): string[] {
  if (text.length <= maxCharsPerChunk) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxCharsPerChunk) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // If single paragraph is too long, split by sentences
      if (paragraph.length > maxCharsPerChunk) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        currentChunk = '';
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxCharsPerChunk) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Attempt to repair truncated JSON by closing unclosed brackets
 */
function repairTruncatedJson(jsonStr: string): string {
  // Find complete question objects in the array
  // Look for complete objects: { ... "tier": N ... }
  const questionsMatch = jsonStr.match(/"questions"\s*:\s*\[/);
  if (!questionsMatch) return jsonStr;

  const startIdx = questionsMatch.index! + questionsMatch[0].length;
  let depth = 1; // We're inside the array
  let lastCompleteObject = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 1) {
        // Completed an object inside the questions array
        lastCompleteObject = i;
      }
    }
    if (char === '[') depth++;
    if (char === ']') depth--;
  }

  if (lastCompleteObject > 0 && lastCompleteObject < jsonStr.length - 1) {
    // Truncate to last complete object and close the structure
    console.log(`Repairing truncated JSON at position ${lastCompleteObject}`);
    return jsonStr.slice(0, lastCompleteObject + 1) + ']}';
  }

  return jsonStr;
}

/**
 * Parse Claude's JSON response with error handling
 */
function parseClaudeResponse(responseText: string): ClaudeExtractionResponse {
  // Try to extract JSON from the response
  let jsonStr = responseText;

  // Handle markdown code blocks
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Try to find JSON object
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response: missing questions array');
    }

    return {
      questions: parsed.questions.map(validateQuestion),
      metadata: parsed.metadata || { totalQuestionsFound: parsed.questions.length },
    };
  } catch (error) {
    // Try to repair truncated JSON
    console.log('Initial parse failed, attempting to repair truncated JSON...');
    const repairedJson = repairTruncatedJson(jsonStr);

    try {
      const parsed = JSON.parse(repairedJson);

      if (parsed.questions && Array.isArray(parsed.questions)) {
        console.log(`Repaired JSON successfully, found ${parsed.questions.length} questions`);
        return {
          questions: parsed.questions.map(validateQuestion),
          metadata: { totalQuestionsFound: parsed.questions.length },
        };
      }
    } catch {
      // Repair also failed
    }

    console.error('Failed to parse Claude response:', error);
    console.error('Response text:', responseText.slice(0, 500));

    // Return empty result on parse failure
    return {
      questions: [],
      metadata: { totalQuestionsFound: 0 },
    };
  }
}

/**
 * Validate and normalize a question object
 */
function validateQuestion(q: Record<string, unknown>): ClaudeExtractionResponse['questions'][0] {
  const validTopics: TopicSlug[] = [
    'geometry',
    'fractions',
    'number-patterns',
    'whole-numbers',
    'decimals',
    'word-problems',
  ];

  const topic = validTopics.includes(q.topic as TopicSlug)
    ? (q.topic as TopicSlug)
    : 'word-problems';

  const tier = typeof q.tier === 'number' && q.tier >= 1 && q.tier <= 5
    ? (q.tier as Tier)
    : 2;

  return {
    questionNumber: typeof q.questionNumber === 'number' ? q.questionNumber : null,
    title: String(q.title || 'Untitled Question'),
    content: String(q.content || ''),
    answer: String(q.answer || ''),
    answerType: ['exact', 'numeric', 'multiple-choice'].includes(q.answerType as string)
      ? (q.answerType as 'exact' | 'numeric' | 'multiple-choice')
      : 'exact',
    acceptedAnswers: Array.isArray(q.acceptedAnswers)
      ? q.acceptedAnswers.map(String)
      : undefined,
    topic,
    tier,
    hints: Array.isArray(q.hints) ? q.hints.map(String).slice(0, 3) : undefined,
    solution: typeof q.solution === 'string' ? q.solution : undefined,
    heuristic: typeof q.heuristic === 'string' ? q.heuristic : undefined,
    confidence: typeof q.confidence === 'number' ? Math.max(0, Math.min(1, q.confidence)) : 0.5,
    reasoning: typeof q.reasoning === 'string' ? q.reasoning : '',
  };
}

/**
 * Remove duplicate questions based on content similarity
 */
function deduplicateQuestions(questions: ExtractedQuestion[]): ExtractedQuestion[] {
  const seen = new Set<string>();
  const unique: ExtractedQuestion[] = [];

  for (const q of questions) {
    // Create a normalized key for comparison
    const key = normalizeForComparison(q.content + q.answer);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }

  return unique;
}

/**
 * Normalize text for duplicate comparison
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}
