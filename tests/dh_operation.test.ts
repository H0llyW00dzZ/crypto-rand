import * as crypto from 'crypto';
import { Crypto, randSafePrime, randSafePrimeAsync } from '../src/rand';
import { isProbablePrime, isProbablePrimeAsync, modPow } from '../src/math_helper';

// Note: This test currently uses only 64 bits for a prime because it can be overhead on [x64](https://en.wikipedia.org/wiki/X86-64). hahaha
// However, on ARM, it can handle even more than 64 bits.
// The truth is, the overhead is due to the architecture, not because the algorithm is slow. 
// Even for RSA, which is not a slow algorithm, architecture plays a significant role.
describe('Safe Prime Generation and Diffie-Hellman Operations', () => {

  // Use the actual crypto random bytes function for better testing
  const cryptoRandomBytes = (size: number): Buffer => {
    return Crypto.randBytes(size) as Buffer;
  };

  const cryptoRandomBytesAsync = async (size: number): Promise<Buffer> => {
    return Crypto.randBytesAsync(size) as Promise<Buffer>;
  };

  describe('randSafePrime()', () => {
    describe('basic functionality', () => {
      test('should return a BigInt', () => {
        // Use small bit size for faster tests
        const result = randSafePrime(32, 38, false);
        expect(typeof result).toBe('bigint');
      });

      test('should generate a safe prime number', () => {
        // A safe prime p is of the form p = 2q + 1 where q is also prime
        // Use small bit size for faster tests
        const p = randSafePrime(32, 38, false);

        // Check that p is prime
        expect(isProbablePrime(p, 38, cryptoRandomBytes)).toBe(true);

        // Check that q = (p-1)/2 is also prime
        const q = (p - 1n) / 2n;
        expect(isProbablePrime(q, 38, cryptoRandomBytes)).toBe(true);
      });

      test('should generate safe prime with specified bit length', () => {
        const bits = 32;
        const prime = Crypto.randSafePrime(bits, 38, false);

        // Check bit length
        const bitLength = prime.toString(2).length;
        expect(bitLength).toBe(bits);
      });
    });

    describe('parameter validation', () => {
      test('should throw error for invalid bit length', () => {
        expect(() => Crypto.randSafePrime(0)).toThrow('Bit length must be an integer greater than or equal to 2');
        expect(() => Crypto.randSafePrime(1)).toThrow('Bit length must be an integer greater than or equal to 2');
        expect(() => Crypto.randSafePrime(1.5)).toThrow('Bit length must be an integer greater than or equal to 2');
      });

      test('should throw error for invalid iteration count', () => {
        expect(() => Crypto.randSafePrime(32, 0)).toThrow('Number of iterations must be a positive integer');
        expect(() => Crypto.randSafePrime(32, -1)).toThrow('Number of iterations must be a positive integer');
        expect(() => Crypto.randSafePrime(32, 1.5)).toThrow('Number of iterations must be a positive integer');
      });
    });

    describe('browser environment', () => {
      test('should throw error in browser environment', () => {
        // Mock browser environment
        const originalIsBrowser = Crypto['isBrowser'];
        Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

        expect(() => Crypto.randSafePrime()).toThrow(
          'randSafePrime is not available in browser environment. This method requires Node.js crypto module.'
        );

        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      });
    });

    describe('security properties', () => {
      test('should generate different safe primes on multiple calls', () => {
        const prime1 = Crypto.randSafePrime(32, 38, false);
        const prime2 = Crypto.randSafePrime(32, 38, false);
        expect(prime1).not.toBe(prime2);
      });

      test('should handle common cryptographic bit lengths', () => {
        // Test with small bit lengths for faster tests
        const bitLengths = [16, 24, 32];

        bitLengths.forEach(bits => {
          const prime = Crypto.randSafePrime(bits, 38, false);
          expect(typeof prime).toBe('bigint');
          expect(prime.toString(2).length).toBe(bits);

          // Verify it's a safe prime
          const q = (prime - 1n) / 2n;
          expect(isProbablePrime(q, 38, crypto.randomBytes)).toBe(true);
        });
      });
    });

    describe('performance', () => {
      test('should complete in reasonable time for small bit lengths', () => {
        const startTime = Date.now();
        Crypto.randSafePrime(32, 38, false);
        const endTime = Date.now();

        // Should complete within a reasonable time
        expect(endTime - startTime).toBeLessThan(5000);
      });
    });
  });

  describe('randSafePrimeAsync()', () => {
    // These tests use small bit sizes for faster execution

    it('should generate a safe prime with the correct bit length', async () => {
      const bits = 32;
      const prime = await randSafePrimeAsync(bits, 38, false);

      // Check bit length
      const bitLength = prime.toString(2).length;
      expect(bitLength).toBe(bits);

      // Verify it's a safe prime
      const q = (prime - 1n) / 2n;
      expect(await isProbablePrimeAsync(q, 38, cryptoRandomBytesAsync)).toBe(true);
    });

    it('should generate different safe primes on multiple calls', async () => {
      const [prime1, prime2] = await Promise.all([
        // When the bit value is small, it can be particularly risky.
        // I'm also pretty sure it might cause the default entropy for random bytes that Node.js uses with OpenSSL to be poor,
        // which is why it can be risky, due to how the algorithm works.
        Crypto.randSafePrimeAsync(32, 38, false),
        Crypto.randSafePrimeAsync(32, 38, false)
      ]);

      expect(prime1).not.toBe(prime2);
    });

    it('should throw error for invalid bit length', async () => {
      await expect(randSafePrimeAsync(0)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
      await expect(randSafePrimeAsync(1)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
      await expect(randSafePrimeAsync(1.5)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
    });

    it('should throw error for invalid iterations', async () => {
      await expect(randSafePrimeAsync(16, 0)).rejects.toThrow('Number of iterations must be a positive integer');
      await expect(randSafePrimeAsync(16, -1)).rejects.toThrow('Number of iterations must be a positive integer');
      await expect(randSafePrimeAsync(16, 1.5)).rejects.toThrow('Number of iterations must be a positive integer');
    });

    it('should throw error in browser environment', async () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        await expect(randSafePrimeAsync()).rejects.toThrow('randSafePrimeAsync is not available in browser environment');
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('Diffie-Hellman Key Exchange', () => {
    /**
     * Performs a Diffie-Hellman key exchange operation
     * 
     * @param p - The safe prime modulus
     * @param g - The generator (typically 2 or 5)
     * @param privateKey - The private key
     * @returns The public key
     */
    function dhGeneratePublicKey(p: bigint, g: bigint, privateKey: bigint): bigint {
      return modPow(g, privateKey, p);
    }

    /**
     * Computes the shared secret in a Diffie-Hellman key exchange
     * 
     * @param p - The safe prime modulus
     * @param publicKey - The other party's public key
     * @param privateKey - Your private key
     * @returns The shared secret
     */
    function dhComputeSharedSecret(p: bigint, publicKey: bigint, privateKey: bigint): bigint {
      return modPow(publicKey, privateKey, p);
    }

    test('should successfully perform Diffie-Hellman key exchange with safe prime', () => {
      // Generate a safe prime for Diffie-Hellman
      const p = Crypto.randSafePrime(64, 38, false);

      // Use 2 as the generator (common choice for Diffie-Hellman)
      const g = 2n;

      // Generate private keys for Alice and Bob
      // In a real scenario, these would be large random numbers
      // Using 256-bit private keys which is secure for DH
      const alicePrivateKey = Crypto.randBigInt(256);
      const bobPrivateKey = Crypto.randBigInt(256);

      // Generate public keys
      const alicePublicKey = dhGeneratePublicKey(p, g, alicePrivateKey);
      const bobPublicKey = dhGeneratePublicKey(p, g, bobPrivateKey);

      // Compute shared secrets
      const aliceSharedSecret = dhComputeSharedSecret(p, bobPublicKey, alicePrivateKey);
      const bobSharedSecret = dhComputeSharedSecret(p, alicePublicKey, bobPrivateKey);

      // Both parties should arrive at the same shared secret
      expect(aliceSharedSecret).toBe(bobSharedSecret);
    });

    test('should generate different shared secrets with different private keys', () => {
      // Generate a safe prime for Diffie-Hellman
      const p = Crypto.randSafePrime(64, 38, false);
      const g = 2n;

      // First key exchange
      // Using 256-bit private keys which is secure for DH
      const alicePrivateKey1 = Crypto.randBigInt(256);
      const bobPrivateKey1 = Crypto.randBigInt(256);

      const bobPublicKey1 = dhGeneratePublicKey(p, g, bobPrivateKey1);

      const sharedSecret1 = dhComputeSharedSecret(p, bobPublicKey1, alicePrivateKey1);

      // Second key exchange with different private keys
      // Using 256-bit private keys which is secure for DH
      const alicePrivateKey2 = Crypto.randBigInt(256);
      const bobPrivateKey2 = Crypto.randBigInt(256);

      const bobPublicKey2 = dhGeneratePublicKey(p, g, bobPrivateKey2);

      const sharedSecret2 = dhComputeSharedSecret(p, bobPublicKey2, alicePrivateKey2);

      // The shared secrets should be different
      expect(sharedSecret1).not.toBe(sharedSecret2);
    });

    test('should work with different generators', () => {
      // Generate a safe prime for Diffie-Hellman
      const p = Crypto.randSafePrime(64, 38, false);

      // Use different generators
      const generators = [2n, 5n];

      for (const g of generators) {
        // Generate private keys
        // Using 256-bit private keys which is secure for DH
        const alicePrivateKey = Crypto.randBigInt(256);
        const bobPrivateKey = Crypto.randBigInt(256);

        // Generate public keys
        const alicePublicKey = dhGeneratePublicKey(p, g, alicePrivateKey);
        const bobPublicKey = dhGeneratePublicKey(p, g, bobPrivateKey);

        // Compute shared secrets
        const aliceSharedSecret = dhComputeSharedSecret(p, bobPublicKey, alicePrivateKey);
        const bobSharedSecret = dhComputeSharedSecret(p, alicePublicKey, bobPrivateKey);

        // Both parties should arrive at the same shared secret
        expect(aliceSharedSecret).toBe(bobSharedSecret);
      }
    });

    test('should demonstrate resistance to small subgroup attacks', () => {
      // Generate a safe prime for Diffie-Hellman
      // Safe primes help prevent small subgroup attacks because the order of the subgroup is (p-1)/2, which is also prime
      const p = Crypto.randSafePrime(64, 38, false);

      // Verify that (p-1)/2 is prime (this is what makes it a safe prime)
      const q = (p - 1n) / 2n;
      expect(isProbablePrime(q, 38, cryptoRandomBytes)).toBe(true);

      // With a safe prime p, the subgroup generated by g=2 has order q, which is large and prime
      // This makes small subgroup attacks infeasible

      // Demonstrate a normal key exchange
      const g = 2n;
      // Using 256-bit private keys which is secure for DH
      const alicePrivateKey = Crypto.randBigInt(256);
      const bobPrivateKey = Crypto.randBigInt(256);

      const alicePublicKey = dhGeneratePublicKey(p, g, alicePrivateKey);
      const bobPublicKey = dhGeneratePublicKey(p, g, bobPrivateKey);

      // Verify that public keys are not in a small subgroup
      // For a safe prime, the only small subgroup elements are 1 and p-1
      expect(alicePublicKey).not.toBe(1n);
      expect(alicePublicKey).not.toBe(p - 1n);
      expect(bobPublicKey).not.toBe(1n);
      expect(bobPublicKey).not.toBe(p - 1n);

      // Compute shared secrets
      const aliceSharedSecret = dhComputeSharedSecret(p, bobPublicKey, alicePrivateKey);
      const bobSharedSecret = dhComputeSharedSecret(p, alicePublicKey, bobPrivateKey);

      // Both parties should arrive at the same shared secret
      expect(aliceSharedSecret).toBe(bobSharedSecret);
    });

    // This is literally an overhead on [x64](https://en.wikipedia.org/wiki/X86-64). hahahaha
    // With ECC, this would likely be fine to implement in TypeScript/JavaScript because ECC involves small and fast computations.
    test('should work with async safe prime generation', async () => {
      // Skip test on x64 arch
      if (process.arch === 'x64') {
        console.log('Skipping async safe prime generation test on x64 arch due to overhead. hahaha');
        return;
      }

      jest.setTimeout(185000);
      // Generate a safe prime asynchronously
      const p = await Crypto.randSafePrimeAsync(2048, 5, false);
      const g = 2n;

      // Generate private keys
      // Using 256-bit private keys which is secure for DH
      const alicePrivateKey = await Crypto.randBigIntAsync(256);
      const bobPrivateKey = await Crypto.randBigIntAsync(256);

      // Generate public keys
      const alicePublicKey = dhGeneratePublicKey(p, g, alicePrivateKey);
      const bobPublicKey = dhGeneratePublicKey(p, g, bobPrivateKey);

      // Compute shared secrets
      const aliceSharedSecret = dhComputeSharedSecret(p, bobPublicKey, alicePrivateKey);
      const bobSharedSecret = dhComputeSharedSecret(p, alicePublicKey, bobPrivateKey);

      // Both parties should arrive at the same shared secret
      expect(aliceSharedSecret).toBe(bobSharedSecret);
    }, 350000);
  });
});
