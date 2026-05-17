#!/usr/bin/env bash
# deployment.sh — Redeploy avolo.app (run on every update after first-time setup)
#
# Usage:
#   ssh user@avolo.app
#   cd /var/www/vhosts/avolo.app/httpdocs
#   ./deployment.sh
#
# What it does:
#   1. Pull latest from GitHub (master branch)
#   2. Install / update dependencies
#   3. Regenerate Prisma client
#   4. Apply new database migrations (safe, idempotent)
#   5. Build Next.js standalone
#   6. Copy static assets into standalone output
#   7. Reload application via PM2 (zero-downtime reload)

set -euo pipefail

APP_DIR="/var/www/vhosts/avolo.app/httpdocs"
APP_NAME="avolo"

info()  { echo -e "\033[1;34m==>\033[0m $*"; }
ok()    { echo -e "\033[1;32m  ✓\033[0m $*"; }
warn()  { echo -e "\033[1;33m  !\033[0m $*"; }
die()   { echo -e "\033[1;31mERROR:\033[0m $*" >&2; exit 1; }

[ -d "$APP_DIR" ] || die "App directory not found: $APP_DIR — run deployment_first.sh first."
cd "$APP_DIR"

[ -f ".env" ] || die ".env file not found. Cannot deploy without environment variables."

STARTED_AT=$(date +%s)

# ── Step 1: Pull latest code ──────────────────────────────────────────────────
info "[1/6] Pulling latest code from GitHub"
git fetch origin master
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)
if [ "$LOCAL" = "$REMOTE" ]; then
  warn "Already up-to-date ($(git log -1 --format='%h %s')). Re-running build anyway."
fi
git reset --hard origin/master
ok "Code updated to $(git log -1 --format='%h — %s')"

# ── Step 2: Install dependencies ──────────────────────────────────────────────
info "[2/6] Installing dependencies"
npm ci --prefer-offline
ok "Dependencies installed"

# ── Step 3: Prisma ───────────────────────────────────────────────────────────
info "[3/6] Generating Prisma client & running migrations"
npx prisma generate

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy
  ok "Migrations applied"
else
  warn "No migrations directory — schema may be out of date. Run 'npx prisma migrate dev' locally."
fi

# ── Step 4: Build ─────────────────────────────────────────────────────────────
info "[4/6] Building Next.js (standalone)"
NODE_ENV=production npm run build
ok "Build complete"

# ── Step 5: Copy static assets ───────────────────────────────────────────────
info "[5/6] Copying static assets into standalone output"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static  .next/standalone/.next/static
cp -r public         .next/standalone/public
ok "Static assets copied"

# ── Step 6: Reload PM2 ────────────────────────────────────────────────────────
info "[6/6] Reloading application (PM2 zero-downtime reload)"

if pm2 list | grep -q "$APP_NAME"; then
  # Reload keeps existing process alive while new one starts (no downtime)
  pm2 reload "$APP_NAME" --update-env
  ok "PM2 process '$APP_NAME' reloaded"
else
  warn "PM2 process '$APP_NAME' not found — starting fresh."
  set -a; source .env; set +a
  PORT=${PORT:-3000}
  HOSTNAME=${HOSTNAME:-0.0.0.0}
  pm2 start .next/standalone/server.js \
    --name "$APP_NAME" \
    --interpreter node \
    --env production \
    -- --port "$PORT" --hostname "$HOSTNAME"
  pm2 save
  ok "PM2 process started"
fi

ELAPSED=$(( $(date +%s) - STARTED_AT ))
echo ""
ok "Deployment complete in ${ELAPSED}s"
echo ""
echo "  Commit:  $(git log -1 --format='%h — %s')"
echo "  App:     https://avolo.app"
echo "  Logs:    pm2 logs $APP_NAME"
echo "  Status:  pm2 status"
