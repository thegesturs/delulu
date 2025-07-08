'use client';

import { useEffect, useRef } from 'react';

export default function LiquidDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

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

    // Draw dots and blob
    const draw = () => {
      timeRef.current += 0.002;

      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Draw liquid blob
      const centerX = canvas.width / dpr / 2;
      const centerY = canvas.height / dpr / 2;
      const blobRadius =
        Math.min(canvas.width / dpr, canvas.height / dpr) * 0.2;

      // Create blob path
      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const noise = Math.sin(angle * 4 + timeRef.current) * 20;
        const radius = blobRadius + noise;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Fill blob with gradient
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        blobRadius
      );
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw grid of dots
      const spacing = 13;
      const rows = Math.floor(canvas.height / dpr / spacing);
      const cols = Math.floor(canvas.width / dpr / spacing);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = j * spacing + spacing / 2;
          const y = i * spacing + spacing / 2;

          // Check if dot is inside blob area
          const distanceFromCenter = Math.sqrt(
            (x - centerX) ** 2 + (y - centerY) ** 2
          );

          // Add some noise to the blob edge check
          const blobEdge =
            blobRadius +
            Math.sin(
              Math.atan2(y - centerY, x - centerX) * 4 + timeRef.current
            ) *
              20;

          ctx.beginPath();
          if (distanceFromCenter < blobEdge) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'; // Indigo for dots inside blob
          } else {
            ctx.fillStyle = 'rgba(10,10,10)'; // Original color for dots outside
          }
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <div className="relative h-[95vh] w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ background: 'black' }}
      />
    </div>
  );
}
