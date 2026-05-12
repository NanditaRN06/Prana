export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/backend/$1',
    '^mongoose$': '<rootDir>/backend/node_modules/mongoose',
  },
  rootDir: '..',
  roots: ['<rootDir>/tests', '<rootDir>/backend'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  testMatch: [
    '<rootDir>/tests/unit/backend/**/*.test.js',
    '<rootDir>/tests/integration/backend/**/*.test.js',
    '<rootDir>/tests/e2e/backend/**/*.test.js',
    '<rootDir>/tests/system/backend/**/*.test.js'
  ],
  collectCoverageFrom: [
    '<rootDir>/backend/**/*.js',
    '!<rootDir>/backend/node_modules/**',
    '!<rootDir>/backend/eslint.config.mjs',
    '!<rootDir>/backend/templates/**'
  ],
  coverageDirectory: 'tests/coverage/backend',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
