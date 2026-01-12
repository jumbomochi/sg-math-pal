'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  Edit2,
  Trash2,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MathText } from '@/components/math/MathDisplay';
import {
  ExtractedQuestion,
  TopicSlug,
  Tier,
  AnswerType,
} from '@/lib/import-types';

interface ExtractedQuestionCardProps {
  question: ExtractedQuestion;
  index: number;
  onUpdate: (tempId: string, updates: Partial<ExtractedQuestion>) => void;
  onDelete: (tempId: string) => void;
  isSelected: boolean;
  onToggleSelect: (tempId: string) => void;
}

const TOPICS: { value: TopicSlug; label: string }[] = [
  { value: 'geometry', label: 'Geometry' },
  { value: 'fractions', label: 'Fractions' },
  { value: 'number-patterns', label: 'Number Patterns' },
  { value: 'whole-numbers', label: 'Whole Numbers' },
  { value: 'decimals', label: 'Decimals' },
  { value: 'word-problems', label: 'Word Problems' },
];

const TIERS: { value: Tier; label: string; color: string }[] = [
  { value: 1, label: 'Tier 1 - Iron', color: '#71717a' },
  { value: 2, label: 'Tier 2 - Bronze', color: '#cd7f32' },
  { value: 3, label: 'Tier 3 - Silver', color: '#c0c0c0' },
  { value: 4, label: 'Tier 4 - Gold', color: '#ffd700' },
  { value: 5, label: 'Tier 5 - Platinum', color: '#e5e4e2' },
];

const ANSWER_TYPES: { value: AnswerType; label: string }[] = [
  { value: 'exact', label: 'Exact Match' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'multiple-choice', label: 'Multiple Choice' },
];

export function ExtractedQuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  isSelected,
  onToggleSelect,
}: ExtractedQuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(question.needsReview);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(question.content);
  const [editedAnswer, setEditedAnswer] = useState(question.answer);
  const [editedTitle, setEditedTitle] = useState(question.title);

  const confidenceColor =
    question.confidence >= 0.8
      ? 'text-green-400'
      : question.confidence >= 0.5
        ? 'text-yellow-400'
        : 'text-red-400';

  const tierInfo = TIERS.find((t) => t.value === question.tier);

  const handleSaveEdit = () => {
    onUpdate(question.tempId, {
      content: editedContent,
      answer: editedAnswer,
      title: editedTitle,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(question.content);
    setEditedAnswer(question.answer);
    setEditedTitle(question.title);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-xl border-2 overflow-hidden transition-all',
        isSelected
          ? 'border-nebula-purple bg-nebula-purple/5'
          : 'border-space-border bg-white/5',
        question.needsReview && 'border-yellow-500/50'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(question.tempId);
          }}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-nebula-purple border-nebula-purple'
              : 'border-gray-500 hover:border-nebula-purple'
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Question number */}
        <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center text-sm font-bold text-nebula-purple">
          {index + 1}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{question.title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span>{TOPICS.find((t) => t.value === question.topicSlug)?.label}</span>
            <span className="w-1 h-1 rounded-full bg-gray-500" />
            <span style={{ color: tierInfo?.color }}>{tierInfo?.label}</span>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-2">
          {question.needsReview && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              Review
            </div>
          )}
          <div className={cn('text-xs font-medium', confidenceColor)}>
            {Math.round(question.confidence * 100)}%
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-space-border"
        >
          <div className="p-4 space-y-4">
            {/* Question content */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Question
              </label>
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-nebula-purple/30 min-h-[120px] font-mono text-sm"
                />
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <MathText>{question.content}</MathText>
                </div>
              )}
            </div>

            {/* Answer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Answer
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-nebula-purple/30"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
                    {question.answer}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Answer Type
                </label>
                <select
                  value={question.answerType}
                  onChange={(e) =>
                    onUpdate(question.tempId, {
                      answerType: e.target.value as AnswerType,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-nebula-purple/30"
                >
                  {ANSWER_TYPES.map((at) => (
                    <option key={at.value} value={at.value} className="bg-space-bg">
                      {at.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topic and Tier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Topic
                </label>
                <select
                  value={question.topicSlug}
                  onChange={(e) =>
                    onUpdate(question.tempId, {
                      topicSlug: e.target.value as TopicSlug,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-nebula-purple/30"
                >
                  {TOPICS.map((t) => (
                    <option key={t.value} value={t.value} className="bg-space-bg">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tier
                </label>
                <select
                  value={question.tier}
                  onChange={(e) =>
                    onUpdate(question.tempId, {
                      tier: parseInt(e.target.value, 10) as Tier,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-nebula-purple/30"
                >
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value} className="bg-space-bg">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Reasoning */}
            {question.reasoning && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  AI Reasoning
                </label>
                <div className="p-3 rounded-xl bg-nebula-purple/10 border border-nebula-purple/20 text-sm text-gray-300">
                  {question.reasoning}
                </div>
              </div>
            )}

            {/* Hints preview */}
            {question.hints && question.hints.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Hints ({question.hints.length})
                </label>
                <div className="space-y-2">
                  {question.hints.map((hint, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-200"
                    >
                      {i + 1}. {hint}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Solution preview */}
            {question.solution && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Solution
                </label>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
                  <MathText>{question.solution}</MathText>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-space-border">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Content
                  </button>
                )}
              </div>

              <button
                onClick={() => onDelete(question.tempId)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
