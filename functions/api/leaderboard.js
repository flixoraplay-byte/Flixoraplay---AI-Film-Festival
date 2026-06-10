import { getDB } from './_db.js';
// functions/api/leaderboard.js
// GET /api/leaderboard — global creator ranking based on medals

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ env }) {
  try {
    // Aggregate points per creator: 1st=3pts, 2nd=2pts, 3rd=1pt
    const { results } = await getDB(env).prepare(`
      SELECT
        creatorId,
        creatorName,
        SUM(CASE WHEN rank=1 THEN 3 WHEN rank=2 THEN 2 WHEN rank=3 THEN 1 ELSE 0 END) AS pts,
        SUM(CASE WHEN rank=1 THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN rank=2 THEN 1 ELSE 0 END) AS p2,
        SUM(CASE WHEN rank=3 THEN 1 ELSE 0 END) AS p3
      FROM entries
      WHERE rank IS NOT NULL AND rank <= 3
      GROUP BY creatorId, creatorName
      ORDER BY pts DESC, wins DESC
      LIMIT 50
    `).all();

    return Response.json(results, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
