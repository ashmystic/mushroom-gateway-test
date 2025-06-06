import * as THREE from 'three';

/**
 * Provides lighting setup, day/night transitions, and celestial body logic for the scene.
 */

/**
 * Day and night settings for lighting, fog, and colors.
 */
export const daySettings = {
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

export const nightSettings = {
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

/**
 * Updates the position and visibility of the sun or moon mesh and the directional light
 * based on the current progress through the day or night cycle.
 * @param {object} params - { progress, isDay, directionalLight, sunMesh, moonMesh, LIGHT_ORBIT_RADIUS, isDaytime }
 */
export function updateCelestialBodyPosition({
    progress,
    isDay,
    directionalLight,
    sunMesh,
    moonMesh,
    LIGHT_ORBIT_RADIUS,
    isDaytime
}) {
    const alpha = (1.0 - progress) * Math.PI;
    const x = LIGHT_ORBIT_RADIUS * Math.cos(alpha);
    const y = LIGHT_ORBIT_RADIUS * Math.sin(alpha);
    const z = LIGHT_ORBIT_RADIUS * Math.cos(alpha - Math.PI / 2);
    if (directionalLight) {
        directionalLight.position.set(z, y, x);
        directionalLight.target.position.set(0, 0, 0);
        directionalLight.target.updateMatrixWorld();
    }
    const meshToUpdate = isDay ? sunMesh : moonMesh;
    if (meshToUpdate) {
        meshToUpdate.position.set(z, y, x);
        const heightFactor = Math.max(0, y / LIGHT_ORBIT_RADIUS);
        meshToUpdate.material.opacity = THREE.MathUtils.smoothstep(heightFactor, 0.05, 0.15);
        meshToUpdate.material.transparent = true;
        meshToUpdate.scale.setScalar(Math.max(0.5, heightFactor * (isDay ? 1.2 : 1.0) + 0.1));
        meshToUpdate.visible = (isDay === isDaytime) && y > -0.1;
    }
    const meshToHide = isDay ? moonMesh : sunMesh;
    if (meshToHide) {
        meshToHide.visible = false;
    }
}

/**
 * Applies the current scene state (lighting, fog, colors) for day or night.
 * Also updates celestial body positions.
 * @param {object} params - { scene, ambientLight, directionalLight, groundMaterial, trunkMaterial, deciduousFoliageMaterial, coniferousFoliageMaterial, settings, progress, isDaytime, sunMesh, moonMesh, LIGHT_ORBIT_RADIUS }
 */
export function applySceneState({
    scene,
    ambientLight,
    directionalLight,
    groundMaterial,
    trunkMaterial,
    deciduousFoliageMaterial,
    coniferousFoliageMaterial,
    settings,
    progress,
    isDaytime,
    sunMesh,
    moonMesh,
    LIGHT_ORBIT_RADIUS
}) {
    scene.background = settings.background;
    scene.fog = settings.fog;
    if (ambientLight) ambientLight.intensity = settings.ambientLightIntensity;
    if (directionalLight) {
        directionalLight.intensity = settings.directionalLightIntensity;
        directionalLight.color.set(settings.directionalLightColor);
    }
    updateCelestialBodyPosition({
        progress,
        isDay: isDaytime,
        directionalLight,
        sunMesh,
        moonMesh,
        LIGHT_ORBIT_RADIUS,
        isDaytime
    });
    if (groundMaterial) groundMaterial.color.set(settings.groundColor);
    if (trunkMaterial) trunkMaterial.color.set(settings.trunkColor);
    if (deciduousFoliageMaterial) deciduousFoliageMaterial.color.set(settings.deciduousFoliageColor);
    if (coniferousFoliageMaterial) coniferousFoliageMaterial.color.set(settings.coniferousFoliageColor);
} 