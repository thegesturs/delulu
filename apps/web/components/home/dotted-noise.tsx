'use client';

import { useEffect, useRef } from 'react';

interface DottedNoiseProps {
  className?: string;
}

export function DottedNoise({ className }: DottedNoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match display size
    const updateCanvasSize = () => {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Parameters for the effect
    const dotSpacing = 16; // Space between dots
    const dotRadius = 1.5; // Base dot size
    const noiseScale = 0.003; // Scale of the noise
    const timeScale = 0.0002; // Speed of movement
    const distortionStrength = 12; // How much the fluid distorts
    const fluidScale = 0.7; // Scale of the fluid pattern
    const flowDirection = -1; // -1 for right to left, 1 for left to right
    let frame = 0;

    // Improved simplex noise implementation
    const noise = (() => {
      const grad3 = [
        [1, 1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [0, 1, 1],
        [0, -1, 1],
        [0, 1, -1],
        [0, -1, -1],
      ];
      const p = Array.from({ length: 256 }, () =>
        Math.floor(Math.random() * 256)
      );
      const perm = [...p, ...p];

      function dot(g: number[], x: number, y: number) {
        return g[0] * x + g[1] * y;
      }

      return (xin: number, yin: number) => {
        const X = Math.floor(xin) & 255;
        const Y = Math.floor(yin) & 255;
        const x = xin - Math.floor(xin);
        const y = yin - Math.floor(yin);
        const u = x * x * x * (x * (x * 6 - 15) + 10);
        const v = y * y * y * (y * (y * 6 - 15) + 10);
        const A = perm[X] + Y;
        const B = perm[X + 1] + Y;
        return lerp(
          lerp(
            dot(grad3[perm[A] % 12], x, y),
            dot(grad3[perm[B] % 12], x - 1, y),
            u
          ),
          lerp(
            dot(grad3[perm[A + 1] % 12], x, y - 1),
            dot(grad3[perm[B + 1] % 12], x - 1, y - 1),
            u
          ),
          v
        );
      };
    })();

    function lerp(a: number, b: number, t: number) {
      return (1 - t) * a + t * b;
    }

    // Animation loop
    function animate() {
      if (!canvas || !context) return;

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with very dark background
      context.fillStyle = 'rgba(0, 0, 0, 0.98)';
      context.fillRect(0, 0, width, height);

      const time = frame * timeScale;

      // Draw dots with distortion
      for (
        let baseX = dotSpacing;
        baseX < width - dotSpacing;
        baseX += dotSpacing
      ) {
        for (
          let baseY = dotSpacing;
          baseY < height - dotSpacing;
          baseY += dotSpacing
        ) {
          // Calculate fluid distortion
          const fluidNoise1 = noise(
            (baseX + time * flowDirection * 500) * noiseScale,
            baseY * noiseScale + time * 0.5
          );
          const fluidNoise2 = noise(
            (baseX + time * flowDirection * 750) * noiseScale * 2,
            baseY * noiseScale * 2 + time
          );

          // Combine different frequencies for more organic movement
          const fluid = (fluidNoise1 + fluidNoise2 * 0.5) * fluidScale;

          // Calculate distorted position
          const distortX = baseX + fluid * distortionStrength;
          const distortY = baseY + fluid * distortionStrength * 0.5; // Less vertical distortion

          // Calculate fluid intensity for coloring
          const fluidIntensity = Math.abs(fluid);

          // Create gradient of indigo shades based on fluid intensity
          const alpha =
            fluidIntensity > 0.2
              ? Math.min(0.75, fluidIntensity * 1.2) // Slightly less bright in fluid areas
              : Math.max(0.05, fluidIntensity * 0.15); // Much darker outside fluid

          // Use different indigo shades based on intensity
          const indigo =
            fluidIntensity > 0.3
              ? `rgba(129, 140, 248, ${alpha})` // Lighter indigo in intense areas
              : `rgba(79, 70, 229, ${alpha * 0.6})`; // Darker and more transparent outside

          context.fillStyle = indigo;
          context.beginPath();
          context.arc(distortX, distortY, dotRadius, 0, Math.PI * 2);
          context.fill();
        }
      }

      frame++;
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
