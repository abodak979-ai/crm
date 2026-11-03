import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createOrganization(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", { p_name: String(formData.get("name")) });
  if (error) redirect("/onboarding?error=" + encodeURIComponent(error.message));
  redirect("/");
}

async function joinOrganization(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", { p_code: String(formData.get("code")) });
  if (error) redirect("/onboarding?error=" + encodeURIComponent("رمز الدعوة غير صحيح أو منتهي"));
  redirect("/");
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const { error, code } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-6">
        <div>
          <h1 className="mb-1 text-2xl font-bold">أهلًا بك</h1>
          <p className="text-sm text-slate-500">أنشئ منشأتك، أو انضم لفريق منشأتك برمز الدعوة.</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form action={joinOrganization} className="space-y-3">
          <label className="label" htmlFor="code">عندك رمز دعوة؟</label>
          <div className="flex gap-2">
            <input className="input" id="code" name="code" dir="ltr" defaultValue={code} placeholder="ABCD1234" required />
            <button className="btn">انضمام</button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-6">
          <form action={createOrganization} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">أو أنشئ منشأة جديدة</label>
              <input className="input" id="name" name="name" required placeholder="مثال: مؤسسة الريادة للتجارة" />
            </div>
            <button className="btn-primary w-full">ابدأ</button>
          </form>
        </div>
      </div>
    </main>
  );
}
