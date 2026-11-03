import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createOrganization(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_organization", { p_name: String(formData.get("name")) });
  if (error) redirect("/onboarding?error=" + encodeURIComponent(error.message));
  redirect("/");
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold">أهلًا بك</h1>
        <p className="mb-6 text-sm text-slate-500">أدخل اسم منشأتك، وبنجهّز لك خط مبيعات جاهز تبدأ فيه فورًا.</p>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form action={createOrganization} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">اسم المنشأة</label>
            <input className="input" id="name" name="name" required placeholder="مثال: مؤسسة الريادة للتجارة" />
          </div>
          <button className="btn-primary w-full">ابدأ</button>
        </form>
      </div>
    </main>
  );
}
