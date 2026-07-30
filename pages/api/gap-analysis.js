import { analyzeAnswers } from '../../lib/gapAnalysis/gapAnalysisService';
import { isAiReportEnabled } from '../../lib/gapAnalysis/aiProviderEnv';
import { getTotalQuestionCount } from '../../lib/gapAnalysis/sammQuestionMap';

const VALID_ANSWER_VALUES = [0, 0.25, 0.5, 1];

function isValidAnswers(answers) {
    if (!answers || typeof answers !== 'object') { return false; }
    const total = getTotalQuestionCount();
    for (let i = 1; i <= total; i += 1) {
        const value = answers[`question${i}`];
        if (value !== undefined && value !== null && !VALID_ANSWER_VALUES.includes(value)) {
            return false;
        }
    }
    return true;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    if (!isAiReportEnabled()) {
        return res.status(403).json({ error: 'Gap analysis report is not enabled' });
    }

    const { answers } = req.body || {};
    if (!isValidAnswers(answers)) {
        return res.status(400).json({ error: 'answers must be an object of question values in {0, 0.25, 0.5, 1}' });
    }

    try {
        const result = await analyzeAnswers({ answers });
        return res.status(200).json(result);
    } catch (err) {
        const statusCode = err && err.statusCode ? err.statusCode : 502;
        // Security: never log the request body or the raw AI response — only the status code.
        console.error(`Gap analysis failed: statusCode=${statusCode}`);
        return res.status(statusCode).json({ error: 'Gap analysis failed' });
    }
}
