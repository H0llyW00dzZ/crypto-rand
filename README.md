# crypto-rand
![Node.js min version](https://img.shields.io/badge/node-%3E%3D19.0.0-brightgreen?logo=node.js)
[![npm version](https://badge.fury.io/js/@h0llyw00dzz%2Fcrypto-rand.svg)](https://badge.fury.io/js/@h0llyw00dzz%2Fcrypto-rand)
[![🧪 Test Coverage](https://github.com/H0llyW00dzZ/crypto-rand/actions/workflows/coverage.yml/badge.svg?branch=master)](https://github.com/H0llyW00dzZ/crypto-rand/actions/workflows/coverage.yml)
[![Coverage Status](https://coveralls.io/repos/github/H0llyW00dzZ/crypto-rand/badge.svg)](https://coveralls.io/github/H0llyW00dzZ/crypto-rand)
[![jest tested](https://img.shields.io/badge/Jest-tested-eee.svg?logo=jest&labelColor=99424f)](https://github.com/jestjs/jest)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@h0llyw00dzz/crypto-rand/0.1.5)](https://socket.dev/npm/package/@h0llyw00dzz/crypto-rand/overview/0.1.5)

<p align="center">
  <img src="https://i.imgur.com/Xd6X6bT.png" alt="crypto-rand logo" width="500">
  <br>
  <i>Image Copyright © <a href="https://github.com/H0llyW00dzZ">H0llyW00dzZ</a>. All rights reserved.</i>
  <br>
  <i>Image used with permission from the copyright holder.</i>
</p>

Cryptographically secure random utilities for Node.js and browsers.

> [!IMPORTANT]
>
> **[FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) Compliance Disclaimer**
>
> This package may not conform to [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) (Federal Information Processing Standards) requirements for cryptographic modules. Organizations requiring [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards)-validated cryptography should conduct their own compliance assessment before deployment.
>
> **Key Considerations:**
>
> - **Platform Dependencies**: Cryptographic security relies on underlying platform implementations ([Node.js `crypto` module](https://nodejs.org/docs/latest/api/crypto.html), [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)) which may not be [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards)-certified across all deployment environments
>
> - **Algorithm Implementation**: Certain methods, particularly `randPrime`/`randPrimeAsync`, utilize probabilistic algorithms ([Miller-Rabin primality](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) testing) that may not align with [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards)-approved deterministic validation procedures
>
> - **Cross-Platform Design**: Compatibility requirements across Node.js and browser environments necessitate implementation choices that may not satisfy strict [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) compliance criteria
>
> - **Validation Status**: This library has not undergone formal [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) certification or validation testing
>
> **Security Assurance**: Non-compliance with [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) standards does not indicate cryptographic weakness. This library employs industry-standard secure random number generation and is suitable for general-purpose cryptographic applications where [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) certification is not mandated.
>
> For [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards)-compliant environments, consult your organization's security policies and consider using [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards)-validated cryptographic modules.

## Installation

> [!NOTE]
>
> The minimum required Node.js version is 19.0.0. It also works well with the latest Node.js versions, as it doesn't rely on external dependencies.
> It primarily uses the [Node.js `crypto` module](https://nodejs.org/docs/latest/api/crypto.html), which leverages [OpenSSL](https://www.openssl.org/) or other cryptographic libraries. For example, on [Unix-like](https://en.wikipedia.org/wiki/Unix-like) systems, Node.js might use [`/dev/urandom`](https://en.wikipedia.org/wiki//dev/random) or [`/dev/random`](https://en.wikipedia.org/wiki//dev/random).

> [!TIP]
>
> Since it primarily uses the [Node.js `crypto` module](https://nodejs.org/docs/latest/api/crypto.html), which leverages [OpenSSL](https://www.openssl.org/) or other cryptographic libraries, it's recommended to customize the source of randomness. The default source might have poor entropy. For example, in Node.js, you can customize it through the OpenSSL configuration.

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

// Using async methods
async function generateRandomValues() {
  // Generate secure random number between 0 and 1 asynchronously
  const randomFloatAsync = await randAsync();

  // Generate secure random bytes asynchronously
  const randomBytes = await randBytesAsync(16);

  // Generate secure random hex string asynchronously
  const randomHex = await Crypto.randHexAsync(32);

  console.log({ randomFloatAsync, randomBytes, randomHex });
}
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
- Asynchronous methods for non-blocking operations
- Written in [TypeScript](https://www.typescriptlang.org/) for static typing (well-known) and better maintainability
- And much more!

### TODO - Features
- [x] ~~Breaking changes: Update target and lib to ES2020 in `tsconfig.json` or later to implement additional random methods such as `randPrime`~~ (Implemented in current version)
- [ ] Add more [post-quantum cryptography](https://en.wikipedia.org/wiki/Post-quantum_cryptography) methods
- [ ] Implement a source for a [CSPRNG/CPRNG](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator) using [TPM 2.0](https://en.wikipedia.org/wiki/Trusted_Platform_Module) with [C/C++ addons](https://nodejs.org/docs/latest/api/n-api.html). This is feasible, as the maximum output is likely 32 bytes, which is typical for [TPM 2.0](https://en.wikipedia.org/wiki/Trusted_Platform_Module). Tested on [ROG STRIX B450-F GAMING II](https://rog.asus.com/id/motherboards/rog-strix/rog-strix-b450-f-gaming-ii-model/), the maximum is 32 bytes.

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
- `Crypto.randPrime(bits?, iterations?, enhanced?)` - Generate cryptographically secure random prime number with optional [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards)-enhanced mode
- `Crypto.randBigInt(bits?)` - Generate cryptographically secure random bigint with specified bit length
- `Crypto.randExponential(lambda?)` - Generate random number with exponential distribution

### Static Async Methods
- `Crypto.randAsync()` - Async version of rand()
- `Crypto.randBytesAsync(size)` - Async version of randBytes()
- `Crypto.randHexAsync(length)` - Async version of randHex()
- `Crypto.randBase64Async(length)` - Async version of randBase64()
- `Crypto.randSeedAsync()` - Async version of randSeed()
- `Crypto.randVersionAsync()` - Async version of randVersion()
- `Crypto.randPrimeAsync(bits?, iterations?, enhanced?)` - Async version of randPrime() with optional [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards)-enhanced mode
- `Crypto.randBigIntAsync(bits?)` - Async version of randBigInt()

> [!TIP]
> **Benefits of Async Methods**
>
> Async methods provide several advantages when generating cryptographically secure random values:
>
> - **Non-blocking operation**: Async methods don't block the main thread, improving application responsiveness
> - **Concurrent execution**: Multiple async operations can run simultaneously with `Promise.all()`. However, this doesn't guarantee true parallelism. [Read more here](README.md#static-async-methods-and-concurrency).
> - **Better performance**: For large or frequent random number generation, async methods can offer better throughput
> - **Modern JavaScript patterns**: Works well with async/await syntax for cleaner code
> - **Improved RSA operations**: Using `randPrimeAsync` and `randBigIntAsync` allows for non-blocking prime generation for RSA key pairs
>
> Use async methods when generating large amounts of random data or when you need to maintain UI responsiveness in applications.
>
> **Example: Async RSA Key Generation**
>
> ```typescript
> import { randPrimeAsync } from '@h0llyw00dzz/crypto-rand';
> import { modInverse } from '@h0llyw00dzz/crypto-rand'; // If available, or implement your own
>
> async function generateRSAKeyPair(bitLength = 1024) {
>   console.log(`Generating ${2 * bitLength}-bit RSA key pair asynchronously...`);
>   
>   // Generate two primes concurrently
>   let p, q, n, phi;
>   
>   // Loop to ensure modulus n is of the expected bit length
>   do {
>     // Using enhanced FIPS mode for stronger primality testing
>     [p, q] = await Promise.all([
>       randPrimeAsync(bitLength, 10, true), // true enables FIPS-enhanced mode
>       randPrimeAsync(bitLength, 10, true)
>     ]);
>     
>     n = p * q; // modulus
>     phi = (p - 1n) * (q - 1n); // Euler's totient
>   } while (n.toString(2).length !== 2 * bitLength);
>   
>   const e = 65537n; // Common public exponent
>   const d = modInverse(e, phi); // Private exponent
>   
>   return {
>     publicKey: { e, n },
>     privateKey: { d, n, p, q }
>   };
> }
> ```

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
> - **randPrime**: Generates cryptographically secure random prime numbers of specified bit length using the [Miller-Rabin primality test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test). This is useful for cryptographic applications like [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) key generation that require large prime numbers. The function now supports an enhanced [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) mode that implements additional checks following the [FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) standard, including [GCD](https://en.wikipedia.org/wiki/Greatest_common_divisor) verification between random witnesses and the tested number.
>
> - **randBigInt**: Generates cryptographically secure random bigints with exactly the specified bit length. It ensures the most significant bit is set to 1 (to maintain the exact bit length) and the least significant bit is set to 1 (making it odd). This method is useful for cryptographic operations that require large random integers, and is used internally by `randPrime`.
>
> - **randExponential**: Generates random numbers following an [exponential distribution](https://en.wikipedia.org/wiki/Exponential_distribution) with rate parameter `lambda` (default: 1). The exponential distribution is commonly used for modeling time between independent events that occur at a constant average rate, such as arrival times, failure times, or waiting times in queuing theory. The mean of the distribution is 1/λ and the variance is 1/λ².

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
// Using enhanced FIPS mode for stronger primality testing
const p: bigint = Crypto.randPrime(512, 10, true); // true enables FIPS-enhanced mode
const q: bigint = Crypto.randPrime(512, 10, true);
console.timeEnd('RSA prime pair generation');

const n: bigint = p * q;
const phi: bigint = (p - 1n) * (q - 1n);

console.log('\n📊 Full RSA Key Parameters:');
console.log('━'.repeat(80));

console.log(`\n🔢 Prime p (${p.toString(2).length} bits):`);
console.log(p.toString());

console.log(`\n🔢 Prime q (${q.toString(2).length} bits):`);
console.log(q.toString());

console.log(`\n🔐 Modulus n = $p$ × $q$ (${n.toString(2).length} bits):`);
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

🔐 Modulus n = $p$ × $q$ (1024 bits):
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

**Verify the output using [OpenSSL](https://openssl.org/)**:

```terminal
h0llyw00dzz@ubuntu-pro:~/Workspace/git/crypto-rand$ openssl prime 10332875180984937188212543009442021049052167852197686607297484227327378341552296925992226487617220177328455829145288166833100638955910093817267989178423073
C54A0AB3EAFC760ABA80F137BD1AC7881FDD680E2319B6315D6E47F575BC2388940AF890C439CBD614A7520448DB93859095758797029CCBF8698F35EC5B1721 (10332875180984937188212543009442021049052167852197686607297484227327378341552296925992226487617220177328455829145288166833100638955910093817267989178423073) is prime
h0llyw00dzz@ubuntu-pro:~/Workspace/git/crypto-rand$ openssl prime 12954885855647726130509322447184318445832367546094918877784890443071291597566720274675251392103347355691843781436352664016291243646772976392340792132553717
F75A29BB758360582AB1F4ED5CD9F17C6272BBD90C4E0EBBAD8E44370C4ED376A9C70EA43518E3A66506CCDBFC2ABC7D35A46028FDBE2D649C56625BEFB4CBF5 (12954885855647726130509322447184318445832367546094918877784890443071291597566720274675251392103347355691843781436352664016291243646772976392340792132553717) is prime
```

> [!TIP]
>
> If you encounter an issue where the modulus \( n \) is not as expected (e.g., 1024 bits but returns 1023 bits), consider using this approach:
>
> ```typescript
> // Generate first RSA key pair
> let p: bigint, q: bigint, n: bigint, phi: bigint;
> const expectedBitLength: number = 512;
>
> // Loop to ensure modulus n is of the expected bit length
> do {
>   p = Crypto.randPrime(expectedBitLength, 10, true); // Using enhanced FIPS mode
>   q = Crypto.randPrime(expectedBitLength, 10, true);
>   n = p * q;
>   phi = (p - 1n) * (q - 1n);
> } while (n.toString(2).length !== 2 * expectedBitLength);
> ```
>
> Note that this issue, where the modulus \( $n$ \) isn't as expected (e.g., 1024 bits but returns 1023 bits), is not a bug. In theory, "numbers don't lie."
>
> To ensure high-quality \( $p$ × $q$ \), increase the number of iterations for accuracy. However, be aware that this may impact your system's performance, so adjust the iterations wisely.
>
> For example, a high-quality \( [p](https://planetcalc.com/8985/?num=93629667390763549743455182787551291607037005538469263456208785580579360237162918675053499364040380117827260438954037327068155571816415363590923149064296211316344684453342709572888762763763699420910422611609217694260666828600126970518675244226099301744993653235729128393490157011842848404542601183277427628913) × [q](https://planetcalc.com/8985/?num=175626859266695272885651840136370904489850577848971276776266672798504641918716678705774242052769822259100840653789506969497096025110479392809723327107911398990210101592275192909779675947860982696120429830662732823875953232932659348818061516003321491936390246622573145078330377015972795061320693588445635410027) \):
> ```
> 🔢 Prime p (1024 bits):
> 93629667390763549743455182787551291607037005538469263456208785580579360237162918675053499364040380117827260438954037327068155571816415363590923149064296211316344684453342709572888762763763699420910422611609217694260666828600126970518675244226099301744993653235729128393490157011842848404542601183277427628913
> 
> 🔢 Prime q (1024 bits):
> 175626859266695272885651840136370904489850577848971276776266672798504641918716678705774242052769822259100840653789506969497096025110479392809723327107911398990210101592275192909779675947860982696120429830662732823875953232932659348818061516003321491936390246622573145078330377015972795061320693588445635410027
> ```
> When computing \( [n](https://planetcalc.com/8985/?num=16443884418025117548105791962750907104057585305844601162650925309641405889906431436992904425679487416857606964858900739573861173341075086578451521650284489043240848823438572377480264841514770723125423683113631314524077817563403980472557462363541355254838641694785777889907988097731767993014399677529734388761633551331732914193006592599846235962565800326042232597361985089004996965000416284274426152928381037402336221116301394384508649690924628669942239923232626762521308841104446535709132972117182262279592274692864030418438345001588795102795792529507570109176579504027688756871881140850735912118414346948463155310651) \):
> ```
> 🔐 Modulus n = p × q (2048 bits):
> 16443884418025117548105791962750907104057585305844601162650925309641405889906431436992904425679487416857606964858900739573861173341075086578451521650284489043240848823438572377480264841514770723125423683113631314524077817563403980472557462363541355254838641694785777889907988097731767993014399677529734388761633551331732914193006592599846235962565800326042232597361985089004996965000416284274426152928381037402336221116301394384508649690924628669942239923232626762521308841104446535709132972117182262279592274692864030418438345001588795102795792529507570109176579504027688756871881140850735912118414346948463155310651
> ```
> Another example, a high-quality \( [p](https://planetcalc.com/8985/?num=176014562596357390158333092397129182747131938016638239747736142056577023945957931286910415334937793317150164468664828328536713918423550220286362297727001920879254154343039961363143416561274583220577956434429556558301467483983263366303873960104123130023249834442164293834519168997391367089035712289622382174403) × [q](https://planetcalc.com/8985/?num=119930918627410466541988914947061329063495175091760815095499653987838588298784040331571855576818400905503285794099893112575294836540726923671566101370094773992292750567966153158353521716094006708440846928281575787706279871556395999647706934659800908654843051127244668855876169326025470688413517187642268148587) \):
> ```
> 🔢 Prime p (1024 bits):
> 176014562596357390158333092397129182747131938016638239747736142056577023945957931286910415334937793317150164468664828328536713918423550220286362297727001920879254154343039961363143416561274583220577956434429556558301467483983263366303873960104123130023249834442164293834519168997391367089035712289622382174403
> 
> 🔢 Prime q (1024 bits):
> 119930918627410466541988914947061329063495175091760815095499653987838588298784040331571855576818400905503285794099893112575294836540726923671566101370094773992292750567966153158353521716094006708440846928281575787706279871556395999647706934659800908654843051127244668855876169326025470688413517187642268148587
> ```
> Another example, When computing \( [n](https://planetcalc.com/8985/?num=21109588183982984094537754979231450570382409554691300729648970376727660815723153498018257692421434008199277194048117105736119782738763258765608832555981776734246100740578917404630486173951973580149452803070461459950807404032796665120608407336211725046446142301247493113874043906249265567154067533367198405508721122805606604411299368764837194552440210666126208247015472211723838536695227338562100854864394446433794873367150082085017205387652798066127749354856504744160443717168296083572035049477433623994022390731452470787821752825371953563517711180104140114714263874665022631471576958036807687642642096871366152018561) \):
> ```
> 🔐 Modulus n = p × q (2048 bits):
> 21109588183982984094537754979231450570382409554691300729648970376727660815723153498018257692421434008199277194048117105736119782738763258765608832555981776734246100740578917404630486173951973580149452803070461459950807404032796665120608407336211725046446142301247493113874043906249265567154067533367198405508721122805606604411299368764837194552440210666126208247015472211723838536695227338562100854864394446433794873367150082085017205387652798066127749354856504744160443717168296083572035049477433623994022390731452470787821752825371953563517711180104140114714263874665022631471576958036807687642642096871366152018561
> ```
>
> 4096-bits example, a high-quality \( [p](https://planetcalc.com/8985/?num=31062935833744670225753257559781584892168049974923237166308591802942899178052323785187797613848187390473115506283534155453953753957368922081701939025938291302530161223440954615697682837569519072377763490122730717239109990856560566520263980030639103301828035437039566574992407831308781818375617131756581167712901303509794170698027964234104946896147613733492480298559243778383465787063236155400454403523384280500615450534811439978341820438429921957235236589380925080219431100747989349841765815311634595633347474235308351036240752956130598220135102264213182733681578342185601686831516174924099644103822508643127583476219) × [q](https://planetcalc.com/8985/?num=23375016335564275556609387302277194206531861412053332624528678840101068389300179883592211355891720400833031331473659982133008721107347695302047566699300595944016381248981712753138068019091164709718432192884965041911059423534440506910444383727330427502885738542770799897626028320905886858988377140046761473378465624458445997148840218833455879087045033532384464812540836361918619227061631061690862077905014804292000486008319173591341309040014794490741352231506975874641187314021547982150276790895389690994219961921942121601559242384948220450132494260263385741437770946239524125483280731217967561011345496667351277666337) \):
> ```
> 🔢 Prime p (2048 bits):
> 31062935833744670225753257559781584892168049974923237166308591802942899178052323785187797613848187390473115506283534155453953753957368922081701939025938291302530161223440954615697682837569519072377763490122730717239109990856560566520263980030639103301828035437039566574992407831308781818375617131756581167712901303509794170698027964234104946896147613733492480298559243778383465787063236155400454403523384280500615450534811439978341820438429921957235236589380925080219431100747989349841765815311634595633347474235308351036240752956130598220135102264213182733681578342185601686831516174924099644103822508643127583476219
> 
> 🔢 Prime q (2048 bits):
> 23375016335564275556609387302277194206531861412053332624528678840101068389300179883592211355891720400833031331473659982133008721107347695302047566699300595944016381248981712753138068019091164709718432192884965041911059423534440506910444383727330427502885738542770799897626028320905886858988377140046761473378465624458445997148840218833455879087045033532384464812540836361918619227061631061690862077905014804292000486008319173591341309040014794490741352231506975874641187314021547982150276790895389690994219961921942121601559242384948220450132494260263385741437770946239524125483280731217967561011345496667351277666337
> ```
> 4096-bits example, When computing \( [n](https://planetcalc.com/8985/?num=726096632544366566153678489161565601811710826109599759733820477841619019609006413571613336893871778668428174837829913569324413979378332098947468398483471090691876262459310688988945165647553502062898202858085751490527653434003054958254306911455190999549647054238300472755553127297160274612443847546317750556269968130584223313361557729640800852425926154866445555866597213943194857984320578772686820891207241958494959836360107006362512585312477954905571808971991757337392235767235105736784908269414760032532874260833272201068441334479479646488947341300067919621358909155432705610965196293350927658462181973020689470174767511503384485677253242429664297913416461644263497537863596487407649321620385351452785584734658599985141565852660758001007525219858642102492970522307669283582149953814827312034750480370244294093974006929022486039219953647945212214992256975983585925679600297179638521616796548107646941422149070263753846744876755357428662252261238463606769381821135061640577008402988054351763901237017333731945198396356474784835674551090886985359930885885249207857505309793927681691771842640180619282878716991472663897581613300903667145109140260748369101967704818457211889824317200092901133656189093076182635221617808138553372456339803) \):
> ```
> 🔐 Modulus n = p × q (4096 bits):
> 726096632544366566153678489161565601811710826109599759733820477841619019609006413571613336893871778668428174837829913569324413979378332098947468398483471090691876262459310688988945165647553502062898202858085751490527653434003054958254306911455190999549647054238300472755553127297160274612443847546317750556269968130584223313361557729640800852425926154866445555866597213943194857984320578772686820891207241958494959836360107006362512585312477954905571808971991757337392235767235105736784908269414760032532874260833272201068441334479479646488947341300067919621358909155432705610965196293350927658462181973020689470174767511503384485677253242429664297913416461644263497537863596487407649321620385351452785584734658599985141565852660758001007525219858642102492970522307669283582149953814827312034750480370244294093974006929022486039219953647945212214992256975983585925679600297179638521616796548107646941422149070263753846744876755357428662252261238463606769381821135061640577008402988054351763901237017333731945198396356474784835674551090886985359930885885249207857505309793927681691771842640180619282878716991472663897581613300903667145109140260748369101967704818457211889824317200092901133656189093076182635221617808138553372456339803
> ```
>
> Alternatively, if you want to minimize the impact on system performance, you can reduce the number of iterations. However, this approach depends more on luck to achieve a high-quality \( $p$ × $q$ \).

## Security
This library uses Node.js's built-in [`crypto` module](https://nodejs.org/docs/latest/api/crypto.html) to provide [cryptographically secure random number generation](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator). Unlike `Math.random()`, which uses a pseudorandom number generator that can be predictable, this library ensures true randomness suitable for security-sensitive applications.

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

## Performance

This library provides [cryptographically secure random number generation](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator) with a focus on both security and performance. However, there are some important performance considerations to be aware of:

### General Performance Considerations

- **Cryptographic Operations Overhead**: [Cryptographically secure random number generation](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator) is inherently more computationally intensive than non-secure alternatives like `Math.random()`. This is a necessary [trade-off](https://en.wikipedia.org/wiki/Trade-off) for security.

- **Synchronous vs. Asynchronous Methods**: For most small operations, synchronous methods provide adequate performance. For larger operations or when generating multiple values, consider using asynchronous methods to avoid blocking the main thread.

### Static Async Methods and Concurrency

- **Concurrency vs. Parallelism**: While Node.js is single-threaded by nature, static async methods in this library guarantee concurrency but not 100% guarantee parallelism. This means:
  - Multiple async operations can make progress concurrently within the event loop
  - Operations don't block each other, improving overall throughput
  - However, they don't execute in parallel on multiple CPU cores simultaneously

- **Event Loop Efficiency**: Async methods allow the event loop to handle other tasks while waiting for cryptographic operations to complete, making your application more responsive.

### [Prime Number](https://en.wikipedia.org/wiki/Prime_number) Generation Performance

- **Key Size Recommendations**:
  - **2048-bit keys** offer a good balance between security and performance for most applications. This is the recommended size for general use.
  - **4096-bit keys**, while providing stronger security, come with significant performance penalties (often 5-8x slower than 2048-bit operations) and are recommended only for highly sensitive applications where maximum security is required.

> [!NOTE]
>
> `4096-bit keys` are often 5-8 times slower than `2048-bit` operations. This is not only during prime generation using probabilistic algorithms like [Miller-Rabin](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test), but also when performing encryption/decryption or signing/verifying operations.

- **randPrime/randPrimeAsync Performance**:
  - Prime generation is computationally intensive, especially at larger bit sizes
  - Using `randPrimeAsync` is strongly recommended for prime generation to avoid blocking the main thread
  - **[FIPS 186-5](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) Recommendations** for 1024-bit primes:
    - For an error probability of $(2^{-100})$: Use `4 iterations` of the [Miller-Rabin](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) test.
    - For an error probability of $(2^{-112})$: Use `5 iterations` of the [Miller-Rabin](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) test.
    - Consider following the [Miller-Rabin](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test) tests with a [Lucas](https://en.wikipedia.org/wiki/Lucas_primality_test) test for additional assurance, although this is not required for [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) prime generation according to [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards).

### Performance Optimization Tips

- Use `Promise.all()` with async methods when generating multiple random values
- For [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) key generation, consider using 2048-bit keys unless you have specific security requirements
- When generating large amounts of random data, use the async methods and process the data in chunks
- ~~For performance-critical applications, consider implementing caching strategies for expensive operations like prime generation~~ -> not recommended; it's better to rely on entropy from [cryptographically secure random number generators (CSPRNG)](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator).
