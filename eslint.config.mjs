// The brief specifies wrapping 'next/core-web-vitals' with FlatCompat (the pattern
// Next.js docs used while eslint-config-next still shipped a legacy-.eslintrc-shaped
// config). With the versions actually installed here (eslint-config-next@16.2.12,
// eslint@9.39.5, @eslint/eslintrc@3.3.6), eslint-config-next's `core-web-vitals` export
// is already a flat-config array (see node_modules/eslint-config-next/dist/core-web-vitals.js:
// `module.exports = [...require('./index'), require('@next/eslint-plugin-next').configs['core-web-vitals']]`).
// FlatCompat.extends()/.config() try to normalize whatever they resolve as a *legacy*
// shareable config, so feeding them this already-flat array (whose `plugins` values are
// resolved plugin objects, not string names) throws
// `TypeError: Converting circular structure to JSON` from
// @eslint/eslintrc's ConfigValidator every time -- reproduced via
// `compat.extends('next/core-web-vitals')`, `compat.extends('eslint-config-next/core-web-vitals')`,
// and `compat.config({ extends: [...] })` alike. This is the config shape Next.js's own
// current docs recommend for ESLint 9 flat config, and it's the only one that actually
// runs against this dependency set.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
    ],
  },
]

export default eslintConfig
