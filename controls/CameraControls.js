import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Initializes and returns OrbitControls for the given camera and DOM element.
 * @param {THREE.PerspectiveCamera} camera - The camera to control.
 * @param {HTMLElement} domElement - The DOM element for controls (usually renderer.domElement).
 * @returns {OrbitControls} The initialized OrbitControls instance.
 */
export function createCameraControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 1.9;
    return controls;
} 