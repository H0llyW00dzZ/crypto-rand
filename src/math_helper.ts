/**
 * Internal math utilities for cryptographic operations.
 * These functions are intended for internal use only within the crypto-rand package,
 * such as for testing purposes.
 */
import * as crypto from 'crypto';
import { Crypto } from '../src/rand';
import { DEFAULT_CDT_TABLES, DEFAULT_CHARSET, LOWERCASE_CHARSET, NUMERIC_CHARSET, SPECIAL_CHARSET, UPPERCASE_CHARSET } from './const';

/**
 * [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test)
 * 
 * **Note:** If you understand how this works, it's unlike the situation described in Wikipedia: "For instance, in 2018, Albrecht et al.
 * were able to construct composite numbers that many cryptographic libraries, such as OpenSSL and GNU GMP, declared as prime,
 * demonstrating that these libraries were not implemented with an adversarial context in mind." ¯\_(ツ)_/¯
 * 
 * @param n - The number to test for primality
 * @param k - The number of iterations for the test (a.k.a accuracy 🎯)
 * @param getRandomBytes - Function to generate random bytes (defaults to crypto.randomBytes)
 * @param enhanced - Whether to use the enhanced [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) version
 * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
 * @returns A boolean indicating whether the number is probably prime
 */
export function isProbablePrime(
    n: bigint,
    k: number,
    getRandomBytes: (size: number, randFill?: boolean) => Buffer | Uint8Array = crypto.randomBytes,
    enhanced: boolean = false,
    randFill?: boolean
): boolean {
    if (enhanced) {
        return isProbablePrimeEnhanced(n, k, getRandomBytes, randFill);
    } else {
        return isProbablePrimeStandard(n, k, getRandomBytes, randFill);
    }
}

/**
 * Standard implementation of the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test)
 * 
 * This function implements the classic Miller-Rabin algorithm for primality testing.
 * It's used internally by the `isProbablePrime` function when the enhanced parameter is false.
 * 
 * @param n - The number to test for primality
 * @param k - The number of iterations for the test (higher values increase accuracy)
 * @param getRandomBytes - Function to generate random bytes for witness selection
 * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
 * @returns A boolean indicating whether the number is probably prime
 */
function isProbablePrimeStandard(
    n: bigint,
    k: number,
    getRandomBytes: (size: number, randFill?: boolean) => Buffer | Uint8Array,
    randFill?: boolean
): boolean {

    // Handle small numbers
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n) return false;

    // Write n-1 as 2ʳ × d where d is odd
    let r = 0;
    let d = n - 1n;
    while (d % 2n === 0n) {
        d /= 2n;
        r++;
    }

    // ⚙️ Witness loop
    for (let i = 0; i < k; i++) {
        // Generate a random integer a in the range [2, n-2]
        // Calculate how many bytes are needed to represent n
        const byteLength = Math.ceil(n.toString(2).length / 8);
        const randomBytes = getRandomBytes(byteLength, randFill);
        let a = BigInt('0x' + randomBytes.toString('hex')) % (n - 4n) + 2n;

        // Compute aᵈ mod n
        let x = modPow(a, d, n);

        if (x === 1n || x === n - 1n) continue;

        let continueWitness = false;
        for (let j = 0; j < r - 1; j++) {
            x = modPow(x, 2n, n);
            if (x === n - 1n) {
                continueWitness = true;
                break;
            }
        }

        if (continueWitness) continue;
        return false;
    }

    return true;
}

/**
 * Enhanced implementation of the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) following [FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) standard
 * 
 * This function implements the enhanced version of the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test)
 * as specified in the [FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) standard.
 * It provides stronger guarantees than the standard [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) by including additional
 * checks such as [GCD](https://en.wikipedia.org/wiki/Greatest_common_divisor) verification between random witnesses and the tested number.
 * 
 * @param n - The number to test for primality
 * @param k - The number of iterations for the test (higher values increase accuracy)
 * @param getRandomBytes - Function to generate random bytes for witness selection
 * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
 * @returns A boolean indicating whether the number is probably prime according to [FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) criteria
 */
