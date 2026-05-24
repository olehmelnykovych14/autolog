// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

test.describe('AI Mechanic', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/ai')
    await expect(page.getByRole('button', { name: 'Новий чат' })).toBeVisible()
  })

  test('READ: AI page has quick prompts + chat input', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Коли робити ТО/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Діагностика помилки/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Скільки коштує ремонт/ })).toBeVisible()
    await expect(page.getByPlaceholder(/Опишіть проблему/)).toBeVisible()
  })

  test('CREATE chat: send query → receive response', async ({ page }) => {
    test.setTimeout(120_000) // LLM can be slow

    const query = 'Коли робити заміну гальмівних колодок?'
    await page.getByPlaceholder(/Опишіть проблему/).fill(query)
    await page.keyboard.press('Enter')

    // Wait for AI response (look for any new text beyond the welcome message)
    await expect(page.locator('body')).toContainText(query, { timeout: 5000 })
    // Response should appear within 30s
    await page.waitForFunction(
      (q) => document.body.innerText.length > q.length + 200,
      query,
      { timeout: 60_000 }
    )
  })

  test('BUG #16: send button stays disabled after typing — only Enter works', async ({ page }) => {
    await page.getByPlaceholder(/Опишіть проблему/).fill('test message')
    // After typing, send button (last button in input area) should be enabled.
    // Currently stays [disabled] — test should fail until fixed.
    const sendBtns = page.locator('button:not([disabled])')
    // Identify send icon button (likely has paper-plane / send icon)
    const sendIcon = page.locator('button:has(svg.lucide-send), button[type="submit"]:visible').last()
    await expect(sendIcon, 'Send button still disabled after typing (BUG #16)').toBeEnabled({ timeout: 3000 })
  })

  test('quick prompt button triggers chat (count of prompt text increases)', async ({ page }) => {
    const baseline = await page.locator('text=/Коли робити ТО/').count()
    await page.getByRole('button', { name: /Коли робити ТО/ }).click()
    // Wait for the bot response to appear (the second markdown message block)
    await expect(page.locator('.markdown-content').nth(1)).toBeVisible({ timeout: 30_000 })
    const after = await page.locator('text=/Коли робити ТО/').count()
    expect(after, 'Quick prompt did not trigger reaction').toBeGreaterThan(baseline)
  })
})
