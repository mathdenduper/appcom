// frontend/src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// These are your public Supabase credentials. It's safe to expose them in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);