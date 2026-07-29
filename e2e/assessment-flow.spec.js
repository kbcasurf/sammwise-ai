// e2e/assessment-flow.spec.js
const { test, expect } = require('@playwright/test');
const {
  startAssessment,
  clickNavTab,
  answerAllVisibleRadios,
  firstRadioName,
  waitForPanelChange,
} = require('./helpers');

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
    const previousName = await firstRadioName(page);
    await clickNavTab(page, domain);
    await waitForPanelChange(page, previousName);
    await answerAllVisibleRadios(page);
    // Each domain has 3 practice panels navigated via "Next Practice", which
    // disappears on the last panel of the domain.
    while (await page.getByRole('button', { name: 'Next Practice' }).count() > 0) {
      const previousPracticeName = await firstRadioName(page);
      await page.getByRole('button', { name: 'Next Practice' }).click();
      await waitForPanelChange(page, previousPracticeName);
      await answerAllVisibleRadios(page);
    }
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
