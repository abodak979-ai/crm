"use client";

import { useState, useTransition } from "react";
import { formatSAR, VAT_RATE } from "@/lib/format";
import { createQuote } from "../actions";

type Item = { description: string; quantity: number; unitPrice: number };

export function QuoteForm({
  contacts,
  deals,
  defaultContact,
}: {
  contacts: { id: string; name: string }[];
  deals: { id: string; title: string; contact_id: string | null }[];
  defaultContact: string;
}) {
  const [contactId, setContactId] = useState(defaultContact);
  const [dealId, setDealId] = useState("");
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = items.reduce((a, i) => a + Math.round(i.quantity * i.unitPrice * 100) / 100, 0);
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const update = (idx: number, patch: Partial<Item>) =>
    setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  function submit() {
    setError(null);
    startTransition(async () => {
      const err = await createQuote({ contactId: contactId || null, dealId: dealId || null, validUntil, items });
      if (err) setError(err);
    });
  }

  return (
    <div className="card space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">العميل</label>
          <select className="input" value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">— اختر —</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">الصفقة المرتبطة</label>
          <select className="input" value={dealId} onChange={(e) => setDealId(e.target.value)}>
            <option value="">— بدون —</option>
            {deals
              .filter((d) => !contactId || d.contact_id === contactId)
              .map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">صالح حتى</label>
          <input type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>البند</th>
              <th className="w-24">الكمية</th>
              <th className="w-36">سعر الوحدة</th>
              <th className="w-36">المجموع</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td><input className="input" value={it.description} onChange={(e) => update(idx, { description: e.target.value })} placeholder="وصف المنتج أو الخدمة" /></td>
                <td><input className="input" type="number" min="1" step="1" dir="ltr" value={it.quantity} onChange={(e) => update(idx, { quantity: Number(e.target.value) })} /></td>
                <td><input className="input" type="number" min="0" step="0.01" dir="ltr" value={it.unitPrice} onChange={(e) => update(idx, { unitPrice: Number(e.target.value) })} /></td>
                <td>{formatSAR(it.quantity * it.unitPrice)}</td>
                <td>
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems((l) => l.filter((_, i) => i !== idx))} className="text-red-600" aria-label="حذف البند">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="btn mt-3" onClick={() => setItems((l) => [...l, { description: "", quantity: 1, unitPrice: 0 }])}>
          + بند
        </button>
      </div>

      <dl className="ms-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt>المجموع قبل الضريبة</dt><dd>{formatSAR(subtotal)}</dd></div>
        <div className="flex justify-between"><dt>ضريبة القيمة المضافة 15%</dt><dd>{formatSAR(vat)}</dd></div>
        <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>الإجمالي</dt><dd>{formatSAR(subtotal + vat)}</dd></div>
      </dl>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="btn-primary" disabled={pending} onClick={submit}>
        {pending ? "جارٍ الحفظ…" : "حفظ العرض"}
      </button>
    </div>
  );
}
