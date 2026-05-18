import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 px-4 sm:px-6 py-6 sm:py-10 max-w-[840px] mx-auto w-full">
        <ProfileSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </AppShell>
  );
}
