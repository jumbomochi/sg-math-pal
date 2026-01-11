'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathDisplayProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function MathDisplay({ math, block = false, className = '' }: MathDisplayProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          trust: true,
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = math;
        }
      }
    }
  }, [math, block]);

  return <span ref={containerRef} className={className} />;
}

// Component to render text with inline math (text with $...$ patterns)
interface MathTextProps {
  children: string;
  className?: string;
}

export function MathText({ children, className = '' }: MathTextProps) {
  // Split text by LaTeX delimiters
  const parts = children.split(/(\$[^$]+\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          // This is a math expression
          const math = part.slice(1, -1);
          return <MathDisplay key={index} math={math} />;
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
