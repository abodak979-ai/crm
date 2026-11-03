export const QUOTE_STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "مسودة", tone: "bg-slate-100 text-slate-600" },
  sent: { label: "مرسل", tone: "bg-amber-100 text-amber-800" },
  accepted: { label: "مقبول", tone: "bg-brand-100 text-brand-800" },
  rejected: { label: "مرفوض", tone: "bg-red-100 text-red-700" },
};
