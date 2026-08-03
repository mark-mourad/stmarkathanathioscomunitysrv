import { expect } from '@playwright/test';
import { test } from './helpers';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before using Supabase-backed helpers.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.describe('Blessing distribution (BLESSING_DISTRIBUTOR)', () => {
  test.skip(() => !process.env.PLAYWRIGHT_EMAIL && !process.env.SUPABASE_TEST_EMAIL, 'Test credentials are not configured.');

  test('distributor toggles a blessing: status updates, inventory decrements, no permission error', async ({ page }) => {
    const admin = getSupabaseAdmin();
    const email = `blessing-dist-${randomUUID()}@test.local`;
    const password = 'Test1234!';
    const nationalId = `9${Math.floor(1000000000000 + Math.random() * 8999999999999)}`;
    const individualName = `مخدوم اختبار توزيع البركة ${Date.now()}`;

    let individualId: string | null = null;

    // 1) Create a temporary BLESSING_DISTRIBUTOR user.
    const { data: user, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(userErr).toBeNull();
    const userId = user!.user.id;

    try {
      // 2) Assign the distributor role.
      const { error: roleErr } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role: 'BLESSING_DISTRIBUTOR' });
      expect(roleErr).toBeNull();

      // 3) Seed a beneficiary in a family the distributor can see.
      const { data: ind, error: indErr } = await admin
        .from('individuals')
        .insert({
          full_name: individualName,
          national_id: nationalId,
          saint_family: 'متى',
          address: 'اختبار توزيع البركة',
        })
        .select('id')
        .single();
      expect(indErr).toBeNull();
      individualId = ind!.id;

      // 4) Capture the inventory total before distributing.
      const { data: inv } = await admin
        .from('inventory')
        .select('weekly_total')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      expect(inv).toBeTruthy();
      const before = inv!.weekly_total;

      // 5) Log in as the distributor.
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');
      await page.getByPlaceholder('User ID').fill(email);
      await page.getByPlaceholder('Password').fill(password);
      await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
      await page.waitForURL(/\/(search|$)/, { timeout: 45_000 });

      // 6) Open blessing distribution and pick the family.
      await page.goto('/blessing-distribution');
      await expect(page.getByText('توزيع البركة')).toBeVisible();
      await page.locator('select').selectOption({ label: 'القديس متى' });
      await expect(page.getByText(individualName)).toBeVisible({ timeout: 20_000 });

      // 7) Toggle the beneficiary checkbox.
      await page.getByRole('checkbox', { name: new RegExp(individualName) }).click();

      // 8) Success toast appears and NO permission/inventory error is shown.
      await expect(page.getByText(/تم تسجيل البركة لـ/)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/تعذر تحديث المخزون|لم يتم تحديث أي صف/)).toHaveCount(0);

      // 9) The checkbox is now marked as received.
      await expect(page.getByRole('checkbox', { name: new RegExp(individualName) })).toBeChecked({
        timeout: 20_000,
      });

      // 10) Inventory decremented by exactly 1.
      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from('inventory')
              .select('weekly_total')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            return data?.weekly_total;
          },
          { timeout: 20_000 },
        )
        .toBe(before - 1);
    } finally {
      // Cleanup: distribution rows, beneficiary, role, user.
      if (individualId) {
        await admin.from('blessing_distribution').delete().eq('individual_id', individualId);
      }
      await admin.from('individuals').delete().eq('national_id', nationalId);
      await admin.from('user_roles').delete().eq('user_id', userId);
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
