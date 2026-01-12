'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { StatusResponse } from '@/lib/import-types';

interface ImportProgressProps {
  importId: string;
  onComplete: (questionsFound: number) => void;
  onError: (error: string) => void;
}

const PROGRESS_STEPS = [
  { id: 'upload', label: 'Uploading PDF', icon: FileSearch },
  { id: 'extract', label: 'Extracting text', icon: FileSearch },
  { id: 'analyze', label: 'Analyzing with AI', icon: Sparkles },
  { id: 'complete', label: 'Ready for review', icon: CheckCircle },
];

export function ImportProgress({
  importId,
  onComplete,
  onError,
}: ImportProgressProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 60; // 1 minute timeout

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/import/status/${importId}`);
        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data: StatusResponse = await response.json();
        setStatus(data);

        // Update step based on status
        if (data.status === 'processing') {
          // Animate through steps while processing
          setCurrentStep((prev) => Math.min(prev + 1, 2));
        } else if (data.status === 'ready_for_review') {
          setCurrentStep(3);
          clearInterval(interval);
          onComplete(data.questionsFound || 0);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          onError(data.errorMessage || 'Import failed');
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          onError('Import timed out. Please try again.');
        }
      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
        if (attempts >= 3) {
          clearInterval(interval);
          onError('Failed to check import status');
        }
      }
    };

    // Initial check
    checkStatus();

    // Poll every second
    interval = setInterval(checkStatus, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [importId, onComplete, onError]);

  return (
    <div className="space-y-8">
      {/* Animated rocket */}
      <div className="flex justify-center">
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-nebula-purple to-nebula-pink flex items-center justify-center shadow-lg shadow-nebula-purple/30">
            <Sparkles className="w-12 h-12 text-white" />
          </div>

          {/* Orbiting particles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-star-gold" />
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-2 rounded-full bg-nebula-blue" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-nebula-pink" />
          </motion.div>
        </motion.div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <motion.h2
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-white mb-2"
        >
          {PROGRESS_STEPS[currentStep]?.label || 'Processing...'}
        </motion.h2>
        <p className="text-muted-foreground">
          {currentStep < 3
            ? 'Please wait while we extract questions from your PDF...'
            : 'Extraction complete!'}
        </p>
      </div>

      {/* Progress steps */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-space-border">
            <motion.div
              className="h-full bg-gradient-to-r from-nebula-purple to-nebula-blue"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (PROGRESS_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step indicators */}
          <div className="relative flex justify-between">
            {PROGRESS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive ? '#7c3aed' : '#2a2a4a',
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCurrent ? 'ring-4 ring-nebula-purple/30' : ''
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-white' : 'text-gray-500'
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`mt-2 text-xs ${
                      isActive ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {step.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Questions found indicator */}
      {status?.questionsFound !== undefined && status.questionsFound > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              {status.questionsFound} question{status.questionsFound !== 1 ? 's' : ''} found
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
