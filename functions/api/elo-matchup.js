import { getDB } from './_db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const competitionId = url.searchParams.get('competitionId');

        if (!competitionId) {
            return Response.json({ error: 'competitionId is required' }, { status: 400, headers: corsHeaders });
        }

        const db = getDB(env);

        // Fetch 2 random entries for the given competition
        const { results } = await db.prepare(
            `SELECT id, title, description, videoUrl, creatorName, elo_rating 
             FROM entries 
             WHERE competitionId = ? 
             ORDER BY RANDOM() 
             LIMIT 2`
        ).bind(competitionId).all();

        if (!results || results.length < 2) {
             return Response.json({ error: 'Not enough entries for a matchup' }, { status: 400, headers: corsHeaders });
        }

        return Response.json(results, { headers: corsHeaders });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
