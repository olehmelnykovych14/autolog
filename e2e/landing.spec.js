// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Landing — unauthenticated', () => {
  test('homepage loads with correct title and key CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/AutoLog/)
    await expect(page.getByRole('button', { name: 'Функції' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Як це працює' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Увійти', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Почати безкоштовно' }).first()).toBeVisible()
  })

  test('no JS console errors on landing', async ({ page }) => {
    const errors = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors, `console errors: ${errors.join('\n')}`).toEqual([])
  })

  test('no failed network requests', async ({ page }) => {
    const failed = []
    page.on('response', resp => {
      if (resp.status() >= 400) failed.push(`${resp.status()} ${resp.url()}`)
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(failed, `failed: ${failed.join('\n')}`).toEqual([])
  })

  test('login modal opens and contains email/password fields', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await expect(page.getByPlaceholder('hello@autolog.app')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: /Увійти в гараж/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Зареєструватися' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Забули пароль?' })).toBeVisible()
  })

  test('register form has role toggle + name/email/password fields', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await page.getByRole('button', { name: 'Зареєструватися' }).click()
    await expect(page.getByRole('button', { name: 'Власник авто' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'СТО / Партнер' })).toBeVisible()
    await expect(page.getByPlaceholder('Іван Іванов')).toBeVisible()
    await expect(page.getByRole('button', { name: /Створити акаунт/ })).toBeVisible()
  })

  test('forgot password flow visible', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Увійти', exact: true }).click()
    await page.getByRole('button', { name: 'Забули пароль?' }).click()
    await expect(page.getByRole('button', { name: 'Скинути пароль' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Повернутися до входу/ })).toBeVisible()
  })

  test('mobile viewport renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const bodyScroll = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth)
    expect(bodyScroll).toBeLessThanOrEqual(1)
  })
})
