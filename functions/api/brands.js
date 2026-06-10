import { getDB } from './_db.js';
// functions/api/brands.js
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await getDB(env).prepare(
      `SELECT * FROM brands WHERE verified = 1 ORDER BY company_name ASC`
    ).all();
    return Response.json({ brands: results }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPost({ request, env, data }) {
  const user = data?.user;
  if (!user || !user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const { companyName, website, industry, logoUrl } = await request.json();
    if (!companyName) {
      return Response.json({ error: 'companyName is required' }, { status: 400, headers: corsHeaders });
    }

    // Check if brand profile already exists
    const existing = await getDB(env).prepare(
      `SELECT id FROM brands WHERE user_id = ?`
    ).bind(user.id).first();

    if (existing) {
      return Response.json({ error: 'Brand profile already registered' }, { status: 400, headers: corsHeaders });
    }

    const brandId = 'brand_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    // Insert brand profile
    await getDB(env).prepare(
      `INSERT INTO brands (id, user_id, company_name, logo_url, website, industry, verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)` // Auto-verified for demo simplicity
    ).bind(brandId, user.id, companyName, logoUrl || '', website || '', industry || 'Other', now).run();

    // Update user role to 'brand'
    await getDB(env).prepare(
      `UPDATE users SET role = 'brand' WHERE id = ?`
    ).bind(user.id).run();

    return Response.json({ success: true, brandId, role: 'brand' }, { status: 201, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
