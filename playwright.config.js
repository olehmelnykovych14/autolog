// @ts-check
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * Playwright config for autolog e2e tests.
 *
 * BASE_URL: defaults to prod. Override via env: `BASE_URL=http://localhost:5173 npm run test:e2e`
 * Auth: storage state captured by e2e/auth.setup.js — login once, reuse session.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/_results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // sequential — shared test account
  retries: process.env.CI ? 2 : 0,
  workers: 1, // single worker — shared test account state
  reporter: [['html', { outputFolder: 'e2e/_report', open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'https://www.autolog.com.ua',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
  },

  projects: [
    {
      name: 'unauth',
      testMatch: /(landing|auth)\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      testIgnore: [/landing\.spec\.js/, /auth\.spec\.js/, /auth\.setup\.js/],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
