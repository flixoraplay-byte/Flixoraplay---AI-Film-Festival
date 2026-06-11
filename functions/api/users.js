import { getDB } from './_db.js';
// functions/api/users.js
// GET  /api/users?id=xxx  — public profile data
// PUT  /api/users         — update own profile (requires auth)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function calcTier(points) {
  if (points >= 75) return 'platinum';
  if (points >= 30) return 'gold';
  if (points >= 10) return 'silver';
  return 'bronze';
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return Response.json({ error: 'User ID is required (?id=xxx)' }, { status: 400, headers: corsHeaders });
    }

    // Fetch user — use SELECT * to handle schema variations
    const user = await getDB(env).prepare(
      `SELECT * FROM users WHERE id=?`
    ).bind(userId).first();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    // Build a safe public user object (handle missing columns)
    const publicUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'creator',
      avatar_url: user.avatar_url || null,
      cover_url: user.cover_url || null,
      bio: user.bio || '',
      total_points: user.total_points || 0,
      verified: user.verified || 0,
      createdAt: user.createdAt,
    };
    publicUser.tier = calcTier(publicUser.total_points);

    // Stats: entries count
    const entryCount = await getDB(env).prepare(
      `SELECT COUNT(*) as count FROM entries WHERE creatorId=?`
    ).bind(userId).first();

    // Stats: wins (rank=1)
    const winCount = await getDB(env).prepare(
      `SELECT COUNT(*) as count FROM entries WHERE creatorId=? AND rank=1`
    ).bind(userId).first();

    // Stats: competitions hosted
    const hostCount = await getDB(env).prepare(
      `SELECT COUNT(*) as count FROM competitions WHERE hostId=?`
    ).bind(userId).first();

    // Recent entries with competition titles (last 15)
    const { results: recentEntries } = await getDB(env).prepare(
      `SELECT e.id, e.title, e.competitionId, e.creatorId, e.score, e.rank, e.votes, e.submittedAt, e.tools,
              c.title as competitionTitle
       FROM entries e
       LEFT JOIN competitions c ON e.competitionId = c.id
       WHERE e.creatorId=?
       ORDER BY e.submittedAt DESC
       LIMIT 15`
    ).bind(userId).all();

    // Parse tools JSON
    const entries = recentEntries.map(e => ({
      ...e,
      tools: (() => { try { return JSON.parse(e.tools || '[]'); } catch { return []; } })()
    }));

    return Response.json({
      user: publicUser,
      stats: {
        totalEntries: entryCount?.count || 0,
        wins: winCount?.count || 0,
        competitionsHosted: hostCount?.count || 0,
        points: publicUser.total_points,
      },
      entries,
    }, { headers: corsHeaders });
  } catch (e) {
    console.error('USERS GET ERROR:', e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPut({ request, env, data }) {
  try {
    const authUser = data?.user;
    if (!authUser || !authUser.id) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { username, bio, avatar_url, cover_url } = body;

    // Only allow updating own profile
    const updates = [];
    const values = [];

    if (typeof username === 'string' && username.length > 0) {
      updates.push('username=?');
      values.push(username.slice(0, 50)); // max 50 chars
    }
    if (typeof bio === 'string') {
      updates.push('bio=?');
      values.push(bio.slice(0, 500)); // max 500 chars
    }
    if (typeof avatar_url === 'string') {
      updates.push('avatar_url=?');
      values.push(avatar_url);
    }
    if (typeof cover_url === 'string') {
      updates.push('cover_url=?');
      values.push(cover_url);
    }

    if (updates.length === 0) {
      return Response.json({ error: 'Nothing to update' }, { status: 400, headers: corsHeaders });
    }

    values.push(authUser.id);
    await getDB(env).prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id=?`
    ).bind(...values).run();

    // If username was updated, we must cascade this change to denormalized tables (entries & competitions)
    if (typeof username === 'string' && username.length > 0) {
      const uName = username.slice(0, 50);
      await getDB(env).prepare(`UPDATE entries SET creatorName=? WHERE creatorId=?`).bind(uName, authUser.id).run();
      await getDB(env).prepare(`UPDATE competitions SET hostName=? WHERE hostId=?`).bind(uName, authUser.id).run();
    }

    const updated = await getDB(env).prepare(
      `SELECT id, username, email, role, avatar_url, cover_url, bio, total_points, verified, createdAt FROM users WHERE id=?`
    ).bind(authUser.id).first();

    updated.tier = calcTier(updated.total_points || 0);

    return Response.json({ user: updated }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
