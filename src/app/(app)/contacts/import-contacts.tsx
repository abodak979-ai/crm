"use client";

import { useState, useTransition } from "react";
import { importContacts, type ImportRow } from "./actions";

// Arabic and English header names accepted for each field
const HEADERS: Record<keyof ImportRow, string[]> = {
  name: ["الاسم", "اسم العميل", "name", "full name"],
  phone: ["الجوال", "رقم الجوال", "الهاتف", "phone", "mobile"],
  email: ["البريد", "البريد الإلكتروني", "الايميل", "email"],
  company: ["الشركة", "المنشأة", "company"],
  source: ["المصدر", "source"],
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === ";" || ch === "\t") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export function ImportContacts() {
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(file: File) {
    const text = (await file.text()).replace(/^﻿/, "");
    const [header, ...body] = parseCSV(text);
    if (!header) return setResult("الملف فارغ");
    const norm = header.map((h) => h.trim().toLowerCase());
    const index = Object.fromEntries(
      Object.entries(HEADERS).map(([key, names]) => [key, norm.findIndex((h) => names.includes(h))]),
    ) as Record<keyof ImportRow, number>;
    if (index.name < 0) return setResult("لم نجد عمود «الاسم» في الملف");

    const rows: ImportRow[] = body.map((r) => ({
      name: r[index.name] ?? "",
      phone: index.phone >= 0 ? r[index.phone] : undefined,
      email: index.email >= 0 ? r[index.email] : undefined,
      company: index.company >= 0 ? r[index.company] : undefined,
      source: index.source >= 0 ? r[index.source] : undefined,
    }));
    startTransition(async () => {
      const res = await importContacts(rows);
      setResult(
        res.error ? `تعذّر الاستيراد: ${res.error}` : `تم استيراد ${res.inserted} عميل، وتخطّي ${res.skipped} (مكرر أو بلا اسم)`,
      );
    });
  }

  function downloadTemplate() {
    const csv = "﻿الاسم,الجوال,البريد,الشركة,المصدر\nمحمد العتيبي,0551234567,m@example.com,مؤسسة النخبة,واتساب\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "قالب-العملاء.csv";
    a.click();
  }

  return (
    <section className="card">
      <h2 className="mb-2 font-semibold">استيراد من Excel</h2>
      <p className="mb-3 text-sm text-slate-500">
        احفظ الملف بصيغة CSV من Excel. نكشف التكرار برقم الجوال.{" "}
        <button type="button" onClick={downloadTemplate} className="text-brand-700 underline">
          حمّل القالب العربي
        </button>
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        disabled={pending}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        className="block w-full text-sm"
      />
      {pending && <p className="mt-2 text-sm text-slate-500">جارٍ الاستيراد…</p>}
      {result && <p className="mt-2 text-sm text-brand-800">{result}</p>}
    </section>
  );
}
