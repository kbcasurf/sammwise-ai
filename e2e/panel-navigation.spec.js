// e2e/panel-navigation.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment } = require('./helpers');

test('panel collapse/expand and Next/Previous Practice navigation', async ({ page }) => {
  await startAssessment(page);

  // First panel ("Strategy and Metrics") starts expanded with a Next Practice button.
  await expect(page.getByText('Strategy and Metrics')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next Practice' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous Practice' })).toHaveCount(0);

  // Advance to the second panel.
  await page.getByRole('button', { name: 'Next Practice' }).click();
  await expect(page.getByText('Policy and Compliance')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous Practice' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next Practice' })).toBeVisible();

  // Advance to the third (last) panel of the page.
  await page.getByRole('button', { name: 'Next Practice' }).click();
  await expect(page.getByText('Education and Guidance')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous Practice' })).toBeVisible();

  // Go back to the second panel.
  await page.getByRole('button', { name: 'Previous Practice' }).click();
  await expect(page.getByText('Policy and Compliance')).toBeVisible();

  // Go back to the first panel.
  await page.getByRole('button', { name: 'Previous Practice' }).click();
  await expect(page.getByText('Strategy and Metrics')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous Practice' })).toHaveCount(0);
});
