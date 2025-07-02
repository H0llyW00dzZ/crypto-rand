import * as crypto from 'crypto';
import { DEFAULT_CHARSET, LOWERCASE_CHARSET, NUMERIC_CHARSET, SPECIAL_CHARSET, UPPERCASE_CHARSET } from './const';
import { isProbablePrime } from './math_helper';

/**
 * Cryptographically secure random utilities
 * Uses crypto module to replace Math.random() and Math.floor() for security.
 * Math.random() is not suitable for security-sensitive operations because it is not truly random and can be predictable.
 * This class provides methods that utilize cryptographic randomness, ensuring unpredictability and security.
 */
export class Crypto {
    /**
     * Check if running in browser environment
     */
    private static isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof window.crypto !== 'undefined';
    }

    /**
     * Check if Web Crypto API is available with getRandomValues
     */
    private static hasWebCrypto(): boolean {
        return Crypto.isBrowser() && typeof window.crypto.getRandomValues === 'function';
    }

    /**
     * Throw error for Node.js-only methods when running in browser
     */
    private static throwBrowserError(methodName: string): never {
        throw new Error(`${methodName} is not available in browser environment. This method requires Node.js crypto module.`);
    }

    /**
     * Generate a cryptographically secure random float between 0 and 1.
     * Replacement for Math.random().
     */
    static rand(): number {
        if (Crypto.hasWebCrypto()) {
            // Browser environment
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] / 0x100000000;
        } else if (typeof crypto !== 'undefined' && crypto.randomBytes) {
            // Node.js environment
            const randomBytes = crypto.randomBytes(4);
            const randomUint32 = randomBytes.readUInt32BE(0);
            return randomUint32 / 0x100000000;
        } else {
            throw new Error('No secure random number generator available. Please use in Node.js environment or modern browser with Web Crypto API.');
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
     * Note: Only available in Node.js environment.
     */
    static randHex(length: number): string {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randHex');
        }

        const bytes = crypto.randomBytes(Math.ceil(length / 2));
        return bytes.toString('hex').substring(0, length);
    }

    /**
     * Generate random base64 string.
     * Note: Only available in Node.js environment.
     */
    static randBase64(length: number): string {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randBase64');
        }

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
        if (Crypto.hasWebCrypto()) {
            // Browser environment
            const array = new Uint8Array(size);
            window.crypto.getRandomValues(array);
            return array;
        } else if (typeof crypto !== 'undefined' && crypto.randomBytes) {
            // Node.js environment
            return crypto.randomBytes(size);
        } else {
            throw new Error('No secure random bytes generator available. Please use in Node.js environment or modern browser with Web Crypto API.');
        }
    }

    /**
     * Generate UUID v4.
     */
    static randUUID(): string {
        if (Crypto.isBrowser() && window.crypto.randomUUID) {
            // Modern browsers with randomUUID support
            return window.crypto.randomUUID();
        } else if (Crypto.hasWebCrypto()) {
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
        } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            // Node.js environment
            return crypto.randomUUID();
        } else {
            throw new Error('UUID generation not available. Please use in Node.js environment or modern browser with Web Crypto API.');
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
     * Note: Only available in Node.js environment.
     */
    static randSeed(): number {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randSeed');
        }

        const bytes = crypto.randomBytes(4);
        return bytes.readUInt32BE(0);
    }

    /**
     * Generate random version string (44 characters base64-like).
     * Note: Only available in Node.js environment.
     */
    static randVersion(): string {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randVersion');
        }

        const randomBytes = crypto.randomBytes(32);
        let base64Version: string;
        base64Version = randomBytes.toString('base64');
        return base64Version;
    }

    /**
     * Generate random float in range.
     */
    static randFloat(min: number = 0, max: number = 1): number {
        return Crypto.rand() * (max - min) + min;
    }

    /**
     * Generate random number with normal distribution using Box-Muller transform.
     * 
     * This method is similar to randGaussian but ensures that the logarithm function
     * never receives zero by converting [0,1) to (0,1).
     * 
     * Steps:
     * 
     * 1. Generate two independent uniform random numbers:
     *    - (u) is adjusted to be in the interval (0, 1) by using 1 - Crypto.rand().
     *    - (v) is a standard uniform random number in [0, 1).
     * 2. Apply the Box-Muller transform:
     *    - Compute z = √(-2 × ln(u)) × cos(2π × v)
     *    - This gives z, a standard normally distributed random number (mean = 0, std dev = 1).
     * 3. Scale and shift z to have the desired mean and standard deviation:
     *    - Return z × stdDev + mean
     */
    static randNormal(mean: number = 0, stdDev: number = 1): number {
        const u = 1 - Crypto.rand(); // Converting [0,1) to (0,1)
        const v = Crypto.rand();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z * stdDev + mean;
    }

    /**
     * Secure replacement for Math.random() with seed support.
     * Note: Seeded functionality only available in Node.js environment.
     */
    static randSeeded(seed?: number): number {
        if (seed !== undefined) {
            if (Crypto.isBrowser()) {
                Crypto.throwBrowserError('randSeeded (with seed parameter)');
            }
            // Create deterministic but secure random from seed
            const hash = crypto.createHash('sha256');
            hash.update(seed.toString());
            const hashBytes = hash.digest();
            const value = hashBytes.readUInt32BE(0);
            return value / 0x100000000;
        }
        return Crypto.rand();
    }

    /**
     * Check if current environment supports all features.
     */
    static isFullySupported(): boolean {
        return !Crypto.isBrowser();
    }

    /**
     * Get list of methods that are not supported in current environment.
     */
    static getUnsupportedMethods(): string[] {
        if (Crypto.isBrowser()) {
            return [
                'randHex',
                'randBase64',
                'randSeed',
                'randVersion',
                'randSeeded (with seed parameter)',
                'randLattice',
                'randPrime',
                'randBigInt'
            ];
        }
        return [];
    }

    /**
     * Get environment info.
     */
    static getEnvironmentInfo(): {
        isBrowser: boolean;
        hasWebCrypto: boolean;
        hasRandomUUID: boolean;
        supportedMethods: string[];
        unsupportedMethods: string[];
    } {
        const isBrowser = Crypto.isBrowser();
        const hasWebCrypto = Crypto.hasWebCrypto();
        const hasRandomUUID = isBrowser ?
            (window.crypto && typeof window.crypto.randomUUID === 'function') :
            (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function');

        const allMethods = [
            'rand', 'randInt', 'randN', 'randIndex', 'randChoice', 'randWeighted',
            'shuffle', 'randString', 'randHex', 'randBase64', 'randBool', 'randBytes',
            'randUUID', 'randFormat', 'randSeed', 'randVersion', 'randFloat', 'randNormal',
            'randSeeded', 'randSubset', 'randGaussian', 'randWalk', 'randPassword', 'randLattice',
            'randPrime', 'randBigInt', 'randExponential'
        ];

        const unsupportedMethods = Crypto.getUnsupportedMethods();
        const supportedMethods = allMethods.filter(method => !unsupportedMethods.includes(method));

        return {
            isBrowser,
            hasWebCrypto,
            hasRandomUUID,
            supportedMethods,
            unsupportedMethods
        };
    }

    /**
     * Generate a random subset of a given size from an array.
     */
    static randSubset<T>(array: T[], size: number): T[] {
        if (size > array.length) {
            throw new Error('Subset size cannot be larger than the array size');
        }

        const shuffled = Crypto.shuffle(array);
        return shuffled.slice(0, size);
    }

    /**
     * Generate random number with Gaussian distribution using Box-Muller transform.
     * 
     * Steps:
     * 
     * 1. Generate two independent uniform random numbers (u₁) and (u₂) in the interval [0, 1).
     * 2. Apply the Box-Muller transform:
     *    - Compute z₀ = √(-2 × ln(u₁)) × cos(2π × u₂)
     *    - This gives z₀, a standard normally distributed random number (mean = 0, std dev = 1).
     * 3. Scale and shift z₀ to have the desired mean and standard deviation:
     *    - Return z₀ × stdDev + mean
     */
    static randGaussian(mean: number = 0, stdDev: number = 1): number {
        // Uniform random number in [0, 1)
        const u1 = Crypto.rand();
        // Uniform random number in [0, 1)
        const u2 = Crypto.rand();
        // Theoretically could encounter Math.log(0) if returns exactly 0 (though this is extremely unlikely with cryptographic randomness 🤪) Crypto.rand()
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    }

    /**
     * Generate random walk sequence.
     */
    static randWalk(steps: number, stepSize: number = 1): number[] {
        const walk = [0];
        let position = 0;

        for (let i = 0; i < steps; i++) {
            const direction = Crypto.randBool() ? 1 : -1;
            position += direction * stepSize;
            walk.push(position);
        }

        return walk;
    }

    /**
     * Generate cryptographically secure password with configurable requirements.
     * 
     * Note: This method is different from randString as it focuses specifically on password generation
     * with built-in character type controls, password-specific features like excluding similar-looking
     * characters (0O1lI), and ensuring proper character distribution for strong passwords.
     * While randString is a general-purpose string generator, randPassword is optimized for creating
     * secure passwords with common password policy requirements.
     */
    static randPassword(options: {
        length: number;
        includeUppercase?: boolean;
        includeLowercase?: boolean;
        includeNumbers?: boolean;
        includeSymbols?: boolean;
        excludeSimilar?: boolean;
        customChars?: string;
    }): string {
        const {
            length,
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSymbols = false,
            excludeSimilar = false,
            customChars
        } = options;

        if (customChars) {
            return Crypto.randString(length, customChars);
        }

        let charset = '';
        if (includeUppercase) charset += UPPERCASE_CHARSET;
        if (includeLowercase) charset += LOWERCASE_CHARSET;
        if (includeNumbers) charset += NUMERIC_CHARSET;
        if (includeSymbols) charset += SPECIAL_CHARSET;

        if (excludeSimilar) {
            charset = charset.replace(/[0O1lI]/g, '');
        }

        if (!charset) {
            throw new Error('At least one character type must be enabled');
        }

        return Crypto.randString(length, charset);
    }

    /**
     * Pre-calculated constant for the square root of 2π.
     * 
     * This constant is a component of the normalization factor for the Gaussian probability density function (PDF),
     * and is used in calculating the standard deviation for Gaussian error in lattice-based cryptography.
     */
    private static readonly SQRT_2PI = Math.sqrt(2 * Math.PI);

    /**
     * Generate cryptographically secure random number using lattice-based mathematical operations.
     * It uses lattice operations combined with Gaussian error distribution to produce cryptographically secure randomness.
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     */
    static randLattice(dimension: number = 512, modulus: number = 3329): number {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randLattice');
        }

        // Input validation
        if (!Number.isInteger(dimension) || !Number.isInteger(modulus)) {
            throw new Error('Dimension and modulus must be integers');
        }

        // 1. Generate secret vector with small coefficients (security requirement)
        const secret = Array.from({ length: dimension }, () => crypto.randomInt(-1, 2));

        // 2. Generate random matrix A (uniform random) - single row for one LWE sample
        const matrixRow = Array.from({ length: dimension }, () => crypto.randomInt(0, modulus));

        // 3. Compute inner product <A, s> mod q
        let innerProduct = matrixRow.reduce((sum, a, i) => sum + a * secret[i], 0);
        innerProduct = ((innerProduct % modulus) + modulus) % modulus;

        // 4. Add Gaussian error (critical for security!)
        //
        // TODO: This should be correct; however, if incorrect, it will be improved/fixed later.
        const alpha = 1 / (Crypto.SQRT_2PI * dimension);
        const sigma = alpha * modulus;
        const gaussianError = Crypto.randNormal(0, sigma);
        const error = Math.round(gaussianError);

        // 5. LWE sample: b = <A, s> + e (mod q)
        const lweSample = innerProduct + error;
        const normalizedSample = ((lweSample % modulus) + modulus) % modulus;

        return normalizedSample / modulus;
    }

    /**
     * Generate a cryptographically secure random prime number within a specified bit length.
     * 
     * This method uses the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) to verify that the generated number is prime.
     * The implementation follows cryptographic best practices for generating prime numbers securely.
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     * 
     * @param bits - The bit length of the prime number to generate (default: 1024)
     * @param iterations - The number of iterations for the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) (default: 10)
     * @returns A bigint representing a probable prime number of the specified bit length
     */
    static randPrime(bits: number = 1024, iterations: number = 10): bigint {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randPrime');
        }

        // Input validation
        if (!Number.isInteger(bits) || bits < 2) {
            throw new Error('Bit length must be an integer greater than or equal to 2');
        }
        if (!Number.isInteger(iterations) || iterations < 1) {
            throw new Error('Number of iterations must be a positive integer');
        }

        // Generate prime candidates until a probable prime is found,
        // with a 100% guarantee of eventual success using this method.
        let candidate: bigint;
        do {
            candidate = Crypto.randBigInt(bits);
        } while (!isProbablePrime(candidate, iterations, Crypto.randBytes));

        return candidate;
    }

    /**
     * Generate a cryptographically secure random bigint with a specified bit length.
     * 
     * This method generates a random bigint with exactly the specified number of bits.
     * It ensures the most significant bit is set to 1 and the least significant bit is set to 1 (making it odd).
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     * 
     * @param bits - The bit length of the bigint to generate (default: 1024)
     * @returns A bigint with the specified bit length
     */
    static randBigInt(bits: number = 1024): bigint {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randBigInt');
        }

        // Input validation
        if (!Number.isInteger(bits) || bits < 2) {
            throw new Error('Bit length must be an integer greater than or equal to 2');
        }

        // Calculate bytes needed (bits / 8, rounded up)
        const byteLength = Math.ceil(bits / 8);
        const randomBytes = Crypto.randBytes(byteLength);

        // Convert to bigint
        let num = BigInt('0x' + randomBytes.toString('hex'));

        // Ensure the number has exactly 'bits' bits
        // Set the most significant bit to 1 to ensure the number has the right bit length
        num = num | (1n << BigInt(bits - 1));
        // Ensure the number is odd (all primes except 2 are odd)
        num = num | 1n;

        return num;
    }

    /**
     * Generate random number with exponential distribution
     */
    static randExponential(lambda: number = 1): number {
        const u = Crypto.rand();
        return -Math.log(1 - u) / lambda;
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
    randSeeded,
    randSubset,
    randGaussian,
    randWalk,
    randPassword,
    randLattice,
    randPrime,
    randBigInt,
    randExponential
} = Crypto;
