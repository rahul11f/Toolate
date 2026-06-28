import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client (bypasses Row-Level Security, used on the server)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null as any;

// Public client (subject to Row-Level Security, usable on server or client)
export const supabaseClient = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
