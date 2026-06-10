// functions/api/votes.js
// POST /api/votes  — cast a vote for an entry (once per voter per entry)

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
    const { entryId, voterId } = body;

    if (!entryId || !voterId) {
      return Response.json({ error: 'entryId and voterId required' }, { status: 400, headers: corsHeaders });
    }

    // Check for duplicate
    const existing = await env.DB.prepare(
      `SELECT id FROM votes WHERE entryId=? AND voterId=?`
    ).bind(entryId, voterId).first();

    if (existing) {
      return Response.json({ error: 'Already voted' }, { status: 409, headers: corsHeaders });
    }

    const id = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO votes (id, entryId, voterId, createdAt) VALUES (?,?,?,?)`
    ).bind(id, entryId, voterId, now).run();

    // Increment vote count
    await env.DB.prepare(
      `UPDATE entries SET votes = votes + 1 WHERE id=?`
    ).bind(entryId).run();

    // Return updated vote count
    const entry = await env.DB.prepare(`SELECT id, votes FROM entries WHERE id=?`).bind(entryId).first();
    return Response.json({ success: true, votes: entry.votes }, { status: 201, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
