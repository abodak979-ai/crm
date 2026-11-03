import { createClient } from "@supabase/supabase-js";

/**
 * Stateless client for requests that send an email link (sign-up, password reset).
 * @supabase/ssr forces PKCE, whose links only work in the browser that asked for them;
 * the implicit flow puts the session in the link itself, so it opens on any device.
 * The link lands on /auth/hash, which stores that session in cookies.
 */
export function createImplicitClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
