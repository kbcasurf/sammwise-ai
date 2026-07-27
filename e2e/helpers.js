// e2e/helpers.js
const { expect } = require('@playwright/test');

async function startAssessment(page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Assessment' }).click();
  await expect(page).toHaveURL('/assessment');
}

async function clickNavTab(page, name) {
  await page
    .locator('nav')
    .locator('label', { hasText: name })
    .locator('xpath=preceding-sibling::button')
    .click();
}

async function answerAllVisibleRadios(page) {
  const radios = page.locator('input[type="radio"]');
  const count = await radios.count();
  const seenNames = new Set();
  for (let i = 0; i < count; i++) {
    const radio = radios.nth(i);
    const name = await radio.getAttribute('name');
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    await radio.check({ force: true });
  }
}

module.exports = { startAssessment, clickNavTab, answerAllVisibleRadios };
