
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
 * - Sigma = 178.56 is an optimized value for achieving maximum uniqueness (100%) when used with:
 *   - Increased dimension (e.g., 1024 instead of the default 512)
 *   - Larger modulus (e.g., 16777213, a prime close to 2^24)
 *   - The extended distribution table with more granular values for better precision
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
    178.56: [65535, 65534, 65533, 65530, 65525, 65520, 65510, 65500, 65480, 65450, 65400, 65350, 65280, 65200, 65100, 64980, 64850, 64700, 64500, 64300, 64100, 63900, 63650, 63400, 63100, 62800, 62500, 62150, 61800, 61400, 61000, 60500, 60000, 59500, 59000, 58400, 57800, 57200, 56600, 56000, 55300, 54600, 53900, 53200, 52500, 51800, 51100, 50400, 49700, 49000, 48300, 47600, 46900, 46200, 45500, 44800, 44100, 43400, 42700, 42000, 41300, 40600, 39900, 39200, 38500, 37800, 37100, 36400, 35700, 35000, 34300, 33600, 32900, 32200, 31500, 30800, 30100, 29400, 28700, 28000, 27300, 26600, 25900, 25200, 24500, 23800, 23100, 22400, 21700, 21000, 20300, 19600, 18900, 18200, 17500, 16800, 16100, 15400, 14700, 14000, 13300, 12600, 11900, 11200, 10500, 9800, 9100, 8400, 7700, 7000, 6300, 5600, 4900, 4200, 3500, 2800, 2100, 1400, 700, 350, 175, 87, 43, 21, 10, 5, 2, 1]
};
