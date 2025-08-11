// js/supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
export const SUPABASE_URL = "https://bmlmzogocsuovkybedao.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbG16b2dvY3N1b3ZreWJlZGFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUxNjIyNiwiZXhwIjoyMDcwMDkyMjI2fQ.ObHi7wfaWFYctUEGYZ2kotg02dTSVU0xVR-t_l-EoiA";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