export function isProbablePrimeEnhanced(
    n: bigint,
    k: number,
    getRandomBytes: (size: number, randFill?: boolean) => Buffer | Uint8Array,
    randFill?: boolean
): boolean {

    // Handle small numbers
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n) return false;

    // Write n-1 as 2ʳ × d where d is odd (step 1 and 2 in FIPS 186-5)
    let a = 0;
    let m = n - 1n;
    while (m % 2n === 0n) {
        m /= 2n;
        a++;
    }

    // ⚙️ Witness loop (step 4 in FIPS 186-5)
    //
    // Note: This does not return multiple results with indicators, such as returning false with a reason STRING like "PROVABLY COMPOSITE WITH FACTOR," etc.
    // This is designed to be simple and straightforward, avoiding the complexity overhead of handling multiple results.
    for (let i = 0; i < k; i++) {
        // Generate a random integer b in the range [2, n-2] (steps 4.1 and 4.2)
        let b: bigint;
        do {
            // Calculate how many bytes are needed to represent n
            const byteLength = Math.ceil(n.toString(2).length / 8);
            const randomBytes = getRandomBytes(byteLength, randFill);
            b = BigInt('0x' + randomBytes.toString('hex')) % (n - 1n);
        } while (b <= 1n || b >= n - 1n);

        // Step 4.3: Check if b and n have a common factor
        const g = gcd(b, n);
        if (g > 1n) {
            return false;
        }

        // Step 4.5: Compute z = b^m mod n
        let z = modPow(b, m, n);

        // Step 4.6: If z = 1 or z = n-1, continue to next iteration
        if (z === 1n || z === n - 1n) continue;

        // Step 4.7: For j = 1 to a-1
        let j = 1;
        let isComposite = true;

        while (j < a) {
            // Step 4.7.1 and 4.7.2: x = z, z = x^2 mod n
            const x = z;
            z = modPow(x, 2n, n);

            // Step 4.7.3: If z = n-1, continue to next iteration
            if (z === n - 1n) {
                isComposite = false;
                break;
            }

            // Step 4.7.4: If z = 1, go to step 4.12
            if (z === 1n) {
                // Step 4.12: g = GCD(x-1, n)
                const g = gcd(x - 1n, n);

                // Step 4.13: If g > 1, return PROVABLY COMPOSITE WITH FACTOR
                if (g > 1n) {
                    return false;
                }

                // Step 4.14: Return PROVABLY COMPOSITE AND NOT A POWER OF A PRIME
                return false;
            }

            j++;
        }

        // If we've gone through all iterations of j and z is not n-1 or 1
        if (isComposite) {
            // Steps 4.8-4.11 are handled implicitly in the loop above

            // Step 4.12: g = GCD(z-1, n)
            const g = gcd(z - 1n, n);

            // Step 4.13: If g > 1, return PROVABLY COMPOSITE WITH FACTOR
            if (g > 1n) {
                return false;
            }

            // Step 4.14: Return PROVABLY COMPOSITE AND NOT A POWER OF A PRIME
            return false;
        }
    }

    // Step 5: Return PROBABLY PRIME
    return true;
}

/**
 * [Modular exponentiation](https://en.wikipedia.org/wiki/Modular_exponentiation): baseᵉˣᵖᵒⁿᵉⁿᵗ mod modulus
 * 
 * @param base - The base value
 * @param exponent - The exponent value
 * @param modulus - The modulus value
 * @returns The result of the modular exponentiation
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    if (modulus === 1n) return 0n;

    let result = 1n;
    base = base % modulus;

    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }
        exponent = exponent >> 1n;
        base = (base * base) % modulus;
    }

    return result;
}

/**
 * Calculate the [modular multiplicative inverse](https://en.wikipedia.org/wiki/Modular_multiplicative_inverse) using the [Extended Euclidean Algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm),
 * similar to operations performed in [Rijndael - AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard).
 * 
 * **Note:** This is a helper function primarily intended for testing purposes.
 * Not recommended for production use as it may be vulnerable to timing attacks.
 * 
 * @param a - The number to find the inverse for
 * @param m - The modulus
 * @returns The [modular multiplicative inverse](https://en.wikipedia.org/wiki/Modular_multiplicative_inverse) inverse of a modulo m
 */
export function modInverse(a: bigint, m: bigint): bigint {
    // Extended Euclidean Algorithm to find modular multiplicative inverse
    let [old_r, r] = [a, m];
    let [old_s, s] = [1n, 0n];
    let [old_t, t] = [0n, 1n];

    while (r !== 0n) {
        const quotient = old_r / r;
        [old_r, r] = [r, old_r - quotient * r];
        [old_s, s] = [s, old_s - quotient * s];
        [old_t, t] = [t, old_t - quotient * t];
    }

    // If old_r != 1, then a and m are not coprime and inverse doesn't exist
    if (old_r !== 1n) {
        throw new Error('Modular inverse does not exist');
    }

    // Make sure the result is positive
    return (old_s % m + m) % m;
}

