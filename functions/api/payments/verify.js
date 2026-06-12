import { getDB } from '../_db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id) {
      return Response.json({ error: 'Missing payment details' }, { status: 400, headers: corsHeaders });
    }

    const payment = await getDB(env).prepare(
      `SELECT * FROM payments WHERE stripe_session_id = ?`
    ).bind(razorpay_order_id).first();

    if (!payment) {
      return Response.json({ error: 'Payment record not found' }, { status: 404, headers: corsHeaders });
    }

    const keySecret = env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    let verified = false;

    if (razorpay_order_id.startsWith('mock_order_') || keySecret === 'placeholder_secret') {
      console.warn('[Razorpay Warning] Mock verification for order:', razorpay_order_id);
      verified = true;
    } else {
      const encoder = new TextEncoder();
      const data = encoder.encode(razorpay_order_id + "|" + razorpay_payment_id);
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(keySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['sign']
      );
      const signatureBuf = await crypto.subtle.sign('HMAC', key, data);
      const signatureHex = Array.from(new Uint8Array(signatureBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signatureHex === razorpay_signature) {
        verified = true;
      }
    }

    if (verified && payment.status === 'pending') {
      await getDB(env).prepare(
        `UPDATE payments SET status = 'completed' WHERE id = ?`
      ).bind(payment.id).run();

      await getDB(env).prepare(
        `UPDATE competitions SET prize_funded = 1, prize_pool_cents = ? WHERE id = ?`
      ).bind(payment.amount_cents, payment.competition_id).run();

      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Invalid signature or already processed' }, { status: 400, headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
