
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Use environment variables or hardcoded values (for development only)
const SUPABASE_URL = "https://ghuhptabsovhkfavfpiv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWhwdGFic292aGtmYXZmcGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4Nzk1ODQsImV4cCI6MjA1ODQ1NTU4NH0.y_zLCW8L_VG3hSy9u1YlLtMPj-Eo_lOm0fTb-cBVdaw";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
