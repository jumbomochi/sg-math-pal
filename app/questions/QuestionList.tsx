'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { getTierConfig } from '@/components/game/TierBadge';
import { MathDisplay } from '@/components/math/MathDisplay';

interface Question {
  id: string;
  title: string;
  content: string;
  answer: string;
  tier: number;
  topicId: string;
  topicName: string;
  topicColor: string;
  source: string | null;
  sourceYear: number | null;
  isChallengeQuestion: boolean;
  createdAt: string;
}

interface Topic {
  id: string;
  name: string;
  color: string;
}

interface QuestionListProps {
  questions: Question[];
  topics: Topic[];
}

export function QuestionList({ questions, topics }: QuestionListProps) {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        search === '' ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.content.toLowerCase().includes(search.toLowerCase());

      const matchesTopic = selectedTopic === 'all' || q.topicId === selectedTopic;
      const matchesTier = selectedTier === 'all' || q.tier === parseInt(selectedTier);

      return matchesSearch && matchesTopic && matchesTier;
    });
  }, [questions, search, selectedTopic, selectedTier]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to show updated list
        window.location.reload();
      } else {
        alert('Failed to delete question');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete question');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-nebula-purple/50"
          />
        </div>

        {/* Topic Filter */}
        <div className="relative">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-nebula-purple/50 cursor-pointer"
          >
            <option value="all">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Tier Filter */}
        <div className="relative">
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-nebula-purple/50 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="1">Tier 1 - Iron</option>
            <option value="2">Tier 2 - Bronze</option>
            <option value="3">Tier 3 - Silver</option>
            <option value="4">Tier 4 - Gold</option>
            <option value="5">Tier 5 - Platinum</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-400 mb-4">
        Showing {filteredQuestions.length} of {questions.length} questions
      </p>

      {/* Question List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-space-card/50 rounded-xl border border-space-border">
            <p className="text-gray-400">No questions found matching your filters.</p>
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const tierConfig = getTierConfig(question.tier as 1 | 2 | 3 | 4 | 5);
            const isExpanded = expandedId === question.id;

            return (
              <div
                key={question.id}
                className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl overflow-hidden"
              >
                {/* Question Header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : question.id)}
                >
                  {/* Tier Badge */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: `${tierConfig.color}20`,
                      color: tierConfig.color,
                    }}
                  >
                    T{question.tier}
                  </div>

                  {/* Title & Topic */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{question.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${question.topicColor}20`,
                          color: question.topicColor,
                        }}
                      >
                        {question.topicName}
                      </span>
                      {question.source && (
                        <span className="text-xs text-gray-500">
                          {question.source.toUpperCase()}
                          {question.sourceYear && ` ${question.sourceYear}`}
                        </span>
                      )}
                      {question.isChallengeQuestion && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-star-gold/20 text-star-gold">
                          Challenge
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/questions/${question.id}/edit`}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(question.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Question</p>
                        <div className="text-sm text-gray-300 bg-white/5 rounded-lg p-3">
                          <MathDisplay math={question.content} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Answer</p>
                        <div className="text-sm text-success-green bg-success-green/10 rounded-lg p-3 font-mono">
                          {question.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirm === question.id && (
                  <div className="px-4 pb-4 border-t border-red-500/20 pt-4 bg-red-500/5">
                    <p className="text-sm text-red-400 mb-3">
                      Are you sure you want to delete this question? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                        onClick={() => handleDelete(question.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
