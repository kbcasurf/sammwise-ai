const { test, expect } = require('@playwright/test');

const sampleData = {
  'Company Name': 'Acme Corp',
  'Project name': 'SAMM Rollout',
  question1: 1,
};

test.describe('assessments API', () => {
  test('POST creates an assessment and GET lists it without the data blob', async ({ request }) => {
    const createResponse = await request.post('/api/assessments', {
      data: { data: sampleData, overallScore: 2.5 },
    });
    expect(createResponse.status()).toBe(201);
    const { id } = await createResponse.json();
    expect(id).toBeGreaterThan(0);

    const listResponse = await request.get('/api/assessments');
    expect(listResponse.ok()).toBeTruthy();
    const list = await listResponse.json();
    const created = list.find((row) => row.id === id);
    expect(created).toMatchObject({
      company_name: 'Acme Corp',
      project_name: 'SAMM Rollout',
      overall_score: 2.5,
    });
    expect(created).not.toHaveProperty('data');
  });

  test('GET filters by project', async ({ request }) => {
    await request.post('/api/assessments', {
      data: { data: { ...sampleData, 'Project name': 'Filter Target' }, overallScore: 1 },
    });
    const response = await request.get('/api/assessments?project=Filter Target');
    const list = await response.json();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((row) => row.project_name === 'Filter Target')).toBe(true);
  });

  test('POST without data returns 400', async ({ request }) => {
    const response = await request.post('/api/assessments', { data: {} });
    expect(response.status()).toBe(400);
  });
});
