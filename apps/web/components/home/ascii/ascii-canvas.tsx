'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // Create flowing waves
  float wave1 = sin(uv.x * 10.0 + uTime * 3.0) * 0.5 + 0.5;
  float wave2 = sin(uv.y * 8.0 + uTime * 2.0) * 0.5 + 0.5;
  float wave3 = sin((uv.x + uv.y) * 6.0 + uTime * 4.0) * 0.5 + 0.5;
  
  // Combine waves
  float intensity = (wave1 + wave2 + wave3) / 3.0;
  
  // Add flowing movement
  float flow = sin(uv.x * 5.0 - uTime * 6.0) * sin(uv.y * 4.0 - uTime * 3.0);
  intensity += flow * 0.3;
  intensity = clamp(intensity, 0.0, 1.0);
  
  // Create dots pattern
  vec2 grid = floor(uv * 50.0);
  vec2 gridUv = fract(uv * 50.0);
  float dot = 1.0 - smoothstep(0.1, 0.5, length(gridUv - 0.5));
  
  // Modulate dot visibility with waves
  dot *= smoothstep(0.3, 0.7, intensity);
  
  // White dots
  vec3 color = vec3(dot);
  
  gl_FragColor = vec4(color, dot * 0.8);
}
`;

function FlowMaterial() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={{
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(800, 600) },
      }}
      transparent
    />
  );
}

function FlowPlane() {
  return (
    <mesh>
      <planeGeometry args={[4, 3]} />
      <FlowMaterial />
    </mesh>
  );
}

interface AsciiCanvasProps {
  width: number;
  height: number;
  opacity?: number;
}

export default function AsciiCanvas({
  width,
  height,
  opacity = 0.6,
}: AsciiCanvasProps) {
  return (
    <div 
      className="absolute inset-0"
      style={{ width, height, opacity }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: false }}
      >
        <FlowPlane />
      </Canvas>
    </div>
  );
}