import { getDB } from './_db.js';
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

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    const sort = url.searchParams.get('sort') || 'newest';
    const isBrandBrief = url.searchParams.get('is_brand_brief');

    let sql = `SELECT * FROM competitions WHERE 1=1`;
    const params = [];

    if (isBrandBrief !== null) {
      sql += ` AND is_brand_brief = ?`;
      params.push(parseInt(isBrandBrief, 10));
    }

    if (category && category !== 'all') {
      sql += ` AND theme = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (title LIKE ? OR description LIKE ? OR hostName LIKE ? OR theme LIKE ?)`;
      const likeVal = `%${search}%`;
      params.push(likeVal, likeVal, likeVal, likeVal);
    }

    if (sort === 'deadline') {
      sql += ` ORDER BY deadline ASC`;
    } else if (sort === 'prize') {
      sql += ` ORDER BY prize DESC`;
    } else {
      sql += ` ORDER BY createdAt DESC`;
    }

    const { results } = await getDB(env).prepare(sql).bind(...params).all();
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

    const isBrand = body.is_brand_brief ? 1 : 0;
    const brandId = body.brand_id || null;
    const featured = body.featured ? 1 : 0;
    const prizePoolCents = body.prize_pool_cents || 0;
    const prizeFunded = body.prize_funded || 0;

    await getDB(env).prepare(
      `INSERT INTO competitions (id,title,description,theme,thumbnail,prize,prize_pool_cents,prize_funded,is_brand_brief,brand_id,featured,maxDuration,deadline,status,hostId,hostName,judging,createdAt,brand_kit_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id,
      body.title || '',
      body.description || '',
      body.theme || '',
      body.thumbnail || null,
      body.prize || null,
      prizePoolCents,
      prizeFunded,
      isBrand,
      brandId,
      featured,
      body.maxDuration || 15,
      body.deadline,
      'open',
      body.hostId || 'guest',
      body.hostName || 'Anonymous',
      body.judging || 'manual',
      now,
      body.brand_kit_url || null
    ).run();

    const comp = await getDB(env).prepare(`SELECT * FROM competitions WHERE id=?`).bind(id).first();
    return Response.json(comp, { status: 201, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
