"use client";

import { useCallback, useEffect, useRef } from "react";

// Import shaders as raw text
const vertexShader = `attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `precision highp float;
uniform vec2 resolution;
uniform float time;

// Simplex noise function
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
          -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Flow effect with multiple layers of noise
float flow(vec2 p) {
  float n = snoise(p * 0.3 + time * 0.1) * 0.5;
  n += snoise(p * 0.6 + time * 0.15) * 0.25;
  n += snoise(p * 1.2 + time * 0.2) * 0.125;
  n += snoise(p * 2.4 + time * 0.25) * 0.0625;
  return n;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 p = (uv * 2.0 - 1.0) * vec2(resolution.x / resolution.y, 1.0);
  
  // Grid of dots
  vec2 grid = fract(uv * 40.0) - 0.5;
  float dots = 1.0 - smoothstep(0.05, 0.06, length(grid));
  
  // Flowing effect with improved noise
  float f = flow(p);
  vec3 color = vec3(0.0);
  
  // Combine dots with flow
  float alpha = dots * 0.15; // Base dot opacity
  
  // Add flowing dark areas with smoother transition
  float darkArea = smoothstep(0.2, 0.4, f + 0.4);
  vec3 flowColor = vec3(0.31, 0.35, 0.76); // Indigo color
  
  // Final color with improved blending
  color = mix(vec3(0.0), flowColor, alpha);
  color = mix(color, vec3(0.0), darkArea * 0.9);

  gl_FragColor = vec4(color, 1.0);
}`;

interface WebGLContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  locations: {
    position: number;
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
  };
}

// WebGL setup functions
function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function setupWebGLProgram(gl: WebGLRenderingContext): WebGLContext | null {
  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  const vShader = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

  if (!(vShader && fShader)) {
    return null;
  }

  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  // Set up attributes and uniforms
  const positionLocation = gl.getAttribLocation(program, "position");
  const resolutionLocation = gl.getUniformLocation(program, "resolution");
  const timeLocation = gl.getUniformLocation(program, "time");

  return {
    gl,
    program,
    locations: {
      position: positionLocation,
      resolution: resolutionLocation,
      time: timeLocation,
    },
  };
}

function setupBuffers(gl: WebGLRenderingContext): void {
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext
): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function renderWebGLFrame(
  context: WebGLContext,
  canvas: HTMLCanvasElement,
  time: number
): void {
  const { gl, program, locations } = context;
  gl.useProgram(program);
  gl.uniform2f(locations.resolution, canvas.width, canvas.height);
  gl.uniform1f(locations.time, time);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export default function LiquidDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<WebGLContext | null>(null);
  const timeRef = useRef<number>(0);
  const frameRef = useRef<number | undefined>(undefined);
  const isAnimatingRef = useRef(true);

  const updateFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (!(isAnimatingRef.current && context && canvas)) {
      return;
    }

    timeRef.current += 0.001;
    renderWebGLFrame(context, canvas, timeRef.current);
    frameRef.current = requestAnimationFrame(updateFrame);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Initialize WebGL
    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) {
      return;
    }

    // Create program and initialize buffers
    const context = setupWebGLProgram(gl);
    if (!context) {
      return;
    }

    contextRef.current = context;
    setupBuffers(gl);

    // Set up vertex attributes
    gl.enableVertexAttribArray(context.locations.position);
    gl.vertexAttribPointer(
      context.locations.position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    // Handle canvas size
    resizeCanvas(canvas, gl);
    const handleResize = () => {
      if (contextRef.current) {
        resizeCanvas(canvas, contextRef.current.gl);
      }
    };
    window.addEventListener("resize", handleResize);

    // Start animation
    updateFrame();

    // Cleanup
    return () => {
      isAnimatingRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [updateFrame]);

  return (
    <div className="relative h-[95vh] w-full overflow-hidden">
      <canvas
        className="h-full w-full"
        ref={canvasRef}
        style={{ background: "#000" }}
      />
    </div>
  );
}
