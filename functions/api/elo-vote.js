import { getDB } from './_db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { winnerId, loserId } = body;

        if (!winnerId || !loserId) {
            return Response.json({ error: 'winnerId and loserId are required' }, { status: 400, headers: corsHeaders });
        }

        const db = getDB(env);

        // Fetch current ELO ratings
        const winner = await db.prepare('SELECT elo_rating FROM entries WHERE id = ?').bind(winnerId).first();
        const loser = await db.prepare('SELECT elo_rating FROM entries WHERE id = ?').bind(loserId).first();

        if (!winner || !loser) {
            return Response.json({ error: 'Invalid entry IDs' }, { status: 400, headers: corsHeaders });
        }

        const R_a = winner.elo_rating || 1200;
        const R_b = loser.elo_rating || 1200;

        // ELO formula calculation
        const E_a = 1 / (1 + Math.pow(10, (R_b - R_a) / 400));
        const E_b = 1 / (1 + Math.pow(10, (R_a - R_b) / 400));

        const K = 32;
        const new_R_a = Math.round(R_a + K * (1 - E_a));
        const new_R_b = Math.round(R_b + K * (0 - E_b));

        // Update DB
        await db.prepare('UPDATE entries SET elo_rating = ? WHERE id = ?').bind(new_R_a, winnerId).run();
        await db.prepare('UPDATE entries SET elo_rating = ? WHERE id = ?').bind(new_R_b, loserId).run();

        return Response.json({ success: true, new_winner_elo: new_R_a, new_loser_elo: new_R_b }, { headers: corsHeaders });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
