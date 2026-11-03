"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createImplicitClient } from "@/lib/supabase/implicit";

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
    redirect(`/login?next=${encodeURIComponent(next)}&error=` + encodeURIComponent("البريد أو كلمة المرور غير صحيحة. إذا نسيتها اضغط «نسيت كلمة المرور؟» تحت."));
  }
  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = createImplicitClient();
  const next = safeNext(formData);
  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { full_name: String(formData.get("full_name") ?? "") },
      emailRedirectTo: `${origin}/auth/hash?next=${encodeURIComponent(next === "/" ? "/onboarding" : next)}`,
    },
  });
  if (error) redirect(`/login?mode=signup&next=${encodeURIComponent(next)}&error=` + encodeURIComponent(error.message));
  redirect(
    "/login?notice=" +
      encodeURIComponent("أرسلنا رابط التفعيل إلى بريدك. إذا كان البريد مسجّلًا من قبل فادخل مباشرة أو استخدم «نسيت كلمة المرور»."),
  );
}
