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
 * **Note:** This implementation is essentially the same as previous constant-time comparison functions (SHA: ***8575fdccff6aa7bedabb638cfb8a7394e0f9e1a4***),
 * using the standard pattern of bitwise operations to ensure timing consistency.
 * 
 * **TODO:** Consider reverting this later to roll back to SHA: ***8575fdccff6aa7bedabb638cfb8a7394e0f9e1a4***.
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

    // If lengths are different, return false immediately
    // This looks bad because it returns directly.
    if (bufferA.length !== bufferB.length) {
        return false;
    }

    // Use a single variable to accumulate differences
    let diff = 0;

    // Compare all bytes
    for (let i = 0; i < bufferA.length; i++) {
        // Use bitwise XOR to detect differences and bitwise OR to accumulate them
        diff |= bufferA[i] ^ bufferB[i];
    }

    // Return true only if no differences were found
    return diff === 0;
}
