// forest/TreeGenerator.js
import * as THREE from 'three';
// import { getTerrainHeight } from '../terrain/TerrainGenerator.js';
// import { placementPrng } from '../utils/Random.js';

/**
 * Provides functions for creating tree geometries and instanced placement.
 */

/**
 * Creates geometry for a single deciduous tree (trunk and foliage).
 * @param {object} prng - Seeded random number generator.
 * @returns {{trunkGeo: THREE.CylinderGeometry, foliageGeo: THREE.SphereGeometry}}
 */
export function createDeciduousTreeGeometry(prng) {
    const trunkHeight = prng.randFloat(1.5, 2.5);
    const trunkRadius = trunkHeight * 0.1;
    const foliageRadius = trunkHeight * 0.5;
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 16);
    trunkGeo.translate(0, trunkHeight / 2, 0);
    const foliageGeo = new THREE.SphereGeometry(foliageRadius, 16, 12);
    foliageGeo.translate(
        prng.randFloat(-trunkRadius * 0.5, trunkRadius * 0.5),
        trunkHeight + foliageRadius * 0.6,
        prng.randFloat(-trunkRadius * 0.5, trunkRadius * 0.5)
    );
    return { trunkGeo, foliageGeo };
}

/**
 * Creates geometry for a single coniferous tree (trunk and foliage).
 * @param {object} prng - Seeded random number generator.
 * @returns {{trunkGeo: THREE.CylinderGeometry, foliageGeo: THREE.ConeGeometry}}
 */
export function createConiferousTreeGeometry(prng) {
    const trunkHeight = prng.randFloat(2.0, 3.5);
    const trunkRadius = trunkHeight * 0.08;
    const coneRadius = trunkHeight * 0.3;
    const coneHeight = trunkHeight * 0.9;
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 16);
    trunkGeo.translate(0, trunkHeight / 2, 0);
    const foliageGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    foliageGeo.translate(0, trunkHeight + coneHeight / 2 - trunkHeight * 0.1, 0);
    return { trunkGeo, foliageGeo };
}

/**
 * Creates and places all instanced trees in the scene using procedural placement.
 * Adds instanced meshes to the scene.
 * @param {THREE.Scene} scene - The scene to add trees to.
 * @param {object} prng - Seeded random number generator.
 * @param {function} getTerrainHeight - Function to get terrain height at (x, z).
 * @param {THREE.Material} trunkMaterial
 * @param {THREE.Material} deciduousFoliageMaterial
 * @param {THREE.Material} coniferousFoliageMaterial
 * @param {number} TREE_COUNT
 * @param {number} SPREAD
 * @param {number} MIN_DISTANCE_FROM_CENTER_TREES
 */
export function createInstancedTrees({
    scene,
    prng,
    getTerrainHeight,
    trunkMaterial,
    deciduousFoliageMaterial,
    coniferousFoliageMaterial,
    TREE_COUNT,
    SPREAD,
    MIN_DISTANCE_FROM_CENTER_TREES
}) {
    const deciduousTemplate = createDeciduousTreeGeometry(prng);
    const coniferousTemplate = createConiferousTreeGeometry(prng);
    const deciduousCount = Math.floor(TREE_COUNT / 2);
    const coniferousCount = TREE_COUNT - deciduousCount;
    const deciduousTrunkInstances = new THREE.InstancedMesh(deciduousTemplate.trunkGeo, trunkMaterial, deciduousCount);
    const deciduousFoliageInstances = new THREE.InstancedMesh(deciduousTemplate.foliageGeo, deciduousFoliageMaterial, deciduousCount);
    const coniferousTrunkInstances = new THREE.InstancedMesh(coniferousTemplate.trunkGeo, trunkMaterial, coniferousCount);
    const coniferousFoliageInstances = new THREE.InstancedMesh(coniferousTemplate.foliageGeo, coniferousFoliageMaterial, coniferousCount);
    deciduousTrunkInstances.castShadow = true;
    deciduousFoliageInstances.castShadow = true;
    coniferousTrunkInstances.castShadow = true;
    coniferousFoliageInstances.castShadow = true;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < deciduousCount; i++) {
        let x, z, dist;
        do {
            x = prng.randFloat(-SPREAD, SPREAD);
            z = prng.randFloat(-SPREAD, SPREAD);
            dist = Math.sqrt(x * x + z * z);
        } while (dist < MIN_DISTANCE_FROM_CENTER_TREES);
        const terrainY = getTerrainHeight(x, z);
        const scaleVariation = prng.randFloat(0.8, 1.2);
        dummy.position.set(x, terrainY, z);
        dummy.rotation.y = prng.random() * Math.PI * 2;
        dummy.scale.set(scaleVariation, scaleVariation, scaleVariation);
        dummy.updateMatrix();
        deciduousTrunkInstances.setMatrixAt(i, dummy.matrix);
        deciduousFoliageInstances.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < coniferousCount; i++) {
        let x, z, dist;
        do {
            x = prng.randFloat(-SPREAD, SPREAD);
            z = prng.randFloat(-SPREAD, SPREAD);
            dist = Math.sqrt(x * x + z * z);
        } while (dist < MIN_DISTANCE_FROM_CENTER_TREES);
        const terrainY = getTerrainHeight(x, z);
        const scaleVariation = prng.randFloat(0.7, 1.1);
        dummy.position.set(x, terrainY, z);
        dummy.rotation.y = prng.random() * Math.PI * 2;
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
} 