// e2e/results-page.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment, clickNavTab, answerAllVisibleRadios, getChartData } = require('./helpers');

test('results page renders graphs and offers print/export', async ({ page }) => {
  await startAssessment(page);
  const domains = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];

  // Navigating to a domain tab or a new practice panel swaps the rendered question set;
  // querying/answering radios before that swap lands answers on the panel we just left.
  // Wait for the actual DOM signal (the first radio's name no longer matches the panel we
  // came from) rather than a guessed delay.
  async function firstRadioName() {
    const first = page.locator('input[type="radio"]').first();
    return (await first.count()) > 0 ? first.getAttribute('name') : null;
  }
  async function waitForPanelChange(previousName) {
    if (previousName === null) {
      await page.locator('input[type="radio"]').first().waitFor();
      return;
    }
    await page.waitForFunction((prev) => {
      const el = document.querySelector('input[type="radio"]');
      return !!el && el.name !== prev;
    }, previousName);
  }

  for (const domain of domains) {
    const previousName = await firstRadioName();
    await clickNavTab(page, domain);
    await waitForPanelChange(previousName);
    await answerAllVisibleRadios(page);
    // Each domain has 3 practice panels; "Next Practice" reveals the next one only
    // after the previous panel's radios are answered, and disappears on the last panel.
    while (await page.getByRole('button', { name: 'Next Practice' }).count() > 0) {
      const previousPracticeName = await firstRadioName();
      await page.getByRole('button', { name: 'Next Practice' }).click();
      await waitForPanelChange(previousPracticeName);
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
