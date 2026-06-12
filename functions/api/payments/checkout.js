import { getDB } from '../_db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env, data }) {
  const user = data?.user;
  if (!user || !user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const { competitionId, amountCents } = await request.json();
    if (!competitionId || !amountCents || amountCents <= 0) {
      return Response.json({ error: 'competitionId and valid amountCents are required' }, { status: 400, headers: corsHeaders });
    }

    const comp = await getDB(env).prepare(`SELECT * FROM competitions WHERE id = ?`).bind(competitionId).first();
    if (!comp) {
      return Response.json({ error: 'Competition not found' }, { status: 404, headers: corsHeaders });
    }

    const totalAmountCents = Math.round(amountCents * 1.15); // 15% platform fee

    const keyId = env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const keySecret = env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

    let orderId = 'mock_order_' + Date.now();

    if (!keyId.startsWith('rzp_test_placeholder') && !keySecret.startsWith('placeholder_secret')) {
      const basicAuth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          amount: totalAmountCents,
          currency: 'USD',
          receipt: `receipt_${competitionId}_${Date.now()}`.substring(0, 40)
        })
      });
      
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) {
        throw new Error(rzpData.error?.description || 'Failed to create Razorpay order');
      }
      orderId = rzpData.id;
    }

    const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();
    await getDB(env).prepare(
      `INSERT INTO payments (id, competition_id, payer_id, amount_cents, currency, type, status, stripe_session_id, created_at)
       VALUES (?, ?, ?, ?, 'usd', 'funding', 'pending', ?, ?)`
    ).bind(paymentId, competitionId, user.id, amountCents, orderId, now).run();

    return Response.json({ orderId, amount: totalAmountCents, keyId }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
