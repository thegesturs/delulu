'use client';

import { useEffect, useRef } from 'react';

interface BlobPoint {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export default function LiquidDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const blobsRef = useRef<BlobPoint[]>([]);

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

    // Initialize blob points
    const initBlobs = () => {
      blobsRef.current = [];
      const numBlobs = 5; // Number of organic shapes

      for (let i = 0; i < numBlobs; i++) {
        blobsRef.current.push({
          x: (Math.random() * canvas.width) / dpr,
          y: (Math.random() * canvas.height) / dpr,
          angle: Math.random() * Math.PI * 2,
          radius:
            (Math.random() * 0.1 + 0.1) *
            Math.min(canvas.width / dpr, canvas.height / dpr),
        });
      }
    };

    initBlobs();

    // Draw dots and blobs
    const draw = () => {
      timeRef.current += 0.002;

      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Update blob positions with smooth movement
      blobsRef.current.forEach((blob) => {
        blob.x += Math.cos(blob.angle + timeRef.current) * 0.5;
        blob.y += Math.sin(blob.angle + timeRef.current * 0.7) * 0.5;

        // Wrap around edges
        if (blob.x < -blob.radius) blob.x = canvas.width / dpr + blob.radius;
        if (blob.x > canvas.width / dpr + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = canvas.height / dpr + blob.radius;
        if (blob.y > canvas.height / dpr + blob.radius) blob.y = -blob.radius;
      });

      // Draw organic shapes
      ctx.beginPath();
      blobsRef.current.forEach((blob, index) => {
        const points: [number, number][] = [];
        const numPoints = 20;

        // Create points around the blob
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const noise =
            Math.sin(angle * 3 + timeRef.current + index) * (blob.radius * 0.2);
          const x = blob.x + Math.cos(angle) * (blob.radius + noise);
          const y = blob.y + Math.sin(angle) * (blob.radius + noise);
          points.push([x, y]);
        }

        // Draw curved path through points
        if (points.length > 0) {
          ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) {
            const xc = (points[i][0] + points[i - 1][0]) / 2;
            const yc = (points[i][1] + points[i - 1][1]) / 2;
            ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xc, yc);
          }
          // Close the shape
          const xc = (points[0][0] + points[points.length - 1][0]) / 2;
          const yc = (points[0][1] + points[points.length - 1][1]) / 2;
          ctx.quadraticCurveTo(
            points[points.length - 1][0],
            points[points.length - 1][1],
            xc,
            yc
          );
        }
      });

      // Fill all shapes with gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / dpr / 2,
        canvas.height / dpr / 2,
        0,
        canvas.width / dpr / 2,
        canvas.height / dpr / 2,
        canvas.width / dpr / 2
      );
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
      gradient.addColorStop(0.4, 'rgba(79, 82, 201, 0.2)');
      gradient.addColorStop(1, 'rgba(59, 62, 171, 0.08)');
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

          // Check if dot is inside any blob area
          let isInBlob = false;
          let minDistance = Number.POSITIVE_INFINITY;
          let closestBlob: BlobPoint | null = null;

          for (const blob of blobsRef.current) {
            const distanceFromCenter = Math.sqrt(
              (x - blob.x) ** 2 + (y - blob.y) ** 2
            );
            if (distanceFromCenter < minDistance) {
              minDistance = distanceFromCenter;
              closestBlob = blob;
            }

            const blobEdge =
              blob.radius +
              Math.sin(
                Math.atan2(y - blob.y, x - blob.x) * 4 + timeRef.current
              ) *
                20;
            if (distanceFromCenter < blobEdge) {
              isInBlob = true;
            }
          }

          ctx.beginPath();
          if (isInBlob && closestBlob) {
            // Calculate dot color based on distance from closest blob center
            const distanceRatio = minDistance / closestBlob.radius;
            let dotColor: string;

            if (distanceRatio < 0.3) {
              dotColor = 'rgba(99, 102, 241, 0.45)';
            } else if (distanceRatio < 0.7) {
              dotColor = 'rgba(79, 82, 201, 0.4)';
            } else {
              dotColor = 'rgba(59, 62, 171, 0.35)';
            }

            ctx.fillStyle = dotColor;
          } else {
            ctx.fillStyle = 'rgba(10,10,10)';
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
