// functions/api/brands/[id].js
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ params, env }) {
  try {
    const brand = await env.DB.prepare(
      `SELECT * FROM brands WHERE id = ?`
    ).bind(params.id).first();

    if (!brand) {
      return Response.json({ error: 'Brand profile not found' }, { status: 404, headers: corsHeaders });
    }

    return Response.json(brand, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
