import Link from "next/link";
import { getContext } from "@/lib/org";
import { formatDate } from "@/lib/format";
import { createContact } from "./actions";
import { ImportContacts } from "./import-contacts";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error } = await searchParams;
  const { supabase } = await getContext();

  let query = supabase
    .from("contacts")
    .select("id, name, company, phone, email, source, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q?.trim()) {
    const term = q.trim().replace(/[%,()]/g, " ");
    const digits = term.replace(/\D/g, "");
    const filters = [`name.ilike.%${term}%`, `company.ilike.%${term}%`, `email.ilike.%${term}%`];
    if (digits.length >= 3) filters.push(`phone.ilike.%${digits.replace(/^0/, "")}%`);
    query = query.or(filters.join(","));
  }
  const { data: contacts } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">العملاء</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} className="input w-64" placeholder="ابحث بالاسم أو الجوال أو البريد" />
          <button className="btn">بحث</button>
        </form>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card overflow-x-auto lg:col-span-2">
          {(contacts ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">لا يوجد عملاء بعد. أضف أول عميل أو استورد ملف Excel.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الجوال</th>
                  <th>الشركة</th>
                  <th>المصدر</th>
                  <th>تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody>
                {contacts!.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td>
                      <Link href={`/contacts/${c.id}`} className="font-medium text-brand-700 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td dir="ltr" className="text-end">{c.phone ? `+${c.phone}` : "—"}</td>
                    <td>{c.company ?? "—"}</td>
                    <td>{c.source ?? "—"}</td>
                    <td>{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-4 font-semibold">عميل جديد</h2>
            <form action={createContact} className="space-y-3">
              <input name="name" className="input" placeholder="الاسم *" required />
              <input name="phone" className="input" placeholder="رقم الجوال (05xxxxxxxx)" dir="ltr" />
              <input name="email" className="input" placeholder="البريد الإلكتروني" type="email" dir="ltr" />
              <input name="company" className="input" placeholder="الشركة" />
              <select name="source" className="input" defaultValue="whatsapp">
                <option value="whatsapp">واتساب</option>
                <option value="website">الموقع</option>
                <option value="store">المتجر الإلكتروني</option>
                <option value="referral">إحالة</option>
                <option value="social">تواصل اجتماعي</option>
                <option value="other">أخرى</option>
              </select>
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" name="consent" className="mt-1" />
                العميل وافق على استلام رسائل تسويقية عبر الواتساب (تُسجَّل الموافقة وتاريخها)
              </label>
              <button className="btn-primary w-full">إضافة</button>
            </form>
          </section>
          <ImportContacts />
        </div>
      </div>
    </div>
  );
}
