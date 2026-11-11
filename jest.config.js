/**
 * NestJS 12 se publica como ESM y el proyecto compila a CommonJS.
 * Esos paquetes de node_modules también pasan por el transformador (ver test/support).
 */
const esmPackages = ['@nestjs'];

/** @type {import('jest').Config} */
const base = {
  testEnvironment: 'node',
  rootDir: '.',
  transform: {
    '^.+\\.(t|j)s$': [
      '<rootDir>/test/support/setup/jest-esm-transformer.js',
      { tsconfig: 'tsconfig.json' },
    ],
  },
  transformIgnorePatterns: [`node_modules/(?!(${esmPackages.join('|')})/)`],
  // Los mismos alias que tsconfig.json (paths, relativos a baseUrl: src).
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
};

module.exports = {
  projects: [
    { ...base, displayName: 'unit', testMatch: ['<rootDir>/src/**/*.spec.ts'] },
  ],
};
