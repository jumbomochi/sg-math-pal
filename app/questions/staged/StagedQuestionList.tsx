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
