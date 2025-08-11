import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
export const bucketName = process.env.SUPABASE_BUCKET || 'models';

export const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function ensureBucket() {
  // Try get, create if missing
  const { data: bucket, error } = await adminSupabase.storage.getBucket(bucketName);
  if (!bucket) {
    const { error: createErr } = await adminSupabase.storage.createBucket(bucketName, {
      public: true,              // public read for hackathon
      fileSizeLimit: '50MB'      // optional
    });
    if (createErr) {
      console.error('[Storage] Failed to create bucket:', createErr.message);
      throw createErr;
    }
    console.log('[Storage] Bucket created:', bucketName);
  } else {
    console.log('[Storage] Bucket exists:', bucketName);
  }
}
