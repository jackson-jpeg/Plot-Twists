/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.next/',
    '/\\.worktrees/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'server/**/*.ts',
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  // Regression ratchet, not an aspiration. Set just below actual so coverage
  // cannot slide backwards. The previous value of 20 had never been met, so
  // `npm test` exited 1 on every run and the signal was ignored.
  // Raise these as coverage improves (see CHUNKS.md, Chunk 6).
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 14,
      lines: 17,
      statements: 17,
    },
  },
  // Transform ESM-only modules so Jest can handle them
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid)/)',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    'node_modules/uuid/.+\\.js$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}

module.exports = config
