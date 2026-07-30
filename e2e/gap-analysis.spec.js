const { test, expect } = require('@playwright/test');
const { completeFullAssessment } = require('./helpers');

const FAKE_REPORT = {
    summary: 'Overall maturity is early-stage with strong gaps in governance.',
    gaps: [
        {
            businessFunction: 'Governance',
            practice: 'Education and Guidance',
            priority: 'High',
            gapDescription: 'No Security Champion program in place.',
            recommendation: 'Appoint a Security Champion per development team.'
        }
    ],
    incompletePractices: []
};

test.describe('Gap analysis report', () => {
    test('button is hidden when the AI report is not enabled', async ({ page }) => {
        await page.route('**/api/config', (route) => route.fulfill({ json: { aiReportEnabled: false } }));
        await completeFullAssessment(page);
        await expect(page.getByRole('button', { name: 'Generate Gap Analysis Report' })).toHaveCount(0);
    });

    test('generates and displays a report after consent', async ({ page }) => {
        await page.route('**/api/config', (route) => route.fulfill({ json: { aiReportEnabled: true } }));
        await page.route('**/api/gap-analysis', (route) => route.fulfill({ json: FAKE_REPORT }));
        await completeFullAssessment(page);

        await page.getByRole('button', { name: 'Generate Gap Analysis Report' }).click();
        await page.locator('#gap-analysis-consent-accept').check();
        await page.getByRole('button', { name: 'Analyze' }).click();

        await expect(page.getByText(FAKE_REPORT.summary)).toBeVisible();
        await expect(page.getByText('Education and Guidance')).toBeVisible();
    });

    test('attach to history is disabled until the assessment is saved', async ({ page }) => {
        await page.route('**/api/config', (route) => route.fulfill({ json: { aiReportEnabled: true } }));
        await page.route('**/api/gap-analysis', (route) => route.fulfill({ json: FAKE_REPORT }));
        await completeFullAssessment(page);

        await page.getByRole('button', { name: 'Generate Gap Analysis Report' }).click();
        await page.locator('#gap-analysis-consent-accept').check();
        await page.getByRole('button', { name: 'Analyze' }).click();
        await expect(page.getByText(FAKE_REPORT.summary)).toBeVisible();

        await expect(page.getByRole('button', { name: 'Attach report to history' })).toHaveCount(0);

        // The report renders in a fixed, full-viewport modal (GapAnalysisReport) that
        // overlays the rest of the page, including "Save to history". Closing it (which
        // only toggles visibility, not the underlying `report` state) is what a real user
        // must do before they can reach the page behind it.
        await page.getByRole('button', { name: 'Close' }).click();

        await page.getByRole('button', { name: 'Save to history' }).click();
        await expect(page.getByText('Assessment saved to history.')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Attach report to history' })).toBeVisible();
    });

    test('shows an error state when the AI call fails', async ({ page }) => {
        await page.route('**/api/config', (route) => route.fulfill({ json: { aiReportEnabled: true } }));
        await page.route('**/api/gap-analysis', (route) => route.fulfill({ status: 502, json: { error: 'Gap analysis failed' } }));
        await completeFullAssessment(page);

        await page.getByRole('button', { name: 'Generate Gap Analysis Report' }).click();
        await page.locator('#gap-analysis-consent-accept').check();
        await page.getByRole('button', { name: 'Analyze' }).click();

        await expect(page.getByText(/unable to generate the gap analysis report/i)).toBeVisible();
    });
});
