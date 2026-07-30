import { analyzeAnswers, extractJson, normalizeReport } from '../../../lib/gapAnalysis/gapAnalysisService';

const FAKE_QUESTION_MAP = {
    1: { businessFunction: 'Governance', practice: 'Strategy and Metrics', level: 1, title: 'Q1', description: 'D1', choices: [{ value: 0, text: 'No' }, { value: 1, text: 'Yes' }] },
    2: { businessFunction: 'Governance', practice: 'Strategy and Metrics', level: 2, title: 'Q2', description: 'D2', choices: [{ value: 0, text: 'No' }, { value: 1, text: 'Yes' }] },
    3: { businessFunction: 'Design', practice: 'Threat Assessment', level: 1, title: 'Q3', description: 'D3', choices: [{ value: 0, text: 'No' }, { value: 1, text: 'Yes' }] }
};

function fakeQuestionMap() {
    return FAKE_QUESTION_MAP;
}

function fakeConfig(overrides = {}) {
    return {
        apiUrl: 'https://example.com/v1/chat/completions',
        apiKey: 'test-key',
        apiFormat: 'openai',
        model: 'test-model',
        timeoutMs: 1000,
        maxTokens: 500,
        extraBody: '{}',
        ...overrides
    };
}

describe('extractJson', () => {
    test('parses a fenced JSON code block', () => {
        expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    });

    test('parses bare JSON', () => {
        expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    });

    test('returns null for non-JSON content', () => {
        expect(extractJson('not json at all')).toBeNull();
    });

    test('returns null for non-string input', () => {
        expect(extractJson(null)).toBeNull();
    });
});

describe('normalizeReport', () => {
    const validPractices = { Governance: new Set(['Strategy and Metrics']) };

    test('keeps a gap with a known businessFunction/practice pair', () => {
        const result = normalizeReport({
            summary: 'Summary text',
            gaps: [{ businessFunction: 'Governance', practice: 'Strategy and Metrics', priority: 'High', gapDescription: 'desc', recommendation: 'rec' }]
        }, validPractices);
        expect(result.gaps).toHaveLength(1);
        expect(result.gaps[0].priority).toBe('High');
    });

    test('drops a gap with an unknown practice for its businessFunction', () => {
        const result = normalizeReport({
            summary: '',
            gaps: [{ businessFunction: 'Governance', practice: 'Not A Real Practice', gapDescription: 'desc' }]
        }, validPractices);
        expect(result.gaps).toHaveLength(0);
    });

    test('defaults an invalid priority to Medium', () => {
        const result = normalizeReport({
            gaps: [{ businessFunction: 'Governance', practice: 'Strategy and Metrics', priority: 'Extreme', gapDescription: 'desc' }]
        }, validPractices);
        expect(result.gaps[0].priority).toBe('Medium');
    });

    test('drops a gap with an empty gapDescription', () => {
        const result = normalizeReport({
            gaps: [{ businessFunction: 'Governance', practice: 'Strategy and Metrics', gapDescription: '' }]
        }, validPractices);
        expect(result.gaps).toHaveLength(0);
    });

    test('returns an empty gaps array when gaps is missing', () => {
        expect(normalizeReport({ summary: 'x' }, validPractices).gaps).toEqual([]);
    });
});

describe('analyzeAnswers', () => {
    test('rejects a non-https AI_PROVIDER_API_URL', async () => {
        await expect(analyzeAnswers(
            { answers: { question1: 1, question2: 1, question3: 1 } },
            { configDep: () => fakeConfig({ apiUrl: 'http://example.com' }), questionMapDep: fakeQuestionMap }
        )).rejects.toMatchObject({ statusCode: 500 });
    });

    test('rejects when no practice is fully answered', async () => {
        await expect(analyzeAnswers(
            { answers: { question1: 1 } },
            { configDep: fakeConfig, questionMapDep: fakeQuestionMap }
        )).rejects.toMatchObject({ statusCode: 400 });
    });

    test('sends an OpenAI-shaped request and returns the normalized report', async () => {
        const fetchDep = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: '{"summary":"s","gaps":[]}' } }] })
        });
        const result = await analyzeAnswers(
            { answers: { question1: 1, question2: 1, question3: 1 } },
            { configDep: () => fakeConfig(), questionMapDep: fakeQuestionMap, fetchDep }
        );
        expect(result.summary).toBe('s');
        expect(result.incompletePractices).toEqual([]);
        const [url, options] = fetchDep.mock.calls[0];
        expect(url).toBe('https://example.com/v1/chat/completions');
        const body = JSON.parse(options.body);
        expect(body.messages[0].role).toBe('system');
        expect(options.headers.Authorization).toBe('Bearer test-key');
    });

    test('sends an Anthropic-shaped request when apiFormat is anthropic', async () => {
        const fetchDep = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ content: [{ type: 'text', text: '{"summary":"s","gaps":[]}' }] })
        });
        await analyzeAnswers(
            { answers: { question1: 1, question2: 1, question3: 1 } },
            { configDep: () => fakeConfig({ apiFormat: 'anthropic' }), questionMapDep: fakeQuestionMap, fetchDep }
        );
        const [, options] = fetchDep.mock.calls[0];
        expect(options.headers['x-api-key']).toBe('test-key');
        expect(options.headers['anthropic-version']).toBe('2023-06-01');
    });

    test('marks an incomplete practice and excludes it from the prompt', async () => {
        const fetchDep = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: '{"summary":"s","gaps":[]}' } }] })
        });
        const result = await analyzeAnswers(
            { answers: { question1: 1, question2: 1 } },
            { configDep: () => fakeConfig(), questionMapDep: fakeQuestionMap, fetchDep }
        );
        expect(result.incompletePractices).toEqual([{ businessFunction: 'Design', practice: 'Threat Assessment' }]);
        const [, options] = fetchDep.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.messages[1].content).not.toContain('Threat Assessment');
    });

    test('rejects when the provider response is not parseable JSON', async () => {
        const fetchDep = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'not json' } }] }) });
        await expect(analyzeAnswers(
            { answers: { question1: 1, question2: 1, question3: 1 } },
            { configDep: () => fakeConfig(), questionMapDep: fakeQuestionMap, fetchDep }
        )).rejects.toMatchObject({ statusCode: 502 });
    });

    test('rejects when the provider response is not ok', async () => {
        const fetchDep = jest.fn().mockResolvedValue({ ok: false });
        await expect(analyzeAnswers(
            { answers: { question1: 1, question2: 1, question3: 1 } },
            { configDep: () => fakeConfig(), questionMapDep: fakeQuestionMap, fetchDep }
        )).rejects.toMatchObject({ statusCode: 502 });
    });

    test('rejects when fetch throws', async () => {
        const fetchDep = jest.fn().mockRejectedValue(new Error('network down'));
        await expect(analyzeAnswers(
            { answers: { question1: 1, question2: 1, question3: 1 } },
            { configDep: () => fakeConfig(), questionMapDep: fakeQuestionMap, fetchDep }
        )).rejects.toMatchObject({ statusCode: 502 });
    });
});
