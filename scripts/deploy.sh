#!/usr/bin/env bash
# deploy.sh — Avolo production deploy for Plesk Obsidian (Ubuntu, Node.js)
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
#
# Prerequisites:
#   - Node.js 20.x installed
#   - MySQL running and DATABASE_URL set in environment or .env
#   - .env file present at project root (never commit this)
#   - Git remote "origin" points to the GitHub repo
#
# First-time setup:
#   Before the first deploy, run locally (with DB connection):
#     npx prisma migrate dev --name init
#   Commit the generated prisma/migrations/* files.
#   On subsequent deploys this script runs "migrate deploy" automatically.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> [1/7] Pull latest from origin/master"
git pull origin master

echo "==> [2/7] Install dependencies"
npm ci --prefer-offline

echo "==> [3/7] Generate Prisma client"
npx prisma generate

echo "==> [4/7] Run database migrations"
npx prisma migrate deploy

echo "==> [5/7] Seed airports (skip if already seeded)"
# Safe to run repeatedly — uses upsert. Comment out after first deploy if slow.
# Requires source/airports.csv to be present.
if [ -f "source/airports.csv" ]; then
  npm run db:seed || echo "  Seed skipped or failed — continuing."
else
  echo "  source/airports.csv not found — skipping seed."
fi

echo "==> [6/7] Build Next.js standalone"
NODE_ENV=production npm run build

echo "==> [6b/7] Copy static assets into standalone output"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> [7/7] Restart Node.js application"
# Plesk Obsidian: touch restart.txt triggers Passenger restart.
# If using PM2 instead: uncomment the pm2 line and comment out the touch line.
if [ -d "tmp" ] || mkdir -p tmp; then
  touch tmp/restart.txt
  echo "  Triggered Passenger restart via tmp/restart.txt"
fi
# pm2 restart avolo --update-env 2>/dev/null || pm2 start .next/standalone/server.js --name avolo

echo ""
echo "Deploy complete. App running at https://www.avolo.app"
