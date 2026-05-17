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
#   3. Regenerate Prisma client & apply migrations
#   4. Build Next.js standalone
#   5. Copy static assets into standalone output
#   6. Restart application via PM2 (brief downtime — fork mode, single process)
#
# Note on downtime: Next.js standalone runs in PM2 fork mode (single process).
# pm2 restart sends SIGINT to the old process before starting the new one.
# Expect ~2-5s of downtime during restart. Nginx will buffer requests if
# proxy_read_timeout is set appropriately. For zero-downtime, add a load
# balancer in front of two PM2 instances on different ports.

set -euo pipefail

APP_DIR="/var/www/vhosts/avolo.app/httpdocs"
APP_NAME="avolo"
NODE_BIN="/opt/plesk/node/22/bin/node"
PM2_BIN="/opt/plesk/node/22/bin/pm2"

info()  { echo -e "\033[1;34m==>\033[0m $*"; }
ok()    { echo -e "\033[1;32m  ✓\033[0m $*"; }
warn()  { echo -e "\033[1;33m  !\033[0m $*"; }
die()   { echo -e "\033[1;31mERROR:\033[0m $*" >&2; exit 1; }

# load_env <file> — safely export KEY=VALUE pairs without bash-executing the file.
load_env() {
  local file="${1:-.env}"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    line="${line#export }"
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    local key="${BASH_REMATCH[1]}"
    local val="${BASH_REMATCH[2]}"
    val="${val#"${val%%[![:space:]]*}"}"
    val="${val%"${val##*[![:space:]]}"}"
    if   [[ "$val" =~ ^\"(.*)\"$ ]]; then val="${BASH_REMATCH[1]}"
    elif [[ "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"
    fi
    export "$key=$val"
  done < "$file"
}

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

# Hard reset to remote. Note: if .env was accidentally committed and later
# removed from .gitignore, this would overwrite it. The check below guards that.
git reset --hard origin/master

# Verify .env was not destroyed by the reset (safety check)
[ -f ".env" ] || die ".env was destroyed by git reset — it may have been committed to the repo. Restore from backup."

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
  warn "No migrations directory found — schema may be out of date."
  warn "Run 'npx prisma migrate dev --name <name>' locally and commit migrations/."
fi

# ── Step 4: Build ─────────────────────────────────────────────────────────────
info "[4/6] Building Next.js (standalone)"
NODE_ENV=production npm run build
ok "Build complete"

# ── Step 5: Copy static assets ───────────────────────────────────────────────
info "[5/6] Copying static assets into standalone output"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static   .next/standalone/.next/static
cp -r public          .next/standalone/public
ok "Static assets copied"

# Create a _next/static symlink at the webroot so Nginx can serve CSS/JS
# directly without proxying to Node.js (required when Plesk does try_files).
mkdir -p _next
ln -sfn ../.next/standalone/.next/static _next/static
ok "_next/static symlink updated"

# Fix ownership — build runs as root but Nginx serves files as avolo.app.
# Without this, /_next/static/ returns 403 due to disable_symlinks if_not_owner.
chown -R avolo.app:psacln .next/ _next/
ok "Ownership fixed (avolo.app:psacln)"

# ── Step 6: Restart PM2 ───────────────────────────────────────────────────────
info "[6/6] Restarting application via PM2"

# Load .env into this shell before restart so --update-env picks them up.
load_env .env

# pm2 describe exits 0 if the process is registered (any state), non-zero if unknown.
if "$NODE_BIN" "$PM2_BIN" describe "$APP_NAME" > /dev/null 2>&1; then
  # Process registered with PM2 — restart it (brief downtime in fork mode)
  "$NODE_BIN" "$PM2_BIN" restart "$APP_NAME" --update-env
  ok "PM2 process '$APP_NAME' restarted"
else
  # Process not known to PM2 — start fresh
  warn "PM2 process '$APP_NAME' not found — starting fresh."
  "$NODE_BIN" "$PM2_BIN" start .next/standalone/server.js \
    --name "$APP_NAME" \
    --interpreter "$NODE_BIN"
  "$NODE_BIN" "$PM2_BIN" save
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
