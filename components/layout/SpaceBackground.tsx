'use client';

import { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
}

export function SpaceBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate random stars on mount
    const generatedStars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      generatedStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        animationDelay: Math.random() * 3,
      });
    }
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-space-bg via-space-dark to-space-bg" />

      {/* Nebula effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-nebula-purple/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-nebula-pink/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-planet-blue/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.animationDelay}s`,
          }}
        />
      ))}

      {/* Shooting star (occasional) */}
      <div className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full animate-shooting-star opacity-0" />
    </div>
  );
}
