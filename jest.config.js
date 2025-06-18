export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const roots = ['<rootDir>/tests'];
export const testMatch = ['**/*.test.ts'];
export const collectCoverageFrom = [
  'src/**/*.ts',
  '!src/**/*.d.ts',
];
export const coverageDirectory = 'coverage';
export const coverageReporters = ['text', 'lcov', 'html'];
export const verbose = true;
export const transform = {
  '^.+\\.tsx?$': ['ts-jest', {
    tsconfig: 'tsconfig.test.json',
  }]
};
