import db from '../../../lib/assessmentsDb';

export default function handler(req, res) {
    const { id } = req.query;
    if (req.method === 'GET') {
        return handleGet(req, res, id);
    }
    if (req.method === 'PATCH') {
        return handlePatch(req, res, id);
    }
    if (req.method === 'DELETE') {
        return handleDelete(req, res, id);
    }
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

function handleGet(req, res, id) {
    const row = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
    if (!row) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    return res.status(200).json({
        ...row,
        data: JSON.parse(row.data),
        gapAnalysisReport: row.gap_analysis_report ? JSON.parse(row.gap_analysis_report) : null,
    });
}

function handlePatch(req, res, id) {
    const { gapAnalysisReport } = req.body || {};
    if (!gapAnalysisReport || typeof gapAnalysisReport !== 'object') {
        return res.status(400).json({ error: 'gapAnalysisReport is required and must be an object' });
    }
    try {
        const result = db.prepare('UPDATE assessments SET gap_analysis_report = ? WHERE id = ?')
            .run(JSON.stringify(gapAnalysisReport), id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Failed to attach gap analysis report', err);
        return res.status(500).json({ error: 'Failed to attach gap analysis report' });
    }
}

function handleDelete(req, res, id) {
    const result = db.prepare('DELETE FROM assessments WHERE id = ?').run(id);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    return res.status(204).end();
}
