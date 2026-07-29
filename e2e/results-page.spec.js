// e2e/results-page.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment, clickNavTab, answerAllVisibleRadios } = require('./helpers');

test('results page renders graphs and offers print/export', async ({ page }) => {
  await startAssessment(page);
  const domains = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];
  for (const domain of domains) {
    await clickNavTab(page, domain);
    await answerAllVisibleRadios(page);
  }
  await clickNavTab(page, 'Details');
  await page.locator('input[type="text"]').nth(0).fill('Acme Corp');
  await page.getByRole('button', { name: 'Complete' }).click();

  await expect(page).toHaveURL('/results');
  await expect(page.locator('#gauge-chart2')).toBeVisible();
  await expect(page.locator('.totalsBar')).toBeVisible();
  await expect(page.locator('.bussFuncRadar')).toBeVisible();
  await expect(page.locator('.practiceRadar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export graphs' })).toBeVisible();
});
