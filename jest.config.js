export const testEnvironment = 'node';
export const testMatch = ['**/*.test.ts'];
export const transform = {
  '^.+\\.tsx?$': 'babel-jest'
};
export const projects = [
  {
    displayName: 'node',
    testEnvironment: 'node',
    // More specific testMatch to exclude browser tests
    testMatch: ['<rootDir>/tests/*.test.ts', '<rootDir>/tests/!(browser)/**/*.test.ts'],
  },
  {
    displayName: 'browser',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/tests/browser/**/*.test.ts'],
  }
];
