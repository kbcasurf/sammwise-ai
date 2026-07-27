// e2e/smoke.spec.js
const { test, expect } = require('@playwright/test');

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SAMMWise' })).toBeVisible();
});
