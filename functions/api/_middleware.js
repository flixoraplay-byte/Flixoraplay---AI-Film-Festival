import jwt from '@tsndr/cloudflare-worker-jwt';

export async function onRequest(context) {
  const { request, env, next } = context;

  // Ensure context.data exists
  if (!context.data) {
    context.data = {};
  }

  const authHeader = request.headers.get('Authorization');
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const isValid = await jwt.verify(token, env.JWT_SECRET || 'secret');
      if (isValid) {
        const { payload } = jwt.decode(token);
        user = payload;
      }
    } catch (err) {
      console.warn('JWT Verification failed:', err.message);
    }
  }

  context.data.user = user;

  // Let the request pass through to the next handler
  return await next();
}
