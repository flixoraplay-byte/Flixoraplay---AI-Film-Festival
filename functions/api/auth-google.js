import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { sendEmail, welcomeEmail } from './_email.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return Response.json({ error: 'Credential is required' }, { status: 400, headers: corsHeaders });
    }

    // Verify Google ID token
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!tokenInfoRes.ok) {
      const errorText = await tokenInfoRes.text();
      console.error("Google token verification failed:", errorText);
      return Response.json({ error: 'Invalid Google credential' }, { status: 401, headers: corsHeaders });
    }

    const payload = await tokenInfoRes.json();
    const { email, name, sub } = payload; // sub is the unique Google user ID

    if (!email) {
      return Response.json({ error: 'Google account has no email' }, { status: 400, headers: corsHeaders });
    }

    // Check if user exists by email
    let user = await env.DB.prepare(
      `SELECT * FROM users WHERE email=?`
    ).bind(email).first();

    const now = new Date().toISOString();

    if (user) {
      // User exists, check if google_id is set
      if (!user.google_id) {
        await env.DB.prepare(
          `UPDATE users SET google_id=? WHERE email=?`
        ).bind(sub, email).run();
        user.google_id = sub;
      }
    } else {
      // Create new user
      const id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

      // Generate random password hash (they use Google login)
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(randomPassword, saltRounds);

      const role = 'creator';
      // Fallback if name is missing
      const username = name || email.split('@')[0];

      await env.DB.prepare(
        `INSERT INTO users (id, username, email, password_hash, role, createdAt, google_id) VALUES (?,?,?,?,?,?,?)`
      ).bind(id, username, email, passwordHash, role, now, sub).run();

      // Dispatch welcome email asynchronously
      try {
        sendEmail({ to: email, subject: 'Welcome to FlixoraPlay!', html: welcomeEmail(username) }, env);
      } catch (err) {
        console.error('Welcome email dispatch failed:', err);
      }

      user = { id, username, email, role, createdAt: now, google_id: sub };
    }

    // Generate JWT
    const token = await jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) },
      env.JWT_SECRET || 'secret'
    );

    return Response.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    }, { status: 200, headers: corsHeaders });

  } catch (e) {
    console.error("AUTH GOOGLE ERROR:", e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
