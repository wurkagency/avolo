import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { mergeAnonymousToUser } from "@/server/services/mergeService";

/**
 * POST /api/auth/merge
 *
 * Called client-side after successful sign-in to merge any anonymous trips
 * to the newly authenticated user. Reads the avolo_sid cookie and clears it
 * after a successful merge.
 *
 * This endpoint is intentionally unauthenticated — auth is verified by reading
 * the NextAuth session. The anonymous session cookie provides the source.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const anonId = request.cookies.get("avolo_sid")?.value;

  if (!anonId) {
    // No anonymous session — nothing to merge
    return NextResponse.json({ merged: 0 });
  }

  try {
    const result = await mergeAnonymousToUser(anonId, session.user.id);

    const response = NextResponse.json({ merged: result.merged });

    // Clear the anonymous session cookie after merge
    response.cookies.set("avolo_sid", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("[merge] Failed to merge anonymous session:", error);
    return NextResponse.json(
      { error: "Merge failed", code: "MERGE_FAILED" },
      { status: 500 },
    );
  }
}
