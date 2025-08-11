import path from 'path';
import fs from 'fs/promises';
import supabase, { bucketName } from '../supabase.js';
import { nanoid } from 'nanoid';
import { generateAutoName } from '../utils/nameGenerator.js';
import { runPythonManager } from '../utils/pythonRunner.js';


const ASSETS_MODEL = path.resolve('assets/Model1.glb');

async function getUsername(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .single();
  if (error || !data) throw new Error('Username not found');
  return data.username;
}

async function storagePathFor(kind, userId, filename) {
  const username = await getUsername(userId);
  const ts = Date.now();
  return `${kind}/${username}/${ts}_${filename}`;
}

async function uploadToStorage(localPath, storagePath, contentType) {
  const fileBuffer = await fs.readFile(localPath);
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, { contentType, upsert: false });

  if (error) throw error;

  const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return { path: storagePath, url: pub.publicUrl };
}


export const uploadHandler = async (req, res) => {
  const userId = req.user.id;
  const providedName = (req.body?.name || '').trim();

  if (!req.file) return res.status(400).json({ error: 'Image file is required' });

  try {
    // 1) Upload original image
    const imagePath = await storagePathFor('images', userId, req.file.originalname.replace(/\s+/g, '_'));
    const { url: image_url, path: image_storage_path } = await uploadToStorage(req.file.path, imagePath, req.file.mimetype || 'image/jpeg');

    // 2) Run Python to generate GLB + JSON meta
    const workDir = path.resolve('tmp', `${userId}_${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });
    const { glbPath, meta } = await runPythonManager(req.file.path, workDir);

    // 3) If Python didn’t produce a GLB, fallback to static Model1.glb
    const modelFileLocal = glbPath || ASSETS_MODEL;
    const modelFileName = path.basename(modelFileLocal);
    const modelPathInBucket = await storagePathFor('models', userId, modelFileName);
    const { url: model_url, path: model_storage_path } = await uploadToStorage(modelFileLocal, modelPathInBucket, 'model/gltf-binary');

    // 4) Generate name + share_id
    const name = providedName || await generateAutoName(userId);
    const share_id = nanoid(10);

    // 5) Insert DB row
  const { data, error } = await supabase
      .from('uploads')
      .insert({
        user_id: userId,
        name,
        image_url,
        image_path: image_storage_path,
        model_url,
        model_path: model_storage_path,
        meta,
        share_id
      })
      .select()
      .single();

    if (error) throw error;

    // 6) Cleanup temp files
    try { await fs.unlink(req.file.path); } catch {}
    try { await fs.rm(workDir, { recursive: true, force: true }); } catch {}

    return res.json({ ok: true, upload: data });
  } catch (e) {
    console.error('Upload error', e);
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
};

export const listHistory = async (req, res) => {
  const userId = req.user.id;
  const search = (req.query.search || '').trim();
  try {
  let query = supabase.from('uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, items: data });
  } catch (e) {
    console.error('History error', e);
    res.status(500).json({ error: e.message });
  }
};

export const renameUpload = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;
  const newName = (req.body?.name || '').trim();
  if (!newName) return res.status(400).json({ error: 'New name required' });

  try {
  const { data: row, error: e0 } = await supabase.from('uploads').select('user_id').eq('id', id).single();
    if (e0 || !row) return res.status(404).json({ error: 'Not found' });
    if (row.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await supabase.from('uploads').update({ name: newName }).eq('id', id).select().single();
    if (error) throw error;
    res.json({ ok: true, item: data });
  } catch (e) {
    console.error('Rename error', e);
    res.status(500).json({ error: e.message });
  }
};

export const deleteUpload = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  try {
    const { data: row, error: e0 } = await supabase
      .from('uploads')
      .select('user_id, image_path, model_path')
      .eq('id', id)
      .single();

    if (e0 || !row) return res.status(404).json({ error: 'Not found' });
    if (row.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    // delete files
  await supabase.storage.from(bucketName).remove([row.image_path, row.model_path]);

    // delete row
  const { error } = await supabase.from('uploads').delete().eq('id', id);
    if (error) throw error;

    res.json({ ok: true });
  } catch (e) {
    console.error('Delete error', e);
    res.status(500).json({ error: e.message });
  }
};

export const getShare = async (req, res) => {
  const shareId = req.params.shareId;
  try {
    const { data, error } = await supabase
      .from('uploads')
      .select('name, model_url, created_at, meta')
      .eq('share_id', shareId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Not found' });

    res.json({ ok: true, item: data });
  } catch (e) {
    console.error('Share error', e);
    res.status(500).json({ error: e.message });
  }
};
