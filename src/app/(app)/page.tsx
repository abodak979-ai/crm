import Link from "next/link";
import { getContext } from "@/lib/org";
import { endOfTodayRiyadh, formatDateTime, formatSAR } from "@/lib/format";

export default async function DashboardPage() {
  const { supabase } = await getContext();
  const endOfDay = endOfTodayRiyadh();

  const [contacts, deals, tasks, quotes] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("value, status"),
    supabase
      .from("tasks")
      .select("id, title, due_at, contacts(name)")
      .eq("done", false)
      .lte("due_at", endOfDay.toISOString())
      .order("due_at")
      .limit(8),
    supabase.from("quotes").select("total, status").in("status", ["sent", "accepted"]),
  ]);

  const dealRows = deals.data ?? [];
  const sum = (s: string) => dealRows.filter((d) => d.status === s).reduce((a, d) => a + Number(d.value), 0);
  const openCount = dealRows.filter((d) => d.status === "open").length;
  const wonCount = dealRows.filter((d) => d.status === "won").length;
  const closed = wonCount + dealRows.filter((d) => d.status === "lost").length;
  const pendingQuotes = (quotes.data ?? []).filter((q) => q.status === "sent");

  const stats = [
    { label: "العملاء", value: String(contacts.count ?? 0) },
    { label: "قيمة الصفقات المفتوحة", value: formatSAR(sum("open")), hint: `${openCount} صفقة` },
    { label: "المبيعات المكسوبة", value: formatSAR(sum("won")), hint: `${wonCount} صفقة` },
    { label: "نسبة الفوز", value: closed ? `${Math.round((wonCount / closed) * 100)}%` : "—" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="page-title">الرئيسية</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
            {s.hint && <p className="text-xs text-slate-400">{s.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">مهام اليوم والمتأخرة</h2>
            <Link href="/tasks" className="text-sm text-brand-700">الكل</Link>
          </div>
          {(tasks.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">ما عندك مهام مستحقة اليوم.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.data!.map((t) => (
                <li key={t.id} className="flex justify-between py-2 text-sm">
                  <span>
                    {t.title}
                    {t.contacts && <span className="text-slate-400"> · {(t.contacts as unknown as { name: string }).name}</span>}
                  </span>
                  <span className={new Date(t.due_at!) < new Date() ? "text-red-600" : "text-slate-500"}>
                    {formatDateTime(t.due_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">عروض بانتظار رد العميل</h2>
            <Link href="/quotes" className="text-sm text-brand-700">الكل</Link>
          </div>
          <p className="text-3xl font-bold">{pendingQuotes.length}</p>
          <p className="text-sm text-slate-500">
            بقيمة {formatSAR(pendingQuotes.reduce((a, q) => a + Number(q.total), 0))} شاملة الضريبة
          </p>
        </section>
      </div>
    </div>
  );
}
