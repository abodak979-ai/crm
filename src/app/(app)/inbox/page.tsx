import Link from "next/link";
import { getContext } from "@/lib/org";
import { formatDateTime } from "@/lib/format";

export default async function InboxPage() {
  const { supabase } = await getContext();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, wa_phone, last_message_at, contacts(id, name)")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="page-title">صندوق الواتساب</h1>
      <div className="card border-amber-200 bg-amber-50 text-sm text-amber-900">
        <p className="font-semibold">ربط WhatsApp Business API</p>
        <p className="mt-1">
          الصندوق الموحّد جاهز على مستوى البيانات (المحادثات، والرسائل، وإلغاء الاشتراك بكلمة «إلغاء»). يتبقى اختيار
          مزوّد WhatsApp Business API (مباشر من Meta أو عبر وسيط) لتفعيل استقبال الرسائل وإرسالها. حتى ذلك الحين،
          أزرار «محادثة واتساب» تفتح المحادثة من جوالك.
        </p>
      </div>
      <section className="card">
        {(conversations ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد محادثات بعد.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {conversations!.map((c) => {
              const contact = c.contacts as unknown as { id: string; name: string } | null;
              return (
                <li key={c.id} className="flex justify-between py-3 text-sm">
                  {contact ? (
                    <Link href={`/contacts/${contact.id}`} className="font-medium text-brand-700">{contact.name}</Link>
                  ) : (
                    <span dir="ltr">+{c.wa_phone}</span>
                  )}
                  <span className="text-slate-500">{formatDateTime(c.last_message_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
