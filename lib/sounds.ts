// Sound Effects System using Howler.js
// Manages audio playback for gamification feedback

import { Howl } from 'howler';

// Sound configuration
const SOUND_CONFIG = {
  correct: { src: '/sounds/correct.mp3', volume: 0.5 },
  incorrect: { src: '/sounds/incorrect.mp3', volume: 0.3 },
  xpGain: { src: '/sounds/xp-gain.mp3', volume: 0.4 },
  levelUp: { src: '/sounds/level-up.mp3', volume: 0.7 },
  streak: { src: '/sounds/streak.mp3', volume: 0.5 },
  challengeStart: { src: '/sounds/challenge-start.mp3', volume: 0.6 },
  challengePass: { src: '/sounds/challenge-pass.mp3', volume: 0.7 },
  challengeFail: { src: '/sounds/challenge-fail.mp3', volume: 0.4 },
  badgeUnlock: { src: '/sounds/badge-unlock.mp3', volume: 0.6 },
  click: { src: '/sounds/click.mp3', volume: 0.2 },
};

export type SoundName = keyof typeof SOUND_CONFIG;

// Sound instances cache
const soundInstances: Partial<Record<SoundName, Howl>> = {};

// Global mute state
let isMuted = false;

// Initialize sound (lazy loading)
function getSound(name: SoundName): Howl | null {
  if (typeof window === 'undefined') return null;

  if (!soundInstances[name]) {
    const config = SOUND_CONFIG[name];
    try {
      soundInstances[name] = new Howl({
        src: [config.src],
        volume: config.volume,
        preload: true,
        onloaderror: () => {
          console.warn(`Sound "${name}" could not be loaded`);
        },
      });
    } catch {
      console.warn(`Failed to create sound "${name}"`);
      return null;
    }
  }

  return soundInstances[name] || null;
}

// Play a sound effect
export function playSound(name: SoundName): void {
  if (isMuted) return;

  const sound = getSound(name);
  if (sound) {
    sound.play();
  }
}

// Preload sounds for faster playback
export function preloadSounds(sounds: SoundName[] = ['correct', 'incorrect', 'click']): void {
  sounds.forEach(name => getSound(name));
}

// Mute/unmute all sounds
export function setMuted(muted: boolean): void {
  isMuted = muted;

  // Store preference
  if (typeof window !== 'undefined') {
    localStorage.setItem('soundMuted', muted ? 'true' : 'false');
  }
}

// Get current mute state
export function getMuted(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('soundMuted');
    if (stored !== null) {
      isMuted = stored === 'true';
    }
  }
  return isMuted;
}

// Set global volume (0-1)
export function setVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));

  Object.values(soundInstances).forEach(sound => {
    if (sound) {
      sound.volume(clampedVolume);
    }
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem('soundVolume', clampedVolume.toString());
  }
}

// Get stored volume preference
export function getVolume(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('soundVolume');
    if (stored !== null) {
      return parseFloat(stored);
    }
  }
  return 1;
}

// Cleanup sounds
export function unloadSounds(): void {
  Object.values(soundInstances).forEach(sound => {
    if (sound) {
      sound.unload();
    }
  });
}
