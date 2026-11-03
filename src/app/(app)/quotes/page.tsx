import Link from "next/link";
import { getContext } from "@/lib/org";
import { formatDate, formatSAR } from "@/lib/format";
import { QUOTE_STATUS } from "@/lib/labels";

export default async function QuotesPage() {
  const { supabase } = await getContext();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, number, total, status, created_at, contacts(name)")
    .order("number", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">عروض الأسعار</h1>
        <Link href="/quotes/new" className="btn-primary">عرض سعر جديد</Link>
      </div>
      <section className="card overflow-x-auto">
        {(quotes ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد عروض بعد.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>الرقم</th>
                <th>العميل</th>
                <th>الإجمالي شامل الضريبة</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {quotes!.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/quotes/${q.id}`} className="font-medium text-brand-700">#{q.number}</Link>
                  </td>
                  <td>{(q.contacts as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td>{formatSAR(q.total)}</td>
                  <td><span className={`badge ${QUOTE_STATUS[q.status].tone}`}>{QUOTE_STATUS[q.status].label}</span></td>
                  <td>{formatDate(q.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
