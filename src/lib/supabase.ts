import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Validate URL format to prevent crashing on uninitialized placeholders
export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id');

let client: SupabaseClient;

if (isSupabaseConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  // Safe dummy client to prevent module initialization crashes before credentials are supplied
  console.warn(
    'PelviCoach: Supabase credentials not detected or placeholder. Operating in offline demo/mock mode with local persistence.'
  );
  client = createClient('https://mock-pelvicoach.supabase.co', 'mock-anon-key', {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = client;
