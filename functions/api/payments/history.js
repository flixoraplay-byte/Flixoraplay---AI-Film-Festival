// functions/api/payments/history.js
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
    const { results } = await env.DB.prepare(
      `SELECT p.*, c.title as competition_title
       FROM payments p
       JOIN competitions c ON p.competition_id = c.id
       WHERE p.payer_id = ? OR p.payee_id = ?
       ORDER BY p.created_at DESC`
    ).bind(user.id, user.id).all();

    return Response.json({ payments: results }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
