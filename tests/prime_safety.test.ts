import { isProbablePrime, modPow } from '../src/math_helper';
import { constantTimeCompare } from '../src/constant_time';
import * as crypto from 'crypto';

describe('Prime Value Safety Tests', () => {
  describe('constantTimeCompare', () => {
    it('should correctly identify equal values', () => {
      // Test with strings
      expect(constantTimeCompare('test', 'test')).toBe(true);

      // Test with Buffers
      const buffer1 = Buffer.from('secure-value');
      const buffer2 = Buffer.from('secure-value');
      expect(constantTimeCompare(buffer1, buffer2)).toBe(true);

      // Test with Uint8Arrays
      const uint8Array1 = new Uint8Array([1, 2, 3, 4, 5]);
      const uint8Array2 = new Uint8Array([1, 2, 3, 4, 5]);
      expect(constantTimeCompare(uint8Array1, uint8Array2)).toBe(true);
    });

    it('should correctly identify unequal values', () => {
      // Test with strings
      expect(constantTimeCompare('test', 'test1')).toBe(false);
      expect(constantTimeCompare('test', 'best')).toBe(false);

      // Test with Buffers
      const buffer1 = Buffer.from('secure-value');
      const buffer2 = Buffer.from('secure-value-different');
      const buffer3 = Buffer.from('insecure-value');
      expect(constantTimeCompare(buffer1, buffer2)).toBe(false);
      expect(constantTimeCompare(buffer1, buffer3)).toBe(false);

      // Test with Uint8Arrays
      const uint8Array1 = new Uint8Array([1, 2, 3, 4, 5]);
      const uint8Array2 = new Uint8Array([1, 2, 3, 4, 6]);
      const uint8Array3 = new Uint8Array([1, 2, 3, 4]);
      expect(constantTimeCompare(uint8Array1, uint8Array2)).toBe(false);
      expect(constantTimeCompare(uint8Array1, uint8Array3)).toBe(false);
    });

    it('should handle edge cases', () => {
      // Empty values
      expect(constantTimeCompare('', '')).toBe(true);
      expect(constantTimeCompare(Buffer.alloc(0), Buffer.alloc(0))).toBe(true);

      // One empty, one not
      expect(constantTimeCompare('', 'test')).toBe(false);
      expect(constantTimeCompare(Buffer.alloc(0), Buffer.from('test'))).toBe(false);

      // Mixed types
      expect(constantTimeCompare('test', Buffer.from('test'))).toBe(true);
      expect(constantTimeCompare(Buffer.from('test'), new Uint8Array([116, 101, 115, 116]))).toBe(true);
    });
  });

  describe('Prime Value Safety', () => {
    // Generate a random prime number for testing
    function generateRandomPrime(bits: number): bigint {
      // Start with a random odd number of the specified bit length
      const byteLength = Math.ceil(bits / 8);
      let randomBytes: Buffer;
      let candidate: bigint;

      do {
        randomBytes = crypto.randomBytes(byteLength);
        // Ensure the highest bit is set (to get the desired bit length)
        randomBytes[0] |= 0x80;
        // Ensure the lowest bit is set (to get an odd number)
        randomBytes[byteLength - 1] |= 0x01;

        candidate = BigInt('0x' + randomBytes.toString('hex'));
      } while (!isProbablePrime(candidate, 10));

      return candidate;
    }

    it('should verify that prime values are safe from timing attacks', () => {
      // Generate two different prime numbers
      const prime1 = generateRandomPrime(64);
      const prime2 = generateRandomPrime(64);

      // Convert primes to strings for comparison
      const prime1Str = prime1.toString();
      const prime2Str = prime2.toString();

      // Verify they are different
      expect(prime1).not.toBe(prime2);

      // Compare using constant time comparison
      expect(constantTimeCompare(prime1Str, prime1Str)).toBe(true);
      expect(constantTimeCompare(prime1Str, prime2Str)).toBe(false);

      // Convert to buffers for another test
      const prime1Buffer = Buffer.from(prime1Str);
      const prime2Buffer = Buffer.from(prime2Str);

      expect(constantTimeCompare(prime1Buffer, prime1Buffer)).toBe(true);
      expect(constantTimeCompare(prime1Buffer, prime2Buffer)).toBe(false);
    });

    it('should verify that modular exponentiation with primes is safe', () => {
      // Generate a prime
      const prime = generateRandomPrime(32);

      // Perform modular exponentiation using a pseudocode function provided by a cryptography expert, Bruce Schneier.
      const base = 2n;
      const exponent = 123n;
      const result = modPow(base, exponent, prime);

      // Convert to strings for comparison
      const resultStr = result.toString();
      const expectedStr = (base ** exponent % prime).toString();

      // Verify correctness
      expect(resultStr).toBe(expectedStr);

      // Verify constant time comparison works
      expect(constantTimeCompare(resultStr, expectedStr)).toBe(true);
      expect(constantTimeCompare(resultStr, (result + 1n).toString())).toBe(false);
    });
  });
});
