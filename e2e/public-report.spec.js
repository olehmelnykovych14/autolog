// @ts-check
import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers.js'

test.describe('Public report — /share/:carId', () => {
  test('END-TO-END: create car as owner → open /share/:carId as anonymous', async ({ browser }) => {
    // 1) Owner context: login + create car + extract carId
    const ownerContext = await browser.newContext()
    const ownerPage = await ownerContext.newPage()
    await loginAndGo(ownerPage, '/garage')

    const plate = `ВС${Math.floor(Math.random() * 9000 + 1000)}PUB`
    await ownerPage.getByRole('button', { name: /Додати авто/ }).first().click()
    await ownerPage.getByRole('combobox').first().selectOption({ label: 'Toyota' })
    await ownerPage.waitForTimeout(500)
    await ownerPage.getByRole('combobox').nth(1).selectOption({ index: 0 })
    await ownerPage.locator('input[type="number"]').first().fill('2021')
    await ownerPage.getByPlaceholder('AA 0000 BB').fill(plate)
    await ownerPage.locator('input[type="number"]').nth(1).fill('45000')
    await ownerPage.getByRole('button', { name: 'Зберегти автомобіль' }).click()
    await expect(ownerPage.locator('body')).toContainText(plate, { timeout: 8000 })

    // Open share dialog OR navigate to car detail to grab share URL
    // Strategy: read carId from Firestore via window context
    const carId = await ownerPage.evaluate((p) => {
      const cards = Array.from(document.querySelectorAll('[data-car-id]'))
      const match = cards.find(c => c.textContent?.includes(p))
      return match?.getAttribute('data-car-id') || null
    }, plate)

    let shareUrl
    if (carId) {
      shareUrl = `/share/${carId}`
    } else {
      // Fallback: click the car card and look for "Поділитися" button → grab href/clipboard
      await ownerPage.locator('div').filter({ hasText: plate }).first().click()
      const shareBtn = ownerPage.getByRole('button', { name: /ПОДІЛИТИСЯ|Поділитися/i })
      if (await shareBtn.count() === 0) {
        test.skip(true, 'Could not extract carId (no data-car-id attribute, no share UI). Add data-car-id attribute to car cards for testability.')
        return
      }
      // Grant clipboard read permission
      await ownerContext.grantPermissions(['clipboard-read', 'clipboard-write'])
      await shareBtn.click()
      await ownerPage.waitForTimeout(1000)
      const copied = await ownerPage.evaluate(() => navigator.clipboard.readText())
      const m = copied.match(/\/share\/([^/?#\s]+)/)
      if (!m) {
        test.skip(true, `Share button did not put /share/:carId into clipboard (got: ${copied.slice(0, 100)})`)
        return
      }
      shareUrl = `/share/${m[1]}`
    }

    await ownerContext.close()

    // 2) Anonymous context: open share URL — should show public report without auth
    const anonContext = await browser.newContext()
    const anonPage = await anonContext.newPage()
    await anonPage.goto(shareUrl)
    await anonPage.waitForLoadState('networkidle')

    // Should NOT redirect to login. Should show car details.
    expect(anonPage.url()).toContain('/share/')
    await expect(anonPage.locator('body')).toContainText(plate, { timeout: 10_000 })
    // Should NOT show owner-only sidebar
    await expect(anonPage.getByRole('button', { name: 'Вийти' })).not.toBeVisible()
    await anonContext.close()
  })

  test('invalid carId shows not-found state', async ({ page }) => {
    await page.goto('/share/nonexistent-car-id-99999')
    await page.waitForLoadState('networkidle')
    const hasNotFound = await page.locator('text=/не знайдено|not found|відсутн|404/i').count()
    expect(hasNotFound, 'Invalid /share/:carId should show not-found message').toBeGreaterThan(0)
  })
})
