import { getAiProviderConfig, isAiReportEnabled } from '../../../lib/gapAnalysis/aiProviderEnv';

describe('aiProviderEnv', () => {
    const ENV_KEYS = ['AI_PROVIDER_API_URL', 'AI_PROVIDER_API_KEY', 'AI_PROVIDER_API_FORMAT', 'AI_PROVIDER_MODEL', 'AI_PROVIDER_TIMEOUT_MS', 'AI_PROVIDER_MAX_TOKENS', 'AI_PROVIDER_EXTRA_BODY'];
    const original = {};

    beforeEach(() => {
        ENV_KEYS.forEach((key) => { original[key] = process.env[key]; delete process.env[key]; });
    });

    afterEach(() => {
        ENV_KEYS.forEach((key) => {
            if (original[key] === undefined) { delete process.env[key]; } else { process.env[key] = original[key]; }
        });
    });

    test('isAiReportEnabled is false when API key is unset', () => {
        expect(isAiReportEnabled()).toBe(false);
    });

    test('isAiReportEnabled is true when API key is a non-empty string', () => {
        process.env.AI_PROVIDER_API_KEY = 'sk-test';
        expect(isAiReportEnabled()).toBe(true);
    });

    test('applies documented defaults when optional vars are unset', () => {
        const config = getAiProviderConfig();
        expect(config.apiFormat).toBe('openai');
        expect(config.timeoutMs).toBe(60000);
        expect(config.maxTokens).toBe(2000);
        expect(config.extraBody).toBe('{}');
    });

    test('reads all configured values from process.env', () => {
        process.env.AI_PROVIDER_API_URL = 'https://api.anthropic.com/v1/messages';
        process.env.AI_PROVIDER_API_KEY = 'sk-test';
        process.env.AI_PROVIDER_API_FORMAT = 'anthropic';
        process.env.AI_PROVIDER_MODEL = 'claude-sonnet-5';
        process.env.AI_PROVIDER_TIMEOUT_MS = '120000';
        process.env.AI_PROVIDER_MAX_TOKENS = '4000';
        const config = getAiProviderConfig();
        expect(config).toEqual({
            apiUrl: 'https://api.anthropic.com/v1/messages',
            apiKey: 'sk-test',
            apiFormat: 'anthropic',
            model: 'claude-sonnet-5',
            timeoutMs: 120000,
            maxTokens: 4000,
            extraBody: '{}'
        });
    });
});
