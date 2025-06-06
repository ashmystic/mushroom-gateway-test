import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let camera, scene, renderer;
let controls;
let groundPlane;
let mushroomGate;
let portalMesh;
let portalMaterial;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader();

let barkTexture, foliageTexture, grassTexture;

/**
 * Seeded pseudo-random number generator using the Mulberry32 algorithm.
 * Used for deterministic procedural generation (e.g., tree/mushroom placement).
 */
class SeededRandom {
    /**
     * @param {number} seed - The initial seed value for the PRNG.
     */
    constructor(seed) {
        this.seed = seed;
        if (this.seed === undefined || this.seed === null) {
            this.seed = Date.now(); // Fallback if no seed is provided
        }
    }
    /**
     * Generates a pseudo-random float in [0, 1).
     * @returns {number} Random float in [0, 1).
     */
    random() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    /**
     * Generates a random float in [min, max).
     * @param {number} min - Minimum value (inclusive).
     * @param {number} max - Maximum value (exclusive).
     * @returns {number} Random float in [min, max).
     */
    randFloat(min, max) {
        return this.random() * (max - min) + min;
    }
    /**
     * Generates a random integer in [min, max).
     * @param {number} min - Minimum value (inclusive).
     * @param {number} max - Maximum value (exclusive).
     * @returns {number} Random integer in [min, max).
     */
    randInt(min, max) { // Inclusive min, exclusive max
        return Math.floor(this.random() * (max - min) + min);
    }
}

// Global instance for object placement, initialized with a fixed seed
const PLACEMENT_SEED = 54321; // Fixed seed for consistent placements
const placementPrng = new SeededRandom(PLACEMENT_SEED);

const TREE_COUNT = 200;
const SPREAD = 20;
const MIN_DISTANCE_FROM_CENTER_TREES = 5; // Min XZ distance from (0,0) for trees

const MUSHROOM_COUNT = 150;
const MIN_DISTANCE_FROM_GATEWAY_CENTER = 1.0; // Min XZ distance from (0,0) for mushrooms

// Terrain parameters
const GROUND_SEGMENTS_W = 64; // Number of width segments for the ground plane
const GROUND_SEGMENTS_H = 64; // Number of height segments for the ground plane
const TERRAIN_MAX_HEIGHT = 3.5;   // Maximum elevation change for the terrain
const TERRAIN_BASE_FREQUENCY = 0.04; // Controls the "zoom" level of the base noise pattern
const TERRAIN_OCTAVES = 5;          // Number of noise layers to combine for detail
const TERRAIN_PERSISTENCE = 0.45;    // How much each successive octave contributes (amplitude multiplier)
const TERRAIN_LACUNARITY = 2.1;     // How much frequency increases for each successive octave

let ambientLight, directionalLight;
let groundMaterial;
let trunkMaterial, deciduousFoliageMaterial, coniferousFoliageMaterial;
let mushroomStemMaterial, mushroomCapMaterialVariety1, mushroomCapMaterialVariety2, mushroomCapMaterialVariety3;

let sunMesh, moonMesh;
const LIGHT_ORBIT_RADIUS = 25;
const DAY_CYCLE_DURATION = 60;
const NIGHT_CYCLE_DURATION = 45;
let dayTimeProgress = 0;
let nightTimeProgress = 0;

const daySettings = {
    background: new THREE.Color(0x87CEEB),
    fog: new THREE.Fog(0xcce0ff, 10, 50),
    ambientLightIntensity: 0.5,
    directionalLightIntensity: 0.8,
    directionalLightColor: 0xffffff,
    groundColor: 0x8FBC8F,
    trunkColor: 0xA0522D,
    deciduousFoliageColor: 0x556B2F,
    coniferousFoliageColor: 0x228B22
};

const nightSettings = {
    background: new THREE.Color(0x0a0a20),
    fog: new THREE.Fog(0x0a0a20, 25, 70),
    ambientLightIntensity: 0.5,
    directionalLightIntensity: 0.8,
    directionalLightColor: 0xc0c0ff,
    groundColor: 0x6A7F6A,
    trunkColor: 0xA06A35,
    deciduousFoliageColor: 0x4E8B57,
    coniferousFoliageColor: 0x208420
};

let isDaytime = true; // Start in day mode

