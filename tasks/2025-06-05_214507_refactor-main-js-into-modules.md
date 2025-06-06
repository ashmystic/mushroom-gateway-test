# Refactor main.js into Modules

## Raw Request
Refactor the project to break up these files: main.js  
Start by just providing the plan for refactoring.  
ultra think step by step. be careful to not break the code  
use context7 mcp for threejs docs @three.js 

## Request Interpretation
The user wants to modularize the large main.js file by extracting logical sections into separate, well-named modules. The goal is to improve maintainability, clarity, and scalability, while ensuring the codebase remains functional at every step. The refactor should follow best practices and reference official Three.js documentation as needed.

## Implementation Plan
1. Analyze and map out main.js structure and responsibilities
2. Define module boundaries and propose a new file structure
3. Incrementally extract each section into its own module, updating imports/exports and testing after each step
4. Refactor shared utilities into a utils/ directory
5. Centralize initialization and app flow in a new entry point (e.g., app.js or minimal main.js)
6. Update HTML and asset references as needed
7. Add documentation and comments to all new modules
8. Test and validate after each major step
9. Final cleanup and code style consistency

## Tasks

| Task | Status | Complexity | Files/Modules Affected | Notes |
|------|---------|------------|----------------------|--------|
| [ ] Map out main.js structure | Pending | Medium | main.js | Identify all logical sections and dependencies |
| [ ] Propose and document new module/file structure | Pending | Low | N/A | Ensure all features are covered |
| [ ] Extract scene/camera/renderer setup | Pending | Medium | main.js, scene/SceneManager.js | Test after extraction |
| [ ] Extract terrain generation logic | Pending | Medium | main.js, terrain/TerrainGenerator.js | Includes Perlin noise |
| [ ] Extract tree instancing and placement | Pending | Medium | main.js, forest/TreeGenerator.js | Use shared utils |
| [ ] Extract mushroom instancing and placement | Pending | Medium | main.js, mushrooms/MushroomGenerator.js | Use shared utils |
| [ ] Extract day/night cycle and lighting | Pending | High | main.js, lighting/DayNightCycle.js | Includes fog, transitions |
| [ ] Extract camera controls setup | Pending | Low | main.js, controls/CameraControls.js | OrbitControls |
| [ ] Extract UI button logic | Pending | Low | main.js, ui/DayNightToggle.js | Event listeners |
| [ ] Extract portal shader code | Pending | Medium | main.js, shaders/PortalShader.js | GLSL and material setup |
| [ ] Extract model loading logic | Pending | Low | main.js, models/GatewayLoader.js | OBJ/MTL loading |
| [ ] Refactor shared utilities | Pending | Medium | main.js, utils/Random.js, utils/Constants.js | Seeded RNG, constants |
| [ ] Centralize app initialization | Pending | Medium | main.js, app.js | Entry point, animation loop |
| [ ] Update HTML and asset references | Pending | Low | index.html | Ensure correct script loading |
| [ ] Add documentation and comments | Pending | Low | All new modules | JSDoc style |
| [ ] Final cleanup and code style | Pending | Low | All modules | Consistency |

## Additional Details
- **Priority**: High
- **Estimated Time**: 1-2 days
- **Dependencies**: Three.js v0.166.1, existing main.js
- **Testing Requirements**: Test after each extraction, full regression test at end
- **Documentation Updates**: Update README and codebase feature map

## Progress Tracking
- [ ] Planning Phase
- [ ] Implementation Phase
- [ ] Testing Phase
- [ ] Documentation Phase
- [ ] Review Phase

## Implementation Notes
- 2025-06-05 21:45: Task created and plan documented
- 2025-06-05 22:00: Began extraction of SceneManager (scene, camera, renderer) to scene/SceneManager.js
- 2025-06-05 22:10: Began extraction of TerrainGenerator (terrain mesh, noise, height) to terrain/TerrainGenerator.js
- 2025-06-05 22:20: Began extraction of TreeGenerator (tree geometry, instancing, placement) to forest/TreeGenerator.js
- 2025-06-05 22:30: Began extraction of MushroomGenerator (mushroom geometry, instancing, placement, spawning) to mushrooms/MushroomGenerator.js
- 2025-06-05 22:40: Began extraction of DayNightCycle (lighting, day/night transitions, celestial logic) to lighting/DayNightCycle.js
- 2025-06-05 22:50: Began extraction of CameraControls (OrbitControls setup) to controls/CameraControls.js
- 2025-06-05 23:00: Began extraction of DayNightToggle (UI button logic) to ui/DayNightToggle.js
- 2025-06-05 23:10: Began extraction of PortalShader (GLSL, material setup) to shaders/PortalShader.js
- 2025-06-05 23:20: Began extraction of GatewayLoader (OBJ/MTL loading, portal mesh) to models/GatewayLoader.js
- 2025-06-05 23:30: Began extraction of Random (SeededRandom, placementPrng) to utils/Random.js and Constants to utils/Constants.js

