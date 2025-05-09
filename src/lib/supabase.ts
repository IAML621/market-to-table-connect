
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// These environment variables are automatically injected by Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
