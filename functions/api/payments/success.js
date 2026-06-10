import { getDB } from '../_db.js';
// functions/api/payments/success.js
import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const origin = url.origin;

  if (!sessionId) {
    return new Response('Missing session_id', { status: 400 });
  }

  try {
    // Find payment record by session ID
    const payment = await getDB(env).prepare(
      `SELECT * FROM payments WHERE stripe_session_id = ?`
    ).bind(sessionId).first();

    if (!payment) {
      return new Response('Payment record not found', { status: 404 });
    }

    const stripeKey = env.STRIPE_SECRET_KEY;
    let verified = false;

    if (!stripeKey || stripeKey === 'PLACEHOLDER' || sessionId.startsWith('mock_')) {
      console.warn('[Stripe Warning] Mock verification for session:', sessionId);
      verified = true;
    } else {
      const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session && session.payment_status === 'paid') {
        verified = true;
      }
    }

    if (verified && payment.status === 'pending') {
      // Update payment record to completed
      await getDB(env).prepare(
        `UPDATE payments SET status = 'completed' WHERE id = ?`
      ).bind(payment.id).run();

      // Update competition to funded
      await getDB(env).prepare(
        `UPDATE competitions SET prize_funded = 1, prize_pool_cents = ? WHERE id = ?`
      ).bind(payment.amount_cents, payment.competition_id).run();

      console.log(`[Success] Competition ${payment.competition_id} prize pool funded with $${payment.amount_cents / 100}`);
    }

    // Redirect back to competition page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${origin}/competition.html?id=${payment.competition_id}&payment=success`
      }
    });
  } catch (e) {
    console.error('Success handler failed:', e);
    return new Response(`Error verifying payment: ${e.message}`, { status: 500 });
  }
}
