import { expect } from '@playwright/test';
import { test } from './helpers';

test.describe('Inventory and store management', () => {
  test.skip(() => !process.env.PLAYWRIGHT_EMAIL && !process.env.SUPABASE_TEST_EMAIL, 'Test credentials are not configured.');

  test('loads inventory, updates weekly total, and saves it', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('User ID').fill(process.env.PLAYWRIGHT_EMAIL ?? process.env.SUPABASE_TEST_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.PLAYWRIGHT_PASSWORD ?? process.env.SUPABASE_TEST_PASSWORD!);
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
    await page.waitForURL(/\/(search|$)/, { timeout: 45_000 });

    await page.goto('/inventory');
    await expect(page.getByText('المخزن')).toBeVisible();
    await page.getByLabel('عدد البركة للأسبوع').fill('42');
    await page.getByLabel('التفاصيل والمكونات').fill('اختبار Playwright');
    await page.getByRole('button', { name: 'حفظ' }).click();
    await expect(page.getByText('تم حفظ المخزون بنجاح')).toBeVisible({ timeout: 45_000 });
  });
});
