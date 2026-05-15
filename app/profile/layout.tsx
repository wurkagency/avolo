// Profile section layout — sidebar nav (settings / preferences / notifications)
// Authentication is enforced by middleware.ts (/profile/* → redirect to /login)

import type { ReactNode } from "react";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <ProfileSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
