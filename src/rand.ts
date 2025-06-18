import * as crypto from 'crypto';
import { DEFAULT_CHARSET } from './const';

/**
 * Cryptographically secure random utilities
 * Uses crypto module to replace Math.random() and Math.floor() for security.
 * Math.random() is not suitable for security-sensitive operations because it is not truly random and can be predictable.
 * This class provides methods that utilize cryptographic randomness, ensuring unpredictability and security.
 */
export class Crypto {
    /**
     * Generate a cryptographically secure random float between 0 and 1.
     * Replacement for Math.random().
     */
    static rand(): number {
        if (typeof window !== 'undefined' && window.crypto) {
            // Browser environment
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] / 0x100000000;
        } else {
            // Node.js environment
            const randomBytes = crypto.randomBytes(4);
            const randomUint32 = randomBytes.readUInt32BE(0);
            return randomUint32 / 0x100000000;
        }
    }

    /**
     * Generate a cryptographically secure random integer between min (inclusive) and max (exclusive).
     * Replacement for Math.floor(Math.random() * (max - min)) + min.
     */
    static randInt(min: number = 0, max: number = 100): number {
        if (min >= max) {
            throw new Error('min must be less than max');
        }

        const range = max - min;
        const randomFloat = Crypto.rand();
        return Math.floor(randomFloat * range) + min;
    }

    /**
     * Generate a cryptographically secure random integer between 0 and max (exclusive).
     * Direct replacement for Math.floor(Math.random() * max).
     */
    static randN(max: number): number {
        return Crypto.randInt(0, max);
    }

    /**
     * Generate random array index.
     * Replacement for Math.floor(Math.random() * array.length).
     */
    static randIndex<T>(array: T[]): number {
        if (array.length === 0) {
            throw new Error('Array cannot be empty');
        }
        return Crypto.randN(array.length);
    }

    /**
     * Pick random element from array.
     */
    static randChoice<T>(array: T[]): T {
        const index = Crypto.randIndex(array);
        return array[index];
    }

    /**
     * Generate weighted random choice.
     */
    static randWeighted<T>(items: T[], weights: number[]): T {
        if (items.length !== weights.length) {
            throw new Error('Items and weights arrays must have the same length');
        }

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const random = Crypto.rand() * totalWeight;

        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random <= sum) {
                return items[i];
            }
        }

        // Fallback to last item
        return items[items.length - 1];
    }

    /**
     * Shuffle array using Fisher-Yates algorithm with crypto random.
     */
    static shuffle<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Crypto.randN(i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generate cryptographically secure random string.
     */
    static randString(length: number, charset?: string): string {
        const chars = charset || DEFAULT_CHARSET;
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Crypto.randN(chars.length);
            result += chars.charAt(randomIndex);
        }
        return result;
    }

    /**
     * Generate random hex string.
     */
    static randHex(length: number): string {
        const bytes = crypto.randomBytes(Math.ceil(length / 2));
        return bytes.toString('hex').substring(0, length);
    }

    /**
     * Generate random base64 string.
     */
    static randBase64(length: number): string {
        const bytes = crypto.randomBytes(Math.ceil(length * 3 / 4));
        return bytes.toString('base64').substring(0, length);
    }

    /**
     * Generate random boolean with optional probability.
     */
    static randBool(probability: number = 0.5): boolean {
        return Crypto.rand() < probability;
    }

    /**
     * Generate random bytes.
     */
    static randBytes(size: number): Uint8Array | Buffer {
        if (typeof window !== 'undefined' && window.crypto) {
            // Browser environment
            const array = new Uint8Array(size);
            window.crypto.getRandomValues(array);
            return array;
        } else {
            // Node.js environment
            return crypto.randomBytes(size);
        }
    }

    /**
     * Generate UUID v4.
     */
    static randUUID(): string {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
            // Modern browsers with randomUUID support
            return window.crypto.randomUUID();
        } else if (typeof window !== 'undefined' && window.crypto) {
            // Older browsers with crypto support but no randomUUID
            // Implement UUID v4 using getRandomValues
            const rnds = new Uint8Array(16);
            window.crypto.getRandomValues(rnds);

            // Set version bits (V4)
            rnds[6] = (rnds[6] & 0x0f) | 0x40;
            // Set variant bits (RFC4122)
            rnds[8] = (rnds[8] & 0x3f) | 0x80;

            // Convert to hex string
            return [
                ...Array.from(rnds.subarray(0, 4)).map(b => b.toString(16).padStart(2, '0')),
                '-',
                ...Array.from(rnds.subarray(4, 6)).map(b => b.toString(16).padStart(2, '0')),
                '-',
                ...Array.from(rnds.subarray(6, 8)).map(b => b.toString(16).padStart(2, '0')),
                '-',
                ...Array.from(rnds.subarray(8, 10)).map(b => b.toString(16).padStart(2, '0')),
                '-',
                ...Array.from(rnds.subarray(10)).map(b => b.toString(16).padStart(2, '0')),
            ].join('');
        } else {
            // Node.js environment
            return crypto.randomUUID();
        }
    }

    /**
     * Generate random numbers for sensor data format.
     */
    static randFormat(count: number = 6, maxValue: number = 100, delimiter: string = ','): string {
        const numbers = [];
        for (let i = 0; i < count; i++) {
            const randomNum = Crypto.randN(maxValue);
            numbers.push(randomNum);
        }
        return numbers.join(delimiter);
    }

    /**
     * Generate cryptographically secure seed.
     */
    static randSeed(): number {
        const bytes = crypto.randomBytes(4);
        return bytes.readUInt32BE(0);
    }

    /**
     * Generate random version string (44 characters base64-like).
     */
    static randVersion(): string {
        const randomBytes = crypto.randomBytes(32);
        const base64Version = randomBytes.toString('base64');
        return base64Version;
    }

    /**
     * Generate random float in range.
     */
    static randFloat(min: number = 0, max: number = 1): number {
        return Crypto.rand() * (max - min) + min;
    }

    /**
     * Generate random with normal distribution (Box-Muller transform).
     */
    static randNormal(mean: number = 0, stdDev: number = 1): number {
        const u = 1 - Crypto.rand(); // Converting [0,1) to (0,1)
        const v = Crypto.rand();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z * stdDev + mean;
    }

    /**
     * Secure replacement for Math.random() with seed support.
     */
    static randSeeded(seed?: number): number {
        if (seed !== undefined) {
            // Create deterministic but secure random from seed
            const hash = crypto.createHash('sha256');
            hash.update(seed.toString());
            const hashBytes = hash.digest();
            const value = hashBytes.readUInt32BE(0);
            return value / 0x100000000;
        }
        return Crypto.rand();
    }
}

// Convenience exports - Go-style short names
export const {
    rand,
    randInt,
    randN,
    randIndex,
    randChoice,
    randWeighted,
    shuffle,
    randString,
    randHex,
    randBase64,
    randBool,
    randBytes,
    randUUID,
    randFormat,
    randSeed,
    randVersion,
    randFloat,
    randNormal,
    randSeeded
} = Crypto;
