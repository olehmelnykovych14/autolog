// @ts-check
import { test, expect } from '@playwright/test';

test.describe('AutoLog SEO & Premium Blog — Public E2E Flow', () => {
  test('homepage has correct SEO metadata and title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('AutoLog — сервісна книжка онлайн для водіїв України');
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      'content',
      'Веди облік сервісів, витрат і пробігу свого авто безкоштовно. Без App Store, працює з браузера. 12 000+ водіїв вже довіряють AutoLog.'
    );

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://www.autolog.com.ua/');

    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Сервісна книжка для твого автомобіля');
  });

  test('drivers sub-path has correct SEO metadata and scrolls', async ({ page }) => {
    await page.goto('/drivers');
    await expect(page).toHaveTitle('Облік витрат на авто — AutoLog для водіїв');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      'content',
      'Фіксуй кожен сервіс, ремонт і витрату по авто в одному місці. Переглядай статистику, плануй ТО. Безкоштовно для власників авто.'
    );

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://www.autolog.com.ua/drivers');
  });

  test('sto sub-path has correct SEO metadata', async ({ page }) => {
    await page.goto('/sto');
    await expect(page).toHaveTitle('AutoLog для СТО — цифровий облік клієнтів');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      'content',
      'Управляй сервісами, веди облік робіт і залучай нових клієнтів через AutoLog. VIN-пошук, цифрова картка клієнта. Реєстрація безкоштовна.'
    );
  });

  test('telegram-bot sub-path has correct SEO metadata', async ({ page }) => {
    await page.goto('/telegram-bot');
    await expect(page).toHaveTitle('AutoLog Telegram-бот — голосовий запис сервісів авто');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      'content',
      'Додавай записи про сервіс авто голосом прямо в Telegram — без встановлення додатку. @autologGarage_bot. Зручно, швидко, безкоштовно.'
    );
  });

  test('blog list view loads and displays premium articles', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle('Блог AutoLog — поради для власників авто');

    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Корисні поради для власників авто');

    // Verify 4 articles exist
    const articles = page.locator('article');
    await expect(articles).toHaveCount(4);

    // Verify presence of a specific article card
    await expect(page.locator('text=Як вести сервісну книжку автомобіля у 2026 — покрокова інструкція').first()).toBeVisible();
  });

  test('article detail view renders rich content and navigation', async ({ page }) => {
    await page.goto('/blog/serwisna-knyzhka-avtomobilya');
    await expect(page).toHaveTitle('Як вести сервісну книжку автомобіля у 2026 — покрокова інструкція');

    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Як вести сервісну книжку автомобіля у 2026: Повний гайд');

    const breadcrumbs = page.locator('nav');
    await expect(breadcrumbs).toContainText('Блог');
    await expect(breadcrumbs).toContainText('Як вести сервісну книжку автомобіля у 2026 — покрокова інструкція');

    // Check content blocks
    await expect(page.locator('blockquote')).toBeVisible();
    await expect(page.locator('text=Чому паперові книжки відходять у минуле?')).toBeVisible();
    await expect(page.locator('text=Як AutoLog спрощує цей процес')).toBeVisible();

    // Check back to blog button
    await page.getByRole('link', { name: 'Повернутися до Блогу' }).first().click();
    await expect(page).toHaveURL(/\/blog$/);
  });

  test('pricing page guest fallback logic', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle('Тарифи AutoLog — Free, Pro і Business для СТО');

    // Click on a plan select button as guest
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Будь ласка, увійдіть або зареєструйтеся, щоб обрати тарифний план.');
      await dialog.accept();
    });

    await page.locator('button:has-text("Обрати")').first().click();
    await page.waitForURL(/\/login$/);
  });

  test('sto map guest fallback logic', async ({ page }) => {
    await page.goto('/sto-map');
    await expect(page).toHaveTitle('Знайти СТО в Україні — AutoLog каталог автосервісів');

    // STO map should be crawlable and list STOs publicly
    await page.waitForSelector('text=Знайти СТО', { timeout: 10000 });
  });
});
