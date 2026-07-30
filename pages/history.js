// pages/history.js
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Line } from 'react-chartjs-2';
import assessmentCalculator from '../comps/surveyDisplay/graphs/testCalculator';
import GapAnalysisReport from '../comps/gapAnalysis/GapAnalysisReport';

// created_at is stored as an SQLite CURRENT_TIMESTAMP string (e.g. '2026-07-30 01:09:13')
// which is UTC but carries no timezone designator. `new Date(str)` on a designator-less
// string parses it as *local* time, silently shifting the displayed hour/day. Inserting
// the 'T' separator and a 'Z' suffix forces correct UTC parsing before converting to the
// viewer's local time for display.
function toLocalDate(created_at) {
    return new Date(created_at.replace(' ', 'T') + 'Z');
}

const History = () => {
    const router = useRouter();
    const [assessments, setAssessments] = useState([]);
    const [company, setCompany] = useState('');
    const [project, setProject] = useState('');
    const [debouncedCompany, setDebouncedCompany] = useState('');
    const [debouncedProject, setDebouncedProject] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewedReport, setViewedReport] = useState(null);
    const [viewedPracticeScores, setViewedPracticeScores] = useState({});
    const [reportModalVisible, setReportModalVisible] = useState(false);

    // Debounce the filter inputs so each keystroke doesn't trigger its own request.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCompany(company);
            setDebouncedProject(project);
        }, 300);
        return () => clearTimeout(timer);
    }, [company, project]);

    const fetchAssessments = useCallback(async () => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (debouncedCompany) params.set('company', debouncedCompany);
        if (debouncedProject) params.set('project', debouncedProject);
        try {
            const response = await fetch(`/api/assessments?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to load assessments');
            }
            const data = await response.json();
            setAssessments(data);
        } catch (err) {
            setError('Unable to load history. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [debouncedCompany, debouncedProject]);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    async function handleDelete(id) {
        const confirmed = confirm('Are you sure you want to delete this assessment?');
        if (!confirmed) return;
        const response = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchAssessments();
        } else {
            setError('Unable to delete this assessment.');
        }
    }

    function handleCompare(id) {
        router.push(`/results?compareId=${id}`);
    }

    async function handleViewReport(id) {
        const response = await fetch(`/api/assessments/${id}`);
        if (!response.ok) {
            setError('Unable to load the gap analysis report.');
            return;
        }
        const record = await response.json();
        const calc = new assessmentCalculator(record.data);
        calc.computeResults();
        const scoresByName = {};
        calc.practiceNames.forEach((name, idx) => { scoresByName[name] = calc.practiceScores[idx]; });
        setViewedPracticeScores(scoresByName);
        setViewedReport(record.gapAnalysisReport);
        setReportModalVisible(true);
    }

    const chronological = assessments.slice().reverse();
    const trendData = {
        labels: chronological.map((a) => toLocalDate(a.created_at).toLocaleDateString()),
        datasets: [
            {
                label: 'Overall score',
                data: chronological.map((a) => a.overall_score),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };
    const showTrend = project.trim().length > 0 && assessments.length > 0;
    const isFiltered = company.trim().length > 0 || project.trim().length > 0;

    return (
        <>
            <Head>
                <title>SAMMWise | History</title>
            </Head>
            <h1>Assessment History</h1>
            <div className="historyFilters">
                <input
                    type="text"
                    placeholder="Filter by company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Filter by project"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                />
            </div>

            {error && <p className="historyError">{error}</p>}

            {showTrend && (
                <div className="historyTrend">
                    <h2>Score trend</h2>
                    <Line data={trendData} />
                </div>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : assessments.length === 0 ? (
                <p>
                    {isFiltered
                        ? 'No assessments found for this filter.'
                        : 'No assessments saved yet.'}
                </p>
            ) : (
                <table className="historyTable">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Project</th>
                            <th>Score</th>
                            <th>Date</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {assessments.map((a) => (
                            <tr key={a.id}>
                                <td>{a.company_name}</td>
                                <td>{a.project_name}</td>
                                <td>{a.overall_score != null ? a.overall_score.toFixed(2) : '-'}</td>
                                <td>{toLocalDate(a.created_at).toLocaleString()}</td>
                                <td>
                                    <button className="btn" onClick={() => handleCompare(a.id)}>Compare</button>
                                    <button className="btn" onClick={() => handleDelete(a.id)}>Delete</button>
                                    {a.has_gap_analysis_report ? (
                                        <button className="btn" onClick={() => handleViewReport(a.id)}>View report</button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <GapAnalysisReport
                visible={reportModalVisible}
                loading={false}
                error={false}
                report={viewedReport}
                practiceScores={viewedPracticeScores}
                onClose={() => setReportModalVisible(false)}
            />
        </>
    );
};

export default History;
