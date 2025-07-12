import { Crypto } from '../../src/rand';

// These tests specifically check the browser implementation
describe('Crypto in browser environment (detailed)', () => {
    // Test browser detection
    it('should detect browser environment', () => {
        expect(typeof window).not.toBe('undefined');
        expect(window.crypto).toBeDefined();
    });

    // Test core random generation
    describe('Core random functionality', () => {
        it('should generate random numbers using Web Crypto API', () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const value = Crypto.rand();
            expect(spy).toHaveBeenCalled();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
            spy.mockRestore();
        });

        it('should generate different random values', () => {
            const values = new Set<number>();
            for (let i = 0; i < 20; i++) {
                values.add(Crypto.rand());
            }
            expect(values.size).toBeGreaterThan(15); // High entropy
        });
    });

    // Test random bytes generation
    describe('Random bytes generation', () => {
        it('should use window.crypto.getRandomValues for bytes generation', () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const bytes = Crypto.randBytes(16);
            expect(spy).toHaveBeenCalled();
            expect(bytes.length).toBe(16);
            expect(bytes instanceof Uint8Array).toBe(true);
            spy.mockRestore();
        });

        it('should generate different byte sequences', () => {
            const bytesArrays: (Uint8Array | Buffer)[] = [];
            for (let i = 0; i < 5; i++) {
                bytesArrays.push(Crypto.randBytes(8));
            }

            // Check all arrays are different
            let allDifferent = true;
            for (let i = 0; i < bytesArrays.length; i++) {
                for (let j = i + 1; j < bytesArrays.length; j++) {
                    const array1 = bytesArrays[i] as Uint8Array;
                    const array2 = bytesArrays[j] as Uint8Array;

                    let identical = true;
                    for (let k = 0; k < 8; k++) {
                        if (array1[k] !== array2[k]) {
                            identical = false;
                            break;
                        }
                    }

                    if (identical) {
                        allDifferent = false;
                    }
                }
            }

            expect(allDifferent).toBe(true);
        });
    });

    // Test async random bytes generation
    describe('Async random bytes generation', () => {
        it('should use window.crypto.getRandomValues for async bytes generation', async () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const bytes = await Crypto.randBytesAsync(16);
            expect(spy).toHaveBeenCalled();
            expect(bytes.length).toBe(16);
            expect(bytes instanceof Uint8Array).toBe(true);
            spy.mockRestore();
        });
    });

    // Test UUID generation
    describe('UUID generation', () => {
        it('should use browser API for UUID generation when available', () => {
            // Modern browsers have randomUUID method
            if (typeof window.crypto.randomUUID === 'function') {
                const spy = jest.spyOn(window.crypto, 'randomUUID');
                const uuid = Crypto.randUUID();
                expect(spy).toHaveBeenCalled();
                expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
                spy.mockRestore();
            } else {
                // Older browsers use getRandomValues
                const spy = jest.spyOn(window.crypto, 'getRandomValues');
                const uuid = Crypto.randUUID();
                expect(spy).toHaveBeenCalled();
                expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
                spy.mockRestore();
            }
        });

        it('should generate RFC4122 version 4 compliant UUIDs', () => {
            const uuid = Crypto.randUUID();
            // Check version (should be 4)
            const versionChar = uuid.split('-')[2]![0];
            expect(versionChar).toBe('4');

            // Check variant (should be 8, 9, a, or b)
            const variantChar = uuid.split('-')[3]![0];
            expect(['8', '9', 'a', 'b']).toContain(variantChar!.toLowerCase());
        });
    });

    // Test string generation
    describe('String generation', () => {
        it('should generate strings using Web Crypto API for randomness', () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const str = Crypto.randString(16);
            expect(spy).toHaveBeenCalled();
            expect(str.length).toBe(16);
            spy.mockRestore();
        });
    });

    // Test array operations
    describe('Array operations', () => {
        it('should properly shuffle arrays using browser crypto', () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const shuffled = Crypto.shuffle(array);
            expect(spy).toHaveBeenCalled();

            // Check that the shuffled array has the same length
            expect(shuffled.length).toBe(array.length);

            // Check that shuffled array contains all the same elements
            // Create sorted copies to compare without mutating the original arrays
            const sortedShuffled = [...shuffled].sort((a, b) => a - b);
            const sortedOriginal = [...array].sort((a, b) => a - b);
            expect(sortedShuffled).toEqual(sortedOriginal);

            spy.mockRestore();
        });

        it('should select random array elements securely', () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const array = ['a', 'b', 'c', 'd', 'e'];
            const choice = Crypto.randChoice(array);
            expect(spy).toHaveBeenCalled();
            expect(array).toContain(choice);
            spy.mockRestore();
        });
    });

    // Test browser-specific behavior
    describe('Browser-specific behavior', () => {
        it('should use window.crypto.getRandomValues for randBool', () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const bool = Crypto.randBool();
            expect(spy).toHaveBeenCalled();
            expect(typeof bool).toBe('boolean');
            spy.mockRestore();
        });

        it('should use window.crypto.getRandomValues for randInt', () => {
            const spy = jest.spyOn(window.crypto, 'getRandomValues');
            const int = Crypto.randInt(1, 100);
            expect(spy).toHaveBeenCalled();
            expect(Number.isInteger(int)).toBe(true);
            expect(int).toBeGreaterThanOrEqual(1);
            expect(int).toBeLessThan(100);
            spy.mockRestore();
        });
    });

    // Test for potential bugs in browser environment
    describe('Edge cases', () => {
        it('should handle zero-length string generation', () => {
            const str = Crypto.randString(0);
            expect(str).toBe('');
        });

        it('should handle large array shuffling', () => {
            const largeArray = Array.from({ length: 1000 }, (_, i) => i);
            const shuffled = Crypto.shuffle(largeArray);
            expect(shuffled.length).toBe(1000);

            // Create sorted copies to compare
            const sortedShuffled = [...shuffled].sort((a, b) => a - b);
            const sortedOriginal = [...largeArray].sort((a, b) => a - b);
            expect(sortedShuffled).toEqual(sortedOriginal);
        });

        it('should handle very small probabilities for randBool', () => {
            // Set tiny probability of true
            const result = Crypto.randBool(0.00001);
            // Result can be true or false, we just need to ensure it runs without errors
            expect(typeof result).toBe('boolean');
        });
    });
});
