// pages/history.js
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Line } from 'react-chartjs-2';

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
            setError('Não foi possível carregar o histórico. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [debouncedCompany, debouncedProject]);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    async function handleDelete(id) {
        const confirmed = confirm('Tem certeza que deseja excluir esta avaliação?');
        if (!confirmed) return;
        const response = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchAssessments();
        } else {
            setError('Não foi possível excluir esta avaliação.');
        }
    }

    function handleCompare(id) {
        router.push(`/results?compareId=${id}`);
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
                <title>SAMMWise | Histórico</title>
            </Head>
            <h1>Histórico de avaliações</h1>
            <div className="historyFilters">
                <input
                    type="text"
                    placeholder="Filtrar por empresa"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Filtrar por projeto"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                />
            </div>

            {error && <p className="historyError">{error}</p>}

            {showTrend && (
                <div className="historyTrend">
                    <h2>Tendência de score</h2>
                    <Line data={trendData} />
                </div>
            )}

            {loading ? (
                <p>Carregando...</p>
            ) : assessments.length === 0 ? (
                <p>
                    {isFiltered
                        ? 'Nenhuma avaliação encontrada para este filtro.'
                        : 'Nenhuma avaliação salva ainda.'}
                </p>
            ) : (
                <table className="historyTable">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Projeto</th>
                            <th>Score</th>
                            <th>Data</th>
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
                                    <button className="btn" onClick={() => handleCompare(a.id)}>Comparar</button>
                                    <button className="btn" onClick={() => handleDelete(a.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
};

export default History;
