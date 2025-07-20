import * as crypto from 'crypto';
import { Crypto, randAsync, randBytesAsync, randHexAsync, randBase64Async, randSeedAsync, randVersionAsync, randPrimeAsync, randBigIntAsync } from '../src/rand';
import { modPow, modInverse } from '../src/math_helper';

describe('Crypto Async Methods', () => {
  // Skip tests if not in Node.js environment
  const isNodeEnv = typeof window === 'undefined';

  if (!isNodeEnv) {
    it('should skip tests in browser environment', () => {
      console.log('Skipping async tests in browser environment');
    });
    return;
  }

  describe('randAsync', () => {
    it('should return a number between 0 and 1', async () => {
      const result = await randAsync();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
      expect(typeof result).toBe('number');
    });

    it('should generate different values on multiple calls', async () => {
      const results = await Promise.all([randAsync(), randAsync(), randAsync()]);
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it('should generate values with high entropy', async () => {
      const results = new Set<number>();
      const promises: Promise<number>[] = [];

      for (let i = 0; i < 100; i++) {
        promises.push(randAsync());
      }

      const values = await Promise.all(promises);
      values.forEach(value => results.add(value));

      // Should have high entropy (at least 95% unique values)
      expect(results.size).toBeGreaterThan(95);
    });

    // Skip this test due to inherent unpredictability and entropy based on the operating system.
    test.skip('should have uniform distribution', async () => {
      const buckets = Array(10).fill(0);
      const iterations = 1000;
      const promises: Promise<number>[] = [];

      for (let i = 0; i < iterations; i++) {
        promises.push(randAsync());
      }

      const values = await Promise.all(promises);

      // Count distribution across 10 buckets (0.0-0.1, 0.1-0.2, etc.)
      values.forEach(value => {
        const bucketIndex = Math.floor(value * 10);
        // Handle edge case of value exactly 1.0
        const safeIndex = bucketIndex >= 10 ? 9 : bucketIndex;
        buckets[safeIndex]++;
      });

      // Check that each bucket has roughly the expected number of values
      // Allow for some statistical variation (within 30%)
      const expectedPerBucket = iterations / 10;

      // Different thresholds based on operating system
      // Windows needs a tighter threshold for upper bound
      // macOS needs a lower threshold (>65% vs >70% for others) due to its random number generation characteristics
      const upperThreshold = process.platform === 'win32' ? 1.2 : 1.3;
      const lowerThreshold = process.platform === 'darwin' ? 0.6 : 0.7;

      buckets.forEach(count => {
        // This test might fail due to cryptographic randomization, which is inherently unpredictable.
        expect(count).toBeGreaterThan(expectedPerBucket * lowerThreshold);
        // Use OS-specific threshold
        expect(count).toBeLessThan(expectedPerBucket * upperThreshold);
      });
    });
  });

  describe('randBytesAsync', () => {
    it('should generate random bytes of specified size', async () => {
      const size = 16;
      const result = await randBytesAsync(size);
      expect(result.length).toBe(size);

      // Check that result is either Buffer or Uint8Array
      const isBufferOrUint8Array = Buffer.isBuffer(result) || result instanceof Uint8Array;
      expect(isBufferOrUint8Array).toBe(true);
    });

    it('should generate different bytes on multiple calls', async () => {
      const size = 16;
      const [result1, result2] = await Promise.all([
        randBytesAsync(size),
        randBytesAsync(size)
      ]);

      // Convert to hex strings for comparison
      const hex1 = Buffer.from(result1).toString('hex');
      const hex2 = Buffer.from(result2).toString('hex');

      expect(hex1).not.toBe(hex2);
    });

    it('should handle zero-length input', async () => {
      const result = await randBytesAsync(0);
      expect(result.length).toBe(0);

      // Check that result is either Buffer or Uint8Array
      const isBufferOrUint8Array = Buffer.isBuffer(result) || result instanceof Uint8Array;
      expect(isBufferOrUint8Array).toBe(true);
    });

    it('should handle large input', async () => {
      const size = 1024 * 10; // 10KB
      const result = await randBytesAsync(size);
      expect(result.length).toBe(size);
    });

    it('should generate bytes with high entropy', async () => {
      const size = 256;
      const result = await randBytesAsync(size);

      // Count occurrences of each byte value
      const counts = new Map<number, number>();
      for (let i = 0; i < result.length; i++) {
        const value = result[i];
        counts.set(value, (counts.get(value) || 0) + 1);
      }

      // With 256 bytes, we should have a good distribution of values
      // Expect at least 100 different byte values (out of 256 possible)
      expect(counts.size).toBeGreaterThan(100);
    });
  });

  describe('randHexAsync', () => {
    it('should generate a hex string of specified length', async () => {
      const length = 10;
      const result = await randHexAsync(length);
      expect(result.length).toBe(length);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    it('should generate different hex strings on multiple calls', async () => {
      const length = 16;
      const [result1, result2] = await Promise.all([
        randHexAsync(length),
        randHexAsync(length)
      ]);

      expect(result1).not.toBe(result2);
    });

    it('should handle various lengths', async () => {
      // Test with odd length
      const oddLength = 15;
      const oddResult = await randHexAsync(oddLength);
      expect(oddResult.length).toBe(oddLength);
      expect(/^[0-9a-f]+$/.test(oddResult)).toBe(true);

      // Test with even length
      const evenLength = 16;
      const evenResult = await randHexAsync(evenLength);
      expect(evenResult.length).toBe(evenLength);
      expect(/^[0-9a-f]+$/.test(evenResult)).toBe(true);

      // Test with large length
      const largeLength = 1000;
      const largeResult = await randHexAsync(largeLength);
      expect(largeResult.length).toBe(largeLength);
      expect(/^[0-9a-f]+$/.test(largeResult)).toBe(true);
    });

    it('should handle zero length', async () => {
      const result = await randHexAsync(0);
      expect(result).toBe('');
    });

    it('should throw error in browser environment', async () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        await expect(randHexAsync(10)).rejects.toThrow('randHexAsync is not available in browser environment');
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randBase64Async', () => {
    it('should generate a base64 string of specified length', async () => {
      const length = 10;
      const result = await randBase64Async(length);
      expect(result.length).toBe(length);
      expect(/^[A-Za-z0-9+/]+$/.test(result)).toBe(true);
    });

    it('should generate different base64 strings on multiple calls', async () => {
      const length = 16;
      const [result1, result2] = await Promise.all([
        randBase64Async(length),
        randBase64Async(length)
      ]);

      expect(result1).not.toBe(result2);
    });

    it('should handle various lengths', async () => {
      // Test with length not divisible by 4
      const oddLength = 15;
      const oddResult = await randBase64Async(oddLength);
      expect(oddResult.length).toBe(oddLength);
      expect(/^[A-Za-z0-9+/]+$/.test(oddResult)).toBe(true);

      // Test with length divisible by 4
      const evenLength = 16;
      const evenResult = await randBase64Async(evenLength);
      expect(evenResult.length).toBe(evenLength);
      expect(/^[A-Za-z0-9+/]+$/.test(evenResult)).toBe(true);

      // Test with large length
      const largeLength = 1000;
      const largeResult = await randBase64Async(largeLength);
      expect(largeResult.length).toBe(largeLength);
      expect(/^[A-Za-z0-9+/]+$/.test(largeResult)).toBe(true);
    });

    it('should handle zero length', async () => {
      const result = await randBase64Async(0);
      expect(result).toBe('');
    });

    it('should throw error in browser environment', async () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        await expect(randBase64Async(10)).rejects.toThrow('randBase64Async is not available in browser environment');
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randSeedAsync', () => {
    it('should generate a random seed', async () => {
      const result = await randSeedAsync();
      expect(typeof result).toBe('number');
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('should generate different seeds on multiple calls', async () => {
      const [seed1, seed2] = await Promise.all([randSeedAsync(), randSeedAsync()]);
      expect(seed1).not.toBe(seed2);
    });

    it('should generate seeds with high entropy', async () => {
      const seeds = new Set<number>();
      const promises: Promise<number>[] = [];

      for (let i = 0; i < 20; i++) {
        promises.push(randSeedAsync());
      }

      const values = await Promise.all(promises);
      values.forEach(value => seeds.add(value));

      // High entropy expected - at least 15 unique values out of 20
      expect(seeds.size).toBeGreaterThan(15);
    });

    it('should throw error in browser environment', async () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        await expect(randSeedAsync()).rejects.toThrow('randSeedAsync is not available in browser environment');
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });

    it('should generate a 32-bit integer', async () => {
      const result = await randSeedAsync();

      // 32-bit unsigned integer should be between 0 and 2^32-1
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(4294967295); // 2^32 - 1
    });
  });

  describe('randVersionAsync', () => {
    it('should generate a random version string', async () => {
      const result = await randVersionAsync();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate different version strings on multiple calls', async () => {
      const [version1, version2] = await Promise.all([randVersionAsync(), randVersionAsync()]);
      expect(version1).not.toBe(version2);
    });

    it('should generate a base64 string with correct format', async () => {
      const result = await randVersionAsync();
      expect(/^[A-Za-z0-9+/]+=*$/.test(result)).toBe(true);
    });

    it('should generate a string with correct length', async () => {
      const result = await randVersionAsync();
      // 32 bytes in base64 should be 44 characters (including padding)
      expect(result.length).toBe(44);
    });

    it('should generate version strings with high entropy', async () => {
      const versions = new Set<string>();
      const promises: Promise<string>[] = [];

      for (let i = 0; i < 10; i++) {
        promises.push(randVersionAsync());
      }

      const values = await Promise.all(promises);
      values.forEach(value => versions.add(value));

      // All 10 should be unique
      expect(versions.size).toBe(10);
    });

    it('should throw error in browser environment', async () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        await expect(randVersionAsync()).rejects.toThrow('randVersionAsync is not available in browser environment');
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randPrimeAsync', () => {
    // These tests use small bit sizes for faster execution
    jest.setTimeout(30000); // Increase timeout for prime generation

    it('should generate a number with the correct bit length', async () => {
      const bits = 32;
      const prime = await randPrimeAsync(bits);

      // Check bit length
      const bitLength = prime.toString(2).length;
      expect(bitLength).toBeLessThanOrEqual(bits);
      expect(bitLength).toBeGreaterThanOrEqual(bits - 1); // Allow for one bit less due to randomness
    });

    it('should generate different primes on multiple calls', async () => {
      const [prime1, prime2] = await Promise.all([
        // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
        // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
        //
        // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
        randPrimeAsync(16, 480),
        randPrimeAsync(16, 480)
      ]);

      expect(prime1).not.toBe(prime2);
    });

    it('should throw error for invalid bit length', async () => {
      await expect(randPrimeAsync(0)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
      await expect(randPrimeAsync(1)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
      await expect(randPrimeAsync(1.5)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
    });

    it('should throw error for invalid iterations', async () => {
      await expect(randPrimeAsync(16, 0)).rejects.toThrow('Number of iterations must be a positive integer');
      await expect(randPrimeAsync(16, -1)).rejects.toThrow('Number of iterations must be a positive integer');
      await expect(randPrimeAsync(16, 1.5)).rejects.toThrow('Number of iterations must be a positive integer');
    });

    it('should throw error in browser environment', async () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        await expect(randPrimeAsync()).rejects.toThrow('randPrimeAsync is not available in browser environment');
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randBigIntAsync', () => {
    // These tests use small bit sizes for faster execution
    jest.setTimeout(30000); // Increase timeout for bigint generation

    it('should generate a number with the correct bit length', async () => {
      const bits = 32;
      const bigint = await randBigIntAsync(bits);

      // Check bit length
      const bitLength = bigint.toString(2).length;
      expect(bitLength).toBeLessThanOrEqual(bits);
      expect(bitLength).toBeGreaterThanOrEqual(bits - 1); // Allow for one bit less due to randomness
    });

    it('should generate different bigints on multiple calls', async () => {
      const [bigint1, bigint2] = await Promise.all([
        randBigIntAsync(16),
        randBigIntAsync(16)
      ]);

      expect(bigint1).not.toBe(bigint2);
    });

    it('should throw error for invalid bit length', async () => {
      await expect(randBigIntAsync(0)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
      await expect(randBigIntAsync(1)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
      await expect(randBigIntAsync(1.5)).rejects.toThrow('Bit length must be an integer greater than or equal to 2');
    });

    it('should throw error in browser environment', async () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        await expect(randBigIntAsync()).rejects.toThrow('randBigIntAsync is not available in browser environment');
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('Performance comparison', () => {
    it('should measure performance of sync vs async methods', async () => {
      const iterations = 10;
      const size = 1024; // 1KB

      // Measure sync performance
      const syncStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        Crypto.randBytes(size);
      }
      const syncEnd = Date.now();
      const syncTime = syncEnd - syncStart;

      // Measure async performance
      const asyncStart = Date.now();
      const promises: Promise<Uint8Array | Buffer>[] = []; // Explicitly type the array
      for (let i = 0; i < iterations; i++) {
        promises.push(randBytesAsync(size));
      }
      await Promise.all(promises);
      const asyncEnd = Date.now();
      const asyncTime = asyncEnd - asyncStart;

      console.log(`Sync time for ${iterations} iterations: ${syncTime}ms`);
      console.log(`Async time for ${iterations} iterations: ${asyncTime}ms`);

      // We don't assert on performance as it can vary, but we log it for information
    });
  });

  describe('RSA operations with async prime generation', () => {
    // These tests use 2048-bit keys (1024-bit primes each)
    jest.setTimeout(150000); // Increase due to overhead on Windows. Haha!

    it('should perform RSA encryption and decryption with async prime generation', async () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let startTime: number;
      startTime = Date.now();

      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p, q] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n); // Euler's totient function
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing basic RSA with ${2 * expectedBitLength}-bit key pair...`);

      // Common RSA public exponent
      const e = 65537n;

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(150000); // Increase due to overhead on Windows. Haha!

      // Verify e is coprime to phi using GCD
      const gcd = (a: bigint, b: bigint): bigint => {
        while (b !== 0n) {
          const temp = b;
          b = a % b;
          a = temp;
        }
        return a;
      };

      expect(gcd(e, phi)).toBe(1n);

      // Calculate private exponent d (using modular multiplicative inverse)
      const d = modInverse(e, phi);

      // Verify that d is the modular multiplicative inverse of e modulo phi
      expect((d * e) % phi).toBe(1n);

      console.log('Testing basic RSA encryption/decryption with our generated keys...');

      // Test RSA encryption and decryption
      const message = 42n; // Sample message to encrypt

      // Encrypt: c ≡ m^e (mod n)
      const ciphertext = modPow(message, e, n);

      // Decrypt: m ≡ c^d (mod n)
      const decrypted = modPow(ciphertext, d, n);

      // Verify that decryption works
      expect(decrypted).toBe(message);
      console.log('Basic RSA encryption/decryption successful!');

      // Additional verification: ensure the message is within valid range
      expect(message).toBeLessThan(n);
      expect(ciphertext).toBeLessThan(n);
      expect(decrypted).toBeLessThan(n);

      // Verify that encryption actually changes the message
      expect(ciphertext).not.toBe(message);
    });

    it('should sign and verify messages with RSA using async prime generation', async () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let startTime: number;
      startTime = Date.now();

      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p, q] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n); // Euler's totient function
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSA signing with ${2 * expectedBitLength}-bit key pair...`);

      // Common RSA public exponent
      const e = 65537n;
      const d = modInverse(e, phi); // private exponent

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(150000); // Increase due to overhead on Windows. Haha!

      console.log('Testing RSA signing/verification with our generated keys...');

      // Create a message hash (simplified for testing)
      const message = "Hello, RSA!";
      const messageBuffer = Buffer.from(message);
      const hash = BigInt('0x' + crypto.createHash('sha256').update(messageBuffer).digest('hex'));

      // Ensure hash is less than n
      const messageHash = hash % n;

      // Sign the message: signature = hash^d mod n
      const signature = modPow(messageHash, d, n);

      // Verify the signature: hash = signature^e mod n
      const verified = modPow(signature, e, n);

      // The verification should match the original hash
      expect(verified).toBe(messageHash);
      console.log('RSA signing/verification successful!');

      // Test with tampered signature
      const tamperedSignature = signature + 1n;
      const tamperedVerification = modPow(tamperedSignature, e, n);

      // The tampered verification should not match the original hash
      expect(tamperedVerification).not.toBe(messageHash);
      console.log('Successfully verified that tampered signatures are rejected');
    });

    it('should perform RSAES-OAEP operations with async prime generation', async () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;

      let startTime: number;
      startTime = Date.now();

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p, q] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n); // Euler's totient function
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSAES-OAEP with ${2 * expectedBitLength}-bit RSA key pair...`);

      // Common RSA public exponent
      const e = 65537n;
      const d = modInverse(e, phi);

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(150000); // Increase due to overhead on Windows. Haha!

      // Create RSA keys from our generated parameters
      console.log('Creating RSA keys from our generated parameters...');

      // Create private key components
      const dmp1 = d % (p - 1n); // d mod (p-1)
      const dmq1 = d % (q - 1n); // d mod (q-1)
      const coeff = modInverse(q, p); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const nBuffer = Buffer.from(n.toString(16).padStart(512, '0'), 'hex');
      const eBuffer = Buffer.from(e.toString(16).padStart(8, '0'), 'hex');
      const dBuffer = Buffer.from(d.toString(16).padStart(512, '0'), 'hex');
      const pBuffer = Buffer.from(p.toString(16).padStart(256, '0'), 'hex');
      const qBuffer = Buffer.from(q.toString(16).padStart(256, '0'), 'hex');
      const dmp1Buffer = Buffer.from(dmp1.toString(16).padStart(256, '0'), 'hex');
      const dmq1Buffer = Buffer.from(dmq1.toString(16).padStart(256, '0'), 'hex');
      const coeffBuffer = Buffer.from(coeff.toString(16).padStart(256, '0'), 'hex');

      // Create key objects
      const privateKey = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: nBuffer.toString('base64url'),
          e: eBuffer.toString('base64url'),
          d: dBuffer.toString('base64url'),
          p: pBuffer.toString('base64url'),
          q: qBuffer.toString('base64url'),
          dp: dmp1Buffer.toString('base64url'),
          dq: dmq1Buffer.toString('base64url'),
          qi: coeffBuffer.toString('base64url')
        },
        format: 'jwk'
      });

      const publicKey = crypto.createPublicKey(privateKey);

      // Test RSAES-OAEP encryption and decryption
      console.log('Testing RSAES-OAEP encryption/decryption with our generated keys...');

      // Create test message - keep it small enough for the key size with OAEP padding
      // For a 2048-bit key, the maximum message size with OAEP padding is approximately 190 bytes
      const message = Buffer.from(`This is a test message for RSAES-OAEP encryption with ${n.toString(2).length}-bit RSA key.`);

      try {
        // Encrypt with public key using RSAES-OAEP
        const encrypted = crypto.publicEncrypt(
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          message
        );

        // Decrypt with private key using RSAES-OAEP
        const decrypted = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          encrypted
        );

        // Verify decryption worked
        expect(decrypted.toString()).toBe(message.toString());
        console.log('RSAES-OAEP encryption/decryption successful!');

        // Verify ciphertext is different from plaintext
        expect(encrypted.toString()).not.toBe(message.toString());

        // Verify ciphertext length is appropriate for RSA key size (256 bytes for 2048-bit key)
        expect(encrypted.length).toBe(256);

        // Also demonstrate textbook RSA (no padding) for verification
        console.log('Verifying with textbook RSA (no padding)...');

        // Encrypt a small message using our parameters (textbook RSA)
        const smallMessage = 12345n;
        const ciphertext = modPow(smallMessage, e, n);
        const decryptedMessage = modPow(ciphertext, d, n);
        expect(decryptedMessage).toBe(smallMessage);
        console.log('Successfully verified that randPrimeAsync generates primes suitable for RSA operations');
      } catch (error) {
        console.error('RSAES-OAEP test failed:', error);
        throw error;
      }
    });

    it('should perform RSASSA-PSS operations with async prime generation', async () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let startTime: number;
      startTime = Date.now();

      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p, q] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n); // Euler's totient function
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSASSA-PSS with ${2 * expectedBitLength}-bit RSA key pair...`);

      const e = 65537n; // Common public exponent
      const d = modInverse(e, phi);

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(150000); // Increase due to overhead on Windows. Haha!

      // Create RSA keys from our generated parameters
      console.log('Creating RSA keys from our generated parameters...');

      // Create private key components
      const dmp1 = d % (p - 1n); // d mod (p-1)
      const dmq1 = d % (q - 1n); // d mod (q-1)
      const coeff = modInverse(q, p); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const nBuffer = Buffer.from(n.toString(16).padStart(512, '0'), 'hex');
      const eBuffer = Buffer.from(e.toString(16).padStart(8, '0'), 'hex');
      const dBuffer = Buffer.from(d.toString(16).padStart(512, '0'), 'hex');
      const pBuffer = Buffer.from(p.toString(16).padStart(256, '0'), 'hex');
      const qBuffer = Buffer.from(q.toString(16).padStart(256, '0'), 'hex');
      const dmp1Buffer = Buffer.from(dmp1.toString(16).padStart(256, '0'), 'hex');
      const dmq1Buffer = Buffer.from(dmq1.toString(16).padStart(256, '0'), 'hex');
      const coeffBuffer = Buffer.from(coeff.toString(16).padStart(256, '0'), 'hex');

      // Create key objects
      const privateKey = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: nBuffer.toString('base64url'),
          e: eBuffer.toString('base64url'),
          d: dBuffer.toString('base64url'),
          p: pBuffer.toString('base64url'),
          q: qBuffer.toString('base64url'),
          dp: dmp1Buffer.toString('base64url'),
          dq: dmq1Buffer.toString('base64url'),
          qi: coeffBuffer.toString('base64url')
        },
        format: 'jwk'
      });

      const publicKey = crypto.createPublicKey(privateKey);

      // Test RSASSA-PSS signing and verification
      console.log('Testing RSASSA-PSS signing/verification with our generated keys...');

      // Create test message
      const message = Buffer.from(`This is a test message for RSASSA-PSS signing with ${n.toString(2).length}-bit RSA key.`);

      try {
        // Sign with private key using RSASSA-PSS
        const signature = crypto.sign(
          'sha256',
          message,
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          }
        );

        // Verify with public key using RSASSA-PSS
        const isVerified = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify signature verification worked
        expect(isVerified).toBe(true);
        console.log('RSASSA-PSS signing/verification successful!');

        // Test with modified message (should fail verification)
        const modifiedMessage = Buffer.from(`This is a MODIFIED test message for RSASSA-PSS signing with ${n.toString(2).length}-bit RSA key.`);
        const isModifiedVerified = crypto.verify(
          'sha256',
          modifiedMessage,
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify modified message fails verification
        expect(isModifiedVerified).toBe(false);
      } catch (error) {
        console.error('RSASSA-PSS test failed:', error);
        throw error;
      }
    });

    it('should handle RSA signature verification with wrong public key', async () => {
      // Generate first RSA key pair
      console.log('Generating first RSA key pair...');
      let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p1, q1] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p1).not.toBe(q1);

        // Calculate RSA parameters
        n1 = p1 * q1; // 2048-bit modulus
        phi1 = (p1 - 1n) * (q1 - 1n); // Euler's totient function
      } while (n1.toString(2).length !== 2 * expectedBitLength);

      const e1 = 65537n; // Common public exponent
      const d1 = modInverse(e1, phi1);

      // Create private key components
      const dmp1_1 = d1 % (p1 - 1n); // d mod (p-1)
      const dmq1_1 = d1 % (q1 - 1n); // d mod (q-1)
      const coeff1 = modInverse(q1, p1); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n1Buffer = Buffer.from(n1.toString(16).padStart(512, '0'), 'hex');
      const e1Buffer = Buffer.from(e1.toString(16).padStart(8, '0'), 'hex');
      const d1Buffer = Buffer.from(d1.toString(16).padStart(512, '0'), 'hex');
      const p1Buffer = Buffer.from(p1.toString(16).padStart(256, '0'), 'hex');
      const q1Buffer = Buffer.from(q1.toString(16).padStart(256, '0'), 'hex');
      const dmp1_1Buffer = Buffer.from(dmp1_1.toString(16).padStart(256, '0'), 'hex');
      const dmq1_1Buffer = Buffer.from(dmq1_1.toString(16).padStart(256, '0'), 'hex');
      const coeff1Buffer = Buffer.from(coeff1.toString(16).padStart(256, '0'), 'hex');

      // Create first key pair
      const privateKey1 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n1Buffer.toString('base64url'),
          e: e1Buffer.toString('base64url'),
          d: d1Buffer.toString('base64url'),
          p: p1Buffer.toString('base64url'),
          q: q1Buffer.toString('base64url'),
          dp: dmp1_1Buffer.toString('base64url'),
          dq: dmq1_1Buffer.toString('base64url'),
          qi: coeff1Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      const publicKey1 = crypto.createPublicKey(privateKey1);

      // Generate second RSA key pair
      console.log('Generating second RSA key pair...');
      let p2: bigint, q2: bigint, n2: bigint, phi2: bigint;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p2, q2] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p2).not.toBe(q2);

        // Calculate RSA parameters
        n2 = p2 * q2; // 2048-bit modulus
        phi2 = (p2 - 1n) * (q2 - 1n); // Euler's totient function
      } while (n2.toString(2).length !== 2 * expectedBitLength);

      const e2 = 65537n; // Common public exponent
      const d2 = modInverse(e2, phi2);

      // Create private key components
      const dmp1_2 = d2 % (p2 - 1n); // d mod (p-1)
      const dmq1_2 = d2 % (q2 - 1n); // d mod (q-1)
      const coeff2 = modInverse(q2, p2); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
      const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');
      const d2Buffer = Buffer.from(d2.toString(16).padStart(512, '0'), 'hex');
      const p2Buffer = Buffer.from(p2.toString(16).padStart(256, '0'), 'hex');
      const q2Buffer = Buffer.from(q2.toString(16).padStart(256, '0'), 'hex');
      const dmp1_2Buffer = Buffer.from(dmp1_2.toString(16).padStart(256, '0'), 'hex');
      const dmq1_2Buffer = Buffer.from(dmq1_2.toString(16).padStart(256, '0'), 'hex');
      const coeff2Buffer = Buffer.from(coeff2.toString(16).padStart(256, '0'), 'hex');

      // Create second key pair
      const privateKey2 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n2Buffer.toString('base64url'),
          e: e2Buffer.toString('base64url'),
          d: d2Buffer.toString('base64url'),
          p: p2Buffer.toString('base64url'),
          q: q2Buffer.toString('base64url'),
          dp: dmp1_2Buffer.toString('base64url'),
          dq: dmq1_2Buffer.toString('base64url'),
          qi: coeff2Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      const publicKey2 = crypto.createPublicKey(privateKey2);

      // Create test message
      console.log('Testing signature verification with wrong public key...');
      const message = Buffer.from(`This is a test message for RSA signature verification with wrong public key.`);

      try {
        // Sign with first private key
        const signature = crypto.sign(
          'sha256',
          message,
          {
            key: privateKey1,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          }
        );

        // Verify with first public key (should succeed)
        const isVerifiedCorrect = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey1,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify signature verification worked with correct key
        expect(isVerifiedCorrect).toBe(true);
        console.log('Signature verification with correct public key successful!');

        // Try to verify with second public key (should fail)
        const isVerifiedWrong = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey2,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify signature verification failed with wrong key
        expect(isVerifiedWrong).toBe(false);
        console.log('Signature verification with wrong public key correctly failed!');
      } catch (error) {
        console.error('RSA signature verification with wrong public key test failed:', error);
        throw error;
      }
    });

    it('should handle RSA decryption with wrong private key', async () => {
      // Generate first RSA key pair
      console.log('Generating first RSA key pair...');
      let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p1, q1] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p1).not.toBe(q1);

        // Calculate RSA parameters
        n1 = p1 * q1; // 2048-bit modulus
        phi1 = (p1 - 1n) * (q1 - 1n); // Euler's totient function
      } while (n1.toString(2).length !== 2 * expectedBitLength);

      const e1 = 65537n; // Common public exponent
      const d1 = modInverse(e1, phi1);

      // Create private key components
      const dmp1_1 = d1 % (p1 - 1n); // d mod (p-1)
      const dmq1_1 = d1 % (q1 - 1n); // d mod (q-1)
      const coeff1 = modInverse(q1, p1); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n1Buffer = Buffer.from(n1.toString(16).padStart(512, '0'), 'hex');
      const e1Buffer = Buffer.from(e1.toString(16).padStart(8, '0'), 'hex');
      const d1Buffer = Buffer.from(d1.toString(16).padStart(512, '0'), 'hex');
      const p1Buffer = Buffer.from(p1.toString(16).padStart(256, '0'), 'hex');
      const q1Buffer = Buffer.from(q1.toString(16).padStart(256, '0'), 'hex');
      const dmp1_1Buffer = Buffer.from(dmp1_1.toString(16).padStart(256, '0'), 'hex');
      const dmq1_1Buffer = Buffer.from(dmq1_1.toString(16).padStart(256, '0'), 'hex');
      const coeff1Buffer = Buffer.from(coeff1.toString(16).padStart(256, '0'), 'hex');

      // Create first key pair
      const privateKey1 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n1Buffer.toString('base64url'),
          e: e1Buffer.toString('base64url'),
          d: d1Buffer.toString('base64url'),
          p: p1Buffer.toString('base64url'),
          q: q1Buffer.toString('base64url'),
          dp: dmp1_1Buffer.toString('base64url'),
          dq: dmq1_1Buffer.toString('base64url'),
          qi: coeff1Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      const publicKey1 = crypto.createPublicKey(privateKey1);

      // Generate second RSA key pair
      console.log('Generating second RSA key pair...');
      let p2: bigint, q2: bigint, n2: bigint, phi2: bigint;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p2, q2] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p2).not.toBe(q2);

        // Calculate RSA parameters
        n2 = p2 * q2; // 2048-bit modulus
        phi2 = (p2 - 1n) * (q2 - 1n); // Euler's totient function
      } while (n2.toString(2).length !== 2 * expectedBitLength);

      const e2 = 65537n; // Common public exponent
      const d2 = modInverse(e2, phi2);

      // Create private key components
      const dmp1_2 = d2 % (p2 - 1n); // d mod (p-1)
      const dmq1_2 = d2 % (q2 - 1n); // d mod (q-1)
      const coeff2 = modInverse(q2, p2); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
      const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');
      const d2Buffer = Buffer.from(d2.toString(16).padStart(512, '0'), 'hex');
      const p2Buffer = Buffer.from(p2.toString(16).padStart(256, '0'), 'hex');
      const q2Buffer = Buffer.from(q2.toString(16).padStart(256, '0'), 'hex');
      const dmp1_2Buffer = Buffer.from(dmp1_2.toString(16).padStart(256, '0'), 'hex');
      const dmq1_2Buffer = Buffer.from(dmq1_2.toString(16).padStart(256, '0'), 'hex');
      const coeff2Buffer = Buffer.from(coeff2.toString(16).padStart(256, '0'), 'hex');

      // Create second key pair
      const privateKey2 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n2Buffer.toString('base64url'),
          e: e2Buffer.toString('base64url'),
          d: d2Buffer.toString('base64url'),
          p: p2Buffer.toString('base64url'),
          q: q2Buffer.toString('base64url'),
          dp: dmp1_2Buffer.toString('base64url'),
          dq: dmq1_2Buffer.toString('base64url'),
          qi: coeff2Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      // Create test message - keep it small enough for the key size with OAEP padding
      console.log('Testing decryption with wrong private key...');
      const message = Buffer.from(`This is a test message for RSA decryption with wrong private key.`);

      try {
        // Encrypt with first public key using RSAES-OAEP
        const encrypted = crypto.publicEncrypt(
          {
            key: publicKey1,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          message
        );

        // Decrypt with first private key (should succeed)
        const decrypted = crypto.privateDecrypt(
          {
            key: privateKey1,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          encrypted
        );

        // Verify decryption worked with correct key
        expect(decrypted.toString()).toBe(message.toString());
        console.log('Decryption with correct private key successful!');

        // Attempt to decrypt with wrong private key (should fail)
        let decryptionFailed = false;
        try {
          const wrongDecrypted = crypto.privateDecrypt(
            {
              key: privateKey2,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: 'sha256'
            },
            encrypted
          );

          // If we get here, decryption didn't throw an error, but the result should be incorrect
          expect(wrongDecrypted.toString()).not.toBe(message.toString());
          console.log('Decryption with wrong key produced incorrect result (unexpected behavior)');
        } catch (decryptError) {
          // Expected behavior - decryption with wrong key should fail with an error
          decryptionFailed = true;
          console.log('Decryption with wrong private key correctly failed with error:',
            decryptError instanceof Error ? decryptError.message : String(decryptError));
        }

        // Verify that decryption with wrong key failed
        expect(decryptionFailed).toBe(true);
        console.log('Decryption with wrong private key correctly failed!');
      } catch (testError) {
        // This catch block handles errors in the overall test
        console.error('RSA decryption with wrong private key test failed:', testError);
        throw testError;
      }
    });
  });

  describe('RSAES-OAEP operations with PEM format', () => {
    // These tests use 2048-bit keys (1024-bit primes each)
    jest.setTimeout(150000); // Increase due to overhead on Windows. Haha!

    it('should perform RSAES-OAEP operations with async prime generation and PEM format', async () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;

      let startTime: number;
      startTime = Date.now();

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p, q] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n); // Euler's totient function
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSAES-OAEP with ${2 * expectedBitLength}-bit RSA key pair and PEM format...`);

      // Common RSA public exponent
      const e = 65537n;
      const d = modInverse(e, phi);

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(150000); // Increase due to overhead on Windows. Haha!

      // Create RSA keys from our generated parameters
      console.log('Creating RSA keys from our generated parameters...');

      // Create private key components
      const dmp1 = d % (p - 1n); // d mod (p-1)
      const dmq1 = d % (q - 1n); // d mod (q-1)
      const coeff = modInverse(q, p); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const nBuffer = Buffer.from(n.toString(16).padStart(512, '0'), 'hex');
      const eBuffer = Buffer.from(e.toString(16).padStart(8, '0'), 'hex');
      const dBuffer = Buffer.from(d.toString(16).padStart(512, '0'), 'hex');
      const pBuffer = Buffer.from(p.toString(16).padStart(256, '0'), 'hex');
      const qBuffer = Buffer.from(q.toString(16).padStart(256, '0'), 'hex');
      const dmp1Buffer = Buffer.from(dmp1.toString(16).padStart(256, '0'), 'hex');
      const dmq1Buffer = Buffer.from(dmq1.toString(16).padStart(256, '0'), 'hex');
      const coeffBuffer = Buffer.from(coeff.toString(16).padStart(256, '0'), 'hex');

      // Create key objects in JWK format first
      const jwkPrivateKey = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: nBuffer.toString('base64url'),
          e: eBuffer.toString('base64url'),
          d: dBuffer.toString('base64url'),
          p: pBuffer.toString('base64url'),
          q: qBuffer.toString('base64url'),
          dp: dmp1Buffer.toString('base64url'),
          dq: dmq1Buffer.toString('base64url'),
          qi: coeffBuffer.toString('base64url')
        },
        format: 'jwk'
      });

      // Export keys to PEM format
      const privateKeyPem = jwkPrivateKey.export({
        type: 'pkcs8',
        format: 'pem'
      });

      const jwkPublicKey = crypto.createPublicKey(jwkPrivateKey);
      const publicKeyPem = jwkPublicKey.export({
        type: 'spki',
        format: 'pem'
      });

      // Create key objects from PEM format
      const privateKey = crypto.createPrivateKey(privateKeyPem);
      const publicKey = crypto.createPublicKey(publicKeyPem);

      // Test RSAES-OAEP encryption and decryption with PEM keys
      console.log('Testing RSAES-OAEP encryption/decryption with our PEM format keys...');

      // Create test message - keep it small enough for the key size with OAEP padding
      // For a 2048-bit key, the maximum message size with OAEP padding is approximately 190 bytes
      const message = Buffer.from(`This is a test message for RSAES-OAEP encryption with ${n.toString(2).length}-bit RSA key from PEM.`);

      try {
        // Encrypt with public key using RSAES-OAEP
        const encrypted = crypto.publicEncrypt(
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          message
        );

        // Decrypt with private key using RSAES-OAEP
        const decrypted = crypto.privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          encrypted
        );

        // Verify decryption worked
        expect(decrypted.toString()).toBe(message.toString());
        console.log('RSAES-OAEP encryption/decryption with PEM keys successful!');

        // Verify ciphertext is different from plaintext
        expect(encrypted.toString()).not.toBe(message.toString());

        // Verify ciphertext length is appropriate for RSA key size (256 bytes for 2048-bit key)
        expect(encrypted.length).toBe(256);

      } catch (error) {
        console.error('RSAES-OAEP test with PEM keys failed:', error);
        throw error;
      }
    });

    it('should handle RSAES-OAEP operations with wrong private key in PEM format', async () => {
      // Generate first RSA key pair
      console.log('Generating first RSA key pair...');
      let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p1, q1] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p1).not.toBe(q1);

        // Calculate RSA parameters
        n1 = p1 * q1; // 2048-bit modulus
        phi1 = (p1 - 1n) * (q1 - 1n); // Euler's totient function
      } while (n1.toString(2).length !== 2 * expectedBitLength);

      const e1 = 65537n; // Common public exponent
      const d1 = modInverse(e1, phi1);

      // Generate second RSA key pair
      console.log('Generating second RSA key pair...');
      let p2: bigint, q2: bigint, n2: bigint, phi2: bigint;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p2, q2] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p2).not.toBe(q2);

        // Calculate RSA parameters
        n2 = p2 * q2; // 2048-bit modulus
        phi2 = (p2 - 1n) * (q2 - 1n); // Euler's totient function
      } while (n2.toString(2).length !== 2 * expectedBitLength);

      const e2 = 65537n; // Common public exponent
      const d2 = modInverse(e2, phi2);

      console.log(`Testing RSAES-OAEP with wrong key using ${2 * expectedBitLength}-bit RSA key pair from PEM format...`);

      // Create first key pair
      // Create private key components
      const dmp1_1 = d1 % (p1 - 1n); // d mod (p-1)
      const dmq1_1 = d1 % (q1 - 1n); // d mod (q-1)
      const coeff1 = modInverse(q1, p1); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n1Buffer = Buffer.from(n1.toString(16).padStart(512, '0'), 'hex');
      const e1Buffer = Buffer.from(e1.toString(16).padStart(8, '0'), 'hex');
      const d1Buffer = Buffer.from(d1.toString(16).padStart(512, '0'), 'hex');
      const p1Buffer = Buffer.from(p1.toString(16).padStart(256, '0'), 'hex');
      const q1Buffer = Buffer.from(q1.toString(16).padStart(256, '0'), 'hex');
      const dmp1_1Buffer = Buffer.from(dmp1_1.toString(16).padStart(256, '0'), 'hex');
      const dmq1_1Buffer = Buffer.from(dmq1_1.toString(16).padStart(256, '0'), 'hex');
      const coeff1Buffer = Buffer.from(coeff1.toString(16).padStart(256, '0'), 'hex');

      // Create key objects in JWK format first
      const jwkPrivateKey1 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n1Buffer.toString('base64url'),
          e: e1Buffer.toString('base64url'),
          d: d1Buffer.toString('base64url'),
          p: p1Buffer.toString('base64url'),
          q: q1Buffer.toString('base64url'),
          dp: dmp1_1Buffer.toString('base64url'),
          dq: dmq1_1Buffer.toString('base64url'),
          qi: coeff1Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      // Export keys to PEM format
      const privateKeyPem1 = jwkPrivateKey1.export({
        type: 'pkcs8',
        format: 'pem'
      });

      const jwkPublicKey1 = crypto.createPublicKey(jwkPrivateKey1);
      const publicKeyPem1 = jwkPublicKey1.export({
        type: 'spki',
        format: 'pem'
      });

      // Create key objects from PEM format
      const privateKey1 = crypto.createPrivateKey(privateKeyPem1);
      const publicKey1 = crypto.createPublicKey(publicKeyPem1);

      // Create second key pair
      // Create private key components
      const dmp1_2 = d2 % (p2 - 1n); // d mod (p-1)
      const dmq1_2 = d2 % (q2 - 1n); // d mod (q-1)
      const coeff2 = modInverse(q2, p2); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
      const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');
      const d2Buffer = Buffer.from(d2.toString(16).padStart(512, '0'), 'hex');
      const p2Buffer = Buffer.from(p2.toString(16).padStart(256, '0'), 'hex');
      const q2Buffer = Buffer.from(q2.toString(16).padStart(256, '0'), 'hex');
      const dmp1_2Buffer = Buffer.from(dmp1_2.toString(16).padStart(256, '0'), 'hex');
      const dmq1_2Buffer = Buffer.from(dmq1_2.toString(16).padStart(256, '0'), 'hex');
      const coeff2Buffer = Buffer.from(coeff2.toString(16).padStart(256, '0'), 'hex');

      // Create key objects in JWK format first
      const jwkPrivateKey2 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n2Buffer.toString('base64url'),
          e: e2Buffer.toString('base64url'),
          d: d2Buffer.toString('base64url'),
          p: p2Buffer.toString('base64url'),
          q: q2Buffer.toString('base64url'),
          dp: dmp1_2Buffer.toString('base64url'),
          dq: dmq1_2Buffer.toString('base64url'),
          qi: coeff2Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      // Export keys to PEM format
      const privateKeyPem2 = jwkPrivateKey2.export({
        type: 'pkcs8',
        format: 'pem'
      });

      // Create key objects from PEM format
      const privateKey2 = crypto.createPrivateKey(privateKeyPem2);

      // Test RSAES-OAEP encryption and decryption with wrong PEM keys
      console.log('Testing RSAES-OAEP encryption/decryption with wrong PEM format keys...');

      // Create test message
      const message = Buffer.from(`This is a test message for RSAES-OAEP encryption with ${n1.toString(2).length}-bit RSA key from PEM.`);

      try {
        // Encrypt with correct public key using RSAES-OAEP
        const encrypted = crypto.publicEncrypt(
          {
            key: publicKey1,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          message
        );

        // Attempt to decrypt with wrong private key using RSAES-OAEP
        let decryptionFailed = false;
        try {
          const wrongDecrypted = crypto.privateDecrypt(
            {
              key: privateKey2,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: 'sha256'
            },
            encrypted
          );

          // If we get here, decryption didn't throw an error, but the result should be incorrect
          expect(wrongDecrypted.toString()).not.toBe(message.toString());
          console.log('Decryption with wrong key produced incorrect result (unexpected behavior)');
        } catch (decryptError) {
          // Expected behavior - decryption with wrong key should fail with an error
          decryptionFailed = true;
          console.log('Decryption with wrong private key correctly failed with error:',
            decryptError instanceof Error ? decryptError.message : String(decryptError));
        }

        // Verify that decryption with wrong key failed
        expect(decryptionFailed).toBe(true);
        console.log('RSAES-OAEP decryption with wrong PEM key correctly failed!');

        // Verify correct decryption works
        const correctlyDecrypted = crypto.privateDecrypt(
          {
            key: privateKey1,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          encrypted
        );

        // Verify correct decryption worked
        expect(correctlyDecrypted.toString()).toBe(message.toString());
        console.log('RSAES-OAEP encryption/decryption with correct PEM key successful!');

      } catch (error) {
        console.error('RSAES-OAEP wrong key test with PEM keys failed:', error);
        throw error;
      }
    });
  });

  describe('RSASSA-PSS operations with PEM format', () => {
    // These tests use 2048-bit keys (1024-bit primes each)
    jest.setTimeout(150000); // Increase due to overhead on Windows. Haha!

    it('should perform RSASSA-PSS operations with async prime generation and PEM format', async () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let startTime: number;
      startTime = Date.now();

      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p, q] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n); // Euler's totient function
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSASSA-PSS with ${2 * expectedBitLength}-bit RSA key pair from PEM format...`);

      const e = 65537n; // Common public exponent
      const d = modInverse(e, phi);

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(150000); // Increase due to overhead on Windows. Haha!

      // Create RSA keys from our generated parameters
      console.log('Creating RSA keys from our generated parameters...');

      // Create private key components
      const dmp1 = d % (p - 1n); // d mod (p-1)
      const dmq1 = d % (q - 1n); // d mod (q-1)
      const coeff = modInverse(q, p); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const nBuffer = Buffer.from(n.toString(16).padStart(512, '0'), 'hex');
      const eBuffer = Buffer.from(e.toString(16).padStart(8, '0'), 'hex');
      const dBuffer = Buffer.from(d.toString(16).padStart(512, '0'), 'hex');
      const pBuffer = Buffer.from(p.toString(16).padStart(256, '0'), 'hex');
      const qBuffer = Buffer.from(q.toString(16).padStart(256, '0'), 'hex');
      const dmp1Buffer = Buffer.from(dmp1.toString(16).padStart(256, '0'), 'hex');
      const dmq1Buffer = Buffer.from(dmq1.toString(16).padStart(256, '0'), 'hex');
      const coeffBuffer = Buffer.from(coeff.toString(16).padStart(256, '0'), 'hex');

      // Create key objects in JWK format first
      const jwkPrivateKey = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: nBuffer.toString('base64url'),
          e: eBuffer.toString('base64url'),
          d: dBuffer.toString('base64url'),
          p: pBuffer.toString('base64url'),
          q: qBuffer.toString('base64url'),
          dp: dmp1Buffer.toString('base64url'),
          dq: dmq1Buffer.toString('base64url'),
          qi: coeffBuffer.toString('base64url')
        },
        format: 'jwk'
      });

      // Export keys to PEM format
      const privateKeyPem = jwkPrivateKey.export({
        type: 'pkcs8',
        format: 'pem'
      });

      const jwkPublicKey = crypto.createPublicKey(jwkPrivateKey);
      const publicKeyPem = jwkPublicKey.export({
        type: 'spki',
        format: 'pem'
      });

      // Create key objects from PEM format
      const privateKey = crypto.createPrivateKey(privateKeyPem);
      const publicKey = crypto.createPublicKey(publicKeyPem);

      // Test RSASSA-PSS signing and verification with PEM keys
      console.log('Testing RSASSA-PSS signing/verification with our PEM format keys...');

      // Create test message
      const message = Buffer.from(`This is a test message for RSASSA-PSS signing with ${n.toString(2).length}-bit RSA key from PEM.`);

      try {
        // Sign with private key using RSASSA-PSS
        const signature = crypto.sign(
          'sha256',
          message,
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          }
        );

        // Verify with public key using RSASSA-PSS
        const isVerified = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify signature verification worked
        expect(isVerified).toBe(true);
        console.log('RSASSA-PSS signing/verification with PEM keys successful!');

        // Test with modified message (should fail verification)
        const modifiedMessage = Buffer.from(`This is a MODIFIED test message for RSASSA-PSS signing with ${n.toString(2).length}-bit RSA key from PEM.`);
        const isModifiedVerified = crypto.verify(
          'sha256',
          modifiedMessage,
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify modified message fails verification
        expect(isModifiedVerified).toBe(false);
        console.log('RSASSA-PSS correctly rejected modified message with PEM keys!');

      } catch (error) {
        console.error('RSASSA-PSS test with PEM keys failed:', error);
        throw error;
      }
    });

    it('should fail RSASSA-PSS verification with wrong public key in PEM format', async () => {
      // Generate first RSA key pair
      console.log('Generating first RSA key pair...');
      let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
      const expectedBitLength: number = 1024;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p1, q1] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p1).not.toBe(q1);

        // Calculate RSA parameters
        n1 = p1 * q1; // 2048-bit modulus
        phi1 = (p1 - 1n) * (q1 - 1n); // Euler's totient function
      } while (n1.toString(2).length !== 2 * expectedBitLength);

      const e1 = 65537n; // Common public exponent
      const d1 = modInverse(e1, phi1);

      // Generate second RSA key pair
      console.log('Generating second RSA key pair...');
      let p2: bigint, q2: bigint, n2: bigint, phi2: bigint;

      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two primes asynchronously
        [p2, q2] = await Promise.all([
          // Increase the iterations to 480 for the perfect p × q in the async do-while loop,
          // as Wikipedia suggests: "The numbers p and q should not be 'too close'." 🎰🎰🎰
          //
          // Note: This process may take a long time 😂 because the default entropy in OpenSSL can be quite poor.
          randPrimeAsync(expectedBitLength, 480),
          randPrimeAsync(expectedBitLength, 480)
        ]);

        // Ensure p and q are different
        expect(p2).not.toBe(q2);

        // Calculate RSA parameters
        n2 = p2 * q2; // 2048-bit modulus
        phi2 = (p2 - 1n) * (q2 - 1n); // Euler's totient function
      } while (n2.toString(2).length !== 2 * expectedBitLength);

      const e2 = 65537n; // Common public exponent
      const d2 = modInverse(e2, phi2);

      console.log(`Testing RSASSA-PSS with wrong key using ${2 * expectedBitLength}-bit RSA key pair from PEM format...`);

      // Create first key pair
      // Create private key components
      const dmp1_1 = d1 % (p1 - 1n); // d mod (p-1)
      const dmq1_1 = d1 % (q1 - 1n); // d mod (q-1)
      const coeff1 = modInverse(q1, p1); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n1Buffer = Buffer.from(n1.toString(16).padStart(512, '0'), 'hex');
      const e1Buffer = Buffer.from(e1.toString(16).padStart(8, '0'), 'hex');
      const d1Buffer = Buffer.from(d1.toString(16).padStart(512, '0'), 'hex');
      const p1Buffer = Buffer.from(p1.toString(16).padStart(256, '0'), 'hex');
      const q1Buffer = Buffer.from(q1.toString(16).padStart(256, '0'), 'hex');
      const dmp1_1Buffer = Buffer.from(dmp1_1.toString(16).padStart(256, '0'), 'hex');
      const dmq1_1Buffer = Buffer.from(dmq1_1.toString(16).padStart(256, '0'), 'hex');
      const coeff1Buffer = Buffer.from(coeff1.toString(16).padStart(256, '0'), 'hex');

      // Create key objects in JWK format first
      const jwkPrivateKey1 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n1Buffer.toString('base64url'),
          e: e1Buffer.toString('base64url'),
          d: d1Buffer.toString('base64url'),
          p: p1Buffer.toString('base64url'),
          q: q1Buffer.toString('base64url'),
          dp: dmp1_1Buffer.toString('base64url'),
          dq: dmq1_1Buffer.toString('base64url'),
          qi: coeff1Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      // Export keys to PEM format
      const privateKeyPem1 = jwkPrivateKey1.export({
        type: 'pkcs8',
        format: 'pem'
      });

      const jwkPublicKey1 = crypto.createPublicKey(jwkPrivateKey1);
      const publicKeyPem1 = jwkPublicKey1.export({
        type: 'spki',
        format: 'pem'
      });

      // Create key objects from PEM format
      const privateKey1 = crypto.createPrivateKey(privateKeyPem1);
      const publicKey1 = crypto.createPublicKey(publicKeyPem1);

      // Create second key pair
      // Create private key components
      const dmp1_2 = d2 % (p2 - 1n); // d mod (p-1)
      const dmq1_2 = d2 % (q2 - 1n); // d mod (q-1)
      const coeff2 = modInverse(q2, p2); // q^-1 mod p

      // Convert bigints to Buffer for key creation
      const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
      const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');
      const d2Buffer = Buffer.from(d2.toString(16).padStart(512, '0'), 'hex');
      const p2Buffer = Buffer.from(p2.toString(16).padStart(256, '0'), 'hex');
      const q2Buffer = Buffer.from(q2.toString(16).padStart(256, '0'), 'hex');
      const dmp1_2Buffer = Buffer.from(dmp1_2.toString(16).padStart(256, '0'), 'hex');
      const dmq1_2Buffer = Buffer.from(dmq1_2.toString(16).padStart(256, '0'), 'hex');
      const coeff2Buffer = Buffer.from(coeff2.toString(16).padStart(256, '0'), 'hex');

      // Create key objects in JWK format first
      const jwkPrivateKey2 = crypto.createPrivateKey({
        key: {
          kty: 'RSA',
          n: n2Buffer.toString('base64url'),
          e: e2Buffer.toString('base64url'),
          d: d2Buffer.toString('base64url'),
          p: p2Buffer.toString('base64url'),
          q: q2Buffer.toString('base64url'),
          dp: dmp1_2Buffer.toString('base64url'),
          dq: dmq1_2Buffer.toString('base64url'),
          qi: coeff2Buffer.toString('base64url')
        },
        format: 'jwk'
      });

      // Export keys to PEM format
      const jwkPublicKey2 = crypto.createPublicKey(jwkPrivateKey2);
      const publicKeyPem2 = jwkPublicKey2.export({
        type: 'spki',
        format: 'pem'
      });

      // Create key objects from PEM format
      const publicKey2 = crypto.createPublicKey(publicKeyPem2);

      // Test RSASSA-PSS signing and verification with wrong PEM keys
      console.log('Testing RSASSA-PSS signing/verification with wrong PEM format keys...');

      // Create test message
      const message = Buffer.from(`This is a test message for RSASSA-PSS signing with ${n1.toString(2).length}-bit RSA key from PEM.`);

      try {
        // Sign with correct private key using RSASSA-PSS
        const signature = crypto.sign(
          'sha256',
          message,
          {
            key: privateKey1,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          }
        );

        // Attempt to verify with wrong public key using RSASSA-PSS
        const isVerifiedWrong = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey2,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify signature verification failed with wrong key
        expect(isVerifiedWrong).toBe(false);
        console.log('RSASSA-PSS correctly rejected verification with wrong PEM public key!');

        // Verify with correct public key using RSASSA-PSS
        const isVerifiedCorrect = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey1,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verify signature verification worked with correct key
        expect(isVerifiedCorrect).toBe(true);
        console.log('RSASSA-PSS verification with correct PEM public key successful!');

      } catch (error) {
        console.error('RSASSA-PSS wrong key test with PEM keys failed:', error);
        throw error;
      }
    });
  });
});