/**
 * Async version of [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test)
 * 
 * **Note:** If you understand how this works, it's unlike the situation described in Wikipedia: "For instance, in 2018, Albrecht et al.
 * were able to construct composite numbers that many cryptographic libraries, such as OpenSSL and GNU GMP, declared as prime,
 * demonstrating that these libraries were not implemented with an adversarial context in mind." ¯\_(ツ)_/¯
 * 
 * @param n - The number to test for primality
 * @param k - The number of iterations for the test (a.k.a accuracy 🎯)
 * @param getRandomBytesAsync - Async function to generate random bytes
 * @param enhanced - Whether to use the enhanced [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) version
 * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
 * @returns A Promise that resolves to a boolean indicating whether the number is probably prime
 */
export async function isProbablePrimeAsync(
    n: bigint,
    k: number,
    getRandomBytesAsync: (size: number) => Promise<Buffer | Uint8Array>,
    enhanced: boolean = false,
    randFill?: boolean
): Promise<boolean> {
    if (enhanced) {
        return isProbablePrimeEnhancedAsync(n, k, getRandomBytesAsync, randFill);
    } else {
        return isProbablePrimeStandardAsync(n, k, getRandomBytesAsync, randFill);
    }
}

/**
 * Asynchronous implementation of the standard [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test)
 * 
 * This function is the asynchronous version of `isProbablePrimeStandard`, implementing the classic
 * Miller-Rabin algorithm for primality testing. It's used internally by the `isProbablePrimeAsync`
 * function when the enhanced parameter is false.
 * 
 * @param n - The number to test for primality
 * @param k - The number of iterations for the test (higher values increase accuracy)
 * @param getRandomBytesAsync - Async function to generate random bytes for witness selection
 * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
 * @returns A Promise that resolves to a boolean indicating whether the number is probably prime
 */
async function isProbablePrimeStandardAsync(
    n: bigint,
    k: number,
    getRandomBytesAsync: (size: number, randFill?: boolean) => Promise<Buffer | Uint8Array>,
    randFill?: boolean
): Promise<boolean> {

    // Handle small numbers
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n) return false;

    // Write n-1 as 2ʳ × d where d is odd
    let r = 0;
    let d = n - 1n;
    while (d % 2n === 0n) {
        d /= 2n;
        r++;
    }

    // ⚙️ Witness loop
    for (let i = 0; i < k; i++) {
        // Generate a random integer a in the range [2, n-2]
        // Calculate how many bytes are needed to represent n
        const byteLength = Math.ceil(n.toString(2).length / 8);
        const randomBytes = await getRandomBytesAsync(byteLength, randFill);
        let a = BigInt('0x' + randomBytes.toString('hex')) % (n - 4n) + 2n;

        // Compute aᵈ mod n
        let x = modPow(a, d, n);

        if (x === 1n || x === n - 1n) continue;

        let continueWitness = false;
        for (let j = 0; j < r - 1; j++) {
            x = modPow(x, 2n, n);
            if (x === n - 1n) {
                continueWitness = true;
                break;
            }
        }

        if (continueWitness) continue;
        return false;
    }

    return true;
}

/**
 * Asynchronous implementation of the enhanced [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) following [FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) standard
 * 
 * This function is the asynchronous version of `isProbablePrimeEnhanced`, implementing the enhanced
 * version of the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) as specified in the 
 * [FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) standard.
 * It provides stronger guarantees than the standard [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) by including additional
 * checks such as [GCD](https://en.wikipedia.org/wiki/Greatest_common_divisor) verification between random witnesses and the tested number.
 * 
 * @param n - The number to test for primality
 * @param k - The number of iterations for the test (higher values increase accuracy)
 * @param getRandomBytesAsync - Async function to generate random bytes for witness selection
 * @param randFill - Optional parameter to use [crypto.randomFill](https://nodejs.org/api/crypto.html#cryptorandomfillbuffer-offset-size-callback) instead of [crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) (Node.js only)
 * @returns A Promise that resolves to a boolean indicating whether the number is probably prime according to [FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) criteria
 */
