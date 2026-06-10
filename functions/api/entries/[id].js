import { getDB } from '../_db.js';
// functions/api/entries/[id].js
// GET /api/entries/:id   — get single entry
// PUT /api/entries/:id   — update score, rank, notes

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ params, env }) {
  try {
    const entry = await getDB(env).prepare(
      `SELECT * FROM entries WHERE id=?`
    ).bind(params.id).first();

    if (!entry) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    entry.tools = JSON.parse(entry.tools || '[]');
    return Response.json(entry, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPut({ params, request, env }) {
  try {
    const body = await request.json();
    const fields = [];
    const values = [];

    const allowed = ['score', 'rank'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key}=?`);
        values.push(body[key]);
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400, headers: corsHeaders });
    }

    values.push(params.id);
    await getDB(env).prepare(
      `UPDATE entries SET ${fields.join(',')} WHERE id=?`
    ).bind(...values).run();

    const entry = await getDB(env).prepare(`SELECT * FROM entries WHERE id=?`).bind(params.id).first();
    entry.tools = JSON.parse(entry.tools || '[]');
    return Response.json(entry, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
