import { revalidatePath } from "next/cache";
import { getContext, ROLE_LABELS, type Role } from "@/lib/org";
import { formatDateTime } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = { insert: "إضافة", update: "تعديل", delete: "حذف" };
const ENTITY_LABELS: Record<string, string> = {
  consents: "موافقة",
  contacts: "عميل",
  deals: "صفقة",
  memberships: "عضوية",
  quotes: "عرض سعر",
};

async function updateOrg(formData: FormData) {
  "use server";
  const { supabase, orgId } = await getContext();
  await supabase
    .from("organizations")
    .update({ name: String(formData.get("name")), vat_number: String(formData.get("vat_number") || "") || null })
    .eq("id", orgId);
  revalidatePath("/", "layout");
}

async function changeRole(userId: string, formData: FormData) {
  "use server";
  const { supabase, orgId } = await getContext();
  await supabase.from("memberships").update({ role: String(formData.get("role")) }).eq("org_id", orgId).eq("user_id", userId);
  revalidatePath("/settings");
}

async function createInvite(formData: FormData) {
  "use server";
  const { supabase, orgId, user } = await getContext();
  await supabase.from("invites").insert({ org_id: orgId, role: String(formData.get("role")), created_by: user.id });
  revalidatePath("/settings");
}

async function deleteInvite(code: string) {
  "use server";
  const { supabase } = await getContext();
  await supabase.from("invites").delete().eq("code", code);
  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const { supabase, role, orgName, vatNumber, user } = await getContext();
  const isOwner = role === "owner";
  const canInvite = role === "owner" || role === "manager";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saudi-crm.vercel.app";

  const [members, audit, invites] = await Promise.all([
    supabase.from("memberships").select("user_id, role, profiles(full_name)").order("created_at"),
    role === "owner" || role === "manager"
      ? supabase.from("audit_log").select("id, action, entity, created_at").order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [] as { id: number; action: string; entity: string; created_at: string }[] }),
    canInvite
      ? supabase.from("invites").select("code, role, expires_at").is("used_by", null).gt("expires_at", new Date().toISOString())
      : Promise.resolve({ data: [] as { code: string; role: Role; expires_at: string }[] }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">الإعدادات</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 font-semibold">بيانات المنشأة</h2>
          <form action={updateOrg} className="space-y-3">
            <div>
              <label className="label">اسم المنشأة</label>
              <input name="name" defaultValue={orgName} className="input" required disabled={!isOwner} />
            </div>
            <div>
              <label className="label">الرقم الضريبي (يظهر في عروض الأسعار)</label>
              <input name="vat_number" defaultValue={vatNumber ?? ""} className="input" dir="ltr" maxLength={15} disabled={!isOwner} />
            </div>
            {isOwner && <button className="btn-primary">حفظ</button>}
          </form>
        </section>

        <section className="card">
          <h2 className="mb-4 font-semibold">الفريق والصلاحيات</h2>
          <ul className="divide-y divide-slate-100">
            {(members.data ?? []).map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {(m.profiles as unknown as { full_name: string | null } | null)?.full_name || "مستخدم"}
                  {m.user_id === user.id && <span className="text-slate-400"> (أنت)</span>}
                </span>
                {isOwner && m.user_id !== user.id ? (
                  <form action={changeRole.bind(null, m.user_id)} className="flex gap-2">
                    <select name="role" defaultValue={m.role} className="input py-1">
                      {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button className="btn py-1">حفظ</button>
                  </form>
                ) : (
                  <span className="badge bg-slate-100">{ROLE_LABELS[m.role as Role]}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            المالك والمدير والمحاسب يرون كل السجلات، والمندوب يرى سجلاته فقط.
          </p>

          {canInvite && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold">دعوة عضو جديد</h3>
              <form action={createInvite} className="mb-3 flex gap-2">
                <select name="role" className="input" defaultValue="rep">
                  {(isOwner ? ["manager", "rep", "accountant"] : ["rep", "accountant"]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r as Role]}</option>
                  ))}
                </select>
                <button className="btn-primary whitespace-nowrap">إنشاء رمز</button>
              </form>
              <ul className="space-y-2 text-sm">
                {(invites.data ?? []).map((i) => (
                  <li key={i.code} className="rounded-lg bg-slate-50 p-2">
                    <div className="flex items-center justify-between">
                      <span>
                        <b dir="ltr">{i.code}</b> · {ROLE_LABELS[i.role as Role]} · ينتهي {formatDateTime(i.expires_at)}
                      </span>
                      <form action={deleteInvite.bind(null, i.code)}>
                        <button className="text-xs text-red-600">إلغاء</button>
                      </form>
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-500" dir="ltr">
                      {origin}/onboarding?code={i.code}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                أرسل الرابط للموظف: ينشئ حسابه ثم ينضم تلقائيًا. الرمز صالح 7 أيام ولمرة واحدة.
              </p>
            </div>
          )}
        </section>
      </div>

      {(role === "owner" || role === "manager") && (
        <section className="card overflow-x-auto">
          <h2 className="mb-4 font-semibold">سجل التدقيق</h2>
          {(audit.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد عمليات مسجلة بعد.</p>
          ) : (
            <table className="table">
              <thead><tr><th>العملية</th><th>السجل</th><th>الوقت</th></tr></thead>
              <tbody>
                {audit.data!.map((a) => (
                  <tr key={a.id}>
                    <td>{ACTION_LABELS[a.action] ?? a.action}</td>
                    <td>{ENTITY_LABELS[a.entity] ?? a.entity}</td>
                    <td>{formatDateTime(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
