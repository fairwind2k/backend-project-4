// jest.config.js
const config = {
  testEnvironment: 'node',

  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
  ],

  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  testTimeout: 5000,

  verbose: true,
}

export default config
