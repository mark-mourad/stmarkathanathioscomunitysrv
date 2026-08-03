import { chromium } from '@playwright/test';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth', 'user.json');

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const email = process.env.PLAYWRIGHT_EMAIL ?? process.env.SUPABASE_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_PASSWORD ?? process.env.SUPABASE_TEST_PASSWORD;

  if (!email || !password) {
    console.warn('Skipping Playwright auth bootstrap because no test credentials were provided. Set PLAYWRIGHT_EMAIL / PLAYWRIGHT_PASSWORD or SUPABASE_TEST_EMAIL / SUPABASE_TEST_PASSWORD before running the suite.');
    return;
  }

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
  await page.goto(`${baseUrl}/auth`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('User ID').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();

  await page.waitForURL(/\/(search|$)/, { timeout: 45_000 });
  await page.context().storageState({ path: authFile });
  await browser.close();
}
