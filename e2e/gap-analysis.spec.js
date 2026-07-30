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

// Regression coverage for the practice-name vocabulary mismatch (survey panels use
// "Environmental Management" / "Operational Management" / "Requirements-driven Testing",
// while testCalculator.practiceNames — which practiceScores/scoresByName is keyed from —
// uses "Environment Management" / "Operations Management" / "Requirements Testing").
// Without the sammQuestionMap alias, GapAnalysisReport's practiceScores[gap.practice]
// lookup silently misses for these 3 practices and the "Current Score" column renders
// "-" instead of the real score.
const HISTORY_FAKE_REPORT = {
    summary: 'Operations maturity lags behind the rest of the assessment.',
    gaps: [
        {
            businessFunction: 'Operations',
            practice: 'Environmental Management',
            priority: 'Medium',
            gapDescription: 'Production environment hardening is inconsistent.',
            recommendation: 'Adopt a standard hardened baseline for all environments.'
        }
    ],
    incompletePractices: []
};

test.describe('Gap analysis report — /history "View report" flow', () => {
    test('saved report is viewable from /history and shows a real Current Score', async ({ page }) => {
        await page.route('**/api/config', (route) => route.fulfill({ json: { aiReportEnabled: true } }));
        await page.route('**/api/gap-analysis', (route) => route.fulfill({ json: HISTORY_FAKE_REPORT }));
        await completeFullAssessment(page);

        await page.getByRole('button', { name: 'Save to history' }).click();
        await expect(page.getByText('Assessment saved to history.')).toBeVisible();

        await page.getByRole('button', { name: 'Generate Gap Analysis Report' }).click();
        await page.locator('#gap-analysis-consent-accept').check();
        await page.getByRole('button', { name: 'Analyze' }).click();
        await expect(page.getByText(HISTORY_FAKE_REPORT.summary)).toBeVisible();

        // The report renders in a fixed, full-viewport modal that overlays the rest of
        // the page, including "Attach report to history" — close it first, same as the
        // "attach to history is disabled..." test above must do.
        await page.getByRole('button', { name: 'Close' }).click();

        await page.getByRole('button', { name: 'Attach report to history' }).click();
        await expect(page.getByText('Report attached to history.')).toBeVisible();

        await page.goto('/history');
        await page.getByRole('button', { name: 'View report' }).first().click();

        await expect(page.getByText(HISTORY_FAKE_REPORT.summary)).toBeVisible();
        const gapRow = page.locator('tr', { hasText: 'Environmental Management' });
        await expect(gapRow).toHaveCount(1);
        await expect(gapRow.getByText('Production environment hardening is inconsistent.')).toBeVisible();

        // The "Current Score" column is the 3rd column of the gap row. Assert it is a
        // real number, not the "-" fallback the mismatch bug produced.
        const currentScoreCell = gapRow.locator('td').nth(2);
        await expect(currentScoreCell).not.toHaveText('-');
        await expect(currentScoreCell).toHaveText(/^\d+\.\d{2}$/);
    });
});
