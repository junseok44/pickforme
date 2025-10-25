module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts', // 추가
    '**/*.test.ts',
    '**/*.spec.ts', // 추가
  ],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^env$': '<rootDir>/src/env.ts',
    '^models$': '<rootDir>/src/models',
    '^models/(.*)$': '<rootDir>/src/models/$1',
    '^utils$': '<rootDir>/src/utils',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    '^scheduler$': '<rootDir>/src/scheduler',
    '^scheduler/(.*)$': '<rootDir>/src/scheduler/$1',
    '^socket$': '<rootDir>/src/socket.ts',
    '^socket/(.*)$': '<rootDir>/src/socket.ts',
    '^middleware$': '<rootDir>/src/middleware',
    '^middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^services$': '<rootDir>/src/services',
    '^services/(.*)$': '<rootDir>/src/services/$1',
    '^feature/(.*)$': '<rootDir>/src/feature/$1',
  },
  verbose: true,
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '**/__tests__/**/*.unit.test.ts',
        '**/__tests__/**/*.unit.spec.ts', // 추가
        '**/__tests__/**/*.spec.ts', // 추가
      ],
      setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
      moduleNameMapper: {
        '^env$': '<rootDir>/src/env.ts',
        '^models$': '<rootDir>/src/models',
        '^models/(.*)$': '<rootDir>/src/models/$1',
        '^utils$': '<rootDir>/src/utils',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
        '^scheduler$': '<rootDir>/src/scheduler',
        '^scheduler/(.*)$': '<rootDir>/src/scheduler/$1',
        '^socket$': '<rootDir>/src/socket.ts',
        '^socket/(.*)$': '<rootDir>/src/socket.ts',
        '^middleware$': '<rootDir>/src/middleware',
        '^middleware/(.*)$': '<rootDir>/src/middleware/$1',
        '^services$': '<rootDir>/src/services',
        '^services/(.*)$': '<rootDir>/src/services/$1',
        '^cache$': '<rootDir>/src/cache',
        '^cache/(.*)$': '<rootDir>/src/cache/$1',
        '^feature/(.*)$': '<rootDir>/src/feature/$1',
      },
    },
    {
      displayName: 'integration',
      testMatch: [
        '**/__tests__/**/*.integration.test.ts',
        '**/__tests__/**/*.integration.spec.ts', // 추가
      ],
      setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
      moduleNameMapper: {
        '^env$': '<rootDir>/src/env.ts',
        '^models$': '<rootDir>/src/models',
        '^models/(.*)$': '<rootDir>/src/models/$1',
        '^utils$': '<rootDir>/src/utils',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
        '^scheduler$': '<rootDir>/src/scheduler',
        '^scheduler/(.*)$': '<rootDir>/src/scheduler/$1',
        '^socket$': '<rootDir>/src/socket.ts',
        '^socket/(.*)$': '<rootDir>/src/socket.ts',
        '^middleware$': '<rootDir>/src/middleware',
        '^middleware/(.*)$': '<rootDir>/src/middleware/$1',
        '^services$': '<rootDir>/src/services',
        '^services/(.*)$': '<rootDir>/src/services/$1',
        '^cache$': '<rootDir>/src/cache',
        '^cache/(.*)$': '<rootDir>/src/cache/$1',
        '^feature/(.*)$': '<rootDir>/src/feature/$1',
      },
    },
  ],
};
