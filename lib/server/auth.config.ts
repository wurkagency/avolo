// Edge-safe auth config — no Node.js modules (no Nodemailer, no Prisma).
// Used by middleware.ts (Edge runtime) and extended by auth.ts (Node.js runtime).

import type { NextAuthConfig } from "next-auth";

interface AvoloUser {
  id: string;
  role: string;
  currency: string;
  language: string;
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" as const },

  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login",
  },

  providers: [],

  callbacks: {
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as unknown as AvoloUser).role = (token.role as string) ?? "USER";
        (session.user as unknown as AvoloUser).currency = (token.currency as string) ?? "EUR";
        (session.user as unknown as AvoloUser).language = (token.language as string) ?? "EN";
        session.user.image = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
