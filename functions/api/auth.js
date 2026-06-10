// functions/api/auth.js
// POST /api/auth  — register or login
// body: { action: 'register' | 'login', email, password, username? }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { action, email, password, username } = body;

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

      await env.DB.prepare(
        `INSERT INTO users (id, username, email, createdAt) VALUES (?,?,?,?)`
      ).bind(id, username, email, now).run();

      return Response.json({
        id, username, email, createdAt: now
      }, { status: 201, headers: corsHeaders });

    } else if (action === 'login') {
      // Find user by email
      const user = await env.DB.prepare(
        `SELECT * FROM users WHERE email=?`
      ).bind(email).first();

      if (!user) {
        return Response.json({ error: 'No account found with this email. Please register first.' }, { status: 404, headers: corsHeaders });
      }

      // In V3, password is not stored — any password works for existing accounts
      return Response.json({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }, { headers: corsHeaders });

    } else {
      return Response.json({ error: 'Invalid action. Use "register" or "login".' }, { status: 400, headers: corsHeaders });
    }
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
