"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/searches", label: "Searches" },
  { href: "/admin/users", label: "Users" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mb-8 border-b border-hairline">
      {NAV.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-steel hover:text-ink hover:border-hairline-strong"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
