// Full auth config — Node.js runtime only (Nodemailer + Prisma).
// Do NOT import this in middleware.ts — use auth.config.ts there instead.

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { db } from "@/lib/server/db";
import { authConfig } from "@/lib/server/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(db),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),

    Nodemailer({
      server: {
        host: process.env.SMTP_HOST ?? "father.wurk.dk",
        port: parseInt(process.env.SMTP_PORT ?? "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER ?? "",
          pass: process.env.SMTP_PASS ?? "",
        },
      },
      from: process.env.SMTP_FROM ?? "noreply@avolo.app",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { createTransport } = await import("nodemailer");
        const transport = createTransport(
          provider.server as Parameters<typeof createTransport>[0],
        );
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Sign in to Avolo",
          text: `Sign in to Avolo\n\n${url}\n\nThis link expires in 24 hours.`,
          html: buildMagicLinkEmail(url),
        });
        const failed = (result.rejected ?? []).concat(result.pending ?? []);
        if (failed.length > 0) {
          throw new Error(`Email delivery failed to ${identifier}`);
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, currency: true, language: true },
        });
        token.id = user.id;
        token.role = dbUser?.role ?? "USER";
        token.currency = dbUser?.currency ?? "EUR";
        token.language = dbUser?.language ?? "EN";
      }

      if (trigger === "update" && updateSession) {
        const update = updateSession as { currency?: string; language?: string; name?: string };
        if (update.currency) token.currency = update.currency;
        if (update.language) token.language = update.language;
        if (update.name) token.name = update.name;
      }

      return token;
    },

    async signIn({ user }) {
      if (!user.email) return false;
      return true;
    },
  },

  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await db.preferences
        .create({
          data: {
            userId: user.id,
            preferredAirports: [],
            preferredAirlines: [],
            excursionStyle: [],
          },
        })
        .catch((err: unknown) => {
          console.error("[auth] Failed to create preferences for new user:", err);
        });

      await db.notificationSettings
        .create({ data: { userId: user.id } })
        .catch((err: unknown) => {
          console.error("[auth] Failed to create notification settings:", err);
        });
    },
  },
});

// ── Type augmentation ──────────────────────────────────────────────────────────

interface AvoloUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
  currency: string;
  language: string;
}

declare module "next-auth" {
  interface Session {
    user: AvoloUser;
  }

  interface JWT {
    id: string;
    role: string;
    currency: string;
    language: string;
  }
}

// ── Email template ─────────────────────────────────────────────────────────────

function buildMagicLinkEmail(url: string): string {
  const year = new Date().getFullYear();
  const siteUrl = process.env.SITE_URL ?? "https://www.avolo.app";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Sign in to Avolo</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f7;font-family:Inter,Helvetica,Arial,sans-serif;color:#1a1c1b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:48px 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;">
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#843ca1;letter-spacing:-0.01em;">avolo</p>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:12px;padding:40px;border:1px solid #d1c2d1;">
          <h1 style="margin:0 0 16px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:32px;font-weight:500;color:#1a1c1b;letter-spacing:-0.01em;line-height:1.2;">Sign in to Avolo</h1>
          <p style="margin:0 0 32px;font-size:16px;line-height:1.5;color:#4e4350;">Click the button below to sign in. This link expires in 24 hours.</p>
          <a href="${url}" style="display:inline-block;background:#843ca1;color:#ffffff;font-size:14px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:9999px;">Sign In</a>
          <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#807381;">If you did not request this email, you can safely ignore it.</p>
        </td></tr>
        <tr><td style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#807381;">© ${year} Avolo · <a href="${siteUrl}/privacy" style="color:#843ca1;">Privacy</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