/**
 * Updates the position and visibility of the sun or moon mesh and the directional light
 * based on the current progress through the day or night cycle.
 * @param {number} progress - Progress through the cycle (0 to 1).
 * @param {boolean} isDay - True if updating for day (sun), false for night (moon).
 */
function updateCelestialBodyPosition(progress, isDay) {
    // Calculate the position on an arc from -PI to 0 (East to West horizon)
    // This maps the progress (0 to 1) to an angle (PI to 0)
    // We use PI to 0 for the XZ plane to represent rising from Z- (East) and setting towards Z+ (West)
    // The Y coordinate will follow a sine wave to go up and down.
    const alpha = (1.0 - progress) * Math.PI; // Angle from PI (East) to 0 (West)

    const x = LIGHT_ORBIT_RADIUS * Math.cos(alpha); // Z coordinate in world space
    const y = LIGHT_ORBIT_RADIUS * Math.sin(alpha); // Y coordinate in world space
    const z = LIGHT_ORBIT_RADIUS * Math.cos(alpha - Math.PI / 2); // X coordinate in world space (adjust for view)

    if (directionalLight) {
        // Position relative to center (0,0,0)
        directionalLight.position.set(z, y, x);
        directionalLight.target.position.set(0, 0, 0);
        directionalLight.target.updateMatrixWorld();
    }

    const meshToUpdate = isDay ? sunMesh : moonMesh;
    if (meshToUpdate) {
        meshToUpdate.position.copy(directionalLight.position);

        // Smoothly fade in/out based on height (y)
        const heightFactor = Math.max(0, y / LIGHT_ORBIT_RADIUS);
        meshToUpdate.material.opacity = THREE.MathUtils.smoothstep(heightFactor, 0.05, 0.15);
        meshToUpdate.material.transparent = true;

        // Scale based on height
        meshToUpdate.scale.setScalar(Math.max(0.5, heightFactor * (isDay ? 1.2 : 1.0) + 0.1)); // Ensure minimum visible size

        // Only show the correct body when it's above the horizon (y > 0) and it's the correct time of day
        meshToUpdate.visible = (isDay === isDaytime) && y > -0.1; // Small threshold to avoid flickering at horizon
    }

    const meshToHide = isDay ? moonMesh : sunMesh;
    if (meshToHide) {
        meshToHide.visible = false;
    }
}

/**
 * Applies the current scene state (lighting, fog, colors) for day or night.
 * Also updates celestial body positions.
 * @param {object} settings - Settings object for day or night.
 * @param {number} progress - Progress through the current cycle (0 to 1).
 */
function applySceneState(settings, progress) {
    scene.background = settings.background;
    scene.fog = settings.fog;

    if (ambientLight) ambientLight.intensity = settings.ambientLightIntensity;

    if (directionalLight) {
        directionalLight.intensity = settings.directionalLightIntensity;
        directionalLight.color.set(settings.directionalLightColor);
    }

    // Progress for celestial bodies depends on the current phase
    const currentProgress = isDaytime ? dayTimeProgress : nightTimeProgress;
    updateCelestialBodyPosition(currentProgress, isDaytime);

    if (groundMaterial) groundMaterial.color.set(settings.groundColor);
    if (trunkMaterial) trunkMaterial.color.set(settings.trunkColor);
    if (deciduousFoliageMaterial) deciduousFoliageMaterial.color.set(settings.deciduousFoliageColor);
    if (coniferousFoliageMaterial) coniferousFoliageMaterial.color.set(settings.coniferousFoliageColor);

    console.log(`Applied state for ${isDaytime ? 'Day' : 'Night'} at progress ${currentProgress.toFixed(2)}`);
}

const portalVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const portalFragmentShader = `
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
 * 2D pseudo-random function for deterministic value noise.
 * Used in terrain generation.
 * @param {number} ix - Integer X coordinate.
 * @param {number} iz - Integer Z coordinate.
 * @returns {number} Pseudo-random value in [-1, 1].
 */
function pseudoRandom(ix, iz) {
    let n = ix + iz * 57;
    n = (n << 13) ^ n;
    // Robert Jenkins' 32 bit integer hash function
    n = n * (n * n * 15731 + 789221) + 1376312589;
    n = (n & 0x7fffffff); // Ensure positive number
    return 1.0 - n / 1073741823.0; // Convert to -1.0 to 1.0 range
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

    // Smooth interpolation (e.g., cosine or smoothstep)
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
function getTerrainHeight(worldX, worldZ) {
    let totalHeight = 0;
    let currentFrequency = TERRAIN_BASE_FREQUENCY;
    let currentAmplitude = 1.0; // Initial amplitude
    let normalizationFactor = 0;

    for (let i = 0; i < TERRAIN_OCTAVES; i++) {
        totalHeight += interpolatedNoise(worldX, worldZ, currentFrequency) * currentAmplitude;
        normalizationFactor += currentAmplitude;
        currentAmplitude *= TERRAIN_PERSISTENCE;
        currentFrequency *= TERRAIN_LACUNARITY;
    }

    // Normalize to [-1, 1] range based on max possible amplitude, then scale by TERRAIN_MAX_HEIGHT
    // This makes the height values more predictable.
    // The result is then scaled to be mostly positive hills from a base near 0.
    return (totalHeight / normalizationFactor) * TERRAIN_MAX_HEIGHT;
}

/**
 * Creates geometry for a single deciduous tree (trunk and foliage).
 * @returns {{trunkGeo: THREE.CylinderGeometry, foliageGeo: THREE.SphereGeometry}}
 */
function createDeciduousTreeGeometry() {
    const trunkHeight = placementPrng.randFloat(1.5, 2.5);
    const trunkRadius = trunkHeight * 0.1;
    const foliageRadius = trunkHeight * 0.5;

    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 16);
    trunkGeo.translate(0, trunkHeight / 2, 0);

    const foliageGeo = new THREE.SphereGeometry(foliageRadius, 16, 12);
    foliageGeo.translate(
        placementPrng.randFloat(-trunkRadius * 0.5, trunkRadius * 0.5),
        trunkHeight + foliageRadius * 0.6,
        placementPrng.randFloat(-trunkRadius * 0.5, trunkRadius * 0.5)
    );

    return { trunkGeo, foliageGeo };
}

/**
 * Creates geometry for a single coniferous tree (trunk and foliage).
 * @returns {{trunkGeo: THREE.CylinderGeometry, foliageGeo: THREE.ConeGeometry}}
 */
function createConiferousTreeGeometry() {
    const trunkHeight = placementPrng.randFloat(2.0, 3.5);
    const trunkRadius = trunkHeight * 0.08;
    const coneRadius = trunkHeight * 0.3;
    const coneHeight = trunkHeight * 0.9;

    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 16);
    trunkGeo.translate(0, trunkHeight / 2, 0);

    const foliageGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    foliageGeo.translate(0, trunkHeight + coneHeight / 2 - trunkHeight * 0.1, 0);

    return { trunkGeo, foliageGeo };
}

let deciduousTrunkInstances, deciduousFoliageInstances;
let coniferousTrunkInstances, coniferousFoliageInstances;

/**
 * Creates and places all instanced trees in the scene using procedural placement.
 * Adds instanced meshes to the scene.
 * Side effects: modifies global tree instance variables and adds to scene.
 */
function createInstancedTrees() {
    const deciduousTemplate = createDeciduousTreeGeometry();
    const coniferousTemplate = createConiferousTreeGeometry();

    const deciduousCount = Math.floor(TREE_COUNT / 2);
    const coniferousCount = TREE_COUNT - deciduousCount;

    deciduousTrunkInstances = new THREE.InstancedMesh(deciduousTemplate.trunkGeo, trunkMaterial, deciduousCount);
    deciduousFoliageInstances = new THREE.InstancedMesh(deciduousTemplate.foliageGeo, deciduousFoliageMaterial, deciduousCount);
    coniferousTrunkInstances = new THREE.InstancedMesh(coniferousTemplate.trunkGeo, trunkMaterial, coniferousCount);
    coniferousFoliageInstances = new THREE.InstancedMesh(coniferousTemplate.foliageGeo, coniferousFoliageMaterial, coniferousCount);

    deciduousTrunkInstances.castShadow = true;
    deciduousFoliageInstances.castShadow = true;
    coniferousTrunkInstances.castShadow = true;
    coniferousFoliageInstances.castShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < deciduousCount; i++) {
        let x, z, dist;
        do {
            x = placementPrng.randFloat(-SPREAD, SPREAD);
            z = placementPrng.randFloat(-SPREAD, SPREAD);
            dist = Math.sqrt(x * x + z * z);
        } while (dist < MIN_DISTANCE_FROM_CENTER_TREES);

        const terrainY = getTerrainHeight(x, z);
        const scaleVariation = placementPrng.randFloat(0.8, 1.2);
        dummy.position.set(x, terrainY, z);
        dummy.rotation.y = placementPrng.random() * Math.PI * 2;
        dummy.scale.set(scaleVariation, scaleVariation, scaleVariation);
        dummy.updateMatrix();

        deciduousTrunkInstances.setMatrixAt(i, dummy.matrix);
        deciduousFoliageInstances.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < coniferousCount; i++) {
        let x, z, dist;
        do {
            x = placementPrng.randFloat(-SPREAD, SPREAD);
            z = placementPrng.randFloat(-SPREAD, SPREAD);
            dist = Math.sqrt(x * x + z * z);
        } while (dist < MIN_DISTANCE_FROM_CENTER_TREES);
        
        const terrainY = getTerrainHeight(x, z);
        const scaleVariation = placementPrng.randFloat(0.7, 1.1);
        dummy.position.set(x, terrainY, z);
        dummy.rotation.y = placementPrng.random() * Math.PI * 2;
        dummy.scale.set(scaleVariation, scaleVariation, scaleVariation);
        dummy.updateMatrix();

        coniferousTrunkInstances.setMatrixAt(i, dummy.matrix);
        coniferousFoliageInstances.setMatrixAt(i, dummy.matrix);
    }

    deciduousTrunkInstances.instanceMatrix.needsUpdate = true;
    deciduousFoliageInstances.instanceMatrix.needsUpdate = true;
    coniferousTrunkInstances.instanceMatrix.needsUpdate = true;
    coniferousFoliageInstances.instanceMatrix.needsUpdate = true;

    scene.add(deciduousTrunkInstances);
    scene.add(deciduousFoliageInstances);
    scene.add(coniferousTrunkInstances);
    scene.add(coniferousFoliageInstances);

    console.log(`Added ${deciduousCount} deciduous and ${coniferousCount} coniferous trees on varied terrain.`);
}

let mushroomStemInstances, mushroomCapInstancesVariety1, mushroomCapInstancesVariety2, mushroomCapInstancesVariety3;

/**
 * Creates geometry templates for different mushroom varieties.
 * @returns {Array<{stemGeo: THREE.CylinderGeometry, capGeo: THREE.Geometry, type: number}>}
 */
function createMushroomGeometries() {
    const geometries = [];

    const stem1Geo = new THREE.CylinderGeometry(0.05, 0.08, 0.3, 6);
    stem1Geo.translate(0, 0.15, 0);
    const cap1Geo = new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    cap1Geo.scale(1, 0.7, 1);
    cap1Geo.translate(0, 0.3 + 0.02, 0);
    geometries.push({ stemGeo: stem1Geo, capGeo: cap1Geo, type: 1 });

    const stem2Geo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 5);
    stem2Geo.translate(0, 0.25, 0);
    const cap2Geo = new THREE.ConeGeometry(0.1, 0.25, 8);
    cap2Geo.translate(0, 0.5 - 0.07 - 0.05, 0);
    geometries.push({ stemGeo: stem2Geo, capGeo: cap2Geo, type: 2 });

    const stem3Geo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 6);
    stem3Geo.translate(0, 0.075, 0);
    const cap3Geo = new THREE.SphereGeometry(0.12, 8, 6);
    cap3Geo.translate(0, 0.15 + 0.07 + 0.03, 0);
    geometries.push({ stemGeo: stem3Geo, capGeo: cap3Geo, type: 3 });

    return geometries;
}

/**
 * Creates and places all instanced mushrooms in the scene using procedural placement.
 * Adds instanced meshes to the scene.
 * Side effects: modifies global mushroom instance variables and adds to scene.
 */
function createInstancedMushrooms() {
    const mushroomTemplates = createMushroomGeometries();

    const countPerVariety = Math.floor(MUSHROOM_COUNT / mushroomTemplates.length);
    const remaining = MUSHROOM_COUNT % mushroomTemplates.length;
    const counts = mushroomTemplates.map((_, index) => countPerVariety + (index < remaining ? 1 : 0));

    if (counts[0] > 0) {
        mushroomCapInstancesVariety1 = new THREE.InstancedMesh(mushroomTemplates[0].capGeo, mushroomCapMaterialVariety1, counts[0]);
        mushroomCapInstancesVariety1.castShadow = true;
        scene.add(mushroomCapInstancesVariety1);
    }
    if (counts[1] > 0) {
        mushroomCapInstancesVariety2 = new THREE.InstancedMesh(mushroomTemplates[1].capGeo, mushroomCapMaterialVariety2, counts[1]);
        mushroomCapInstancesVariety2.castShadow = true;
        scene.add(mushroomCapInstancesVariety2);
    }
    if (counts[2] > 0) {
        mushroomCapInstancesVariety3 = new THREE.InstancedMesh(mushroomTemplates[2].capGeo, mushroomCapMaterialVariety3, counts[2]);
        mushroomCapInstancesVariety3.castShadow = true;
        scene.add(mushroomCapInstancesVariety3);
    }

    mushroomStemInstances = new THREE.InstancedMesh(mushroomTemplates[0].stemGeo, mushroomStemMaterial, MUSHROOM_COUNT);
    mushroomStemInstances.castShadow = true;
    scene.add(mushroomStemInstances);

    const instanceTypes = [];
    counts.forEach((count, typeIndex) => {
        for (let i = 0; i < count; i++) {
            instanceTypes.push(typeIndex + 1);
        }
    });
    for (let i = instanceTypes.length - 1; i > 0; i--) {
        const j = Math.floor(placementPrng.random() * (i + 1));
        [instanceTypes[i], instanceTypes[j]] = [instanceTypes[j], instanceTypes[i]];
    }

    const dummy = new THREE.Object3D();
    let v1Idx = 0, v2Idx = 0, v3Idx = 0;

    for (let i = 0; i < MUSHROOM_COUNT; i++) {
        let x, z, dist;
        do {
            x = placementPrng.randFloat(-SPREAD, SPREAD);
            z = placementPrng.randFloat(-SPREAD, SPREAD);
            dist = Math.sqrt(x * x + z * z);
        } while (dist < MIN_DISTANCE_FROM_GATEWAY_CENTER || dist > SPREAD * 0.9);

        const terrainY = getTerrainHeight(x, z);
        const scaleVariation = placementPrng.randFloat(0.5, 1.5);
        dummy.position.set(x, terrainY, z);
        dummy.rotation.y = placementPrng.random() * Math.PI * 2;
        dummy.scale.set(scaleVariation, scaleVariation, scaleVariation);
        dummy.updateMatrix();

        mushroomStemInstances.setMatrixAt(i, dummy.matrix);

        const mushroomType = instanceTypes[i];
        if (mushroomType === 1 && mushroomCapInstancesVariety1 && v1Idx < counts[0]) {
            mushroomCapInstancesVariety1.setMatrixAt(v1Idx++, dummy.matrix);
        } else if (mushroomType === 2 && mushroomCapInstancesVariety2 && v2Idx < counts[1]) {
            mushroomCapInstancesVariety2.setMatrixAt(v2Idx++, dummy.matrix);
        } else if (mushroomType === 3 && mushroomCapInstancesVariety3 && v3Idx < counts[2]) {
            mushroomCapInstancesVariety3.setMatrixAt(v3Idx++, dummy.matrix);
        }
    }

    mushroomStemInstances.instanceMatrix.needsUpdate = true;
    if (mushroomCapInstancesVariety1) mushroomCapInstancesVariety1.instanceMatrix.needsUpdate = true;
    if (mushroomCapInstancesVariety2) mushroomCapInstancesVariety2.instanceMatrix.needsUpdate = true;
    if (mushroomCapInstancesVariety3) mushroomCapInstancesVariety3.instanceMatrix.needsUpdate = true;

    console.log(`Added ${MUSHROOM_COUNT} mushrooms on varied terrain.`);
}

let spawnedMushrooms = [];
const MAX_SPAWNED_MUSHROOMS = 50;
const GRAVITY = 15.0; // A bit higher for a more "poppy" feel

let mushroomTemplates;

/**
 * Initializes mushroom geometry templates for spawning dynamic mushrooms.
 * Side effects: sets global mushroomTemplates variable.
 */
function initMushroomTemplates() {
    mushroomTemplates = createMushroomGeometries();
}

/**
 * Spawns a dynamic mushroom at the portal location and launches it with velocity.
 * Handles removal of oldest mushrooms if over limit.
 * Side effects: adds/removes meshes from scene, updates spawnedMushrooms array.
 */
function spawnMushroom() {
    if (spawnedMushrooms.length >= MAX_SPAWNED_MUSHROOMS) {
        const oldestMushroomData = spawnedMushrooms.shift();
        scene.remove(oldestMushroomData.mesh);
        oldestMushroomData.mesh.traverse(child => {
            if (child.isMesh && child.geometry) {
                child.geometry.dispose();
            }
        });
    }

    if (!mushroomTemplates || mushroomTemplates.length === 0) {
        console.error("Mushroom templates not initialized!");
        return;
    }

    const templateIndex = Math.floor(Math.random() * mushroomTemplates.length);
    const template = mushroomTemplates[templateIndex];

    const mushroomGroup = new THREE.Group();

    const stemMesh = new THREE.Mesh(template.stemGeo, mushroomStemMaterial);
    stemMesh.castShadow = true;
    
    let capMaterial;
    switch (template.type) {
        case 1: capMaterial = mushroomCapMaterialVariety1; break;
        case 2: capMaterial = mushroomCapMaterialVariety2; break;
        case 3: capMaterial = mushroomCapMaterialVariety3; break;
        default: capMaterial = mushroomCapMaterialVariety1;
    }
    const capMesh = new THREE.Mesh(template.capGeo, capMaterial);
    capMesh.castShadow = true;

    mushroomGroup.add(stemMesh);
    mushroomGroup.add(capMesh);
    
    if (!portalMesh) return;
    mushroomGroup.position.copy(portalMesh.position);
    mushroomGroup.position.y += 0.5;

    const initialVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,      // -2 to 2
        Math.random() * 3 + 7,          // 7 to 10
        (Math.random() * -3) - 5        // -5 to -8 (out of portal)
    );

    const randomRotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
    );

    const mushroomData = {
        mesh: mushroomGroup,
        velocity: initialVelocity,
        rotationSpeed: randomRotationSpeed,
        airborne: true
    };

    spawnedMushrooms.push(mushroomData);
    scene.add(mushroomGroup);
}

/**
 * Handles pointer (mouse/touch) down events for interaction.
 * Spawns a mushroom if the mushroom gate is clicked.
 * @param {PointerEvent} event - The pointer event.
 */
function onPointerDown(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    if (!mushroomGate) return;

    const intersects = raycaster.intersectObject(mushroomGate, true);

    if (intersects.length > 0) {
        spawnMushroom();
    }
}

/**
 * Initializes the Three.js scene, camera, renderer, controls, lighting, terrain, models, and event listeners.
 * Loads the mushroom gateway model and sets up the portal.
 * Side effects: sets up the entire scene and starts the app.
 */
function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const canvas = document.getElementById('c');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 1.9;

    ambientLight = new THREE.AmbientLight(0xffffff, daySettings.ambientLightIntensity); // Initial state is day
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(daySettings.directionalLightColor, daySettings.directionalLightIntensity); // Initial state is day
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = LIGHT_ORBIT_RADIUS * 2 + 10;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.bias = -0.0005;
    scene.add(directionalLight);

    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight.target);

    const sunGeometry = new THREE.SphereGeometry(1, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 1.0 });
    sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    // sunMesh.visible = false; // Will be made visible in applySceneState
    scene.add(sunMesh);

    const moonGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xe0e0ff, transparent: true, opacity: 1.0 });
    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.visible = false; // Start hidden
    scene.add(moonMesh);

    barkTexture = textureLoader.load('bark_texture.png');
    foliageTexture = textureLoader.load('foliage_texture.png');
    grassTexture = textureLoader.load('grass_texture.png');

    [barkTexture, foliageTexture, grassTexture].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });
    barkTexture.repeat.set(1, 2);
    foliageTexture.repeat.set(4, 4);
    grassTexture.repeat.set(40, 40);

    groundMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        color: daySettings.groundColor, // Initial state is day
        roughness: 0.9,
        metalness: 0.1
    });
    trunkMaterial = new THREE.MeshStandardMaterial({
        map: barkTexture,
        color: daySettings.trunkColor, // Initial state is day
        roughness: 0.9,
        metalness: 0.1
    });
    deciduousFoliageMaterial = new THREE.MeshStandardMaterial({
        map: foliageTexture,
        color: daySettings.deciduousFoliageColor, // Initial state is day
        roughness: 0.8,
        metalness: 0.1
    });
    coniferousFoliageMaterial = new THREE.MeshStandardMaterial({
        map: foliageTexture,
        color: daySettings.coniferousFoliageColor, // Initial state is day
        roughness: 0.8,
        metalness: 0.1
    });
    mushroomStemMaterial = new THREE.MeshStandardMaterial({
        color: 0xF5F5DC,
        roughness: 0.8,
        metalness: 0.1
    });
    mushroomCapMaterialVariety1 = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        roughness: 0.7,
        metalness: 0.2
    });
    mushroomCapMaterialVariety2 = new THREE.MeshStandardMaterial({
        color: 0xB8860B,
        roughness: 0.7,
        metalness: 0.2
    });
    mushroomCapMaterialVariety3 = new THREE.MeshStandardMaterial({
        color: 0xDAA520,
        roughness: 0.7,
        metalness: 0.2
    });

    const groundGeometry = new THREE.PlaneGeometry(100, 100, GROUND_SEGMENTS_W, GROUND_SEGMENTS_H);
    const positions = groundGeometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
        const px_local = positions.getX(i);
        const py_local = positions.getY(i);
        // pz_local is initially 0

        // worldX_for_noise is px_local
        // worldZ_for_noise is -py_local (because PlaneGeometry is in XY, then rotated -PI/2 about X)
        const height_worldY = getTerrainHeight(px_local, -py_local);
        positions.setZ(i, height_worldY); // Set local Z, which becomes world Y after rotation
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals(); // Crucial for correct lighting on the varied terrain

    groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    mtlLoader.load('/Enchanted_Fungal_Gate_0512162655_texture.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(
            '/Enchanted_Fungal_Gate_0512162655_texture.obj',
            (object) => {
                mushroomGate = object;
                mushroomGate.scale.set(1, 1, 1);
                
                // Initial position before terrain adjustment (to get bounding box correctly)
                mushroomGate.position.set(0, 0, 0);
                mushroomGate.updateMatrixWorld(); // Ensure transforms are applied for bounding box calc

                const boundingBox = new THREE.Box3().setFromObject(mushroomGate);
                const size = new THREE.Vector3();
                boundingBox.getSize(size);

                // Calculate terrain height at the gate's center
                const groundOffsetAtGate = getTerrainHeight(mushroomGate.position.x, mushroomGate.position.z);
                
                // Adjust gate's Y position to sit on terrain
                // -boundingBox.min.y aligns bottom of model with its local origin
                mushroomGate.position.y = -boundingBox.min.y + groundOffsetAtGate;
                mushroomGate.updateMatrixWorld(); // Update again after position change

                const worldBoundingBox = new THREE.Box3().setFromObject(mushroomGate); // Recalculate world BB
                const worldCenter = new THREE.Vector3();
                worldBoundingBox.getCenter(worldCenter); // This worldCenter now reflects the new Y position

                mushroomGate.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => { m.roughness = 0.7; m.metalness = 0.1; });
                            } else {
                                child.material.roughness = 0.7;
                                child.material.metalness = 0.1;
                            }
                        }
                    }
                });
                scene.add(mushroomGate);
                console.log('Model loaded successfully');

                const portalWidth = size.x * 0.4;
                const portalHeight = size.y * 0.65;
                const portalGeometry = new THREE.PlaneGeometry(portalWidth, portalHeight);

                portalMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        uTime: { value: 0 },
                        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
                    },
                    vertexShader: portalVertexShader,
                    fragmentShader: portalFragmentShader,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
                const yOffset = portalHeight * 0.20; // Original Y offset relative to gate center
                const zOffset = size.z * 0.1;    // Original Z offset relative to gate center
                
                // Portal position is relative to the (potentially elevated) worldCenter of the gate
                portalMesh.position.set(
                    worldCenter.x,
                    worldCenter.y - yOffset, 
                    worldCenter.z - zOffset 
                );
                scene.add(portalMesh);
                console.log("Portal added at:", portalMesh.position);

                // Camera target and position should also be relative to the adjusted gate position
                const cameraTarget = worldCenter.clone(); 
                cameraTarget.y = worldCenter.y + size.y * 0.1; 

                const cameraOffset = new THREE.Vector3(0, size.y * 0.4, worldBoundingBox.max.z + 2);
                camera.position.copy(cameraTarget).add(cameraOffset);
                controls.target.copy(cameraTarget);
                controls.update();

                createInstancedTrees();
                createInstancedMushrooms();
                initMushroomTemplates(); // Prepare for spawning

                // Initialize scene state based on isDaytime
                if (isDaytime) {
                    dayTimeProgress = 0.25; // Start mid-morning roughly
                    applySceneState(daySettings, dayTimeProgress);
                } else {
                    nightTimeProgress = 0.25;
                    applySceneState(nightSettings, nightTimeProgress);
                }
            },
            (xhr) => { console.log(`OBJ: ${(xhr.loaded / xhr.total * 100)}% loaded`); },
            (error) => { console.error('An error happened loading the OBJ:', error); }
        );
    },
    (xhr) => { console.log(`MTL: ${(xhr.loaded / xhr.total * 100)}% loaded`); },
    (error) => { console.error('An error happened loading the MTL:', error); }
    );

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('pointerdown', onPointerDown, false);

    const dayNightToggle = document.getElementById('day-night-toggle');
    dayNightToggle.textContent = isDaytime ? 'Switch to Night' : 'Switch to Day'; // Set initial button text
    dayNightToggle.addEventListener('click', () => {
        isDaytime = !isDaytime;
        if (isDaytime) {
            dayTimeProgress = 0;
            nightTimeProgress = 0;
            applySceneState(daySettings, dayTimeProgress);
        } else {
            nightTimeProgress = 0;
            dayTimeProgress = 0;
            applySceneState(nightSettings, nightTimeProgress);
        }
        dayNightToggle.textContent = isDaytime ? 'Switch to Night' : 'Switch to Day';
    });
}

/**
 * Handles window resize events to keep the renderer and camera aspect ratio in sync.
 * Side effects: updates renderer and camera.
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (portalMaterial) {
        portalMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
}

/**
 * Main animation loop. Updates time, handles day/night transitions, animates mushrooms, and renders the scene.
 * Side effects: updates scene, calls render().
 */
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (portalMaterial) {
        portalMaterial.uniforms.uTime.value = elapsedTime;
    }

    // Update spawned mushrooms
    spawnedMushrooms.forEach(mushroomData => {
        if (mushroomData.airborne) {
            // Apply gravity
            mushroomData.velocity.y -= GRAVITY * delta;
            
            // Update position
            mushroomData.mesh.position.add(mushroomData.velocity.clone().multiplyScalar(delta));
            
            // Update rotation (tumbling)
            mushroomData.mesh.rotation.x += mushroomData.rotationSpeed.x * delta;
            mushroomData.mesh.rotation.y += mushroomData.rotationSpeed.y * delta;
            mushroomData.mesh.rotation.z += mushroomData.rotationSpeed.z * delta;

            // Check for ground collision
            if (mushroomData.velocity.y < 0) { // Only check if falling
                const terrainHeight = getTerrainHeight(mushroomData.mesh.position.x, mushroomData.mesh.position.z);
                if (mushroomData.mesh.position.y < terrainHeight) {
                    mushroomData.mesh.position.y = terrainHeight;
                    mushroomData.airborne = false;
                    
                    // Align mushroom upright after landing
                    mushroomData.mesh.rotation.set(0, mushroomData.mesh.rotation.y, 0); 
                }
            }
        }
    });

    if (isDaytime) {
        dayTimeProgress += delta / DAY_CYCLE_DURATION;

        if (dayTimeProgress >= 1.0) {
            isDaytime = false;
            nightTimeProgress = 0;
            dayTimeProgress = 0;
            applySceneState(nightSettings, nightTimeProgress);
            document.getElementById('day-night-toggle').textContent = 'Switch to Night';
            console.log("Auto-transitioning to Night");
        } else {
            updateCelestialBodyPosition(dayTimeProgress, true);
        }
    } else {
        nightTimeProgress += delta / NIGHT_CYCLE_DURATION;

        if (nightTimeProgress >= 1.0) {
            isDaytime = true;
            dayTimeProgress = 0;
            nightTimeProgress = 0;
            applySceneState(daySettings, dayTimeProgress);
            document.getElementById('day-night-toggle').textContent = 'Switch to Day';
            console.log("Auto-transitioning to Day");
        } else {
            updateCelestialBodyPosition(nightTimeProgress, false);
        }
    }

    controls.update();
    render();
}

/**
 * Renders the current scene from the camera's perspective.
 */
function render() {
    renderer.render(scene, camera);
}

init();
animate();