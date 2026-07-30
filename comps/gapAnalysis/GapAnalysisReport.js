import React from 'react';

const PRIORITY_CLASS = {
    High: 'gapAnalysisPriorityHigh',
    Medium: 'gapAnalysisPriorityMedium',
    Low: 'gapAnalysisPriorityLow'
};

const GapAnalysisReport = ({ visible, loading, error, report, practiceScores, onClose }) => {
    if (!visible) {
        return null;
    }

    return (
        <div className="gapAnalysisOverlay">
            <div className="gapAnalysisModal gapAnalysisReportModal">
                <h2>Gap Analysis Report</h2>
                <p className="gapAnalysisAdvisory">
                    This report is AI-generated advisory content and should be reviewed
                    by a qualified security practitioner before acting on it.
                </p>
                {loading && <p>Analyzing your assessment...</p>}
                {!loading && error && (
                    <p className="historyError">
                        Unable to generate the gap analysis report. Please try again.
                    </p>
                )}
                {!loading && !error && report && (
                    <>
                        <p>{report.summary}</p>
                        {report.incompletePractices && report.incompletePractices.length > 0 && (
                            <p className="gapAnalysisIncomplete">
                                Not assessed (incomplete): {report.incompletePractices
                                    .map((p) => `${p.businessFunction} / ${p.practice}`)
                                    .join(', ')}
                            </p>
                        )}
                        {report.gaps.length === 0 ? (
                            <p>No significant gaps identified.</p>
                        ) : (
                            <table className="gapAnalysisTable">
                                <thead>
                                    <tr>
                                        <th>Business Function</th>
                                        <th>Practice</th>
                                        <th>Current Score</th>
                                        <th>Priority</th>
                                        <th>Gap</th>
                                        <th>Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.gaps.map((gap, i) => (
                                        <tr key={`${gap.businessFunction}-${gap.practice}-${i}`}>
                                            <td>{gap.businessFunction}</td>
                                            <td>{gap.practice}</td>
                                            <td>
                                                {practiceScores && practiceScores[gap.practice] != null
                                                    ? practiceScores[gap.practice].toFixed(2)
                                                    : '-'}
                                            </td>
                                            <td className={PRIORITY_CLASS[gap.priority]}>{gap.priority}</td>
                                            <td>{gap.gapDescription}</td>
                                            <td>{gap.recommendation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
                <div className="gapAnalysisModalActions">
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default GapAnalysisReport;
