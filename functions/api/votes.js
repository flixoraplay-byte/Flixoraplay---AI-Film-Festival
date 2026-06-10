import { getDB } from './_db.js';
// functions/api/votes.js
// POST /api/votes  — cast a vote for an entry (once per voter per entry)
import { createNotification } from './notifications.js';

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
    const existing = await getDB(env).prepare(
      `SELECT id FROM votes WHERE entryId=? AND voterId=?`
    ).bind(entryId, voterId).first();

    if (existing) {
      return Response.json({ error: 'Already voted' }, { status: 409, headers: corsHeaders });
    }

    const id = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    await getDB(env).prepare(
      `INSERT INTO votes (id, entryId, voterId, createdAt) VALUES (?,?,?,?)`
    ).bind(id, entryId, voterId, now).run();

    // Increment vote count
    await getDB(env).prepare(
      `UPDATE entries SET votes = votes + 1 WHERE id=?`
    ).bind(entryId).run();

    const entry = await getDB(env).prepare(`SELECT * FROM entries WHERE id=?`).bind(entryId).first();

    // Trigger vote notification (max 1 per hour per entry)
    try {
      if (entry && entry.creatorId && entry.creatorId !== 'guest') {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const link = `competition.html?id=${entry.competitionId}`;
        const recentNotif = await getDB(env).prepare(
          `SELECT id FROM notifications WHERE user_id = ? AND type = 'vote' AND link = ? AND created_at > ?`
        ).bind(entry.creatorId, link, oneHourAgo).first();

        if (!recentNotif) {
          await createNotification(getDB(env), {
            userId: entry.creatorId,
            type: 'vote',
            title: 'Your Entry Received Votes',
            message: `People are liking your film "${entry.title}" in the competition!`,
            link: link
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to send vote notification:', notifErr);
    }

    return Response.json({ success: true, votes: entry.votes }, { status: 201, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
