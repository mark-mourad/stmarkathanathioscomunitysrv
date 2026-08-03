import { test as base, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

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

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export async function loginAsAdmin(page: Page) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('User ID').fill(process.env.PLAYWRIGHT_EMAIL ?? process.env.SUPABASE_TEST_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.PLAYWRIGHT_PASSWORD ?? process.env.SUPABASE_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForURL(/\/(search|$)/, { timeout: 45_000 });
}

export async function seedIndividual(name: string, nationalId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from('individuals').insert({
    full_name: name,
    national_id: nationalId,
    address: 'اختبار Playwright',
    phone: '01000000000',
    created_by: undefined,
  }).select('id').single();

  if (error) throw error;
  return data;
}

export async function cleanupRecords(names: string[]) {
  const supabaseAdmin = getSupabaseAdmin();
  for (const name of names) {
    await supabaseAdmin.from('individuals').delete().ilike('full_name', `%${name}%`);
  }
}

export async function expectSupabaseRowCount(table: string, count: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const { count: actual, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  expect(actual).toBe(count);
}
