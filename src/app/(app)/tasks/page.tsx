import Link from "next/link";
import { getContext } from "@/lib/org";
import { endOfTodayRiyadh, formatDateTime } from "@/lib/format";
import { createTask, toggleTask } from "./actions";

type Task = {
  id: string;
  title: string;
  due_at: string | null;
  done: boolean;
  contacts: { id: string; name: string } | null;
};

export default async function TasksPage() {
  const { supabase } = await getContext();
  const { data } = await supabase
    .from("tasks")
    .select("id, title, due_at, done, contacts(id, name)")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(300);
  const tasks = (data ?? []) as unknown as Task[];

  const now = new Date();
  const endOfDay = endOfTodayRiyadh();
  const open = tasks.filter((t) => !t.done);
  const groups = [
    { title: "متأخرة", items: open.filter((t) => t.due_at && new Date(t.due_at) < now), tone: "text-red-600" },
    { title: "اليوم", items: open.filter((t) => t.due_at && new Date(t.due_at) >= now && new Date(t.due_at) <= endOfDay), tone: "text-brand-700" },
    { title: "القادمة", items: open.filter((t) => !t.due_at || new Date(t.due_at) > endOfDay), tone: "text-slate-700" },
    { title: "منجزة", items: tasks.filter((t) => t.done).slice(0, 20), tone: "text-slate-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="page-title">المهام</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {groups.map((g) => (
            <section key={g.title} className="card">
              <h2 className={`mb-3 font-semibold ${g.tone}`}>
                {g.title} <span className="text-sm text-slate-400">({g.items.length})</span>
              </h2>
              {g.items.length === 0 ? (
                <p className="text-sm text-slate-400">لا شيء هنا.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {g.items.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                      <form action={toggleTask.bind(null, t.id, !t.done)}>
                        <button
                          aria-label={t.done ? "إعادة فتح" : "إنجاز"}
                          className={`h-5 w-5 rounded border ${t.done ? "border-brand-600 bg-brand-600" : "border-slate-300"}`}
                        />
                      </form>
                      <span className={`flex-1 ${t.done ? "text-slate-400 line-through" : ""}`}>
                        {t.title}
                        {t.contacts && (
                          <Link href={`/contacts/${t.contacts.id}`} className="ms-2 text-brand-700">
                            {t.contacts.name}
                          </Link>
                        )}
                      </span>
                      <span className="text-slate-500">{formatDateTime(t.due_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <section className="card h-fit">
          <h2 className="mb-3 font-semibold">مهمة جديدة</h2>
          <form action={createTask} className="space-y-3">
            <input name="title" className="input" placeholder="عنوان المهمة" required />
            <input name="due_at" type="datetime-local" className="input" required />
            <button className="btn-primary w-full">إضافة</button>
          </form>
        </section>
      </div>
    </div>
  );
}
