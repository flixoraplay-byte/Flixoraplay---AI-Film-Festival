// functions/api/notifications/[id].js
// PUT /api/notifications/:id — mark notification as read (or 'read-all')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPut({ params, env, data }) {
  const user = data?.user;
  if (!user || !user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const { id } = params;

  try {
    if (id === 'read-all') {
      // Mark all as read for user
      await env.DB.prepare(
        `UPDATE notifications SET read = 1 WHERE user_id = ?`
      ).bind(user.id).run();
      return Response.json({ success: true, message: 'All notifications marked as read' }, { headers: corsHeaders });
    } else {
      // Mark specific notification as read
      const result = await env.DB.prepare(
        `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`
      ).bind(id, user.id).run();

      if (result.changes === 0) {
        return Response.json({ error: 'Notification not found or unauthorized' }, { status: 404, headers: corsHeaders });
      }
      return Response.json({ success: true, message: 'Notification marked as read' }, { headers: corsHeaders });
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
