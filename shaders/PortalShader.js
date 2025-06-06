// shaders/PortalShader.js
import * as THREE from 'three';

/**
 * Portal vertex shader GLSL code.
 */
export const portalVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Portal fragment shader GLSL code.
 */
export const portalFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  mat2 rotate2d(float angle){
      return mat2(cos(angle), -sin(angle),
                  sin(angle), cos(angle));
  }
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      return mix(a, b, u.x) +
             (c - a) * u.y * (1.0 - u.x) +
             (d - b) * u.x * u.y;
  }
  float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency_mult = 1.0;
      for (int i = 0; i < 4; i++) {
          value += amplitude * noise(st * frequency_mult);
          frequency_mult *= 2.0;
          amplitude *= 0.5;
      }
      return value;
  }
  float blurredFbm(vec2 st, float blurAmount) {
      float total = 0.0;
      float radius = blurAmount / min(uResolution.x, uResolution.y) * 1.5;
      for (float x = -1.0; x <= 1.0; x += 1.0) {
          for (float y = -1.0; y <= 1.0; y += 1.0) {
              total += fbm(st + vec2(x, y) * radius);
          }
      }
      return total / 9.0;
  }
  float sampleSwirledBlurredNoise(vec2 swirledUv, float time, float sampleBlurAmount) {
      float total = 0.0;
      float offsetScale = sampleBlurAmount / min(uResolution.x, uResolution.y);
      for (float x = -1.0; x <= 1.0; x += 1.0) {
          for (float y = -1.0; y <= 1.0; y += 1.0) {
              vec2 sampleOffset = vec2(x, y) * offsetScale;
              vec2 noiseCoord = (swirledUv + sampleOffset) * 3.5 + vec2(time * 0.15, time * 0.08);
              total += blurredFbm(noiseCoord, 4.0);
          }
      }
      return total / 9.0;
  }
  void main() {
    vec2 centeredUv = vUv - 0.5;
    float angle = atan(centeredUv.y, centeredUv.x);
    float radius = length(centeredUv);
    float swirlStrength = smoothstep(0.7, 0.0, radius) * 5.0;
    float timeFactor = uTime * 0.8;
    vec2 swirlOffset = vec2(cos(angle + timeFactor + radius * 8.0), sin(angle + timeFactor + radius * 8.0)) * radius - centeredUv;
    vec2 swirledUv = vUv + swirlOffset * swirlStrength * 0.3;
    float dist = length(centeredUv);
    float noiseValue = sampleSwirledBlurredNoise(swirledUv, uTime, 3.0);
    vec3 color = vec3(0.6, 0.1, 0.9);
    float glow = (1.0 - smoothstep(0.0, 0.6, dist)) * (0.6 + noiseValue * 0.4);
    color += glow * vec3(0.8, 0.3, 1.0);
    vec2 sparkleCoord = swirledUv * 25.0;
    float sparkleNoise = random(floor(sparkleCoord + uTime * 2.0));
    float sparkleThreshold = 0.985;
    float sparkleValue = smoothstep(sparkleThreshold - 0.005, sparkleThreshold, sparkleNoise);
    vec3 sparkleColor = vec3(1.0, 1.0, 0.7);
    color += sparkleColor * sparkleValue * 1.5;
    float alpha = smoothstep(0.6, 0.35, dist) * (0.65 + noiseValue * 0.1);
    alpha = clamp(alpha + sparkleValue * 0.4, 0.0, 1.0);
    alpha *= 0.85;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Creates a ShaderMaterial for the portal effect.
 * @param {object} uniforms - Uniforms to use for the shader.
 * @returns {THREE.ShaderMaterial}
 */
export function createPortalMaterial(uniforms) {
    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: portalVertexShader,
        fragmentShader: portalFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
} 