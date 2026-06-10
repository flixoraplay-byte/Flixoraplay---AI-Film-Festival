// functions/api/_utils.js

export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  // Strip HTML tags and trim whitespace
  return str.replace(/<[^>]*>?/gm, '').trim();
}

export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  // Basic email regex
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random5chars = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${random5chars}`;
}
