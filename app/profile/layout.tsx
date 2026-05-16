import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="flex gap-8 px-8 py-10 max-w-5xl mx-auto w-full">
        <ProfileSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </AppShell>
  );
}
