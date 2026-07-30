import totalsurveyJson from '../../comps/surveys/totalsurvey';

// testCalculator.js (comps/surveyDisplay/graphs/testCalculator.js) computes
// lvl1 = (q[0]+q[3])/2, lvl2 = (q[1]+q[4])/2, lvl3 = (q[2]+q[5])/2 for each
// practice's 6 questions — two interleaved streams, not consecutive pairs.
// This ordering must match that exactly or the AI prompt mislabels levels.
const LEVEL_BY_POSITION = [1, 2, 3, 1, 2, 3];

export function buildQuestionMap() {
    const survey = totalsurveyJson();
    const map = {};
    let index = 0;
    survey.pages.forEach((page) => {
        if (page.name === 'Details' || !page.elements) { return; }
        page.elements.forEach((panel) => {
            let position = 0;
            (panel.elements || []).forEach((question) => {
                index += 1;
                map[index] = {
                    businessFunction: page.name,
                    practice: panel.name,
                    level: LEVEL_BY_POSITION[position],
                    title: question.title,
                    description: question.description || '',
                    choices: (question.choices || []).map((c) => ({ value: c.value, text: c.text }))
                };
                position += 1;
            });
        });
    });
    return map;
}

export function getTotalQuestionCount() {
    return Object.keys(buildQuestionMap()).length;
}

// Two independent naming vocabularies exist for the same 15 SAMM practices:
//   - the survey panel names (comps/surveys/surveypanels/**), which is what
//     buildQuestionMap() above emits as `practice`, and therefore what the AI
//     prompt/gap-analysis report uses as `gap.practice` — this is treated as the
//     canonical vocabulary.
//   - comps/surveyDisplay/graphs/testCalculator.js's hardcoded `practiceNames`,
//     used to key practiceScores/scoresByName in pages/results.js and
//     pages/history.js.
// These agree on 12 of 15 names but disagree on 3. Neither file should be renamed
// (both are load-bearing for existing data/charts/history), so this map translates
// testCalculator's vocabulary to the canonical survey-panel vocabulary wherever a
// practiceScores/scoresByName object is built, so GapAnalysisReport's
// `practiceScores[gap.practice]` lookup always hits.
const TEST_CALCULATOR_TO_SURVEY_PRACTICE_NAME = {
    'Environment Management': 'Environmental Management',
    'Operations Management': 'Operational Management',
    'Requirements Testing': 'Requirements-driven Testing'
};

export function getTestCalculatorPracticeAlias(testCalculatorPracticeName) {
    return TEST_CALCULATOR_TO_SURVEY_PRACTICE_NAME[testCalculatorPracticeName] || testCalculatorPracticeName;
}

export default { buildQuestionMap, getTotalQuestionCount, getTestCalculatorPracticeAlias };
