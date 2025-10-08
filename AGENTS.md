# Agent Guidelines for crypto-rand

## Build/Test/Lint Commands
- Build: `npm run build`
- Test all: `npm test` (runs both browser and node tests)
- Test single file: `jest tests/crypto.test.ts` or `jest tests/browser/crypto.browser.test.ts`
- Test node only: `npm run test:node`
- Test browser only: `npm run test:browser`
- No lint/typecheck commands configured

## Code Style
- TypeScript with strict mode enabled (target: ES2020, module: CommonJS)
- Use Node.js `crypto` module imports: `import * as crypto from 'crypto'`
- Browser compatibility required: check environment with private static methods `isBrowser()`, `hasWebCrypto()`
- Throw descriptive errors for unsupported environments (see `throwBrowserError`)
- Export patterns: named exports for classes/functions, re-export from index (`crypto_rand.ts`)
- Use `promisify` from 'util' for async versions of crypto methods
- Method naming: sync methods (e.g., `rand()`), async methods with `Async` suffix (e.g., `randAsync()`)
- JSDoc comments required for public methods with clear descriptions
- Validation: throw Error with descriptive messages for invalid inputs (e.g., 'min must be less than max')
- Constants: use UPPERCASE_WITH_UNDERSCORES naming (see `const.ts`)
- Type annotations: explicit return types on all methods
- Cross-platform: support both Node.js (≥19.0.0) and browser (Web Crypto API) environments
