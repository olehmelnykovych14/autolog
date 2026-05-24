// @ts-check
import { test, expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || 'qa.bot.20260518@autolog.test'
const PASSWORD = process.env.TEST_PASSWORD || 'QaBot20260518!'

test.describe('Auth flows', () => {
  test('login with valid credentials redirects to /dashboard', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await page.getByPlaceholder('hello@autolog.app').fill(EMAIL)
    await page.getByPlaceholder('••••••••').fill(PASSWORD)
    await page.getByRole('button', { name: /Увійти в гараж/ }).click()
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await expect(page.getByRole('link', { name: 'Дашборд' })).toBeVisible()
  })

  test('BUG #2: empty login submit shows validation', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await page.getByRole('button', { name: /Увійти в гараж/ }).click()
    // Expect SOME visible feedback (error text or browser validity tooltip).
    // Currently fails silently — test should fail until fixed.
    const errorVisible = await page.locator('text=/обов.язков|Введіть|required|invalid/i').count()
    expect(errorVisible, 'No validation message shown for empty form (BUG #2)').toBeGreaterThan(0)
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await page.getByPlaceholder('hello@autolog.app').fill(EMAIL)
    await page.getByPlaceholder('••••••••').fill('wrong-password-12345')
    await page.getByRole('button', { name: /Увійти в гараж/ }).click()
    await expect(page.locator('text=/невірн|неправильн|invalid|wrong/i')).toBeVisible({ timeout: 8000 })
  })

  test('BUG #14: register accepts non-existent email domain without verification', async ({ page, request }) => {
    test.skip(!process.env.RUN_DESTRUCTIVE_TESTS, 'Set RUN_DESTRUCTIVE_TESTS=1 to enable (creates Firestore user)')

    const uniqueEmail = `qa.bot.${Date.now()}@autolog.test`
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await page.getByRole('button', { name: 'Зареєструватися' }).click()
    await page.getByPlaceholder('Іван Іванов').fill('E2E Test')
    await page.getByPlaceholder('hello@autolog.app').fill(uniqueEmail)
    await page.getByPlaceholder('••••••••').fill('TestPass123!')
    await page.getByRole('button', { name: /Створити акаунт/ }).click()
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    // Should fail (or skip) once email verification is enforced.
    // For now documents current behavior.
  })

  test('logout returns to landing', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await page.getByPlaceholder('hello@autolog.app').fill(EMAIL)
    await page.getByPlaceholder('••••••••').fill(PASSWORD)
    await page.getByRole('button', { name: /Увійти в гараж/ }).click()
    await page.waitForURL('**/dashboard')
    await page.getByRole('button', { name: 'Вийти' }).click()
    // After logout, login button reappears on landing — that's the reliable signal
    await expect(page.getByRole('button', { name: 'Увійти', exact: true })).toBeVisible({ timeout: 10_000 })
  })
})
