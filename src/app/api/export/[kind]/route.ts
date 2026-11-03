import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEAL_STATUS: Record<string, string> = { open: "مفتوحة", won: "مكسوبة", lost: "خاسرة" };
const QUOTE_STATUS: Record<string, string> = { draft: "مسودة", sent: "مرسل", accepted: "مقبول", rejected: "مرفوض" };

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
const name = <T,>(rel: unknown, key: keyof T) => (rel as T | null)?.[key] ?? "";

/** CSV exports (open in Excel); RLS limits rows to what the user may see. */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  let rows: unknown[][];
  if (kind === "contacts") {
    const { data } = await supabase.from("contacts").select("name, phone, email, company, source, created_at").order("created_at");
    rows = [["الاسم", "الجوال", "البريد", "الشركة", "المصدر", "تاريخ الإضافة"],
      ...(data ?? []).map((c) => [c.name, c.phone, c.email, c.company, c.source, c.created_at.slice(0, 10)])];
  } else if (kind === "deals") {
    const { data } = await supabase.from("deals").select("title, value, status, lost_reason, created_at, stages(name), contacts(name)").order("created_at");
    rows = [["الصفقة", "القيمة (ريال)", "الحالة", "المرحلة", "العميل", "سبب الخسارة", "التاريخ"],
      ...(data ?? []).map((d) => [d.title, d.value, DEAL_STATUS[d.status], name<{ name: string }>(d.stages, "name"),
        name<{ name: string }>(d.contacts, "name"), d.lost_reason, d.created_at.slice(0, 10)])];
  } else if (kind === "quotes") {
    const { data } = await supabase.from("quotes").select("number, subtotal, vat, total, status, created_at, contacts(name)").order("number");
    rows = [["الرقم", "العميل", "قبل الضريبة", "الضريبة", "الإجمالي", "الحالة", "التاريخ"],
      ...(data ?? []).map((q) => [q.number, name<{ name: string }>(q.contacts, "name"), q.subtotal, q.vat, q.total,
        QUOTE_STATUS[q.status], q.created_at.slice(0, 10)])];
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(toCSV(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
