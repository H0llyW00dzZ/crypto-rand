
/**
 * Cryptographic constants for secure random generation
 */

// Default character set for random string generation
export const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Hex character set
export const HEX_CHARSET = '0123456789abcdef';

// Base64 character set
export const BASE64_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Alphanumeric character set
export const ALPHANUMERIC_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Numeric character set
export const NUMERIC_CHARSET = '0123456789';

// Lowercase letters
export const LOWERCASE_CHARSET = 'abcdefghijklmnopqrstuvwxyz';

// Uppercase letters
export const UPPERCASE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Special characters for passwords
export const SPECIAL_CHARSET = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Full charset including special characters
export const FULL_CHARSET = DEFAULT_CHARSET + SPECIAL_CHARSET;

/**
 * Precomputed [Cumulative Distribution Tables (CDT)](https://en.wikipedia.org/wiki/Cumulative_distribution_function) for discrete Gaussian sampling
 * 
 * CDT is a technique used in lattice-based cryptography for sampling from discrete Gaussian distributions
 * in a way that's resistant to timing attacks. These tables contain precomputed probability values that
 * allow for constant-time sampling operations without conditional branches.
 * 
 * Key characteristics:
 * - Values are scaled by 2^16 (65536) for integer comparison efficiency
 * - The table for sigma = 3.2 uses a tailcut ≈ 13, meaning it covers ±13 standard deviations
 * - Sigma = 3.2 is commonly used in lattice-based cryptographic schemes as it provides a good
 *   balance between security and performance
 * 
 * These tables are primarily used by the randLattice function to generate cryptographically secure
 * random numbers using lattice-based mathematical operations. The discrete Gaussian sampling
 * process uses these tables to transform uniform random bits into a Gaussian distribution.
 * 
 * Format: { sigma_value: [table_entries] }
 * Where each table entry represents the scaled cumulative probability at integer points
 */
export const DEFAULT_CDT_TABLES: Record<number, number[]> = {
    3.2: [65535, 63963, 60395, 55305, 49438, 43597, 38341, 33914, 30338, 27508, 25235, 23401, 21897, 20628],
};
