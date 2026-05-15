import { db } from "@/lib/server/db";

/**
 * Merges all trips from an anonymous session to an authenticated user,
 * then deletes the anonymous session record.
 *
 * Idempotent — safe to call multiple times for the same pair.
 * Runs inside a transaction so partial merges never persist.
 */
export async function mergeAnonymousToUser(
  anonymousSessionId: string,
  userId: string,
): Promise<{ merged: number }> {
  const session = await db.anonymousSession.findUnique({
    where: { id: anonymousSessionId },
    include: { trips: { select: { id: true } } },
  });

  if (!session) {
    return { merged: 0 };
  }

  const tripIds = session.trips.map((t) => t.id);

  if (tripIds.length === 0) {
    // No trips to merge — just delete the anonymous session
    await db.anonymousSession.delete({ where: { id: anonymousSessionId } });
    return { merged: 0 };
  }

  await db.$transaction([
    // Reassign trips to the authenticated user
    db.trip.updateMany({
      where: { id: { in: tripIds }, anonymousSessionId },
      data: {
        userId,
        anonymousSessionId: null,
      },
    }),
    // Delete the anonymous session (cascade is not set on trips → userId,
    // so we need to manually null it first, which we do above)
    db.anonymousSession.delete({ where: { id: anonymousSessionId } }),
  ]);

  return { merged: tripIds.length };
}
