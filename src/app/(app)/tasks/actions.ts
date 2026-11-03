"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/org";

export async function createTask(formData: FormData) {
  const { supabase, orgId, user } = await getContext();
  const due = String(formData.get("due_at") ?? "");
  const tz = Number(formData.get("tz_offset") ?? -180); // default Riyadh (UTC+3)
  await supabase.from("tasks").insert({
    org_id: orgId,
    owner_id: user.id,
    title: String(formData.get("title")),
    // datetime-local has no zone; interpret it in the user's offset
    due_at: due ? new Date(new Date(due + "Z").getTime() + tz * 60_000).toISOString() : null,
    contact_id: (formData.get("contact_id") as string) || null,
    deal_id: (formData.get("deal_id") as string) || null,
  });
  const to = String(formData.get("redirect_to") ?? "/tasks");
  revalidatePath(to);
  redirect(to);
}

export async function toggleTask(id: string, done: boolean) {
  const { supabase } = await getContext();
  await supabase.from("tasks").update({ done }).eq("id", id);
  revalidatePath("/tasks");
  revalidatePath("/");
}
