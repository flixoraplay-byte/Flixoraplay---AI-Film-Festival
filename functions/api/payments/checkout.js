import { getDB } from '../_db.js';
// functions/api/payments/checkout.js
import Stripe from 'stripe';

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

    const stripeKey = env.STRIPE_SECRET_KEY;
    const origin = new URL(request.url).origin;

    // Fetch competition to make sure it exists
    const comp = await getDB(env).prepare(`SELECT * FROM competitions WHERE id = ?`).bind(competitionId).first();
    if (!comp) {
      return Response.json({ error: 'Competition not found' }, { status: 404, headers: corsHeaders });
    }

    const totalAmountCents = Math.round(amountCents * 1.15); // 15% platform fee added

    let checkoutUrl = '';
    let sessionId = 'mock_session_' + Date.now();

    if (!stripeKey || stripeKey === 'PLACEHOLDER' || stripeKey.startsWith('mock_')) {
      console.warn('[Stripe Warning] STRIPE_SECRET_KEY is not set. Simulating checkout URL.');
      // Mock flow redirect back to success immediately
      checkoutUrl = `${origin}/api/payments/success?session_id=${sessionId}`;
    } else {
      const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Prize Pool Funding: ${comp.title}`,
              description: `Includes prize amount ($${(amountCents / 100).toFixed(2)}) + 15% platform fee`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${origin}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/competition.html?id=${competitionId}&payment=cancelled`,
        metadata: {
          competitionId,
          payerId: user.id,
          amountCents: amountCents.toString()
        }
      });

      checkoutUrl = session.url;
      sessionId = session.id;
    }

    // Insert pending payment record
    const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();
    await getDB(env).prepare(
      `INSERT INTO payments (id, competition_id, payer_id, amount_cents, currency, type, status, stripe_session_id, created_at)
       VALUES (?, ?, ?, ?, 'usd', 'funding', 'pending', ?, ?)`
    ).bind(paymentId, competitionId, user.id, amountCents, sessionId, now).run();

    return Response.json({ checkoutUrl }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
