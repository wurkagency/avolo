"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { SessionMergeProvider } from "./SessionMergeProvider";

export function NextAuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionMergeProvider />
      {children}
    </SessionProvider>
  );
}
