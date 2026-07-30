import handler from '../../../pages/api/config';

function createMockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
}

describe('GET /api/config', () => {
    const originalKey = process.env.AI_PROVIDER_API_KEY;
    afterEach(() => {
        if (originalKey === undefined) { delete process.env.AI_PROVIDER_API_KEY; } else { process.env.AI_PROVIDER_API_KEY = originalKey; }
    });

    test('reports aiReportEnabled true when API key is set', () => {
        process.env.AI_PROVIDER_API_KEY = 'test-key';
        const res = createMockRes();
        handler({ method: 'GET' }, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ aiReportEnabled: true });
    });

    test('reports aiReportEnabled false when API key is empty', () => {
        delete process.env.AI_PROVIDER_API_KEY;
        const res = createMockRes();
        handler({ method: 'GET' }, res);
        expect(res.json).toHaveBeenCalledWith({ aiReportEnabled: false });
    });

    test('rejects non-GET methods', () => {
        const res = createMockRes();
        handler({ method: 'POST' }, res);
        expect(res.status).toHaveBeenCalledWith(405);
    });
});
