import { Crypto } from '../src/rand';

/**
 * Test suite comparing Crypto.rand vs Crypto.randLattice
 * 
 * This test file specifically compares the two random number generation methods
 * in terms of functionality, uniqueness, and distribution.
 */
describe('Crypto.rand vs Crypto.randLattice', () => {
  // Skip these tests in browser environments where randLattice is not available
  beforeAll(() => {
    // Skip all tests if running in browser
    if (typeof window !== 'undefined') {
      console.warn('randLattice is not available in browser environments, skipping comparison tests');
      jest.setTimeout(0); // Skip all tests
    }
  });

  describe('Basic functionality', () => {
    test('both methods should return values between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const randResult = Crypto.rand();
        const randLatticeResult = Crypto.randLattice();

        // Verify rand() results
        expect(randResult).toBeGreaterThanOrEqual(0);
        expect(randResult).toBeLessThan(1);
        expect(typeof randResult).toBe('number');

        // Verify randLattice() results
        expect(randLatticeResult).toBeGreaterThanOrEqual(0);
        expect(randLatticeResult).toBeLessThan(1);
        expect(typeof randLatticeResult).toBe('number');
      }
    });

    test('both methods should not return exactly the same value', () => {
      // This is a probabilistic test - it's extremely unlikely but not impossible
      // for both methods to return the same value
      for (let i = 0; i < 1337; i++) {
        const randResult = Crypto.rand();
        const randLatticeResult = Crypto.randLattice(1024, 16777213, 178.56, 'normalized');

        // The probability of these being exactly equal is astronomically small
        expect(randResult).not.toBe(randLatticeResult);
      }
    });
  });

  describe('Uniqueness', () => {
    test('both methods should produce high entropy results', () => {
      // Collect results from both methods
      const randResults = new Set<number>();
      const randLatticeResults = new Set<number>();
      const sampleSize = 1337;

      for (let i = 0; i < sampleSize; i++) {
        randResults.add(Crypto.rand());
        // Use optimized parameters for maximum uniqueness:
        // - Increased dimension (1024 instead of 256)
        // - Larger modulus (16777213 - a prime close to 2^24)
        // - Using sigma 178.56 with extended distribution table
        randLatticeResults.add(Crypto.randLattice(1024, 16777213, 178.56, 'normalized'));
      }

      // Calculate uniqueness percentage
      const randUniqueness = randResults.size / sampleSize;
      const randLatticeUniqueness = randLatticeResults.size / sampleSize;

      // Both should have 100% uniqueness
      expect(randUniqueness).toBeGreaterThanOrEqual(0.99);
      expect(randLatticeUniqueness).toBe(1.0); // We expect 100% uniqueness with optimized parameters

      // Log the uniqueness for reference
      console.log(`rand() uniqueness: ${(randUniqueness * 100).toFixed(2)}%`);
      console.log(`randLattice() uniqueness: ${(randLatticeUniqueness * 100).toFixed(2)}%`);
    });

    test('both methods should avoid consecutive repeats', () => {
      const sampleSize = 1337;

      // Generate sequences for both methods
      const randSequence = Array.from({ length: sampleSize }, () => Crypto.rand());
      const randLatticeSequence = Array.from({ length: sampleSize }, () => Crypto.randLattice());

      // Count consecutive repeats for rand()
      let randConsecutiveEqual = 0;
      let randMaxConsecutive = 0;

      for (let i = 1; i < randSequence.length; i++) {
        if (randSequence[i] === randSequence[i - 1]) {
          randConsecutiveEqual++;
          randMaxConsecutive = Math.max(randMaxConsecutive, randConsecutiveEqual);
        } else {
          randConsecutiveEqual = 0;
        }
      }

      // Count consecutive repeats for randLattice()
      let latticeConsecutiveEqual = 0;
      let latticeMaxConsecutive = 0;

      for (let i = 1; i < randLatticeSequence.length; i++) {
        if (randLatticeSequence[i] === randLatticeSequence[i - 1]) {
          latticeConsecutiveEqual++;
          latticeMaxConsecutive = Math.max(latticeMaxConsecutive, latticeConsecutiveEqual);
        } else {
          latticeConsecutiveEqual = 0;
        }
      }

      // Cryptographically strong output should not have many consecutive repeats
      expect(randMaxConsecutive).toBeLessThan(3);
      expect(latticeMaxConsecutive).toBeLessThan(3);

      // Log the maximum consecutive repeats for reference
      console.log(`rand() maximum consecutive repeats: ${randMaxConsecutive}`);
      console.log(`randLattice() maximum consecutive repeats: ${latticeMaxConsecutive}`);
    });
  });

  describe('Distribution', () => {
    test('both methods should produce uniformly distributed values', () => {
      const sampleSize = 10000;
      const bins = 10; // Divide [0,1) range into 10 bins

      // Initialize bin counters for both methods
      const randBins = Array(bins).fill(0);
      const latticeBins = Array(bins).fill(0);

      // Generate samples and count bin occurrences
      for (let i = 0; i < sampleSize; i++) {
        const randValue = Crypto.rand();
        const latticeValue = Crypto.randLattice();

        // Determine bin index for each value
        const randBin = Math.floor(randValue * bins);
        const latticeBin = Math.floor(latticeValue * bins);

        // Increment bin counters
        randBins[randBin]++;
        latticeBins[latticeBin]++;
      }

      // Expected count per bin for uniform distribution
      const expectedCount = sampleSize / bins;
      const allowedDeviation = 0.2; // Allow 20% deviation from expected

      // Check each bin is within acceptable deviation from expected
      for (let i = 0; i < bins; i++) {
        // Check rand() distribution
        expect(randBins[i]).toBeGreaterThanOrEqual(expectedCount * (1 - allowedDeviation));
        expect(randBins[i]).toBeLessThanOrEqual(expectedCount * (1 + allowedDeviation));

        // Check randLattice() distribution
        expect(latticeBins[i]).toBeGreaterThanOrEqual(expectedCount * (1 - allowedDeviation));
        expect(latticeBins[i]).toBeLessThanOrEqual(expectedCount * (1 + allowedDeviation));
      }

      // Log bin distributions for reference
      console.log('rand() bin distribution:', randBins);
      console.log('randLattice() bin distribution:', latticeBins);
    });

    test('both methods should provide full coverage of the [0,1) range', () => {
      const sampleSize = 10000;
      const precision = 2; // Round to 2 decimal places

      // Generate samples and track observed values
      const randObserved = new Set<number>();
      const latticeObserved = new Set<number>();

      for (let i = 0; i < sampleSize; i++) {
        // Round values to specified precision to make comparison meaningful
        const randValue = Math.floor(Crypto.rand() * (10 ** precision)) / (10 ** precision);
        const latticeValue = Math.floor(Crypto.randLattice() * (10 ** precision)) / (10 ** precision);

        randObserved.add(randValue);
        latticeObserved.add(latticeValue);
      }

      // Number of possible values at given precision
      const possibleValues = 10 ** precision;

      // Coverage percentage
      const randCoverage = randObserved.size / possibleValues;
      const latticeCoverage = latticeObserved.size / possibleValues;

      // With enough samples, we should see high coverage of possible values
      expect(randCoverage).toBeGreaterThan(0.8); // At least 80% coverage
      expect(latticeCoverage).toBeGreaterThan(0.8); // At least 80% coverage

      // Log coverage percentages for reference
      console.log(`rand() coverage: ${(randCoverage * 100).toFixed(2)}% of possible values`);
      console.log(`randLattice() coverage: ${(latticeCoverage * 100).toFixed(2)}% of possible values`);
    });
  });
});
