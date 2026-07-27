// e2e/data-persistence.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment, clickNavTab } = require('./helpers');
const os = require('os');
const path = require('path');

test('save responses to file and reload via upload restores answers', async ({ page }) => {
  await startAssessment(page);
  await clickNavTab(page, 'Details');
  const textInputs = page.locator('input[type="text"]');
  await textInputs.nth(0).fill('Acme Corp');
  await textInputs.nth(1).fill('SAMM Rollout');
  await textInputs.nth(2).fill('E2E coverage run');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save Responses' }).click();
  const download = await downloadPromise;
  // saveAs() with explicit .json ensures the app's upload validation (comps/inputfile.js:35) accepts the file
  const filePath = path.join(os.tmpdir(), 'test-responses.json');
  await download.saveAs(filePath);
  expect(filePath).toBeTruthy();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(textInputs.nth(0)).toHaveValue('');

  await page.getByText('Load Results').click();
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await page.waitForLoadState();
  await clickNavTab(page, 'Details');
  await expect(page.locator('input[type="text"]').nth(0)).toHaveValue('Acme Corp');
});

test('clear answers resets the assessment state', async ({ page }) => {
  await startAssessment(page);
  await clickNavTab(page, 'Details');
  await page.locator('input[type="text"]').nth(0).fill('Acme Corp');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear' }).click();

  await expect(page.locator('input[type="text"]').nth(0)).toHaveValue('');
});
