# ── Database ───────────────────────────────────────────────────────────────────
DATABASE_URL="mysql://<db-user>:<db-password>@localhost:3306/avolo_travel"

# ── NextAuth ───────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET="<generate-with: openssl rand -base64 32>"
NEXTAUTH_URL="https://www.avolo.app"
# SITE_URL: canonical public URL used in robots.txt and sitemap.xml.
# Set this explicitly so they never contain http://localhost:3000.
SITE_URL="https://www.avolo.app"

# ── OAuth Providers ────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_TENANT_ID="common"

# ── AI Providers ───────────────────────────────────────────────────────────────
GROQ_API_KEY="<your-groq-api-key>"
GEMINI_API_KEY="<your-gemini-api-key>"
NVIDIA_API_KEY=""

# ── Travel APIs ────────────────────────────────────────────────────────────────
TRAVELPAYOUTS_API_KEY="<your-travelpayouts-api-key>"
TRAVELPAYOUTS_MARKER="<your-marker-id>"
DUFFEL_ACCESS_TOKEN="<your-duffel-access-token>"
AMADEUS_CLIENT_ID=""
AMADEUS_CLIENT_SECRET=""
AMADEUS_ENABLED="false"

# ── Email (Nodemailer) ─────────────────────────────────────────────────────────
SMTP_HOST="<your-smtp-host>"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="<your-smtp-user>"
SMTP_PASS="<your-smtp-password>"
SMTP_FROM="noreply@avolo.app"

# ── Currency ───────────────────────────────────────────────────────────────────
# Optional: set to use currencyapi.com instead of the free Frankfurter API.
CURRENCY_API_KEY="<your-currency-api-key>"

# ── Translations ───────────────────────────────────────────────────────────────
# Optional: enables server-side translation via Google Translate.
GOOGLE_TRANSLATE_API_KEY="<your-google-translate-api-key>"

# ── Cron ───────────────────────────────────────────────────────────────────────
CRON_SECRET="<generate-with: openssl rand -hex 32>"
