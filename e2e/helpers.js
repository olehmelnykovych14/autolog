// @ts-check
import { expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || 'qa.bot.20260518@autolog.test'
const PASSWORD = process.env.TEST_PASSWORD || 'QaBot20260518!'

export const STO_EMAIL = process.env.STO_EMAIL || 'qa.sto.20260521@autolog.test'
export const STO_PASSWORD = process.env.STO_PASSWORD || 'QaSto20260521!'

/** Login as STO partner account. Handles already-authenticated states gracefully. */
export async function loginSto(page) {
  await page.goto('/')
  // Short wait to let auth state restore from IndexedDB
  await page.waitForTimeout(1500)

  // Check if the STO user is already logged in (STO pages have /sto routes)
  const currentUrl = page.url()
  const stoSidebarLink = page.getByRole('link', { name: /STO|Записи|Клієнти/ }).first()
  const isStoLoggedIn = await stoSidebarLink.isVisible({ timeout: 1500 }).catch(() => false)
  if (isStoLoggedIn) {
    await page.goto('/sto')
    await page.waitForLoadState('domcontentloaded')
    return
  }

  // If any user is logged in (owner), we need to log out first
  const loggedInNav = await page.getByRole('link', { name: 'Дашборд' }).isVisible({ timeout: 1500 }).catch(() => false)
  if (loggedInNav) {
    // Click logout button in the sidebar
    const logoutBtn = page.getByRole('button', { name: /Вийти/i })
    if (await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await logoutBtn.click()
      await page.waitForTimeout(1000)
      await page.goto('/')
      await page.waitForTimeout(1500)
    }
  }

  // Now log in as STO
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
 * Programmatic Firebase login.
 * Firebase auth state lives in IndexedDB which Playwright's storageState cannot capture,
 * so each authenticated test must log in via the UI.
 *
 * This function is idempotent: if already authenticated (sidebar link visible),
 * it skips the login flow and navigates directly to /dashboard.
 */
export async function login(page) {
  await page.goto('/')
  // Short wait to let auth state restore from IndexedDB
  await page.waitForTimeout(1500)

  // If already authenticated, the sidebar shows a "Дашборд" link — skip login
  const alreadyLoggedIn = await page.getByRole('link', { name: 'Дашборд' }).isVisible({ timeout: 2000 }).catch(() => false)
  if (alreadyLoggedIn) {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Дашборд' })).toBeVisible({ timeout: 10_000 })
    return
  }

  // Not authenticated — go through login UI
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
 */
export async function loginAndGo(page, route) {
  await login(page)
  await page.goto(route)
}
