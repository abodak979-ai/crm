"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/inbox", label: "صندوق الواتساب" },
  { href: "/contacts", label: "العملاء" },
  { href: "/deals", label: "الصفقات" },
  { href: "/tasks", label: "المهام" },
  { href: "/quotes", label: "عروض الأسعار" },
  { href: "/reports", label: "التقارير" },
  { href: "/settings", label: "الإعدادات" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
              active ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
