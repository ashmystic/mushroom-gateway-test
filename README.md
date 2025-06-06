# Mushroom Gateway 3D Scene

An interactive 3D scene featuring a magical mushroom gateway created with Three.js, showcasing a procedurally generated forest environment with day/night cycle.

## Features

- Interactive 3D environment with a central mushroom gateway
- Dynamic day/night cycle with realistic lighting transitions
- Procedurally generated terrain with natural elevation changes
- Dense forest environment with:
  - 200 procedurally placed trees (mix of deciduous and coniferous)
  - 150 scattered mushrooms
  - Realistic textures for bark, foliage, and grass
- Interactive camera controls (orbit, pan, zoom)
- Responsive design that works on both desktop and mobile devices
- Day/night toggle button for manual control of the environment

## Codebase Feature Map

| Feature/Component                | Location in Codebase                | Description/Entry Points                                                                 |
|----------------------------------|-------------------------------------|-----------------------------------------------------------------------------------------|
| 3D Scene Setup                   | `main.js` (init, scene setup)       | Scene, camera, renderer, and lighting initialization                                    |
| Central Mushroom Gateway         | `main.js` (OBJ/MTL loading)         | Loads `Enchanted_Fungal_Gate_0512162655_texture.obj` and materials                      |
| Procedural Terrain Generation    | `main.js` (terrain functions)       | Functions: `getTerrainHeight`, Perlin noise, ground mesh creation                       |
| Procedural Tree Placement        | `main.js` (createInstancedTrees)    | Instanced rendering, seeded random placement, tree geometry functions                   |
| Procedural Mushroom Placement    | `main.js` (createInstancedMushrooms)| Instanced rendering, seeded random placement, mushroom geometry functions               |
| Day/Night Cycle                  | `main.js` (applySceneState, updateCelestialBodyPosition) | Handles lighting, fog, sun/moon movement, color transitions                |
| Interactive Camera Controls      | `main.js` (OrbitControls)           | User camera movement, zoom, pan                                                         |
| Portal Effects (Shaders)         | `main.js` (portalVertexShader, portalFragmentShader) | Custom GLSL shaders for portal visuals                                 |
| UI: Day/Night Toggle Button      | `index.html`, `main.js` (event listeners) | Button in HTML, logic in JS for toggling day/night                        |
| Responsive Design & Styling      | `style.css`                         | Canvas and button styling, mobile/desktop responsiveness                                 |
| 3D Model & Textures              | `.obj`, `.mtl`, `.png` files        | Gateway model and textures, tree/mushroom/ground textures                                |

## Technical Details

### File Structure

- `index.html` - Main HTML file that sets up the 3D scene container and loads dependencies
- `main.js` - Core application logic containing:
  - Scene setup and initialization
  - Procedural generation algorithms
  - Day/night cycle implementation
  - Interactive controls
  - Custom shaders for portal effects
- `style.css` - Styling for the UI elements and canvas
- 3D Model Files:
  - `Enchanted_Fungal_Gate_0512162655_texture.obj` - Main gateway model
  - `Enchanted_Fungal_Gate_0512162655_texture.mtl` - Material definitions
  - `Enchanted_Fungal_Gate_0512162655_texture.png` - Gateway textures
- Texture Files:
  - `bark_texture.png` - Tree bark texture
  - `foliage_texture.png` - Tree foliage texture
  - `grass_texture.png` - Ground texture

### Dependencies

- Three.js (v0.166.1) - 3D graphics library
- Three.js Addons:
  - OrbitControls - Camera controls
  - MTLLoader - Material loading
  - OBJLoader - 3D model loading

### Key Features Implementation

1. **Procedural Generation**
   - Uses seeded random number generation for consistent placement
   - Implements Perlin noise for terrain generation
   - Custom algorithms for tree and mushroom placement

2. **Day/Night Cycle**
   - Smooth transitions between day and night states
   - Dynamic lighting and color adjustments
   - Animated sun and moon movement
   - Custom fog effects for atmosphere

3. **Performance Optimizations**
   - Instanced rendering for trees and mushrooms
   - Efficient terrain generation
   - Optimized shader implementations

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Use mouse/touch controls to navigate:
   - Left click/touch drag to rotate
   - Right click/two finger drag to pan
   - Scroll/pinch to zoom
4. Click the "Switch to Day/Night" button to toggle the environment state

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Notes

The scene is optimized for modern devices but may require adjusting the `TREE_COUNT` and `MUSHROOM_COUNT` constants in `main.js` for lower-end devices.