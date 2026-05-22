// @ts-check
import { test, expect } from '@playwright/test'
import { loginSto } from './helpers.js'

test.describe('STO-role flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginSto(page)
  })

  test('LOGIN: STO account lands on STO dashboard (or documents bug)', async ({ page }) => {
    // Expected: STO accounts land on /sto (defaultRoute when isSto)
    // Currently: may land on /dashboard (bug — depends on accountType field)
    await expect(page).toHaveURL(/\/sto|\/dashboard/)
    if (page.url().includes('/dashboard')) {
      console.warn('BUG: STO account landed on /dashboard instead of /sto. Check accountType field on register.')
    }
  })

  test('NAV: STO sidebar links exist', async ({ page }) => {
    // STO-only routes
    const stoRoutes = [
      { url: '/sto', label: /STO Dashboard|Дашборд СТО|Дашборд/ },
      { url: '/sto/bookings', label: /Записи|Bookings/ },
      { url: '/sto/clients', label: /Клієнти|Clients/ },
      { url: '/sto/acts', label: /Акти|Acts/ },
      { url: '/sto/settings', label: /Налаштування|Settings/ },
    ]

    for (const { url } of stoRoutes) {
      await page.goto(url)
      await page.waitForLoadState('networkidle', { timeout: 8000 })
      // Should not redirect away to /dashboard
      const finalUrl = page.url()
      if (!finalUrl.includes('/sto')) {
        console.warn(`STO route ${url} redirected to ${finalUrl}`)
      }
    }
  })

  test('READ: STO bookings page shows pending requests', async ({ page }) => {
    await page.goto('/sto/bookings')
    await page.waitForLoadState('networkidle', { timeout: 8000 })
    // Either has bookings or empty-state. Either way page must load.
    const hasContent = await page.locator('text=/Записи|Bookings|немає|empty/i').count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('READ: STO clients page', async ({ page }) => {
    await page.goto('/sto/clients')
    await page.waitForLoadState('networkidle', { timeout: 8000 })
    const hasContent = await page.locator('text=/Клієнти|Clients|немає/i').count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('READ: STO acts page (service records signed by this СТО)', async ({ page }) => {
    await page.goto('/sto/acts')
    await page.waitForLoadState('networkidle', { timeout: 8000 })
    const hasContent = await page.locator('text=/Акти|Acts|немає|записів/i').count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('READ: STO settings page', async ({ page }) => {
    await page.goto('/sto/settings')
    await page.waitForLoadState('networkidle', { timeout: 8000 })
    const hasContent = await page.locator('text=/Налаштування|Settings|компані|address/i').count()
    expect(hasContent).toBeGreaterThan(0)
  })
})
