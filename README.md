# crypto-rand
[![npm version](https://badge.fury.io/js/@h0llyw00dzz%2Fcrypto-rand.svg)](https://badge.fury.io/js/@h0llyw00dzz%2Fcrypto-rand)
[![Coverage Status](https://coveralls.io/repos/github/H0llyW00dzZ/crypto-rand/badge.svg)](https://coveralls.io/github/H0llyW00dzZ/crypto-rand)
[![jest tested](https://img.shields.io/badge/Jest-tested-eee.svg?logo=jest&labelColor=99424f)](https://github.com/jestjs/jest)

Cryptographically secure random utilities for Node.js and browsers.

> [!IMPORTANT]
>
> **FIPS Compliance Disclaimer**
>
> This package may not conform to FIPS (Federal Information Processing Standards) requirements for cryptographic modules. Organizations requiring FIPS-validated cryptography should conduct their own compliance assessment before deployment.
>
> **Key Considerations:**
>
> - **Platform Dependencies**: Cryptographic security relies on underlying platform implementations (Node.js `crypto` module, Web Crypto API) which may not be FIPS-certified across all deployment environments
>
> - **Algorithm Implementation**: Certain methods, particularly `randPrime`, utilize probabilistic algorithms (Miller-Rabin primality testing) that may not align with FIPS-approved deterministic validation procedures
>
> - **Cross-Platform Design**: Compatibility requirements across Node.js and browser environments necessitate implementation choices that may not satisfy strict FIPS compliance criteria
>
> - **Validation Status**: This library has not undergone formal FIPS certification or validation testing
>
> **Security Assurance**: Non-compliance with FIPS standards does not indicate cryptographic weakness. This library employs industry-standard secure random number generation and is suitable for general-purpose cryptographic applications where FIPS certification is not mandated.
>
> For FIPS-compliant environments, consult your organization's security policies and consider using FIPS-validated cryptographic modules.

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
- [x] ~~Breaking changes: Update target and lib to ES2020 in `tsconfig.json` or later to implement additional random methods such as `randPrime`~~ (Implemented in current version)
- [ ] Add more [post-quantum cryptography](https://en.wikipedia.org/wiki/Post-quantum_cryptography) methods

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
- `Crypto.randPrime(bits?, iterations?)` - Generate cryptographically secure random prime number
- `Crypto.randBigInt(bits?)` - Generate cryptographically secure random bigint with specified bit length

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
>
> - **randPrime**: Generates cryptographically secure random prime numbers of specified bit length using the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test). This is useful for cryptographic applications like [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) key generation that require large prime numbers.
>
> - **randBigInt**: Generates cryptographically secure random bigints with exactly the specified bit length. It ensures the most significant bit is set to 1 (to maintain the exact bit length) and the least significant bit is set to 1 (making it odd). This method is useful for cryptographic operations that require large random integers, and is used internally by `randPrime`.

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

#### **randPrime**: [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) key pair simulation example
```typescript
import { Crypto } from '@h0llyw00dzz/crypto-rand';

// RSA key pair simulation example
console.log('🔐 RSA Key Pair Simulation');
console.log('Generating two 512-bit primes for RSA...');
console.time('RSA prime pair generation');
const p: bigint = Crypto.randPrime(512);
const q: bigint = Crypto.randPrime(512);
console.timeEnd('RSA prime pair generation');

const n: bigint = p * q;
const phi: bigint = (p - 1n) * (q - 1n);

console.log('\n📊 Full RSA Key Parameters:');
console.log('━'.repeat(80));

console.log(`\n🔢 Prime p (${p.toString(2).length} bits):`);
console.log(p.toString());

console.log(`\n🔢 Prime q (${q.toString(2).length} bits):`);
console.log(q.toString());

console.log(`\n🔐 Modulus n = p × q (${n.toString(2).length} bits):`);
console.log(n.toString());

console.log(`\n📈 Euler's totient φ(n) = (p-1)(q-1) (${phi.toString().length} digits):`);
console.log(phi.toString());

console.log('\n🎯 RSA Key Analysis:');
console.log('━'.repeat(40));
console.log(`Prime p bit length: ${p.toString(2).length} bits`);
console.log(`Prime q bit length: ${q.toString(2).length} bits`);
console.log(`Modulus n bit length: ${n.toString(2).length} bits`);
console.log(`Modulus n decimal length: ${n.toString().length} digits`);
console.log(`φ(n) decimal length: ${phi.toString().length} digits`);

// Hexadecimal representation for easier reading
console.log('\n🔧 Hexadecimal Representation:');
console.log('━'.repeat(40));
console.log(`Prime p (hex): 0x${p.toString(16)}`);
console.log(`Prime q (hex): 0x${q.toString(16)}`);
console.log(`Modulus n (hex): 0x${n.toString(16)}`);

// Additional RSA parameters
const e = 65537n; // Standard RSA public exponent
console.log(`\n⚙️  Standard RSA public exponent e: ${e}`);
console.log(`e in hex: 0x${e.toString(16)}`);
console.log(`e in binary: 0b${e.toString(2)}`);

console.log('\n✅ RSA-1024 key pair generated successfully!');
console.log(`🔒 Ready for cryptographic operations with ${n.toString(2).length}-bit security`);
```

**Output**:
```
🔐 RSA Key Pair Simulation
Generating two 512-bit primes for RSA...
RSA prime pair generation: 122.395ms

📊 Full RSA Key Parameters:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔢 Prime p (512 bits):
10332875180984937188212543009442021049052167852197686607297484227327378341552296925992226487617220177328455829145288166833100638955910093817267989178423073

🔢 Prime q (512 bits):
12954885855647726130509322447184318445832367546094918877784890443071291597566720274675251392103347355691843781436352664016291243646772976392340792132553717

🔐 Modulus n = p × q (1024 bits):
133861218530315201005653334393442917605123323330119927212727320055354313536219546299559853986366101719982021820444300266749246224830007993059434321470862538792295529692313615478696914663486817223475154407313734656489684823138730704549626389735179219724019378484222850588577807256333115082776522609570524712341

📈 Euler's totient φ(n) = (p-1)(q-1) (309 digits):
133861218530315201005653334393442917605123323330119927212727320055354313536219546299559853986366101719982021820444300266749246224830007993059434321470862515504534493059650296756831458037147322338939756114708249574115014424468791585532425722257299499156486358184612268947746957864450512399706313000789213735552

🎯 RSA Key Analysis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prime p bit length: 512 bits
Prime q bit length: 512 bits
Modulus n bit length: 1024 bits
Modulus n decimal length: 309 digits
φ(n) decimal length: 309 digits

🔧 Hexadecimal Representation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prime p (hex): 0xc54a0ab3eafc760aba80f137bd1ac7881fdd680e2319b6315d6e47f575bc2388940af890c439cbd614a7520448db93859095758797029ccbf8698f35ec5b1721
Prime q (hex): 0xf75a29bb758360582ab1f4ed5cd9f17c6272bbd90c4e0ebbad8e44370c4ed376a9c70ea43518e3a66506ccdbfc2abc7d35a46028fdbe2d649c56625befb4cbf5
Modulus n (hex): 0xbe9fec84ae56eabc59defd95a3e744f41fdd0ec934ff4068e4962756c3db675ac2b2f92e36a3a9cc2684df69b394429bc5c53840bfd618edf2acc98702f1282e46e73fb3e40648a0797634c86f7f3dabb4d62b58f8bbf2e0dcf7db05210547798a9b42005ec47d9dfc45c53245ba7d41ab77104b10cc4f583f7ae66680b84d95

⚙️  Standard RSA public exponent e: 65537
e in hex: 0x10001
e in binary: 0b10000000000000001

✅ RSA-1024 key pair generated successfully!
🔒 Ready for cryptographic operations with 1024-bit security
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
