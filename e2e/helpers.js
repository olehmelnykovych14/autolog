// @ts-check
import { expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || 'qa.bot.20260518@autolog.test'
const PASSWORD = process.env.TEST_PASSWORD || 'QaBot20260518!'

export const STO_EMAIL = process.env.STO_EMAIL || 'qa.sto.20260521@autolog.test'
export const STO_PASSWORD = process.env.STO_PASSWORD || 'QaSto20260521!'

/**
 * Check if a user is currently authenticated by navigating to /dashboard.
 * Returns true if /dashboard loads without redirect to login.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
async function isAuthenticated(page) {
  await page.goto('/dashboard')
  // Give Firebase IndexedDB auth state time to restore (up to 5s)
  try {
    await page.waitForURL(/\/(dashboard)/, { timeout: 5000 })
    return true
  } catch {
    // Redirected away from /dashboard — not authenticated
    return false
  }
}

/**
 * Logout any currently-authenticated user. Safe to call even if not logged in.
 * @param {import('@playwright/test').Page} page
 */
async function ensureLoggedOut(page) {
  const loggedIn = await isAuthenticated(page)
  if (!loggedIn) return // already unauthenticated

  const logoutBtn = page.getByRole('button', { name: /Вийти/i })
  if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutBtn.click()
    await page.waitForTimeout(2000)
  }
  await page.goto('/')
  await page.waitForTimeout(1000)
}

/**
 * Login as STO partner account.
 * Always logs out any existing user first, then logs in as STO.
 * @param {import('@playwright/test').Page} page
 */
export async function loginSto(page) {
  await ensureLoggedOut(page)

  // Navigate to landing to access login modal
  await page.goto('/')
  await page.waitForTimeout(1000)

  // Login as STO
  const loginBtn = page.getByRole('button', { name: 'Увійти', exact: true })
  await expect(loginBtn).toBeVisible({ timeout: 8_000 })
  await loginBtn.click()
  await page.getByPlaceholder('hello@autolog.app').fill(STO_EMAIL)
  await page.getByPlaceholder('••••••••').fill(STO_PASSWORD)
  await page.getByRole('button', { name: /Увійти в гараж/ }).click()
  // STO accounts should land on /sto, but may currently land on /dashboard (bug)
  await page.waitForURL(/\/(sto|dashboard)/, { timeout: 20_000 })
}

/**
 * Programmatic Firebase login as test owner account.
 * Idempotent: probes /dashboard to detect auth state.
 * If already authenticated as owner, returns immediately.
 * If STO user is logged in, logs them out and re-authenticates as owner.
 * @param {import('@playwright/test').Page} page
 */
export async function login(page) {
  const loggedIn = await isAuthenticated(page)

  if (loggedIn) {
    // Check if it might be STO (their email shows in body text on /dashboard)
    const bodyText = await page.locator('body').textContent().catch(() => '')
    if (!bodyText.includes(STO_EMAIL)) {
      // Owner is already authenticated — done
      return
    }
    // STO user — log them out
    await ensureLoggedOut(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  }

  // Not authenticated — perform full login flow
  // /dashboard redirect brings us to landing or /login
  const currentUrl = page.url()
  if (!currentUrl.includes('/') || currentUrl.includes('/login')) {
    await page.goto('/')
    await page.waitForTimeout(500)
  }

  const loginBtn = page.getByRole('button', { name: 'Увійти', exact: true })
  await expect(loginBtn).toBeVisible({ timeout: 8_000 })
  await loginBtn.click()
  await page.getByPlaceholder('hello@autolog.app').fill(EMAIL)
  await page.getByPlaceholder('••••••••').fill(PASSWORD)
  await page.getByRole('button', { name: /Увійти в гараж/ }).click()
  await page.waitForURL('**/dashboard', { timeout: 20_000 })
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
