'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  playSound as playSoundLib,
  preloadSounds,
  setMuted,
  getMuted,
  SoundName,
} from '@/lib/sounds';

interface SoundContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [isMuted, setIsMuted] = useState(true); // Default muted until loaded

  // Load mute preference on mount
  useEffect(() => {
    setIsMuted(getMuted());
    // Initialize audio context
    preloadSounds();
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
  }, [isMuted]);

  const playSound = useCallback((name: SoundName) => {
    if (!isMuted) {
      playSoundLib(name);
    }
  }, [isMuted]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

// Optional hook that doesn't throw if outside provider
export function useSoundOptional() {
  return useContext(SoundContext);
}
