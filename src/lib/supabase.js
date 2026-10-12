import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigError = !url
  ? "Supabase URL nenustatytas. Užpildykite VITE_SUPABASE_URL faile .env arba .env.local."
  : !anonKey
    ? "Trūksta Supabase viešojo rakto. Užpildykite VITE_SUPABASE_ANON_KEY faile .env arba .env.local."
    : "";

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
