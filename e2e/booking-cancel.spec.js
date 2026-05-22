// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

test.describe('Booking — Cancel flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/bookings')
  })

  test('CANCEL: create booking then cancel it via ConfirmModal', async ({ page }) => {
    const desc = `E2E cancel test ${Date.now()}`

    // Create booking
    await page.getByRole('button', { name: /^Записатися$/i }).first().click()
    const future = new Date()
    future.setDate(future.getDate() + 14)
    // Date — focus & type (React onChange may not fire from .fill on date input)
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.focus()
    await dateInput.fill(future.toISOString().slice(0, 10))
    await dateInput.dispatchEvent('change')
    // Time
    await page.locator('select').last().selectOption({ label: '10:00' })
    // Description — pressSequentially triggers proper React events
    const ta = page.locator('textarea').first()
    await ta.click()
    await ta.pressSequentially(desc, { delay: 10 })
    // Wait for submit to enable
    const submitBtn = page.getByRole('button', { name: /ПІДТВЕРДИТИ/i })
    await expect(submitBtn).toBeEnabled({ timeout: 8000 })
    await submitBtn.click()
    await page.waitForTimeout(2000)

    // Open "Мої записи" tab
    await page.getByRole('button', { name: /Мої записи/i }).click()
    await expect(page.locator('body')).toContainText(desc, { timeout: 8000 })

    // Card row scoped by desc — find SCASUVATI button INSIDE it
    const row = page.locator('div').filter({ hasText: desc }).first()
    await row.getByRole('button', { name: /^Скасувати$/i }).click()

    // ConfirmModal: title "Скасувати запис?" + danger button "Скасувати запис"
    await expect(page.getByText(/Скасувати запис\?/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/СТО буде сповіщено/i)).toBeVisible()
    await page.getByRole('button', { name: /^Скасувати запис$/i }).click()
    await page.waitForTimeout(2500)

    // Booking still in list but with "Скасовано" badge
    const updatedRow = page.locator('div').filter({ hasText: desc }).first()
    await expect(updatedRow).toContainText(/Скасовано/i, { timeout: 5000 })

    // After cancellation, "ВИДАЛИТИ" button appears (canDelete=true)
    await expect(updatedRow.getByRole('button', { name: /^Видалити$/i })).toBeVisible({ timeout: 5000 })
  })

  test('DELETE: cancelled booking can be removed via Видалити button', async ({ page }) => {
    await page.getByRole('button', { name: /Мої записи/i }).click()
    await page.waitForTimeout(2000)

    // Any cancelled booking has a ВИДАЛИТИ button — pick the first one
    const deleteBtn = page.getByRole('button', { name: /^Видалити$/i }).first()
    if (await deleteBtn.count() === 0) {
      test.skip(true, 'No cancelled bookings in list to test delete on')
      return
    }

    // Grab description text from the row before delete (to verify it vanishes)
    const row = deleteBtn.locator('xpath=ancestor::div[contains(@class, "rounded") or contains(@class, "border")][1]')
    const rowText = await row.textContent()
    const descMatch = rowText?.match(/E2E cancel test \d+/)

    await deleteBtn.click()
    // Confirm if dialog appears (may be a 2nd-click confirm or modal)
    const confirmBtn = page.getByRole('button', { name: /^(Видалити|Так|Підтвердити)$/i }).last()
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await page.waitForTimeout(2000)

    // If we captured a description, verify it's gone
    if (descMatch) {
      await expect(page.locator('body')).not.toContainText(descMatch[0], { timeout: 5000 })
    }
  })
})