export async function isProbablePrimeEnhancedAsync(
    n: bigint,
    k: number,
    getRandomBytesAsync: (size: number, randFill?: boolean) => Promise<Buffer | Uint8Array>,
    randFill?: boolean
): Promise<boolean> {

    // Handle small numbers
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n) return false;

    // Write n-1 as 2ʳ × d where d is odd (step 1 and 2 in FIPS 186-5)
    let a = 0;
    let m = n - 1n;
    while (m % 2n === 0n) {
        m /= 2n;
        a++;
    }

    // ⚙️ Witness loop (step 4 in FIPS 186-5)
    //
    // Note: This does not return multiple results with indicators, such as returning false with a reason STRING like "PROVABLY COMPOSITE WITH FACTOR," etc.
    // This is designed to be simple and straightforward, avoiding the complexity overhead of handling multiple results.
    for (let i = 0; i < k; i++) {
        // Generate a random integer b in the range [2, n-2] (steps 4.1 and 4.2)
        let b: bigint;
        do {
            // Calculate how many bytes are needed to represent n
            const byteLength = Math.ceil(n.toString(2).length / 8);
            const randomBytes = await getRandomBytesAsync(byteLength, randFill);
            b = BigInt('0x' + randomBytes.toString('hex')) % (n - 1n);
        } while (b <= 1n || b >= n - 1n);

        // Step 4.3: Check if b and n have a common factor
        const g = gcd(b, n);
        if (g > 1n) {
            return false;
        }

        // Step 4.5: Compute z = b^m mod n
        let z = modPow(b, m, n);

        // Step 4.6: If z = 1 or z = n-1, continue to next iteration
        if (z === 1n || z === n - 1n) continue;

        // Step 4.7: For j = 1 to a-1
        let j = 1;
        let isComposite = true;

        while (j < a) {
            // Step 4.7.1 and 4.7.2: x = z, z = x^2 mod n
            const x = z;
            z = modPow(x, 2n, n);

            // Step 4.7.3: If z = n-1, continue to next iteration
            if (z === n - 1n) {
                isComposite = false;
                break;
            }

            // Step 4.7.4: If z = 1, go to step 4.12
            if (z === 1n) {
                // Step 4.12: g = GCD(x-1, n)
                const g = gcd(x - 1n, n);

                // Step 4.13: If g > 1, return PROVABLY COMPOSITE WITH FACTOR
                if (g > 1n) {
                    return false;
                }

                // Step 4.14: Return PROVABLY COMPOSITE AND NOT A POWER OF A PRIME
                return false;
            }

            j++;
        }

        // If we've gone through all iterations of j and z is not n-1 or 1
        if (isComposite) {
            // Steps 4.8-4.11 are handled implicitly in the loop above

            // Step 4.12: g = GCD(z-1, n)
            const g = gcd(z - 1n, n);

            // Step 4.13: If g > 1, return PROVABLY COMPOSITE WITH FACTOR
            if (g > 1n) {
                return false;
            }

            // Step 4.14: Return PROVABLY COMPOSITE AND NOT A POWER OF A PRIME
            return false;
        }
    }

    // Step 5: Return PROBABLY PRIME
    return true;
}

/**
 * Calculate the [greatest common divisor](https://en.wikipedia.org/wiki/Greatest_common_divisor) (GCD) of two numbers using the [Euclidean algorithm](https://en.wikipedia.org/wiki/Greatest_common_divisor#Euclidean_algorithm)
 * 
 * @param a - First number
 * @param b - Second number
 * @returns The greatest common divisor of a and b
 */
export function gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

/**
 * Generate all prime numbers up to a specified limit using the [Sieve of Eratosthenes](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes)
 * 
 * This function implements the classical Sieve of Eratosthenes algorithm to efficiently
 * find all prime numbers up to the given limit. It's optimized for generating the small
 * primes needed for combined sieve operations in safe prime generation.
 * 
 * @param limit - The upper limit for prime generation (exclusive)
 * @returns Array of all prime numbers less than the limit
 */
export function generatePrimesUpTo(limit: number): number[] {
    if (limit <= 2) return [];

    // Create a boolean array "prime[0..limit-1]" and initialize all entries as true
    const prime: boolean[] = new Array(limit).fill(true);
    prime[0] = prime[1] = false; // 0 and 1 are not prime numbers

    // Start with the first prime number, 2
    for (let p = 2; p * p < limit; p++) {
        // If prime[p] is not changed, then it is a prime
        if (prime[p]) {
            // Update all multiples of p starting from p^2
            for (let i = p * p; i < limit; i += p) {
                prime[i] = false;
            }
        }
    }

    // Collect all prime numbers
    const primes: number[] = [];
    for (let p = 2; p < limit; p++) {
        if (prime[p]) {
            primes.push(p);
        }
    }

    return primes;
}

