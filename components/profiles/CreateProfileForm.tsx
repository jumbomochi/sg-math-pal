'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

const AVATARS = ['rocket', 'star', 'zap', 'brain', 'sparkles', 'trophy', 'target', 'flame'];
const COLORS = [
  '#7c3aed', // Purple
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f97316', // Orange
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#06b6d4', // Cyan
  '#f43f5e', // Red
];

interface CreateProfileFormProps {
  onSubmit: (name: string, avatar: string, color: string) => void;
  onCancel: () => void;
}

export function CreateProfileForm({ onSubmit, onCancel }: CreateProfileFormProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('rocket');
  const [color, setColor] = useState('#7c3aed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), avatar, color);
    }
  };

  // Get the selected avatar icon
  const avatarIconName = avatar.charAt(0).toUpperCase() + avatar.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const SelectedAvatarIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[avatarIconName] || LucideIcons.User;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-space-card/70 backdrop-blur-sm border border-space-border rounded-2xl p-6"
    >
      <h2 className="text-xl font-bold text-white mb-6">Create New Profile</h2>

      {/* Avatar Preview */}
      <div className="flex justify-center mb-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: `${color}30` }}
        >
          <SelectedAvatarIcon className="w-12 h-12" style={{ color }} />
        </div>
      </div>

      {/* Name Input */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-nebula-purple/30 focus:border-nebula-purple/50"
          maxLength={20}
          required
        />
      </div>

      {/* Avatar Selection */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Avatar</label>
        <div className="grid grid-cols-4 gap-2">
          {AVATARS.map((av) => {
            const iconName = av.charAt(0).toUpperCase() + av.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[iconName] || LucideIcons.User;

            return (
              <button
                key={av}
                type="button"
                onClick={() => setAvatar(av)}
                className={cn(
                  'p-3 rounded-xl border transition-all',
                  avatar === av
                    ? 'border-nebula-purple bg-nebula-purple/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                )}
              >
                <Icon className="w-6 h-6 mx-auto" style={{ color: avatar === av ? color : '#9ca3af' }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Selection */}
      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-2">Theme Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-10 h-10 rounded-full border-2 transition-transform hover:scale-110',
                color === c ? 'border-white scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className={cn(
            'flex-1 px-6 py-3 rounded-xl font-semibold transition-all',
            name.trim()
              ? 'bg-nebula-purple hover:bg-nebula-purple/80 text-white'
              : 'bg-white/10 text-gray-500 cursor-not-allowed'
          )}
        >
          Create Profile
        </button>
      </div>
    </motion.form>
  );
}
