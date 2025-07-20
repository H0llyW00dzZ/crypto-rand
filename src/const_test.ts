/**
 * Constants used for cryptographic testing purposes.
 * This file contains predefined values that are used consistently across test cases
 * to ensure reproducible and efficient test execution.
 */

/**
 * The standard bit length for [prime numbers](https://en.wikipedia.org/wiki/Prime_number) used in [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) key generation during testing.
 * 
 * This constant is used to:
 * - Generate [prime numbers](https://en.wikipedia.org/wiki/Prime_number) of consistent size for [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) key pairs
 * - Verify that generated keys have the expected bit length
 * - Create cryptographic keys of sufficient strength for thorough testing
 * 
 * A value of 2048 provides a good balance between security and performance.
 * Unlike 4096, which, although strong, is not balanced between security and performance due to its slowness. Be smart in your choice.
 */
export const expectedBitLength: number = 2048;

/**
 * The number of iterations/rounds used in primality testing during test execution.
 * 
 * This constant is used as the accuracy parameter in Crypto.randPrime() and Crypto.randPrimeAsync() function calls
 * throughout the test suite. A reduced value (27) is used specifically for testing to:
 * - Speed up test execution time
 * - Maintain reasonable confidence in the primality of generated numbers
 * - Provide consistent behavior across different test scenarios
 * 
 * Note: In production environments, a higher value would typically be used for
 * stronger guarantees of primality.
 */
export const expectedAccuracy: number = 27;
