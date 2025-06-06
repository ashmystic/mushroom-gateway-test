/**
 * Shared constants for procedural generation, terrain, lighting, and placement.
 */
export const TREE_COUNT = 200;
export const SPREAD = 20;
export const MIN_DISTANCE_FROM_CENTER_TREES = 5;
export const MUSHROOM_COUNT = 150;
export const MIN_DISTANCE_FROM_GATEWAY_CENTER = 1.0;
// Terrain parameters
export const GROUND_SEGMENTS_W = 64;
export const GROUND_SEGMENTS_H = 64;
export const TERRAIN_MAX_HEIGHT = 3.5;
export const TERRAIN_BASE_FREQUENCY = 0.04;
export const TERRAIN_OCTAVES = 5;
export const TERRAIN_PERSISTENCE = 0.45;
export const TERRAIN_LACUNARITY = 2.1;
// Lighting and day/night cycle
export const LIGHT_ORBIT_RADIUS = 25;
export const DAY_CYCLE_DURATION = 60;
export const NIGHT_CYCLE_DURATION = 45;
export const MAX_SPAWNED_MUSHROOMS = 50;
export const GRAVITY = 15.0; 