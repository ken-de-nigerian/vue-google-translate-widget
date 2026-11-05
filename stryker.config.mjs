// Mutation testing: Stryker changes the source in small ways (flips a condition, removes a call, swaps a value) and
// checks that some test fails. A mutant that survives is behaviour no test pins down. Run with `npm run test:mutation`;
// the HTML report lands in reports/mutation/.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: [
    'src/core/**/*.ts',
    'src/composables/**/*.ts',
    'src/server/**/*.ts',
    'src/directives/**/*.ts',
    'src/plugin.ts',
  ],
  reporters: ['clear-text', 'progress', 'html'],
  coverageAnalysis: 'perTest',
  concurrency: 4,
  timeoutMS: 15000,
  thresholds: { high: 90, low: 80, break: 90 }, // 92.6% on 2026-11-05; the weekly job fails below 90
}
