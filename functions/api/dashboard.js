import { getDB } from './_db.js';
// functions/api/dashboard.js
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ env, data }) {
  const user = data?.user;
  if (!user || !user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    // 1. Get user profile
    const profile = await getDB(env).prepare(
      `SELECT id, username, email, role, verified, avatar_url, cover_url, bio, total_points, createdAt FROM users WHERE id = ?`
    ).bind(user.id).first();

    if (!profile) {
      return Response.json({ error: 'User profile not found' }, { status: 404, headers: corsHeaders });
    }

    // Determine tier based on points
    const pts = profile.total_points || 0;
    let tier = 'Bronze';
    if (pts >= 1000) tier = 'Platinum';
    else if (pts >= 500) tier = 'Gold';
    else if (pts >= 200) tier = 'Silver';
    profile.tier = tier;

    // 2. Stats calculations
    const entriesCountRes = await getDB(env).prepare(
      `SELECT COUNT(*) as cnt FROM entries WHERE creatorId = ?`
    ).bind(user.id).first();
    const totalEntries = entriesCountRes?.cnt || 0;

    const winsRes = await getDB(env).prepare(
      `SELECT COUNT(*) as cnt FROM entries WHERE creatorId = ? AND rank = 1`
    ).bind(user.id).first();
    const wins = winsRes?.cnt || 0;

    // Total earnings from Stripe Payouts
    const earningsRes = await getDB(env).prepare(
      `SELECT SUM(amount_cents) as total FROM payments WHERE payee_id = ? AND status = 'completed'`
    ).bind(user.id).first();
    const earnings = earningsRes?.total || 0;

    // 3. Recent Entries (last 20) with Competition Details
    const { results: recentEntries } = await getDB(env).prepare(
      `SELECT e.*, c.title as competitionTitle, c.status as competitionStatus
       FROM entries e
       LEFT JOIN competitions c ON e.competitionId = c.id
       WHERE e.creatorId = ?
       ORDER BY e.submittedAt DESC
       LIMIT 20`
    ).bind(user.id).all();

    // 4. Hosted Competitions (excluding brand briefs)
    const { results: hostedCompetitions } = await getDB(env).prepare(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM entries WHERE competitionId = c.id) as entryCount
       FROM competitions c
       WHERE c.hostId = ? AND c.is_brand_brief = 0
       ORDER BY c.createdAt DESC`
    ).bind(user.id).all();

    // 5. Brand Briefs (if brand account)
    let brandBriefs = [];
    const brand = await getDB(env).prepare(
      `SELECT id FROM brands WHERE user_id = ?`
    ).bind(user.id).first();

    if (brand) {
      const { results } = await getDB(env).prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM entries WHERE competitionId = c.id) as entryCount
         FROM competitions c
         WHERE c.brand_id = ? AND c.is_brand_brief = 1
         ORDER BY c.createdAt DESC`
      ).bind(brand.id).all();
      brandBriefs = results;
    }

    return Response.json({
      profile,
      stats: {
        totalEntries,
        wins,
        points: pts,
        earnings
      },
      recentEntries,
      hostedCompetitions,
      brandBriefs
    }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
