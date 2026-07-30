// e2e/history-flow.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment, clickNavTab, answerAllVisibleRadios } = require('./helpers');

test('save to history, compare, and delete', async ({ page, request }) => {
    // Seed an earlier assessment for the same project with an all-zero, 0.00 score.
    // The "Comparar" step below must show THIS specific record's score, proving it
    // fetched the correct historical assessment rather than just reflecting the
    // just-completed current assessment back at itself (which is what the previous
    // version of this test could not distinguish, since it only had one record to
    // click "Comparar" on -- itself).
    const projectName = `E2E Project ${Date.now()}`;
    const seedData = { 'Company Name': 'Acme Corp', 'Project name': projectName };
    for (let i = 1; i <= 90; i++) {
        seedData[`question${i}`] = 0;
    }
    const seedResponse = await request.post('/api/assessments', {
        data: { data: seedData, overallScore: 0 },
    });
    expect(seedResponse.ok()).toBeTruthy();

    await startAssessment(page);
    const domains = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];
    for (const domain of domains) {
        await clickNavTab(page, domain);
        await answerAllVisibleRadios(page);
    }
    await clickNavTab(page, 'Details');
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill('Acme Corp');
    await textInputs.nth(1).fill(projectName);
    await page.getByRole('button', { name: 'Complete' }).click();
    await expect(page).toHaveURL('/results');

    await page.getByRole('button', { name: 'Salvar no histórico' }).click();
    await expect(page.getByText('Avaliação salva no histórico.')).toBeVisible();

    await page.goto('/history');
    await page.getByPlaceholder('Filtrar por projeto').fill(projectName);
    // Two rows now share this project name: the just-saved current assessment (a
    // nonzero score, since answers cycle through all 4 choices) and the seeded
    // 0.00-score historical one. Compare against the seeded (older) row specifically.
    const rows = page.locator('tr', { hasText: projectName });
    await expect(rows).toHaveCount(2);
    const seedRow = rows.filter({ hasText: '0.00' });
    await expect(seedRow).toHaveCount(1);

    await seedRow.getByRole('button', { name: 'Comparar' }).click();
    await expect(page).toHaveURL(/\/results\?compareId=\d+/);
    await expect(page.getByText(/Your score last time was: 0\.00\/3/)).toBeVisible();

    await page.goto('/history');
    await page.getByPlaceholder('Filtrar por projeto').fill(projectName);
    await expect(rows).toHaveCount(2);
    page.once('dialog', (dialog) => dialog.accept());
    await rows.first().getByRole('button', { name: 'Excluir' }).click();
    await expect(rows).toHaveCount(1);
    page.once('dialog', (dialog) => dialog.accept());
    await rows.first().getByRole('button', { name: 'Excluir' }).click();
    await expect(rows).toHaveCount(0);
});

test('a failed save shows an inline error without breaking the results page', async ({ page }) => {
    await startAssessment(page);
    const domains = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];
    for (const domain of domains) {
        await clickNavTab(page, domain);
        await answerAllVisibleRadios(page);
    }
    await clickNavTab(page, 'Details');
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill('Acme Corp');
    await textInputs.nth(1).fill(`E2E Save Failure ${Date.now()}`);

    // Simulate the save request failing server-side (e.g. a DB error) and assert the
    // rest of /results keeps working -- a save failure must never break the page.
    await page.route('**/api/assessments', (route) => {
        if (route.request().method() === 'POST') {
            return route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'simulated failure' }),
            });
        }
        return route.continue();
    });

    await page.getByRole('button', { name: 'Complete' }).click();
    await expect(page).toHaveURL('/results');

    await page.getByRole('button', { name: 'Salvar no histórico' }).click();
    await expect(
        page.getByText('Não foi possível salvar no histórico. Tente novamente.')
    ).toBeVisible();

    // The rest of the page must still render and be usable after the failure.
    await expect(page.getByRole('heading', { name: /Your overall score is/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar no histórico' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Save file' })).toBeVisible();
});
