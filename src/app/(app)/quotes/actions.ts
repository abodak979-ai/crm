"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/org";

export type QuoteInput = {
  contactId: string | null;
  dealId: string | null;
  validUntil: string | null;
  items: { description: string; quantity: number; unitPrice: number }[];
};

export async function createQuote(input: QuoteInput) {
  const { supabase, orgId, user } = await getContext();
  const items = input.items.filter((i) => i.description.trim() && i.quantity > 0);
  if (!items.length) return "أضف بندًا واحدًا على الأقل";

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      org_id: orgId,
      owner_id: user.id,
      contact_id: input.contactId,
      deal_id: input.dealId,
      valid_until: input.validUntil,
      number: 0, // assigned by trigger
    })
    .select("id")
    .single();
  if (error) return error.message;

  const { error: itemsError } = await supabase.from("quote_items").insert(
    items.map((i) => ({
      org_id: orgId,
      quote_id: quote.id,
      description: i.description.trim(),
      quantity: i.quantity,
      unit_price: i.unitPrice,
    })),
  );
  if (itemsError) return itemsError.message;
  redirect(`/quotes/${quote.id}`);
}

export async function setQuoteStatus(id: string, status: "draft" | "sent" | "accepted" | "rejected") {
  const { supabase } = await getContext();
  await supabase.from("quotes").update({ status }).eq("id", id);
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}
