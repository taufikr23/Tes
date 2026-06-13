import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

// Client untuk frontend - kena RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client untuk BACKEND - BYPASS RLS dengan konfigurasi khusus!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Untuk admin operations (create user, dll)
export const supabaseAuthAdmin = supabaseAdmin.auth.admin;

console.log('✅ Supabase clients initialized');