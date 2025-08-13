import { Crypto } from '../src/rand';

describe('Environment', () => {

    it('should current environment supports all features.', () => {
        // Save original isBrowser method
        const originalIsBrowser = Crypto['isBrowser'];

        // Mock isBrowser to return true
        Crypto['isBrowser'] = jest.fn().mockReturnValue(false);

        try {
            expect(Crypto.isFullySupported()).toBe(true);
        } finally {
            // Restore original method
            Crypto['isBrowser'] = originalIsBrowser;
        }
    });

    it('should list unsupported methods when in browser', () => {
        const originalIsBrowser = Crypto['isBrowser'];

        Crypto['isBrowser'] = jest.fn().mockReturnValue(true);

        try {
            expect(Crypto.getUnsupportedMethods()).toEqual([
                'randHex',
                'randBase64',
                'randSeed',
                'randVersion',
                'randSeeded (with seed parameter)',
                'randLattice',
                'randPrime',
                'randBigInt',
                'randHexAsync',
                'randBase64Async',
                'randSeedAsync',
                'randVersionAsync',
                'randPrimeAsync',
                'randBigIntAsync',
                'randSafePrime',
                'randSafePrimeAsync'
            ]);
        } finally {
            Crypto['isBrowser'] = originalIsBrowser;
        }
    });

    it('should return correct environment info in Node.js', () => {
        jest.spyOn(Crypto as any, 'isBrowser').mockReturnValue(false);
        jest.spyOn(Crypto as any, 'hasWebCrypto').mockReturnValue(false);
        jest.spyOn(Crypto, 'getUnsupportedMethods').mockReturnValue([]);

        const info = Crypto.getEnvironmentInfo();

        expect(info.isBrowser).toBe(false);
        expect(info.hasWebCrypto).toBe(false);
        expect(info.hasRandomUUID).toBe(typeof crypto.randomUUID === 'function');
        expect(info.unsupportedMethods).toEqual([]);
        expect(info.supportedMethods).toContain('randHex');
    });

    it('should return correct environment info in Browser with WebCrypto', () => {
        jest.spyOn(Crypto as any, 'isBrowser').mockReturnValue(true);
        jest.spyOn(Crypto as any, 'hasWebCrypto').mockReturnValue(true);
        jest.spyOn(Crypto, 'getUnsupportedMethods').mockReturnValue(['randHex', 'randBase64']);

        // Mock `window.crypto.randomUUID`
        (global as any).window = {
            crypto: {
                randomUUID: jest.fn()
            }
        };

        const info = Crypto.getEnvironmentInfo();

        expect(info.isBrowser).toBe(true);
        expect(info.hasWebCrypto).toBe(true);
        expect(info.hasRandomUUID).toBe(true);
        expect(info.unsupportedMethods).toEqual(['randHex', 'randBase64']);
        expect(info.supportedMethods).not.toContain('randHex');
    });
});