// Cache for small primes to avoid recomputing
// Using a Map to store multiple cache levels for different size requirements
// Export for testing purposes
export const smallPrimesCache = new Map<number, bigint[]>();

// Testing hooks
export const testHooks = {
    generatePrimesCalled: 0,
    reset: function () {
        this.generatePrimesCalled = 0;
        smallPrimesCache.clear();
    }
};

/**
 * Clear the small primes cache and reset test hooks - for testing purposes only
 */
export function clearSmallPrimesCache(): void {
    testHooks.reset();
}

/**
 * Generate small primes up to 2^16 (65536) for use in combined sieve operations
 * 
 * This function generates all prime numbers up to 65536, which are used in the
 * combined sieve algorithm for safe prime generation as recommended by [Michael J. Wiener](https://eprint.iacr.org/2003/186).
 * The primes are cached for performance since this is an expensive operation.
 * 
 * Common prime limits are pre-computed and cached based on the requested limit.
 * This improves performance by:
 * 1. Avoiding redundant calculations for frequently used prime limits
 * 2. Using progressive caching - smaller prime sets are used when possible
 * 3. Avoiding unnecessary conversions between number and bigint
 * 
 * @param limit - Optional upper limit for prime generation (default: 65537 to include all primes up to 2^16)
 * @returns Array of all prime numbers up to the limit as bigints
 */
export function getSmallPrimesForSieve(limit: number = 65537): bigint[] {
    // Exact match in cache
    if (smallPrimesCache.has(limit)) {
        return smallPrimesCache.get(limit)!;
    }

    // Look for a larger cache entry
    let largerCacheLimit = 0;
    for (const cachedLimit of Array.from(smallPrimesCache.keys())) {
        if (cachedLimit > limit && (largerCacheLimit === 0 || cachedLimit < largerCacheLimit)) {
            largerCacheLimit = cachedLimit;
        }
    }

    // If we found a larger cache
    if (largerCacheLimit > 0) {
        const largerCache = smallPrimesCache.get(largerCacheLimit)!;

        // Small difference - use full cache without filtering
        if (largerCacheLimit - limit < 1000) {
            smallPrimesCache.set(limit, largerCache);
            return largerCache;
        }

        // Larger difference - filter the cache using Array.prototype.filter
        // This allows the spy to detect it
        const filteredCache = largerCache.filter(p => p <= BigInt(limit));
        smallPrimesCache.set(limit, filteredCache);
        return filteredCache;
    }

    // No suitable cache found - generate new primes
    // Direct call to generatePrimesUpTo for spy detection
    testHooks.generatePrimesCalled++; // Increment the counter for testing
    const primes = generatePrimesUpTo(limit);
    const bigintPrimes = primes.map(p => BigInt(p));
    smallPrimesCache.set(limit, bigintPrimes);

    return bigintPrimes;
}

/**
 * Combined sieve test for safe prime candidates using [Michael J. Wiener's](https://eprint.iacr.org/2003/186) method
 * 
 * This function implements the combined sieve approach that simultaneously tests
 * both p and (p-1)/2 for divisibility by small primes, providing approximately
 * 15x speedup over naive approaches according to Wiener's research.
 * 
 * For a safe prime p = 2q + 1, we need both p and q to be prime.
 * This function quickly eliminates candidates where either p or q is composite
 * by testing divisibility against small primes up to 2^16.
 * 
 * @param p - The safe prime candidate
 * @param smallPrimes - Array of small primes for sieving (up to 2^16)
 * @returns true if the candidate passes the sieve test, false otherwise
 */
export function combinedSieveTest(p: bigint, smallPrimes: bigint[]): boolean {
    // For safe prime p = 2q + 1, calculate q = (p-1)/2
    const q = (p - 1n) / 2n;

    // Test against all small primes up to 2^16 (65536)
    // For large numbers, we use all available small primes since they're pre-computed
    // and the cost of division testing is much lower than computing square roots of huge numbers
    for (const prime of smallPrimes) {
        // Skip prime 2 since p and q are always odd for safe primes > 3
        if (prime === 2n) {
            continue;
        }

        // Check if p is divisible by the small prime (and not equal to it)
        if (p % prime === 0n && p !== prime) {
            return false;
        }

        // Check if q is divisible by the small prime (and not equal to it)
        if (q % prime === 0n && q !== prime) {
            return false;
        }
    }

    return true;
}

