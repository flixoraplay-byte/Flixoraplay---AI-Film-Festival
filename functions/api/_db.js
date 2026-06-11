import { createClient } from '@libsql/client/web';

export function getTursoClient(env) {
    if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
        // Fallback to D1 for local dev if Turso vars are not set
        if (env.DB) return null; 
        throw new Error("Missing Turso configuration: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.");
    }
    return createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
    });
}

export function getDB(env) {
    if (env._db) return env._db;
    
    const turso = getTursoClient(env);
    
    // If Turso is not configured and env.DB exists, fallback to D1 (local dev usually)
    if (!turso && env.DB) {
        env._db = env.DB;
        return env._db;
    }

    env._db = {
        prepare: (sql) => {
            let boundArgs = [];
            const stmt = {
                sql: sql,
                args: () => boundArgs, // getter for batch
                bind: (...args) => {
                    boundArgs = args;
                    return stmt;
                },
                all: async () => {
                    const res = await turso.execute({ sql, args: boundArgs });
                    return { results: res.rows, success: true };
                },
                first: async (colName) => {
                    const res = await turso.execute({ sql, args: boundArgs });
                    if (res.rows.length === 0) return null;
                    if (colName) return res.rows[0][colName];
                    return res.rows[0];
                },
                run: async () => {
                    const res = await turso.execute({ sql, args: boundArgs });
                    return { success: true, meta: { changes: res.rowsAffected } };
                }
            };
            return stmt;
        },
        batch: async (stmts) => {
            const tursoStmts = stmts.map(s => ({ sql: s.sql, args: s.args() }));
            const results = await turso.batch(tursoStmts, "write");
            return results.map(r => ({ results: r.rows, success: true, meta: { changes: r.rowsAffected } }));
        }
    };
    return env._db;
}
