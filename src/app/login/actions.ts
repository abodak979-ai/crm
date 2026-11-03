"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect("/login?error=" + encodeURIComponent("البريد أو كلمة المرور غير صحيحة"));
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { full_name: String(formData.get("full_name") ?? "") },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) redirect("/login?mode=signup&error=" + encodeURIComponent(error.message));
  if (!data.session) redirect("/login?notice=" + encodeURIComponent("أرسلنا رابط التفعيل إلى بريدك"));
  redirect("/onboarding");
}
