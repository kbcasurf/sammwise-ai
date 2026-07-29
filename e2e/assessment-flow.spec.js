// e2e/assessment-flow.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment, clickNavTab, answerAllVisibleRadios } = require('./helpers');

test('direct navigation via in-survey navbar tabs', async ({ page }) => {
  await startAssessment(page);
  await clickNavTab(page, 'Operations');
  await expect(page.getByRole('heading', { name: 'Operations', level: 2 })).toBeVisible();
  await clickNavTab(page, 'Design');
  await expect(page.getByRole('heading', { name: 'Design', level: 2 })).toBeVisible();
  await clickNavTab(page, 'Details');
  await expect(page.getByRole('heading', { name: 'Details', level: 2 })).toBeVisible();
});

test('complete assessment across all domains and Details redirects to results', async ({ page }) => {
  await startAssessment(page);
  const domains = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];
  for (const domain of domains) {
    await clickNavTab(page, domain);
    await answerAllVisibleRadios(page);
  }
  await clickNavTab(page, 'Details');
  const textInputs = page.locator('input[type="text"]');
  await textInputs.nth(0).fill('Acme Corp');
  await textInputs.nth(1).fill('SAMM Rollout');
  await textInputs.nth(2).fill('Automated E2E coverage run');

  await page.getByRole('button', { name: 'Complete' }).click();
  await expect(page).toHaveURL('/results');
  await expect(page.getByRole('heading', { name: /overall score/i })).toBeVisible();
});
