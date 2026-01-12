// Sound Effects System using Web Audio API
// Generates sounds programmatically - no external files needed

export type SoundName =
  | 'correct'
  | 'incorrect'
  | 'xpGain'
  | 'levelUp'
  | 'streak'
  | 'challengeStart'
  | 'challengePass'
  | 'challengeFail'
  | 'badgeUnlock'
  | 'click';

// Audio context singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      console.warn('Web Audio API not supported');
      return null;
    }
  }

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

// Global mute state
let isMuted = false;
let globalVolume = 1;

// Sound definitions using synthesis parameters
interface SoundDef {
  type: OscillatorType;
  frequency: number;
  duration: number;
  volume: number;
  notes?: { freq: number; time: number; duration: number }[];
  fadeOut?: boolean;
}

const SOUND_DEFS: Record<SoundName, SoundDef> = {
  // Correct answer - happy ascending tone
  correct: {
    type: 'sine',
    frequency: 523.25, // C5
    duration: 0.15,
    volume: 0.3,
    notes: [
      { freq: 523.25, time: 0, duration: 0.1 },      // C5
      { freq: 659.25, time: 0.1, duration: 0.15 },   // E5
    ],
  },

  // Incorrect answer - soft low tone
  incorrect: {
    type: 'sine',
    frequency: 220,
    duration: 0.3,
    volume: 0.2,
    fadeOut: true,
  },

  // XP gain - quick sparkle
  xpGain: {
    type: 'sine',
    frequency: 880,
    duration: 0.1,
    volume: 0.2,
    notes: [
      { freq: 880, time: 0, duration: 0.05 },
      { freq: 1108.73, time: 0.05, duration: 0.08 },
    ],
  },

  // Level up - triumphant arpeggio
  levelUp: {
    type: 'sine',
    frequency: 523.25,
    duration: 0.6,
    volume: 0.4,
    notes: [
      { freq: 523.25, time: 0, duration: 0.15 },     // C5
      { freq: 659.25, time: 0.15, duration: 0.15 },  // E5
      { freq: 783.99, time: 0.3, duration: 0.15 },   // G5
      { freq: 1046.5, time: 0.45, duration: 0.25 },  // C6
    ],
  },

  // Streak - rising excitement
  streak: {
    type: 'sine',
    frequency: 440,
    duration: 0.3,
    volume: 0.3,
    notes: [
      { freq: 440, time: 0, duration: 0.1 },
      { freq: 554.37, time: 0.1, duration: 0.1 },
      { freq: 659.25, time: 0.2, duration: 0.15 },
    ],
  },

  // Challenge start - dramatic
  challengeStart: {
    type: 'sine',
    frequency: 329.63,
    duration: 0.5,
    volume: 0.4,
    notes: [
      { freq: 329.63, time: 0, duration: 0.2 },     // E4
      { freq: 392, time: 0.15, duration: 0.2 },    // G4
      { freq: 493.88, time: 0.3, duration: 0.25 }, // B4
    ],
  },

  // Challenge pass - victory fanfare
  challengePass: {
    type: 'sine',
    frequency: 523.25,
    duration: 0.8,
    volume: 0.5,
    notes: [
      { freq: 523.25, time: 0, duration: 0.15 },    // C5
      { freq: 659.25, time: 0.12, duration: 0.15 }, // E5
      { freq: 783.99, time: 0.24, duration: 0.15 }, // G5
      { freq: 1046.5, time: 0.36, duration: 0.4 },  // C6 (held)
    ],
  },

  // Challenge fail - sympathetic descend
  challengeFail: {
    type: 'sine',
    frequency: 392,
    duration: 0.5,
    volume: 0.25,
    notes: [
      { freq: 392, time: 0, duration: 0.2 },       // G4
      { freq: 349.23, time: 0.15, duration: 0.2 }, // F4
      { freq: 293.66, time: 0.3, duration: 0.25 }, // D4
    ],
    fadeOut: true,
  },

  // Badge unlock - magical chime
  badgeUnlock: {
    type: 'sine',
    frequency: 783.99,
    duration: 0.6,
    volume: 0.4,
    notes: [
      { freq: 783.99, time: 0, duration: 0.15 },   // G5
      { freq: 987.77, time: 0.1, duration: 0.15 }, // B5
      { freq: 1174.66, time: 0.2, duration: 0.15 },// D6
      { freq: 1567.98, time: 0.35, duration: 0.3 },// G6
    ],
  },

  // Click - subtle tap
  click: {
    type: 'sine',
    frequency: 1000,
    duration: 0.05,
    volume: 0.1,
  },
};

// Play a synthesized sound
function playSynthSound(def: SoundDef): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const volume = def.volume * globalVolume;

  if (def.notes && def.notes.length > 0) {
    // Play multiple notes
    def.notes.forEach(note => {
      playNote(ctx, note.freq, now + note.time, note.duration, volume, def.type, def.fadeOut);
    });
  } else {
    // Play single note
    playNote(ctx, def.frequency, now, def.duration, volume, def.type, def.fadeOut);
  }
}

function playNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType,
  fadeOut?: boolean
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Volume envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01); // Quick attack

  if (fadeOut) {
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  } else {
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  }

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

// Public API

export function playSound(name: SoundName): void {
  if (isMuted) return;

  const def = SOUND_DEFS[name];
  if (def) {
    playSynthSound(def);
  }
}

export function preloadSounds(): void {
  // Initialize audio context on user interaction
  getAudioContext();
}

export function setMuted(muted: boolean): void {
  isMuted = muted;

  if (typeof window !== 'undefined') {
    localStorage.setItem('soundMuted', muted ? 'true' : 'false');
  }
}

export function getMuted(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('soundMuted');
    if (stored !== null) {
      isMuted = stored === 'true';
    }
  }
  return isMuted;
}

export function setVolume(volume: number): void {
  globalVolume = Math.max(0, Math.min(1, volume));

  if (typeof window !== 'undefined') {
    localStorage.setItem('soundVolume', globalVolume.toString());
  }
}

export function getVolume(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('soundVolume');
    if (stored !== null) {
      globalVolume = parseFloat(stored);
    }
  }
  return globalVolume;
}

export function unloadSounds(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}
