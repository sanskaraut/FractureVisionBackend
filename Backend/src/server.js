// src/server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import uploadsRouter from './routes/uploads.js';
import authRouter from './routes/auth.js';
import { ensureBucket } from './supabase.js'; // requires ensureBucket in supabase.js (as shared earlier)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS: since FE is served by same server, all origins are fine for dev.
// If you later split FE/BE, tighten this to your FE origin.
app.use(cors({ origin: '*'}));
app.use(morgan('dev'));

// ---------- Static Frontend ----------
/**
 * By default, we expect:
 *   project-root/
 *     frontend/
 *     backend/
 *
 * If your frontend folder is somewhere else, set FRONTEND_DIR in backend/.env:
 *   FRONTEND_DIR=/absolute/path/to/frontend
 */
const defaultFrontend = path.resolve(__dirname, '../../frontend');
const frontendPath = process.env.FRONTEND_DIR
  ? path.resolve(process.env.FRONTEND_DIR)
  : defaultFrontend;

console.log('[STATIC] Serving frontend from:', frontendPath);
if (!fs.existsSync(frontendPath)) {
  console.warn('[STATIC] WARNING: frontend path does not exist. Check folder structure or FRONTEND_DIR env.');
}
app.use(express.static(frontendPath));

// ---------- Static Backend Assets (e.g., Model1.glb) ----------
const assetsPath = path.resolve(__dirname, '../assets');
if (fs.existsSync(assetsPath)) {
  app.use('/assets', express.static(assetsPath));
  console.log('[STATIC] Serving assets from:', assetsPath);
} else {
  console.warn('[STATIC] WARNING: assets folder not found at', assetsPath);
}

// ---------- Health ----------
app.get('/health', (_, res) => res.send('OK'));

// ---------- API Routes ----------

import supabase from './supabase.js';

// Public API for Unity: Get all uploads for a username
app.get('/api/unity/history/:username', async (req, res) => {
  const username = req.params.username;
  if (!username) return res.status(400).json({ error: 'Missing username' });
  try {
    // Find user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    if (userError || !user) return res.status(404).json({ error: 'User not found' });

    // Get uploads for user
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('name, model_url, image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (uploadsError) throw uploadsError;

    // Format response for Unity
    const result = uploads.map(u => ({
      test_name: u.name,
      model_url: u.model_url,
      image_url: u.image_url
    }));
    res.json({ ok: true, items: result });
  } catch (e) {
    console.error('Unity history API error:', e);
    res.status(500).json({ error: e.message || 'Failed to fetch history' });
  }
});

app.use('/api', uploadsRouter);
app.use('/api/auth', authRouter);

// ---------- Explicit HTML routes (multi-page frontend) ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.get('/history.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'history.html'));
});
app.get('/viewer.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'viewer.html'));
});

// ---------- Catch-all (optional SPA-like fallback) ----------
app.get('*', (req, res) => {
  const fallback = path.join(frontendPath, 'index.html');
  if (fs.existsSync(fallback)) res.sendFile(fallback);
  else res.status(404).send('Not found');
});

// ---------- Start (ensure bucket first) ----------
const PORT = process.env.PORT || 5500;

(async () => {
  try {
    await ensureBucket(); // will create bucket if it doesn't exist
    app.listen(PORT, () => {
      console.log(`Server running → http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Startup failed:', e?.message || e);
    process.exit(1);
  }
})();
