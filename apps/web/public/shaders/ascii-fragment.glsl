precision mediump float;
uniform vec2 uResolution;
uniform sampler2D uTexture;
varying vec2 vUv;

float character(int n, vec2 p) {
  p = floor(p * vec2(-4.0, 4.0) + 2.5);
  if(clamp(p.x, 0.0, 4.0) == p.x && clamp(p.y, 0.0, 4.0) == p.y) {
    int a = int(round(p.x) + 5.0 * round(p.y));
    if(((n >> a) & 1) == 1) return 1.0;
  }
  return 0.0;
}

void main() {
  // Convert UV coordinates to pixel coordinates
  vec2 pix = vUv * uResolution;
  
  // Sample noise texture with character grid sampling
  vec3 col = texture2D(uTexture, floor(pix / 16.0) * 16.0 / uResolution).rgb;
  float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;
  
  // Character selection based on brightness
  int n = 4096;
  if(gray > 0.2) n = 65600;
  if(gray > 0.3) n = 163153;
  if(gray > 0.4) n = 15255086;
  if(gray > 0.5) n = 13121101;
  if(gray > 0.6) n = 15252014;
  if(gray > 0.7) n = 13195790;
  if(gray > 0.8) n = 11512810;
  
  // Character position within cell
  vec2 p = mod(pix / 8.0, 2.0) - vec2(1.0);
  col = col * character(n, p);
  gl_FragColor = vec4(col, 1.0);
}