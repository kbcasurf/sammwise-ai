const DEFAULTS = {
    apiFormat: 'openai',
    timeoutMs: 60000,
    maxTokens: 2000,
    extraBody: '{}'
};

export function getAiProviderConfig() {
    return {
        apiUrl: process.env.AI_PROVIDER_API_URL || '',
        apiKey: process.env.AI_PROVIDER_API_KEY || '',
        apiFormat: process.env.AI_PROVIDER_API_FORMAT || DEFAULTS.apiFormat,
        model: process.env.AI_PROVIDER_MODEL || '',
        timeoutMs: Number(process.env.AI_PROVIDER_TIMEOUT_MS) || DEFAULTS.timeoutMs,
        maxTokens: Number(process.env.AI_PROVIDER_MAX_TOKENS) || DEFAULTS.maxTokens,
        extraBody: process.env.AI_PROVIDER_EXTRA_BODY || DEFAULTS.extraBody
    };
}

export function isAiReportEnabled() {
    return typeof process.env.AI_PROVIDER_API_KEY === 'string' && process.env.AI_PROVIDER_API_KEY.length > 0;
}

const aiProviderEnv = { getAiProviderConfig, isAiReportEnabled };
export default aiProviderEnv;
