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
NODE_MIN_VERSION=20

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m==>\033[0m $*"; }
ok()    { echo -e "\033[1;32m  ✓\033[0m $*"; }
warn()  { echo -e "\033[1;33m  !\033[0m $*"; }
die()   { echo -e "\033[1;31mERROR:\033[0m $*" >&2; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
info "[pre-flight] Checking environment"

NODE_VERSION=$(node -e "console.log(process.version.slice(1).split('.')[0])" 2>/dev/null) || die "Node.js not found. Install Node.js $NODE_MIN_VERSION+ first."
if [ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]; then
  die "Node.js $NODE_VERSION found but $NODE_MIN_VERSION+ required."
fi
ok "Node.js v$(node -v | tr -d 'v') ($(which node))"

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
  npm run db:seed && ok "Airport data seeded" || warn "Seed failed or skipped — continuing."
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
cp -r .next/static  .next/standalone/.next/static
cp -r public         .next/standalone/public
ok "Static assets copied"

# ── Step 7: Start application with PM2 ───────────────────────────────────────
info "[7/8] Starting application with PM2"

# Export env vars from .env so PM2 picks them up
set -a; source .env; set +a

# Stop any existing process with this name
pm2 delete "$APP_NAME" 2>/dev/null || true

PORT=${PORT:-3000}
HOSTNAME=${HOSTNAME:-0.0.0.0}

pm2 start .next/standalone/server.js \
  --name "$APP_NAME" \
  --interpreter node \
  --env production \
  -- --port "$PORT" --hostname "$HOSTNAME"

pm2 save
ok "Application started on port $PORT (PM2 process: $APP_NAME)"

# ── Step 8: Persist PM2 across reboots ───────────────────────────────────────
info "[8/8] Configuring PM2 startup"
pm2 startup | tail -1
echo ""
warn "IMPORTANT: Copy the 'sudo env ...' command above and run it as root to enable PM2 auto-start on reboot."
echo ""

ok "First-time deployment complete!"
echo ""
echo "  App:      https://avolo.app"
echo "  Status:   pm2 status"
echo "  Logs:     pm2 logs $APP_NAME"
echo "  Restart:  pm2 restart $APP_NAME --update-env"
echo ""
echo "Next steps:"
echo "  1. In Plesk: set the Node.js app document root to $APP_DIR"
echo "     and configure Nginx to proxy :80/:443 → localhost:$PORT"
echo "  2. Enable SSL via Plesk Let's Encrypt (free certificate)"
echo "  3. Set up Plesk cron: POST https://avolo.app/api/cron -H 'x-cron-secret: \$CRON_SECRET'"
