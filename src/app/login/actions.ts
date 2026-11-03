"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Only allow same-site relative paths as post-login destinations. */
function safeNext(formData: FormData) {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData);
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=` + encodeURIComponent("البريد أو كلمة المرور غير صحيحة"));
  }
  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData);
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { full_name: String(formData.get("full_name") ?? "") },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) redirect(`/login?mode=signup&next=${encodeURIComponent(next)}&error=` + encodeURIComponent(error.message));
  if (!data.session) redirect("/login?notice=" + encodeURIComponent("أرسلنا رابط التفعيل إلى بريدك"));
  redirect(next === "/" ? "/onboarding" : next);
}
