import {
  DEFAULT_CHARSET,
  HEX_CHARSET,
  BASE64_CHARSET,
  ALPHANUMERIC_CHARSET,
  NUMERIC_CHARSET,
  LOWERCASE_CHARSET,
  UPPERCASE_CHARSET,
  SPECIAL_CHARSET,
  FULL_CHARSET
} from '../src/const';

describe('Character Set Constants', () => {
  it('should have correct DEFAULT_CHARSET', () => {
    expect(DEFAULT_CHARSET).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
    expect(DEFAULT_CHARSET).toHaveLength(62);
  });

  it('should have correct HEX_CHARSET', () => {
    expect(HEX_CHARSET).toBe('0123456789abcdef');
    expect(HEX_CHARSET).toHaveLength(16);
  });

  it('should have correct BASE64_CHARSET', () => {
    expect(BASE64_CHARSET).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/');
    expect(BASE64_CHARSET).toHaveLength(64);
  });

  it('should have correct ALPHANUMERIC_CHARSET', () => {
    expect(ALPHANUMERIC_CHARSET).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
    expect(ALPHANUMERIC_CHARSET).toHaveLength(62);
  });

  it('should have correct NUMERIC_CHARSET', () => {
    expect(NUMERIC_CHARSET).toBe('0123456789');
    expect(NUMERIC_CHARSET).toHaveLength(10);
  });

  it('should have correct LOWERCASE_CHARSET', () => {
    expect(LOWERCASE_CHARSET).toBe('abcdefghijklmnopqrstuvwxyz');
    expect(LOWERCASE_CHARSET).toHaveLength(26);
  });

  it('should have correct UPPERCASE_CHARSET', () => {
    expect(UPPERCASE_CHARSET).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    expect(UPPERCASE_CHARSET).toHaveLength(26);
  });

  it('should have correct SPECIAL_CHARSET', () => {
    expect(SPECIAL_CHARSET).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
    expect(SPECIAL_CHARSET).toHaveLength(26);
  });

  it('should have correct FULL_CHARSET', () => {
    expect(FULL_CHARSET).toBe(DEFAULT_CHARSET + SPECIAL_CHARSET);
    expect(FULL_CHARSET).toHaveLength(88);
  });

  it('should have no duplicate characters in charsets', () => {
    const charsets = [
      DEFAULT_CHARSET,
      HEX_CHARSET,
      BASE64_CHARSET,
      ALPHANUMERIC_CHARSET,
      NUMERIC_CHARSET,
      LOWERCASE_CHARSET,
      UPPERCASE_CHARSET,
      SPECIAL_CHARSET
    ];

    charsets.forEach(charset => {
      const uniqueChars = new Set(charset);
      expect(uniqueChars.size).toBe(charset.length);
    });
  });
});
