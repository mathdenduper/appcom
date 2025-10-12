// Author: Tristan Bong
// Page name: supabaseClient.ts
// Page purpose: Initialises and exports a Supabase client for frontend use
// Date created: 14/09/2025

import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from environment
const supabaseUrlInternal = process.env.NEXT_PUBLIC_SUPABASE_URL!;   // INPUT: Supabase project URL
const supabaseAnonKeyInternal = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // INPUT: Supabase anon key
// PROCESS: Initialise Supabase client

export const supabase = createClient(supabaseUrlInternal, supabaseAnonKeyInternal);
// OUTPUT: Exported supabase client for use in frontend API calls
