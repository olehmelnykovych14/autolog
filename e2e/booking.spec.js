// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

test.describe('Bookings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/bookings')
    await expect(page.getByRole('button', { name: 'Знайти СТО' })).toBeVisible()
  })

  test('READ: partner СТО list visible', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Sto AutoLog Partner|Львів/i)
  })

  test('CREATE: booking form opens with car select + date + time + description', async ({ page }) => {
    await page.getByRole('button', { name: 'Записатися' }).first().click()
    await expect(page.getByText(/Оберіть авто/)).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.getByRole('combobox').last()).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.getByRole('button', { name: /ПІДТВЕРДИТИ/ })).toBeVisible()
  })

  test('CREATE: submit booking and verify in "Мої записи"', async ({ page }) => {
    await page.getByRole('button', { name: 'Записатися' }).first().click()

    // Pick future date (7 days ahead)
    const future = new Date()
    future.setDate(future.getDate() + 7)
    const dateStr = future.toISOString().slice(0, 10)
    await page.locator('input[type="date"]').fill(dateStr)

    // Time slot
    await page.locator('select').last().selectOption({ label: '14:00' })

    // Description
    const desc = `E2E booking ${Date.now()}`
    await page.locator('textarea').fill(desc)

    await page.getByRole('button', { name: /ПІДТВЕРДИТИ/ }).click()
    await page.waitForTimeout(2000)

    // Verify on "Мої записи" tab
    await page.getByRole('button', { name: 'Мої записи' }).click()
    await expect(page.locator('body')).toContainText(desc, { timeout: 8000 })
  })

  test('BUG #24a: no cancel/delete button for own bookings', async ({ page }) => {
    await page.getByRole('button', { name: 'Мої записи' }).click()
    // Look for cancel/delete UI on existing bookings (if any)
    const hasBookings = await page.locator('text=/У вас немає активних записів/').isVisible()
    test.skip(hasBookings, 'No bookings to test cancel UI on')

    const cancelBtn = page.locator('button:has-text("Скасувати"), button:has-text("Видалити"), button[aria-label*="cancel" i]')
    await expect(cancelBtn.first(), 'No cancel/delete UI for bookings (BUG #24a)').toBeVisible({ timeout: 3000 })
  })

  test('BUG #25: typo "ЗАПРОС" instead of "ЗАПИТ"', async ({ page }) => {
    await page.getByRole('button', { name: 'Записатися' }).first().click()
    // Currently button reads "ПІДТВЕРДИТИ ЗАПРОС" (russism). Should be "ЗАПИТ".
    const wrongText = await page.locator('text=/ЗАПРОС/').count()
    expect(wrongText, 'Russism "ЗАПРОС" found (BUG #25 — should be "ЗАПИТ")').toBe(0)
  })
})
