import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If these env vars are missing, `supabase` will be null and the app
// automatically falls back to localStorage (see storeGet/storeSet in App.jsx).
// This means the app still works even before you set up Supabase.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
