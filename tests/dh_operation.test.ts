import * as crypto from 'crypto';
import * as os from 'os';
import { Crypto, randSafePrime, randSafePrimeAsync } from '../src/rand';
import { isProbablePrime, isProbablePrimeAsync, modPow } from '../src/math_helper';

// Note: This test currently uses only 64 bits for a prime because it can be overhead on [x64](https://en.wikipedia.org/wiki/X86-64). hahaha
// However, on ARM, it can handle even more than 64 bits.
// The truth is, the overhead is due to the architecture, not because the algorithm is slow. 
// Even for RSA, which is not a slow algorithm, architecture plays a significant role.
describe('Safe Prime Generation and Diffie-Hellman Operations', () => {
  // Skip tests if not in Node.js environment
  const isNodeEnv = typeof window === 'undefined';

  if (!isNodeEnv) {
    console.log('Skipping tests in browser environment');
    return;
  }

  // Use the actual crypto random bytes function for better testing
  const cryptoRandomBytes = (size: number): Buffer => {
    return Crypto.randBytes(size) as Buffer;
  };

  const cryptoRandomBytesAsync = async (size: number): Promise<Buffer> => {
    return Crypto.randBytesAsync(size) as Promise<Buffer>;
  };

  /**
   * Determines if tests should be skipped based on platform and Node.js version
   * 
   * **Note:** Any OS, Node.js platform, release, or version that fails in the [CI/CD 🧪 Test Coverage Runner](https://github.com/H0llyW00dzZ/crypto-rand/actions)
   * due to timeouts caused by excessive overhead (too slow) will be added here. hahaha
   * 
   * @param nodejsVersion - The Node.js version string (defaults to current process.version)
   * @param osPlatform - The operating system platform (defaults to current os.platform())
   * @param osReleaseVal - The operating system release (defaults to current os.release())
   * @param osVersionVal - The operating system version (defaults to current os.version())
   * @returns Boolean indicating whether tests should be skipped
   */
  function shouldSkipOnSlowPlatform(
    nodejsVersion: string = process.version,
    osPlatform: string = os.platform(),
    osReleaseVal: string = os.release(),
    osVersionVal: string = os.version()
  ): boolean {

    // Windows Server 2025 Datacenter with Node.js v23
    const skipNode23inWindows2025 = osPlatform === 'win32' &&
      osVersionVal.includes('Windows Server 2025 Datacenter') &&
      nodejsVersion.startsWith('v23');

    // Windows Server 2022 Datacenter with Node.js v22
    const skipNode22inWindows2022 = osPlatform === 'win32' &&
      osVersionVal.includes('Windows Server 2022 Datacenter') &&
      nodejsVersion.startsWith('v22');

    // Windows Server 2022 Datacenter with Node.js v19
    const skipNode19inWindows2022 = osPlatform === 'win32' &&
      osVersionVal.includes('Windows Server 2022 Datacenter') &&
      nodejsVersion.startsWith('v19');

    // macOS 13 (Ventura)
    const isMacOS13 = osPlatform === 'darwin' && osReleaseVal.startsWith('22.');

    // macOS 15 (Sequoia) with Node.js v23
    const skipNode23inSequoia = osPlatform === 'darwin' && osReleaseVal.startsWith('24.') && nodejsVersion.startsWith('v23');

    return skipNode23inWindows2025 || isMacOS13 || skipNode22inWindows2022 || skipNode19inWindows2022 || skipNode23inSequoia;
  }

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

  /**
   * Simulates a [Key Derivation Function (KDF)](https://en.wikipedia.org/wiki/Key_derivation_function) for [Triple Diffie-Hellman](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange#Triple_Diffie%E2%80%93Hellman_(3-DH))
   * 
   * This implementation follows [HKDF (HMAC-based Key Derivation Function)](https://en.wikipedia.org/wiki/HKDF) principles
   * with extract and expand phases as defined in [RFC 5869](https://datatracker.ietf.org/doc/html/rfc5869).
   * 
   * For testing purposes, we use a fixed salt when none is provided to ensure
   * consistent results across multiple calls with the same input.
   * 
   * @param secrets - Array of shared secrets to be combined
   * @param salt - Optional salt value (recommended for stronger security)
   * @param info - Optional context/application specific information
   * @param length - Optional length of the output key material in bytes (default: 32)
   * @returns A derived key as a hex string
   */
  function simulateKDF(
    secrets: bigint[],
    salt?: Buffer<ArrayBufferLike> | string,
    info: Buffer<ArrayBufferLike> | string = Buffer.from('TripleDH-KDF'),
    length: number = 32
  ): string {
    // Validate length parameter
    if (length <= 0) {
      throw new Error('Length must be positive');
    }

    const maxLength = 255 * 32; // 255 * HashLen for SHA-256
    if (length > maxLength) {
      throw new Error(`Length too large. Maximum is ${maxLength} bytes for SHA-256`);
    }

    // Use a fixed salt for testing consistency if none provided
    const saltBuffer = salt
      ? (typeof salt === 'string' ? Buffer.from(salt, 'utf8') : Buffer.from(salt))
      : Buffer.from('fixed-test-salt-for-consistency', 'utf8');

    const infoBuffer = typeof info === 'string' ? Buffer.from(info, 'utf8') : Buffer.from(info);

    // Convert all secrets to buffers and concatenate them
    const combinedBuffer = Buffer.concat(
      secrets.map(secret => {
        // Convert bigint to hex string, ensuring even length
        let hexStr = secret.toString(16);
        // Pad with leading zero if odd length to prevent data loss
        if (hexStr.length % 2 !== 0) {
          hexStr = '0' + hexStr;
        }
        return Buffer.from(hexStr, 'hex');
      })
    );

    // 1. Extract phase: HMAC(salt, input_key_material)
    // This creates a pseudorandom key (PRK) from the input key material
    const prk = crypto.createHmac('sha256', saltBuffer)
      .update(combinedBuffer)
      .digest();

    // 2. Expand phase: Generate output key material of desired length
    let output = Buffer.alloc(0);
    let T: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let i = 0;

    // Generate enough output material to reach the desired length
    while (output.length < length) {
      i++;
      // T(i) = HMAC-Hash(PRK, T(i-1) | info | i)
      const hmac = crypto.createHmac('sha256', prk);
      hmac.update(Buffer.concat([T, infoBuffer, Buffer.from([i])]));
      T = hmac.digest();
      output = Buffer.concat([output, T]);
    }

    // Truncate to the desired length and convert to hex
    const truncatedOutput = output.subarray(0, length);
    return Array.from(truncatedOutput).map(b => b.toString(16).padStart(2, '0')).join('');
  }

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

    // Skip test on slow platforms
    (shouldSkipOnSlowPlatform() ? test.skip : test)('should generate different safe primes on multiple calls', async () => {
      const [prime1, prime2] = await Promise.all([
        // When the bit value is small, it can be particularly risky.
        // I'm also pretty sure it might cause the default entropy for random bytes that Node.js uses with OpenSSL to be poor,
        // which is why it can be risky, due to how the algorithm works.
        Crypto.randSafePrimeAsync(1024, 15, false),
        Crypto.randSafePrimeAsync(1024, 15, false)
      ]);

      expect(prime1).not.toBe(prime2);
    }, 700000); // Increased to 700000 due to performance overhead on macOS 13 running on Intel x64 processors. hahaha

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

    // This test uses the optimized implementation for large bit sizes
    // which significantly improves performance compared to the previous implementation
    // However, on slow platforms it's too slow and should be skipped
    (shouldSkipOnSlowPlatform() ? test.skip : test)(
      'should work with async safe prime generation',
      async () => {
        console.time('2048-bit safe prime generation');
        // Generate a 2048-bit safe prime asynchronously
        const p = await Crypto.randSafePrimeAsync(2048, 15, false);
        console.timeEnd('2048-bit safe prime generation');

        // Verify bit length
        expect(p.toString(2).length).toBe(2048);

        // Verify it's a safe prime
        const q = (p - 1n) / 2n;
        expect(await isProbablePrimeAsync(q, 15, cryptoRandomBytesAsync)).toBe(true);
        expect(await isProbablePrimeAsync(p, 15, cryptoRandomBytesAsync)).toBe(true);

        const g = 2n;

        // Generate private keys
        // Using 256-bit private keys which is secure for DH
        const alicePrivateKey = await Crypto.randBigIntAsync(256);
        const bobPrivateKey = await Crypto.randBigIntAsync(256);

        // Generate public keys
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
        //
        // Note: This is not magic, it's proof that numbers don't lie
        expect(aliceSharedSecret).toBe(bobSharedSecret);
      },
      1000000
    );
  });

  test('should successfully perform Triple Diffie-Hellman (3-DH) key exchange', () => {
    // Generate a safe prime for Diffie-Hellman
    const p = Crypto.randSafePrime(64, 15, false);

    // Use 2 as the generator (common choice for Diffie-Hellman)
    const g = 2n;

    // Generate long-term identity key pairs for Alice and Bob
    const aliceIdentityPrivate = Crypto.randBigInt(256);
    const bobIdentityPrivate = Crypto.randBigInt(256);

    const aliceIdentityPublic = dhGeneratePublicKey(p, g, aliceIdentityPrivate);
    const bobIdentityPublic = dhGeneratePublicKey(p, g, bobIdentityPrivate);

    // Generate ephemeral key pairs for Alice and Bob (used only for this session)
    const aliceEphemeralPrivate = Crypto.randBigInt(256);
    const bobEphemeralPrivate = Crypto.randBigInt(256);

    const aliceEphemeralPublic = dhGeneratePublicKey(p, g, aliceEphemeralPrivate);
    const bobEphemeralPublic = dhGeneratePublicKey(p, g, bobEphemeralPrivate);

    // Triple Diffie-Hellman key exchange components:

    // 1. DH1: Alice's identity key with Bob's identity key
    const dh1Alice = dhComputeSharedSecret(p, bobIdentityPublic, aliceIdentityPrivate);
    const dh1Bob = dhComputeSharedSecret(p, aliceIdentityPublic, bobIdentityPrivate);

    // 2. DH2: Alice's ephemeral key with Bob's identity key
    const dh2Alice = dhComputeSharedSecret(p, bobIdentityPublic, aliceEphemeralPrivate);
    const dh2Bob = dhComputeSharedSecret(p, aliceEphemeralPublic, bobIdentityPrivate);

    // 3. DH3: Alice's identity key with Bob's ephemeral key
    const dh3Alice = dhComputeSharedSecret(p, bobEphemeralPublic, aliceIdentityPrivate);
    const dh3Bob = dhComputeSharedSecret(p, aliceIdentityPublic, bobEphemeralPrivate);

    // 4. DH4: Alice's ephemeral key with Bob's ephemeral key
    const dh4Alice = dhComputeSharedSecret(p, bobEphemeralPublic, aliceEphemeralPrivate);
    const dh4Bob = dhComputeSharedSecret(p, aliceEphemeralPublic, bobEphemeralPrivate);

    // Verify each DH component matches between Alice and Bob
    expect(dh1Alice).toBe(dh1Bob);
    expect(dh2Alice).toBe(dh2Bob);
    expect(dh3Alice).toBe(dh3Bob);
    expect(dh4Alice).toBe(dh4Bob);

    // In a real implementation, these values would be combined with a KDF (Key Derivation Function)
    // For this test, we'll simulate a KDF using our function with the same salt for both parties
    const kdfSalt = Buffer.from('consistent-salt-for-3dh-tests', 'utf8');
    const aliceSharedSecret = simulateKDF([dh1Alice, dh2Alice, dh3Alice, dh4Alice], kdfSalt);
    const bobSharedSecret = simulateKDF([dh1Bob, dh2Bob, dh3Bob, dh4Bob], kdfSalt);

    // Both parties should arrive at the same shared secret
    //
    // Note: This is not magic, it's proof that numbers don't lie
    expect(aliceSharedSecret).toBe(bobSharedSecret);
  });

  test('should successfully perform Triple Diffie-Hellman (3-DH) key exchange with async prime generation', async () => {
    jest.setTimeout(100000);

    // Generate a safe prime asynchronously (using smaller bit size for simulation)
    const p = await Crypto.randSafePrimeAsync(64, 15, false);
    const g = 2n;

    // Generate long-term identity key pairs for Alice and Bob
    const aliceIdentityPrivate = await Crypto.randBigIntAsync(256);
    const bobIdentityPrivate = await Crypto.randBigIntAsync(256);

    const aliceIdentityPublic = dhGeneratePublicKey(p, g, aliceIdentityPrivate);
    const bobIdentityPublic = dhGeneratePublicKey(p, g, bobIdentityPrivate);

    // Generate ephemeral key pairs for Alice and Bob (used only for this session)
    const aliceEphemeralPrivate = await Crypto.randBigIntAsync(256);
    const bobEphemeralPrivate = await Crypto.randBigIntAsync(256);

    const aliceEphemeralPublic = dhGeneratePublicKey(p, g, aliceEphemeralPrivate);
    const bobEphemeralPublic = dhGeneratePublicKey(p, g, bobEphemeralPrivate);

    // Triple Diffie-Hellman key exchange components:

    // 1. DH1: Alice's identity key with Bob's identity key
    const dh1Alice = dhComputeSharedSecret(p, bobIdentityPublic, aliceIdentityPrivate);
    const dh1Bob = dhComputeSharedSecret(p, aliceIdentityPublic, bobIdentityPrivate);

    // 2. DH2: Alice's ephemeral key with Bob's identity key
    const dh2Alice = dhComputeSharedSecret(p, bobIdentityPublic, aliceEphemeralPrivate);
    const dh2Bob = dhComputeSharedSecret(p, aliceEphemeralPublic, bobIdentityPrivate);

    // 3. DH3: Alice's identity key with Bob's ephemeral key
    const dh3Alice = dhComputeSharedSecret(p, bobEphemeralPublic, aliceIdentityPrivate);
    const dh3Bob = dhComputeSharedSecret(p, aliceIdentityPublic, bobEphemeralPrivate);

    // 4. DH4: Alice's ephemeral key with Bob's ephemeral key
    const dh4Alice = dhComputeSharedSecret(p, bobEphemeralPublic, aliceEphemeralPrivate);
    const dh4Bob = dhComputeSharedSecret(p, aliceEphemeralPublic, bobEphemeralPrivate);

    // Verify each DH component matches between Alice and Bob
    expect(dh1Alice).toBe(dh1Bob);
    expect(dh2Alice).toBe(dh2Bob);
    expect(dh3Alice).toBe(dh3Bob);
    expect(dh4Alice).toBe(dh4Bob);

    // In a real implementation, these values would be combined with a KDF (Key Derivation Function)
    // For this test, we'll simulate a KDF using our function
    const kdfSalt = Buffer.from('consistent-salt-for-3dh-tests', 'utf8');
    const aliceSharedSecret = simulateKDF([dh1Alice, dh2Alice, dh3Alice, dh4Alice], kdfSalt);
    const bobSharedSecret = simulateKDF([dh1Bob, dh2Bob, dh3Bob, dh4Bob], kdfSalt);

    // Both parties should arrive at the same shared secret
    //
    // Note: This is not magic, it's proof that numbers don't lie
    expect(aliceSharedSecret).toBe(bobSharedSecret);
  }, 350000);

  test('should simulate Signal-like key ratcheting with forward secrecy', () => {
    // Initial setup - simulate a Triple DH key exchange (X3DH)
    const p = Crypto.randSafePrime(64, 15, false);
    const g = 2n;

    // Generate initial DH secrets (simulating X3DH output)
    const initialSecrets = [
      Crypto.randBigInt(256), // IK_A * SPK_B
      Crypto.randBigInt(256), // EK_A * IK_B  
      Crypto.randBigInt(256), // EK_A * SPK_B
      Crypto.randBigInt(256)  // EK_A * OPK_B
    ];

    const salt = Buffer.from('signal-double-ratchet', 'utf8');

    // Derive initial root key from X3DH output
    let rootKey = simulateKDF(initialSecrets, salt, 'initial-root-key', 32);

    // Initialize sending and receiving chains
    const sendingChainKeys: string[] = [];
    const receivingChainKeys: string[] = [];
    const messageKeys: string[] = [];
    const rootKeys: string[] = [rootKey];

    // Simulate Double Ratchet with both DH ratchet and symmetric ratchet
    for (let dhRatchetStep = 0; dhRatchetStep < 3; dhRatchetStep++) {
      // DH Ratchet: Generate new ephemeral DH key pair
      const newDHPrivate = Crypto.randBigInt(256);

      // Simulate receiving party's DH public key
      const otherDHPrivate = Crypto.randBigInt(256);
      const otherDHPublic = dhGeneratePublicKey(p, g, otherDHPrivate);

      // Compute new DH shared secret
      const newDHSecret = dhComputeSharedSecret(p, otherDHPublic, newDHPrivate);

      // Root key ratchet: derive new root key and initial chain key
      const rootKeyBigInt = BigInt('0x' + rootKey);
      const kdfOutput = simulateKDF([rootKeyBigInt, newDHSecret], salt, `dh-ratchet-${dhRatchetStep}`, 64);

      // Split KDF output: first 32 bytes for new root key, next 32 bytes for chain key
      rootKey = kdfOutput.substring(0, 64);  // First 32 bytes (64 hex chars)
      let chainKey = kdfOutput.substring(64, 128); // Next 32 bytes (64 hex chars)

      rootKeys.push(rootKey);

      // Determine if this is sending or receiving chain
      const isSendingChain = dhRatchetStep % 2 === 0;
      if (isSendingChain) {
        sendingChainKeys.push(chainKey);
      } else {
        receivingChainKeys.push(chainKey);
      }

      // Symmetric ratchet: derive multiple message keys from chain key
      for (let msgIndex = 0; msgIndex < 3; msgIndex++) {
        const chainKeyBigInt = BigInt('0x' + chainKey);

        // Derive message key (for encryption/decryption)
        const messageKey = simulateKDF([chainKeyBigInt], salt, `message-${dhRatchetStep}-${msgIndex}`, 32);
        messageKeys.push(messageKey);

        // Advance chain key (symmetric ratchet step)
        chainKey = simulateKDF([chainKeyBigInt], salt, `next-chain-${dhRatchetStep}-${msgIndex}`, 32);
      }
    }

    // Verify forward secrecy: all keys must be unique
    const allKeys = [...rootKeys, ...sendingChainKeys, ...receivingChainKeys, ...messageKeys];
    const uniqueKeys = new Set(allKeys);
    expect(uniqueKeys.size).toBe(allKeys.length);

    // Verify proper key hierarchy
    expect(rootKeys).toHaveLength(4); // Initial + 3 DH ratchet steps
    expect(sendingChainKeys.length + receivingChainKeys.length).toBe(3); // 3 DH ratchet steps
    expect(messageKeys).toHaveLength(9); // 3 DH steps * 3 messages each

    // Verify cryptographic properties
    allKeys.forEach(key => {
      expect(key).toMatch(/^[0-9a-f]+$/); // Valid hex
      expect(key.length).toBe(64); // 32 bytes = 64 hex chars
    });

    // Test key deletion simulation (forward secrecy)
    // In real Signal, old keys are deleted after use
    const oldRootKey = rootKeys[0];
    const currentRootKey = rootKeys[rootKeys.length - 1];
    expect(oldRootKey).not.toBe(currentRootKey);

    // Verify that knowing current keys doesn't reveal previous keys
    // (This is ensured by the one-way nature of KDF, but we test uniqueness)
    const firstMessageKey = messageKeys[0];
    const lastMessageKey = messageKeys[messageKeys.length - 1];
    expect(firstMessageKey).not.toBe(lastMessageKey);
  });

  test('should derive multiple specialized keys from same DH output', () => {
    // Simulate X3DH output (Extended Triple Diffie-Hellman)
    const x3dhSecrets = [
      Crypto.randBigInt(256), // IK_A * SPK_B (Identity Key * Signed Prekey)
      Crypto.randBigInt(256), // EK_A * IK_B  (Ephemeral Key * Identity Key)
      Crypto.randBigInt(256), // EK_A * SPK_B (Ephemeral Key * Signed Prekey)
      Crypto.randBigInt(256)  // EK_A * OPK_B (Ephemeral Key * One-time Prekey)
    ];

    const salt = Buffer.from('signal-key-derivation-v1', 'utf8');

    // Derive specialized keys for different cryptographic purposes
    // Following Signal Protocol key derivation patterns

    // 1. Message encryption keys (AES-256-GCM)
    const messageEncryptionKey = simulateKDF(x3dhSecrets, salt, 'message-encryption-aes256', 32);

    // 2. Message authentication keys (HMAC-SHA256)
    const messageAuthKey = simulateKDF(x3dhSecrets, salt, 'message-authentication-hmac', 32);

    // 3. Header encryption key (for metadata protection)
    const headerEncryptionKey = simulateKDF(x3dhSecrets, salt, 'header-encryption-aes256', 32);

    // 4. IV/Nonce generation seed
    const ivGenerationSeed = simulateKDF(x3dhSecrets, salt, 'iv-generation-seed', 16);

    // 5. Next root key for Double Ratchet initialization
    const initialRootKey = simulateKDF(x3dhSecrets, salt, 'double-ratchet-root-key', 32);

    // 6. Chain key for initial sending chain
    const initialChainKey = simulateKDF(x3dhSecrets, salt, 'initial-sending-chain-key', 32);

    // 7. Key for encrypting prekey bundles
    const prekeyBundleKey = simulateKDF(x3dhSecrets, salt, 'prekey-bundle-encryption', 32);

    // 8. Session identifier derivation
    const sessionId = simulateKDF(x3dhSecrets, salt, 'session-identifier', 16);

    // 9. Backup/export key (for key backup systems)
    const backupKey = simulateKDF(x3dhSecrets, salt, 'backup-encryption-key', 32);

    // Collect all derived keys
    const allKeys = [
      messageEncryptionKey,
      messageAuthKey,
      headerEncryptionKey,
      ivGenerationSeed,
      initialRootKey,
      initialChainKey,
      prekeyBundleKey,
      sessionId,
      backupKey
    ];

    // Test 1: Domain separation - all keys must be unique
    const uniqueKeys = new Set(allKeys);
    expect(uniqueKeys.size).toBe(allKeys.length);

    // Test 2: Verify correct key lengths for their intended purposes
    expect(messageEncryptionKey).toHaveLength(64);  // 32 bytes for AES-256
    expect(messageAuthKey).toHaveLength(64);        // 32 bytes for HMAC-SHA256
    expect(headerEncryptionKey).toHaveLength(64);   // 32 bytes for AES-256
    expect(ivGenerationSeed).toHaveLength(32);      // 16 bytes for IV seed
    expect(initialRootKey).toHaveLength(64);        // 32 bytes for root key
    expect(initialChainKey).toHaveLength(64);       // 32 bytes for chain key
    expect(prekeyBundleKey).toHaveLength(64);       // 32 bytes for AES-256
    expect(sessionId).toHaveLength(32);             // 16 bytes for session ID
    expect(backupKey).toHaveLength(64);             // 32 bytes for backup encryption

    // Test 3: Cryptographic properties validation
    const hexRegex = /^[0-9a-f]+$/;
    allKeys.forEach((key, index) => {
      // Valid hexadecimal encoding
      expect(hexRegex.test(key)).toBe(true);

      // No obvious patterns (basic entropy check)
      expect(key).not.toMatch(/^0+$/); // Not all zeros
      expect(key).not.toMatch(/^f+$/); // Not all ones
      expect(key).not.toMatch(/^(..)\1+$/); // No simple repetition
    });

    // Test 4: Deterministic derivation (same input produces same output)
    const messageEncryptionKey2 = simulateKDF(x3dhSecrets, salt, 'message-encryption-aes256', 32);
    expect(messageEncryptionKey).toBe(messageEncryptionKey2);

    // Test 5: Different info contexts produce different keys
    const altMessageKey = simulateKDF(x3dhSecrets, salt, 'message-encryption-aes256-alt', 32);
    expect(messageEncryptionKey).not.toBe(altMessageKey);

    // Test 6: Different salt produces different keys
    const altSalt = Buffer.from('signal-key-derivation-v2', 'utf8');
    const altEncryptionKey = simulateKDF(x3dhSecrets, altSalt, 'message-encryption-aes256', 32);
    expect(messageEncryptionKey).not.toBe(altEncryptionKey);

    // Test 7: Key independence - changing one input secret affects all keys
    const modifiedSecrets = [...x3dhSecrets];
    modifiedSecrets[0] = Crypto.randBigInt(256); // Change first secret

    const modifiedMessageKey = simulateKDF(modifiedSecrets, salt, 'message-encryption-aes256', 32);
    expect(messageEncryptionKey).not.toBe(modifiedMessageKey);

    // Test 8: Simulate realistic key usage patterns
    // Derive sub-keys from main encryption key for different message types
    const textMessageKey = simulateKDF([BigInt('0x' + messageEncryptionKey)], salt, 'text-message', 32);
    const imageMessageKey = simulateKDF([BigInt('0x' + messageEncryptionKey)], salt, 'image-message', 32);
    const voiceMessageKey = simulateKDF([BigInt('0x' + messageEncryptionKey)], salt, 'voice-message', 32);

    const messageTypeKeys = [textMessageKey, imageMessageKey, voiceMessageKey];
    const uniqueMessageKeys = new Set(messageTypeKeys);
    expect(uniqueMessageKeys.size).toBe(messageTypeKeys.length);

    // These sub-keys should also be different from the parent key
    messageTypeKeys.forEach(subKey => {
      expect(subKey).not.toBe(messageEncryptionKey);
    });
  });

  test('should simulate TLS 1.3 style key schedule', () => {
    // Simulate handshake secrets (like ECDHE output)
    const handshakeSecrets = [
      Crypto.randBigInt(256), // ECDHE secret
      Crypto.randBigInt(256)  // PSK (if any)
    ];

    const salt = Buffer.from('tls13-key-schedule', 'utf8');

    // Early Secret (normally from PSK)
    const earlySecret = simulateKDF([handshakeSecrets[1]], salt, 'early-secret', 32);

    // Handshake Secret
    const earlySecretBigInt = BigInt('0x' + earlySecret);
    const handshakeSecret = simulateKDF([earlySecretBigInt, handshakeSecrets[0]], salt, 'handshake-secret', 32);

    // Master Secret
    const handshakeSecretBigInt = BigInt('0x' + handshakeSecret);
    const masterSecret = simulateKDF([handshakeSecretBigInt], salt, 'master-secret', 32);

    // Traffic Keys (client and server)
    const masterSecretBigInt = BigInt('0x' + masterSecret);
    const clientHandshakeKey = simulateKDF([handshakeSecretBigInt], salt, 'client-handshake-traffic', 32);
    const serverHandshakeKey = simulateKDF([handshakeSecretBigInt], salt, 'server-handshake-traffic', 32);
    const clientAppKey = simulateKDF([masterSecretBigInt], salt, 'client-application-traffic', 32);
    const serverAppKey = simulateKDF([masterSecretBigInt], salt, 'server-application-traffic', 32);

    // Verify key hierarchy and uniqueness
    const allSecrets = [earlySecret, handshakeSecret, masterSecret, clientHandshakeKey, serverHandshakeKey, clientAppKey, serverAppKey];
    const uniqueSecrets = new Set(allSecrets);
    expect(uniqueSecrets.size).toBe(allSecrets.length);

    // Verify each secret is 32 bytes (64 hex chars)
    allSecrets.forEach(secret => {
      expect(secret).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(secret)).toBe(true);
    });
  });

  test('should demonstrate key evolution with previous key input', () => {
    // Start with initial shared secret
    const initialSecret = Crypto.randBigInt(256);
    const salt = Buffer.from('key-evolution', 'utf8');

    // Evolve keys through multiple generations
    let currentKey = simulateKDF([initialSecret], salt, 'generation-0', 32);
    const keyHistory: string[] = [currentKey];

    // Each generation uses previous key + new randomness
    for (let generation = 1; generation <= 10; generation++) {
      const newRandomness = Crypto.randBigInt(128); // New entropy
      const currentKeyBigInt = BigInt('0x' + currentKey);

      currentKey = simulateKDF([currentKeyBigInt, newRandomness], salt, `generation-${generation}`, 32);
      keyHistory.push(currentKey);
    }

    // Verify all keys in chain are unique
    const uniqueKeys = new Set(keyHistory);
    expect(uniqueKeys.size).toBe(keyHistory.length);
    expect(keyHistory).toHaveLength(11); // 0-10 generations

    // Verify forward secrecy: knowing current key shouldn't help derive previous keys
    // (This is ensured by the one-way nature of the KDF)
    const lastKey = keyHistory[keyHistory.length - 1];
    const secondLastKey = keyHistory[keyHistory.length - 2];
    expect(lastKey).not.toBe(secondLastKey);
  });

  test('should simulate WhatsApp Double Ratchet key derivation', () => {
    // Simulate initial X3DH output
    const x3dhSecrets = [
      Crypto.randBigInt(256), // IK_A * SPK_B  
      Crypto.randBigInt(256), // EK_A * IK_B
      Crypto.randBigInt(256), // EK_A * SPK_B
      Crypto.randBigInt(256)  // EK_A * OPK_B
    ];

    const salt = Buffer.from('double-ratchet-sim', 'utf8');

    // Initial root key from X3DH
    let rootKey = simulateKDF(x3dhSecrets, salt, 'initial-root-key', 32);

    // Simulate sending and receiving chain
    const sendingChainKeys: string[] = [];
    const receivingChainKeys: string[] = [];
    const messageKeys: string[] = [];

    // Simulate 3 DH ratchet steps
    for (let ratchetStep = 0; ratchetStep < 3; ratchetStep++) {
      // New DH key pair for this ratchet
      const newDHSecret = Crypto.randBigInt(256);

      // Update root key and derive new chain key
      const rootKeyBigInt = BigInt('0x' + rootKey);
      const kdfOutput = simulateKDF([rootKeyBigInt, newDHSecret], salt, `ratchet-${ratchetStep}`, 64);

      // Split output into new root key and chain key
      rootKey = kdfOutput.substring(0, 64);  // First 32 bytes
      const chainKey = kdfOutput.substring(64, 128); // Next 32 bytes

      if (ratchetStep % 2 === 0) {
        sendingChainKeys.push(chainKey);
      } else {
        receivingChainKeys.push(chainKey);
      }

      // Derive message keys from chain key (simulate 2 messages per chain)
      let currentChainKey = chainKey;
      for (let msg = 0; msg < 2; msg++) {
        const chainKeyBigInt = BigInt('0x' + currentChainKey);
        const messageKey = simulateKDF([chainKeyBigInt], salt, `message-${ratchetStep}-${msg}`, 32);
        messageKeys.push(messageKey);

        // Update chain key for next message
        currentChainKey = simulateKDF([chainKeyBigInt], salt, `next-chain-${ratchetStep}-${msg}`, 32);
      }
    }

    // Verify all keys are unique (forward secrecy and key isolation)
    const allKeys = [rootKey, ...sendingChainKeys, ...receivingChainKeys, ...messageKeys];
    const uniqueKeys = new Set(allKeys);
    expect(uniqueKeys.size).toBe(allKeys.length);

    // Verify we generated expected number of keys
    expect(messageKeys).toHaveLength(6); // 3 ratchets * 2 messages each
    expect(sendingChainKeys.length + receivingChainKeys.length).toBe(3);
  });

  test('should handle key derivation with different salt values', () => {
    const secrets = [Crypto.randBigInt(256), Crypto.randBigInt(256)];

    // Same secrets with different salts should produce different keys
    const salt1 = Buffer.from('salt-variant-1', 'utf8');
    const salt2 = Buffer.from('salt-variant-2', 'utf8');
    const salt3 = Buffer.from('salt-variant-3', 'utf8');

    const key1 = simulateKDF(secrets, salt1, 'test-key', 32);
    const key2 = simulateKDF(secrets, salt2, 'test-key', 32);
    const key3 = simulateKDF(secrets, salt3, 'test-key', 32);

    // All keys should be different due to different salts
    expect(key1).not.toBe(key2);
    expect(key2).not.toBe(key3);
    expect(key1).not.toBe(key3);

    // But same salt should produce same key (deterministic)
    const key1Repeat = simulateKDF(secrets, salt1, 'test-key', 32);
    expect(key1).toBe(key1Repeat);
  });

  test('should support variable output lengths for different use cases', () => {
    const secrets = [Crypto.randBigInt(256)];
    const salt = Buffer.from('length-test', 'utf8');

    // Different key lengths for different purposes
    const aes128Key = simulateKDF(secrets, salt, 'aes-128', 16);  // 128-bit key
    const aes256Key = simulateKDF(secrets, salt, 'aes-256', 32);  // 256-bit key
    const hmacKey = simulateKDF(secrets, salt, 'hmac-sha256', 32); // HMAC key
    const ivSeed = simulateKDF(secrets, salt, 'iv-seed', 12);     // GCM IV seed
    const longKey = simulateKDF(secrets, salt, 'long-key', 64);   // Custom long key

    // Verify lengths (in hex characters)
    expect(aes128Key).toHaveLength(32);  // 16 bytes = 32 hex chars
    expect(aes256Key).toHaveLength(64);  // 32 bytes = 64 hex chars
    expect(hmacKey).toHaveLength(64);
    expect(ivSeed).toHaveLength(24);     // 12 bytes = 24 hex chars
    expect(longKey).toHaveLength(128);   // 64 bytes = 128 hex chars

    // All keys should be different due to different info contexts
    const allKeys = [aes128Key, aes256Key, hmacKey, ivSeed, longKey];
    const uniqueKeys = new Set(allKeys);
    expect(uniqueKeys.size).toBe(allKeys.length);
  });
});
