/** @type {import('ts-jest').JestConfigWithTsJest} */

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  watchman: false,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.svg\\?raw$': '<rootDir>/src/test-utils/svgRawStub.ts',
    '\\.(png|jpe?g|webp|gif)\\?url$': '<rootDir>/src/test-utils/assetUrlStub.ts',
  }
};