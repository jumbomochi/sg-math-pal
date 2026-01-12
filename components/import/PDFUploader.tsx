'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tier } from '@/lib/import-types';

interface PDFUploaderProps {
  onUpload: (file: File, source?: string, year?: number, defaultTier?: Tier) => void;
  isUploading: boolean;
}

const SOURCES = [
  { value: '', label: 'Select source (optional)' },
  { value: 'nmos', label: 'NMOS' },
  { value: 'sasmo', label: 'SASMO' },
  { value: 'amc8', label: 'AMC 8' },
  { value: 'school', label: 'School Paper' },
  { value: 'textbook', label: 'Textbook' },
  { value: 'other', label: 'Other' },
];

const TIERS = [
  { value: 0, label: 'Auto-detect tier' },
  { value: 1, label: 'Tier 1 - Iron (Basic)' },
  { value: 2, label: 'Tier 2 - Bronze (Standard)' },
  { value: 3, label: 'Tier 3 - Silver (Heuristic)' },
  { value: 4, label: 'Tier 4 - Gold (Challenge)' },
  { value: 5, label: 'Tier 5 - Platinum (Olympiad)' },
];

export function PDFUploader({ onUpload, isUploading }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [source, setSource] = useState('');
  const [year, setYear] = useState('');
  const [defaultTier, setDefaultTier] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return false;
    }

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleSubmit = () => {
    if (!selectedFile) return;

    const yearNum = year ? parseInt(year, 10) : undefined;
    const tier = defaultTier > 0 ? (defaultTier as Tier) : undefined;

    onUpload(selectedFile, source || undefined, yearNum, tier);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200',
          isDragging
            ? 'border-nebula-purple bg-nebula-purple/10'
            : 'border-space-border hover:border-nebula-purple/50',
          selectedFile && 'border-green-500/50 bg-green-500/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center text-center">
          {selectedFile ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-lg font-medium text-white mb-1">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                onClick={handleRemoveFile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 transition-colors"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
                Remove file
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-nebula-purple/20 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-nebula-purple" />
              </div>
              <p className="text-lg font-medium text-white mb-1">
                Drop your PDF here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse (max 10MB)
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Metadata fields */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-nebula-purple/30 focus:border-nebula-purple/50"
              disabled={isUploading}
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value} className="bg-space-bg">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2024"
              min="2000"
              max="2030"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-nebula-purple/30 focus:border-nebula-purple/50"
              disabled={isUploading}
            />
          </div>

          {/* Default Tier */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Default Tier
            </label>
            <select
              value={defaultTier}
              onChange={(e) => setDefaultTier(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-nebula-purple/30 focus:border-nebula-purple/50"
              disabled={isUploading}
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value} className="bg-space-bg">
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      {/* Submit button */}
      {selectedFile && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSubmit}
          disabled={isUploading}
          className={cn(
            'w-full py-4 rounded-xl font-bold text-lg transition-all',
            'bg-gradient-to-r from-nebula-purple to-nebula-blue',
            'hover:shadow-lg hover:shadow-nebula-purple/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Processing...
            </span>
          ) : (
            'Extract Questions'
          )}
        </motion.button>
      )}
    </div>
  );
}
