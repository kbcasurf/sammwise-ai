import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'sammwise.sqlite');

function createConnection() {
    fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
    const connection = new Database(DATABASE_PATH);
    connection.pragma('journal_mode = WAL');
    connection.exec(`
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            project_name TEXT,
            overall_score REAL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            data TEXT NOT NULL
        );
    `);
    connection.exec(`
        CREATE INDEX IF NOT EXISTS idx_assessments_company_project_created
        ON assessments (company_name, project_name, created_at);
    `);
    return connection;
}

// Next.js re-evaluates route modules per request in dev; cache the connection
// on `globalThis` outside production so hot-reload doesn't open a second
// handle on the same SQLite file.
let db;
if (process.env.NODE_ENV === 'production') {
    db = createConnection();
} else {
    if (!globalThis.__assessmentsDb) {
        globalThis.__assessmentsDb = createConnection();
    }
    db = globalThis.__assessmentsDb;
}

export default db;
