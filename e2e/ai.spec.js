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
    // Use pressSequentially to trigger React onChange events properly
    const input = page.getByPlaceholder(/Опишіть проблему/)
    await input.click()
    await input.pressSequentially('test message', { delay: 30 })
    // After typing, send button should be enabled (identified by data-testid)
    const sendBtn = page.getByTestId('ai-send-btn')
    await expect(sendBtn, 'Send button should be enabled after typing (BUG #16)').toBeEnabled({ timeout: 3000 })
  })

  test('quick prompt button triggers chat (count of prompt text increases)', async ({ page }) => {
    await page.getByRole('button', { name: /Коли робити ТО/ }).click()
    // Wait for the bot response to appear (the second markdown message block)
    await expect(page.locator('.markdown-content').nth(1)).toBeVisible({ timeout: 30_000 })
    // The prompt text should be visible as a user message in the chat
    await expect(page.locator('text=Коли робити ТО?').first()).toBeVisible()
  })
})
