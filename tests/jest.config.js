export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/../backend/$1',
  },
  rootDir: '.',
  testMatch: [
    '<rootDir>/unit/backend/**/*.test.js',
    '<rootDir>/integration/backend/**/*.test.js',
    '<rootDir>/backend/**/*.test.js'
  ],
  globalSetup: '<rootDir>/backend/globalSetup.js',
  globalTeardown: '<rootDir>/backend/globalTeardown.js',
};
