"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/org";
import { normalizePhone } from "@/lib/format";

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

export async function createContact(formData: FormData) {
  const { supabase, orgId, user } = await getContext();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      org_id: orgId,
      name: str(formData, "name"),
      company: str(formData, "company"),
      phone: normalizePhone(str(formData, "phone")),
      email: str(formData, "email"),
      source: str(formData, "source"),
      owner_id: user.id,
    })
    .select("id")
    .single();
  if (error) {
    const msg = error.code === "23505" ? "يوجد عميل مسجّل بنفس رقم الجوال" : error.message;
    redirect("/contacts?error=" + encodeURIComponent(msg));
  }
  if (formData.get("consent") === "on") {
    await supabase.from("consents").insert({
      org_id: orgId,
      contact_id: data.id,
      channel: "whatsapp",
      granted: true,
      source: "manual_entry",
      recorded_by: user.id,
    });
  }
  redirect(`/contacts/${data.id}`);
}

export type ImportRow = { name: string; phone?: string; email?: string; company?: string; source?: string };

/** Imports rows from Excel/CSV, skipping phones that already exist in the organization. */
export async function importContacts(rows: ImportRow[]) {
  const { supabase, orgId, user } = await getContext();
  const { data: existing } = await supabase.from("contacts").select("phone").not("phone", "is", null);
  const seen = new Set((existing ?? []).map((c) => c.phone));

  let skipped = 0;
  const toInsert = [];
  for (const r of rows) {
    const phone = normalizePhone(r.phone);
    if (!r.name?.trim() || (phone && seen.has(phone))) {
      skipped++;
      continue;
    }
    if (phone) seen.add(phone);
    toInsert.push({
      org_id: orgId,
      owner_id: user.id,
      name: r.name.trim(),
      phone,
      email: r.email?.trim() || null,
      company: r.company?.trim() || null,
      source: r.source?.trim() || "import",
    });
  }
  let inserted = 0;
  if (toInsert.length) {
    // phones owned by other reps are invisible here, so let the unique index drop them
    const { data, error } = await supabase
      .from("contacts")
      .upsert(toInsert, { onConflict: "org_id,phone", ignoreDuplicates: true })
      .select("id");
    if (error) return { inserted: 0, skipped, error: error.message };
    inserted = data.length;
  }
  revalidatePath("/contacts");
  return { inserted, skipped: skipped + toInsert.length - inserted };
}

export async function addNote(contactId: string, formData: FormData) {
  const { supabase, orgId, user } = await getContext();
  const body = str(formData, "body");
  if (body) await supabase.from("notes").insert({ org_id: orgId, contact_id: contactId, body, owner_id: user.id });
  revalidatePath(`/contacts/${contactId}`);
}

export async function setConsent(contactId: string, granted: boolean) {
  const { supabase, orgId, user } = await getContext();
  await supabase.from("consents").insert({
    org_id: orgId,
    contact_id: contactId,
    channel: "whatsapp",
    granted,
    source: granted ? "manual_opt_in" : "manual_opt_out",
    recorded_by: user.id,
  });
  revalidatePath(`/contacts/${contactId}`);
}

export async function deleteContact(contactId: string) {
  const { supabase } = await getContext();
  await supabase.from("contacts").delete().eq("id", contactId);
  redirect("/contacts");
}