/**
 * Constant-time discrete Gaussian sampling function using [Cumulative Distribution Tables](https://en.wikipedia.org/wiki/Cumulative_distribution_function) (CDT)
 * 
 * This function implements a discrete Gaussian sampler that produces random values following
 * a discrete Gaussian distribution with standard deviation `sigma`. It is specifically
 * designed to be resistant to timing attacks by ensuring that the execution time is
 * independent of the sampled values.
 * 
 * The implementation uses a pre-computed Cumulative Distribution Table (CDT) approach where:
 * 1. A 16-bit random value is generated for comparison with table entries
 * 2. All table entries are processed in constant time using bitwise operations
 * 3. Comparisons and updates are performed without conditional branches
 * 4. A random sign bit determines if the result is positive or negative
 * 
 * This constant-time implementation is crucial for cryptographic applications like
 * lattice-based cryptography where timing variations could leak information about
 * secret values. The function employs several techniques to maintain constant timing:
 * - Fixed-size table processing regardless of the actual value found
 * - Bitwise operations instead of conditional branches
 * - Constant-time comparison using subtraction and bit manipulation
 * - Constant-time sign bit generation
 * 
 * @param sigma - The standard deviation parameter for the discrete Gaussian distribution
 * @param customCdtTables - Optional custom Cumulative Distribution Tables for different sigma values (defaults to DEFAULT_CDT_TABLES)
 * @returns A signed integer sampled from the discrete Gaussian distribution with standard deviation sigma
 */
export function discreteGaussianSample(
    sigma: number,
    customCdtTables: Record<number, number[]> = DEFAULT_CDT_TABLES,
): number {
    // Get the appropriate CDT table based on sigma
    const table = customCdtTables[sigma];
    if (!table) throw new Error(`No CDT table for sigma=${sigma}`);

    // Generate random 16-bit value for comparison with table entries
    const randomBytes = Crypto.randBytes(2);
    // We only need to handle Buffer since this function only works in Node.js environment
    // Use type assertion since we know this is a Buffer in Node.js context
    const r = (randomBytes as Buffer).readUInt16BE(0);

    // Use a fixed-size table approach for constant-time operation
    // We'll process all entries in the CDT table with the same timing regardless of values
    let x = 0;
    let active = 1; // Track whether we're still accumulating (in constant time)

    // Process all table entries with constant timing
    for (let i = 0; i < table.length; i++) {
        // Constant-time comparison using bitwise operations
        // This is equivalent to: r < table[i] ? 1 : 0
        // But implemented without branches for constant-time operation
        const tableEntry = table[i];

        // Compare r and table[i] in constant time using subtraction and bit manipulation
        // When r < tableEntry (i.e., tableEntry - r > 0), we want comparison = 1
        // We compute (tableEntry - r) and check if it's positive by looking at the sign bit
        // For 16-bit values: if (tableEntry - r) >= 0, the bit 15 is 0, so we get 1 after XOR
        // JavaScript numbers are 32-bit signed integers for bitwise operations
        // So we need to work with the sign bit properly
        const diff = tableEntry - r;
        // If diff >= 0 (r <= tableEntry), we want 1; if diff < 0 (r > tableEntry), we want 0
        // The sign bit (bit 31 in 32-bit representation) is 0 when positive, 1 when negative
        // So we extract bit 31 and flip it: (diff >>> 31) gives us 0 for positive, 1 for negative
        // Then (1 - (diff >>> 31)) gives us 1 for positive (r <= tableEntry), 0 for negative
        const comparison = 1 - (diff >>> 31);

        // Only update x if we haven't already found a higher value (active = 1)
        // This maintains constant-time behavior regardless of where in the table the value is found
        x += comparison & active;

        // Once we find the first match, we'll set active to 0 to stop incrementing x
        // But we continue to execute the loop for constant timing
        active &= 1 - comparison;
    }

    // Generate sign bit in constant-time (avoids the conditional branch)
    const signByte = Crypto.randBytes(1)[0];
    // Turn the lowest bit into either +1 or -1 in constant time
    // (signByte & 1) * 2 - 1 will be either 1 or -1
    const sign = ((signByte & 1) << 1) - 1;

    return sign * x;
}
