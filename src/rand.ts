import * as crypto from 'crypto';
import { promisify } from 'util';
import { DEFAULT_CDT_TABLES, DEFAULT_CHARSET, LOWERCASE_CHARSET, NUMERIC_CHARSET, SPECIAL_CHARSET, UPPERCASE_CHARSET } from './const';
import { isProbablePrime, isProbablePrimeAsync, getSmallPrimesForSieve, combinedSieveTest, discreteGaussianSample } from './math_helper';

/**
 * Promisified version of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) - only created if [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) exists
 */
const randomBytesAsync = typeof crypto !== 'undefined' && crypto.randomBytes ? promisify(crypto.randomBytes) : undefined;

/**
 * Promisified version of [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) - only created if [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) exists
 */
const randomFillAsync = typeof crypto !== 'undefined' && crypto.randomFill ? promisify(crypto.randomFill) : undefined;

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
     * Generate a cryptographically secure random float between 0 and 1 asynchronously.
     * Async version of rand().
     * 
     * @returns Promise that resolves to a random number between 0 and 1
     */
    static async randAsync(): Promise<number> {
        if (Crypto.hasWebCrypto()) {
            // Browser environment
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] / 0x100000000;
        } else if (typeof crypto !== 'undefined' && randomBytesAsync) {
            // Node.js environment
            const randomBytes = await randomBytesAsync(4);
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
     * Shuffle array using [Fisher-Yates algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) with crypto random.
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
    static randHex(length: number, randFill?: boolean): string {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randHex');
        }

        const bytes = Crypto.randBytes(Math.ceil(length / 2), randFill);
        return bytes.toString('hex').substring(0, length);
    }

    /**
     * Generate random hex string asynchronously.
     * Async version of randHex().
     * Note: Only available in Node.js environment.
     * 
     * @param length - Length of the hex string to generate
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns Promise that resolves to a random hex string
     */
    static async randHexAsync(length: number, randFill?: boolean): Promise<string> {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randHexAsync');
        }

        const bytes = await Crypto.randBytesAsync!(Math.ceil(length / 2), randFill);
        return bytes.toString('hex').substring(0, length);
    }

    /**
     * Generate random base64 string.
     * Note: Only available in Node.js environment.
     */
    static randBase64(length: number, randFill?: boolean): string {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randBase64');
        }

        const bytes = Crypto.randBytes(Math.ceil(length * 3 / 4), randFill);
        return bytes.toString('base64').substring(0, length);
    }

    /**
     * Generate random base64 string asynchronously.
     * Async version of randBase64().
     * Note: Only available in Node.js environment.
     * 
     * @param length - Length of the base64 string to generate
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns Promise that resolves to a random base64 string
     */
    static async randBase64Async(length: number, randFill?: boolean): Promise<string> {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randBase64Async');
        }

        const bytes = await Crypto.randBytesAsync!(Math.ceil(length * 3 / 4), randFill);
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
     * 
     * @param size - Number of bytes to generate
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns Random bytes as Uint8Array (browser) or Buffer (Node.js)
     */
    static randBytes(size: number, randFill?: boolean): Uint8Array | Buffer {
        if (Crypto.hasWebCrypto()) {
            // Browser environment
            const array = new Uint8Array(size);
            window.crypto.getRandomValues(array);
            return array;
        } else if (typeof crypto !== 'undefined' && crypto.randomBytes) {
            // Node.js environment
            if (randFill === true && typeof crypto.randomFillSync === 'function') {
                // Use crypto.randomFill when requested
                // Note: Buffer.allocUnsafe is safe here because the entire buffer
                // is immediately filled with cryptographically secure random data,
                // leaving no uninitialized memory exposed. This is more performant
                // than Buffer.alloc() which would unnecessarily zero-initialize first.
                const buffer = Buffer.allocUnsafe(size);
                crypto.randomFillSync(buffer);
                return buffer;
            } else {
                // Use crypto.randomBytes (default behavior)
                return crypto.randomBytes(size);
            }
        } else {
            throw new Error('No secure random bytes generator available. Please use in Node.js environment or modern browser with Web Crypto API.');
        }
    }

    /**
     * Generate random bytes asynchronously.
     * Async version of randBytes().
     * 
     * @param size - Number of bytes to generate
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns Promise that resolves to random bytes
     */
    static async randBytesAsync(size: number, randFill?: boolean): Promise<Uint8Array | Buffer> {
        if (Crypto.hasWebCrypto()) {
            // Browser environment
            const array = new Uint8Array(size);
            window.crypto.getRandomValues(array);
            return array;
        } else if (typeof crypto !== 'undefined' && randomBytesAsync) {
            // Node.js environment
            if (randFill === true && randomFillAsync) {
                // Use crypto.randomFill when requested
                // Note: Buffer.allocUnsafe is safe here because the entire buffer
                // is immediately filled with cryptographically secure random data,
                // leaving no uninitialized memory exposed. This is more performant
                // than Buffer.alloc() which would unnecessarily zero-initialize first.
                const buffer = Buffer.allocUnsafe(size);
                await randomFillAsync(buffer);
                return buffer;
            } else {
                // Use crypto.randomBytes (default behavior)
                return randomBytesAsync(size);
            }
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
     * Generate cryptographically secure seed asynchronously.
     * Async version of randSeed().
     * Note: Only available in Node.js environment.
     * 
     * @returns Promise that resolves to a random seed number
     */
    static async randSeedAsync(): Promise<number> {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randSeedAsync');
        }

        const bytes = await randomBytesAsync!(4);
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
     * Generate random version string (44 characters base64-like) asynchronously.
     * Async version of randVersion().
     * Note: Only available in Node.js environment.
     * 
     * @returns Promise that resolves to a random version string
     */
    static async randVersionAsync(): Promise<string> {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randVersionAsync');
        }

        const randomBytes = await randomBytesAsync!(32);
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
     * Generate random number with normal distribution using [Box-Muller transform](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform).
     * 
     * This method is similar to randGaussian but ensures that the logarithm function
     * never receives zero by converting [0,1) to (0,1).
     * 
     * Steps:
     * 
     * 1. Generate two independent uniform random numbers:
     *    - (u) is adjusted to be in the interval (0, 1) by using 1 - Crypto.rand().
     *    - (v) is a standard uniform random number in [0, 1).
     * 2. Apply the [Box-Muller transform](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform):
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
                'randBigInt',
                'randHexAsync',
                'randBase64Async',
                'randSeedAsync',
                'randVersionAsync',
                'randPrimeAsync',
                'randBigIntAsync',
                'randSafePrime',
                'randSafePrimeAsync'
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
            'randPrime', 'randBigInt', 'randExponential', 'randSafePrime',
            // Async versions
            'randAsync', 'randBytesAsync', 'randHexAsync', 'randBase64Async', 'randSeedAsync', 'randVersionAsync',
            'randPrimeAsync', 'randBigIntAsync', 'randSafePrimeAsync'
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
     * Generate random number with Gaussian distribution using [Box-Muller transform](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform).
     * 
     * Steps:
     * 
     * 1. Generate two independent uniform random numbers (u₁) and (u₂) in the interval [0, 1).
     * 2. Apply the [Box-Muller transform](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform):
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

        // Define the pattern for similar-looking characters once
        const similarCharsPattern = /[0O1lI]/g;

        // Build the charset
        let charset = '';
        let uppercaseChars = UPPERCASE_CHARSET;
        let lowercaseChars = LOWERCASE_CHARSET;
        let numericChars = NUMERIC_CHARSET;
        let specialChars = SPECIAL_CHARSET;

        // Remove similar-looking characters if requested
        if (excludeSimilar) {
            // Consistently remove all similar-looking characters: 0, O, 1, l, I
            uppercaseChars = uppercaseChars.replace(similarCharsPattern, '');
            lowercaseChars = lowercaseChars.replace(similarCharsPattern, '');
            numericChars = numericChars.replace(similarCharsPattern, '');
            specialChars = specialChars.replace(similarCharsPattern, '');
        }

        // Add character sets to the full charset
        if (includeUppercase) charset += uppercaseChars;
        if (includeLowercase) charset += lowercaseChars;
        if (includeNumbers) charset += numericChars;
        if (includeSymbols) charset += specialChars;

        if (!charset) {
            throw new Error('At least one character type must be enabled');
        }

        // Make sure the combined charset also has similar-looking characters removed if requested
        if (excludeSimilar) {
            // Ensure all similar-looking characters are removed from the combined charset
            charset = charset.replace(similarCharsPattern, '');
        }

        // If length is too short to include all required character types, just use random
        const requiredTypes = [
            includeUppercase && uppercaseChars,
            includeLowercase && lowercaseChars,
            includeNumbers && numericChars,
            includeSymbols && specialChars
        ].filter(Boolean);

        if (length < requiredTypes.length) {
            return Crypto.randString(length, charset);
        }

        // Ensure at least one character from each required character set
        const requiredChars: string[] = [];

        if (includeUppercase) {
            requiredChars.push(uppercaseChars.charAt(Crypto.randN(uppercaseChars.length)));
        }

        if (includeLowercase) {
            requiredChars.push(lowercaseChars.charAt(Crypto.randN(lowercaseChars.length)));
        }

        if (includeNumbers) {
            requiredChars.push(numericChars.charAt(Crypto.randN(numericChars.length)));
        }

        if (includeSymbols) {
            requiredChars.push(specialChars.charAt(Crypto.randN(specialChars.length)));
        }

        // Generate the remaining characters randomly
        const remainingLength = length - requiredChars.length;
        let password = requiredChars.join('') + Crypto.randString(remainingLength, charset);

        // Shuffle the password to ensure the required characters are not in predictable positions
        password = Crypto.shuffle(password.split('')).join('');

        return password;
    }

    /**
     * Generate cryptographically secure random number using [lattice-based](https://en.wikipedia.org/wiki/Lattice-based_cryptography) mathematical operations.
     * It uses lattice operations combined with Gaussian error distribution to produce cryptographically secure randomness.
     * 
     * This implementation is designed to be resistant to timing attacks by:
     * - Using constant-time operations for all critical cryptographic steps
     * - Ensuring that execution time is independent of secret values
     * - Avoiding branches and conditional operations in the core sampling algorithm
     * - Processing all input data with consistent timing regardless of values
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     * 
     * @param dimension - The dimension of the lattice (default: 512)
     * @param modulus - The modulus value for lattice operations (default: 3329)
     * @param sigma - The standard deviation for the [Gaussian distribution](https://en.wikipedia.org/wiki/Normal_distribution) (default: 3.2)
     * @param output - The format of the output: 'normalized' (0-1 range) or 'integer' (default: 'normalized')
     * @param customCdtTables - Optional custom [Cumulative Distribution Tables](https://en.wikipedia.org/wiki/Cumulative_distribution_function) for discrete Gaussian sampling. Format: { sigma_value: [table_entries] }, e.g., { 3.2: [65535, 63963, ...] }
     * @returns A random number generated using lattice-based cryptography
     */
    static randLattice(
        dimension: number = 512,
        modulus: number = 3329,
        sigma: number = 3.2,
        output: 'normalized' | 'integer' = 'normalized',
        customCdtTables: Record<number, number[]> = DEFAULT_CDT_TABLES
    ): number {

        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randLattice');
        }

        // Input validation
        if (!Number.isInteger(dimension) || !Number.isInteger(modulus)) {
            throw new Error('Dimension and modulus must be integers');
        }


        // Check if it has at least one entry
        if (Object.keys(customCdtTables).length === 0) {
            throw new Error('Custom CDT tables must contain at least one entry');
        }

        // Check if the key for sigma exists in the custom tables
        if (sigma in customCdtTables) {
            // Check if the table for this sigma is an array with at least one element
            const table = customCdtTables[sigma];
            if (!Array.isArray(table) || table.length === 0) {
                throw new Error(`CDT table for sigma=${sigma} must be a non-empty array of numbers`);
            }

            // Check if all elements are valid numbers
            for (let i = 0; i < table.length; i++) {
                if (typeof table[i] !== 'number' || isNaN(table[i])) {
                    throw new Error(`CDT table for sigma=${sigma} contains invalid values at index ${i}`);
                }
            }
        } else if (!(sigma in DEFAULT_CDT_TABLES)) {
            // If sigma is not in custom tables and not in default tables, throw error
            throw new Error(`No CDT table available for sigma=${sigma}`);
        }

        // Use custom tables if provided, otherwise use defaults
        const CDT_TABLES = customCdtTables || DEFAULT_CDT_TABLES;

        // 2. Secret vector {-1, 0, 1} using constant-time techniques
        // We generate random bytes and map them to the range {-1, 0, 1} in a constant-time manner
        const secret = new Array(dimension);
        // Generate enough random bytes (each byte gives us values for 4 elements)
        const secretBytes = Crypto.randBytes(Math.ceil(dimension / 4) * 4);

        for (let i = 0; i < dimension; i++) {
            // Each byte gives us 8 bits, we use 2 bits per value
            // This gives us values in range {0,1,2,3}, we map 3 to 0 for uniform distribution
            const bytePos = Math.floor(i / 4);
            const bitPos = (i % 4) * 2;
            const byte = secretBytes[bytePos];

            // Extract 2 bits from the current position (constant-time bit manipulation)
            const twobitValue = (byte >>> bitPos) & 0x3;

            // Map values {0,1,2,3} to {-1,0,1,0} in constant time
            // This gives a uniform distribution of {-1,0,1}
            // We map both 0 and 3 to 0, and 1 to -1, 2 to 1
            const mappedValue =
                // If twobitValue is 1, result is -1
                ((twobitValue & 0x1) & (1 - (twobitValue >>> 1))) * -1 +
                // If twobitValue is 2, result is 1
                ((twobitValue >>> 1) & (1 - (twobitValue & 0x1)));

            secret[i] = mappedValue;
        }

        // 3. Matrix row uniform mod q using constant-time techniques
        const matrixRow = new Array(dimension);
        // Generate random bytes for matrix elements
        const matrixBytes = Crypto.randBytes(dimension * 4); // Using 4 bytes per element for simplicity

        for (let i = 0; i < dimension; i++) {
            // Extract 4 bytes (32 bits) for each element
            // We only need to handle Buffer since this function only works in Node.js environment
            // Use type assertion since we know this is a Buffer in Node.js context
            const val = (matrixBytes as Buffer).readUInt32BE(i * 4);
            // Map to range [0, modulus-1] using modulo
            // Modulo operation is unavoidable but is applied uniformly to random data
            matrixRow[i] = val % modulus;
        }

        // 4. Inner product mod q using constant-time techniques
        // We compute the inner product carefully to avoid timing attacks
        let innerProduct = 0;
        for (let i = 0; i < dimension; i++) {
            // Add each product individually
            innerProduct += matrixRow[i] * secret[i];
            // Apply modulo regularly to prevent overflow
            // This is done for every iteration to avoid timing differences
            innerProduct = ((innerProduct % modulus) + modulus) % modulus;
        }

        // 5. Discrete Gaussian error
        const error = discreteGaussianSample(sigma, CDT_TABLES);

        // 6. LWE sample
        const lweSample = innerProduct + error;
        const normalizedSample = ((lweSample % modulus) + modulus) % modulus;

        // Return according to output
        if (output === 'integer') return normalizedSample;

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
     * @param iterations - The number of iterations for the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) (a.k.a accuracy 🎯, default: 10)
     * @param enhanced - Whether to use the enhanced [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) version (default: false)
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns A bigint representing a probable prime number of the specified bit length
     */
    static randPrime(
        bits: number = 1024,
        iterations: number = 10,
        enhanced: boolean = false,
        randFill?: boolean,
    ): bigint {
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
        //
        // Note: This variable-time loop is safe from timing attacks because:
        // 1. The timing only reveals information about how many candidates were tested before finding a prime
        // 2. It does NOT leak information about the specific value of the final prime that is returned
        // 3. Each candidate is generated independently using secure random number generation
        // 4. The statistical distribution of the search process is independent of the specific prime value
        let candidate: bigint;
        do {
            candidate = Crypto.randBigInt(bits, randFill);
        } while (!isProbablePrime(candidate, iterations, Crypto.randBytes, enhanced, randFill));

        return candidate;
    }

    /**
     * Generate a cryptographically secure random prime number within a specified bit length asynchronously.
     * Async version of randPrime().
     * 
     * This method uses the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) to verify that the generated number is prime.
     * The implementation follows cryptographic best practices for generating prime numbers securely.
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     * 
     * @param bits - The bit length of the prime number to generate (default: 1024)
     * @param iterations - The number of iterations for the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) (a.k.a accuracy 🎯, default: 10)
     * @param enhanced - Whether to use the enhanced [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) version (default: false)
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns A Promise that resolves to a bigint representing a probable prime number of the specified bit length
     */
    static async randPrimeAsync(
        bits: number = 1024,
        iterations: number = 10,
        enhanced: boolean = false,
        randFill?: boolean,
    ): Promise<bigint> {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randPrimeAsync');
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
        //
        // Note: This variable-time loop is safe from timing attacks because:
        // 1. The timing only reveals information about how many candidates were tested before finding a prime
        // 2. It does NOT leak information about the specific value of the final prime that is returned
        // 3. Each candidate is generated independently using secure random number generation
        // 4. The statistical distribution of the search process is independent of the specific prime value
        let candidate: bigint, isPrime: boolean;

        do {
            candidate = await Crypto.randBigIntAsync(bits, randFill);
            isPrime = await isProbablePrimeAsync(candidate, iterations, Crypto.randBytesAsync, enhanced, randFill);
        } while (!isPrime);

        return candidate;
    }

    /**
     * Generate a cryptographically secure random safe prime number suitable for [Diffie-Hellman key exchanges](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange).
     * 
     * A safe prime is a prime number of the form p = 2q + 1, where q is also a prime number ([Sophie Germain prime](https://en.wikipedia.org/wiki/Safe_and_Sophie_Germain_primes)).
     * Safe primes are particularly useful for [Diffie-Hellman key exchanges](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) because they help prevent
     * small subgroup attacks and ensure that the discrete logarithm problem remains hard.
     * 
     * This method uses [Michael J. Wiener's](https://eprint.iacr.org/2003/186) combined sieve approach to find safe primes with approximately
     * 15x speedup over naive algorithms by:
     * 1. Generating random candidates with the correct bit length
     * 2. Using combined sieving with small primes up to 2^16 to simultaneously eliminate candidates
     *    where either p or (p-1)/2 is divisible by small primes
     * 3. Performing Miller-Rabin primality tests only on candidates that pass the sieve
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     * It is still considered unstable due to its overhead (so slow) on some operating systems and architectures,
     * although recent improvements have made it somewhat better than before.
     * 
     * @param bits - The bit length of the safe prime number to generate (default: 2048)
     * @param iterations - The number of iterations for the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) (default: 10)
     * @param enhanced - Whether to use the enhanced [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) version (default: false)
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns A bigint representing a probable safe prime number of the specified bit length
     */
    static randSafePrime(
        bits: number = 2048,
        iterations: number = 10,
        enhanced: boolean = false,
        randFill?: boolean,
    ): bigint {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randSafePrime');
        }

        // Input validation
        if (!Number.isInteger(bits) || bits < 2) {
            throw new Error('Bit length must be an integer greater than or equal to 2');
        }
        if (!Number.isInteger(iterations) || iterations < 1) {
            throw new Error('Number of iterations must be a positive integer');
        }

        // Generate safe prime candidates until a valid one is found
        do {
            // Get small primes up to 2^16 for combined sieve (cached for performance)
            // Placed here to speed up within the loop. (see how it goes)
            const smallPrimes = getSmallPrimesForSieve();

            // Generate a random odd number with exactly 'bits' bits
            const p = Crypto.randBigInt(bits, randFill);

            // For a safe prime p = 2q + 1, q = (p-1)/2 must be prime
            const q = (p - 1n) / 2n;

            // Quick check: both p and q must be odd (except q=1 for p=3)
            if (p % 2n === 0n || (q > 1n && q % 2n === 0n)) {
                continue;
            }

            // Combined sieve test: quickly eliminate candidates where either p or q is divisible by small primes
            if (!combinedSieveTest(p, smallPrimes)) {
                continue;
            }

            // Perform full primality tests only on candidates that pass sieving
            // First check if q ([Sophie Germain prime](https://en.wikipedia.org/wiki/Safe_and_Sophie_Germain_primes)) is prime
            if (!isProbablePrime(q, iterations, Crypto.randBytes, enhanced, randFill)) {
                continue;
            }

            // Then check if p (safe prime) is prime
            if (!isProbablePrime(p, iterations, Crypto.randBytes, enhanced, randFill)) {
                continue;
            }

            // Verify the bit length is exactly as requested
            if (p.toString(2).length === bits) {
                return p;
            }
        } while (true);
    }

    /**
     * Generate a cryptographically secure random safe prime number suitable for [Diffie-Hellman key exchanges](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) asynchronously.
     * Async version of randSafePrime().
     * 
     * A safe prime is a prime number of the form p = 2q + 1, where q is also a prime number ([Sophie Germain prime](https://en.wikipedia.org/wiki/Safe_and_Sophie_Germain_primes)).
     * Safe primes are particularly useful for [Diffie-Hellman key exchanges](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) because they help prevent
     * small subgroup attacks and ensure that the discrete logarithm problem remains hard.
     * 
     * This method uses [Michael J. Wiener's](https://eprint.iacr.org/2003/186) combined sieve approach to find safe primes with approximately
     * 15x speedup over naive algorithms by:
     * 1. Generating random candidates with the correct bit length
     * 2. Using combined sieving with small primes up to 2^16 to simultaneously eliminate candidates
     *    where either p or (p-1)/2 is divisible by small primes
     * 3. Performing Miller-Rabin primality tests only on candidates that pass the sieve
     * 4. Using asynchronous operations for better performance
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     * It is still considered unstable due to its overhead (so slow) on some operating systems and architectures,
     * although recent improvements have made it somewhat better than before.
     * 
     * @param bits - The bit length of the safe prime number to generate (default: 2048)
     * @param iterations - The number of iterations for the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) (default: 10)
     * @param enhanced - Whether to use the enhanced [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) version (default: false)
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns A Promise that resolves to a bigint representing a probable safe prime number of the specified bit length
     */
    static async randSafePrimeAsync(
        bits: number = 2048,
        iterations: number = 10,
        enhanced: boolean = false,
        randFill?: boolean,
    ): Promise<bigint> {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randSafePrimeAsync');
        }

        // Input validation
        if (!Number.isInteger(bits) || bits < 2) {
            throw new Error('Bit length must be an integer greater than or equal to 2');
        }
        if (!Number.isInteger(iterations) || iterations < 1) {
            throw new Error('Number of iterations must be a positive integer');
        }

        // Generate safe prime candidates until a valid one is found
        do {
            // Get small primes up to 2^16 for combined sieve (cached for performance)
            // Placed here to speed up within the loop. (see how it goes)
            const smallPrimes = getSmallPrimesForSieve();

            // Generate a random odd number with exactly 'bits' bits
            const p = await Crypto.randBigIntAsync(bits, randFill);

            // For a safe prime p = 2q + 1, q = (p-1)/2 must be prime
            const q = (p - 1n) / 2n;

            // Quick check: both p and q must be odd (except q=1 for p=3)
            if (p % 2n === 0n || (q > 1n && q % 2n === 0n)) {
                continue;
            }

            // Combined sieve test: quickly eliminate candidates where either p or q is divisible by small primes
            if (!combinedSieveTest(p, smallPrimes)) {
                continue;
            }

            // Perform full primality tests only on candidates that pass sieving
            // First check if q ([Sophie Germain prime](https://en.wikipedia.org/wiki/Safe_and_Sophie_Germain_primes)) is prime
            if (!await isProbablePrimeAsync(q, iterations, Crypto.randBytesAsync, enhanced, randFill)) {
                continue;
            }

            // Then check if p (safe prime) is prime
            if (!await isProbablePrimeAsync(p, iterations, Crypto.randBytesAsync, enhanced, randFill)) {
                continue;
            }

            // Verify the bit length is exactly as requested
            if (p.toString(2).length === bits) {
                return p;
            }
        } while (true);
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
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns A bigint with the specified bit length
     */
    static randBigInt(bits: number = 1024, randFill?: boolean): bigint {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randBigInt');
        }

        // Input validation
        if (!Number.isInteger(bits) || bits < 2) {
            throw new Error('Bit length must be an integer greater than or equal to 2');
        }

        // Calculate bytes needed (bits / 8, rounded up)
        const byteLength = Math.ceil(bits / 8);
        const randomBytes = Crypto.randBytes(byteLength, randFill);

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
     * Generate a cryptographically secure random bigint with a specified bit length asynchronously.
     * Async version of randBigInt().
     * 
     * This method generates a random bigint with exactly the specified number of bits.
     * It ensures the most significant bit is set to 1 and the least significant bit is set to 1 (making it odd).
     * 
     * **Note:** This method is currently only available in Node.js environment due to its
     * dependency on the native crypto module for secure random number generation.
     * 
     * @param bits - The bit length of the bigint to generate (default: 1024)
     * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
     * @returns A Promise that resolves to a bigint with the specified bit length
     */
    static async randBigIntAsync(bits: number = 1024, randFill?: boolean): Promise<bigint> {
        if (Crypto.isBrowser()) {
            Crypto.throwBrowserError('randBigIntAsync');
        }

        // Input validation
        if (!Number.isInteger(bits) || bits < 2) {
            throw new Error('Bit length must be an integer greater than or equal to 2');
        }

        // Calculate bytes needed (bits / 8, rounded up)
        const byteLength = Math.ceil(bits / 8);
        const randomBytes = await Crypto.randBytesAsync(byteLength, randFill);

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
    randSafePrime,
    randBigInt,
    randExponential,
    // Async versions
    randAsync,
    randBytesAsync,
    randHexAsync,
    randBase64Async,
    randSeedAsync,
    randVersionAsync,
    randPrimeAsync,
    randSafePrimeAsync,
    randBigIntAsync
} = Crypto;
