// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

const INVITE_EMAIL = process.env.TEAM_INVITE_EMAIL

test.describe('Team — invite flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/team')
  })

  test('READ: team page has invite button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Запросити/ })).toBeVisible()
  })

  test('INVITE: send invitation and verify in pending list', async ({ page }) => {
    test.skip(!INVITE_EMAIL, 'Set TEAM_INVITE_EMAIL in .env to a real email you control')

    await page.getByRole('button', { name: /Запросити/ }).first().click()

    // Invite form: email input + send button
    const emailInput = page.getByPlaceholder(/email|пошт/i).first()
    await emailInput.fill(INVITE_EMAIL)

    // Optional: pick role if there's a role select
    const roleSelect = page.getByRole('combobox')
    if (await roleSelect.count() > 0) {
      // Pick first non-default option (likely "Driver" / "Mechanic" / etc.)
      await roleSelect.first().selectOption({ index: 1 }).catch(() => {})
    }

    // Submit
    await page.getByRole('button', { name: /Надіслати|Запросити|Відправити/i }).last().click()
    await page.waitForTimeout(2000)

    // Verify invitation appeared in pending list
    await expect(page.locator('body')).toContainText(INVITE_EMAIL, { timeout: 8000 })

    // Verify status indicator (pending/очікує)
    const pendingMarker = await page.locator('text=/Очікує|Pending|Запрошено/i').count()
    expect(pendingMarker, 'Invitation should show pending status').toBeGreaterThan(0)
  })

  test('CANCEL: revoke pending invitation', async ({ page }) => {
    test.skip(!INVITE_EMAIL, 'Set TEAM_INVITE_EMAIL in .env')

    // Assumes prior INVITE test seeded an invitation for INVITE_EMAIL
    const inviteRow = page.locator('div').filter({ hasText: INVITE_EMAIL }).first()
    if (await inviteRow.count() === 0) {
      test.skip(true, 'No pending invitation to cancel — run INVITE test first')
      return
    }

    // Find revoke/cancel button on the row
    const revokeBtn = inviteRow.locator('button:has(svg.lucide-trash), button:has(svg.lucide-x), button:has-text("Скасувати"), button:has-text("Видалити")').first()
    await revokeBtn.click()

    // Confirm if dialog appears
    const confirmBtn = page.getByRole('button', { name: /Скасувати|Видалити|Так|Підтвердити/i }).last()
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    await page.waitForTimeout(2000)
    await expect(page.locator('body')).not.toContainText(INVITE_EMAIL)
  })
})
