import Link from "next/link";
import { getContext } from "@/lib/org";
import { createDeal, createPipeline } from "./actions";
import { Board, type BoardDeal, type BoardStage } from "./board";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string; contact?: string; error?: string }>;
}) {
  const { pipeline, contact, error } = await searchParams;
  const { supabase, role } = await getContext();

  const { data: pipelines } = await supabase.from("pipelines").select("id, name").order("created_at");
  const current = pipelines?.find((p) => p.id === pipeline) ?? pipelines?.[0];
  if (!current) return <p>لا يوجد خط مبيعات.</p>;

  const [stages, deals, contacts] = await Promise.all([
    supabase.from("stages").select("id, name, kind").eq("pipeline_id", current.id).order("position"),
    supabase
      .from("deals")
      .select("id, title, value, stage_id, lost_reason, contacts(id, name)")
      .eq("pipeline_id", current.id)
      .order("updated_at", { ascending: false }),
    supabase.from("contacts").select("id, name").order("name").limit(500),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">الصفقات</h1>
        <div className="flex flex-wrap gap-2">
          {pipelines!.map((p) => (
            <Link
              key={p.id}
              href={`/deals?pipeline=${p.id}`}
              className={p.id === current.id ? "btn-primary" : "btn"}
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="card">
        <form action={createDeal} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="pipeline_id" value={current.id} />
          <div className="min-w-48 flex-1">
            <label className="label">عنوان الصفقة</label>
            <input name="title" className="input" required placeholder="مثال: توريد 50 جهاز" />
          </div>
          <div className="w-36">
            <label className="label">القيمة (ريال)</label>
            <input name="value" type="number" min="0" step="0.01" className="input" dir="ltr" />
          </div>
          <div className="min-w-48">
            <label className="label">العميل</label>
            <select name="contact_id" className="input" defaultValue={contact ?? ""}>
              <option value="">— بدون —</option>
              {(contacts.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary">إضافة صفقة</button>
        </form>
      </section>

      <Board stages={(stages.data ?? []) as BoardStage[]} deals={(deals.data ?? []) as unknown as BoardDeal[]} />

      {(role === "owner" || role === "manager") && (
        <details className="card">
          <summary className="cursor-pointer font-semibold">خط مبيعات جديد</summary>
          <form action={createPipeline} className="mt-4 grid gap-3 md:grid-cols-3">
            <input name="name" className="input" placeholder="اسم الخط، مثال: مبيعات الشركات" required />
            <input name="stages" className="input md:col-span-2" placeholder="المراحل مفصولة بفاصلة: جديد، معاينة، عرض سعر، تفاوض" />
            <button className="btn w-fit">إنشاء</button>
          </form>
        </details>
      )}
    </div>
  );
}
