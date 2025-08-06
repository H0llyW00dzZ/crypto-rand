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
        const randomBytes = getRandomBytes(64, randFill); // 64 bytes should be enough for most primes
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
            const randomBytes = getRandomBytes(64, randFill); // 64 bytes should be enough for most primes
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
        const randomBytes = await getRandomBytesAsync(64, randFill); // 64 bytes should be enough for most primes
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
            const randomBytes = await getRandomBytesAsync(64, randFill); // 64 bytes should be enough for most primes
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
