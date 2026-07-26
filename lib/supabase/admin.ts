import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isServiceRoleSignupEnabled(): boolean {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return process.env.ALLOW_SERVICE_ROLE_SIGNUP === "true";
}
