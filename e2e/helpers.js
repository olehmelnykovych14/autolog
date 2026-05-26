// @ts-check
import { expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || 'qa.bot.20260518@autolog.test'
const PASSWORD = process.env.TEST_PASSWORD || 'QaBot20260518!'

export const STO_EMAIL = process.env.STO_EMAIL || 'qa.sto.20260521@autolog.test'
export const STO_PASSWORD = process.env.STO_PASSWORD || 'QaSto20260521!'

/**
 * Read the app's localStorage auth hint.
 * The app sets 'al_authed'='1' when logged in and 'al_profile_type'='sto'|'owner'.
 * Returns { authed: boolean, profileType: 'sto'|'owner'|null }
 * @param {import('@playwright/test').Page} page
 */
async function getLocalAuthHint(page) {
  try {
    const result = await page.evaluate(() => ({
      authed: localStorage.getItem('al_authed') === '1',
      profileType: localStorage.getItem('al_profile_type'), // 'sto' | 'owner' | null
    }))
    return result
  } catch {
    return { authed: false, profileType: null }
  }
}

/**
 * Logout by clicking the sidebar Вийти button.
 * Assumes we're already on an authenticated app page.
 * @param {import('@playwright/test').Page} page
 */
async function clickLogout(page) {
  const logoutBtn = page.getByRole('button', { name: /Вийти/i })
  if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutBtn.click()
    await page.waitForTimeout(1500)
  }
}

/**
 * Login as STO partner account.
 *
 * Uses localStorage 'al_authed' + 'al_profile_type' to detect current auth state
 * without any extra navigation. This avoids disrupting the page state.
 * @param {import('@playwright/test').Page} page
 */
export async function loginSto(page) {
  const { authed, profileType } = await getLocalAuthHint(page)

  if (authed && profileType === 'sto') {
    // STO already logged in — navigate to /sto and done
    await page.goto('/sto')
    await page.waitForLoadState('domcontentloaded')
    return
  }

  if (authed && profileType === 'owner') {
    // Owner is logged in — logout first, then re-login as STO
    await clickLogout(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  } else if (!authed) {
    // Nobody logged in — ensure on landing page
    const url = page.url()
    if (!url.includes('localhost')) {
      await page.goto('/')
      await page.waitForTimeout(500)
    }
    // If already on landing, the login button should be visible
    const isOnApp = url.includes('/dashboard') || url.includes('/sto') || url.includes('/garage')
    if (!isOnApp) {
      // We might be mid-navigation — go to landing to be safe
      await page.goto('/')
      await page.waitForTimeout(500)
    }
  }

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
 *
 * Uses localStorage 'al_authed' + 'al_profile_type' to detect current auth state
 * without any extra navigation. Idempotent.
 * @param {import('@playwright/test').Page} page
 */
export async function login(page) {
  const { authed, profileType } = await getLocalAuthHint(page)

  if (authed && profileType === 'owner') {
    // Already authenticated as owner — navigate to dashboard and done
    await page.goto('/dashboard')
    return
  }

  if (authed && profileType === 'sto') {
    // STO is logged in — we need to logout and re-login as owner
    await clickLogout(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  } else {
    // Not authenticated — go to landing
    await page.goto('/')
    await page.waitForTimeout(500)
  }

  // Perform owner login
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
