// GET /api/admin/users — paginated user list (ADMIN only)
// Query params: page (default 1), limit (default 20), role (USER|ADMIN|all)

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import type { Role } from "@prisma/client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  if (!session || sessionRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const roleFilter = searchParams.get("role");

  const VALID_ROLES: Role[] = ["USER", "ADMIN"];
  const where =
    roleFilter && VALID_ROLES.includes(roleFilter as Role)
      ? { role: roleFilter as Role }
      : {};

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        currency: true,
        language: true,
        createdAt: true,
        _count: { select: { trips: true } },
      },
    }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      currency: u.currency,
      language: u.language,
      createdAt: u.createdAt,
      tripCount: u._count.trips,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
