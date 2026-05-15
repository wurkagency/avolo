#!/usr/bin/env bash
# bootstrap.sh — One-time local setup before the first production deploy.
#
# Run this ONCE on a machine with database access, then commit the
# generated prisma/migrations/ folder.
#
# Usage:
#   cp .env.example .env        # Fill in DATABASE_URL and other vars
#   chmod +x scripts/bootstrap.sh
#   ./scripts/bootstrap.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Installing dependencies"
npm install

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Creating initial migration from schema"
npx prisma migrate dev --name init

echo ""
echo "Bootstrap complete."
echo "Commit prisma/migrations/ to git, then run scripts/deploy.sh on the server."
