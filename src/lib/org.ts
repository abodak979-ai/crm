import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "manager" | "rep" | "accountant";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "مالك",
  manager: "مدير",
  rep: "مندوب",
  accountant: "محاسب",
};

/** Current user and their organization; redirects to login/onboarding when missing. */
export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(name, vat_number)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const org = membership.organizations as unknown as { name: string; vat_number: string | null };
  return {
    supabase,
    user,
    orgId: membership.org_id as string,
    role: membership.role as Role,
    orgName: org.name,
    vatNumber: org.vat_number,
  };
}
