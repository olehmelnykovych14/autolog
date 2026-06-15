import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Shared no-unused-vars: ignore PascalCase/UPPER vars (components, constants),
// _-prefixed args, and unused catch bindings (caughtErrors: none).
const noUnusedVars = [
  'error',
  { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' },
]

export default defineConfig([
  // Build artifacts, vendored copies and scratch tooling are not linted.
  globalIgnores(['dist', 'dev-dist', 'dist-ssr', 'coverage', 'scripts', '.claude', '.gstack']),

  // Web app: browser + React, ES modules.
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': noUnusedVars,
      // Opinionated hook rules kept visible but non-blocking: each flagged case
      // needs individual review (deps can introduce loops, effect-setState is
      // sometimes the right prop-sync pattern), not a blind auto-fix.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // Common.jsx intentionally mixes shared components and helpers (inp_cls,
      // Field). Fast-refresh DX only, no correctness impact -> warn, not error.
      'react-refresh/only-export-components': 'warn',
    },
  },

  // Vitest test files: browser app tests run in jsdom and use Vitest globals.
  {
    files: ['src/**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },

  // Root config files and Playwright e2e: Node + browser (page.evaluate runs
  // browser code), ES modules.
  {
    files: ['*.config.js', 'e2e/**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': noUnusedVars,
    },
  },

  // Telegram bot server runtime: Node, CommonJS.
  {
    files: ['bot-server/**/*.js'],
    ignores: ['bot-server/**/*.{test,spec}.js', 'bot-server/*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': noUnusedVars,
    },
  },

  // Bot server tests and config: Node, ES modules, Vitest globals.
  {
    files: ['bot-server/**/*.{test,spec}.js', 'bot-server/*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': noUnusedVars,
    },
  },
])
