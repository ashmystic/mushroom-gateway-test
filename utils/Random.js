/**
 * Seeded pseudo-random number generator using the Mulberry32 algorithm.
 * Used for deterministic procedural generation (e.g., tree/mushroom placement).
 */
export class SeededRandom {
    /**
     * @param {number} seed - The initial seed value for the PRNG.
     */
    constructor(seed) {
        this.seed = seed;
        if (this.seed === undefined || this.seed === null) {
            this.seed = Date.now();
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
    randInt(min, max) {
        return Math.floor(this.random() * (max - min) + min);
    }
}

/**
 * Returns a global SeededRandom instance for placement, with a fixed seed.
 * @returns {SeededRandom}
 */
export function getPlacementPrng() {
    const PLACEMENT_SEED = 54321;
    return new SeededRandom(PLACEMENT_SEED);
} 