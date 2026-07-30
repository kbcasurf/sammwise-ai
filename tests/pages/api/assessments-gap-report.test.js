import fs from 'fs';
import os from 'os';
import path from 'path';

describe('gap analysis report persistence', () => {
    let dbPath;
    let assessmentsHandler;
    let assessmentHandler;

    beforeAll(async () => {
        dbPath = path.join(os.tmpdir(), `sammwise-test-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
        process.env.DATABASE_PATH = dbPath;
        delete globalThis.__assessmentsDb;
        ({ default: assessmentsHandler } = await import('../../../pages/api/assessments/index'));
        ({ default: assessmentHandler } = await import('../../../pages/api/assessments/[id]'));
    });

    afterAll(() => {
        delete globalThis.__assessmentsDb;
        ['', '-wal', '-shm'].forEach((suffix) => fs.rmSync(`${dbPath}${suffix}`, { force: true }));
    });

    function createMockRes() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.setHeader = jest.fn().mockReturnValue(res);
        res.end = jest.fn().mockReturnValue(res);
        return res;
    }

    async function createAssessment() {
        const res = createMockRes();
        await assessmentsHandler({ method: 'POST', body: { data: { 'Company Name': 'Acme' }, overallScore: 1.5 } }, res);
        return res.json.mock.calls[0][0].id;
    }

    test('PATCH attaches a report and GET returns it parsed', async () => {
        const id = await createAssessment();
        const patchRes = createMockRes();
        await assessmentHandler({ method: 'PATCH', query: { id }, body: { gapAnalysisReport: { summary: 's', gaps: [] } } }, patchRes);
        expect(patchRes.status).toHaveBeenCalledWith(200);

        const getRes = createMockRes();
        await assessmentHandler({ method: 'GET', query: { id } }, getRes);
        const body = getRes.json.mock.calls[0][0];
        expect(body.gapAnalysisReport).toEqual({ summary: 's', gaps: [] });
    });

    test('PATCH with unknown id returns 404', async () => {
        const res = createMockRes();
        await assessmentHandler({ method: 'PATCH', query: { id: 999999 }, body: { gapAnalysisReport: { summary: 's', gaps: [] } } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('PATCH without gapAnalysisReport returns 400', async () => {
        const id = await createAssessment();
        const res = createMockRes();
        await assessmentHandler({ method: 'PATCH', query: { id }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('GET before attaching a report returns gapAnalysisReport: null', async () => {
        const id = await createAssessment();
        const res = createMockRes();
        await assessmentHandler({ method: 'GET', query: { id } }, res);
        expect(res.json.mock.calls[0][0].gapAnalysisReport).toBeNull();
    });

    test('list endpoint flags has_gap_analysis_report after attaching a report', async () => {
        const id = await createAssessment();
        await assessmentHandler({ method: 'PATCH', query: { id }, body: { gapAnalysisReport: { summary: 's', gaps: [] } } }, createMockRes());
        const listRes = createMockRes();
        await assessmentsHandler({ method: 'GET', query: {} }, listRes);
        const rows = listRes.json.mock.calls[0][0];
        const row = rows.find((r) => r.id === id);
        expect(row.has_gap_analysis_report).toBe(1);
    });
});
