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
 * @param k - The number of iterations for the test
 * @param getRandomBytes - Function to generate random bytes (defaults to crypto.randomBytes)
 * @returns A boolean indicating whether the number is probably prime
 */
export function isProbablePrime(
    n: bigint,
    k: number,
    getRandomBytes: (size: number) => Buffer | Uint8Array = crypto.randomBytes
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

    // Witness loop
    for (let i = 0; i < k; i++) {
        // Generate a random integer a in the range [2, n-2]
        const randomBytes = getRandomBytes(64); // 64 bytes should be enough for most primes
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
 * Calculate the [modular multiplicative inverse](https://en.wikipedia.org/wiki/Modular_multiplicative_inverse) using the [Extended Euclidean Algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm)
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
 * @param k - The number of iterations for the test
 * @param getRandomBytesAsync - Async function to generate random bytes
 * @returns A Promise that resolves to a boolean indicating whether the number is probably prime
 */
export async function isProbablePrimeAsync(
    n: bigint,
    k: number,
    getRandomBytesAsync: (size: number) => Promise<Buffer | Uint8Array>
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

    // Witness loop
    for (let i = 0; i < k; i++) {
        // Generate a random integer a in the range [2, n-2]
        const randomBytes = await getRandomBytesAsync(64); // 64 bytes should be enough for most primes
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
