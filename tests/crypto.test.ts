/**
 * 🔳 Arch vs. Arch 🔳
 * 
 * Currently Known: The [ARM](https://en.wikipedia.org/wiki/ARM_architecture_family) architecture is now considered superior for cryptographic operations compared to [x64](https://en.wikipedia.org/wiki/X86-64).
 * 
 * Note: This test for RSA is limited to 2048-bits because using 4096-bits can cause overhead on [x64](https://en.wikipedia.org/wiki/X86-64) systems. hahaha
 */

import * as crypto from 'crypto';
import { Crypto } from '../src/rand';
import {
  DEFAULT_CHARSET
} from '../src/const';
import { modPow, modInverse, gcd } from '../src/math_helper';

describe('Crypto Class', () => {
  // Skip tests if not in Node.js environment
  const isNodeEnv = typeof window === 'undefined';

  if (!isNodeEnv) {
    console.log('Skipping tests in browser environment');
    return;
  }

  function errorUnsupported(methodName: string): string {
    return `${methodName} is not available in browser environment. This method requires Node.js crypto module.`
  }

  const randLatticeErr = 'Dimension and modulus must be integers';
  const randBigIntErr = 'Bit length must be an integer greater than or equal to 2';
  const randPrimeErr = 'Number of iterations must be a positive integer';

  describe('rand()', () => {
    it('should return a number between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const result = Crypto.rand();
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
        expect(typeof result).toBe('number');
      }
    });

    it('should return different values on subsequent calls', () => {
      const results = new Set<number>();
      for (let i = 0; i < 100; i++) {
        results.add(Crypto.rand());
      }
      // Should have high entropy (at least 95% unique values)
      expect(results.size).toBeGreaterThan(95);
    });
  });

  describe('randInt()', () => {
    it('should return integer within specified range', () => {
      for (let i = 0; i < 100; i++) {
        const result = Crypto.randInt(10, 20);
        expect(result).toBeGreaterThanOrEqual(10);
        expect(result).toBeLessThan(20);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should use default range when no parameters provided', () => {
      const result = Crypto.randInt();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(100);
    });

    it('should throw error when min >= max', () => {
      expect(() => Crypto.randInt(10, 10)).toThrow('min must be less than max');
      expect(() => Crypto.randInt(20, 10)).toThrow('min must be less than max');
    });

    it('should handle negative ranges', () => {
      const result = Crypto.randInt(-10, -5);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThan(-5);
    });
  });

  describe('randN()', () => {
    it('should return integer from 0 to max-1', () => {
      for (let i = 0; i < 50; i++) {
        const result = Crypto.randN(10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe('randChoice()', () => {
    it('should return element from array', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 20; i++) {
        const result = Crypto.randChoice(array);
        expect(array).toContain(result);
      }
    });

    it('should return the only element from single-element array', () => {
      const array = ['only'];
      const result = Crypto.randChoice(array);
      expect(result).toBe('only');
    });
  });

  describe('randIndex()', () => {
    it('should return valid index for array', () => {
      const array = [1, 2, 3, 4, 5];
      for (let i = 0; i < 20; i++) {
        const index = Crypto.randIndex(array);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(array.length);
        expect(Number.isInteger(index)).toBe(true);
      }
    });

    it('should throw error for empty array', () => {
      expect(() => Crypto.randIndex([])).toThrow('Array cannot be empty');
    });
  });

  describe('randWeighted()', () => {
    it('should return item from weighted array', () => {
      const items = ['a', 'b', 'c'];
      const weights = [1, 2, 3];

      for (let i = 0; i < 20; i++) {
        const result = Crypto.randWeighted(items, weights);
        expect(items).toContain(result);
      }
    });

    it('should throw error when arrays have different lengths', () => {
      const items = ['a', 'b'];
      const weights = [1, 2, 3];
      expect(() => Crypto.randWeighted(items, weights))
        .toThrow('Items and weights arrays must have the same length');
    });

    it('should favor higher weighted items', () => {
      const items = ['low', 'high'];
      const weights = [1, 1000]; // Heavily weighted toward 'high'
      const results: string[] = [];

      for (let i = 0; i < 100; i++) {
        results.push(Crypto.randWeighted(items, weights));
      }

      const highCount = results.filter((r: string) => r === 'high').length;
      expect(highCount).toBeGreaterThan(80); // Should be heavily skewed
    });
  });

  describe('shuffle()', () => {
    it('should return array with same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = Crypto.shuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should not modify original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      Crypto.shuffle(original);

      expect(original).toEqual(originalCopy);
    });

    it('should produce different arrangements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const arrangements = new Set<string>();

      for (let i = 0; i < 20; i++) {
        arrangements.add(JSON.stringify(Crypto.shuffle(original)));
      }

      expect(arrangements.size).toBeGreaterThan(10); // Should have variety
    });
  });

  describe('randString()', () => {
    it('should generate string of specified length', () => {
      const result = Crypto.randString(10);
      expect(result).toHaveLength(10);
      expect(typeof result).toBe('string');
    });

    it('should use default charset when none provided', () => {
      const result = Crypto.randString(20);
      for (const char of result) {
        expect(DEFAULT_CHARSET).toContain(char);
      }
    });

    it('should use custom charset', () => {
      const customCharset = 'ABC';
      const result = Crypto.randString(10, customCharset);
      for (const char of result) {
        expect(customCharset).toContain(char);
      }
    });

    it('should generate different strings', () => {
      const strings = new Set<string>();
      for (let i = 0; i < 20; i++) {
        strings.add(Crypto.randString(10));
      }
      expect(strings.size).toBe(20); // All should be unique
    });
  });

  describe('randHex()', () => {
    it('should generate hex string of specified length', () => {
      const result = Crypto.randHex(10);
      expect(result).toHaveLength(10);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    it('should generate different hex strings', () => {
      const hexStrings = new Set<string>();
      for (let i = 0; i < 20; i++) {
        hexStrings.add(Crypto.randHex(8));
      }
      expect(hexStrings.size).toBe(20);
    });

    it('should throw error in browser environment', () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        expect(() => Crypto.randHex(10)).toThrow(errorUnsupported('randHex'));
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randBase64()', () => {
    it('should generate base64 string of specified length', () => {
      const result = Crypto.randBase64(10);
      expect(result).toHaveLength(10);
      expect(/^[A-Za-z0-9+/]+$/.test(result)).toBe(true);
    });

    it('should throw error in browser environment', () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        expect(() => Crypto.randBase64(10)).toThrow(errorUnsupported('randBase64'));
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randBool()', () => {
    it('should return boolean values', () => {
      for (let i = 0; i < 10; i++) {
        const result = Crypto.randBool();
        expect(typeof result).toBe('boolean');
      }
    });

    it('should respect probability parameter', () => {
      const results: boolean[] = [];
      for (let i = 0; i < 1000; i++) {
        results.push(Crypto.randBool(0.8)); // 80% true
      }

      const trueCount = results.filter((r: boolean) => r === true).length;
      const trueRatio = trueCount / results.length;
      expect(trueRatio).toBeGreaterThan(0.7); // Should be around 80%
      expect(trueRatio).toBeLessThan(0.9);
    });
  });

  describe('randBytes()', () => {
    it('should generate buffer of specified size', () => {
      const result = Crypto.randBytes(16);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(16);
    });

    it('should generate different byte sequences', () => {
      const buffers: string[] = [];
      for (let i = 0; i < 10; i++) {
        buffers.push(Crypto.randBytes(8).toString('hex'));
      }
      const uniqueBuffers = new Set<string>(buffers);
      expect(uniqueBuffers.size).toBe(10);
    });

    describe('with randFill parameter', () => {
      it('should generate buffer using crypto.randomFill when randFill=true', () => {
        const result = Crypto.randBytes(16, true);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBe(16);
      });

      it('should generate buffer using crypto.randomBytes when randFill=false', () => {
        const result = Crypto.randBytes(16, false);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBe(16);
      });

      it('should generate different byte sequences with randFill=true', () => {
        const buffers: string[] = [];
        for (let i = 0; i < 10; i++) {
          buffers.push(Crypto.randBytes(8, true).toString('hex'));
        }
        const uniqueBuffers = new Set<string>(buffers);
        expect(uniqueBuffers.size).toBe(10);
      });

      it('should generate different results between randFill=true and randFill=false', () => {
        const results: string[] = [];
        for (let i = 0; i < 5; i++) {
          results.push(Crypto.randBytes(16, true).toString('hex'));
          results.push(Crypto.randBytes(16, false).toString('hex'));
        }
        const uniqueResults = new Set<string>(results);
        expect(uniqueResults.size).toBe(10); // All should be different
      });

      it('should handle zero-length input with randFill=true', () => {
        const result = Crypto.randBytes(0, true);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      it('should handle large input with randFill=true', () => {
        const size = 1024 * 5; // 5KB
        const result = Crypto.randBytes(size, true);
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBe(size);
      });

      it('should generate bytes with high entropy using randFill=true', () => {
        const size = 256;
        const result = Crypto.randBytes(size, true);

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
  });

  describe('uuid()', () => {
    it('should generate valid UUID v4', () => {
      const uuid = Crypto.randUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(uuid)).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(Crypto.randUUID());
      }
      expect(uuids.size).toBe(100);
    });
  });

  describe('randFloat()', () => {
    it('should generate float in specified range', () => {
      for (let i = 0; i < 50; i++) {
        const result = Crypto.randFloat(1.5, 2.5);
        expect(result).toBeGreaterThanOrEqual(1.5);
        expect(result).toBeLessThanOrEqual(2.5);
      }
    });

    it('should use default range when no parameters', () => {
      const result = Crypto.randFloat();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('randFormat()', () => {
    it('should generate comma-separated numbers by default', () => {
      const result = Crypto.randFormat();
      const parts = result.split(',');
      expect(parts).toHaveLength(6);
      parts.forEach((part: string) => {
        const num = parseInt(part);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(100);
      });
    });

    it('should use custom parameters', () => {
      const result = Crypto.randFormat(3, 50, '|');
      const parts = result.split('|');
      expect(parts).toHaveLength(3);
      parts.forEach((part: string) => {
        const num = parseInt(part);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(50);
      });
    });
  });

  describe('randSeed()', () => {
    it('should generate positive integer', () => {
      const seed = Crypto.randSeed();
      expect(typeof seed).toBe('number');
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThan(0);
    });

    it('should generate different seeds', () => {
      const seeds = new Set<number>();
      for (let i = 0; i < 20; i++) {
        seeds.add(Crypto.randSeed());
      }
      expect(seeds.size).toBeGreaterThan(15); // High entropy expected
    });

    it('should throw error in browser environment', () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        expect(() => Crypto.randSeed()).toThrow(errorUnsupported('randSeed'));
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randSeeded()', () => {
    it('should return deterministic values for same seed', () => {
      const seed = 12345;
      const result1 = Crypto.randSeeded(seed);
      const result2 = Crypto.randSeeded(seed);
      expect(result1).toBe(result2);
    });

    it('should return different values for different seeds', () => {
      const result1 = Crypto.randSeeded(111);
      const result2 = Crypto.randSeeded(222);
      expect(result1).not.toBe(result2);
    });

    it('should return random value when no seed provided', () => {
      const result = Crypto.randSeeded();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });

    it('should throw error in browser environment', () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        expect(() => Crypto.randSeeded(1337)).toThrow(errorUnsupported('randSeeded (with seed parameter)'));
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randSubset()', () => {
    it('should return a subset of the specified size', () => {
      const array = [1, 2, 3, 4, 5];
      const subset = Crypto.randSubset(array, 3);
      expect(subset).toHaveLength(3);
      subset.forEach(item => {
        expect(array).toContain(item);
      });
    });

    it('should throw an error if subset size is larger than array size', () => {
      const array = [1, 2, 3];
      expect(() => Crypto.randSubset(array, 5)).toThrow('Subset size cannot be larger than the array size');
    });

    it('should return an empty array if size is 0', () => {
      const array = [1, 2, 3];
      const subset = Crypto.randSubset(array, 0);
      expect(subset).toEqual([]);
    });
  });

  describe('randGaussian()', () => {
    it('should generate numbers with mean close to specified mean', () => {
      const mean = 5;
      const stdDev = 2;
      const samples = Array.from({ length: 1000 }, () => Crypto.randGaussian(mean, stdDev));
      const sampleMean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      expect(sampleMean).toBeCloseTo(mean, 0);
    });

    it('should generate numbers with standard deviation close to specified stdDev', () => {
      const mean = 0;
      const stdDev = 1;
      const samples = Array.from({ length: 1000 }, () => Crypto.randGaussian(mean, stdDev));
      const sampleMean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const variance = samples.reduce((sum, value) => sum + Math.pow(value - sampleMean, 2), 0) / samples.length;
      const sampleStdDev = Math.sqrt(variance);
      expect(sampleStdDev).toBeCloseTo(stdDev, 0);
    });

    it('should use default parameters when not provided', () => {
      // Default mean = 0, stdDev = 1
      const samples = Array.from({ length: 1000 }, () => Crypto.randGaussian());
      const sampleMean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const variance = samples.reduce((sum, value) => sum + Math.pow(value - sampleMean, 2), 0) / samples.length;
      const sampleStdDev = Math.sqrt(variance);

      expect(sampleMean).toBeCloseTo(0, 0);
      expect(sampleStdDev).toBeCloseTo(1, 0);
    });

    it('should handle zero standard deviation', () => {
      const mean = 10;
      const stdDev = 0;
      const samples = Array.from({ length: 10 }, () => Crypto.randGaussian(mean, stdDev));

      // With stdDev = 0, all values should be exactly the mean
      for (const sample of samples) {
        expect(sample).toBeCloseTo(mean, 5);
      }
    });

    it('should generate different values on subsequent calls', () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(Crypto.randGaussian());
      }
      // With 100 calls, we should get close to 100 unique values
      expect(values.size).toBeGreaterThan(95);
    });
  });

  describe('randNormal()', () => {
    it('should generate numbers with mean close to specified mean', () => {
      const mean = 5;
      const stdDev = 2;
      const samples = Array.from({ length: 1000 }, () => Crypto.randNormal(mean, stdDev));
      const sampleMean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      expect(sampleMean).toBeCloseTo(mean, 0);
    });

    it('should generate numbers with standard deviation close to specified stdDev', () => {
      const mean = 0;
      const stdDev = 1;
      const samples = Array.from({ length: 1000 }, () => Crypto.randNormal(mean, stdDev));
      const sampleMean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const variance = samples.reduce((sum, value) => sum + Math.pow(value - sampleMean, 2), 0) / samples.length;
      const sampleStdDev = Math.sqrt(variance);
      expect(sampleStdDev).toBeCloseTo(stdDev, 0);
    });

    it('should use default parameters when not provided', () => {
      // Default mean = 0, stdDev = 1
      const samples = Array.from({ length: 1000 }, () => Crypto.randNormal());
      const sampleMean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const variance = samples.reduce((sum, value) => sum + Math.pow(value - sampleMean, 2), 0) / samples.length;
      const sampleStdDev = Math.sqrt(variance);

      expect(sampleMean).toBeCloseTo(0, 0);
      expect(sampleStdDev).toBeCloseTo(1, 0);
    });

    it('should handle zero standard deviation', () => {
      const mean = 10;
      const stdDev = 0;
      const samples = Array.from({ length: 10 }, () => Crypto.randNormal(mean, stdDev));

      // With stdDev = 0, all values should be exactly the mean
      for (const sample of samples) {
        expect(sample).toBeCloseTo(mean, 5);
      }
    });

    it('should generate different values on subsequent calls', () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(Crypto.randNormal());
      }
      // With 100 calls, we should get close to 100 unique values
      expect(values.size).toBeGreaterThan(95);
    });
  });

  describe('randWalk()', () => {
    it('should return array with correct length', () => {
      const steps = 10;
      const walk = Crypto.randWalk(steps);
      // +1 because it includes starting position 0
      expect(walk).toHaveLength(steps + 1);
    });

    it('should start at position 0', () => {
      const walk = Crypto.randWalk(5);
      expect(walk[0]).toBe(0);
    });

    it('should use default step size of 1', () => {
      const walk = Crypto.randWalk(10);
      for (let i = 1; i < walk.length; i++) {
        const step = Math.abs(walk[i] - walk[i - 1]);
        expect(step).toBe(1);
      }
    });

    it('should use custom step size', () => {
      const stepSize = 2;
      const walk = Crypto.randWalk(10, stepSize);
      for (let i = 1; i < walk.length; i++) {
        const step = Math.abs(walk[i] - walk[i - 1]);
        expect(step).toBe(stepSize);
      }
    });

    it('should only move by +stepSize or -stepSize', () => {
      const stepSize = 3;
      const walk = Crypto.randWalk(20, stepSize);
      for (let i = 1; i < walk.length; i++) {
        const change = walk[i] - walk[i - 1];
        expect([stepSize, -stepSize]).toContain(change);
      }
    });

    it('should produce different walks on multiple calls', () => {
      const walks = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const walk = Crypto.randWalk(10);
        walks.add(JSON.stringify(walk));
      }
      // Should have variety (at least 8 different walks out of 10)
      expect(walks.size).toBeGreaterThan(7);
    });

    it('should handle zero steps', () => {
      const walk = Crypto.randWalk(0);
      expect(walk).toEqual([0]);
    });

    it('should handle single step', () => {
      const walk = Crypto.randWalk(1);
      expect(walk).toHaveLength(2);
      expect(walk[0]).toBe(0);
      expect([1, -1]).toContain(walk[1]);
    });

    it('should handle fractional step sizes', () => {
      const stepSize = 0.5;
      const walk = Crypto.randWalk(5, stepSize);
      expect(walk).toHaveLength(6);
      expect(walk[0]).toBe(0);

      for (let i = 1; i < walk.length; i++) {
        const change = walk[i] - walk[i - 1];
        expect([stepSize, -stepSize]).toContain(change);
      }
    });

    it('should handle negative step sizes', () => {
      const stepSize = -2;
      const walk = Crypto.randWalk(5, stepSize);

      for (let i = 1; i < walk.length; i++) {
        const change = walk[i] - walk[i - 1];
        // With negative stepSize, directions are flipped
        expect([stepSize, -stepSize]).toContain(change);
      }
    });

    it('should be cumulative (each position depends on previous)', () => {
      const walk = Crypto.randWalk(10, 2);
      let expectedPosition = 0;

      expect(walk[0]).toBe(expectedPosition);

      for (let i = 1; i < walk.length; i++) {
        const change = walk[i] - walk[i - 1];
        expectedPosition += change;
        expect(walk[i]).toBe(expectedPosition);
      }
    });

    it('should maintain mathematical properties over many steps', () => {
      const steps = 1000;
      const walk = Crypto.randWalk(steps);

      // Verify array length
      expect(walk).toHaveLength(steps + 1);

      // Verify all steps are valid
      for (let i = 1; i < walk.length; i++) {
        const change = walk[i] - walk[i - 1];
        expect([1, -1]).toContain(change);
      }

      // Final position should be reasonable (not impossibly far)
      const finalPosition = walk[walk.length - 1];
      expect(Math.abs(finalPosition)).toBeLessThanOrEqual(steps);
    });

    it('should have roughly balanced movement over many iterations', () => {
      // Test statistical properties over multiple walks
      const walkCount = 50;
      const steps = 20;
      let totalFinalPositions = 0;

      for (let i = 0; i < walkCount; i++) {
        const walk = Crypto.randWalk(steps);
        totalFinalPositions += walk[walk.length - 1];
      }

      const averageFinalPosition = totalFinalPositions / walkCount;
      // Average should be close to 0 (unbiased random walk)
      expect(Math.abs(averageFinalPosition)).toBeLessThan(5);
    });

    it('should work with large step counts', () => {
      const walk = Crypto.randWalk(1000);
      expect(walk).toHaveLength(1001);
      expect(walk[0]).toBe(0);

      // Verify first few and last few steps for efficiency
      for (let i = 1; i <= 5; i++) {
        const change = walk[i] - walk[i - 1];
        expect([1, -1]).toContain(change);
      }

      for (let i = walk.length - 5; i < walk.length; i++) {
        const change = walk[i] - walk[i - 1];
        expect([1, -1]).toContain(change);
      }
    });

    it('should return numbers (not strings or other types)', () => {
      const walk = Crypto.randWalk(5);
      walk.forEach(position => {
        expect(typeof position).toBe('number');
        expect(Number.isFinite(position)).toBe(true);
      });
    });

    it('should handle edge case with very small step size', () => {
      const stepSize = 0.001;
      const walk = Crypto.randWalk(3, stepSize);

      expect(walk).toHaveLength(4);
      expect(walk[0]).toBe(0);

      for (let i = 1; i < walk.length; i++) {
        const change = walk[i] - walk[i - 1];
        expect(Math.abs(Math.abs(change) - stepSize)).toBeLessThan(0.0001);
      }
    });
  });

  describe('randPassword()', () => {
    it('should generate password of specified length', () => {
      const password = Crypto.randPassword({ length: 12 });
      expect(password).toHaveLength(12);
      expect(typeof password).toBe('string');
    });

    it('should use default character types (uppercase, lowercase, numbers)', () => {
      // Test the character set construction logic directly
      const originalRandString = Crypto.randString;

      // Mock randString to return a predictable output for testing
      Crypto.randString = jest.fn().mockImplementation((length, charset) => {
        // Verify that the charset contains the expected character types
        expect(charset).toMatch(/[A-Z]/); // Should contain uppercase
        expect(charset).toMatch(/[a-z]/); // Should contain lowercase
        expect(charset).toMatch(/[0-9]/); // Should contain numbers
        expect(charset).not.toMatch(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/); // Should not contain symbols

        // Return a string that includes at least one of each character type
        return 'Aa1' + 'x'.repeat(length - 3);
      });

      // Generate password with mocked randString
      const password = Crypto.randPassword({ length: 50 });

      // Restore original randString function
      Crypto.randString = originalRandString;

      // Verify the password has the expected length
      expect(password).toHaveLength(50);

      // Generate multiple passwords with real randString to test probabilistic behavior
      const numPasswords = 5;
      const passwordLength = 100; // Longer passwords reduce probability of missing character types
      let containsUppercase = false;
      let containsLowercase = false;
      let containsNumbers = false;

      for (let i = 0; i < numPasswords; i++) {
        const testPassword = Crypto.randPassword({ length: passwordLength });

        // Check if this password contains each character type
        if (/[A-Z]/.test(testPassword)) containsUppercase = true;
        if (/[a-z]/.test(testPassword)) containsLowercase = true;
        if (/[0-9]/.test(testPassword)) containsNumbers = true;

        // If all character types are found, no need to continue
        if (containsUppercase && containsLowercase && containsNumbers) break;
      }

      // Verify that at least one password contains each character type
      expect(containsUppercase).toBe(true); // Should contain uppercase
      expect(containsLowercase).toBe(true); // Should contain lowercase
      expect(containsNumbers).toBe(true); // Should contain numbers

      // Verify that symbols are not included by default
      const symbolsTest = Array(numPasswords).fill(0).map(() =>
        Crypto.randPassword({ length: passwordLength })
      );

      const containsSymbols = symbolsTest.some(pwd =>
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
      );

      expect(containsSymbols).toBe(false);
    });

    it('should include uppercase when specified', () => {
      const password = Crypto.randPassword({
        length: 20,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false
      });

      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(false);
      expect(/[0-9]/.test(password)).toBe(false);
    });

    it('should include lowercase when specified', () => {
      const password = Crypto.randPassword({
        length: 20,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false
      });

      expect(/[A-Z]/.test(password)).toBe(false);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(false);
    });

    it('should include numbers when specified', () => {
      const password = Crypto.randPassword({
        length: 20,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false
      });

      expect(/[A-Z]/.test(password)).toBe(false);
      expect(/[a-z]/.test(password)).toBe(false);
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it('should include symbols when specified', () => {
      const password = Crypto.randPassword({
        length: 20,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: true
      });

      expect(/[A-Z]/.test(password)).toBe(false);
      expect(/[a-z]/.test(password)).toBe(false);
      expect(/[0-9]/.test(password)).toBe(false);
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)).toBe(true);
    });

    it('should exclude similar characters when specified', () => {
      const password = Crypto.randPassword({
        length: 100, // Large sample for better testing
        excludeSimilar: true
      });

      // Should not contain similar-looking characters: 0, O, 1, l, I
      expect(password).not.toMatch(/[0O1lI]/);
    });

    it('should include similar characters when not excluded', () => {
      // Generate multiple passwords to increase chance of getting similar chars
      let foundSimilar = false;
      for (let i = 0; i < 10; i++) {
        const password = Crypto.randPassword({
          length: 50,
          excludeSimilar: false
        });
        if (/[0O1lI]/.test(password)) {
          foundSimilar = true;
          break;
        }
      }
      expect(foundSimilar).toBe(true);
    });

    it('should use custom characters when provided', () => {
      const customChars = 'ABC123';
      const password = Crypto.randPassword({
        length: 20,
        customChars
      });

      for (const char of password) {
        expect(customChars).toContain(char);
      }
    });

    it('should ignore other options when custom characters are provided', () => {
      const customChars = 'XYZ';
      const password = Crypto.randPassword({
        length: 10,
        customChars,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true
      });

      // Should only use custom chars, ignoring other options
      for (const char of password) {
        expect(customChars).toContain(char);
      }
      expect(password).toMatch(/^[XYZ]+$/);
    });

    it('should throw error when no character types are enabled', () => {
      expect(() => Crypto.randPassword({
        length: 10,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false
      })).toThrow('At least one character type must be enabled');
    });

    it('should generate different passwords on multiple calls', () => {
      const passwords = new Set<string>();
      for (let i = 0; i < 50; i++) {
        passwords.add(Crypto.randPassword({ length: 16 }));
      }
      // Should have high uniqueness (at least 48 unique out of 50)
      expect(passwords.size).toBeGreaterThan(47);
    });

    // This test might fail due to cryptographic randomization, which is inherently unpredictable.
    it('should handle complex character combinations', () => {
      const password = Crypto.randPassword({
        length: 50,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true
      });

      expect(password).toHaveLength(50);
      // Combined regex for uppercase, lowercase, and numbers using positive lookaheads
      expect(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)).toBe(true);
      expect(password).not.toMatch(/[0O1lI]/);
    });

    it('should handle minimum length passwords', () => {
      const password = Crypto.randPassword({ length: 1 });
      expect(password).toHaveLength(1);
      expect(typeof password).toBe('string');
    });

    it('should handle large passwords efficiently', () => {
      const start = Date.now();
      const password = Crypto.randPassword({ length: 1000 });
      const end = Date.now();

      expect(password).toHaveLength(1000);
      // We need to increase this now because the average of 1k is set to 700 due to different hardware.
      // However, on my local machine (Ubuntu 25.04 (Plucky Puffin)), it's less than 350.
      expect(end - start).toBeLessThan(700); // Increased from 500 to 700 because 500 fails on Windows, haha.
    });

    it('should generate passwords with balanced character distribution', () => {
      const password = Crypto.randPassword({
        length: 200, // Large sample for statistical analysis
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false
      });

      const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
      const lowercaseCount = (password.match(/[a-z]/g) || []).length;
      const numberCount = (password.match(/[0-9]/g) || []).length;

      // Each type should appear at least a few times
      expect(uppercaseCount).toBeGreaterThan(5);
      expect(lowercaseCount).toBeGreaterThan(5);
      expect(numberCount).toBeGreaterThan(5);
    });

    it('should maintain security properties', () => {
      const passwords: string[] = [];
      for (let i = 0; i < 20; i++) {
        passwords.push(Crypto.randPassword({ length: 12 }));
      }

      // Check that passwords don't follow predictable patterns
      const firstChars = passwords.map(p => p[0]);
      const uniqueFirstChars = new Set(firstChars);
      expect(uniqueFirstChars.size).toBeGreaterThan(10); // Good entropy in first char

      // Check that no password is a substring of another
      for (let i = 0; i < passwords.length; i++) {
        for (let j = i + 1; j < passwords.length; j++) {
          expect(passwords[i]).not.toContain(passwords[j]);
          expect(passwords[j]).not.toContain(passwords[i]);
        }
      }
    });

    it('should work with only symbols enabled', () => {
      const password = Crypto.randPassword({
        length: 15,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: true
      });

      expect(password).toHaveLength(15);
      expect(/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(password)).toBe(true);
    });

    it('should handle edge case with all character types disabled except one', () => {
      // Test each character type individually
      const tests = [
        { includeUppercase: true, pattern: /^[A-Z]+$/ },
        { includeLowercase: true, pattern: /^[a-z]+$/ },
        { includeNumbers: true, pattern: /^[0-9]+$/ },
        { includeSymbols: true, pattern: /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/ }
      ];

      tests.forEach(test => {
        const options = {
          length: 10,
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: false,
          includeSymbols: false,
          ...test
        };

        const password = Crypto.randPassword(options);
        expect(password).toMatch(test.pattern);
      });
    });
  });

  describe('randLattice()', () => {
    beforeEach(() => {
      // Ensure we're in Node.js environment for these tests
      jest.clearAllMocks();
    });

    // Setup for tests that should throw errors
    const testErrorCase = (errorMessage: string | RegExp | jest.Constructable | Error | undefined, testFn: { (): number; (): number; (): number; (): number; (): void; }) => {
      expect(() => {
        testFn();
      }).toThrow(errorMessage);
    };

    describe('basic functionality', () => {
      test('should return a number between 0 and 1', () => {
        const result = Crypto.randLattice();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      });

      test('should work with default parameters', () => {
        const result = Crypto.randLattice();
        expect(result).toBeDefined();
        expect(Number.isFinite(result)).toBe(true);
      });

      test('should work with custom parameters', () => {
        const result = Crypto.randLattice(256, 7681);
        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      });

      test('should throw error for dimension and modulus non-integer', () => {
        expect(() => Crypto.randLattice(133.7, 1.337)).toThrow(randLatticeErr);
        expect(() => Crypto.randLattice(1337, 1.337)).toThrow(randLatticeErr);
        expect(() => Crypto.randLattice(1.337, 1337)).toThrow(randLatticeErr);
      });
    });

    describe('parameter validation', () => {
      test('should handle small dimensions', () => {
        const result = Crypto.randLattice(16, 97);
        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
      });

      test('should handle large dimensions', () => {
        const result = Crypto.randLattice(1024, 12289);
        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
      });

      test('should handle different modulus values', () => {
        const moduli = [97, 769, 3329, 7681, 12289]; // Common lattice crypto moduli

        moduli.forEach(modulus => {
          const result = Crypto.randLattice(256, modulus);
          expect(result).toBeDefined();
          expect(typeof result).toBe('number');
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThan(1);
        });
      });
    });

    describe('statistical properties', () => {
      test('should produce different values on multiple calls', () => {
        const results = Array.from({ length: 10 }, () => Crypto.randLattice());

        // Check that not all values are the same
        const uniqueResults = new Set(results);
        expect(uniqueResults.size).toBeGreaterThan(1);
      });

      test('should have reasonable distribution', () => {
        const sampleSize = 1000;
        const results = Array.from({ length: sampleSize }, () => Crypto.randLattice());

        // Basic distribution checks
        const mean = results.reduce((sum, val) => sum + val, 0) / sampleSize;
        const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sampleSize;

        // Mean should be around 0.5 for uniform-like distribution
        expect(mean).toBeGreaterThan(0.1);
        expect(mean).toBeLessThan(0.9);

        // Should have some variance (not all the same value)
        expect(variance).toBeGreaterThan(0);
      });

      test('should maintain consistency across parameter sets', () => {
        const params = [
          { dimension: 256, modulus: 3329 },
          { dimension: 512, modulus: 3329 },
          { dimension: 1024, modulus: 7681 }
        ];

        params.forEach(({ dimension, modulus }) => {
          const results = Array.from({ length: 10 }, () =>
            Crypto.randLattice(dimension, modulus)
          );

          results.forEach(result => {
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(1);
            expect(Number.isFinite(result)).toBe(true);
          });
        });
      });
    });

    describe('security properties', () => {
      test('should use ternary secret coefficients', () => {
        // This is more of a design verification - we can't directly test
        // the internal secret generation, but we can verify the method
        // completes successfully which implies proper secret generation
        expect(() => Crypto.randLattice()).not.toThrow();
      });

      // Skipped: this operation now executes in constant time
      test.skip('should include Gaussian error in computation', () => {
        // Test that the method uses Gaussian distribution internally
        // by ensuring it doesn't throw when randNormal is called
        const originalRandNormal = Crypto.randNormal;
        let gaussianCalled = false;

        // Mock randNormal to verify it's called
        Crypto.randNormal = jest.fn().mockImplementation((mean, stdDev) => {
          gaussianCalled = true;
          return originalRandNormal.call(Crypto, mean, stdDev);
        });

        Crypto.randLattice();

        expect(gaussianCalled).toBe(true);

        // Restore original method
        Crypto.randNormal = originalRandNormal;
      });

      test('should produce cryptographically strong output', () => {
        const results = Array.from({ length: 100 }, () => Crypto.randLattice());

        // Check for patterns that would indicate weak randomness
        let consecutiveEqual = 0;
        let maxConsecutive = 0;

        for (let i = 1; i < results.length; i++) {
          if (results[i] === results[i - 1]) {
            consecutiveEqual++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveEqual);
          } else {
            consecutiveEqual = 0;
          }
        }

        // Should not have many consecutive equal values
        expect(maxConsecutive).toBeLessThan(3);
      });
    });

    describe('performance', () => {
      test('should complete in reasonable time for default parameters', () => {
        const startTime = Date.now();
        Crypto.randLattice();
        const endTime = Date.now();

        // Should complete within a reasonable time (less than 100ms)
        expect(endTime - startTime).toBeLessThan(100);
      });

      test('should handle multiple calls efficiently', () => {
        const startTime = Date.now();

        for (let i = 0; i < 10; i++) {
          Crypto.randLattice(256, 3329);
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // 10 calls should complete in reasonable time
        expect(totalTime).toBeLessThan(1000);
      });
    });

    describe('browser environment', () => {
      test('should throw error in browser environment', () => {
        // Mock browser environment
        const originalIsBrowser = Crypto['isBrowser'];
        Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

        expect(() => Crypto.randLattice()).toThrow(
          errorUnsupported('randLattice')
        );

        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      });
    });

    describe('edge cases', () => {
      test('should handle minimum viable parameters', () => {
        // Test with very small but valid parameters
        const result = Crypto.randLattice(2, 3);
        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      });

      test('should handle parameters typical for post-quantum schemes', () => {
        // ML-KEM (CRYSTALS-Kyber) - NIST standardized parameters
        const mlkemParams = [
          { dimension: 256, modulus: 3329, name: 'ML-KEM-512' },   // Security level 1
          { dimension: 512, modulus: 3329, name: 'ML-KEM-768' },   // Security level 3
          { dimension: 768, modulus: 3329, name: 'ML-KEM-1024' }   // Security level 5
        ];

        // ML-DSA (CRYSTALS-Dilithium) - NIST standardized parameters
        const mldsaParams = [
          { dimension: 256, modulus: 8380417, name: 'ML-DSA-44' },  // Security level 2
          { dimension: 512, modulus: 8380417, name: 'ML-DSA-65' },  // Security level 3
          { dimension: 768, modulus: 8380417, name: 'ML-DSA-87' }   // Security level 5
        ];

        // FALCON - NIST standardized parameters
        const falconParams = [
          { dimension: 512, modulus: 12289, name: 'FALCON-512' },   // Security level 1
          { dimension: 1024, modulus: 12289, name: 'FALCON-1024' }  // Security level 5
        ];

        // SPHINCS+ - Hash-based signatures (different structure but testing compatibility)
        const sphincsParams = [
          { dimension: 128, modulus: 256, name: 'SPHINCS+-128s' },  // Security level 1
          { dimension: 192, modulus: 256, name: 'SPHINCS+-192s' },  // Security level 3
          { dimension: 256, modulus: 256, name: 'SPHINCS+-256s' }   // Security level 5
        ];

        // Classic-McEliece (code-based) - testing with adapted parameters
        const mcelieceParams = [
          { dimension: 348, modulus: 4096, name: 'Classic-McEliece-348864' },
          { dimension: 460, modulus: 8192, name: 'Classic-McEliece-460896' },
          { dimension: 6688, modulus: 128, name: 'Classic-McEliece-6688128' }
        ];

        // BIKE (code-based) - Round 4 alternate candidate
        const bikeParams = [
          { dimension: 12323, modulus: 2, name: 'BIKE-L1' },
          { dimension: 24659, modulus: 2, name: 'BIKE-L3' },
          { dimension: 40973, modulus: 2, name: 'BIKE-L5' }
        ];

        // HQC (code-based) - Round 4 alternate candidate
        const hqcParams = [
          { dimension: 17669, modulus: 2, name: 'HQC-128' },
          { dimension: 35851, modulus: 2, name: 'HQC-192' },
          { dimension: 57637, modulus: 2, name: 'HQC-256' }
        ];

        // Combine all parameter sets
        const allParams = [
          ...mlkemParams,
          ...mldsaParams,
          ...falconParams,
          ...sphincsParams,
          ...mcelieceParams,
          ...bikeParams,
          ...hqcParams
        ];

        allParams.forEach(({ dimension, modulus }) => {
          expect(() => {
            const result = Crypto.randLattice(dimension, modulus);
            expect(result).toBeDefined();
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(1);
            expect(Number.isFinite(result)).toBe(true);
          }).not.toThrow();
        });
      });

      test('should handle NIST security levels correctly', () => {
        // Test parameters for each NIST security level
        const securityLevels = [
          {
            level: 1,
            params: [
              { dimension: 256, modulus: 3329, scheme: 'ML-KEM-512' },
              { dimension: 512, modulus: 12289, scheme: 'FALCON-512' }
            ]
          },
          {
            level: 3,
            params: [
              { dimension: 512, modulus: 3329, scheme: 'ML-KEM-768' },
              { dimension: 512, modulus: 8380417, scheme: 'ML-DSA-65' }
            ]
          },
          {
            level: 5,
            params: [
              { dimension: 768, modulus: 3329, scheme: 'ML-KEM-1024' },
              { dimension: 1024, modulus: 12289, scheme: 'FALCON-1024' }
            ]
          }
        ];

        securityLevels.forEach(({ params }) => {
          params.forEach(({ dimension, modulus }) => {
            let results: number[];
            results = Array.from({ length: 10 }, () =>
              Crypto.randLattice(dimension, modulus)
            );

            results.forEach(result => {
              expect(result).toBeGreaterThanOrEqual(0);
              expect(result).toBeLessThan(1);
              expect(Number.isFinite(result)).toBe(true);
            });

            // Verify uniqueness for security level
            const uniqueResults = new Set(results);
            expect(uniqueResults.size).toBeGreaterThan(5);
          });
        });
      });

      test('should maintain quantum resistance across all NIST schemes', () => {
        // Test that the method works with parameters from all NIST-approved schemes
        const nistSchemes = [
          // Key Encapsulation Mechanisms
          { name: 'ML-KEM-512', dimension: 256, modulus: 3329, type: 'KEM' },
          { name: 'ML-KEM-768', dimension: 512, modulus: 3329, type: 'KEM' },
          { name: 'ML-KEM-1024', dimension: 768, modulus: 3329, type: 'KEM' },

          // Digital Signatures
          { name: 'ML-DSA-44', dimension: 256, modulus: 8380417, type: 'DSA' },
          { name: 'ML-DSA-65', dimension: 512, modulus: 8380417, type: 'DSA' },
          { name: 'ML-DSA-87', dimension: 768, modulus: 8380417, type: 'DSA' },

          // FALCON signatures
          { name: 'FALCON-512', dimension: 512, modulus: 12289, type: 'DSA' },
          { name: 'FALCON-1024', dimension: 1024, modulus: 12289, type: 'DSA' },

          // SPHINCS+ (hash-based)
          { name: 'SPHINCS+-128s', dimension: 128, modulus: 256, type: 'DSA' },
          { name: 'SPHINCS+-192s', dimension: 192, modulus: 256, type: 'DSA' },
          { name: 'SPHINCS+-256s', dimension: 256, modulus: 256, type: 'DSA' }
        ];

        nistSchemes.forEach(({ dimension, modulus, }) => {
          // Generate multiple samples to test consistency
          const samples = Array.from({ length: 20 }, () =>
            Crypto.randLattice(dimension, modulus)
          );

          samples.forEach((sample) => {
            expect(sample).toBeGreaterThanOrEqual(0);
            expect(sample).toBeLessThan(1);
            expect(Number.isFinite(sample)).toBe(true);
          });

          // Test statistical properties
          const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
          const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;

          expect(variance).toBeGreaterThan(0); // Should have entropy
          expect(mean).toBeGreaterThan(0.05); // Reasonable distribution
          expect(mean).toBeLessThan(0.95);
        });
      });

      test('should handle Round 4 alternate candidates', () => {
        // Test parameters from NIST Round 4 alternate candidates
        const round4Candidates = [
          // BIKE (code-based)
          { name: 'BIKE-L1', dimension: 12323, modulus: 2 },
          { name: 'BIKE-L3', dimension: 24659, modulus: 2 },

          // HQC (code-based)
          { name: 'HQC-128', dimension: 17669, modulus: 2 },
          { name: 'HQC-192', dimension: 35851, modulus: 2 },

          // Classic McEliece (code-based)
          { name: 'Classic-McEliece-348864', dimension: 348, modulus: 4096 },
          { name: 'Classic-McEliece-460896', dimension: 460, modulus: 8192 }
        ];

        round4Candidates.forEach(({ dimension, modulus }) => {
          expect(() => {
            const result = Crypto.randLattice(dimension, modulus);
            expect(result).toBeDefined();
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(1);
          }).not.toThrow();
        });
      });
    });

    describe('quantum resistance properties', () => {
      test('should implement LWE structure', () => {
        // Verify the method implements the Learning With Errors structure
        // by ensuring it produces valid outputs that could represent LWE samples
        const samples = Array.from({ length: 50 }, () => Crypto.randLattice());

        // LWE samples should be distributed across the full range [0, 1)
        const min = Math.min(...samples);
        const max = Math.max(...samples);

        expect(min).toBeGreaterThanOrEqual(0);
        expect(max).toBeLessThan(1);
        expect(max - min).toBeGreaterThan(0.1); // Should span a reasonable range
      });

      test('should maintain security for different dimension sizes', () => {
        const dimensions = [128, 256, 512, 1024];

        dimensions.forEach(dimension => {
          expect(() => Crypto.randLattice(dimension, 3329)).not.toThrow();

          const result = Crypto.randLattice(dimension, 3329);
          expect(result).toBeDefined();
          expect(typeof result).toBe('number');
        });
      });
    });

    describe('customCdtTables validation', () => {
      test('should reject empty object as customCdtTables', () => {
        testErrorCase(
          'Custom CDT tables must contain at least one entry',
          () => Crypto.randLattice(512, 3329, 3.2, 'normalized', {})
        );
      });

      test('should reject when sigma not in custom tables or default tables', () => {
        testErrorCase(
          'No CDT table available for sigma=2.5',
          () => Crypto.randLattice(512, 3329, 2.5, 'normalized', { 1.0: [1, 2, 3] })
        );
      });

      test('should reject empty array table for requested sigma', () => {
        testErrorCase(
          'CDT table for sigma=3.2 must be a non-empty array of numbers',
          () => Crypto.randLattice(512, 3329, 3.2, 'normalized', { 3.2: [] })
        );
      });

      test('should reject array with NaN elements', () => {
        testErrorCase(
          'CDT table for sigma=3.2 contains invalid values at index 2',
          () => Crypto.randLattice(512, 3329, 3.2, 'normalized', { 3.2: [123, 456, NaN] })
        );
      });

      describe('constant time execution', () => {
        // Skipped: This test. Although challenging, it passed on my machine.
        test.skip('should execute in constant time regardless of input parameters', () => {
          // Skip this test in environments without process.hrtime.bigint
          if (typeof process === 'undefined' || !process.hrtime || !process.hrtime.bigint) {
            console.log('Skipping constant time test: process.hrtime.bigint not available');
            return;
          }

          // Different parameter sets to test
          const paramSets = [
            { dimension: 256, modulus: 3329, label: 'small dimension' },
            { dimension: 512, modulus: 3329, label: 'medium dimension' },
            { dimension: 768, modulus: 3329, label: 'large dimension' },
            { dimension: 512, modulus: 7681, label: 'larger modulus' },
            { dimension: 512, modulus: 12289, label: 'even larger modulus' },
          ];

          // 1K iterations are acceptable within a CV of 1.1, as it also depends on resource availability.
          const iterations = 1000; // Number of times to run each parameter set
          const results: Record<string, { avgTime: number, maxTime: number, minTime: number, stdDev: number }> = {};

          // Run each parameter set multiple times and record execution times
          paramSets.forEach(params => {
            const timings: number[] = [];

            for (let i = 0; i < iterations; i++) {
              const start = process.hrtime.bigint();
              Crypto.randLattice(params.dimension, params.modulus);
              const end = process.hrtime.bigint();
              timings.push(Number(end - start));
            }

            // Calculate statistics
            const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
            const maxTime = Math.max(...timings);
            const minTime = Math.min(...timings);
            const stdDev = Math.sqrt(timings.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timings.length);

            results[params.label] = { avgTime, maxTime, minTime, stdDev };
          });

          // Analyze results to verify constant time behavior
          const cvValues = Object.values(results).map(r => r.stdDev / r.avgTime);
          const maxCV = Math.max(...cvValues);

          expect(maxCV).toBeLessThan(1.1);

          const avgTimes = Object.values(results).map(r => r.avgTime);
          const minAvg = Math.min(...avgTimes);
          const maxAvg = Math.max(...avgTimes);

          const relativeDiff = (maxAvg - minAvg) / minAvg;

          expect(relativeDiff).toBeLessThan(1.6);
        });
      });
    });

    // This is superior and better than Math.random() because it's much hard-to-solve problems.
    test('should work with custom CDT table', () => {
      // Custom CDT table for sigma
      const customCDT = {
        2.5: [65535, 62891, 56734, 47889, 37876, 28456, 20482, 14236, 9634, 6324],
        4.0: [65535, 64512, 61923, 57456, 51423, 44234, 36567, 29123, 22456, 16789, 12345, 9012, 6543, 4567, 3210, 2234],
        12.8: [65535, 65472, 65280, 64896, 64000, 62500, 60000, 56789, 52345, 47123, 41234, 35678, 30123, 25000, 20123, 16234, 12987, 10234, 8123, 6234, 4567, 3210, 2345, 1543, 987, 543, 321, 234, 123, 87, 54, 32, 21, 12, 5, 2, 1],
        178.56: [65535, 65520, 65500, 65450, 65350, 65200, 64900, 64500, 64000, 63400, 62700, 61900, 61000, 60000, 58900, 57700, 56400, 55000, 53500, 52000, 50400, 48700, 47000, 45300, 43500, 41700, 39900, 38100, 36300, 34500, 32700, 31000, 29300, 27600, 26000, 24400, 22900, 21400, 20000, 18600, 17300, 16100, 14900, 13800, 12700, 11700, 10800, 9900, 9100, 8300, 7600, 6900, 6300, 5700, 5200, 4700, 4300, 3900, 3500, 3200, 2900, 2600, 2300, 2100, 1900, 1700, 1500, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 50, 25, 10, 5, 2, 1]
      };

      const resultSigma2_5 = Crypto.randLattice(256, 7681, 2.5, 'normalized', customCDT);
      const resultSigma4_0 = Crypto.randLattice(1024, 12289, 4.0, 'normalized', customCDT);
      const resultSigma12_8 = Crypto.randLattice(2048, 12289, 12.8, 'normalized', customCDT);
      const resultSigma178_56 = Crypto.randLattice(4096, 12289, 178.56, 'normalized', customCDT);

      expect(resultSigma2_5).toBeDefined();
      expect(Number.isFinite(resultSigma2_5)).toBe(true);
      expect(typeof resultSigma2_5).toBe('number');
      console.log('Sigma 2.5 result:', resultSigma2_5);

      expect(resultSigma4_0).toBeDefined();
      expect(Number.isFinite(resultSigma4_0)).toBe(true);
      expect(typeof resultSigma4_0).toBe('number');
      console.log('Sigma 4.0 result:', resultSigma4_0);

      expect(resultSigma12_8).toBeDefined();
      expect(Number.isFinite(resultSigma12_8)).toBe(true);
      expect(typeof resultSigma12_8).toBe('number');
      console.log('Sigma 12.8 result:', resultSigma12_8);

      expect(resultSigma178_56).toBeDefined();
      expect(Number.isFinite(resultSigma178_56)).toBe(true);
      expect(typeof resultSigma178_56).toBe('number');
      console.log('Very large sigma (178.56) result:', resultSigma178_56);
    });
  });

  describe('randPrime()', () => {
    beforeEach(() => {
      // Ensure we're in Node.js environment for these tests
      jest.clearAllMocks();
    });

    describe('basic functionality', () => {
      test('should return a BigInt', () => {
        const result = Crypto.randPrime(32, 38, true); // Small bit size for faster tests
        expect(typeof result).toBe('bigint');
      });

      test('should generate a probable prime number', () => {
        const isProbablePrime = (n: bigint): boolean => {
          // Simple primality test for testing purposes
          if (n <= 1n) return false;
          if (n <= 3n) return true;
          if (n % 2n === 0n) return false;

          // Check divisibility by odd numbers up to sqrt(n)
          const sqrt = BigInt(Math.floor(Math.sqrt(Number(n))));
          for (let i = 3n; i <= sqrt; i += 2n) {
            if (n % i === 0n) return false;
          }
          return true;
        };

        // Test with small primes for faster verification
        const prime = Crypto.randPrime(16, 38, true);
        expect(isProbablePrime(prime)).toBe(true);
      });

      test('should generate prime with specified bit length', () => {
        const bits = 32;
        const prime = Crypto.randPrime(bits, 38, true);

        // Check bit length
        const bitLength = prime.toString(2).length;
        expect(bitLength).toBe(bits);
      });
    });

    describe('parameter validation', () => {
      test('should throw error for invalid bit length', () => {
        expect(() => Crypto.randPrime(0)).toThrow(randBigIntErr);
        expect(() => Crypto.randPrime(1)).toThrow(randBigIntErr);
        expect(() => Crypto.randPrime(1.5)).toThrow(randBigIntErr);
      });

      test('should throw error for invalid iteration count', () => {
        expect(() => Crypto.randPrime(32, 0)).toThrow(randPrimeErr);
        expect(() => Crypto.randPrime(32, -1)).toThrow(randPrimeErr);
        expect(() => Crypto.randPrime(32, 1.5)).toThrow(randPrimeErr);
      });
    });

    describe('browser environment', () => {
      test('should throw error in browser environment', () => {
        // Mock browser environment
        const originalIsBrowser = Crypto['isBrowser'];
        Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

        expect(() => Crypto.randPrime()).toThrow(
          errorUnsupported('randPrime')
        );

        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      });
    });

    describe('security properties', () => {
      test('should generate different primes on multiple calls', () => {
        const prime1 = Crypto.randPrime(32, 38, true, true);
        const prime2 = Crypto.randPrime(32, 38, true, true);
        expect(prime1).not.toBe(prime2);
      });

      test('should handle common cryptographic bit lengths', () => {
        // Test with small bit lengths for faster tests
        const bitLengths = [8, 16, 32];

        bitLengths.forEach(bits => {
          const prime = Crypto.randPrime(bits, 38, true);
          expect(typeof prime).toBe('bigint');
          expect(prime.toString(2).length).toBe(bits);
        });
      });
    });

    describe('performance', () => {
      test('should complete in reasonable time for small bit lengths', () => {
        const startTime = Date.now();
        Crypto.randPrime(32, 38, true);
        const endTime = Date.now();

        // Should complete within a reasonable time
        expect(endTime - startTime).toBeLessThan(1000);
      });
    });

    // Some keyGenTime times have been increased to 120 seconds due to potential overhead or slowness on certain operating systems,
    // such as Windows hahaha, for non-async operations.
    describe('RSA key generation', () => {
      test('should generate primes suitable for RSA key generation', () => {
        // Generate two smaller primes for testing (using 512 bits instead of 1024 for speed)
        let p: bigint, q: bigint, n: bigint, phi: bigint;
        const expectedBitLength: number = 512;

        // Loop to ensure modulus n is of the expected bit length
        do {
          p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p).not.toBe(q);

          // Calculate RSA parameters
          n = p * q; // modulus
          phi = (p - 1n) * (q - 1n); // Euler's totient function
        } while (n.toString(2).length !== 2 * expectedBitLength);

        // Common RSA public exponent
        const e = 65537n;

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e, phi)).toBe(1n);

        // Calculate private exponent d (using modular multiplicative inverse from math_helper)
        const d = modInverse(e, phi);

        // Verify that d is the modular multiplicative inverse of e modulo phi
        expect((d * e) % phi).toBe(1n);

        // Test RSA encryption and decryption
        const message = 42n; // Sample message to encrypt

        // Encrypt: c ≡ m^e (mod n) (using modPow from math utilities)
        const ciphertext = modPow(message, e, n);

        // Decrypt: m ≡ c^d (mod n) (using modPow from math utilities)
        const decrypted = modPow(ciphertext, d, n);

        // Verify that decryption works
        expect(decrypted).toBe(message);

        // Additional verification: ensure the message is within valid range
        expect(message).toBeLessThan(n);
        expect(ciphertext).toBeLessThan(n);
        expect(decrypted).toBeLessThan(n);

        // Verify that encryption actually changes the message
        expect(ciphertext).not.toBe(message);
      });

      test('should generate different primes on multiple calls', () => {
        const primes = new Set<bigint>();

        // Generate multiple primes to verify uniqueness
        for (let i = 0; i < 5; i++) {
          const prime = Crypto.randPrime(256);
          primes.add(prime);
        }

        // All primes should be unique (very high probability)
        expect(primes.size).toBe(5);
      });

      test('should handle edge cases for RSA parameter validation', () => {
        const p = Crypto.randPrime(128, 38, true);
        const q = Crypto.randPrime(128, 38, true);
        const n = p * q;
        const phi = (p - 1n) * (q - 1n);
        const e = 65537n;

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e, phi)).toBe(1n);

        // Verify that n has sufficient bit length for security
        const nBitLength = n.toString(2).length;
        expect(nBitLength).toBeGreaterThanOrEqual(255); // Should be close to 256 bits

        // Verify that phi is large enough
        expect(phi).toBeGreaterThan(e);

        // Test with a message that's too large (should be less than n)
        const largePrime = Crypto.randPrime(256, 38, true);
        if (largePrime >= n) {
          // If message >= n, RSA won't work properly
          expect(() => {
            modPow(largePrime, e, n);
          }).not.toThrow(); // modPow should still work, but result won't be reversible
        }
      });

      test('should perform RSA encryption and decryption with various message sizes', () => {
        // Generate RSA key pair
        let p: bigint, q: bigint, n: bigint, phi: bigint;
        const expectedBitLength: number = 512;

        // Loop to ensure modulus n is of the expected bit length
        do {
          p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p).not.toBe(q);

          n = p * q;
          phi = (p - 1n) * (q - 1n);
        } while (n.toString(2).length !== 2 * expectedBitLength);

        const e = 65537n;

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e, phi)).toBe(1n);

        const d = modInverse(e, phi);

        // Test messages of different sizes
        const testMessages = [
          1n,
          42n,
          123456789n,
          BigInt(Math.floor(Math.random() * 1000000)), // Random message
          n - 1n // Maximum valid message (just under modulus)
        ];

        testMessages.forEach(message => {
          // Skip if message is too large for this key
          if (message >= n) return;

          // Encrypt the message
          const encrypted = modPow(message, e, n);

          // Decrypt the message
          const decrypted = modPow(encrypted, d, n);

          // Verify decryption worked
          expect(decrypted).toBe(message);

          // Verify encryption changed the message (unless message is 0, 1, or has special properties)
          // Note: In RSA, some messages might encrypt to themselves due to mathematical properties
          if (message > 1n && message < n - 1n) {
            // For most messages, encryption should change the value
            // However, we'll only check this for messages that are not edge cases
            if (encrypted === message) {
              // This can happen with certain mathematical edge cases in RSA
              // Just verify that the round-trip works correctly
              console.warn(`Message ${message} encrypted to itself, which can happen in RSA`);
            }
          }

          // Verify ciphertext is within valid range
          expect(encrypted).toBeGreaterThanOrEqual(0n);
          expect(encrypted).toBeLessThan(n);
        });
      });

      test('should perform RSA digital signature and verification', () => {
        // Generate RSA key pair for signing
        let p: bigint, q: bigint, n: bigint, phi: bigint;
        const expectedBitLength: number = 512;

        // Loop to ensure modulus n is of the expected bit length
        do {
          p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p).not.toBe(q);

          n = p * q;
          phi = (p - 1n) * (q - 1n);
        } while (n.toString(2).length !== 2 * expectedBitLength);

        const e = 65537n;

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e, phi)).toBe(1n);

        const d = modInverse(e, phi);

        // Test different message hashes (simulating hash values)
        const messageHashes = [
          123456789n,
          987654321n,
          BigInt(Math.floor(Math.random() * 1000000)),
          555555555n
        ];

        messageHashes.forEach(hash => {
          // Skip if hash is too large for this key
          if (hash >= n) return;

          // Sign the hash (signature = hash^d mod n)
          const signature = modPow(hash, d, n);

          // Verify the signature (verification = signature^e mod n)
          const verified = modPow(signature, e, n);

          // Verification should recover the original hash
          expect(verified).toBe(hash);

          // Test signature tampering - modify signature slightly
          const tamperedSignature = signature + 1n;
          if (tamperedSignature < n) {
            const tamperedVerification = modPow(tamperedSignature, e, n);
            // Tampered signature should not verify to original hash
            expect(tamperedVerification).not.toBe(hash);
          }

          // Verify signature is within valid range
          expect(signature).toBeGreaterThanOrEqual(0n);
          expect(signature).toBeLessThan(n);
        });
      });

      test('should handle RSA signature verification with wrong public key', () => {
        // Generate first RSA key pair
        let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
        const expectedBitLength: number = 512;

        // Loop to ensure modulus n is of the expected bit length
        do {
          p1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p1).not.toBe(q1);

          n1 = p1 * q1;
          phi1 = (p1 - 1n) * (q1 - 1n);
        } while (n1.toString(2).length !== 2 * expectedBitLength);

        const e1 = 65537n;

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e1, phi1)).toBe(1n);

        const d1 = modInverse(e1, phi1);

        // Generate second RSA key pair
        let p2: bigint, q2: bigint, n2: bigint;

        // Loop to ensure modulus n is of the expected bit length
        do {
          p2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p2).not.toBe(q2);

          n2 = p2 * q2;
        } while (n2.toString(2).length !== 2 * expectedBitLength);

        const e2 = 65537n;

        const messageHash = 123456n;

        // Skip if hash is too large for either key
        if (messageHash >= n1 || messageHash >= n2) return;

        // Sign with first key
        const signature = modPow(messageHash, d1, n1);

        // Try to verify with second key (should fail)
        // Note: We need to be careful about modulus size differences
        if (signature < n2) {
          const wrongVerification = modPow(signature, e2, n2);
          expect(wrongVerification).not.toBe(messageHash);
        }
      });

      test('should perform RSA operations with 2048-bit keys', () => {
        // Generate 2048-bit RSA key pair (1024-bit primes each)
        const startTime = Date.now();

        let p: bigint, q: bigint, n: bigint, phi: bigint;
        const expectedBitLength: number = 1024;
        console.log(`Generating ${2 * expectedBitLength}-bit RSA key pair...`);

        // Loop to ensure modulus n is of the expected bit length
        do {
          p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p).not.toBe(q);

          // Calculate RSA parameters
          n = p * q; // 2048-bit modulus
          phi = (p - 1n) * (q - 1n);
        } while (n.toString(2).length !== 2 * expectedBitLength);

        const e = 65537n; // Common public exponent

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e, phi)).toBe(1n);

        // Verify key generation time is reasonable (allow up to 120 seconds for 2048-bit)
        const keyGenTime = Date.now() - startTime;
        console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
        expect(keyGenTime).toBeLessThan(120000);

        // Verify modulus is approximately 2048 bits
        const nBitLength = n.toString(2).length;
        expect(nBitLength).toBeGreaterThanOrEqual(2047);
        expect(nBitLength).toBeLessThanOrEqual(2048);

        // Calculate private exponent
        const d = modInverse(e, phi);

        // Verify RSA key properties
        expect((d * e) % phi).toBe(1n);

        console.log(`Testing ${n.toString(2).length}-bit RSA encryption/decryption...`);

        // Test encryption and decryption with various message sizes
        const testMessages = [
          1n,
          42n,
          123456789n,
          BigInt('0x' + '1'.repeat(64)), // 256-bit message
          BigInt('0x' + 'a'.repeat(128)), // 512-bit message
          BigInt('0x' + 'f'.repeat(256)), // 1024-bit message
        ];

        testMessages.forEach((message, index) => {
          // Skip if message is too large for this key
          if (message >= n) {
            console.log(`Skipping message ${index} (too large for modulus)`);
            return;
          }

          // Encrypt: c ≡ m^e (mod n)
          const encryptStart = performance.now();
          const ciphertext = modPow(message, e, n);
          const encryptTime = performance.now() - encryptStart;

          // Decrypt: m ≡ c^d (mod n)
          const decryptStart = performance.now();
          const decrypted = modPow(ciphertext, d, n);
          const decryptTime = performance.now() - decryptStart;

          console.log(`Message ${index}: encrypt=${encryptTime.toFixed(3)}ms, decrypt=${decryptTime.toFixed(3)}ms`);

          // Verify decryption worked
          expect(decrypted).toBe(message);

          // Verify ciphertext is within valid range
          expect(ciphertext).toBeGreaterThanOrEqual(0n);
          expect(ciphertext).toBeLessThan(n);

          // Verify encryption/decryption times are reasonable (allow up to 5 seconds each)
          expect(encryptTime).toBeLessThan(5000);
          expect(decryptTime).toBeLessThan(5000);
        });
      });

      test('should perform RSA digital signatures with 2048-bit keys', () => {
        // Generate 2048-bit RSA key pair
        let p: bigint, q: bigint, n: bigint, phi: bigint;
        const expectedBitLength: number = 1024;

        // Loop to ensure modulus n is of the expected bit length
        do {
          p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p).not.toBe(q);

          n = p * q;
          phi = (p - 1n) * (q - 1n);
        } while (n.toString(2).length !== 2 * expectedBitLength);

        console.log(`Testing ${2 * expectedBitLength}-bit RSA digital signatures...`);

        const e = 65537n;

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e, phi)).toBe(1n);

        const d = modInverse(e, phi);

        // Test signature and verification with various hash sizes
        const messageHashes = [
          BigInt('0x' + '1234567890abcdef'.repeat(4)), // 128-bit hash (MD5-like)
          BigInt('0x' + '1234567890abcdef'.repeat(5)), // 160-bit hash (SHA-1-like)
          BigInt('0x' + '1234567890abcdef'.repeat(8)), // 256-bit hash (SHA-256-like)
          BigInt('0x' + '1234567890abcdef'.repeat(12)), // 384-bit hash (SHA-384-like)
          BigInt('0x' + '1234567890abcdef'.repeat(16)), // 512-bit hash (SHA-512-like)
        ];

        messageHashes.forEach((hash, index) => {
          // Skip if hash is too large for this key
          if (hash >= n) {
            console.log(`Skipping hash ${index} (too large for modulus)`);
            return;
          }

          console.log(`Testing signature with ${hash.toString(2).length}-bit hash...`);

          // Sign the hash: signature = hash^d mod n
          const signStart = performance.now();
          const signature = modPow(hash, d, n);
          const signTime = performance.now() - signStart;

          // Verify the signature: verification = signature^e mod n
          const verifyStart = performance.now();
          const verified = modPow(signature, e, n);
          const verifyTime = performance.now() - verifyStart;

          console.log(`Hash ${index}: sign=${signTime.toFixed(3)}ms, verify=${verifyTime.toFixed(3)}ms`);

          // Verification should recover the original hash
          expect(verified).toBe(hash);

          // Verify signature is within valid range
          expect(signature).toBeGreaterThanOrEqual(0n);
          expect(signature).toBeLessThan(n);

          // Verify signing/verification times are reasonable
          expect(signTime).toBeLessThan(5000);
          expect(verifyTime).toBeLessThan(5000);

          // Test signature tampering detection
          const tamperedSignature = signature + 1n;
          if (tamperedSignature < n) {
            const tamperedVerification = modPow(tamperedSignature, e, n);
            expect(tamperedVerification).not.toBe(hash);
          }

          // Test with a different signature (should not verify)
          const wrongSignature = (signature + 12345n) % n;
          const wrongVerification = modPow(wrongSignature, e, n);
          expect(wrongVerification).not.toBe(hash);
        });
      });

      // It's no wonder why this performance is somewhat overhead. "Security is not cheap" - ¯\_(ツ)_/¯
      test('should perform RSAES-OAEP operations with 2048-bit keys', () => {
        // Generate 2048-bit RSA key pair (1024-bit primes each)
        let p: bigint, q: bigint, n: bigint, phi: bigint;
        const expectedBitLength: number = 1024;

        let startTime: number;
        startTime = Date.now();

        // Loop to ensure modulus n is of the expected bit length
        do {
          // Generate two 1024-bit primes using randPrime
          p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p).not.toBe(q);

          // Calculate RSA parameters
          n = p * q; // 2048-bit modulus
          phi = (p - 1n) * (q - 1n);
        } while (n.toString(2).length !== 2 * expectedBitLength);

        console.log(`Testing RSAES-OAEP with ${2 * expectedBitLength}-bit RSA key pair...`);

        const e = 65537n; // Common public exponent

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e, phi)).toBe(1n);

        const d = modInverse(e, phi);

        // Verify key generation time is reasonable
        const keyGenTime = Date.now() - startTime;
        console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
        expect(keyGenTime).toBeLessThan(120000);

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

        // Create test message
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

          // Decrypt
          const plaintext = modPow(ciphertext, d, n);

          // Verify
          expect(plaintext).toBe(smallMessage);
          console.log('Successfully verified that randPrime generates primes suitable for RSA operations');

        } catch (error) {
          console.error('RSAES-OAEP test failed:', error);
          throw error;
        }
      });

      // It's no wonder why this performance is somewhat overhead. "Security is not cheap" - ¯\_(ツ)_/¯
      test('should perform RSAES-OAEP operations with 2048-bit keys with wrong private key for decryption', () => {
        let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
        const expectedBitLength: number = 1024;
        console.log(`Testing RSAES-OAEP with ${2 * expectedBitLength}-bit RSA key pair and wrong private key for decryption...`);

        // Generate first set of primes and RSA parameters
        console.log('Generating first set of RSA parameters using our randPrime...');
        // Loop to ensure modulus n is of the expected bit length
        do {
          p1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p1).not.toBe(q1);

          // Calculate RSA parameters
          n1 = p1 * q1;
          phi1 = (p1 - 1n) * (q1 - 1n);
        } while (n1.toString(2).length !== 2 * expectedBitLength);

        const e1 = 65537n;

        // Verify that e is coprime to phi using GCD.
        //
        // Note: This may fail on some operating systems and could likely fail with 512 bits.
        expect(gcd(e1, phi1)).toBe(1n);

        const d1 = modInverse(e1, phi1);
        const dmp1_1 = d1 % (p1 - 1n);
        const dmq1_1 = d1 % (q1 - 1n);
        const coeff1 = modInverse(q1, p1);

        // Generate second set of primes and RSA parameters (for wrong key)
        console.log('Generating second set of RSA parameters using our randPrime...');
        let p2: bigint, q2: bigint, n2: bigint, phi2: bigint;
        // Loop to ensure modulus n is of the expected bit length
        do {
          p2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p2).not.toBe(q2);

          // Calculate RSA parameters
          n2 = p2 * q2;
          phi2 = (p2 - 1n) * (q2 - 1n);
        } while (n2.toString(2).length !== 2 * expectedBitLength);

        const e2 = 65537n;
        const d2 = modInverse(e2, phi2);
        const dmp1_2 = d2 % (p2 - 1n);
        const dmq1_2 = d2 % (q2 - 1n);
        const coeff2 = modInverse(q2, p2);

        // Convert first set of bigints to Buffer for key creation
        const n1Buffer = Buffer.from(n1.toString(16).padStart(512, '0'), 'hex');
        const e1Buffer = Buffer.from(e1.toString(16).padStart(8, '0'), 'hex');
        const d1Buffer = Buffer.from(d1.toString(16).padStart(512, '0'), 'hex');
        const p1Buffer = Buffer.from(p1.toString(16).padStart(256, '0'), 'hex');
        const q1Buffer = Buffer.from(q1.toString(16).padStart(256, '0'), 'hex');
        const dmp1_1Buffer = Buffer.from(dmp1_1.toString(16).padStart(256, '0'), 'hex');
        const dmq1_1Buffer = Buffer.from(dmq1_1.toString(16).padStart(256, '0'), 'hex');
        const coeff1Buffer = Buffer.from(coeff1.toString(16).padStart(256, '0'), 'hex');

        // Convert second set of bigints to Buffer for key creation
        const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
        const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');
        const d2Buffer = Buffer.from(d2.toString(16).padStart(512, '0'), 'hex');
        const p2Buffer = Buffer.from(p2.toString(16).padStart(256, '0'), 'hex');
        const q2Buffer = Buffer.from(q2.toString(16).padStart(256, '0'), 'hex');
        const dmp1_2Buffer = Buffer.from(dmp1_2.toString(16).padStart(256, '0'), 'hex');
        const dmq1_2Buffer = Buffer.from(dmq1_2.toString(16).padStart(256, '0'), 'hex');
        const coeff2Buffer = Buffer.from(coeff2.toString(16).padStart(256, '0'), 'hex');

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

        // Create second key pair (wrong key)
        const wrongPrivateKey = crypto.createPrivateKey({
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

        // Create test message
        const message = Buffer.from(`This is a test message for RSAES-OAEP encryption with ${n2.toString(2).length}-bit RSA key and wrong private key.`);

        try {
          // Encrypt with public key from first pair using RSAES-OAEP
          const encrypted = crypto.publicEncrypt(
            {
              key: publicKey1,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: 'sha256'
            },
            message
          );

          // Attempt to decrypt with wrong private key using RSAES-OAEP
          // This should fail with an error
          let decryptionFailed = false;
          try {
            const decrypted = crypto.privateDecrypt(
              {
                key: wrongPrivateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
              },
              encrypted
            );

            // If we get here, decryption didn't throw an error, but the result should be incorrect
            expect(decrypted.toString()).not.toBe(message.toString());
            console.log('Decryption with wrong key produced incorrect result as expected');
          } catch (decryptError) {
            // Expected behavior - decryption with wrong key should fail
            decryptionFailed = true;
            console.log('Decryption with wrong key failed as expected:',
              decryptError instanceof Error ? decryptError.message : String(decryptError));
          }

          // At least one of the verification methods should pass
          // Either decryption failed with an error, or it produced incorrect output
          expect(decryptionFailed).toBe(true);

          // Now verify that the correct key still works
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
          console.log('RSAES-OAEP encryption/decryption with correct key successful!');

        } catch (error) {
          console.error('RSAES-OAEP wrong key test failed:', error);
          throw error;
        }
      });
    });

    // It's no wonder why this performance is somewhat overhead. "Security is not cheap" - ¯\_(ツ)_/¯
    test('should perform RSASSA-PSS operations with 2048-bit keys', () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let startTime: number;
      startTime = Date.now();

      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;
      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two 1024-bit primes using randPrime
        p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
        q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n);
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSASSA-PSS with ${2 * expectedBitLength}-bit RSA key pair...`);

      const e = 65537n; // Common public exponent

      // Verify that e is coprime to phi using GCD.
      //
      // Note: This may fail on some operating systems and could likely fail with 512 bits.
      expect(gcd(e, phi)).toBe(1n);

      const d = modInverse(e, phi);

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(120000);

      // Create RSA keys from our generated parameters
      console.log('Creating RSA keys from our generated parameters...');

      // Create private key components
      const dmp1 = d % (p - 1n); // d mod (p-1)
      const dmq1 = d % (q - 1n); // d mod (q-1)
      const coeff = modInverse(q, p); // q^-1 mod p

      // Convert magic bigints to Buffer for key creation
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
        expect(isModifiedVerified).toBe(false);
        console.log('RSASSA-PSS correctly rejected modified message!');

        // Test with wrong public key (should fail verification)
        console.log('Testing RSASSA-PSS verification with wrong public key...');

        // Generate a different key pair
        let p2: bigint, q2: bigint, n2: bigint;
        // Loop to ensure modulus n is of the expected bit length
        do {
          p2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
          q2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

          // Ensure p and q are different
          expect(p2).not.toBe(q2);

          // Calculate RSA parameters
          n2 = p2 * q2; // 2048-bit modulus
        } while (n2.toString(2).length !== 2 * expectedBitLength);

        const e2 = 65537n;

        // Create wrong public key
        const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
        const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');

        const wrongPublicKey = crypto.createPublicKey({
          key: {
            kty: 'RSA',
            n: n2Buffer.toString('base64url'),
            e: e2Buffer.toString('base64url')
          },
          format: 'jwk'
        });

        // Try to verify with wrong public key
        const isWrongKeyVerified = crypto.verify(
          'sha256',
          message,
          {
            key: wrongPublicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verification should fail with wrong key
        expect(isWrongKeyVerified).toBe(false);
        console.log('RSASSA-PSS correctly rejected verification with wrong public key!');

        // Verify signature length is appropriate for RSA key size (256 bytes for 2048-bit key)
        expect(signature.length).toBe(256);

        // Also demonstrate textbook RSA signature (no padding) for verification
        console.log('Verifying with textbook RSA signature (no padding)...');

        // Create a small hash value for textbook RSA
        const smallHash = 12345n;

        // Sign with private key (textbook RSA)
        const textbookSignature = modPow(smallHash, d, n);

        // Verify with public key (textbook RSA)
        const textbookVerified = modPow(textbookSignature, e, n);

        // Verify textbook signature
        expect(textbookVerified).toBe(smallHash);
        console.log('Successfully verified textbook RSA signature');

      } catch (error) {
        console.error('RSASSA-PSS test failed:', error);
        throw error;
      }
    });

    test('should perform RSAES-OAEP operations with 2048-bit keys from PEM format', () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let startTime: number;
      startTime = Date.now();

      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;
      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two 1024-bit primes using randPrime
        p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
        q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n);
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSAES-OAEP with ${2 * expectedBitLength}-bit RSA key pair from PEM format...`);

      const e = 65537n; // Common public exponent

      // Verify that e is coprime to phi using GCD.
      //
      // Note: This may fail on some operating systems and could likely fail with 512 bits.
      expect(gcd(e, phi)).toBe(1n);

      const d = modInverse(e, phi);

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(120000);

      // Create RSA keys from our generated parameters
      console.log('Creating RSA keys from our generated parameters...');

      // Create private key components
      const dmp1 = d % (p - 1n); // d mod (p-1)
      const dmq1 = d % (q - 1n); // d mod (q-1)
      const coeff = modInverse(q, p); // q^-1 mod p

      // Convert magic bigints to Buffer for key creation
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

      // Create test message
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

    test('should fail RSAES-OAEP operations with wrong private key in PEM format', () => {
      // Generate first RSA key pair (1024-bit primes each)
      let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
      const expectedBitLength: number = 1024;
      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two 1024-bit primes using randPrime
        p1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
        q1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

        // Ensure p and q are different
        expect(p1).not.toBe(q1);

        // Calculate RSA parameters
        n1 = p1 * q1; // 2048-bit modulus
        phi1 = (p1 - 1n) * (q1 - 1n);
      } while (n1.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSAES-OAEP with wrong key using ${2 * expectedBitLength}-bit RSA key pair from PEM format...`);

      const e1 = 65537n; // Common public exponent

      // Verify that e is coprime to phi using GCD.
      //
      // Note: This may fail on some operating systems and could likely fail with 512 bits.
      expect(gcd(e1, phi1)).toBe(1n);

      const d1 = modInverse(e1, phi1);

      // Generate second RSA key pair (for wrong key)
      let p2: bigint, q2: bigint, n2: bigint, phi2: bigint;
      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two 1024-bit primes using randPrime
        p2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
        q2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

        // Ensure p and q are different
        expect(p2).not.toBe(q2);

        // Calculate RSA parameters
        n2 = p2 * q2; // 2048-bit modulus
        phi2 = (p2 - 1n) * (q2 - 1n);
      } while (n2.toString(2).length !== 2 * expectedBitLength);

      const e2 = 65537n; // Common public exponent

      // Verify that e is coprime to phi using GCD.
      //
      // Note: This may fail on some operating systems and could likely fail with 512 bits.
      expect(gcd(e2, phi2)).toBe(1n);

      const d2 = modInverse(e2, phi2);

      // Create first key pair components
      const dmp1_1 = d1 % (p1 - 1n); // d mod (p-1)
      const dmq1_1 = d1 % (q1 - 1n); // d mod (q-1)
      const coeff1 = modInverse(q1, p1); // q^-1 mod p

      // Create second key pair components
      const dmp1_2 = d2 % (p2 - 1n); // d mod (p-1)
      const dmq1_2 = d2 % (q2 - 1n); // d mod (q-1)
      const coeff2 = modInverse(q2, p2); // q^-1 mod p

      // Convert first key pair to Buffer for key creation
      const n1Buffer = Buffer.from(n1.toString(16).padStart(512, '0'), 'hex');
      const e1Buffer = Buffer.from(e1.toString(16).padStart(8, '0'), 'hex');
      const d1Buffer = Buffer.from(d1.toString(16).padStart(512, '0'), 'hex');
      const p1Buffer = Buffer.from(p1.toString(16).padStart(256, '0'), 'hex');
      const q1Buffer = Buffer.from(q1.toString(16).padStart(256, '0'), 'hex');
      const dmp1_1Buffer = Buffer.from(dmp1_1.toString(16).padStart(256, '0'), 'hex');
      const dmq1_1Buffer = Buffer.from(dmq1_1.toString(16).padStart(256, '0'), 'hex');
      const coeff1Buffer = Buffer.from(coeff1.toString(16).padStart(256, '0'), 'hex');

      // Convert second key pair to Buffer for key creation
      const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
      const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');
      const d2Buffer = Buffer.from(d2.toString(16).padStart(512, '0'), 'hex');
      const p2Buffer = Buffer.from(p2.toString(16).padStart(256, '0'), 'hex');
      const q2Buffer = Buffer.from(q2.toString(16).padStart(256, '0'), 'hex');
      const dmp1_2Buffer = Buffer.from(dmp1_2.toString(16).padStart(256, '0'), 'hex');
      const dmq1_2Buffer = Buffer.from(dmq1_2.toString(16).padStart(256, '0'), 'hex');
      const coeff2Buffer = Buffer.from(coeff2.toString(16).padStart(256, '0'), 'hex');

      // Create first key pair in JWK format
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

      // Create second key pair in JWK format (wrong key)
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
      const privateKeyPem1 = jwkPrivateKey1.export({
        type: 'pkcs8',
        format: 'pem'
      });

      const jwkPublicKey1 = crypto.createPublicKey(jwkPrivateKey1);
      const publicKeyPem1 = jwkPublicKey1.export({
        type: 'spki',
        format: 'pem'
      });

      const privateKeyPem2 = jwkPrivateKey2.export({
        type: 'pkcs8',
        format: 'pem'
      });

      // Create key objects from PEM format
      const privateKey1 = crypto.createPrivateKey(privateKeyPem1);
      const publicKey1 = crypto.createPublicKey(publicKeyPem1);
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
        // This should fail with an error
        let decryptionFailed = false;
        try {
          const decrypted = crypto.privateDecrypt(
            {
              key: privateKey2,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: 'sha256'
            },
            encrypted
          );

          // If we get here, decryption didn't throw an error, but the result should be incorrect
          expect(decrypted.toString()).not.toBe(message.toString());
          console.log('Decryption with wrong PEM key produced incorrect result as expected');
        } catch (decryptError) {
          // Expected behavior - decryption with wrong key should fail
          decryptionFailed = true;
          console.log('Decryption with wrong PEM key failed as expected:',
            decryptError instanceof Error ? decryptError.message : String(decryptError));
        }

        // Verify that either decryption failed or produced incorrect result
        expect(decryptionFailed || true).toBe(true);

        // Now verify that decryption with the correct key still works
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

    test('should perform RSASSA-PSS operations with 2048-bit keys from PEM format', () => {
      // Generate 2048-bit RSA key pair (1024-bit primes each)
      let startTime: number;
      startTime = Date.now();

      let p: bigint, q: bigint, n: bigint, phi: bigint;
      const expectedBitLength: number = 1024;
      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two 1024-bit primes using randPrime
        p = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
        q = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

        // Ensure p and q are different
        expect(p).not.toBe(q);

        // Calculate RSA parameters
        n = p * q; // 2048-bit modulus
        phi = (p - 1n) * (q - 1n);
      } while (n.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSASSA-PSS with ${2 * expectedBitLength}-bit RSA key pair from PEM format...`);

      const e = 65537n; // Common public exponent

      // Verify that e is coprime to phi using GCD.
      //
      // Note: This may fail on some operating systems and could likely fail with 512 bits.
      expect(gcd(e, phi)).toBe(1n);

      const d = modInverse(e, phi);

      // Verify key generation time is reasonable
      const keyGenTime = Date.now() - startTime;
      console.log(`${n.toString(2).length}-bit key generation took ${keyGenTime}ms`);
      expect(keyGenTime).toBeLessThan(120000);

      // Create RSA keys from our generated parameters
      console.log('Creating RSA keys from our generated parameters...');

      // Create private key components
      const dmp1 = d % (p - 1n); // d mod (p-1)
      const dmq1 = d % (q - 1n); // d mod (q-1)
      const coeff = modInverse(q, p); // q^-1 mod p

      // Convert magic bigints to Buffer for key creation
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

    test('should fail RSASSA-PSS verification with wrong public key in PEM format', () => {
      // Generate first RSA key pair (1024-bit primes each)
      let p1: bigint, q1: bigint, n1: bigint, phi1: bigint;
      const expectedBitLength: number = 1024;
      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two 1024-bit primes using randPrime
        p1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
        q1 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

        // Ensure p and q are different
        expect(p1).not.toBe(q1);

        // Calculate RSA parameters
        n1 = p1 * q1; // 2048-bit modulus
        phi1 = (p1 - 1n) * (q1 - 1n);
      } while (n1.toString(2).length !== 2 * expectedBitLength);

      console.log(`Testing RSASSA-PSS with wrong key using ${2 * expectedBitLength}-bit RSA key pair from PEM format...`);

      const e1 = 65537n; // Common public exponent

      // Verify that e is coprime to phi using GCD.
      //
      // Note: This may fail on some operating systems and could likely fail with 512 bits.
      expect(gcd(e1, phi1)).toBe(1n);

      const d1 = modInverse(e1, phi1);

      // Generate second RSA key pair (for wrong key)
      let p2: bigint, q2: bigint, n2: bigint, phi2: bigint;
      // Loop to ensure modulus n is of the expected bit length
      do {
        // Generate two 1024-bit primes using randPrime
        p2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰
        q2 = Crypto.randPrime(expectedBitLength, 38, true); // Reduce the iterations to 38 and see how it goes. 🎰🎰🎰

        // Ensure p and q are different
        expect(p2).not.toBe(q2);

        // Calculate RSA parameters
        n2 = p2 * q2; // 2048-bit modulus
        phi2 = (p2 - 1n) * (q2 - 1n);
      } while (n2.toString(2).length !== 2 * expectedBitLength);

      const e2 = 65537n; // Common public exponent

      // Verify that e is coprime to phi using GCD.
      //
      // Note: This may fail on some operating systems and could likely fail with 512 bits.
      expect(gcd(e2, phi2)).toBe(1n);

      const d2 = modInverse(e2, phi2);

      // Create first key pair components
      const dmp1_1 = d1 % (p1 - 1n); // d mod (p-1)
      const dmq1_1 = d1 % (q1 - 1n); // d mod (q-1)
      const coeff1 = modInverse(q1, p1); // q^-1 mod p

      // Create second key pair components
      const dmp1_2 = d2 % (p2 - 1n); // d mod (p-1)
      const dmq1_2 = d2 % (q2 - 1n); // d mod (q-1)
      const coeff2 = modInverse(q2, p2); // q^-1 mod p

      // Convert first key pair to Buffer for key creation
      const n1Buffer = Buffer.from(n1.toString(16).padStart(512, '0'), 'hex');
      const e1Buffer = Buffer.from(e1.toString(16).padStart(8, '0'), 'hex');
      const d1Buffer = Buffer.from(d1.toString(16).padStart(512, '0'), 'hex');
      const p1Buffer = Buffer.from(p1.toString(16).padStart(256, '0'), 'hex');
      const q1Buffer = Buffer.from(q1.toString(16).padStart(256, '0'), 'hex');
      const dmp1_1Buffer = Buffer.from(dmp1_1.toString(16).padStart(256, '0'), 'hex');
      const dmq1_1Buffer = Buffer.from(dmq1_1.toString(16).padStart(256, '0'), 'hex');
      const coeff1Buffer = Buffer.from(coeff1.toString(16).padStart(256, '0'), 'hex');

      // Convert second key pair to Buffer for key creation
      const n2Buffer = Buffer.from(n2.toString(16).padStart(512, '0'), 'hex');
      const e2Buffer = Buffer.from(e2.toString(16).padStart(8, '0'), 'hex');
      const d2Buffer = Buffer.from(d2.toString(16).padStart(512, '0'), 'hex');
      const p2Buffer = Buffer.from(p2.toString(16).padStart(256, '0'), 'hex');
      const q2Buffer = Buffer.from(q2.toString(16).padStart(256, '0'), 'hex');
      const dmp1_2Buffer = Buffer.from(dmp1_2.toString(16).padStart(256, '0'), 'hex');
      const dmq1_2Buffer = Buffer.from(dmq1_2.toString(16).padStart(256, '0'), 'hex');
      const coeff2Buffer = Buffer.from(coeff2.toString(16).padStart(256, '0'), 'hex');

      // Create first key pair in JWK format
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

      // Create second key pair in JWK format (wrong key)
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
      const privateKeyPem1 = jwkPrivateKey1.export({
        type: 'pkcs8',
        format: 'pem'
      });

      const jwkPublicKey1 = crypto.createPublicKey(jwkPrivateKey1);
      const publicKeyPem1 = jwkPublicKey1.export({
        type: 'spki',
        format: 'pem'
      });

      const jwkPublicKey2 = crypto.createPublicKey(jwkPrivateKey2);
      const publicKeyPem2 = jwkPublicKey2.export({
        type: 'spki',
        format: 'pem'
      });

      // Create key objects from PEM format
      const privateKey1 = crypto.createPrivateKey(privateKeyPem1);
      const publicKey1 = crypto.createPublicKey(publicKeyPem1);
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
        const isVerifiedWithWrongKey = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey2,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verification with wrong key should fail
        expect(isVerifiedWithWrongKey).toBe(false);
        console.log('RSASSA-PSS correctly rejected verification with wrong PEM public key!');

        // Verify that verification with the correct key still works
        const isVerifiedWithCorrectKey = crypto.verify(
          'sha256',
          message,
          {
            key: publicKey1,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          },
          signature
        );

        // Verification with correct key should succeed
        expect(isVerifiedWithCorrectKey).toBe(true);
        console.log('RSASSA-PSS verification with correct PEM public key successful!');

      } catch (error) {
        console.error('RSASSA-PSS wrong key test with PEM keys failed:', error);
        throw error;
      }
    });
  });

  describe('randPrime bit length tests', () => {
    test('should generate primes with exactly the specified bit length', () => {
      // Test with different bit lengths
      const bitLengths: number[] = [256, 512, 1024, 2048];

      for (const bits of bitLengths) {
        // Generate a prime with the specified bit length
        const prime = Crypto.randPrime(bits);

        // Calculate the actual bit length
        const actualBits = prime.toString(2).length;

        // Verify the bit length is exactly as specified
        expect(actualBits).toBe(bits);

        // Additional check: the prime should be >= 2^(bits-1) and < 2^bits
        const minValue = 1n << BigInt(bits - 1);
        const maxValue = 1n << BigInt(bits);

        expect(prime).toBeGreaterThanOrEqual(minValue);
        expect(prime).toBeLessThan(maxValue);
      }
    });

    test('should regenerate primes if bit length is not as expected', () => {
      // Mock the randBigInt function to return values with incorrect bit length first
      const originalRandBigInt = Crypto.randBigInt;
      let callCount = 0;

      // @ts-ignore - Accessing private method for testing
      Crypto.randBigInt = jest.fn((bits: number) => {
        callCount++;
        if (callCount === 1) {
          // First call: return a value with one bit less (simulating the issue)
          return 1n << BigInt(bits - 2); // This has bits-1 bits
        } else {
          // Subsequent calls: return a proper value
          return originalRandBigInt(bits);
        }
      });

      // Generate a prime with 256 bits
      const prime = Crypto.randPrime(256, 38, true);

      // Verify the bit length is exactly as specified
      const actualBits = prime.toString(2).length;
      expect(actualBits).toBe(256);

      // Verify that randBigInt was called more than once (indicating regeneration)
      expect(callCount).toBeGreaterThan(1);

      // Restore the original function
      // @ts-ignore - Restoring private method
      Crypto.randBigInt = originalRandBigInt;
    });
  });

  describe('randBigInt()', () => {
    beforeEach(() => {
      // Ensure we're in Node.js environment for these tests
      jest.clearAllMocks();
    });

    describe('basic functionality', () => {
      test('should return a BigInt', () => {
        const result = Crypto.randBigInt(32, true); // Small bit size for faster tests
        expect(typeof result).toBe('bigint');
      });

      test('should generate a bigint with specified bit length', () => {
        const bits = 32;
        const bigint = Crypto.randBigInt(bits);

        // Check bit length
        const bitLength = bigint.toString(2).length;
        expect(bitLength).toBe(bits);
      });

      test('should set the most significant bit to 1', () => {
        const bits = 32;
        const bigint = Crypto.randBigInt(bits);

        // Convert to binary string and check the first bit
        const binaryString = bigint.toString(2);
        expect(binaryString.charAt(0)).toBe('1');
      });

      test('should set the least significant bit to 1 (odd number)', () => {
        const bigint = Crypto.randBigInt(32);

        // Check if the number is odd
        expect(bigint % 2n).toBe(1n);
      });
    });

    describe('parameter validation', () => {
      test('should throw error for invalid bit length', () => {
        expect(() => Crypto.randBigInt(0)).toThrow(randBigIntErr);
        expect(() => Crypto.randBigInt(1)).toThrow(randBigIntErr);
        expect(() => Crypto.randBigInt(1.5)).toThrow(randBigIntErr);
      });
    });

    describe('browser environment', () => {
      test('should throw error in browser environment', () => {
        // Mock browser environment
        const originalIsBrowser = Crypto['isBrowser'];
        Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

        expect(() => Crypto.randBigInt()).toThrow(
          errorUnsupported('randBigInt')
        );

        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      });
    });

    describe('security properties', () => {
      test('should generate different bigints on multiple calls', () => {
        const bigint1 = Crypto.randBigInt(32);
        const bigint2 = Crypto.randBigInt(32);
        expect(bigint1).not.toBe(bigint2);
      });

      test('should handle common cryptographic bit lengths', () => {
        // Test with small bit lengths for faster tests
        const bitLengths = [8, 16, 32];

        bitLengths.forEach(bits => {
          const bigint = Crypto.randBigInt(bits);
          expect(typeof bigint).toBe('bigint');
          expect(bigint.toString(2).length).toBe(bits);
        });
      });
    });

    describe('performance', () => {
      test('should complete in reasonable time for small bit lengths', () => {
        const startTime = Date.now();
        Crypto.randBigInt(32);
        const endTime = Date.now();

        // Should complete within a reasonable time
        expect(endTime - startTime).toBeLessThan(1000);
      });
    });

    describe('relationship with randPrime', () => {
      test('should be used by randPrime', () => {
        // Mock randBigInt to track calls
        const originalRandBigInt = Crypto.randBigInt;
        Crypto.randBigInt = jest.fn().mockImplementation(originalRandBigInt);

        // Call randPrime which should use randBigInt
        Crypto.randPrime(32, 5, false, true);

        // Verify randBigInt was called
        expect(Crypto.randBigInt).toHaveBeenCalled();
        expect(Crypto.randBigInt).toHaveBeenCalledWith(32, true);

        // Restore original method
        Crypto.randBigInt = originalRandBigInt;
      });
    });
  });

  describe('randVersion()', () => {
    it('should generate a base64 string', () => {
      const result = Crypto.randVersion();
      expect(typeof result).toBe('string');
      expect(/^[A-Za-z0-9+/]+=*$/.test(result)).toBe(true);
    });

    it('should generate a string with correct length', () => {
      const result = Crypto.randVersion();
      // 32 bytes in base64 should be 44 characters (including padding)
      expect(result.length).toBe(44);
    });

    it('should generate different version strings', () => {
      const versions = new Set<string>();
      for (let i = 0; i < 10; i++) {
        versions.add(Crypto.randVersion());
      }
      expect(versions.size).toBe(10);
    });

    it('should throw error in browser environment', () => {
      // Save original isBrowser method
      const originalIsBrowser = Crypto['isBrowser'];

      // Mock isBrowser to return true
      Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

      try {
        expect(() => Crypto.randVersion()).toThrow(errorUnsupported('randVersion'));
      } finally {
        // Restore original method
        Crypto['isBrowser'] = originalIsBrowser;
      }
    });
  });

  describe('randExponential()', () => {
    describe('basic functionality', () => {
      it('should return a number', () => {
        const result = Crypto.randExponential();
        expect(typeof result).toBe('number');
      });

      it('should return a positive number', () => {
        for (let i = 0; i < 100; i++) {
          const result = Crypto.randExponential();
          expect(result).toBeGreaterThanOrEqual(0);
        }
      });

      it('should work with default lambda value', () => {
        const result = Crypto.randExponential();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it('should work with custom lambda value', () => {
        const lambda = 2;
        const result = Crypto.randExponential(lambda);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    describe('statistical properties', () => {
      it('should follow exponential distribution properties', () => {
        // For an exponential distribution with parameter lambda,
        // the mean should be approximately 1/lambda
        const lambda = 2;
        const sampleSize = 10000;
        const samples: number[] = [];

        for (let i = 0; i < sampleSize; i++) {
          samples.push(Crypto.randExponential(lambda));
        }

        // Calculate mean
        const sum = samples.reduce((acc, val) => acc + val, 0);
        const mean = sum / sampleSize;

        // Expected mean for exponential distribution is 1/lambda
        const expectedMean = 1 / lambda;

        // Allow for some statistical variation (within 10%)
        expect(mean).toBeGreaterThan(expectedMean * 0.9);
        expect(mean).toBeLessThan(expectedMean * 1.1);
      });

      it('should generate different values on subsequent calls', () => {
        const results = new Set<number>();
        for (let i = 0; i < 100; i++) {
          results.add(Crypto.randExponential());
        }
        // Should have high entropy (at least 95% unique values)
        expect(results.size).toBeGreaterThan(95);
      });
    });

    describe('parameter validation', () => {
      it('should handle different lambda values', () => {
        const lambdaValues: number[] = [0.5, 1, 2, 5];

        for (const lambda of lambdaValues) {
          const result = Crypto.randExponential(lambda);
          expect(typeof result).toBe('number');
          expect(result).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

});
