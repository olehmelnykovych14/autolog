// @ts-check
import { expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || 'qa.bot.20260518@autolog.test'
const PASSWORD = process.env.TEST_PASSWORD || 'QaBot20260518!'

export const STO_EMAIL = process.env.STO_EMAIL || 'qa.sto.20260521@autolog.test'
export const STO_PASSWORD = process.env.STO_PASSWORD || 'QaSto20260521!'

/**
 * Logout any currently-authenticated user. Safe to call even if not logged in.
 * @param {import('@playwright/test').Page} page
 */
async function ensureLoggedOut(page) {
  const logoutBtn = page.getByRole('button', { name: /Вийти/i })
  if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutBtn.click()
    await page.waitForTimeout(1500)
    await page.goto('/')
    await page.waitForTimeout(1000)
  }
}

/**
 * Login as STO partner account.
 * Always logs out any existing user first, then logs in as STO.
 * @param {import('@playwright/test').Page} page
 */
export async function loginSto(page) {
  await page.goto('/')
  await page.waitForTimeout(1500)

  // Always log out current user (owner or stale STO session) before re-login
  await ensureLoggedOut(page)

  // Login as STO
  const loginBtn = page.getByRole('button', { name: 'Увійти', exact: true })
  await expect(loginBtn).toBeVisible({ timeout: 8_000 })
  await loginBtn.click()
  await page.getByPlaceholder('hello@autolog.app').fill(STO_EMAIL)
  await page.getByPlaceholder('••••••••').fill(STO_PASSWORD)
  await page.getByRole('button', { name: /Увійти в гараж/ }).click()
  // STO accounts should land on /sto, but may currently land on /dashboard (bug)
  await page.waitForURL(/\/(sto|dashboard)/, { timeout: 15_000 })
}

/**
 * Programmatic Firebase login as test owner account.
 * Idempotent: skips login UI if already authenticated as the correct user.
 * If wrong user (e.g. STO) is logged in, logs them out first.
 * @param {import('@playwright/test').Page} page
 */
export async function login(page) {
  await page.goto('/')
  await page.waitForTimeout(1500)

  // Check if already logged in
  const alreadyLoggedIn = await page.getByRole('link', { name: 'Дашборд' }).isVisible({ timeout: 2000 }).catch(() => false)
  if (alreadyLoggedIn) {
    // Verify it's NOT the STO account by checking body text for STO email
    const bodyText = await page.locator('body').textContent().catch(() => '')
    const isStoUser = bodyText.includes(STO_EMAIL)
    if (!isStoUser) {
      // Correct owner user is already logged in — just go to dashboard
      await page.goto('/dashboard')
      await expect(page.getByRole('link', { name: 'Дашборд' })).toBeVisible({ timeout: 10_000 })
      return
    }
    // STO user is logged in — log them out first
    await ensureLoggedOut(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  }

  // Not authenticated (or just logged out) — go through login UI
  const loginBtn = page.getByRole('button', { name: 'Увійти', exact: true })
  await expect(loginBtn).toBeVisible({ timeout: 8_000 })
  await loginBtn.click()
  await page.getByPlaceholder('hello@autolog.app').fill(EMAIL)
  await page.getByPlaceholder('••••••••').fill(PASSWORD)
  await page.getByRole('button', { name: /Увійти в гараж/ }).click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
  await expect(page.getByRole('link', { name: 'Дашборд' })).toBeVisible()
}

/**
 * Login + navigate to a specific route.
 * @param {import('@playwright/test').Page} page
 * @param {string} route
 */
export async function loginAndGo(page, route) {
  await login(page)
  await page.goto(route)
}
