import { getContext } from "@/lib/org";
import { QuoteForm } from "./quote-form";

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ contact?: string }> }) {
  const { contact } = await searchParams;
  const { supabase } = await getContext();
  const [contacts, deals] = await Promise.all([
    supabase.from("contacts").select("id, name").order("name").limit(500),
    supabase.from("deals").select("id, title, contact_id").eq("status", "open").order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">عرض سعر جديد</h1>
      <QuoteForm contacts={contacts.data ?? []} deals={deals.data ?? []} defaultContact={contact ?? ""} />
    </div>
  );
}
