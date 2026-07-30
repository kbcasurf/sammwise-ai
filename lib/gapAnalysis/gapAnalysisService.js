import { getAiProviderConfig } from './aiProviderEnv';
import { buildQuestionMap } from './sammQuestionMap';

const BUSINESS_FUNCTIONS = ['Governance', 'Design', 'Implementation', 'Verification', 'Operations'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const MAX_TEXT = 2000;
const ANTHROPIC_VERSION = '2023-06-01';
const VALID_ANSWER_VALUES = [0, 0.25, 0.5, 1];

const SYSTEM_PROMPT = [
    'You are an OWASP SAMM (Software Assurance Maturity Model) assessment assistant.',
    'You are given the fixed SAMM assessment questions grouped by business function and',
    'practice, each paired with the multiple-choice answer the user selected.',
    'Use your own knowledge of the OWASP SAMM model to identify maturity gaps and',
    'recommend concrete next steps. Practices absent from the input were left incomplete',
    'by the user and must not be analyzed.',
    'Respond with STRICT JSON only, no prose, matching:',
    '{"summary":string,"gaps":[{"businessFunction":string,"practice":string,',
    '"priority":one of ["Low","Medium","High"],"gapDescription":string,"recommendation":string}]}'
].join(' ');

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1F\x7F]/gu;

export const sanitizeText = (value, max) => {
    if (typeof value !== 'string') { return ''; }
    return value.replace(CONTROL_CHARS, ' ').trim().slice(0, max);
};

export const extractJson = (content) => {
    if (typeof content !== 'string') { return null; }
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/iu);
    const candidate = fenced ? fenced[1] : content;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) { return null; }
    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return null;
    }
};

const parseJsonObject = (raw) => {
    if (typeof raw !== 'string' || raw.length === 0) { return {}; }
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const buildValidPractices = (questionMap) => {
    const result = {};
    Object.values(questionMap).forEach((q) => {
        if (!result[q.businessFunction]) { result[q.businessFunction] = new Set(); }
        result[q.businessFunction].add(q.practice);
    });
    return result;
};

const normalizeGap = (raw, validPractices) => {
    const businessFunction = raw && BUSINESS_FUNCTIONS.includes(raw.businessFunction) ? raw.businessFunction : null;
    if (!businessFunction) { return null; }
    const practices = validPractices[businessFunction];
    const practice = raw && practices && practices.has(raw.practice) ? raw.practice : null;
    if (!practice) { return null; }
    const gapDescription = sanitizeText(raw && raw.gapDescription, MAX_TEXT);
    if (gapDescription.length === 0) { return null; }
    return {
        businessFunction,
        practice,
        priority: raw && PRIORITIES.includes(raw.priority) ? raw.priority : 'Medium',
        gapDescription,
        recommendation: sanitizeText(raw && raw.recommendation, MAX_TEXT)
    };
};

export const normalizeReport = (parsed, validPractices) => ({
    summary: sanitizeText(parsed && parsed.summary, MAX_TEXT),
    gaps: (parsed && Array.isArray(parsed.gaps))
        ? parsed.gaps.map((g) => normalizeGap(g, validPractices)).filter((g) => g !== null)
        : []
});

const buildPromptData = (answers, questionMap) => {
    const byPractice = {};
    Object.keys(questionMap).forEach((key) => {
        const q = questionMap[key];
        const practiceKey = `${q.businessFunction}::${q.practice}`;
        if (!byPractice[practiceKey]) {
            byPractice[practiceKey] = { businessFunction: q.businessFunction, practice: q.practice, questions: [] };
        }
        const value = answers ? answers[`question${key}`] : undefined;
        const choice = (q.choices || []).find((c) => c.value === value);
        byPractice[practiceKey].questions.push({ level: q.level, title: q.title, description: q.description, value, choiceText: choice ? choice.text : null });
    });

    const complete = [];
    const incomplete = [];
    Object.values(byPractice).forEach((entry) => {
        const isComplete = entry.questions.every((question) => VALID_ANSWER_VALUES.includes(question.value));
        if (isComplete) {
            complete.push({
                businessFunction: entry.businessFunction,
                practice: entry.practice,
                questions: entry.questions.map(({ level, title, description, choiceText }) => ({ level, title, description, answer: choiceText }))
            });
        } else {
            incomplete.push({ businessFunction: entry.businessFunction, practice: entry.practice });
        }
    });

    return { complete, incomplete };
};

const buildOpenAiRequest = ({ promptText, config }) => ({
    body: {
        model: config.model,
        max_tokens: Number(config.maxTokens),
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: promptText }
        ],
        ...parseJsonObject(config.extraBody)
    },
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' }
});

const extractOpenAiContent = (data) => (data && Array.isArray(data.choices) && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : null);

const buildAnthropicRequest = ({ promptText, config }) => ({
    body: {
        model: config.model,
        max_tokens: Number(config.maxTokens),
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: promptText }]
    },
    headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'Content-Type': 'application/json'
    }
});

const extractAnthropicContent = (data) => (data && Array.isArray(data.content)
    ? data.content.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n')
    : null);

const ADAPTERS = {
    openai: { build: buildOpenAiRequest, extract: extractOpenAiContent },
    anthropic: { build: buildAnthropicRequest, extract: extractAnthropicContent }
};

export const analyzeAnswers = async ({ answers }, deps = {}) => {
    const fetchDep = deps.fetchDep || fetch;
    const configDep = deps.configDep || getAiProviderConfig;
    const questionMapDep = deps.questionMapDep || buildQuestionMap;
    const config = configDep();

    if (typeof config.apiUrl !== 'string' || !config.apiUrl.startsWith('https://')) {
        const err = new Error('AI_PROVIDER_API_URL must use https');
        err.statusCode = 500;
        throw err;
    }

    const questionMap = questionMapDep();
    const validPractices = buildValidPractices(questionMap);
    const { complete, incomplete } = buildPromptData(answers, questionMap);

    if (complete.length === 0) {
        const err = new Error('No completed practices to analyze');
        err.statusCode = 400;
        throw err;
    }

    const adapter = ADAPTERS[config.apiFormat] || ADAPTERS.openai;
    const promptText = JSON.stringify(complete);
    const { body, headers } = adapter.build({ promptText, config });

    let response;
    try {
        response = await fetchDep(config.apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(Number(config.timeoutMs))
        });
    } catch {
        const err = new Error('AI provider request failed');
        err.statusCode = 502;
        throw err;
    }

    if (!response.ok) {
        const err = new Error('AI provider request failed');
        err.statusCode = 502;
        throw err;
    }

    const data = await response.json();
    const parsed = extractJson(adapter.extract(data));
    if (parsed === null) {
        const err = new Error('AI provider returned an unparseable response');
        err.statusCode = 502;
        throw err;
    }

    const report = normalizeReport(parsed, validPractices);
    return { ...report, incompletePractices: incomplete };
};

export default { analyzeAnswers, extractJson, normalizeReport, sanitizeText };
