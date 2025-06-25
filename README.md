# crypto-rand
[![npm version](https://badge.fury.io/js/@h0llyw00dzz%2Fcrypto-rand.svg)](https://badge.fury.io/js/@h0llyw00dzz%2Fcrypto-rand)

Cryptographically secure random utilities for Node.js and browsers.

## Installation

```bash
npm install @h0llyw00dzz/crypto-rand
```

> **Troubleshooting**: If the standard import doesn't work after installation for an older version, try using the direct path:
>
> ```typescript
> import { Crypto, randString, randInt } from '@h0llyw00dzz/crypto-rand/dist/src/crypto_rand';
> ```

## Usage

```typescript
import { Crypto, randString, randInt } from '@h0llyw00dzz/crypto-rand';

// Generate secure random number between 0 and 1
const randomFloat = Crypto.rand();

// Generate secure random integer
const randomNumber = randInt(1, 100);

// Generate secure random string
const token = randString(32);

// Generate secure password
const password = Crypto.randPassword({ length: 16 });

// Generate UUID
const id = Crypto.randUUID();
```

## Features
- Cryptographically secure random number generation
- Drop-in replacement for Math.random()
- Random string generation with custom charsets
- Array shuffling and random selection
- UUID generation
- Weighted random choices
- Normal distribution random numbers
- Cross-platform compatibility (Node.js + Browser)
- And much more!

### TODO - Features
- [ ] Breaking changes: Update target and lib to ES2020 in `tsconfig.json` or later to implement additional random methods such as `randPrime`

## API Documentation

### Static Methods
- `Crypto.rand()` - Secure replacement for Math.random()
- `Crypto.randInt(min, max)` - Generate random integer in range
- `Crypto.randN(max)` - Generate random integer 0 to max-1
- `Crypto.randString(length, charset?)` - Generate random string
- `Crypto.randBool(probability?)` - Generate random boolean
- `Crypto.randChoice(array)` - Pick random array element
- `Crypto.shuffle(array)` - Shuffle array securely
- `Crypto.randHex(length)` - Generate random hex string
- `Crypto.randBase64(length)` - Generate random base64 string
- `Crypto.randFloat(min, max)` - Generate random float in range
- `Crypto.randWeighted(items, weights)` - Weighted random selection
- `Crypto.randNormal(mean, stdDev)` - Normal distribution random
- `Crypto.randSeed()` - Generate cryptographically secure seed
- `Crypto.randUUID()` - Generate UUID v4
- `Crypto.randGaussian(mean, stdDev)` - Similar to randNormal, but with different handling of edge cases
- `Crypto.randSubset(array, size)` - Select a random subset from an array
- `Crypto.randWalk(steps, stepSize?)` - Generate random walk sequence (stepSize defaults to 1)
- `Crypto.randPassword(options)` - Generate secure password with configurable requirements
- `Crypto.randLattice(dimension?, modulus?)` - Generate lattice-based cryptographically secure random number

> [!NOTE]
>
> - **randNormal vs. randGaussian**: Both methods generate normally distributed random numbers using the [Box-Muller transform](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform). `randNormal` ensures the logarithm function never receives zero by adjusting its input range, while `randGaussian` uses a direct approach.
>
> - **randSubset**: Allows selection of a random subset from an array, useful for sampling without replacement.
>
> - **randWalk**: Generates a sequence representing a random walk starting from position 0, where each step moves by ±stepSize. Returns an array containing all positions including the starting position.
>
> - **randPassword vs. randString**: `randPassword` is specifically designed for password generation with built-in character type controls, password-specific features like excluding similar-looking characters (0O1lI), and ensuring proper character distribution for strong passwords. While `randString` is a general-purpose string generator, `randPassword` is optimized for creating secure passwords with common password policy requirements.
>
> - **randLattice**: Generates cryptographically secure random numbers using lattice-based mathematical operations and the Learning With Errors (LWE) problem. Uses high-dimensional vector operations with Gaussian error distribution for enhanced security.

### Character Sets
```typescript
import {
  DEFAULT_CHARSET,
  HEX_CHARSET,
  ALPHANUMERIC_CHARSET,
  NUMERIC_CHARSET,
  SPECIAL_CHARSET
} from '@h0llyw00dzz/crypto-rand';

// Use custom charset
const customToken = randString(16, ALPHANUMERIC_CHARSET);
```

### Advanced Examples
```typescript
// Generate secure password
const password = Crypto.randString(16, FULL_CHARSET);

// Shuffle an array
const shuffled = Crypto.shuffle([1, 2, 3, 4, 5]);

// Weighted random choice
const items = ['apple', 'banana', 'orange'];
const weights = [0.5, 0.3, 0.2];
const choice = Crypto.randWeighted(items, weights);

// Normal distribution random number
const normalRandom = Crypto.randNormal(0, 1); // mean=0, stdDev=1

// Generate random bytes
const bytes = Crypto.randBytes(32);
```

## Security
This library uses Node.js's built-in `crypto` module to provide cryptographically secure random number generation. Unlike `Math.random()`, which uses a pseudorandom number generator that can be predictable, this library ensures true randomness suitable for security-sensitive applications.

## Browser Compatibility
This package supports both Node.js and browser environments out of the box. It automatically detects the environment and uses the appropriate cryptographic API:

- **Node.js**: Uses the built-in `crypto.randomBytes()` for secure random generation
- **Browser**: Uses `window.crypto.getRandomValues()` from the Web Crypto API
- **Universal**: Works seamlessly in both environments without additional configuration

### Supported Browsers
- Chrome 37+
- Firefox 34+
- Safari 7+
- Edge 12+
- Modern mobile browsers with Web Crypto API support
