// mushrooms/MushroomGenerator.js
import * as THREE from 'three';
// import { getTerrainHeight } from '../terrain/TerrainGenerator.js';
// import { placementPrng } from '../utils/Random.js';

/**
 * Provides functions for creating mushroom geometries, instanced placement, and dynamic spawning.
 */

/**
 * Creates geometry templates for different mushroom varieties.
 * @returns {Array<{stemGeo: THREE.CylinderGeometry, capGeo: THREE.Geometry, type: number}>}
 */
export function createMushroomGeometries() {
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
 * @param {THREE.Scene} scene - The scene to add mushrooms to.
 * @param {object} prng - Seeded random number generator.
 * @param {function} getTerrainHeight - Function to get terrain height at (x, z).
 * @param {THREE.Material} stemMaterial
 * @param {Array<THREE.Material>} capMaterials - Array of cap materials for each variety
 * @param {number} MUSHROOM_COUNT
 * @param {number} SPREAD
 * @param {number} MIN_DISTANCE_FROM_GATEWAY_CENTER
 */
export function createInstancedMushrooms({
    scene,
    prng,
    getTerrainHeight,
    stemMaterial,
    capMaterials,
    MUSHROOM_COUNT,
    SPREAD,
    MIN_DISTANCE_FROM_GATEWAY_CENTER
}) {
    const mushroomTemplates = createMushroomGeometries();
    const countPerVariety = Math.floor(MUSHROOM_COUNT / mushroomTemplates.length);
    const remaining = MUSHROOM_COUNT % mushroomTemplates.length;
    const counts = mushroomTemplates.map((_, index) => countPerVariety + (index < remaining ? 1 : 0));
    const capInstances = [];
    for (let i = 0; i < mushroomTemplates.length; i++) {
        if (counts[i] > 0) {
            const capInstance = new THREE.InstancedMesh(mushroomTemplates[i].capGeo, capMaterials[i], counts[i]);
            capInstance.castShadow = true;
            scene.add(capInstance);
            capInstances.push(capInstance);
        } else {
            capInstances.push(null);
        }
    }
    const stemInstances = new THREE.InstancedMesh(mushroomTemplates[0].stemGeo, stemMaterial, MUSHROOM_COUNT);
    stemInstances.castShadow = true;
    scene.add(stemInstances);
    const instanceTypes = [];
    counts.forEach((count, typeIndex) => {
        for (let i = 0; i < count; i++) {
            instanceTypes.push(typeIndex + 1);
        }
    });
    for (let i = instanceTypes.length - 1; i > 0; i--) {
        const j = Math.floor(prng.random() * (i + 1));
        [instanceTypes[i], instanceTypes[j]] = [instanceTypes[j], instanceTypes[i]];
    }
    const dummy = new THREE.Object3D();
    let vIdx = [0, 0, 0];
    for (let i = 0; i < MUSHROOM_COUNT; i++) {
        let x, z, dist;
        do {
            x = prng.randFloat(-SPREAD, SPREAD);
            z = prng.randFloat(-SPREAD, SPREAD);
            dist = Math.sqrt(x * x + z * z);
        } while (dist < MIN_DISTANCE_FROM_GATEWAY_CENTER || dist > SPREAD * 0.9);
        const terrainY = getTerrainHeight(x, z);
        const scaleVariation = prng.randFloat(0.5, 1.5);
        dummy.position.set(x, terrainY, z);
        dummy.rotation.y = prng.random() * Math.PI * 2;
        dummy.scale.set(scaleVariation, scaleVariation, scaleVariation);
        dummy.updateMatrix();
        stemInstances.setMatrixAt(i, dummy.matrix);
        const mushroomType = instanceTypes[i];
        if (capInstances[mushroomType - 1] && vIdx[mushroomType - 1] < counts[mushroomType - 1]) {
            capInstances[mushroomType - 1].setMatrixAt(vIdx[mushroomType - 1]++, dummy.matrix);
        }
    }
    stemInstances.instanceMatrix.needsUpdate = true;
    capInstances.forEach(inst => { if (inst) inst.instanceMatrix.needsUpdate = true; });
}

/**
 * Initializes mushroom geometry templates for spawning dynamic mushrooms.
 * @returns {Array} Array of mushroom templates
 */
export function initMushroomTemplates() {
    return createMushroomGeometries();
}

/**
 * Spawns a dynamic mushroom at a given position with velocity and adds it to the scene.
 * @param {THREE.Scene} scene
 * @param {Array} mushroomTemplates
 * @param {THREE.Material} stemMaterial
 * @param {Array<THREE.Material>} capMaterials
 * @param {THREE.Vector3} position
 * @param {function} getRandom - Function to get a random float in [0,1)
 * @returns {THREE.Group} The spawned mushroom group
 */
export function spawnMushroom({
    scene,
    mushroomTemplates,
    stemMaterial,
    capMaterials,
    position,
    getRandom
}) {
    const templateIndex = Math.floor(getRandom() * mushroomTemplates.length);
    const template = mushroomTemplates[templateIndex];
    const mushroomGroup = new THREE.Group();
    const stemMesh = new THREE.Mesh(template.stemGeo, stemMaterial);
    stemMesh.castShadow = true;
    let capMaterial = capMaterials[templateIndex];
    const capMesh = new THREE.Mesh(template.capGeo, capMaterial);
    capMesh.castShadow = true;
    mushroomGroup.add(stemMesh);
    mushroomGroup.add(capMesh);
    mushroomGroup.position.copy(position);
    scene.add(mushroomGroup);
    return mushroomGroup;
} 