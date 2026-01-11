'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Undo, Palette, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  '#ffffff', // White
  '#fbbf24', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#f97316', // Orange
];

export function Scratchpad({ isOpen, onClose }: ScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Fill with dark background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Save current state for undo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-20), imageData]); // Keep last 20 states

    setIsDrawing(true);
    const { x, y } = getCanvasPoint(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasPoint(e);

    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Save current state for undo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-20), imageData]);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const undo = () => {
    if (history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(prev => prev.slice(0, -1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="absolute inset-4 md:inset-8 bg-space-card border border-space-border rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-space-border bg-space-bg/50">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold text-white">Scratchpad</h2>

                {/* Color Palette */}
                <div className="flex items-center gap-1">
                  <Palette className="h-4 w-4 text-gray-400 mr-1" />
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                        brushColor === color ? 'border-white scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Brush Size */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
                    className="p-1 rounded hover:bg-white/10 text-gray-400"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div
                    className="rounded-full bg-white"
                    style={{ width: brushSize * 2, height: brushSize * 2 }}
                  />
                  <button
                    onClick={() => setBrushSize(Math.min(20, brushSize + 1))}
                    className="p-1 rounded hover:bg-white/10 text-gray-400"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={history.length === 0}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    history.length > 0
                      ? 'hover:bg-white/10 text-gray-300'
                      : 'text-gray-600 cursor-not-allowed'
                  )}
                  title="Undo"
                >
                  <Undo className="h-5 w-5" />
                </button>
                <button
                  onClick={clearCanvas}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                  title="Clear"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            {/* Hint */}
            <div className="px-4 py-2 text-center text-xs text-gray-500 border-t border-space-border">
              Draw your work here. Tap outside or press the X to close.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
