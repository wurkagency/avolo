"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/profile/settings", label: "Settings", icon: "manage_accounts" },
  { href: "/profile/preferences", label: "Preferences", icon: "tune" },
  { href: "/profile/notifications", label: "Notifications", icon: "notifications" },
];

export function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-52 shrink-0">
      <nav className="flex md:flex-col gap-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-steel hover:bg-surface hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
