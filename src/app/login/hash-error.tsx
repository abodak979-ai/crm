"use client";

import { useEffect, useState } from "react";

/** Supabase reports failed email links in the URL hash (#error=…), which the server never sees. */
export function HashError() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (!params.get("error")) return;
    setError(
      params.get("error_code") === "otp_expired"
        ? "رابط البريد مستخدم من قبل أو انتهت صلاحيته. إذا كان حسابك مفعّلًا فادخل مباشرة، أو اطلب رابطًا جديدًا."
        : params.get("error_description") ?? "تعذّر التحقق من الرابط",
    );
  }, []);
  if (!error) return null;
  return <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>;
}
