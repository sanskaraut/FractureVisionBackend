import { adminSupabase } from '../supabase.js';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const { data, error } = await adminSupabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });

    req.user = { id: data.user.id, email: data.user.email };
    next();
  } catch (e) {
    console.error('Auth error', e);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
