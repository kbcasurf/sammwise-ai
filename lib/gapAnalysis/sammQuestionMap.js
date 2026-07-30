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

export default { buildQuestionMap, getTotalQuestionCount };
