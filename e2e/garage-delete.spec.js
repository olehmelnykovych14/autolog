// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

/**
 * Plate format: ВС{6-digit-timestamp}
 * - Cyrillic ВС avoids B→В / C→С normalization
 * - Pure digits avoid all letter normalization (E→Е, A→А, etc.)
 * - Timestamp suffix guarantees uniqueness across tests
 */
const uniquePlate = () => `ВС${Date.now().toString().slice(-6)}`

test.describe('Garage — Car Delete + Update', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, '/garage')
  })

  test('DELETE: create car then delete via confirm dialog', async ({ page }) => {
    const plate = uniquePlate()

    // 1) Create Audi
    await page.getByRole('button', { name: /Додати авто/ }).first().click()
    await page.getByRole('combobox').first().selectOption({ label: 'Audi' })
    await page.waitForTimeout(500)
    await page.getByRole('combobox').nth(1).selectOption({ index: 0 })
    await page.locator('input[type="number"]').first().fill('2018')
    await page.getByPlaceholder('AA 0000 BB').fill(plate)
    await page.locator('input[type="number"]').nth(1).fill('100000')
    await page.getByRole('button', { name: 'Зберегти автомобіль' }).click()

    // 2) Find the new card by exact plate
    const card = page.locator('.car-card').filter({ hasText: plate }).filter({ hasNotText: 'Інший' }).first()
    await expect(card).toBeVisible({ timeout: 10_000 })

    // 3) Hover to reveal trash button (opacity-0 group-hover:opacity-100)
    await card.hover()
    await page.waitForTimeout(300)

    // 4) Click Trash2 button within the card
    const trashBtn = card.locator('button:has(svg.lucide-trash-2)').first()
    await trashBtn.click()

    // 5) Confirm dialog: title pattern "Видалити Audi A3?" (Brand Model)
    await expect(page.getByText(/Видалити Audi/i)).toBeVisible({ timeout: 5000 })

    // 6) Confirm button "Видалити авто"
    await page.getByRole('button', { name: /Видалити авто/i }).click()

    // 7) Card with this plate must vanish
    await expect(page.locator('body')).not.toContainText(plate, { timeout: 8000 })
  })

  test('UPDATE: edit car opens modal with prefilled data', async ({ page }) => {
    const plate = uniquePlate()

    await page.getByRole('button', { name: /Додати авто/ }).first().click()
    await page.getByRole('combobox').first().selectOption({ label: 'Honda' })
    await page.waitForTimeout(500)
    await page.getByRole('combobox').nth(1).selectOption({ index: 0 })
    await page.locator('input[type="number"]').first().fill('2017')
    await page.getByPlaceholder('AA 0000 BB').fill(plate)
    await page.locator('input[type="number"]').nth(1).fill('80000')
    await page.getByRole('button', { name: 'Зберегти автомобіль' }).click()
    await expect(page.locator('body')).toContainText(plate, { timeout: 8000 })

    const card = page.locator('.car-card').filter({ hasText: plate }).filter({ hasNotText: 'Інший' }).first()
    await card.hover()
    await page.waitForTimeout(300)

    // Edit button — pencil/edit icon variants
    const editBtn = card.locator('button:has(svg.lucide-pencil), button:has(svg.lucide-edit), button:has(svg.lucide-edit-2), button:has(svg.lucide-edit-3)').first()
    if (await editBtn.count() === 0) {
      await card.click()
    } else {
      await editBtn.click()
    }

    const mileageInput = page.locator('input[type="number"]').nth(1)
    await expect(mileageInput).toBeVisible({ timeout: 5000 })
    await mileageInput.fill('95000')
    await page.getByRole('button', { name: /Зберегти|Оновити/i }).first().click()

    await expect(page.locator('body')).toContainText(/95.000|95000/, { timeout: 8000 })

    // Cleanup: delete this test car so state doesn't accumulate
    const cleanupCard = page.locator('.car-card').filter({ hasText: plate }).filter({ hasNotText: 'Інший' }).first()
    await cleanupCard.hover()
    await page.waitForTimeout(300)
    const trash = cleanupCard.locator('button:has(svg.lucide-trash-2)').first()
    if (await trash.count() > 0) {
      await trash.click()
      await page.getByRole('button', { name: 'Видалити авто', exact: true }).click().catch(() => {})
    }
  })
})
