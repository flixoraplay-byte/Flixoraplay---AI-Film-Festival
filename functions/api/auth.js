// functions/api/auth.js
// POST /api/auth  — register or login
// body: { action: 'register' | 'login', email, password, username? }

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

export async function onRequestPost({ request, env, data }) {
  try {
    const body = await request.json();
    const { action, email, password, username } = body;

    // ── Change Password (requires auth) ──────────
    if (action === 'change-password') {
      const authUser = data?.user;
      if (!authUser || !authUser.id) {
        return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
      }
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return Response.json({ error: 'Current and new password are required' }, { status: 400, headers: corsHeaders });
      }
      if (newPassword.length < 6) {
        return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400, headers: corsHeaders });
      }
      const user = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(authUser.id).first();
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
      }
      if (user.password_hash) {
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
          return Response.json({ error: 'Current password is incorrect' }, { status: 401, headers: corsHeaders });
        }
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      await env.DB.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(newHash, authUser.id).run();
      return Response.json({ success: true, message: 'Password updated successfully' }, { headers: corsHeaders });
    }

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400, headers: corsHeaders });
    }

    if (action === 'register') {
      if (!username) {
        return Response.json({ error: 'Display name is required' }, { status: 400, headers: corsHeaders });
      }
      if (password.length < 6) {
        return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400, headers: corsHeaders });
      }

      // Check if email already exists
      const existing = await env.DB.prepare(
        `SELECT id FROM users WHERE email=?`
      ).bind(email).first();

      if (existing) {
        return Response.json({ error: 'An account with this email already exists' }, { status: 409, headers: corsHeaders });
      }

      // Check if username already exists
      const existingName = await env.DB.prepare(
        `SELECT id FROM users WHERE username=?`
      ).bind(username).first();

      if (existingName) {
        return Response.json({ error: 'This display name is already taken' }, { status: 409, headers: corsHeaders });
      }

      const id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const now = new Date().toISOString();

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const role = 'creator';

      await env.DB.prepare(
        `INSERT INTO users (id, username, email, password_hash, role, createdAt) VALUES (?,?,?,?,?,?)`
      ).bind(id, username, email, passwordHash, role, now).run();

      // Dispatch welcome email asynchronously
      try {
        sendEmail({ to: email, subject: 'Welcome to FlixoraPlay!', html: welcomeEmail(username) }, env);
      } catch (err) {
        console.error('Welcome email dispatch failed:', err);
      }

      const token = await jwt.sign(
        { id, username, email, role, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) },
        env.JWT_SECRET || 'secret'
      );

      return Response.json({
        token,
        user: { id, username, email, role, createdAt: now }
      }, { status: 201, headers: corsHeaders });

    } else if (action === 'login') {
      // Find user by email
      const user = await env.DB.prepare(
        `SELECT * FROM users WHERE email=?`
      ).bind(email).first();

      if (!user) {
        return Response.json({ error: 'No account found with this email. Please register first.' }, { status: 404, headers: corsHeaders });
      }

      if (!user.password_hash) {
        // For backwards compatibility with old mock users, allow any password but warn
        console.warn('User has no password_hash. Legacy login allowed.');
      } else {
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return Response.json({ error: 'Invalid password.' }, { status: 401, headers: corsHeaders });
        }
      }

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
      }, { headers: corsHeaders });

    } else {
      return Response.json({ error: 'Invalid action. Use "register" or "login".' }, { status: 400, headers: corsHeaders });
    }
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
