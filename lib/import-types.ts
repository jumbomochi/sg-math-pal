// Type definitions for PDF Question Import feature

export type ImportStatus = 'processing' | 'ready_for_review' | 'completed' | 'failed';

export type AnswerType = 'exact' | 'numeric' | 'multiple-choice';

export type TopicSlug =
  | 'geometry'
  | 'fractions'
  | 'number-patterns'
  | 'whole-numbers'
  | 'decimals'
  | 'word-problems';

export type Tier = 1 | 2 | 3 | 4 | 5;

export interface ExtractedQuestion {
  tempId: string;                    // Temporary ID for tracking during review
  topicSlug: TopicSlug;              // AI-suggested topic
  tier: Tier;                        // AI-suggested tier (1-5)
  title: string;                     // Short descriptive title
  content: string;                   // Question text with LaTeX
  answer: string;                    // Correct answer
  answerType: AnswerType;            // How to validate the answer
  acceptedAnswers?: string[];        // Alternative correct answers
  hints?: string[];                  // Progressive hints (max 3)
  solution?: string;                 // Full worked solution
  heuristic?: string;                // Problem-solving approach used
  sourceQuestion?: number;           // Original question number in PDF
  confidence: number;                // AI confidence score 0-1
  needsReview: boolean;              // Flag for low-confidence extractions
  reasoning?: string;                // AI's reasoning for topic/tier assignment
}

export interface ImportMetadata {
  filename: string;
  source?: string;                   // "nmos", "sasmo", "school", etc.
  year?: number;
  defaultTier?: Tier;
  totalPages?: number;
  estimatedGradeLevel?: string;      // "P3", "P4", "P5", "P6"
  paperType?: 'exam' | 'worksheet' | 'practice';
}

export interface ExtractedQuestionsResult {
  importId: string;
  questions: ExtractedQuestion[];
  metadata: ImportMetadata;
}

// API Request/Response types

export interface UploadRequest {
  file: File;
  source?: string;
  year?: number;
  defaultTier?: Tier;
}

export interface UploadResponse {
  success: boolean;
  importId: string;
  status: ImportStatus;
  message: string;
}

export interface StatusResponse {
  id: string;
  status: ImportStatus;
  progress?: number;                 // 0-100 percentage
  questionsFound?: number;
  errorMessage?: string;
}

export interface QuestionsResponse {
  importId: string;
  questions: ExtractedQuestion[];
  metadata: ImportMetadata;
}

export interface SaveRequest {
  importId: string;
  questions: ExtractedQuestion[];    // Reviewed/edited questions
}

export interface SaveResponse {
  success: boolean;
  saved: number;                     // Count of questions saved
  skipped: number;                   // Count of questions skipped
  importId: string;
  questionIds: string[];             // Created Question IDs
}

// Claude API response structure
export interface ClaudeExtractionResponse {
  questions: {
    questionNumber: number | null;
    title: string;
    content: string;
    answer: string;
    answerType: AnswerType;
    acceptedAnswers?: string[];
    topic: TopicSlug;
    tier: Tier;
    hints?: string[];
    solution?: string;
    heuristic?: string;
    confidence: number;
    reasoning: string;
  }[];
  metadata: {
    totalQuestionsFound: number;
    paperType?: 'exam' | 'worksheet' | 'practice';
    estimatedGradeLevel?: string;
  };
}

// Helper type for the review UI
export interface QuestionEditState extends ExtractedQuestion {
  isEditing: boolean;
  isSelected: boolean;               // For bulk operations
  hasChanges: boolean;               // Track if user modified it
}
