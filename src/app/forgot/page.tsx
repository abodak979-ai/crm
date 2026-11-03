import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createImplicitClient } from "@/lib/supabase/implicit";

async function sendReset(formData: FormData) {
  "use server";
  const supabase = createImplicitClient();
  const origin = (await headers()).get("origin");
  await supabase.auth.resetPasswordForEmail(String(formData.get("email")), {
    redirectTo: `${origin}/auth/hash?next=${encodeURIComponent("/reset-password")}`,
  });
  // same message whether or not the account exists
  redirect("/forgot?sent=1");
}

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold">نسيت كلمة المرور</h1>
        {sent ? (
          <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
            إذا كان البريد مسجّلًا عندنا، وصلك رابط لتعيين كلمة مرور جديدة. تقدر تفتحه من أي جهاز.
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-500">اكتب بريدك ونرسل لك رابطًا لتعيين كلمة مرور جديدة.</p>
            <form action={sendReset} className="space-y-4">
              <input className="input" name="email" type="email" dir="ltr" placeholder="البريد الإلكتروني" required />
              <button className="btn-primary w-full">أرسل الرابط</button>
            </form>
          </>
        )}
        <p className="mt-4 text-center text-sm">
          <Link className="text-brand-700 underline" href="/login">العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </main>
  );
}
