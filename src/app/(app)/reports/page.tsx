import { getContext } from "@/lib/org";
import { formatSAR } from "@/lib/format";

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "واتساب",
  website: "الموقع",
  store: "المتجر الإلكتروني",
  referral: "إحالة",
  social: "تواصل اجتماعي",
  import: "استيراد",
  other: "أخرى",
};

type Row = { label: string; count: number; value?: number };

function Bars({ rows, money }: { rows: Row[]; money?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => (money ? r.value ?? 0 : r.count)));
  if (!rows.length) return <p className="text-sm text-slate-500">لا توجد بيانات بعد.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const v = money ? r.value ?? 0 : r.count;
        return (
          <li key={r.label} className="text-sm">
            <div className="mb-1 flex justify-between">
              <span>{r.label}</span>
              <span className="text-slate-500">{money ? `${formatSAR(v)} · ${r.count}` : r.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function group<T>(items: T[], key: (t: T) => string, value?: (t: T) => number): Row[] {
  const map = new Map<string, Row>();
  for (const it of items) {
    const k = key(it);
    const row = map.get(k) ?? { label: k, count: 0, value: 0 };
    row.count++;
    row.value = (row.value ?? 0) + (value?.(it) ?? 0);
    map.set(k, row);
  }
  return [...map.values()].sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || b.count - a.count);
}

export default async function ReportsPage() {
  const { supabase } = await getContext();
  const [deals, contacts, members] = await Promise.all([
    supabase.from("deals").select("value, status, owner_id, lost_reason, stages(name, position)"),
    supabase.from("contacts").select("source"),
    supabase.from("memberships").select("user_id, profiles(full_name)"),
  ]);

  const dealRows = deals.data ?? [];
  const names = new Map(
    (members.data ?? []).map((m) => [m.user_id, (m.profiles as unknown as { full_name: string | null } | null)?.full_name || "مستخدم"]),
  );
  const stageName = (d: (typeof dealRows)[number]) => (d.stages as unknown as { name: string }).name;

  const byStage = group(dealRows.filter((d) => d.status === "open"), stageName, (d) => Number(d.value));
  const wonByRep = group(dealRows.filter((d) => d.status === "won"), (d) => names.get(d.owner_id ?? "") ?? "غير محدد", (d) => Number(d.value));
  const lostReasons = group(dealRows.filter((d) => d.status === "lost"), (d) => d.lost_reason ?? "—");
  const sources = group(contacts.data ?? [], (c) => SOURCE_LABELS[c.source ?? ""] ?? c.source ?? "غير محدد");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">التقارير</h1>
        {/* file downloads from route handlers, not page navigations */}
        {/* eslint-disable @next/next/no-html-link-for-pages */}
        <div className="flex flex-wrap gap-2">
          <a className="btn" href="/api/export/contacts" download>تصدير العملاء (Excel)</a>
          <a className="btn" href="/api/export/deals" download>تصدير الصفقات (Excel)</a>
          <a className="btn" href="/api/export/quotes" download>تصدير العروض (Excel)</a>
        </div>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 font-semibold">الصفقات المفتوحة حسب المرحلة</h2>
          <Bars rows={byStage} money />
        </section>
        <section className="card">
          <h2 className="mb-4 font-semibold">المبيعات المكسوبة حسب الموظف</h2>
          <Bars rows={wonByRep} money />
        </section>
        <section className="card">
          <h2 className="mb-4 font-semibold">مصادر العملاء</h2>
          <Bars rows={sources} />
        </section>
        <section className="card">
          <h2 className="mb-4 font-semibold">أسباب خسارة الصفقات</h2>
          <Bars rows={lostReasons} />
        </section>
      </div>
    </div>
  );
}
