import { getContext, ROLE_LABELS } from "@/lib/org";
import { NavLinks } from "@/components/nav-links";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgName, role, user } = await getContext();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="no-print border-b border-slate-200 bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-l">
        <div className="flex items-center justify-between p-4 md:block">
          <div>
            <p className="text-lg font-bold text-brand-700">{orgName}</p>
            <p className="text-xs text-slate-500">
              {user.email} · {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <NavLinks />
        <form action="/auth/signout" method="post" className="hidden p-4 md:block">
          <button className="text-sm text-slate-500 hover:text-red-600">تسجيل الخروج</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
