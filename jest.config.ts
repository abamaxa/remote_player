/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  clearMocks: true,
  coverageProvider: "v8",
  preset: "ts-jest"
};


// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {

  testEnvironment: 'jest-environment-jsdom',
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
}
