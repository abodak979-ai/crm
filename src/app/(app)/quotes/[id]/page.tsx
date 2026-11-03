import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/org";
import { formatDate, formatSAR, waLink } from "@/lib/format";
import { QUOTE_STATUS } from "@/lib/labels";
import { setQuoteStatus } from "../actions";
import { PrintButton, SendWhatsAppButton } from "./print-button";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgName, vatNumber } = await getContext();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, contacts(id, name, phone, company), quote_items(id, description, quantity, unit_price)")
    .eq("id", id)
    .maybeSingle();
  if (!quote) notFound();

  const contact = quote.contacts as { id: string; name: string; phone: string | null; company: string | null } | null;
  const items = quote.quote_items as { id: string; description: string; quantity: number; unit_price: number }[];
  const status = QUOTE_STATUS[quote.status];

  const message = [
    `السلام عليكم ${contact?.name ?? ""}`,
    `مرفق عرض السعر رقم #${quote.number} من ${orgName}:`,
    ...items.map((i) => `• ${i.description} × ${i.quantity} = ${formatSAR(i.quantity * i.unit_price)}`),
    `الإجمالي شامل ضريبة القيمة المضافة: ${formatSAR(quote.total)}`,
    quote.valid_until ? `العرض صالح حتى ${formatDate(quote.valid_until)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/quotes" className="text-sm text-slate-500">← عروض الأسعار</Link>
        <div className="flex flex-wrap gap-2">
          {contact?.phone && <SendWhatsAppButton quoteId={quote.id} url={waLink(contact.phone, message)} />}
          <PrintButton />
          {quote.status !== "sent" && (
            <form action={setQuoteStatus.bind(null, quote.id, "sent")}><button className="btn">تعليم كمرسل</button></form>
          )}
          {quote.status !== "accepted" && (
            <form action={setQuoteStatus.bind(null, quote.id, "accepted")}><button className="btn">قبِل العميل</button></form>
          )}
          {quote.status !== "rejected" && (
            <form action={setQuoteStatus.bind(null, quote.id, "rejected")}><button className="btn">رفض العميل</button></form>
          )}
        </div>
      </div>

      <article className="card mx-auto max-w-3xl space-y-6 print:border-0 print:shadow-none">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{orgName}</h1>
            {vatNumber && <p className="text-sm text-slate-500">الرقم الضريبي: {vatNumber}</p>}
          </div>
          <div className="text-end">
            <p className="text-lg font-bold">عرض سعر #{quote.number}</p>
            <p className="text-sm text-slate-500">التاريخ: {formatDate(quote.created_at)}</p>
            {quote.valid_until && <p className="text-sm text-slate-500">صالح حتى: {formatDate(quote.valid_until)}</p>}
            <span className={`badge no-print mt-1 ${status.tone}`}>{status.label}</span>
          </div>
        </header>

        {contact && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">مقدّم إلى</p>
            <p className="font-semibold">{contact.name}</p>
            {contact.company && <p>{contact.company}</p>}
          </div>
        )}

        <table className="table">
          <thead>
            <tr><th>البند</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.description}</td>
                <td>{i.quantity}</td>
                <td>{formatSAR(i.unit_price)}</td>
                <td>{formatSAR(i.quantity * i.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ms-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>المجموع قبل الضريبة</dt><dd>{formatSAR(quote.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>ضريبة القيمة المضافة 15%</dt><dd>{formatSAR(quote.vat)}</dd></div>
          <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>الإجمالي</dt><dd>{formatSAR(quote.total)}</dd></div>
        </dl>

        <p className="text-xs text-slate-400">
          هذا عرض سعر وليس فاتورة ضريبية. تصدر الفاتورة الإلكترونية المتوافقة مع هيئة الزكاة عبر نظام المحاسبة المرتبط.
        </p>
      </article>
    </div>
  );
}
