// e2e/history-flow.spec.js
const { test, expect } = require('@playwright/test');
const { startAssessment, clickNavTab, answerAllVisibleRadios } = require('./helpers');

test('save to history, compare, and delete', async ({ page }) => {
    await startAssessment(page);
    const domains = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];
    for (const domain of domains) {
        await clickNavTab(page, domain);
        await answerAllVisibleRadios(page);
    }
    await clickNavTab(page, 'Details');
    const textInputs = page.locator('input[type="text"]');
    const projectName = `E2E Project ${Date.now()}`;
    await textInputs.nth(0).fill('Acme Corp');
    await textInputs.nth(1).fill(projectName);
    await page.getByRole('button', { name: 'Complete' }).click();
    await expect(page).toHaveURL('/results');

    await page.getByRole('button', { name: 'Salvar no histórico' }).click();
    await expect(page.getByText('Avaliação salva no histórico.')).toBeVisible();

    await page.goto('/history');
    await page.getByPlaceholder('Filtrar por projeto').fill(projectName);
    const row = page.locator('tr', { hasText: projectName });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'Comparar' }).click();
    await expect(page).toHaveURL(/\/results\?compareId=\d+/);
    await expect(page.getByText(/Your score last time was/)).toBeVisible();

    await page.goto('/history');
    await page.getByPlaceholder('Filtrar por projeto').fill(projectName);
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('tr', { hasText: projectName }).getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator('tr', { hasText: projectName })).toHaveCount(0);
});
