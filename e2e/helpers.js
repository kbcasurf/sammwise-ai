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
  let questionIndex = 0;
  for (let i = 0; i < count; i++) {
    const radio = radios.nth(i);
    const name = await radio.getAttribute('name');
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    // Cycle through the 4 choices per question instead of always picking the first
    // (value 0). Degenerate all-zero scores make an empty chart and a correctly
    // rendered chart look identical, hiding the stale-dataset-reference bug this
    // suite is meant to catch.
    const optionIndex = questionIndex % 4;
    // Use evaluate to set the radio directly via JS and trigger change events
    await page.evaluate(({ selector, index }) => {
      const radios = Array.from(document.querySelectorAll(selector));
      const target = radios[index];
      if (target && !target.checked) {
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, { selector: `input[type="radio"][name="${name}"]`, index: optionIndex });
    questionIndex++;
  }
}

async function getChartData(page, canvasSelector) {
  return page.evaluate((selector) => {
    const canvas = document.querySelector(selector);
    if (!canvas) return null;
    const fiberKey = Object.keys(canvas).find((k) => k.startsWith('__reactFiber'));
    let node = fiberKey ? canvas[fiberKey] : null;
    let depth = 0;
    while (node && depth < 15) {
      if (node.memoizedProps && node.memoizedProps.data && node.memoizedProps.data.datasets) {
        return node.memoizedProps.data;
      }
      node = node.return;
      depth++;
    }
    return null;
  }, canvasSelector);
}

module.exports = { startAssessment, clickNavTab, answerAllVisibleRadios, getChartData };
