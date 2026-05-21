// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

test.describe('Service records — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/service')
    await expect(page.getByRole('button', { name: 'Додати сервіс' })).toBeVisible()
  })

  test('READ: service page loads with filters and search', async ({ page }) => {
    await expect(page.getByPlaceholder(/Пошук за назвою або СТО/)).toBeVisible()
    await expect(page.getByRole('combobox').first()).toBeVisible()
  })

  test('CREATE: add new service record', async ({ page }) => {
    const uniqueTitle = `Auto-test ${Date.now()}`
    const cost = '1234'

    await page.getByRole('button', { name: 'Додати сервіс' }).click()
    await page.getByPlaceholder(/Напр\. Заміна масла/).fill(uniqueTitle)
    // Cost — first spinbutton in modal (mileage is prefilled, cost is first empty number)
    await page.locator('input[type="number"]').first().fill(cost)
    await page.getByPlaceholder('Назва СТО').fill('E2E Test СТО')
    await page.getByRole('button', { name: /Додати в історію/ }).click()

    // Verify
    await expect(page.locator('body')).toContainText(uniqueTitle, { timeout: 8000 })
    await expect(page.locator('body')).toContainText(cost)
  })

  test('UPDATE: click record card opens edit modal with prefilled data', async ({ page }) => {
    // First create a record
    const seedTitle = `Edit-seed ${Date.now()}`
    await page.getByRole('button', { name: 'Додати сервіс' }).click()
    await page.getByPlaceholder(/Напр\. Заміна масла/).fill(seedTitle)
    await page.locator('input[type="number"]').first().fill('500')
    await page.getByRole('button', { name: /Додати в історію/ }).click()
    await expect(page.locator('body')).toContainText(seedTitle, { timeout: 8000 })

    // Click on the record card to open edit
    await page.locator('div').filter({ hasText: seedTitle }).first().click()

    // Modal should be open with title prefilled
    await expect(page.getByPlaceholder(/Напр\. Заміна масла/)).toHaveValue(seedTitle, { timeout: 5000 })

    // Edit title
    const newTitle = `${seedTitle} EDITED`
    await page.getByPlaceholder(/Напр\. Заміна масла/).fill(newTitle)
    await page.getByRole('button', { name: /Зберегти|Оновити|Додати в історію/ }).click()
    await expect(page.locator('body')).toContainText(newTitle, { timeout: 8000 })
  })

  test('DELETE: open record → 2-click delete confirmation', async ({ page }) => {
    const seedTitle = `Delete-seed ${Date.now()}`
    await page.getByRole('button', { name: 'Додати сервіс' }).click()
    await page.getByPlaceholder(/Напр\. Заміна масла/).fill(seedTitle)
    await page.locator('input[type="number"]').first().fill('100')
    await page.getByRole('button', { name: /Додати в історію/ }).click()
    await expect(page.locator('body')).toContainText(seedTitle, { timeout: 8000 })

    // Click record to open
    await page.locator('div').filter({ hasText: seedTitle }).first().click()
    // First click — confirmation state
    await page.getByRole('button', { name: /Видалити запис/ }).click()
    // Second click — actually deletes
    await page.getByRole('button', { name: /Ви впевнені/ }).click()
    // Record should be gone
    await expect(page.locator('body')).not.toContainText(seedTitle, { timeout: 8000 })
  })

  test('FILTER: category filter narrows results', async ({ page }) => {
    const allComboboxes = page.getByRole('combobox')
    // Category filter is 4th combobox (sort, date, car, category)
    await allComboboxes.nth(3).selectOption({ label: 'ТО' })
    await page.waitForTimeout(500)
    // Filtered list — either has TO records or "Нічого не знайдено"
    const hasResults = await page.locator('text=/ТО|Нічого не знайдено/').first().isVisible()
    expect(hasResults).toBeTruthy()
  })

  test('BUG #22: owner-created record auto-marked "VERIFIED"', async ({ page }) => {
    const t = `Verify-check ${Date.now()}`
    await page.getByRole('button', { name: 'Додати сервіс' }).click()
    await page.getByPlaceholder(/Напр\. Заміна масла/).fill(t)
    await page.locator('input[type="number"]').first().fill('100')
    await page.getByRole('button', { name: /Додати в історію/ }).click()
    const card = page.locator('div').filter({ hasText: t }).first()
    // Owner-created records should NOT be auto-verified.
    // Test FAILS while bug exists. Once fixed, "Verified" badge should be absent.
    await expect(card.locator('text=/Verified/i'), 'Owner-created record auto-marked VERIFIED (BUG #22)').not.toBeVisible({ timeout: 3000 })
  })
})
