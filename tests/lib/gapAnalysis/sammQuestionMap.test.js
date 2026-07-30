import { buildQuestionMap, getTotalQuestionCount } from '../../../lib/gapAnalysis/sammQuestionMap';

describe('buildQuestionMap', () => {
    test('maps exactly 90 questions', () => {
        const map = buildQuestionMap();
        expect(Object.keys(map)).toHaveLength(90);
        expect(getTotalQuestionCount()).toBe(90);
    });

    test('question 1 belongs to Governance / Strategy and Metrics at level 1', () => {
        const map = buildQuestionMap();
        expect(map[1].businessFunction).toBe('Governance');
        expect(map[1].practice).toBe('Strategy and Metrics');
        expect(map[1].level).toBe(1);
    });

    test('question 90 belongs to Operations', () => {
        const map = buildQuestionMap();
        expect(map[90].businessFunction).toBe('Operations');
    });

    test('every practice has exactly 6 questions with levels [1,2,3,1,2,3]', () => {
        const map = buildQuestionMap();
        const byPractice = {};
        Object.values(map).forEach((q) => {
            const key = `${q.businessFunction}::${q.practice}`;
            byPractice[key] = byPractice[key] || [];
            byPractice[key].push(q.level);
        });
        Object.values(byPractice).forEach((levels) => {
            expect(levels).toEqual([1, 2, 3, 1, 2, 3]);
        });
        expect(Object.keys(byPractice)).toHaveLength(15);
    });

    test('each question keeps its title and choice texts from the survey definition', () => {
        const map = buildQuestionMap();
        expect(typeof map[1].title).toBe('string');
        expect(map[1].title.length).toBeGreaterThan(0);
        expect(map[1].choices.length).toBeGreaterThan(0);
    });
});
