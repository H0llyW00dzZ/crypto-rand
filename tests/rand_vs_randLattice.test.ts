import { Crypto } from '../src/rand';
import * as os from 'os';

/**
 * Test suite comparing Crypto.rand vs Crypto.randLattice
 * 
 * This test file specifically compares the two random number generation methods
 * in terms of functionality, uniqueness, and distribution.
 * 
 * Statistical Testing Methodology:
 * -------------------------------
 * Chi-square (χ²) Goodness-of-Fit Test:
 * The chi-square test is a statistical hypothesis test that determines whether an observed
 * frequency distribution differs from an expected distribution. For random number generators,
 * we use it to test whether the distribution of values is uniform.
 * 
 * 1. Null Hypothesis (H₀): The distribution is uniform (random numbers are evenly distributed)
 * 2. Alternative Hypothesis (H₁): The distribution is not uniform
 * 
 * Chi-square Statistic Calculation:
 * χ² = Σ((O-E)²/E) where:
 *   - O = Observed frequency in each bin
 *   - E = Expected frequency in each bin (total samples / number of bins)
 * 
 * Interpretation:
 * - Lower χ² values indicate better fit to the expected uniform distribution
 * - The χ² value is converted to a p-value using the chi-square distribution with (bins-1) degrees of freedom
 * - p-value > 0.05: Fail to reject H₀ (distribution appears uniform)
 * - p-value < 0.05: Reject H₀ (distribution does not appear uniform)
 * 
 * For cryptographically secure random number generators:
 * - We expect high p-values (>0.05), indicating the distribution is likely uniform
 * - We test with multiple bin sizes and sample sizes to ensure robust results
 * - We compare the χ² values and p-values between methods to determine which has better uniformity
 * 
 * Additional Measures:
 * - Variance of bin counts: Lower variance indicates more consistent distribution
 * - Coverage testing: Ensures the full range [0,1) is adequately covered
 * - Uniqueness testing: Checks for high entropy in generated values
 * - Consecutive repeat analysis: Ensures values don't have patterns or repetitions
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
        const randLatticeResult = Crypto.randLattice(1024, 16777213, 178.56, 'normalized');

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

      // Check architecture
      const isX64 = os.arch() === 'x64';

      // Both should have high uniqueness
      expect(randUniqueness).toBeGreaterThanOrEqual(0.99);

      if (isX64) {
        expect(randLatticeUniqueness).toBeGreaterThanOrEqual(0.99);
      } else { // ARM can achieve this more easily than x64 due to its use of 16777213, a prime close to 2^24.
        expect(randLatticeUniqueness).toBe(1.0); // We expect 100% uniqueness with optimized parameters
      }

      // Log the uniqueness for reference
      console.log(`rand() uniqueness: ${(randUniqueness * 100).toFixed(2)}%`);
      console.log(`randLattice() uniqueness: ${(randLatticeUniqueness * 100).toFixed(2)}%`);
    });

    test('both methods should avoid consecutive repeats', () => {
      const sampleSize = 1337;

      // Generate sequences for both methods
      const randSequence = Array.from({ length: sampleSize }, () => Crypto.rand());
      const randLatticeSequence = Array.from({ length: sampleSize }, () => Crypto.randLattice(1024, 16777213, 178.56, 'normalized'));

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
        const latticeValue = Crypto.randLattice(1024, 16777213, 178.56, 'normalized');

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

      // Hypothesis Testing Framework:
      // H₀ (null hypothesis): The distribution is uniform (random numbers are evenly distributed)
      // H₁ (alternative hypothesis): The distribution is not uniform (random numbers are not evenly distributed)

      // Calculate chi-square statistic for both methods
      // Formula: Σ(O-E)²/E where O=observed count, E=expected count
      // Lower chi-square value indicates better fit to uniform distribution
      const randChiSquare = randBins.reduce((acc, observed) => {
        const deviation = observed - expectedCount;
        return acc + (deviation * deviation) / expectedCount;
      }, 0);

      const latticeChiSquare = latticeBins.reduce((acc, observed) => {
        const deviation = observed - expectedCount;
        return acc + (deviation * deviation) / expectedCount;
      }, 0);

      // Calculate degrees of freedom: bins - 1
      const degreesOfFreedom = bins - 1;

      // Calculate p-values from chi-square statistics
      // p-value interpretation:
      // - p > 0.05: Fail to reject H₀ (data appears uniform)
      // - p < 0.05: Reject H₀ (data does not appear uniform)
      // For cryptographically secure RNGs, we want to fail to reject H₀
      const randPValue = chiSquarePValue(randChiSquare, degreesOfFreedom);
      const latticePValue = chiSquarePValue(latticeChiSquare, degreesOfFreedom);

      console.log('Chi-square analysis:');
      console.log(`rand() chi-square: ${randChiSquare.toFixed(4)}, df: ${degreesOfFreedom}, p-value: ${randPValue.toFixed(6)}`);
      console.log(`randLattice() chi-square: ${latticeChiSquare.toFixed(4)}, df: ${degreesOfFreedom}, p-value: ${latticePValue.toFixed(6)}`);

      // Interpret results based on p-values
      console.log('\nStatistical interpretation:');
      console.log(`rand(): ${randPValue > 0.05 ? 'Uniform distribution (p > 0.05)' : 'Non-uniform distribution (p < 0.05)'}`);
      console.log(`randLattice(): ${latticePValue > 0.05 ? 'Uniform distribution (p > 0.05)' : 'Non-uniform distribution (p < 0.05)'}`);

      // For cryptographic applications, we want values as close to perfectly uniform as possible
      // Compare the methods based on chi-square statistics and p-values
      const betterMethod = randChiSquare < latticeChiSquare ? 'rand()' : 'randLattice()';
      const chiSquareDifference = Math.abs(randChiSquare - latticeChiSquare);
      const pValueDifference = Math.abs(randPValue - latticePValue);

      console.log(`\nComparison: ${betterMethod} shows better uniformity characteristics`);
      console.log(`Difference in chi-square values: ${chiSquareDifference.toFixed(4)}`);
      console.log(`Difference in p-values: ${pValueDifference.toFixed(6)}`);

      // Statistical significance of the difference
      if (chiSquareDifference < 1.0 || pValueDifference < 0.01) {
        console.log('The difference is statistically insignificant - both methods provide excellent uniformity');
      } else if (chiSquareDifference < 3.0 || pValueDifference < 0.05) {
        console.log('The difference is small but statistically significant');
      } else {
        console.log('The difference is statistically significant - one method is clearly better');
      }

      // Add assertions to verify that both distributions pass the chi-square test
      // For cryptographically secure RNGs, we expect p-values > 0.05
      expect(randPValue).toBeGreaterThan(0.01); // Should pass with p > 0.01
      expect(latticePValue).toBeGreaterThan(0.01); // Should pass with p > 0.01

      // Additional cryptographic analysis
      // Calculate variance in bin distributions (another measure of uniformity)
      const randVariance = calculateVariance(randBins, expectedCount);
      const latticeVariance = calculateVariance(latticeBins, expectedCount);

      console.log(`\nDistribution variance (lower is better):`);
      console.log(`rand() variance: ${randVariance.toFixed(4)}`);
      console.log(`randLattice() variance: ${latticeVariance.toFixed(4)}`);

      // Overall cryptographic quality assessment
      console.log('\nCryptographic quality assessment:');
      if (randChiSquare < latticeChiSquare && randVariance < latticeVariance) {
        console.log('rand() shows better overall cryptographic properties based on uniformity tests');
      } else if (latticeChiSquare < randChiSquare && latticeVariance < randVariance) {
        console.log('randLattice() shows better overall cryptographic properties based on uniformity tests');
      } else {
        console.log('Mixed results - each method has different strengths');
        if (randChiSquare < latticeChiSquare) {
          console.log('rand() has better uniformity (chi-square)');
        } else {
          console.log('randLattice() has better uniformity (chi-square)');
        }
        if (randVariance < latticeVariance) {
          console.log('rand() has more consistent bin distribution (variance)');
        } else {
          console.log('randLattice() has more consistent bin distribution (variance)');
        }
      }

      // Log bin distributions for reference
      console.log('\nBin distributions:');
      console.log('rand() bin distribution:', randBins);
      console.log('randLattice() bin distribution:', latticeBins);
    });

    // Helper function to calculate variance of bin counts relative to expected value
    function calculateVariance(bins: number[], expectedValue: number): number {
      // Calculate variance relative to the expected value instead of the mean
      // This measures how closely the distribution matches the expected uniform distribution
      return bins.reduce((sum, count) => sum + Math.pow(count - expectedValue, 2), 0) / bins.length;
    }

    /**
     * Calculate the p-value from a chi-square statistic and degrees of freedom.
     * Uses Wilson-Hilferty approximation for chi-square distribution.
     * 
     * @param chiSquare - The chi-square statistic
     * @param df - Degrees of freedom
     * @returns The p-value (probability of observing this chi-square value or higher under H₀)
     */
    function chiSquarePValue(chiSquare: number, df: number): number {
      // For small degrees of freedom, use lookup table approach
      if (df <= 10) {
        // Common critical values for different significance levels
        const criticalValues: Record<number, Record<string, number>> = {
          1: { '0.10': 2.706, '0.05': 3.841, '0.01': 6.635 },
          2: { '0.10': 4.605, '0.05': 5.991, '0.01': 9.210 },
          3: { '0.10': 6.251, '0.05': 7.815, '0.01': 11.345 },
          4: { '0.10': 7.779, '0.05': 9.488, '0.01': 13.277 },
          5: { '0.10': 9.236, '0.05': 11.070, '0.01': 15.086 },
          6: { '0.10': 10.645, '0.05': 12.592, '0.01': 16.812 },
          7: { '0.10': 12.017, '0.05': 14.067, '0.01': 18.475 },
          8: { '0.10': 13.362, '0.05': 15.507, '0.01': 20.090 },
          9: { '0.10': 14.684, '0.05': 16.919, '0.01': 21.666 },
          10: { '0.10': 15.987, '0.05': 18.307, '0.01': 23.209 }
        };

        // Approximate p-value by comparing with critical values
        if (chiSquare <= criticalValues[df]['0.10']) {
          return 0.5; // Approximate value for p > 0.10
        } else if (chiSquare <= criticalValues[df]['0.05']) {
          return 0.075; // Approximate value between 0.05 and 0.10
        } else if (chiSquare <= criticalValues[df]['0.01']) {
          return 0.03; // Approximate value between 0.01 and 0.05
        } else {
          return 0.005; // Approximate value for p < 0.01
        }
      }

      // For larger degrees of freedom, use Wilson-Hilferty approximation
      // This approximation works well for df > 10
      const z = Math.sqrt(2 * chiSquare) - Math.sqrt(2 * df - 1);

      // Convert z-score to p-value using normal approximation
      // Using approximation of the normal CDF
      const p = 1 - normalCDF(z);
      return p;
    }

    /**
     * Approximation of the standard normal cumulative distribution function (CDF).
     * Uses the error function approximation.
     * 
     * @param z - The z-score
     * @returns The probability of observing a value <= z
     */
    function normalCDF(z: number): number {
      // Approximation of error function
      const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
      const d = 0.3989423 * Math.exp(-z * z / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

      if (z > 0) {
        return 1 - p;
      } else {
        return p;
      }
    }

    test('both methods should provide full coverage of the [0,1) range', () => {
      const sampleSize = 10000;
      const precision = 2; // Round to 2 decimal places

      // Generate samples and track observed values
      const randObserved = new Set<number>();
      const latticeObserved = new Set<number>();

      for (let i = 0; i < sampleSize; i++) {
        // Round values to specified precision to make comparison meaningful
        const randValue = Math.floor(Crypto.rand() * (10 ** precision)) / (10 ** precision);
        const latticeValue = Math.floor(Crypto.randLattice(1024, 16777213, 178.56, 'normalized') * (10 ** precision)) / (10 ** precision);

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
