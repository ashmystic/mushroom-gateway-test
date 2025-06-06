// app.js
// Entry point for the modular Mushroom Gateway 3D Scene
// Incrementally integrates all modules and orchestrates app flow

import { initScene, getScene, getCamera, getRenderer } from './scene/SceneManager.js';
import { createGroundMesh } from './terrain/TerrainGenerator.js';
import { createInstancedTrees } from './forest/TreeGenerator.js';
import { createInstancedMushrooms, initMushroomTemplates, spawnMushroom } from './mushrooms/MushroomGenerator.js';
import { daySettings, nightSettings, applySceneState } from './lighting/DayNightCycle.js';
import { createCameraControls } from './controls/CameraControls.js';
import { initDayNightToggle } from './ui/DayNightToggle.js';
import { portalVertexShader, portalFragmentShader, createPortalMaterial } from './shaders/PortalShader.js';
import { loadGatewayModel } from './models/GatewayLoader.js';
import { SeededRandom, getPlacementPrng } from './utils/Random.js';
import * as CONST from './utils/Constants.js';
import * as THREE from 'three';

// --- Top-level app state ---
let controls;
let ambientLight, directionalLight;
let sunMesh, moonMesh;
let groundMaterial, trunkMaterial, deciduousFoliageMaterial, coniferousFoliageMaterial;
let mushroomStemMaterial, mushroomCapMaterialVariety1, mushroomCapMaterialVariety2, mushroomCapMaterialVariety3;
let mushroomGate, portalMesh;
let placementPrng;
let isDaytime = true;
let dayTimeProgress = 0;
let nightTimeProgress = 0;
const clock = new THREE.Clock();
let spawnedMushrooms = [];
let mushroomTemplates;

// --- Initialization ---
function init() {
  // 1. Scene, camera, renderer
  const canvas = document.getElementById('c');
  initScene(canvas);
  const scene = getScene();
  const camera = getCamera();
  const renderer = getRenderer();

  // 2. Controls
  controls = createCameraControls(camera, renderer.domElement);

  // 3. Lighting
  ambientLight = new THREE.AmbientLight(0xffffff, daySettings.ambientLightIntensity);
  scene.add(ambientLight);
  directionalLight = new THREE.DirectionalLight(daySettings.directionalLightColor, daySettings.directionalLightIntensity);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  directionalLight.target.position.set(0, 0, 0);
  scene.add(directionalLight.target);

  // 4. Sun and Moon meshes
  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 1.0 }));
  scene.add(sunMesh);
  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xe0e0ff, transparent: true, opacity: 1.0 }));
  moonMesh.visible = false;
  scene.add(moonMesh);

  // 5. Textures and Materials (TODO: load textures, set up materials)
  // ...

  // 6. Terrain
  // groundMaterial = ...
  // const groundMesh = createGroundMesh(groundMaterial);
  // scene.add(groundMesh);

  // 7. Trees
  // createInstancedTrees({ ... });

  // 8. Mushrooms
  // createInstancedMushrooms({ ... });
  // mushroomTemplates = initMushroomTemplates();

  // 9. Gateway Model and Portal
  // loadGatewayModel({ ... });

  // 10. UI
  initDayNightToggle({
    getIsDaytime: () => isDaytime,
    onToggle: () => {
      isDaytime = !isDaytime;
      // TODO: update scene state
    }
  });

  // 11. Event Listeners (resize, pointer, etc.)
  window.addEventListener('resize', onWindowResize, false);
  // window.addEventListener('pointerdown', onPointerDown, false);

  // 12. Initial scene state
  // applySceneState({ ... });
}

function onWindowResize() {
  const camera = getCamera();
  const renderer = getRenderer();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // TODO: update portalMaterial resolution uniform
}

function animate() {
  requestAnimationFrame(animate);
  // TODO: update time, transitions, mushrooms, controls, render
}

// --- App Entry Point ---
init();
animate(); 