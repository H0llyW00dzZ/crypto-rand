import * as MathHelper from '../src/math_helper';
import { Crypto } from '../src/rand';

describe('Math Helper Functions', () => {
  // Skip tests if not in Node.js environment
  const isNodeEnv = typeof window === 'undefined';

  if (!isNodeEnv) {
    console.log('Skipping tests in browser environment');
    return;
  }

  describe('modPow', () => {
    it('should correctly calculate modular exponentiation for small numbers', () => {
      // Test cases: [base, exponent, modulus, expected result]
      const testCases = [
        [2n, 3n, 5n, 3n],     // 2^3 % 5 = 8 % 5 = 3
        [3n, 4n, 7n, 4n],     // 3^4 % 7 = 81 % 7 = 4
        [5n, 2n, 13n, 12n],   // 5^2 % 13 = 25 % 13 = 12
        [7n, 5n, 23n, 17n],   // 7^5 % 23 = 16807 % 23 = 17
      ];

      for (const [base, exponent, modulus, expected] of testCases) {
        const result = MathHelper.modPow(base, exponent, modulus);
        expect(result).toBe(expected);
      }
    });

    it('should correctly calculate modular exponentiation for larger numbers', () => {
      // 2^100 % 1000 = 376
      const result = MathHelper.modPow(2n, 100n, 1000n);
      expect(result).toBe(376n);

      // 3^200 % 10000 = 4001
      const result2 = MathHelper.modPow(3n, 200n, 10000n);
      expect(result2).toBe(4001n);
    });

    it('should handle edge cases', () => {
      // Base case: any number to the power of 0 is 1
      expect(MathHelper.modPow(5n, 0n, 7n)).toBe(1n);

      // Modulus = 1 should always return 0
      expect(MathHelper.modPow(10n, 20n, 1n)).toBe(0n);

      // Exponent = 1 should return base % modulus
      expect(MathHelper.modPow(10n, 1n, 7n)).toBe(3n);

      // Base = 0 should return 0 for any exponent > 0
      expect(MathHelper.modPow(0n, 5n, 7n)).toBe(0n);

      // Base = modulus should return 0
      expect(MathHelper.modPow(7n, 5n, 7n)).toBe(0n);
    });

    it('should be equivalent to direct calculation for small numbers', () => {
      // For small numbers, we can verify against direct calculation
      const base = 3n;
      const exponent = 5n;
      const modulus = 11n;

      // Direct calculation: (3^5) % 11
      const direct = (base ** exponent) % modulus;

      // Using our modPow function
      const result = MathHelper.modPow(base, exponent, modulus);

      expect(result).toBe(direct);
    });
  });

  describe('modInverse', () => {
    it('should correctly calculate modular multiplicative inverse', () => {
      // Test cases: [a, m, expected inverse]
      const testCases = [
        [3n, 11n, 4n],    // (3 * 4) % 11 = 1
        [5n, 11n, 9n],    // (5 * 9) % 11 = 1
        [7n, 11n, 8n],    // (7 * 8) % 11 = 1
        [2n, 5n, 3n],     // (2 * 3) % 5 = 1
      ];

      for (const [a, m, expected] of testCases) {
        const result = MathHelper.modInverse(a, m);
        expect(result).toBe(expected);

        // Verify: (a * result) % m should equal 1
        expect((a * result) % m).toBe(1n);
      }
    });

    it('should handle larger numbers correctly', () => {
      const a = 123456789n;
      const m = 1000000007n; // A prime number

      const result = MathHelper.modInverse(a, m);

      // Verify: (a * result) % m should equal 1
      expect((a * result) % m).toBe(1n);
    });

    it('should throw error when inverse does not exist', () => {
      // When a and m are not coprime, inverse doesn't exist
      expect(() => MathHelper.modInverse(4n, 8n)).toThrow('Modular inverse does not exist');
      expect(() => MathHelper.modInverse(6n, 9n)).toThrow('Modular inverse does not exist');
    });

    it('should handle edge cases', () => {
      // a = 1 should always return 1
      expect(MathHelper.modInverse(1n, 5n)).toBe(1n);

      // a = m-1 should return m-1 for prime m
      const m = 11n; // Prime
      expect(MathHelper.modInverse(m - 1n, m)).toBe(m - 1n);
    });
  });

  describe('isProbablePrime', () => {
    it('should correctly identify small prime numbers', () => {
      const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];

      for (const prime of smallPrimes) {
        expect(MathHelper.isProbablePrime(prime, 5)).toBe(true);
      }
    });

    it('should correctly identify small non-prime numbers', () => {
      const nonPrimes = [1n, 4n, 6n, 8n, 9n, 10n, 12n, 14n, 15n, 16n, 18n, 20n, 21n, 22n, 24n, 25n];

      for (const nonPrime of nonPrimes) {
        expect(MathHelper.isProbablePrime(nonPrime, 5)).toBe(false);
      }
    });

    it('should handle edge cases', () => {
      // 0 and 1 are not prime
      expect(MathHelper.isProbablePrime(0n, 5)).toBe(false);
      expect(MathHelper.isProbablePrime(1n, 5)).toBe(false);

      // 2 and 3 are prime
      expect(MathHelper.isProbablePrime(2n, 5)).toBe(true);
      expect(MathHelper.isProbablePrime(3n, 5)).toBe(true);

      // Even numbers > 2 are not prime
      expect(MathHelper.isProbablePrime(4n, 5)).toBe(false);
      expect(MathHelper.isProbablePrime(100n, 5)).toBe(false);
    });

    it('should work with custom random bytes function', () => {
      // Use the actual crypto random bytes function for better testing
      const cryptoRandomBytes = (size: number): Buffer => {
        return Crypto.randBytes(size) as Buffer;
      };

      // Test with known primes
      expect(MathHelper.isProbablePrime(11n, 5, cryptoRandomBytes)).toBe(true);
      expect(MathHelper.isProbablePrime(23n, 5, cryptoRandomBytes)).toBe(true);

      // Test with known non-primes
      expect(MathHelper.isProbablePrime(15n, 5, cryptoRandomBytes)).toBe(false);
      expect(MathHelper.isProbablePrime(25n, 5, cryptoRandomBytes)).toBe(false);
    });

    it('should correctly identify larger prime numbers', () => {
      // Some known larger primes
      const largerPrimes = [
        97n, 101n, 103n, 107n, 109n, 113n,
        997n, 1009n, 1013n, 1019n,
        10007n, 10009n, 10037n
      ];

      for (const prime of largerPrimes) {
        expect(MathHelper.isProbablePrime(prime, 10)).toBe(true);
      }
    });

    it('should correctly identify larger non-prime numbers', () => {
      // Some known larger non-primes
      const largerNonPrimes = [
        91n, 93n, 94n, 95n, 96n, 98n, 99n, 100n,
        1001n, 1003n, 1005n,
        10001n, 10003n, 10005n
      ];

      for (const nonPrime of largerNonPrimes) {
        expect(MathHelper.isProbablePrime(nonPrime, 10)).toBe(false);
      }
    });
  });

  describe('isProbablePrimeEnhanced', () => {
    // Use the actual crypto random bytes function for better testing
    const cryptoRandomBytes = (size: number): Buffer => {
      return Crypto.randBytes(size) as Buffer;
    };

    it('should work with custom random bytes function', () => {
      // Test with known primes
      expect(MathHelper.isProbablePrime(11n, 5, cryptoRandomBytes, true)).toBe(true);
      expect(MathHelper.isProbablePrime(23n, 5, cryptoRandomBytes, true)).toBe(true);

      // Test with known non-primes
      expect(MathHelper.isProbablePrime(15n, 5, cryptoRandomBytes, true)).toBe(false);
      expect(MathHelper.isProbablePrime(25n, 5, cryptoRandomBytes, true)).toBe(false);
    });

    it('should correctly identify small prime numbers', () => {
      const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];

      for (const prime of smallPrimes) {
        expect(MathHelper.isProbablePrime(prime, 5, cryptoRandomBytes, true)).toBe(true);
      }
    });

    it('should correctly identify small non-prime numbers', () => {
      const nonPrimes = [1n, 4n, 6n, 8n, 9n, 10n, 12n, 14n, 15n, 16n];

      for (const nonPrime of nonPrimes) {
        expect(MathHelper.isProbablePrime(nonPrime, 5, cryptoRandomBytes, true)).toBe(false);
      }
    });

    it('should correctly identify larger prime numbers', () => {
      // Some known larger primes
      const largerPrimes = [
        97n, 101n, 103n, 107n, 109n, 113n,
        997n, 1009n, 1013n, 1019n,
        10007n, 10009n, 10037n
      ];

      for (const prime of largerPrimes) {
        expect(MathHelper.isProbablePrime(prime, 10, cryptoRandomBytes, true)).toBe(true);
      }
    });

    it('should correctly identify larger non-prime numbers', () => {
      // Some known larger non-primes
      const largerNonPrimes = [
        91n, 93n, 94n, 95n, 96n, 98n, 99n, 100n,
        1001n, 1003n, 1005n,
        10001n, 10003n, 10005n
      ];

      for (const nonPrime of largerNonPrimes) {
        expect(MathHelper.isProbablePrime(nonPrime, 10, cryptoRandomBytes, true)).toBe(false);
      }
    });
  });

  describe('isProbablePrimeAsync', () => {
    // Use crypto random bytes async function for better testing
    const cryptoRandomBytesAsync = async (size: number): Promise<Buffer> => {
      return Crypto.randBytesAsync(size) as Promise<Buffer>;
    };

    it('should correctly identify small prime numbers asynchronously', async () => {
      const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];

      for (const prime of smallPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(prime, 5, cryptoRandomBytesAsync);
        expect(result).toBe(true);
      }
    });

    it('should correctly identify small non-prime numbers asynchronously', async () => {
      const nonPrimes = [1n, 4n, 6n, 8n, 9n, 10n, 12n, 14n, 15n, 16n];

      for (const nonPrime of nonPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(nonPrime, 5, cryptoRandomBytesAsync);
        expect(result).toBe(false);
      }
    });

    it('should handle edge cases asynchronously', async () => {
      // 0 and 1 are not prime
      expect(await MathHelper.isProbablePrimeAsync(0n, 5, cryptoRandomBytesAsync)).toBe(false);
      expect(await MathHelper.isProbablePrimeAsync(1n, 5, cryptoRandomBytesAsync)).toBe(false);

      // 2 and 3 are prime
      expect(await MathHelper.isProbablePrimeAsync(2n, 5, cryptoRandomBytesAsync)).toBe(true);
      expect(await MathHelper.isProbablePrimeAsync(3n, 5, cryptoRandomBytesAsync)).toBe(true);

      // Even numbers > 2 are not prime
      expect(await MathHelper.isProbablePrimeAsync(4n, 5, cryptoRandomBytesAsync)).toBe(false);
      expect(await MathHelper.isProbablePrimeAsync(100n, 5, cryptoRandomBytesAsync)).toBe(false);
    });

    it('should correctly identify larger prime numbers asynchronously', async () => {
      // Some known larger primes
      const largerPrimes = [97n, 101n, 103n, 107n, 109n, 113n];

      for (const prime of largerPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(prime, 5, cryptoRandomBytesAsync);
        expect(result).toBe(true);
      }
    });

    it('should correctly identify larger non-prime numbers asynchronously', async () => {
      // Some known larger non-primes
      const largerNonPrimes = [91n, 93n, 94n, 95n, 96n, 98n, 99n, 100n];

      for (const nonPrime of largerNonPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(nonPrime, 5, cryptoRandomBytesAsync);
        expect(result).toBe(false);
      }
    });
  });

  describe('isProbablePrimeAsyncEnhanced', () => {
    // Use crypto random bytes async function for better testing
    const cryptoRandomBytesAsync = async (size: number): Promise<Buffer> => {
      return Crypto.randBytesAsync(size) as Promise<Buffer>;
    };

    it('should correctly identify small prime numbers asynchronously', async () => {
      const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];

      for (const prime of smallPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(prime, 5, cryptoRandomBytesAsync, true);
        expect(result).toBe(true);
      }
    });

    it('should correctly identify small non-prime numbers asynchronously', async () => {
      const nonPrimes = [1n, 4n, 6n, 8n, 9n, 10n, 12n, 14n, 15n, 16n];

      for (const nonPrime of nonPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(nonPrime, 5, cryptoRandomBytesAsync, true);
        expect(result).toBe(false);
      }
    });

    it('should handle edge cases asynchronously', async () => {
      // 0 and 1 are not prime
      expect(await MathHelper.isProbablePrimeAsync(0n, 5, cryptoRandomBytesAsync, true)).toBe(false);
      expect(await MathHelper.isProbablePrimeAsync(1n, 5, cryptoRandomBytesAsync, true)).toBe(false);

      // 2 and 3 are prime
      expect(await MathHelper.isProbablePrimeAsync(2n, 5, cryptoRandomBytesAsync, true)).toBe(true);
      expect(await MathHelper.isProbablePrimeAsync(3n, 5, cryptoRandomBytesAsync, true)).toBe(true);

      // Even numbers > 2 are not prime
      expect(await MathHelper.isProbablePrimeAsync(4n, 5, cryptoRandomBytesAsync, true)).toBe(false);
      expect(await MathHelper.isProbablePrimeAsync(100n, 5, cryptoRandomBytesAsync, true)).toBe(false);
    });

    it('should correctly identify larger prime numbers asynchronously', async () => {
      // Some known larger primes
      const largerPrimes = [97n, 101n, 103n, 107n, 109n, 113n];

      for (const prime of largerPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(prime, 5, cryptoRandomBytesAsync, true);
        expect(result).toBe(true);
      }
    });

    it('should correctly identify larger non-prime numbers asynchronously', async () => {
      // Some known larger non-primes
      const largerNonPrimes = [91n, 93n, 94n, 95n, 96n, 98n, 99n, 100n];

      for (const nonPrime of largerNonPrimes) {
        const result = await MathHelper.isProbablePrimeAsync(nonPrime, 5, cryptoRandomBytesAsync, true);
        expect(result).toBe(false);
      }
    });
  });

  describe('getSmallPrimesForSieve', () => {
    it('should generate primes up to the default limit (65537)', () => {
      const primes = MathHelper.getSmallPrimesForSieve();

      // Verify primes are generated correctly
      expect(primes.length).toBeGreaterThan(0);

      // First few primes should be present
      expect(primes).toContain(2n);
      expect(primes).toContain(3n);
      expect(primes).toContain(5n);
      expect(primes).toContain(7n);

      // Last prime should be less than or equal to 65536
      expect(primes[primes.length - 1]).toBeLessThanOrEqual(65536n);
    });

    it('should generate primes up to a custom limit', () => {
      // Test with a smaller limit
      const limit = 100;
      const primes = MathHelper.getSmallPrimesForSieve(limit);

      // All primes should be less than or equal to the limit
      for (const prime of primes) {
        expect(prime).toBeLessThanOrEqual(BigInt(limit));
      }

      // Verify against manually generated list
      const manualPrimes = MathHelper.generatePrimesUpTo(limit).map(p => BigInt(p));
      expect(primes).toEqual(manualPrimes);
    });

    it('should cache results for repeated calls with the same limit', () => {
      // Clear the cache before starting the test
      MathHelper.clearSmallPrimesCache();

      // First call should generate primes
      const primes1 = MathHelper.getSmallPrimesForSieve(1000);
      expect(MathHelper.testHooks.generatePrimesCalled).toBe(1);

      // Second call with same limit should use cache
      const primes2 = MathHelper.getSmallPrimesForSieve(1000);
      expect(MathHelper.testHooks.generatePrimesCalled).toBe(1); // Still just one call

      // Verify both results are the same
      expect(primes2).toEqual(primes1);
    });

    it('should reuse larger cache for smaller limits when appropriate', () => {
      // Clear the cache before starting the test
      MathHelper.clearSmallPrimesCache();

      // First generate a larger cache
      const largerLimit = 10000;
      const largerPrimes = MathHelper.getSmallPrimesForSieve(largerLimit);
      expect(MathHelper.testHooks.generatePrimesCalled).toBe(1);

      // Now request a smaller limit
      const smallerLimit = 5000;
      const smallerPrimes = MathHelper.getSmallPrimesForSieve(smallerLimit);

      // Should not generate primes again, just filter the cache
      expect(MathHelper.testHooks.generatePrimesCalled).toBe(1);

      // All primes should be less than or equal to the smaller limit
      for (const prime of smallerPrimes) {
        expect(prime).toBeLessThanOrEqual(BigInt(smallerLimit));
      }

      // Length should be less than or equal to larger primes
      expect(smallerPrimes.length).toBeLessThanOrEqual(largerPrimes.length);
    });

    it('should use the full cache without filtering for small differences', () => {
      // Clear the cache before starting the test
      MathHelper.clearSmallPrimesCache();

      // Use a spy to monitor calls to Array.prototype.filter
      const arraySpy = jest.spyOn(Array.prototype, 'filter');

      // Generate a cache with limit 5000
      MathHelper.getSmallPrimesForSieve(5000);

      // Request primes with limit 4500 (difference < 1000)
      MathHelper.getSmallPrimesForSieve(4500);

      // Should not call filter because difference is small
      expect(arraySpy).not.toHaveBeenCalled();

      // Reset for next test
      arraySpy.mockClear();

      // Request primes with limit 3000 (difference > 1000)
      MathHelper.getSmallPrimesForSieve(3000);

      // Should call filter because difference is large
      expect(arraySpy).toHaveBeenCalled();
    });

    it('should properly filter cached results for new limits', () => {
      // Generate a cache with limit 10000
      const largerPrimes = MathHelper.getSmallPrimesForSieve(10000);

      // Get primes with smaller limit that triggers filtering
      const smallerLimit = 1000;
      const smallerPrimes = MathHelper.getSmallPrimesForSieve(smallerLimit);

      // Manual verification
      const manualPrimes = largerPrimes.filter(p => p <= BigInt(smallerLimit));
      expect(smallerPrimes).toEqual(manualPrimes);

      // All primes should be less than or equal to the smaller limit
      for (const prime of smallerPrimes) {
        expect(prime).toBeLessThanOrEqual(BigInt(smallerLimit));
      }
    });

    it('should generate new primes if no suitable cache exists', () => {
      // Clear the cache before starting the test
      MathHelper.clearSmallPrimesCache();

      // First generate primes with smaller limit
      MathHelper.getSmallPrimesForSieve(1000);
      expect(MathHelper.testHooks.generatePrimesCalled).toBe(1);

      // Now request larger limit
      MathHelper.getSmallPrimesForSieve(5000);

      // Should generate primes again
      expect(MathHelper.testHooks.generatePrimesCalled).toBe(2);
    });

    it('should provide performance benefits for repeated operations', () => {
      // Clear the cache before starting the test
      MathHelper.clearSmallPrimesCache();

      // Time measurement for first call (cache miss)
      const startFirstCall = Date.now();
      MathHelper.getSmallPrimesForSieve(20000);
      const firstCallDuration = Date.now() - startFirstCall;

      // Time measurement for second call (cache hit)
      const startSecondCall = Date.now();
      MathHelper.getSmallPrimesForSieve(20000);
      const secondCallDuration = Date.now() - startSecondCall;

      // Second call should be significantly faster
      // Add a small constant to avoid division by zero or very small numbers
      expect(secondCallDuration).toBeLessThan((firstCallDuration + 1) / 2);
    });
  });
});
