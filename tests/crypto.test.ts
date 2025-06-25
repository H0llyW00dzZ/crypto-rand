
import { Crypto } from '../src/rand';
import { 
  DEFAULT_CHARSET, 
  HEX_CHARSET, 
  ALPHANUMERIC_CHARSET,
  NUMERIC_CHARSET,
  SPECIAL_CHARSET,
  FULL_CHARSET
} from '../src/const';

describe('Crypto Class', () => {
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
  });

  describe('randBase64()', () => {
    it('should generate base64 string of specified length', () => {
      const result = Crypto.randBase64(10);
      expect(result).toHaveLength(10);
      expect(/^[A-Za-z0-9+/]+$/.test(result)).toBe(true);
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

});
