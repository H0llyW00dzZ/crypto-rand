
import { Crypto } from '../../src/rand';

// Setup browser environment mocks
const mockGetRandomValues = jest.fn((array) => {
  // Mock implementation that fills array with random values
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

const mockRandomUUID = jest.fn(() => '550e8400-e29b-41d4-a716-446655440000');

// Mock the crypto module to return undefined (simulating browser environment)
jest.mock('crypto', () => undefined);

// Ensure window.crypto exists and is properly mocked
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
    randomUUID: mockRandomUUID
  },
  writable: true,
  configurable: true
});

describe('Crypto Browser Error Handling', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Ensure window.crypto is properly set up for each test
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: mockGetRandomValues,
        randomUUID: mockRandomUUID
      },
      writable: true,
      configurable: true
    });
  });

  describe('Node.js-only methods should throw errors in browser', () => {
    it('should throw error when calling randHex() in browser', () => {
      expect(() => Crypto.randHex(10))
        .toThrow('randHex is not available in browser environment. This method requires Node.js crypto module.');
    });

    it('should throw error when calling randBase64() in browser', () => {
      expect(() => Crypto.randBase64(10))
        .toThrow('randBase64 is not available in browser environment. This method requires Node.js crypto module.');
    });

    it('should throw error when calling randSeed() in browser', () => {
      expect(() => Crypto.randSeed())
        .toThrow('randSeed is not available in browser environment. This method requires Node.js crypto module.');
    });

    it('should throw error when calling randVersion() in browser', () => {
      expect(() => Crypto.randVersion())
        .toThrow('randVersion is not available in browser environment. This method requires Node.js crypto module.');
    });

    it('should throw error when calling randSeeded() with seed parameter in browser', () => {
      expect(() => Crypto.randSeeded(12345))
        .toThrow('randSeeded (with seed parameter) is not available in browser environment. This method requires Node.js crypto module.');
    });

    it('should NOT throw error when calling randSeeded() without seed parameter in browser', () => {
      expect(() => Crypto.randSeeded()).not.toThrow();
      const result = Crypto.randSeeded();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });
  });

  describe('Error message consistency', () => {
    it('should provide consistent error messages for all Node.js-only methods', () => {
      const expectedMethods = [
        { method: () => Crypto.randHex(10), name: 'randHex' },
        { method: () => Crypto.randBase64(10), name: 'randBase64' },
        { method: () => Crypto.randSeed(), name: 'randSeed' },
        { method: () => Crypto.randVersion(), name: 'randVersion' }
      ];

      expectedMethods.forEach(({ method, name }) => {
        try {
          method();
          fail(`Expected ${name} to throw an error`);
        } catch (error: any) {
          expect(error.message).toContain(`${name} is not available in browser environment`);
          expect(error.message).toContain('This method requires Node.js crypto module');
        }
      });
    });

    it('should provide specific error message for randSeeded with seed', () => {
      try {
        Crypto.randSeeded(42);
        fail('Expected randSeeded with seed to throw an error');
      } catch (error: any) {
        expect(error.message).toContain('randSeeded (with seed parameter) is not available in browser environment');
        expect(error.message).toContain('This method requires Node.js crypto module');
      }
    });
  });

  describe('Environment detection methods', () => {
    it('should correctly identify browser environment', () => {
      expect(Crypto.isFullySupported()).toBe(false);
    });

    it('should return list of unsupported methods in browser', () => {
      const unsupported = Crypto.getUnsupportedMethods();
      expect(unsupported).toContain('randHex');
      expect(unsupported).toContain('randBase64');
      expect(unsupported).toContain('randSeed');
      expect(unsupported).toContain('randVersion');
      expect(unsupported).toContain('randSeeded (with seed parameter)');
      expect(unsupported).toHaveLength(5);
    });

    it('should provide correct environment information', () => {
      const envInfo = Crypto.getEnvironmentInfo();
      
      expect(envInfo.isBrowser).toBe(true);
      expect(envInfo.hasWebCrypto).toBe(true);
      expect(envInfo.hasRandomUUID).toBe(true); // Our mock has randomUUID
      
      // Check supported methods don't include Node.js-only ones
      expect(envInfo.supportedMethods).not.toContain('randHex');
      expect(envInfo.supportedMethods).not.toContain('randBase64');
      expect(envInfo.supportedMethods).not.toContain('randSeed');
      expect(envInfo.supportedMethods).not.toContain('randVersion');
      
      // Check supported methods include browser-compatible ones
      expect(envInfo.supportedMethods).toContain('rand');
      expect(envInfo.supportedMethods).toContain('randInt');
      expect(envInfo.supportedMethods).toContain('randString');
      expect(envInfo.supportedMethods).toContain('randUUID');
      expect(envInfo.supportedMethods).toContain('randBytes');
      
      // Check unsupported methods
      expect(envInfo.unsupportedMethods).toEqual([
        'randHex',
        'randBase64',
        'randSeed',
        'randVersion',
        'randSeeded (with seed parameter)'
      ]);
    });
  });

  describe('Browser-compatible methods should work normally', () => {
    it('should work with rand() in browser', () => {
      const result = Crypto.rand();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
      expect(mockGetRandomValues).toHaveBeenCalled();
    });

    it('should work with randInt() in browser', () => {
      const result = Crypto.randInt(1, 10);
      expect(typeof result).toBe('number');
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThan(10);
    });

    it('should work with randString() in browser', () => {
      const result = Crypto.randString(10);
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(10);
    });

    it('should work with randBytes() in browser', () => {
      const result = Crypto.randBytes(16);
      expect(result instanceof Uint8Array).toBe(true);
      expect(result.length).toBe(16);
    });

    it('should work with randUUID() in browser', () => {
      const result = Crypto.randUUID();
      expect(typeof result).toBe('string');
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000'); // Our mock UUID
      expect(mockRandomUUID).toHaveBeenCalled();
    });

    it('should work with randBool() in browser', () => {
      const result = Crypto.randBool();
      expect(typeof result).toBe('boolean');
    });

    it('should work with randFloat() in browser', () => {
      const result = Crypto.randFloat(1, 2);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(2);
    });

    it('should work with array methods in browser', () => {
      const array = [1, 2, 3, 4, 5];
      
      // Test randChoice
      const choice = Crypto.randChoice(array);
      expect(array).toContain(choice);
      
      // Test shuffle
      const shuffled = Crypto.shuffle(array);
      expect(shuffled).toHaveLength(array.length);
      
      // Test randIndex
      const index = Crypto.randIndex(array);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(array.length);
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should handle case when Web Crypto API is not available', () => {
      // Store original crypto
      const originalCrypto = window.crypto;
      
      // Remove crypto completely
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(() => Crypto.rand())
        .toThrow('No secure random number generator available. Please use in Node.js environment or modern browser with Web Crypto API.');

      // Restore crypto
      Object.defineProperty(window, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });

    it('should handle case when getRandomValues is not available', () => {
      // Store original
      const originalCrypto = window.crypto;
      
      // Mock crypto without getRandomValues
      Object.defineProperty(window, 'crypto', {
        value: {},
        writable: true,
        configurable: true
      });

      expect(() => Crypto.rand())
        .toThrow('No secure random number generator available. Please use in Node.js environment or modern browser with Web Crypto API.');

      // Restore
      Object.defineProperty(window, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });

    it('should handle randBytes when Web Crypto API is not available', () => {
      const originalCrypto = window.crypto;
      
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(() => Crypto.randBytes(16))
        .toThrow('No secure random bytes generator available. Please use in Node.js environment or modern browser with Web Crypto API.');

      // Restore
      Object.defineProperty(window, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });

    it('should handle randUUID when crypto APIs are not available', () => {
      const originalCrypto = window.crypto;
      
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(() => Crypto.randUUID())
        .toThrow('UUID generation not available. Please use in Node.js environment or modern browser with Web Crypto API.');

      // Restore
      Object.defineProperty(window, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });

    it('should fallback to getRandomValues implementation for UUID when randomUUID is not available', () => {
      // Mock crypto with getRandomValues but without randomUUID
      const mockGetRandomValuesForUUID = jest.fn((array) => {
        // Create a deterministic pattern for UUID testing
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      });

      Object.defineProperty(window, 'crypto', {
        value: {
          getRandomValues: mockGetRandomValuesForUUID
        },
        writable: true,
        configurable: true
      });

      const result = Crypto.randUUID();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockGetRandomValuesForUUID).toHaveBeenCalled();

      // Restore original
      Object.defineProperty(window, 'crypto', {
        value: {
          getRandomValues: mockGetRandomValues,
          randomUUID: mockRandomUUID
        },
        writable: true,
        configurable: true
      });
    });
  });

  describe('Class method context preservation', () => {
    it('should maintain proper context when calling static methods', () => {
      // Test that all static methods work when called via the class
      expect(typeof Crypto.rand).toBe('function');
      expect(typeof Crypto.randInt).toBe('function');
      expect(typeof Crypto.randString).toBe('function');
      expect(typeof Crypto.randUUID).toBe('function');
      
      // Test that browser detection works properly
      expect(() => Crypto.randHex(10)).toThrow();
      expect(() => Crypto.randBase64(10)).toThrow();
      expect(() => Crypto.randSeed()).toThrow();
      expect(() => Crypto.randVersion()).toThrow();
    });

    it('should work with destructured class methods', () => {
      // Test that destructured methods still work (with bound context)
      const { rand, randInt, randString, randUUID } = Crypto;
      
      // These should work because they're browser-compatible
      expect(() => rand.call(Crypto)).not.toThrow();
      expect(() => randInt.call(Crypto, 1, 10)).not.toThrow();
      expect(() => randString.call(Crypto, 10)).not.toThrow();
      expect(() => randUUID.call(Crypto)).not.toThrow();
    });
  });
});
