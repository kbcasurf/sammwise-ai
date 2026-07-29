import db from '../../../lib/assessmentsDb';

export default function handler(req, res) {
    const { id } = req.query;
    if (req.method === 'GET') {
        return handleGet(req, res, id);
    }
    if (req.method === 'DELETE') {
        return handleDelete(req, res, id);
    }
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

function handleGet(req, res, id) {
    const row = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
    if (!row) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    return res.status(200).json({ ...row, data: JSON.parse(row.data) });
}

function handleDelete(req, res, id) {
    const result = db.prepare('DELETE FROM assessments WHERE id = ?').run(id);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    return res.status(204).end();
}
