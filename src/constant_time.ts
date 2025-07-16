/**
 * Internal constant time utilities for cryptographic operations.
 * These functions are intended for internal use only within the crypto-rand package,
 * such as for testing purposes.
 */

/**
 * Performs a constant-time comparison of two values to prevent timing attacks.
 * 
 * This function compares two values (strings, Buffers, or Uint8Arrays) in a way that
 * takes the same amount of time regardless of how many bytes match. This is important
 * for cryptographic operations to prevent timing attacks where an attacker could
 * determine secret values by measuring the time it takes to compare them.
 * 
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns A boolean indicating whether the values are equal
 */
export function constantTimeCompare(
    a: string | Buffer | Uint8Array,
    b: string | Buffer | Uint8Array
): boolean {
    // Convert strings to Buffers if needed
    const bufferA = typeof a === 'string' ? Buffer.from(a) : Buffer.from(a);
    const bufferB = typeof b === 'string' ? Buffer.from(b) : Buffer.from(b);

    // If lengths are different, return false but still do the comparison
    // to ensure constant time operation
    const result = bufferA.length === bufferB.length ? 1 : 0;

    // Use a single variable to accumulate differences
    // This ensures we always process all bytes regardless of mismatches
    let diff = 0;

    // Compare all bytes from the shorter buffer
    const minLength = Math.min(bufferA.length, bufferB.length);
    for (let i = 0; i < minLength; i++) {
        // Use bitwise XOR to detect differences (0 if same, non-zero if different)
        // and bitwise OR to accumulate any differences
        diff |= bufferA[i] ^ bufferB[i];
    }

    // If lengths are different, ensure diff is non-zero
    if (bufferA.length !== bufferB.length) {
        diff |= 1;
    }

    // Return true only if no differences were found and lengths are equal
    return diff === 0 && result === 1;
}
