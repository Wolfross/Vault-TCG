import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Returns null if env vars aren't set yet (dev mode before setup)
export const supabase = url && anon ? createClient(url, anon) : null;

// Server-side client with elevated permissions
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}
