/**
 * Internal math utilities for cryptographic operations.
 * These functions are intended for internal use only within the crypto-rand package,
 * such as for testing purposes.
 */
import * as crypto from 'crypto';

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
const smallPrimesCache = new Map<number, bigint[]>();

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
    // Fast path for common limit (full sieve size)
    if (limit === 65537 && smallPrimesCache.has(65537)) {
        return smallPrimesCache.get(65537)!;
    }

    // Check if we already have a cache for the exact limit
    if (smallPrimesCache.has(limit)) {
        return smallPrimesCache.get(limit)!;
    }

    // Check if we have a larger cache that includes all the primes we need
    const cachedLimits = Array.from(smallPrimesCache.keys()).sort((a, b) => b - a);
    for (const cachedLimit of cachedLimits) {
        if (cachedLimit > limit) {
            // We can reuse the larger cache and filter it down
            const largerCache = smallPrimesCache.get(cachedLimit)!;
            // No need to filter if the difference is small
            if (cachedLimit - limit < 1000) {
                return largerCache;
            }
            // Filter the larger cache to only include primes up to the requested limit
            const filteredCache = largerCache.filter(p => p <= BigInt(limit));
            smallPrimesCache.set(limit, filteredCache);
            return filteredCache;
        }
    }

    // Generate primes and cache the result
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
