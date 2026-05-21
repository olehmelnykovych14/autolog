// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/settings')
    await expect(page.getByRole('button', { name: 'Зберегти зміни' })).toBeVisible()
  })

  test('READ: profile fields visible with current values', async ({ page }) => {
    await expect(page.getByPlaceholder(/Ваше ім.я/)).toBeVisible()
    await expect(page.getByPlaceholder('+380...')).toBeVisible()
    await expect(page.getByText(/Telegram/i).first()).toBeVisible()
  })

  test('UPDATE: change name persists after save and reload', async ({ page }) => {
    const newName = `QA Bot ${Date.now()}`
    await page.getByPlaceholder(/Ваше ім.я/).fill(newName)
    await page.getByRole('button', { name: 'Зберегти зміни' }).click()
    await page.waitForTimeout(2000)
    await page.reload()
    await expect(page.getByPlaceholder(/Ваше ім.я/)).toHaveValue(newName, { timeout: 8000 })
  })

  test('UPDATE: phone number accepts input', async ({ page }) => {
    const phone = '+380501234567'
    await page.getByPlaceholder('+380...').fill(phone)
    await page.getByRole('button', { name: 'Зберегти зміни' }).click()
    await page.waitForTimeout(2000)
    await page.reload()
    await expect(page.getByPlaceholder('+380...')).toHaveValue(phone, { timeout: 8000 })
  })

  test('BUG #26: "Акаунт Верифіковано" shown without real verification', async ({ page }) => {
    // Email verification was never performed for test account.
    // Badge should NOT show "Verified" — currently does (bug).
    const verified = await page.locator('text=/Акаунт Верифіковано|Email верифіков/i').count()
    expect(verified, 'Verified badge shown without real email verification (BUG #26)').toBe(0)
  })

  test('BUG #27: no "Delete account" option (GDPR)', async ({ page }) => {
    const deleteAccountBtn = page.locator('button:has-text("Видалити акаунт"), button:has-text("Delete account")')
    await expect(deleteAccountBtn.first(), 'No delete-account UI (GDPR Art.17, BUG #27)').toBeVisible({ timeout: 3000 })
  })

  test('BUG #28: no "Disconnect Telegram" option', async ({ page }) => {
    // Connect button visible
    await expect(page.getByRole('button', { name: /ПІДКЛЮЧИТИ TELEGRAM/i })).toBeVisible()
    // But no disconnect counterpart
    const disconnectBtn = page.locator('button:has-text("ВІДКЛЮЧИТИ"), button:has-text("Disconnect")')
    await expect(disconnectBtn.first(), 'No disconnect Telegram UI (BUG #28)').toBeVisible({ timeout: 3000 })
  })
})
