import React, { useState } from 'react';

const GapAnalysisConsent = ({ visible, onCancel, onConfirm }) => {
    const [accepted, setAccepted] = useState(false);
    const [prevVisible, setPrevVisible] = useState(visible);

    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setAccepted(false);
        }
    }

    if (!visible) {
        return null;
    }

    return (
        <div className="gapAnalysisOverlay">
            <div className="gapAnalysisModal">
                <h2>Generate Gap Analysis Report</h2>
                <p>
                    This sends your assessment answers (SAMM maturity scores and
                    multiple-choice responses to the 90 assessment questions) to an
                    external AI provider to generate an advisory gap analysis report.
                </p>
                <p>No company name, project name, or description is included.</p>
                <p>
                    Ensure this deployment uses HTTPS end-to-end before enabling this
                    feature in a shared environment.
                </p>
                <label className="gapAnalysisCheckboxLabel" htmlFor="gap-analysis-consent-accept">
                    <input
                        id="gap-analysis-consent-accept"
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                    />
                    {' '}I understand and accept sending this data to an external AI provider
                </label>
                <div className="gapAnalysisModalActions">
                    <button className="btn" onClick={onCancel}>Cancel</button>
                    <button className="btn" disabled={!accepted} onClick={onConfirm}>Analyze</button>
                </div>
            </div>
        </div>
    );
};

export default GapAnalysisConsent;
