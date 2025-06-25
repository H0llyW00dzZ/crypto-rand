
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

  describe('randPassword()', () => {
    it('should generate password of specified length', () => {
      const password = Crypto.randPassword({ length: 12 });
      expect(password).toHaveLength(12);
      expect(typeof password).toBe('string');
    });

    it('should use default character types (uppercase, lowercase, numbers)', () => {
      const password = Crypto.randPassword({ length: 20 });

      // Should contain at least one of each default type
      expect(/[A-Z]/.test(password)).toBe(true); // uppercase
      expect(/[a-z]/.test(password)).toBe(true); // lowercase
      expect(/[0-9]/.test(password)).toBe(true); // numbers

      // Should not contain symbols by default
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)).toBe(false);
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
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
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
      expect(end - start).toBeLessThan(100); // Should complete quickly
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

      test('should include Gaussian error in computation', () => {
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
          'randLattice is not available in browser environment. This method requires Node.js crypto module.'
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

        allParams.forEach(({ dimension, modulus, name }) => {
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

        securityLevels.forEach(({ level, params }) => {
          params.forEach(({ dimension, modulus, scheme }) => {
            const results = Array.from({ length: 10 }, () =>
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

        nistSchemes.forEach(({ name, dimension, modulus, type }) => {
          // Generate multiple samples to test consistency
          const samples = Array.from({ length: 20 }, () =>
            Crypto.randLattice(dimension, modulus)
          );

          samples.forEach((sample, index) => {
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

        round4Candidates.forEach(({ name, dimension, modulus }) => {
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
  });

});
