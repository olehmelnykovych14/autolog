// @ts-check
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('Authenticated navigation', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  const routes = [
    { url: '/dashboard', heading: /Дашборд|Мій дашборд/ },
    { url: '/garage', heading: /Мій гараж/ },
    { url: '/service', heading: /Сервіс|історія/i },
    { url: '/bookings', heading: /Запис на СТО/ },
    { url: '/ai', heading: /AI Mechanic|AI Механік/ },
    { url: '/team', heading: /Команда/ },
    { url: '/settings', heading: /Налаштування/ },
  ]

  for (const { url, heading } of routes) {
    test(`route ${url} loads with expected heading`, async ({ page }) => {
      await page.goto(url)
      await expect(page.locator('body')).toContainText(heading, { timeout: 8000 })
    })
  }

  test('BUG #15: /ai-mechanic alias redirects to /dashboard instead of /ai', async ({ page }) => {
    await page.goto('/ai-mechanic')
    await page.waitForTimeout(2000)
    // Either correctly redirects to /ai OR stays on /ai-mechanic (good).
    // Currently silently redirects to /dashboard (bad).
    expect(page.url()).not.toMatch(/\/dashboard$/)
  })

  test('BUG #15: /service-booking alias redirects to /dashboard instead of /bookings', async ({ page }) => {
    await page.goto('/service-booking')
    await page.waitForTimeout(2000)
    expect(page.url()).not.toMatch(/\/dashboard$/)
  })

  test('BUG #3: 404 route shows error page, not landing', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-42')
    await page.waitForTimeout(2000)
    // Should show 404 page, not landing or dashboard
    const has404 = await page.locator('text=/404|не знайдено|not found/i').count()
    expect(has404, 'No 404 page for unknown routes (BUG #3)').toBeGreaterThan(0)
  })

  test('sidebar navigation works for all routes', async ({ page }) => {
    await page.goto('/dashboard')
    for (const linkName of ['Мій гараж', 'Запис на СТО', 'Сервіс', 'AI Механік', 'Команда', 'Налаштування', 'Дашборд']) {
      await page.getByRole('link', { name: linkName }).click()
      await page.waitForLoadState('networkidle', { timeout: 8000 })
      // Verify URL changed away from `/`
      expect(page.url()).not.toEqual(new URL('/', page.url()).toString())
    }
  })
})
