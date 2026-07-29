// e2e/results-page.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment, clickNavTab, answerAllVisibleRadios, getChartData } = require('./helpers');

test('results page renders graphs and offers print/export', async ({ page }) => {
  await startAssessment(page);
  const domains = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];
  for (const domain of domains) {
    await clickNavTab(page, domain);
    await answerAllVisibleRadios(page);
    while (await page.getByRole('button', { name: 'Next Practice' }).count() > 0) {
      await page.getByRole('button', { name: 'Next Practice' }).click();
      // Wait for the panel content to load by checking that radios are stable
      await page.waitForTimeout(500);
      await answerAllVisibleRadios(page);
    }
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

  // Regression coverage: the canvases above can be present and "visible" while still
  // painting no data at all (see
  // docs/superpowers/specs/2026-07-29-graficos-resultado-dados-obsoletos-design.md).
  // Assert on the actual data reaching each chart component, not just DOM visibility.
  const chartSelectors = ['.totalsBar', '.bussFuncRadar', '.bussFuncBar', '.practiceRadar', '.practiceBar'];
  for (const selector of chartSelectors) {
    const chartData = await getChartData(page, selector);
    expect(chartData, `no chart data found for ${selector}`).not.toBeNull();
    const dataset = chartData.datasets[0];
    expect(dataset.data.length, `${selector} dataset is empty`).toBeGreaterThan(0);
    expect(dataset.data.some((v) => v > 0), `${selector} dataset is all zero`).toBe(true);
  }

  const totalsData = await getChartData(page, '.totalsBar');
  const totalsSum = totalsData.datasets[0].data.reduce((a, b) => a + b, 0);
  expect(totalsSum, 'response counts across all 4 buckets should total 90 answered questions').toBe(90);
});
