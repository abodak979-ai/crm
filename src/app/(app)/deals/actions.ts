"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/org";

export async function createDeal(formData: FormData) {
  const { supabase, orgId, user } = await getContext();
  const pipelineId = String(formData.get("pipeline_id"));
  const { data: first } = await supabase
    .from("stages")
    .select("id")
    .eq("pipeline_id", pipelineId)
    .eq("kind", "open")
    .order("position")
    .limit(1)
    .single();
  const { error } = await supabase.from("deals").insert({
    org_id: orgId,
    owner_id: user.id,
    pipeline_id: pipelineId,
    stage_id: first?.id,
    title: String(formData.get("title")),
    value: Number(formData.get("value") || 0),
    contact_id: (formData.get("contact_id") as string) || null,
  });
  if (error) redirect("/deals?error=" + encodeURIComponent(error.message));
  revalidatePath("/deals");
  redirect(`/deals?pipeline=${pipelineId}`);
}

export async function moveDeal(dealId: string, stageId: string, lostReason?: string) {
  const { supabase } = await getContext();
  const { error } = await supabase
    .from("deals")
    .update({ stage_id: stageId, lost_reason: lostReason ?? null })
    .eq("id", dealId);
  revalidatePath("/deals");
  if (error) return error.message.includes("lost_reason_required") ? "سبب الخسارة إلزامي" : error.message;
  return null;
}

export async function createPipeline(formData: FormData) {
  const { supabase, orgId } = await getContext();
  const { data, error } = await supabase
    .from("pipelines")
    .insert({ org_id: orgId, name: String(formData.get("name")) })
    .select("id")
    .single();
  if (error) redirect("/deals?error=" + encodeURIComponent("فقط المالك أو المدير يضيف خطوط مبيعات"));
  const names = String(formData.get("stages") || "جديد، تواصل، عرض سعر، تفاوض")
    .split(/[،,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  await supabase.from("stages").insert([
    ...names.map((name, i) => ({ org_id: orgId, pipeline_id: data.id, name, position: i, kind: "open" })),
    { org_id: orgId, pipeline_id: data.id, name: "مكسوبة", position: names.length, kind: "won" },
    { org_id: orgId, pipeline_id: data.id, name: "خاسرة", position: names.length + 1, kind: "lost" },
  ]);
  redirect(`/deals?pipeline=${data.id}`);
}
