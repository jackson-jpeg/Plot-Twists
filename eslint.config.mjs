import coreWebVitals from 'eslint-config-next/core-web-vitals';

/**
 * Added 2026-08-06 (design pass, iteration 0). The repo had no linter.
 * Blocking gate is "clean on files touched tonight" — the legacy codebase is
 * not being retro-linted; ignores below carry generated/runtime trees.
 */
const config = [
  ...coreWebVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'lib/content.ts', // generated — build-catalog.ts owns it
      'public/**',
    ],
  },
];

export default config;