## main.js Structure Mapping (2025-06-05)

**Major Sections Identified:**

1. **Imports and Global Declarations**
   - Three.js, controls, loaders, textures, global variables
2. **SeededRandom Utility Class**
   - Deterministic PRNG for procedural placement
3. **Constants and Parameters**
   - Counts, spread, terrain, lighting, color settings
4. **Lighting and Material Variables**
   - Light, material, and mesh references
5. **Day/Night Settings Objects**
   - Color, fog, intensity for day and night
6. **Celestial Body Logic**
   - updateCelestialBodyPosition, applySceneState
7. **Portal Shader Code**
   - Vertex and fragment GLSL, uniforms
8. **Terrain Generation Functions**
   - pseudoRandom, interpolatedNoise, getTerrainHeight
9. **Tree Generation and Placement**
   - createDeciduousTreeGeometry, createConiferousTreeGeometry, createInstancedTrees
10. **Mushroom Generation and Placement**
    - createMushroomGeometries, createInstancedMushrooms, initMushroomTemplates, spawnMushroom
11. **Event Handlers**
    - onPointerDown (spawning mushrooms)
12. **Scene Initialization (init)**
    - Scene, camera, renderer, controls, lighting, terrain, model loading, event listeners, UI
13. **Window Resize Handler**
    - onWindowResize
14. **Animation Loop**
    - animate (handles time, transitions, updates, calls render)
15. **Render Function**
    - render
16. **App Entry Point**
    - Calls to init() and animate()

**Key Dependencies:**
- Scene setup must precede terrain, trees, mushrooms, and model loading
- Lighting/materials are used by terrain, trees, mushrooms, and models
- Portal shader is used in model loading (portal mesh)
- Event handlers and UI depend on initialized scene and objects
- Animation loop updates all dynamic elements and transitions

**Next Step:**
- Propose and document the new module/file structure based on this mapping 

## Proposed Module/File Structure (2025-06-05)

**Directory Structure:**

- `scene/SceneManager.js` — Scene, camera, renderer setup and management
- `terrain/TerrainGenerator.js` — Terrain mesh creation, Perlin/value noise, height functions
- `forest/TreeGenerator.js` — Tree geometry, instancing, placement
- `mushrooms/MushroomGenerator.js` — Mushroom geometry, instancing, placement, dynamic spawning
- `lighting/DayNightCycle.js` — Lighting setup, day/night transitions, celestial body logic
- `controls/CameraControls.js` — OrbitControls and camera movement
- `ui/DayNightToggle.js` — UI button logic and event listeners
- `shaders/PortalShader.js` — Portal vertex/fragment GLSL and material setup
- `models/GatewayLoader.js` — OBJ/MTL loading and gateway/portal setup
- `utils/Random.js` — SeededRandom class and related helpers
- `utils/Constants.js` — All constants (counts, spread, terrain, lighting, etc.)
- `app.js` — Central entry point: imports modules, initializes app, animation loop

**Mapping main.js Sections to Modules:**

| main.js Section                        | New Module/File                        | Notes |
|----------------------------------------|----------------------------------------|-------|
| Imports and Global Declarations        | app.js, all modules                    | Imports split as needed |
| SeededRandom Utility Class             | utils/Random.js                        | Used by terrain, trees, mushrooms |
| Constants and Parameters               | utils/Constants.js                     | Shared across modules |
| Lighting and Material Variables        | lighting/DayNightCycle.js, scene/SceneManager.js | Split by responsibility |
| Day/Night Settings Objects             | lighting/DayNightCycle.js              | |
| Celestial Body Logic                   | lighting/DayNightCycle.js              | |
| Portal Shader Code                     | shaders/PortalShader.js                | |
| Terrain Generation Functions           | terrain/TerrainGenerator.js            | |
| Tree Generation and Placement          | forest/TreeGenerator.js                | |
| Mushroom Generation and Placement      | mushrooms/MushroomGenerator.js         | |
| Event Handlers                        | ui/DayNightToggle.js, app.js           | Pointer, resize, UI events |
| Scene Initialization (init)            | app.js, scene/SceneManager.js, models/GatewayLoader.js | Orchestrates all setup |
| Window Resize Handler                  | app.js, ui/DayNightToggle.js           | |
| Animation Loop                        | app.js                                 | Calls update/render on modules |
| Render Function                        | app.js, scene/SceneManager.js          | |
| App Entry Point                        | app.js                                 | |

**Special Considerations:**
- Initialization order: SceneManager → Terrain → Trees/Mushrooms → Lighting → Models → UI/Controls
- Shared state (scene, camera, renderer) should be passed or imported as needed
- All modules should be ES6 modules with clear exports
- app.js is responsible for wiring everything together and running the animation loop

**Next Step:**
- Begin extraction: start with SceneManager (scene/camera/renderer setup) 