
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
