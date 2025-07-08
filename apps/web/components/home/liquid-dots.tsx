'use client';

import { useEffect, useRef } from 'react';

export default function LiquidDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Draw dots
    const drawDots = () => {
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Draw grid of dots
      const spacing = 13; // Reduced from 40 to 25
      const rows = Math.floor(canvas.height / dpr / spacing);
      const cols = Math.floor(canvas.width / dpr / spacing);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = j * spacing + spacing / 2;
          const y = i * spacing + spacing / 2;

          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2); // Increased from 1.5 to 2.5
          ctx.fill();
        }
      }
    };

    drawDots();
    window.addEventListener('resize', drawDots);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('resize', drawDots);
    };
  }, []);

  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ background: 'black' }}
      />
    </div>
  );
}
