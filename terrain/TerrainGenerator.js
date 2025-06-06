// terrain/TerrainGenerator.js
import * as THREE from 'three';

/**
 * Provides terrain mesh generation and height query functions.
 * Uses value noise for procedural elevation.
 */

// Terrain parameters (should eventually be imported from utils/Constants.js)
const GROUND_SEGMENTS_W = 64;
const GROUND_SEGMENTS_H = 64;
const TERRAIN_MAX_HEIGHT = 3.5;
const TERRAIN_BASE_FREQUENCY = 0.04;
const TERRAIN_OCTAVES = 5;
const TERRAIN_PERSISTENCE = 0.45;
const TERRAIN_LACUNARITY = 2.1;

/**
 * 2D pseudo-random function for deterministic value noise.
 * @param {number} ix - Integer X coordinate.
 * @param {number} iz - Integer Z coordinate.
 * @returns {number} Pseudo-random value in [-1, 1].
 */
function pseudoRandom(ix, iz) {
    let n = ix + iz * 57;
    n = (n << 13) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    n = (n & 0x7fffffff);
    return 1.0 - n / 1073741823.0;
}

/**
 * Interpolated value noise for smooth terrain generation.
 * @param {number} x - X coordinate.
 * @param {number} z - Z coordinate.
 * @param {number} frequency - Frequency of the noise.
 * @returns {number} Interpolated noise value.
 */
function interpolatedNoise(x, z, frequency) {
    const scaledX = x * frequency;
    const scaledZ = z * frequency;
    const intX = Math.floor(scaledX);
    const fracX = scaledX - intX;
    const intZ = Math.floor(scaledZ);
    const fracZ = scaledZ - intZ;
    const v1 = pseudoRandom(intX, intZ);
    const v2 = pseudoRandom(intX + 1, intZ);
    const v3 = pseudoRandom(intX, intZ + 1);
    const v4 = pseudoRandom(intX + 1, intZ + 1);
    const smoothFracX = fracX * fracX * (3 - 2 * fracX);
    const smoothFracZ = fracZ * fracZ * (3 - 2 * fracZ);
    const i1 = THREE.MathUtils.lerp(v1, v2, smoothFracX);
    const i2 = THREE.MathUtils.lerp(v3, v4, smoothFracX);
    return THREE.MathUtils.lerp(i1, i2, smoothFracZ);
}

/**
 * Computes the terrain height at a given (x, z) world coordinate using FBM.
 * @param {number} worldX - World X coordinate.
 * @param {number} worldZ - World Z coordinate.
 * @returns {number} Height value for terrain at (x, z).
 */
export function getTerrainHeight(worldX, worldZ) {
    let totalHeight = 0;
    let currentFrequency = TERRAIN_BASE_FREQUENCY;
    let currentAmplitude = 1.0;
    let normalizationFactor = 0;
    for (let i = 0; i < TERRAIN_OCTAVES; i++) {
        totalHeight += interpolatedNoise(worldX, worldZ, currentFrequency) * currentAmplitude;
        normalizationFactor += currentAmplitude;
        currentAmplitude *= TERRAIN_PERSISTENCE;
        currentFrequency *= TERRAIN_LACUNARITY;
    }
    return (totalHeight / normalizationFactor) * TERRAIN_MAX_HEIGHT;
}

/**
 * Generates a ground mesh with procedural elevation.
 * @param {THREE.Material} material - The material to use for the ground mesh.
 * @returns {THREE.Mesh} The generated ground mesh.
 */
export function createGroundMesh(material) {
    const groundGeometry = new THREE.PlaneGeometry(100, 100, GROUND_SEGMENTS_W, GROUND_SEGMENTS_H);
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const px_local = positions.getX(i);
        const py_local = positions.getY(i);
        const height_worldY = getTerrainHeight(px_local, -py_local);
        positions.setZ(i, height_worldY);
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    const groundMesh = new THREE.Mesh(groundGeometry, material);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    return groundMesh;
} 