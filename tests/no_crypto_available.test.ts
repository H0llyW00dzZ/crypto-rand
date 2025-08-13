describe('No crypto available', () => {
  const randBytesErr = 'No secure random bytes generator available. Please use in Node.js environment or modern browser with Web Crypto API.';
  const randErr = 'No secure random number generator available. Please use in Node.js environment or modern browser with Web Crypto API.';

  beforeEach(() => {
    jest.resetModules();
    jest.dontMock('crypto');
  });

  afterEach(() => {
    jest.resetModules();
    jest.dontMock('crypto');
  });

  it('randBytes should throw when neither WebCrypto nor Node crypto is available', () => {
    jest.isolateModules(() => {
      jest.doMock('crypto', () => undefined, { virtual: true });
      const { Crypto } = require('../src/rand');
      expect(() => Crypto.randBytes(16)).toThrow(randBytesErr);
    });
  });

  it('rand should throw when neither WebCrypto nor Node crypto is available', () => {
    jest.isolateModules(() => {
      jest.doMock('crypto', () => undefined, { virtual: true });
      const { Crypto } = require('../src/rand');
      expect(() => Crypto.rand()).toThrow(randErr);
    });
  });

  it('randBytesAsync should reject when neither WebCrypto nor Node crypto is available', async () => {
    let CryptoIsolated: any;
    jest.isolateModules(() => {
      jest.doMock('crypto', () => undefined, { virtual: true });
      CryptoIsolated = require('../src/rand').Crypto;
    });

    await expect(CryptoIsolated.randBytesAsync(16)).rejects.toThrow(randBytesErr);
  });

  it('randAsync should reject when neither WebCrypto nor Node crypto is available', async () => {
    let CryptoIsolated: any;
    jest.isolateModules(() => {
      jest.doMock('crypto', () => undefined, { virtual: true });
      CryptoIsolated = require('../src/rand').Crypto;
    });

    await expect(CryptoIsolated.randAsync()).rejects.toThrow(randErr);
  });
});
