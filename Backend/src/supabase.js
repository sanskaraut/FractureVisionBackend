
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const bucketName = process.env.SUPABASE_BUCKET || 'models';

const supabase = createClient(supabaseUrl, serviceKey);
export default supabase;

export async function ensureBucket() {
  // Try get, create if missing
  const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
  if (!bucket) {
    const { error: createErr } = await supabase.storage.createBucket(bucketName, {
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
