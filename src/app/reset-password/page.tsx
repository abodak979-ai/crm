import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function updatePassword(formData: FormData) {
  "use server";
  const password = String(formData.get("password"));
  if (password !== String(formData.get("confirm"))) {
    redirect("/reset-password?error=" + encodeURIComponent("كلمتا المرور غير متطابقتين"));
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/reset-password?error=" + encodeURIComponent(error.message));
  redirect("/");
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold">كلمة مرور جديدة</h1>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form action={updatePassword} className="space-y-4">
          <input className="input" name="password" type="password" dir="ltr" minLength={8} placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)" required />
          <input className="input" name="confirm" type="password" dir="ltr" minLength={8} placeholder="أعد كتابتها" required />
          <button className="btn-primary w-full">حفظ ودخول</button>
        </form>
      </div>
    </main>
  );
}
