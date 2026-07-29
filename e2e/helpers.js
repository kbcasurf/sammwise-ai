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
    const input = page.locator(`input[type="radio"][name="${name}"]`).nth(optionIndex);
    // SurveyJS renders these radios visually hidden (clipped to 1x1px) behind a styled
    // <label> that is the actual clickable surface for a real user. Force-clicking the
    // hidden <input> directly is unreliable: swapping practice panels re-renders the
    // question list without stable per-question keys, so React/the browser can reuse the
    // same <input> DOM nodes for a different question, and the native radio-group
    // "checked" bookkeeping leaks a stale selection onto the freshly-swapped node before
    // a forced click on it registers. Clicking the visible label sidesteps this entirely.
    await input.locator('xpath=ancestor::label[1]').click();
    questionIndex++;
  }
}

async function getChartData(page, canvasSelector) {
  return page.evaluate((selector) => {
    const canvas = document.querySelector(selector);
    if (!canvas) return null;
    const fiberKey = Object.keys(canvas).find((k) => k.startsWith('__reactFiber'));
    const canvasFiber = fiberKey ? canvas[fiberKey] : null;
    // react-chartjs-2's ChartComponent renders <canvas> directly from its own function
    // body, so the canvas fiber's `.return` IS the ChartComponent fiber -- reading the
    // `data` prop off of it (walking further up as a fallback) reflects whatever object
    // pages/results.js currently holds, NOT what Chart.js was actually told to paint:
    // react-chartjs-2 only re-syncs its internal chart when the `data.datasets` *array
    // reference* changes (see its useEffect deps), so mutating `datasets[i].data` in
    // place leaves the real chart frozen while this prop object silently drifts ahead.
    // The only way to see what's actually rendered is the Chart.js instance itself,
    // reached via chartRef, react-chartjs-2's second hook (after canvasRef) in
    // ChartComponent -- both are plain useRef() calls, so this is a direct, not a
    // guessed, read of its hooks linked list for the installed react-chartjs-2 version.
    const componentFiber = canvasFiber ? canvasFiber.return : null;
    const canvasRefHook = componentFiber ? componentFiber.memoizedState : null;
    const chartRefHook = canvasRefHook ? canvasRefHook.next : null;
    const chart = chartRefHook && chartRefHook.memoizedState ? chartRefHook.memoizedState.current : null;
    if (!chart) return null;
    return chart.config.data;
  }, canvasSelector);
}

module.exports = { startAssessment, clickNavTab, answerAllVisibleRadios, getChartData };
