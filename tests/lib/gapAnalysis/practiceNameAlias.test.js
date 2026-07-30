import { buildQuestionMap, getTestCalculatorPracticeAlias } from '../../../lib/gapAnalysis/sammQuestionMap';
import assessmentCalculator from '../../../comps/surveyDisplay/graphs/testCalculator';

// Regression guard for the practice-name vocabulary mismatch: the survey panels (and
// therefore sammQuestionMap.buildQuestionMap, and therefore gap.practice in AI gap
// analysis reports) use one vocabulary, while testCalculator.practiceNames — used to key
// practiceScores/scoresByName in pages/results.js and pages/history.js — uses a slightly
// different one. 3 of the 15 names disagree. getTestCalculatorPracticeAlias must
// normalize testCalculator's vocabulary to the survey/canonical vocabulary so
// GapAnalysisReport's `practiceScores[gap.practice]` lookup always hits.
describe('getTestCalculatorPracticeAlias', () => {
    test('maps the 3 known-mismatched practice names to the survey-panel vocabulary', () => {
        expect(getTestCalculatorPracticeAlias('Environment Management')).toBe('Environmental Management');
        expect(getTestCalculatorPracticeAlias('Operations Management')).toBe('Operational Management');
        expect(getTestCalculatorPracticeAlias('Requirements Testing')).toBe('Requirements-driven Testing');
    });

    test('passes already-matching practice names through unchanged', () => {
        expect(getTestCalculatorPracticeAlias('Strategy and Metrics')).toBe('Strategy and Metrics');
        expect(getTestCalculatorPracticeAlias('Threat Assessment')).toBe('Threat Assessment');
        expect(getTestCalculatorPracticeAlias('Incident Management')).toBe('Incident Management');
    });

    test('every aliased testCalculator practice name exists in the survey-panel (canonical) practice set', () => {
        const calc = new assessmentCalculator({});
        calc.computeResults();
        expect(calc.practiceNames).toHaveLength(15);

        const questionMap = buildQuestionMap();
        const canonicalPractices = new Set(Object.values(questionMap).map((q) => q.practice));
        expect(canonicalPractices.size).toBe(15);

        calc.practiceNames.forEach((testCalculatorName) => {
            const aliased = getTestCalculatorPracticeAlias(testCalculatorName);
            expect(canonicalPractices.has(aliased)).toBe(true);
        });
    });
});
