import { expect } from '@playwright/test';
import { cleanupRecords, seedIndividual, test } from './helpers';

test.describe('Assistance and history workflow', () => {
  test.skip(() => !process.env.PLAYWRIGHT_EMAIL && !process.env.SUPABASE_TEST_EMAIL, 'Test credentials are not configured.');

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('User ID').fill(process.env.PLAYWRIGHT_EMAIL ?? process.env.SUPABASE_TEST_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.PLAYWRIGHT_PASSWORD ?? process.env.SUPABASE_TEST_PASSWORD!);
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL(/\/(search|$)/, { timeout: 45_000 });
  });

  test.afterEach(async () => {
    await cleanupRecords(['QA Assistance']);
  });

  test('loads assistance history and creates bridal and medical aid entries', async ({ page }) => {
    const seeded = await seedIndividual('QA Assistance', '30001010101012');
    await page.goto(`/individual/${seeded.id}`);
    await page.getByRole('button', { name: 'مساعدات' }).click();

    await expect(page.getByText('سجل المساعدات')).toBeVisible();
    await expect(page.getByText('لا توجد مساعدات سابقة')).toBeVisible();

    await page.getByRole('button', { name: 'إضافة مساعدة جديدة' }).click();
    await page.getByRole('button', { name: 'تجهيز عرايس' }).click();

    await page.getByRole('button', { name: 'إضافة جهاز' }).first().click();
    await page.locator('select').nth(1).selectOption('غسالة');
    await page.locator('input[type="number"]').nth(1).fill('1000');
    await page.getByRole('button', { name: 'إضافة أداة' }).click();
    await page.locator('select').nth(2).selectOption('طقم طبخ');
    await page.locator('input[type="number"]').nth(2).fill('2');
    await page.locator('input[type="number"]').nth(3).fill('250');

    await expect(page.getByText('الإجمالي الكلي')).toBeVisible();
    await expect(page.locator('text=1250').first()).toBeVisible();

    await page.getByRole('button', { name: 'حفظ' }).nth(1).click();
    await expect(page.getByText('تم حفظ المساعدة بنجاح')).toBeVisible({ timeout: 45_000 });

    await page.getByRole('button', { name: 'إضافة مساعدة جديدة' }).click();
    await page.getByRole('button', { name: 'مساعدة علاجية' }).click();
    await page.getByRole('button', { name: 'إضافة مساعدة علاجية' }).click();
    await page.locator('select').nth(4).selectOption('operation');
    await page.getByPlaceholder('اسم الخدمة').fill('عملية اختبار');
    await page.locator('input[type="number"]').nth(5).fill('3000');
    await page.locator('input[type="number"]').nth(6).fill('25');
    await expect(page.getByText('750')).toBeVisible();

    await page.getByRole('button', { name: 'حفظ' }).nth(1).click();
    await expect(page.getByText('تم حفظ المساعدة بنجاح')).toBeVisible({ timeout: 45_000 });
  });
});
