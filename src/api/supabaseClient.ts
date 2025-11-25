// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// REPLACE THESE TWO STRINGS EXACTLY FROM SUPABASE DASHBOARD
const SUPABASE_URL = "https://qjhsbupafhflkczyylyg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LksYriyHqHELnOdtuDXjmg_AGQAs9VA";

// ✅ Create the client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
