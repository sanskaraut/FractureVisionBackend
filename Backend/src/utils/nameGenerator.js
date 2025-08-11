import { adminSupabase } from '../supabase.js';

export async function generateAutoName(userId) {
  // Find existing names like "newXray%d" for this user
  const { data, error } = await adminSupabase
    .from('uploads')
    .select('name')
    .eq('user_id', userId)
    .ilike('name', 'newxray%');

  if (error) {
    console.warn('Name query failed, using newXray1 fallback', error);
    return 'newXray1';
  }

  let maxN = 0;
  for (const row of data || []) {
    const m = row.name.match(/^newxray(\d+)$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n)) maxN = Math.max(maxN, n);
    }
  }
  return `newXray${maxN + 1}`;
}
