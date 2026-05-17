#!/usr/bin/env bash
# deployment_first.sh — First-time deployment for avolo.app on Plesk Obsidian / Ubuntu
#
# Run ONCE on the server after cloning the repo.
#
# Assumes:
#   - Node.js 20+ is installed (via Plesk Node.js extension or nvm)
#   - MySQL is running and a database/user already exist (Plesk MySQL)
#   - Git is installed and repo is cloned to APP_DIR
#   - .env file exists at APP_DIR (copy from .env.example and fill in secrets)
#   - .env values use KEY="value" format with no inline comments after values
#
# Usage:
#   ssh user@avolo.app
#   cd /var/www/vhosts/avolo.app/httpdocs
#   cp .env.example .env         # then edit .env with production values
#   chmod +x deployment_first.sh
#   ./deployment_first.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
APP_DIR="/var/www/vhosts/avolo.app/httpdocs"
APP_NAME="avolo"
NODE_BIN="/opt/plesk/node/22/bin/node"
PM2_BIN="/opt/plesk/node/22/bin/pm2"
NODE_MIN_VERSION=20

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m==>\033[0m $*"; }
ok()    { echo -e "\033[1;32m  ✓\033[0m $*"; }
warn()  { echo -e "\033[1;33m  !\033[0m $*"; }
die()   { echo -e "\033[1;31mERROR:\033[0m $*" >&2; exit 1; }

# load_env <file> — safely export KEY=VALUE pairs without bash-executing the file.
# Handles: quoted values, unquoted values, URL-encoded chars (%, #), optional
# 'export' prefix. Skips blank lines and lines starting with #.
load_env() {
  local file="${1:-.env}"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"         # strip leading whitespace
    [[ -z "$line" || "$line" == \#* ]] && continue  # skip blank / comment lines
    line="${line#export }"                            # strip optional 'export '
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    local key="${BASH_REMATCH[1]}"
    local val="${BASH_REMATCH[2]}"
    # Strip leading and trailing whitespace/tabs from value
    val="${val#"${val%%[![:space:]]*}"}"
    val="${val%"${val##*[![:space:]]}"}"
    # Strip surrounding double or single quotes
    if   [[ "$val" =~ ^\"(.*)\"$ ]]; then val="${BASH_REMATCH[1]}"
    elif [[ "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"
    fi
    export "$key=$val"
  done < "$file"
}

# ── Pre-flight checks ─────────────────────────────────────────────────────────
info "[pre-flight] Checking environment"

NODE_VERSION=$(node -e "console.log(process.version.slice(1).split('.')[0])" 2>/dev/null) \
  || die "Node.js not found. Install Node.js $NODE_MIN_VERSION+ first."
if [ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]; then
  die "Node.js $NODE_VERSION found but $NODE_MIN_VERSION+ required."
fi
ok "Node.js $(node -v)"

npm --version > /dev/null 2>&1 || die "npm not found."
ok "npm $(npm -v)"

if [ ! -d "$APP_DIR" ]; then
  die "App directory $APP_DIR does not exist. Clone the repo first:
  git clone https://github.com/wurkagency/avolo.git $APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  die ".env file not found. Copy .env.example and fill in production values:
  cp .env.example .env && nano .env"
fi
ok ".env found"

# Verify essential env vars are set (not just example placeholders)
for VAR in DATABASE_URL AUTH_SECRET AUTH_URL; do
  VAL=$(grep -E "^${VAR}=" .env | cut -d= -f2- | tr -d '"' || true)
  if [ -z "$VAL" ] || echo "$VAL" | grep -qE "generate-with|password@localhost"; then
    warn "$VAR in .env looks like a placeholder — verify it is set to a real value."
  fi
done

# APP_ROOT must point to the standalone dir so avatar uploads land where
# Next.js standalone can serve them (process.cwd() is the PM2 launch dir, not standalone/).
APP_ROOT_VAL=$(grep -E "^APP_ROOT=" .env | cut -d= -f2- | tr -d '"' || true)
if [ -z "$APP_ROOT_VAL" ]; then
  warn "APP_ROOT not set in .env — profile image uploads will be broken in production."
  warn "Add: APP_ROOT=\"$APP_DIR/.next/standalone\""
fi

# ── Install PM2 if missing ────────────────────────────────────────────────────
if ! command -v pm2 &> /dev/null; then
  info "[0/8] Installing PM2 globally"
  npm install -g pm2
  ok "PM2 installed: $(pm2 -v)"
else
  ok "PM2 $(pm2 -v) already installed"
fi

# ── Step 1: Dependencies ──────────────────────────────────────────────────────
info "[1/8] Installing Node.js dependencies"
npm ci --prefer-offline
ok "Dependencies installed"

# ── Step 2: Prisma client ─────────────────────────────────────────────────────
info "[2/8] Generating Prisma client"
npx prisma generate
ok "Prisma client generated"

# ── Step 3: Database ──────────────────────────────────────────────────────────
info "[3/8] Applying database schema"
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  # Migrations exist — apply them idempotently
  npx prisma migrate deploy
  ok "Migrations applied"
else
  # No migrations yet — push schema directly (bootstrapping)
  warn "No prisma/migrations found — running db push to create schema."
  warn "Run 'npx prisma migrate dev --name init' locally and commit migrations/ before the next deploy."
  npx prisma db push --accept-data-loss
  ok "Schema pushed (no migrations)"
fi

# ── Step 4: Seed airports ─────────────────────────────────────────────────────
info "[4/8] Seeding airport data"
if [ -f "source/airports.csv" ] && [ -f "db/seed.ts" ]; then
  # Hard fail on seed error during first deploy — partial seed = broken airport search.
  npm run db:seed
  ok "Airport data seeded"
else
  warn "source/airports.csv or db/seed.ts not found — skipping seed."
fi

# ── Step 5: Build ─────────────────────────────────────────────────────────────
info "[5/8] Building Next.js (standalone)"
NODE_ENV=production npm run build
ok "Build complete"

# ── Step 6: Copy static assets into standalone output ────────────────────────
info "[6/8] Copying static assets into standalone output"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static   .next/standalone/.next/static
cp -r public          .next/standalone/public
mkdir -p .next/standalone/public/avatars
ok "Static assets copied"

# Create a _next/static symlink at the webroot so Nginx can serve CSS/JS
# directly without proxying to Node.js (required when Plesk does try_files).
mkdir -p _next
ln -sfn ../.next/standalone/.next/static _next/static
ok "_next/static symlink created"

# Fix ownership — build runs as root but Nginx serves files as avolo.app.
# Without this, /_next/static/ returns 403 due to disable_symlinks if_not_owner.
chown -R avolo.app:psacln .next/ _next/
ok "Ownership fixed (avolo.app:psacln)"

# ── Step 7: Start application with PM2 ───────────────────────────────────────
info "[7/8] Starting application with PM2"

# Load .env safely — exports all vars so the PM2 child process inherits them.
load_env .env

# PORT and HOSTNAME are read from process.env by Next.js standalone — not CLI args.
PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"

# Stop any existing process with this name before starting fresh
"$NODE_BIN" "$PM2_BIN" delete "$APP_NAME" 2>/dev/null || true

"$NODE_BIN" "$PM2_BIN" start .next/standalone/server.js \
  --name "$APP_NAME" \
  --interpreter "$NODE_BIN"

"$NODE_BIN" "$PM2_BIN" save
ok "Application started (PM2 process: $APP_NAME, port: $PORT)"

# ── Step 8: Persist PM2 across reboots ───────────────────────────────────────
info "[8/8] Configuring PM2 startup"
STARTUP_CMD=$("$NODE_BIN" "$PM2_BIN" startup | grep "sudo env" || true)
if [ -n "$STARTUP_CMD" ]; then
  echo ""
  echo "  Run this command as root to enable PM2 auto-start on reboot:"
  echo "  $STARTUP_CMD"
else
  pm2 startup
fi
echo ""

ok "First-time deployment complete!"
echo ""
echo "  App:      https://avolo.app"
echo "  Status:   pm2 status"
echo "  Logs:     pm2 logs $APP_NAME"
echo "  Restart:  pm2 restart $APP_NAME --update-env"
echo ""
echo "Next steps:"
echo "  1. Run the 'sudo env ...' startup command above as root"
echo "  2. In Plesk: configure Nginx to reverse-proxy :80/:443 → localhost:$PORT"
echo "  3. Enable SSL via Plesk Let's Encrypt"
echo "  4. Set up Plesk cron: POST https://avolo.app/api/cron -H 'x-cron-secret: \$CRON_SECRET'"
echo "  5. Create admin user: ADMIN_EMAIL=you@avolo.app ADMIN_PASSWORD=... npx ts-node scripts/seed-admin.ts"
