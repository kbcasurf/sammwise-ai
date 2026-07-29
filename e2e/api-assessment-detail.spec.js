const { test, expect } = require('@playwright/test');

async function createAssessment(request, overrides = {}) {
    const response = await request.post('/api/assessments', {
        data: {
            data: { 'Company Name': 'Acme Corp', 'Project name': 'SAMM Rollout', ...overrides },
            overallScore: 1.75,
        },
    });
    return (await response.json()).id;
}

test.describe('assessments API - detail and delete', () => {
    test('GET by id returns the full record including data', async ({ request }) => {
        const id = await createAssessment(request);
        const response = await request.get(`/api/assessments/${id}`);
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.data['Company Name']).toBe('Acme Corp');
        expect(body.id).toBe(id);
    });

    test('GET with unknown id returns 404', async ({ request }) => {
        const response = await request.get('/api/assessments/999999');
        expect(response.status()).toBe(404);
    });

    test('DELETE removes the record', async ({ request }) => {
        const id = await createAssessment(request);
        const deleteResponse = await request.delete(`/api/assessments/${id}`);
        expect(deleteResponse.status()).toBe(204);

        const getResponse = await request.get(`/api/assessments/${id}`);
        expect(getResponse.status()).toBe(404);
    });

    test('DELETE with unknown id returns 404', async ({ request }) => {
        const response = await request.delete('/api/assessments/999999');
        expect(response.status()).toBe(404);
    });
});
