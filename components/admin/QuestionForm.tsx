'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, EyeOff } from 'lucide-react';
import { MathDisplay } from '@/components/math/MathDisplay';
import { getTierConfig } from '@/components/game/TierBadge';

interface Topic {
  id: string;
  name: string;
  color: string;
}

interface QuestionFormData {
  id?: string;
  title: string;
  content: string;
  answer: string;
  answerType: string;
  acceptedAnswers: string;
  hints: string;
  solution: string;
  tier: number;
  topicId: string;
  source: string;
  sourceYear: string;
  isChallengeQuestion: boolean;
}

interface QuestionFormProps {
  topics: Topic[];
  initialData?: QuestionFormData;
  mode: 'create' | 'edit';
}

const defaultFormData: QuestionFormData = {
  title: '',
  content: '',
  answer: '',
  answerType: 'exact',
  acceptedAnswers: '',
  hints: '',
  solution: '',
  tier: 1,
  topicId: '',
  source: '',
  sourceYear: '',
  isChallengeQuestion: false,
};

export function QuestionForm({ topics, initialData, mode }: QuestionFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<QuestionFormData>(initialData || defaultFormData);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === 'create' ? '/api/questions' : `/api/questions/${formData.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tier: parseInt(String(formData.tier)),
          sourceYear: formData.sourceYear ? parseInt(formData.sourceYear) : null,
          acceptedAnswers: formData.acceptedAnswers
            ? formData.acceptedAnswers.split('\n').filter(Boolean)
            : null,
          hints: formData.hints ? formData.hints.split('\n').filter(Boolean) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save question');
      }

      router.push('/questions');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tierConfig = getTierConfig(formData.tier as 1 | 2 | 3 | 4 | 5);
  const selectedTopic = topics.find((t) => t.id === formData.topicId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Rectangle Area Calculation"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Topic *</label>
            <select
              name="topicId"
              value={formData.topicId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-nebula-purple/50"
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tier */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tier *</label>
            <select
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-nebula-purple/50"
            >
              <option value={1}>Tier 1 - Iron (Fluency)</option>
              <option value={2}>Tier 2 - Bronze (Application)</option>
              <option value={3}>Tier 3 - Silver (Heuristic)</option>
              <option value={4}>Tier 4 - Gold (Challenge)</option>
              <option value={5}>Tier 5 - Platinum (Olympiad)</option>
            </select>
            <p className="text-xs mt-1" style={{ color: tierConfig.color }}>
              {tierConfig.name} tier questions
            </p>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source</label>
            <input
              type="text"
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="e.g., NMOS, SASMO, school"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50"
            />
          </div>

          {/* Source Year */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source Year</label>
            <input
              type="number"
              name="sourceYear"
              value={formData.sourceYear}
              onChange={handleChange}
              placeholder="e.g., 2024"
              min="2000"
              max="2030"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50"
            />
          </div>

          {/* Challenge Question */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isChallengeQuestion"
                checked={formData.isChallengeQuestion}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-white/5 border border-white/10 text-nebula-purple focus:ring-nebula-purple/50"
              />
              <span className="text-white">
                Use as tier promotion challenge question
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-8 mt-1">
              Challenge questions are used when students attempt to advance to the next tier
            </p>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Question Content</h2>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        <div className={showPreview ? 'grid md:grid-cols-2 gap-4' : ''}>
          {/* Content Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Question Text * (supports LaTeX with $...$)
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={6}
              placeholder="e.g., Find the area of a rectangle with length $12$ cm and width $8$ cm."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50 font-mono text-sm"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preview</label>
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-h-[150px]">
                {formData.content ? (
                  <MathDisplay math={formData.content} />
                ) : (
                  <span className="text-gray-500">Enter question text to preview</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer */}
      <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Answer</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Answer */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Correct Answer *</label>
            <input
              type="text"
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              required
              placeholder="e.g., 96"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50"
            />
          </div>

          {/* Answer Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Answer Type</label>
            <select
              name="answerType"
              value={formData.answerType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-nebula-purple/50"
            >
              <option value="exact">Exact Match</option>
              <option value="numeric">Numeric (with tolerance)</option>
              <option value="multiple-choice">Multiple Choice</option>
            </select>
          </div>

          {/* Accepted Answers */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">
              Alternative Accepted Answers (one per line)
            </label>
            <textarea
              name="acceptedAnswers"
              value={formData.acceptedAnswers}
              onChange={handleChange}
              rows={2}
              placeholder="e.g., 96 sq cm&#10;96 cm²"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Hints & Solution */}
      <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Hints & Solution</h2>

        <div className="space-y-4">
          {/* Hints */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Progressive Hints (one per line, max 3)
            </label>
            <textarea
              name="hints"
              value={formData.hints}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., What formula do you use to find the area of a rectangle?&#10;Area = length × width&#10;Multiply 12 by 8"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50 font-mono text-sm"
            />
          </div>

          {/* Solution */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Full Solution (supports LaTeX)
            </label>
            <textarea
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              rows={4}
              placeholder="e.g., Area of rectangle = length × width = $12 \times 8 = 96$ cm²"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-nebula-purple/50 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-nebula-purple hover:bg-nebula-purple/80 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Question' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
