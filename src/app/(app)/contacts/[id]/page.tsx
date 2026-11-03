import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/org";
import { formatDateTime, formatSAR, waLink } from "@/lib/format";
import { addNote, deleteContact, setConsent } from "../actions";
import { createTask } from "../../tasks/actions";

const QUOTE_LABELS: Record<string, string> = { draft: "مسودة", sent: "مرسل", accepted: "مقبول", rejected: "مرفوض" };
const DEAL_LABELS: Record<string, string> = { open: "مفتوحة", won: "مكسوبة", lost: "خاسرة" };

type Event = { at: string; kind: string; text: string; href?: string; done?: boolean };

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role } = await getContext();

  const { data: contact } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
  if (!contact) notFound();

  const [deals, tasks, notes, quotes, consents] = await Promise.all([
    supabase.from("deals").select("id, title, value, status, created_at, stages(name)").eq("contact_id", id),
    supabase.from("tasks").select("id, title, due_at, done, created_at").eq("contact_id", id),
    supabase.from("notes").select("id, body, created_at").eq("contact_id", id),
    supabase.from("quotes").select("id, number, total, status, created_at").eq("contact_id", id),
    supabase.from("consents").select("id, granted, source, created_at").eq("contact_id", id).order("created_at", { ascending: false }),
  ]);

  const timeline: Event[] = [
    ...(deals.data ?? []).map((d) => ({
      at: d.created_at,
      kind: "صفقة",
      text: `${d.title} · ${formatSAR(d.value)} · ${DEAL_LABELS[d.status]} (${(d.stages as unknown as { name: string }).name})`,
      href: "/deals",
    })),
    ...(tasks.data ?? []).map((t) => ({ at: t.created_at, kind: "مهمة", text: `${t.title} · ${formatDateTime(t.due_at)}`, done: t.done })),
    ...(notes.data ?? []).map((n) => ({ at: n.created_at, kind: "ملاحظة", text: n.body })),
    ...(quotes.data ?? []).map((q) => ({
      at: q.created_at,
      kind: "عرض سعر",
      text: `#${q.number} · ${formatSAR(q.total)} · ${QUOTE_LABELS[q.status]}`,
      href: `/quotes/${q.id}`,
    })),
    ...(consents.data ?? []).map((c) => ({
      at: c.created_at,
      kind: "موافقة",
      text: c.granted ? `وافق على الرسائل التسويقية (${c.source})` : `ألغى الموافقة التسويقية (${c.source})`,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const consentGranted = consents.data?.[0]?.granted ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/contacts" className="text-sm text-slate-500">← العملاء</Link>
          <h1 className="page-title">{contact.name}</h1>
          <p className="text-sm text-slate-500">
            {contact.company && <>{contact.company} · </>}
            {contact.phone && <span dir="ltr">+{contact.phone}</span>}
            {contact.email && <> · <span dir="ltr">{contact.email}</span></>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {contact.phone && (
            <a className="btn-primary" target="_blank" href={waLink(contact.phone, `السلام عليكم ${contact.name}`)}>
              محادثة واتساب
            </a>
          )}
          <Link className="btn" href={`/quotes/new?contact=${contact.id}`}>عرض سعر جديد</Link>
          <Link className="btn" href={`/deals?contact=${contact.id}`}>صفقة جديدة</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="mb-4 font-semibold">السجل الزمني</h2>
          <form action={addNote.bind(null, contact.id)} className="mb-6 flex gap-2">
            <input name="body" className="input" placeholder="أضف ملاحظة…" required />
            <button className="btn">حفظ</button>
          </form>
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500">لا يوجد نشاط بعد.</p>
          ) : (
            <ol className="space-y-3 border-s-2 border-slate-100 ps-4">
              {timeline.map((e, i) => (
                <li key={i} className="text-sm">
                  <span className="badge me-2 bg-slate-100 text-slate-600">{e.kind}</span>
                  {e.href ? (
                    <Link href={e.href} className="text-brand-700 hover:underline">{e.text}</Link>
                  ) : (
                    <span className={e.done ? "text-slate-400 line-through" : ""}>{e.text}</span>
                  )}
                  <span className="ms-2 text-xs text-slate-400">{formatDateTime(e.at)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-2 font-semibold">الموافقة التسويقية (PDPL)</h2>
            <p className="mb-3 text-sm">
              الحالة:{" "}
              {consentGranted ? (
                <span className="badge bg-brand-100 text-brand-800">موافق</span>
              ) : (
                <span className="badge bg-red-100 text-red-700">غير موافق</span>
              )}
            </p>
            <p className="mb-3 text-xs text-slate-500">
              لا تُرسل حملات تسويقية إلا للموافقين. إذا ردّ العميل بكلمة «إلغاء» أو «STOP» تُلغى الموافقة تلقائيًا.
            </p>
            <form action={setConsent.bind(null, contact.id, !consentGranted)}>
              <button className="btn w-full">{consentGranted ? "تسجيل إلغاء الموافقة" : "تسجيل موافقة العميل"}</button>
            </form>
          </section>

          <section className="card">
            <h2 className="mb-3 font-semibold">تذكير بالمتابعة</h2>
            <form action={createTask} className="space-y-3">
              <input type="hidden" name="contact_id" value={contact.id} />
              <input type="hidden" name="redirect_to" value={`/contacts/${contact.id}`} />
              <input name="title" className="input" placeholder="مثال: اتصل لمتابعة العرض" required />
              <input name="due_at" type="datetime-local" className="input" required />
              <button className="btn w-full">إضافة مهمة</button>
            </form>
          </section>

          {(role === "owner" || role === "manager") && (
            <form action={deleteContact.bind(null, contact.id)}>
              <button className="text-sm text-red-600 hover:underline">حذف العميل نهائيًا (حق الحذف)</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
