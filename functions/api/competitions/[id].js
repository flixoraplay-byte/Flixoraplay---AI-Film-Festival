// functions/api/competitions/[id].js
// GET /api/competitions/:id   — get single competition
// PUT /api/competitions/:id   — update (status, winners, scores)
import { createNotification } from '../notifications.js';
import { sendEmail, resultsAnnouncedEmail } from '../_email.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ params, env }) {
  try {
    const comp = await env.DB.prepare(
      `SELECT * FROM competitions WHERE id=?`
    ).bind(params.id).first();

    if (!comp) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    return Response.json(comp, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPut({ params, request, env }) {
  try {
    const body = await request.json();
    const fields = [];
    const values = [];

    // Allow updating status, prize, deadline, title, description
    const allowed = ['status', 'prize', 'deadline', 'title', 'description', 'theme', 'maxDuration', 'judging'];
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
    await env.DB.prepare(
      `UPDATE competitions SET ${fields.join(',')} WHERE id=?`
    ).bind(...values).run();

    // If ranking entries is part of update, handle entry ranks
    if (body.rankings) {
      for (const [entryId, rank] of Object.entries(body.rankings)) {
        await env.DB.prepare(
          `UPDATE entries SET rank=? WHERE id=? AND competitionId=?`
        ).bind(rank, entryId, params.id).run();
      }
    }

    const comp = await env.DB.prepare(`SELECT * FROM competitions WHERE id=?`).bind(params.id).first();

    // If status transitioned to 'results', notify all entrants
    if (body.status === 'results' && comp) {
      try {
        const { results: entries } = await env.DB.prepare(
          `SELECT * FROM entries WHERE competitionId=?`
        ).bind(params.id).all();

        for (const entry of entries) {
          if (entry.creatorId && entry.creatorId !== 'guest') {
            // Create in-app notification
            await createNotification(env.DB, {
              userId: entry.creatorId,
              type: 'results',
              title: 'Competition Results Published',
              message: `The results for "${comp.title}" have been announced! Your rank: ${entry.rank || 'Participant'}.`,
              link: `competition.html?id=${comp.id}`
            });

            // Fetch user email to send email notification
            const user = await env.DB.prepare(`SELECT email FROM users WHERE id=?`).bind(entry.creatorId).first();
            if (user && user.email) {
              await sendEmail({
                to: user.email,
                subject: `Results announced for ${comp.title}`,
                html: resultsAnnouncedEmail(comp.title, entry.rank)
              }, env);
            }
          }
        }
      } catch (notifyErr) {
        console.error('Failed to dispatch results notifications:', notifyErr);
      }
    }

    return Response.json(comp, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
