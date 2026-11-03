import Link from "next/link";
import { signIn, signUp } from "./actions";
import { HashError } from "./hash-error";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; notice?: string; next?: string }>;
}) {
  const { mode, error, notice, next = "/" } = await searchParams;
  const isSignup = mode === "signup";
  const nextQuery = next !== "/" ? `&next=${encodeURIComponent(next)}` : "";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold">{isSignup ? "إنشاء حساب" : "تسجيل الدخول"}</h1>
        <p className="mb-6 text-sm text-slate-500">محادثاتك وصفقاتك وعروضك في مكان واحد</p>
        <HashError />
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">{notice}</p>}
        <form action={isSignup ? signUp : signIn} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          {isSignup && (
            <div>
              <label className="label" htmlFor="full_name">الاسم</label>
              <input className="input" id="full_name" name="full_name" required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">البريد الإلكتروني</label>
            <input className="input" id="email" name="email" type="email" dir="ltr" required />
          </div>
          <div>
            <label className="label" htmlFor="password">كلمة المرور</label>
            <input className="input" id="password" name="password" type="password" dir="ltr" minLength={8} required />
            {!isSignup && (
              <Link href="/forgot" className="mt-1 inline-block text-xs text-brand-700 hover:underline">
                نسيت كلمة المرور؟
              </Link>
            )}
          </div>
          <button className="btn-primary w-full">{isSignup ? "إنشاء الحساب" : "دخول"}</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {isSignup ? (
            <>لديك حساب؟ <Link className="text-brand-700 underline" href={`/login?mode=signin${nextQuery}`}>سجّل الدخول</Link></>
          ) : (
            <>جديد؟ <Link className="text-brand-700 underline" href={`/login?mode=signup${nextQuery}`}>أنشئ حسابًا مجانيًا</Link></>
          )}
        </p>
      </div>
    </main>
  );
}
