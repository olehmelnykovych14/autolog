// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

test.describe('Garage — Car CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/garage')
    await expect(page.getByRole('button', { name: /Додати авто/ }).first()).toBeVisible()
  })

  test('READ: garage page loads with sidebar and add-car CTA', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Мій гараж' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Додати авто/ }).first()).toBeVisible()
  })

  test('CREATE: add new car with all fields', async ({ page }) => {
    const uniquePlate = `АА${Math.floor(Math.random() * 9000 + 1000)}ВВ`

    await page.getByRole('button', { name: /Додати авто/ }).first().click()

    // Brand dropdown — pick Audi (always present)
    await page.getByRole('combobox').first().selectOption({ label: 'Audi' })
    // Wait for model select to re-populate
    await page.waitForTimeout(500)

    // Model — first option after brand change
    const modelSelect = page.getByRole('combobox').nth(1)
    await modelSelect.selectOption({ index: 0 })

    // Year
    await page.locator('input[type="number"]').first().fill('2019')

    // Plate
    await page.getByPlaceholder('AA 0000 BB').fill(uniquePlate)

    // Mileage — second number input
    await page.locator('input[type="number"]').nth(1).fill('120000')

    await page.getByRole('button', { name: 'Зберегти автомобіль' }).click()

    // Verify in list
    await expect(page.locator('body')).toContainText(uniquePlate, { timeout: 8000 })
  })

  test('READ: existing car visible in list', async ({ page }) => {
    // BMW X5 ВС1234XX seeded by prior tests / setup
    await expect(page.locator('body')).toContainText('ВС1234XX')
  })

  test('BUG #20a/b: no Edit/Delete UI on car card', async ({ page }) => {
    // Expect Edit/Delete icons to exist next to a car card.
    // Currently NONE exist — this test should fail until fixed.
    const editBtn = page.locator('button[aria-label*="редаг" i], button:has(svg.lucide-pencil), button:has(svg.lucide-edit), button:has(svg.lucide-edit-2)')
    const deleteBtn = page.locator('button[aria-label*="видалити" i], button:has(svg.lucide-trash), button:has(svg.lucide-trash-2)')
    await expect(editBtn.first(), 'Car edit UI missing (BUG #20a)').toBeVisible({ timeout: 3000 })
    await expect(deleteBtn.first(), 'Car delete UI missing (BUG #20b)').toBeVisible({ timeout: 3000 })
  })
})
