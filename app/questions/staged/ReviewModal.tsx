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
            <MathDisplay math={content} />
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
