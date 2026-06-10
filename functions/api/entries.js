import { getDB } from './_db.js';
// functions/api/entries.js
// GET  /api/entries?competitionId=xxx   — list entries (filtered)
// POST /api/entries                     — submit an entry
import { createNotification } from './notifications.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const competitionId = url.searchParams.get('competitionId');

    let results;
    if (competitionId) {
      ({ results } = await getDB(env).prepare(
        `SELECT * FROM entries WHERE competitionId=? ORDER BY score DESC, votes DESC`
      ).bind(competitionId).all());
    } else {
      ({ results } = await getDB(env).prepare(
        `SELECT * FROM entries ORDER BY submittedAt DESC`
      ).all());
    }

    // Parse tools JSON string back to array
    results = results.map(e => ({ ...e, tools: JSON.parse(e.tools || '[]') }));
    return Response.json(results, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const id = 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString().split('T')[0];

    await getDB(env).prepare(
      `INSERT INTO entries (id,competitionId,title,description,videoUrl,creatorId,creatorName,tools,score,rank,votes,submittedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id,
      body.competitionId,
      body.title || '',
      body.description || '',
      body.videoUrl || '',
      body.creatorId || 'guest',
      body.creatorName || 'Anonymous',
      JSON.stringify(body.tools || []),
      0,
      null,
      0,
      now
    ).run();

    // Fetch competition and trigger host notification
    try {
      const comp = await getDB(env).prepare(`SELECT * FROM competitions WHERE id = ?`).bind(body.competitionId).first();
      if (comp && comp.hostId) {
        await createNotification(getDB(env), {
          userId: comp.hostId,
          type: 'submission',
          title: 'New Entry Submitted',
          message: `"${body.creatorName || 'Anonymous'}" submitted "${body.title || 'Untitled'}" to your competition "${comp.title}".`,
          link: `competition.html?id=${comp.id}`
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify host of entry submission:', notifErr);
    }

    const entry = await getDB(env).prepare(`SELECT * FROM entries WHERE id=?`).bind(id).first();
    entry.tools = JSON.parse(entry.tools || '[]');
    return Response.json(entry, { status: 201, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
