'use client';

import { motion } from 'framer-motion';
import { CheckCircle, FileText, Star, ArrowRight, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveResponse, ImportMetadata } from '@/lib/import-types';
import Link from 'next/link';

interface ImportSummaryProps {
  result: SaveResponse;
  metadata: ImportMetadata;
  onImportAnother: () => void;
}

export function ImportSummary({
  result,
  metadata,
  onImportAnother,
}: ImportSummaryProps) {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
        className="flex justify-center"
      >
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <CheckCircle className="w-16 h-16 text-white" />
          </motion.div>

          {/* Celebration particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0],
                x: Math.cos((i * Math.PI) / 4) * 80,
                y: Math.sin((i * Math.PI) / 4) * 80,
              }}
              transition={{
                duration: 1,
                delay: 0.5 + i * 0.1,
                ease: 'easeOut',
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Star className="w-6 h-6 text-star-gold fill-star-gold" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          Import Complete!
        </h2>
        <p className="text-muted-foreground">
          Your questions have been added to the question bank.
        </p>
      </motion.div>

      {/* Stats card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-white/5 border border-white/10 p-6"
      >
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-nebula-purple/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-nebula-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{metadata.filename}</h3>
            <p className="text-sm text-gray-400">
              {metadata.source && `${metadata.source.toUpperCase()} `}
              {metadata.year && metadata.year}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-green-500/10">
            <div className="text-3xl font-bold text-green-400">
              {result.saved}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Questions Saved
            </div>
          </div>

          {result.skipped > 0 && (
            <div className="text-center p-4 rounded-xl bg-yellow-500/10">
              <div className="text-3xl font-bold text-yellow-400">
                {result.skipped}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Skipped
              </div>
            </div>
          )}

          {result.skipped === 0 && (
            <div className="text-center p-4 rounded-xl bg-nebula-purple/10">
              <div className="text-3xl font-bold text-nebula-purple">
                100%
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Success Rate
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <Link
          href="/questions"
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg transition-all',
            'bg-gradient-to-r from-nebula-purple to-nebula-blue',
            'hover:shadow-lg hover:shadow-nebula-purple/20'
          )}
        >
          View Question Bank
          <ArrowRight className="w-5 h-5" />
        </Link>

        <button
          onClick={onImportAnother}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-medium transition-all',
            'bg-white/5 hover:bg-white/10 border border-white/10'
          )}
        >
          <Upload className="w-5 h-5" />
          Import Another PDF
        </button>

        <Link
          href="/"
          className="block text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
        >
          Return to Dashboard
        </Link>
      </motion.div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-sm text-gray-500"
      >
        <span className="inline-flex items-center gap-1">
          <Star className="w-4 h-4 text-star-gold" />
          Tip: New questions are available immediately for practice!
        </span>
      </motion.div>
    </div>
  );
}
