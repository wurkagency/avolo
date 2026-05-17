/**
 * One-time admin user seed script.
 * Run with credentials supplied via environment variables — never hardcode passwords.
 *
 * Usage:
 *   ADMIN_EMAIL=charlie@avolo.app ADMIN_PASSWORD=<password> npx ts-node scripts/seed-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where:  { email },
    update: { password: hashed, role: "ADMIN" },
    create: {
      email,
      name: email.split("@")[0],
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log(`✓ Admin user ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
