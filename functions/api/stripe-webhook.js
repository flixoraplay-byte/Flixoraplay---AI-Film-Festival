// functions/api/stripe-webhook.js
import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  const stripeKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  const signature = request.headers.get('stripe-signature');
  const bodyText = await request.text();

  let event;

  if (!stripeKey || stripeKey === 'PLACEHOLDER') {
    return new Response('Stripe not configured', { status: 200, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

  try {
    if (webhookSecret && webhookSecret !== 'PLACEHOLDER' && signature) {
      event = await stripe.webhooks.constructEventAsync(
        bodyText,
        signature,
        webhookSecret
      );
    } else {
      console.warn('[Stripe Webhook] Unverified webhook event parsed (no STRIPE_WEBHOOK_SECRET set)');
      event = JSON.parse(bodyText);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
  }

  // Handle verified events
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const compId = session.metadata?.competitionId;
      const amtCents = parseInt(session.metadata?.amountCents || '0', 10);

      // Verify payment details exist
      const payment = await env.DB.prepare(
        `SELECT * FROM payments WHERE stripe_session_id = ?`
      ).bind(sessionId).first();

      if (payment && payment.status === 'pending') {
        await env.DB.prepare(
          `UPDATE payments SET status = 'completed' WHERE id = ?`
        ).bind(payment.id).run();

        await env.DB.prepare(
          `UPDATE competitions SET prize_funded = 1, prize_pool_cents = ? WHERE id = ?`
        ).bind(amtCents, compId).run();

        console.log(`[Webhook success] Completed checkout session ${sessionId}`);
      }
    }

    return new Response('Webhook handled successfully', { status: 200, headers: corsHeaders });
  } catch (dbErr) {
    console.error('Webhook database handling failed:', dbErr);
    return new Response(`Database Error: ${dbErr.message}`, { status: 500, headers: corsHeaders });
  }
}
