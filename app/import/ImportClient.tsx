'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileUp, Loader2, CheckSquare, Save } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PDFUploader } from '@/components/import/PDFUploader';
import { ImportProgress } from '@/components/import/ImportProgress';
import { ExtractedQuestionCard } from '@/components/import/ExtractedQuestionCard';
import { ImportSummary } from '@/components/import/ImportSummary';
import {
  ExtractedQuestion,
  ImportMetadata,
  SaveResponse,
  Tier,
} from '@/lib/import-types';

type ImportStep = 'upload' | 'processing' | 'review' | 'complete';

const STEPS = [
  { id: 'upload', label: 'Upload', icon: FileUp },
  { id: 'processing', label: 'Processing', icon: Loader2 },
  { id: 'review', label: 'Review', icon: CheckSquare },
  { id: 'complete', label: 'Complete', icon: Save },
];

export function ImportClient() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [importId, setImportId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [metadata, setMetadata] = useState<ImportMetadata | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File, source?: string, year?: number, defaultTier?: Tier) => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (source) formData.append('source', source);
        if (year) formData.append('year', String(year));
        if (defaultTier) formData.append('defaultTier', String(defaultTier));

        const response = await fetch('/api/import/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }

        setImportId(data.importId);
        setStep('processing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const handleProcessingComplete = useCallback(
    async (questionsFound: number) => {
      if (!importId) return;

      try {
        // Fetch extracted questions
        const response = await fetch(`/api/import/status/${importId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_questions' }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();
        setQuestions(data.questions);
        setMetadata(data.metadata);
        setSelectedIds(new Set(data.questions.map((q: ExtractedQuestion) => q.tempId)));
        setStep('review');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
        setStep('upload');
      }
    },
    [importId]
  );

  const handleProcessingError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setStep('upload');
  }, []);

  const handleUpdateQuestion = useCallback(
    (tempId: string, updates: Partial<ExtractedQuestion>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.tempId === tempId ? { ...q, ...updates } : q))
      );
    },
    []
  );

  const handleDeleteQuestion = useCallback((tempId: string) => {
    setQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });
  }, []);

  const handleToggleSelect = useCallback((tempId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tempId)) {
        newSet.delete(tempId);
      } else {
        newSet.add(tempId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(questions.map((q) => q.tempId)));
  }, [questions]);

  const handleSelectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSave = useCallback(async () => {
    if (!importId) return;

    const selectedQuestions = questions.filter((q) => selectedIds.has(q.tempId));
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question to save');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          questions: selectedQuestions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Save failed');
      }

      setSaveResult(data);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [importId, questions, selectedIds]);

  const handleImportAnother = useCallback(() => {
    setStep('upload');
    setImportId(null);
    setQuestions([]);
    setMetadata(null);
    setSelectedIds(new Set());
    setSaveResult(null);
    setError(null);
  }, []);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-space-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-space-bg/80 backdrop-blur-md border-b border-space-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <h1 className="text-xl font-bold text-white">
                Import Questions from PDF
              </h1>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = s.id === step;

              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all',
                      isCurrent && 'bg-nebula-purple/20',
                      isActive ? 'text-white' : 'text-gray-500'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        s.id === 'processing' && step === 'processing' && 'animate-spin'
                      )}
                    />
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-8 h-0.5 mx-2',
                        index < currentStepIndex ? 'bg-nebula-purple' : 'bg-space-border'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Upload a PDF with Math Questions
                </h2>
                <p className="text-muted-foreground">
                  Our AI will extract questions, classify topics, and assign difficulty tiers.
                </p>
              </div>

              <PDFUploader onUpload={handleUpload} isUploading={isUploading} />
            </motion.div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && importId && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <ImportProgress
                importId={importId}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Review header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Review Extracted Questions
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedIds.size} of {questions.length} selected for import
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={handleSelectAll}
                      className="text-nebula-purple hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-500">|</span>
                    <button
                      onClick={handleSelectNone}
                      className="text-gray-400 hover:underline"
                    >
                      Select None
                    </button>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isSaving || selectedIds.size === 0}
                    className={cn(
                      'flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all',
                      'bg-gradient-to-r from-nebula-purple to-nebula-blue',
                      'hover:shadow-lg hover:shadow-nebula-purple/20',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save {selectedIds.size} Questions
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <ExtractedQuestionCard
                    key={question.tempId}
                    question={question}
                    index={index}
                    onUpdate={handleUpdateQuestion}
                    onDelete={handleDeleteQuestion}
                    isSelected={selectedIds.has(question.tempId)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>

              {/* Bottom action bar */}
              {questions.length > 3 && (
                <div className="sticky bottom-0 left-0 right-0 mt-6 p-4 bg-space-bg/90 backdrop-blur-md border-t border-space-border">
                  <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <p className="text-sm text-gray-400">
                      {selectedIds.size} of {questions.length} questions selected
                    </p>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || selectedIds.size === 0}
                      className={cn(
                        'flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all',
                        'bg-gradient-to-r from-nebula-purple to-nebula-blue',
                        'hover:shadow-lg hover:shadow-nebula-purple/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Selected Questions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && saveResult && metadata && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ImportSummary
                result={saveResult}
                metadata={metadata}
                onImportAnother={handleImportAnother}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
