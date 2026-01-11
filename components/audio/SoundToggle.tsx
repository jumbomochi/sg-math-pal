'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from './SoundProvider';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SoundToggle({ className, size = 'md' }: SoundToggleProps) {
  const { isMuted, toggleMute, playSound } = useSound();

  const handleClick = () => {
    toggleMute();
    // Play a click sound when unmuting
    if (isMuted) {
      // Will be unmuted after toggleMute, so play sound
      setTimeout(() => playSound('click'), 50);
    }
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const buttonSize = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }[size];

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-lg transition-colors',
        'bg-white/5 hover:bg-white/10 border border-white/10',
        buttonSize,
        className
      )}
      title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {isMuted ? (
        <VolumeX className={cn(iconSize, 'text-gray-400')} />
      ) : (
        <Volume2 className={cn(iconSize, 'text-nebula-purple')} />
      )}
    </button>
  );
}
