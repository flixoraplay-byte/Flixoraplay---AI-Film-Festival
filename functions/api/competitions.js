// functions/api/competitions.js
// GET  /api/competitions          — list all
// POST /api/competitions          — create one

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM competitions ORDER BY createdAt DESC`
    ).all();
    return Response.json(results, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const id = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString().split('T')[0];

    await env.DB.prepare(
      `INSERT INTO competitions (id,title,description,theme,prize,maxDuration,deadline,status,hostId,hostName,judging,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id,
      body.title || '',
      body.description || '',
      body.theme || '',
      body.prize || null,
      body.maxDuration || 15,
      body.deadline,
      'open',
      body.hostId || 'guest',
      body.hostName || 'Anonymous',
      body.judging || 'manual',
      now
    ).run();

    const comp = await env.DB.prepare(`SELECT * FROM competitions WHERE id=?`).bind(id).first();
    return Response.json(comp, { status: 201, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
