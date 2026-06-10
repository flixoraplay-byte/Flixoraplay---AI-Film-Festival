import { getDB } from './_db.js';
// functions/api/notifications.js
// GET /api/notifications — return notifications for authenticated user

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
    // Get last 50 notifications
    const { results: notifications } = await getDB(env).prepare(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    ).bind(user.id).all();

    // Get unread count
    const unreadRes = await getDB(env).prepare(
      `SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND read = 0`
    ).bind(user.id).first();

    const unreadCount = unreadRes?.unreadCount || 0;

    return Response.json({ notifications, unreadCount }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

// Internal helper exported for other endpoints
export async function createNotification(db, { userId, type, title, message, link }) {
  const id = 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  try {
    await db.prepare(
      `INSERT INTO notifications (id, user_id, type, title, message, read, link, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(id, userId, type, title, message || null, link || null, now).run();
    return true;
  } catch (err) {
    console.error('[Notification Error] Failed to create notification:', err);
    return false;
  }
}
