import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigError = !url || !anonKey
  ? "Supabase nenustatytas. Užpildykite VITE_SUPABASE_URL ir VITE_SUPABASE_ANON_KEY faile .env.local."
  : "";

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
