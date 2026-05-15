import { cookies } from "next/headers";
import { db } from "@/lib/server/db";

const COOKIE_NAME = "avolo_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/**
 * Returns the current anonymous session ID from the cookie, or null if not set.
 * Use in Server Components and API routes.
 */
export function getAnonymousSessionId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Creates a new anonymous session in the DB and sets the httpOnly cookie.
 * Returns the new session ID.
 *
 * Must be called from a Server Action or Route Handler — not a Server Component —
 * because setting cookies requires a mutable response context.
 */
export async function createAnonymousSession(): Promise<string> {
  const id = crypto.randomUUID();

  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);

  await db.anonymousSession.create({ data: { id, expiresAt } });

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return id;
}

/**
 * Invalidates the anonymous session cookie by setting maxAge to 0.
 */
export function clearAnonymousSession(): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Purges expired anonymous sessions from the DB.
 * Call from a cron route.
 */
export async function purgeExpiredAnonymousSessions(): Promise<number> {
  const result = await db.anonymousSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
