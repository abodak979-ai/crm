"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Email links land here with the session in the URL hash (#access_token=…); save it and continue. */
export default function AuthHashPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError(
        hash.get("error_code") === "otp_expired"
          ? "الرابط مستخدم من قبل أو انتهت صلاحيته. إذا كان حسابك مفعّلًا فادخل مباشرة، أو اطلب رابطًا جديدًا."
          : hash.get("error_description") ?? "الرابط غير صالح",
      );
      return;
    }
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) setError("تعذّر تسجيل الدخول من الرابط. اطلب رابطًا جديدًا.");
        else window.location.replace(safeNext);
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm text-center">
        {error ? (
          <>
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>
            <Link href="/login" className="btn-primary w-full">تسجيل الدخول</Link>
          </>
        ) : (
          <p className="text-sm text-slate-500">جارٍ التحقق…</p>
        )}
      </div>
    </main>
  );
}
