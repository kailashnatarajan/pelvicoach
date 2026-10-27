import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lwopjlnibbrfvfcnzbju.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b3BqbG5pYmJyZnZmY256Ymp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwODkxMDYsImV4cCI6MjEwODY2NTEwNn0.l6a9604WHyK-UkGxgYzjKU1T110KqN2RwMp3_0WQrtQ';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
