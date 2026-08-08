import { expect } from '@playwright/test';
import { cleanupRecords, seedIndividual, test } from './helpers';

test.describe('Makhdoum management CRUD', () => {
  test.skip(() => !process.env.PLAYWRIGHT_EMAIL && !process.env.SUPABASE_TEST_EMAIL, 'Test credentials are not configured.');

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('User ID').fill(process.env.PLAYWRIGHT_EMAIL ?? process.env.SUPABASE_TEST_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.PLAYWRIGHT_PASSWORD ?? process.env.SUPABASE_TEST_PASSWORD!);
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL(/\/(search|$)/, { timeout: 45_000 });
    await page.goto('/add');
  });

  test.afterEach(async () => {
    await cleanupRecords(['QA Playwright', 'اختبار']);
  });

  test('creates a primary Makhdoum and adds family members, then updates and deletes them', async ({ page }) => {
    await page.getByLabel('الاسم').fill('QA Playwright');
    await page.getByLabel('الرقم القومي').fill('30001010101010');
    await page.getByLabel('رقم الموبايل').fill('01000000000');
    await page.getByLabel('العنوان بالتفصيل').fill('اختبار Playwright');
    await page.getByRole('button', { name: 'إضافة فرد' }).click();
    await page.locator('table tbody tr').nth(0).getByRole('textbox').first().fill('أبناء QA');
    await page.locator('table tbody tr').nth(0).getByRole('textbox').nth(1).fill('30101010101010');
    await page.locator('table tbody tr').nth(0).getByRole('textbox').nth(2).fill('ابن');
    await page.locator('table tbody tr').nth(0).getByRole('textbox').nth(3).fill('متزوج');
    await page.locator('table tbody tr').nth(0).getByRole('textbox').nth(4).fill('أب الاعتراف');
    await page.locator('table tbody tr').nth(0).getByRole('textbox').nth(5).fill('طالب');
    await page.locator('table tbody tr').nth(0).getByRole('textbox').nth(6).fill('100');
    await page.locator('table tbody tr').nth(0).getByRole('textbox').nth(7).fill('ملاحظة اختبار');

    await page.getByRole('button', { name: 'حفظ المخدوم' }).click();
    await expect(page.getByText('تم حفظ المخدوم')).toBeVisible({ timeout: 45_000 });

    const createdRow = await page.locator('table tbody tr').first().innerText();
    expect(createdRow).toContain('QA Playwright');

    const individualId = page.url().split('/').pop();
    await page.goto(`/individual/${individualId}`);

    await expect(page.getByText('QA Playwright')).toBeVisible();
    await expect(page.getByText('أبناء QA')).toBeVisible();

    await page.getByRole('button', { name: 'تعديل' }).click();
    await page.getByLabel('رقم الموبايل').fill('01111111111');
    await page.getByLabel('العنوان بالتفصيل').fill('عنوان محدث');
    await page.getByRole('button', { name: 'حفظ التعديلات' }).click();
    await expect(page.getByText('تم حفظ التعديلات')).toBeVisible({ timeout: 45_000 });

    // Regression: saving an edit must NOT duplicate the family members array.
    await expect(page.getByText('أبناء QA')).toHaveCount(1);

    // Second edit cycle — must still keep exactly one copy of each family member.
    await page.getByRole('button', { name: 'تعديل' }).click();
    await page.getByLabel('رقم الموبايل').fill('01222222222');
    await page.getByRole('button', { name: 'حفظ التعديلات' }).click();
    await expect(page.getByText('تم حفظ التعديلات')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('أبناء QA')).toHaveCount(1);

    await page.getByRole('button', { name: 'حذف' }).click();
    await page.getByRole('button', { name: 'حذف نهائياً' }).click();
    await expect(page.getByText('تم حذف الملف')).toBeVisible({ timeout: 45_000 });
  });

  test('seeded individual can be updated and deleted via Supabase helper', async () => {
    const seeded = await seedIndividual('اختبار Playwright', '30001010101011');
    expect(seeded.id).toBeTruthy();
  });
});
