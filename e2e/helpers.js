// @ts-check
import { expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || 'qa.bot.20260518@autolog.test'
const PASSWORD = process.env.TEST_PASSWORD || 'QaBot20260518!'

/**
 * Programmatic Firebase login.
 * Firebase auth state lives in IndexedDB which Playwright's storageState cannot capture,
 * so each authenticated test must log in via the UI.
 */
export async function login(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Увійти', exact: true }).click()
  await page.getByPlaceholder('hello@autolog.app').fill(EMAIL)
  await page.getByPlaceholder('••••••••').fill(PASSWORD)
  await page.getByRole('button', { name: /Увійти в гараж/ }).click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
  await expect(page.getByRole('link', { name: 'Дашборд' })).toBeVisible()
}

/**
 * Login + navigate to a specific route.
 */
export async function loginAndGo(page, route) {
  await login(page)
  await page.goto(route)
}
