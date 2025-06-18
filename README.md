# crypto-rand

Cryptographically secure random utilities for Node.js and browsers.

## Installation

```bash
npm install @h0llyw00dzz/crypto-rand
```

## Usage

```typescript
import { Crypto, randString, randInt } from '@h0llyw00dzz/crypto-rand';

// Generate secure random number between 0 and 1
const randomFloat = Crypto.rand();

// Generate secure random integer
const randomNumber = randInt(1, 100);

// Generate secure random string
const token = randString(32);

// Generate UUID
const id = Crypto.uuid();
```

## Features
- Cryptographically secure random number generation
- Drop-in replacement for Math.random()
- Random string generation with custom charsets
- Array shuffling and random selection
- UUID generation
- Weighted random choices
- Normal distribution random numbers
- And much more!

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
This package is designed for Node.js environments. For browser usage, ensure your bundler can handle Node.js crypto polyfills or use the Web Crypto API alternatives.
