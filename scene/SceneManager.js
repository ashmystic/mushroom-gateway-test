// scene/SceneManager.js
import * as THREE from 'three';

/**
 * Manages the Three.js scene, camera, and renderer setup.
 * Provides initialization and accessors for core scene objects.
 */

let scene, camera, renderer;

/**
 * Initializes the scene, camera, and renderer.
 * @param {HTMLCanvasElement} canvas - The canvas element to use for rendering.
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer}}
 */
export function initScene(canvas) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return { scene, camera, renderer };
}

/**
 * Returns the current scene instance.
 * @returns {THREE.Scene}
 */
export function getScene() {
  return scene;
}

/**
 * Returns the current camera instance.
 * @returns {THREE.PerspectiveCamera}
 */
export function getCamera() {
  return camera;
}

/**
 * Returns the current renderer instance.
 * @returns {THREE.WebGLRenderer}
 */
export function getRenderer() {
  return renderer;
} 