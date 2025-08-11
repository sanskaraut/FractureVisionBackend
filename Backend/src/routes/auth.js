import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../supabase.js';

const router = express.Router();
router.use(express.json());

// Normal signup: expects username, email, password
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required.' });
  }
  // Check username uniqueness
  const { data: userExists } = await supabase.from('users').select('id').eq('username', username).single();
  if (userExists) {
    return res.status(409).json({ error: 'Username already taken.' });
  }
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) {
    return res.status(400).json({ error: authError.message });
  }
  // Insert user record
  const { error: insertError } = await supabase.from('users').insert([{ id: authData.user.id, username, email }]);
  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }
  res.json({ ok: true });
});

// Google callback: expects supabase_id, email
router.post('/google/callback', async (req, res) => {
  const { supabase_id, email } = req.body;
  if (!supabase_id || !email) return res.status(400).json({ error: 'Missing info.' });
  // Check if user exists in users table
  const { data: userRow } = await supabase.from('users').select('username').eq('id', supabase_id).single();
  if (!userRow || !userRow.username) {
    return res.json({ needUsername: true });
  }
  res.json({ needUsername: false });
});

// Set username for Google user
router.post('/set-username', async (req, res) => {
  const { supabase_id, username } = req.body;
  if (!supabase_id || !username) return res.status(400).json({ error: 'Missing info.' });
  // Check uniqueness
  const { data: userExists } = await supabase.from('users').select('id').eq('username', username).single();
  if (userExists) {
    return res.status(409).json({ error: 'Username already taken.' });
  }
  // Check if user row exists
  const { data: userRow } = await supabase.from('users').select('id').eq('id', supabase_id).single();
  if (!userRow) {
    // Insert new user row
    const { error: insertError } = await supabase.from('users').insert([{ id: supabase_id, username }]);
    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
    return res.json({ ok: true });
  }
  // Update user row
  const { error: updateError } = await supabase.from('users').update({ username }).eq('id', supabase_id);
  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }
  res.json({ ok: true });
});

export default router;
