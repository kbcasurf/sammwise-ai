jest.mock('../../../lib/gapAnalysis/gapAnalysisService');
import handler from '../../../pages/api/gap-analysis';
import { analyzeAnswers } from '../../../lib/gapAnalysis/gapAnalysisService';

function createMockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
}

function validAnswers() {
    const answers = {};
    for (let i = 1; i <= 90; i += 1) { answers[`question${i}`] = 1; }
    return answers;
}

describe('POST /api/gap-analysis', () => {
    const originalKey = process.env.AI_PROVIDER_API_KEY;

    beforeEach(() => {
        process.env.AI_PROVIDER_API_KEY = 'test-key';
        jest.clearAllMocks();
    });

    afterAll(() => {
        if (originalKey === undefined) { delete process.env.AI_PROVIDER_API_KEY; } else { process.env.AI_PROVIDER_API_KEY = originalKey; }
    });

    test('returns 403 when AI report is disabled', async () => {
        delete process.env.AI_PROVIDER_API_KEY;
        const res = createMockRes();
        await handler({ method: 'POST', body: { answers: validAnswers() } }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('returns 400 when answers is missing', async () => {
        const res = createMockRes();
        await handler({ method: 'POST', body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when an answer value is invalid', async () => {
        const res = createMockRes();
        const answers = validAnswers();
        answers.question5 = 0.9;
        await handler({ method: 'POST', body: { answers } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 200 with the service result on success', async () => {
        analyzeAnswers.mockResolvedValue({ summary: 'ok', gaps: [], incompletePractices: [] });
        const res = createMockRes();
        await handler({ method: 'POST', body: { answers: validAnswers() } }, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ summary: 'ok', gaps: [], incompletePractices: [] });
    });

    test('maps a service error statusCode to the response', async () => {
        const err = new Error('boom');
        err.statusCode = 502;
        analyzeAnswers.mockRejectedValue(err);
        const res = createMockRes();
        await handler({ method: 'POST', body: { answers: validAnswers() } }, res);
        expect(res.status).toHaveBeenCalledWith(502);
    });

    test('rejects non-POST methods', async () => {
        const res = createMockRes();
        await handler({ method: 'GET' }, res);
        expect(res.status).toHaveBeenCalledWith(405);
    });
});
