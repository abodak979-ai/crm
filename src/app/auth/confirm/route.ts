import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NEXT: Record<string, string> = { recovery: "/reset-password", signup: "/onboarding", email: "/onboarding" };

/**
 * Email links (signup confirmation, password reset) land here with a token_hash.
 * Verifying on the server works on any device, unlike the PKCE code flow,
 * which needs the browser that requested the email.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  // redirect_to is the emailRedirectTo we passed (…/auth/callback?next=…); keep only its `next`
  let next = DEFAULT_NEXT[type] ?? "/";
  try {
    const redirectTo = new URL(searchParams.get("redirect_to") ?? "");
    const inner = redirectTo.searchParams.get("next");
    if (redirectTo.origin === origin && inner && inner !== "/") next = inner;
  } catch {
    // no or malformed redirect_to: keep the default
  }
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  const msg = "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.";
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
}
