import db from '../../../lib/assessmentsDb';

export default function handler(req, res) {
    if (req.method === 'POST') {
        return handlePost(req, res);
    }
    if (req.method === 'GET') {
        return handleGet(req, res);
    }
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

function handlePost(req, res) {
    const { data, overallScore } = req.body;
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'data is required and must be a non-empty object' });
    }
    try {
        const stmt = db.prepare(`
            INSERT INTO assessments (company_name, project_name, overall_score, data)
            VALUES (@company_name, @project_name, @overall_score, @data)
        `);
        const result = stmt.run({
            company_name: data['Company Name'] || null,
            project_name: data['Project name'] || null,
            overall_score: overallScore != null ? Number(overallScore) : null,
            data: JSON.stringify(data),
        });
        return res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
        console.error('Failed to save assessment', err);
        return res.status(500).json({ error: 'Failed to save assessment' });
    }
}

function handleGet(req, res) {
    const { company, project } = req.query;
    try {
        let query = 'SELECT id, company_name, project_name, overall_score, created_at FROM assessments WHERE 1=1';
        const params = {};
        if (company) {
            query += ' AND company_name LIKE @company';
            params.company = `%${company}%`;
        }
        if (project) {
            query += ' AND project_name LIKE @project';
            params.project = `%${project}%`;
        }
        query += ' ORDER BY created_at DESC, id DESC';
        const rows = db.prepare(query).all(params);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Failed to list assessments', err);
        return res.status(500).json({ error: 'Failed to list assessments' });
    }
}
