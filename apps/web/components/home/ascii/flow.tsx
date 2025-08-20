// app/halftone/Flow.tsx
'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';

const vertex = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uAmp;
uniform float uScale;
attribute vec2 aUV2D;

float n(vec2 p){ return sin(p.x)*sin(p.y); }
float fbm(vec2 p){
  float f = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ f += a*n(p); p = mat2(1.6,1.2,-1.2,1.6)*p + 0.5; a *= 0.5; }
  return f;
}

void main(){
  vec3 pos = position;
  vec2 p = aUV2D * 3.0 + vec2(uTime*0.15, uTime*0.10);
  float d = fbm(p);
  pos.xy += vec2(sin(d*6.2831), cos(d*6.2831)) * uAmp;
  pos.xy *= uScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragment = /* glsl */ `
precision mediump float;
void main(){ gl_FragColor = vec4(vec3(0.08), 0.9); }
`;

function Dots({ cols = 120, rows = 70, dot = 0.01 }) {
  const count = cols * rows;
  const mesh = useRef<THREE.InstancedMesh>(null!);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.05 },
          uScale: { value: 1.0 },
        },
        transparent: true,
      }),
    []
  );

  const geo = useMemo(() => new THREE.PlaneGeometry(dot, dot), [dot]);

  // Build per-instance attributes once
  const instancedGeo = useMemo(() => {
    const g = geo.clone() as THREE.InstancedBufferGeometry;
    g.instanceCount = count;

    const uv2 = new Float32Array(count * 2);
    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        uv2[i++] = x / (cols - 1);
        uv2[i++] = y / (rows - 1);
      }
    }
    g.setAttribute('aUV2D', new THREE.InstancedBufferAttribute(uv2, 2));
    return g;
  }, [geo, cols, rows, count]);

  // Set identity matrices once, not every render
  useEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((s) => {
    material.uniforms.uTime.value = s.clock.getElapsedTime();
  });

  // fit grid
  const w = 2,
    h = 1.2,
    dx = w / (cols - 1),
    dy = h / (rows - 1);
  const offsets = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        list.push([-w / 2 + x * dx, -h / 2 + y * dy, 0]);
      }
    return list;
  }, [cols, rows, dx, dy, w, h]);

  return (
    <group>
      <instancedMesh ref={mesh} args={[instancedGeo, material, count]}>
        {/* one invisible dummy is fine */}
        <meshBasicMaterial />
      </instancedMesh>
      {/* bake base positions into the model matrix once */}
      {
        useEffect(() => {
          if (!mesh.current) return;
          const dummy = new THREE.Object3D();
          offsets.forEach(([x, y, z], i) => {
            dummy.position.set(x, y, z);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
          });
          mesh.current.instanceMatrix.needsUpdate = true;
        }, [offsets]) as any
      }
    </group>
  );
}

export default function Flow() {
  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 10], zoom: 230 }}
      frameloop="always"
    >
      <Dots />
    </Canvas>
  );
}
