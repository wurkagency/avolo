# CLAUDE_PLAN.md — Avolo AI Travel Planner

> Master development guide for Claude Code.
> Every implementation decision flows from this document.
> When ambiguity exists, this file is the authority.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [Mandatory Claude Code Workflow](#4-mandatory-claude-code-workflow)
5. [Project Directory Structure](#5-project-directory-structure)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema](#7-database-schema)
8. [Critical Architectural Rules](#8-critical-architectural-rules)
9. [Development Phases](#9-development-phases)
10. [AI Prompt Reference](#10-ai-prompt-reference)
11. [Airport Data](#11-airport-data)

---

## 1. Project Overview

**Name**: Avolo  
**Tagline**: AI-first, dialogue-based travel planning  
**URL**: https://www.avolo.app  
**Repo**: https://github.com/wurkagency/avolo/  
**Local dev**: http://localhost:3000  
**Status at plan creation**: Greenfield — no application code exists. Only design specs and AI prompt templates are present in `/source/`.

**What Avolo does**: Users describe a trip in natural language or via a guided Typeform-style wizard. The system searches flights, hotels, cars, and excursions across multiple provider APIs in parallel, uses AI to rank and annotate results, and presents three curated options per category. Trips are persisted anonymously by cookie and merged to a user account on login.

**Name origin**: "Avolo" means "To fly away" in Latin.

**Primary design philosophy sources**:
- [tasteskill.dev](https://www.tasteskill.dev) — layout discipline, anti-generic patterns, design system documentation
- [impeccable.style](https://impeccable.style) — 29 deterministic anti-pattern rules, Product Mode (design serves usability)
- [emilkowalski/skill](https://github.com/emilkowalski/skill) — animation polish, micro-interactions, invisible UI detail

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | TypeScript strict mode throughout |
| Styling | Tailwind CSS | Config mirrors `/source/datepicker.html` tokens |
| State | Zustand | One store per domain (trip, ui, user) |
| Data fetching | TanStack Query (React Query v5) | All client-side async |
| ORM | Prisma | MySQL/MariaDB target |
| Database | MySQL/MariaDB | Docker locally, Plesk production |
| Auth | NextAuth.js v5 | App Router compatible |
| AI | Groq → Gemini → Nvidia | Sequential failover only, never parallel |
| Travel APIs | TravelPayouts → Duffel → Amadeus | Amadeus off by default via env flag |
| Email | Nodemailer | SMTP via father.wurk.dk |
| Currency | currencyapi.com | Store EUR, convert at render |
| Streaming | Native SSE (GET /api/search/stream) | EventSource on client |
| Deployment | Plesk Obsidian, Ubuntu, Node.js | PM2 or standalone server.js |

---

## 3. Design System

### Colour Tokens

```
primary:                 #843ca1
surface:                 #f9f9f7
background:              #f9f9f7
on-background:           #1a1c1b
on-surface:              #1a1c1b
on-surface-variant:      #4e4350
on-primary:              #ffffff
primary-container:       #9f55bc
primary-fixed:           #f9d8ff
primary-fixed-dim:       #edb1ff
inverse-primary:         #edb1ff
surface-variant:         #e2e3e1
surface-container:       #eeeeec
surface-container-low:   #f4f4f2
surface-container-high:  #e8e8e6
surface-container-highest:#e2e3e1
surface-dim:             #dadad8
surface-bright:          #f9f9f7
outline:                 #807381
outline-variant:         #d1c2d1
secondary:               #69596b
secondary-container:     #efd9ee
error:                   #ba1a1a
error-container:         #ffdad6
inverse-surface:         #2f3130
inverse-on-surface:      #f1f1ef
```

### Spacing & Layout

```
unit:              8px
stack-gap:         24px
section-padding:   120px
container-max:     720px
gutter:            32px
```

All page content must be centred within `max-w-[720px] mx-auto`. Never exceed this width.

### Typography

| Token | Font | Size | Line Height | Weight | Letter Spacing |
|---|---|---|---|---|---|
| headline-lg | Manrope | 48px | 1.1 | 400 | -0.02em |
| headline-md | Manrope | 32px | 1.2 | 500 | -0.01em |
| body-lg | Inter | 20px | 1.6 | 400 | — |
| body-md | Inter | 16px | 1.5 | 400 | — |
| label-caps | Inter | 12px | 1.2 | 600 | 0.1em |

Google Fonts load order: Manrope (400, 500, 700) then Inter (400, 600). Load in `app/layout.tsx` via `next/font/google`.

### Border Radius

```
DEFAULT: 0.25rem (4px)
lg:      0.5rem  (8px)
xl:      0.75rem (12px)
full:    9999px
```

### Anti-Pattern Rules (impeccable.style — mandatory)

1. No generic hero images with stock-photo couples
2. No decorative gradients that serve no functional purpose
3. No shadow overuse — use surface colour changes to create depth
4. No centre-aligned body text beyond a single sentence
5. No placeholder text ("Lorem ipsum") in shipped code
6. No more than two typefaces
7. No colour used for decoration alone — every colour must communicate
8. Navigation labels must be actual page names, not marketing words
9. Error states must explain what happened and what to do next
10. Empty states must be purposeful — not just "No results found"

### Emil Kowalski UI Principles

- Animation exists to communicate state change, not to impress
- Micro-interactions (hover, focus, press) must be instant — no delay before feedback
- Transitions between steps use `transform: translateY` — no layout-triggering properties
- Spring physics over linear easing for elements that "feel" physical
- Every interactive element must have a visible focus ring (accessibility + polish)

### Icons

Icon library: Material Symbols Outlined. Load via Google Fonts CDN in `app/layout.tsx`. Pattern: `<span className="material-symbols-outlined">icon_name</span>`. Do not import an icon component library.

---

## 4. Mandatory Claude Code Workflow

Every feature follows this exact cycle. Do not skip steps.

```
/plan    → Break the feature into minimal numbered steps before writing any code.
           Identify files to create, files to modify, data shapes, and edge cases.

/build   → Generate production-quality code for the planned steps.
           TypeScript strict. No `any`. No disabled lint rules without comment.

/review  → Read every file just written. Identify bugs, missing error handling,
           accessibility gaps, and design system violations.

/fix     → Apply only the fixes identified in /review. Minimal diff.

/optimize → Reduce bundle size, eliminate redundant re-renders, simplify logic.
            Profile before and after when relevant.
```

**Rules**:
- Never run `/build` without a preceding `/plan` for that feature
- Never run `/optimize` on code that has not passed `/review` + `/fix`
- `/review` is not optional — treat it as blocking

---

## 5. Project Directory Structure

```
/app
  layout.tsx                    ← Root layout: fonts, providers, nav
  page.tsx                      ← Home: hero + departure/destination fields
  globals.css                   ← Tailwind directives + base body styles
  /explore
    layout.tsx                  ← Explore shell with step progress indicator
    page.tsx                    ← Step 1: destination confirmation (skip from home)
    /services/page.tsx          ← Step 2: service selection checkboxes
    /dates/page.tsx             ← Step 3: date picker
    /travelers/page.tsx         ← Step 4: traveler counts + child ages
    /luggage/page.tsx           ← Step 5: luggage options
  /results
    page.tsx                    ← Results grid (SSE consumer)
    /flights/page.tsx           ← Paginated flights with sidebar filters
    /hotels/page.tsx            ← Paginated hotels with sidebar filters
    /cars/page.tsx              ← Paginated cars with sidebar filters
    /excursions/page.tsx        ← Paginated excursions with sidebar filters
  /trip
    /[id]/page.tsx              ← Trip summary/detail
  /trips
    page.tsx                    ← My Trips list
  /profile
    /settings/page.tsx          ← Name, email, currency, language, GDPR
    /preferences/page.tsx       ← Flight/hotel/car/excursion prefs
    /notifications/page.tsx     ← Alert settings
  /journal
    page.tsx                    ← Travel journal index
    /[slug]/page.tsx            ← AI-generated destination article
  /admin
    layout.tsx                  ← Admin shell (auth guard: admin role)
    page.tsx                    ← Dashboard overview
    /demographics/page.tsx
    /searches/page.tsx
  /api
    /auth/[...nextauth]/route.ts
    /search-trip/route.ts       ← POST: validate + initiate search, return tripId
    /search/stream/route.ts     ← GET: SSE endpoint
    /trips/route.ts             ← GET list, POST create
    /trips/[id]/route.ts        ← GET, PATCH, DELETE
    /trips/[id]/refresh/route.ts← POST: re-fetch prices
    /trips/[id]/results/route.ts← GET: paginated cached results for category page
    /airports/route.ts          ← GET: autocomplete (?q=)
    /currency/route.ts          ← GET: exchange rates (cached 1h)
    /journal/route.ts           ← GET: journal article list
    /journal/[slug]/route.ts    ← GET: single article (generate on-demand)
    /admin/stats/route.ts       ← GET: admin metrics (ADMIN role required)
    /cron/refresh/route.ts      ← POST: price staleness check (CRON_SECRET)
    /profile/route.ts           ← GET + PATCH user profile
    /profile/preferences/route.ts
    /profile/notifications/route.ts
    /profile/export/route.ts    ← POST: GDPR data export
  /(auth)
    /login/page.tsx
    /verify/page.tsx            ← "Check your email" screen

/components
  /ui
    Button.tsx                  ← variant: primary | secondary | ghost | destructive
    Input.tsx
    Select.tsx
    Checkbox.tsx
    Badge.tsx
    Card.tsx
    Modal.tsx
    Spinner.tsx
    ProgressBar.tsx
    Avatar.tsx
    Toast.tsx
    Skeleton.tsx
  /explore
    StepWrapper.tsx             ← Typeform-style step shell (full-screen, centred)
    ServiceCheckbox.tsx
    DatePicker.tsx              ← Based on /source/datepicker.html spec
    TravelerCounter.tsx
    LuggageSelector.tsx
    AutocompleteInput.tsx       ← Airport search with 200ms debounce
    MicButton.tsx               ← Microphone trigger (Web Speech API)
  /results
    ResultsGrid.tsx
    CategorySection.tsx
    FlightCard.tsx
    HotelCard.tsx
    CarCard.tsx
    ExcursionCard.tsx
    SeeMoreButton.tsx
    FilterSidebar.tsx
    SSEStatus.tsx               ← Loading/streaming state indicator
  /trips
    TripCard.tsx
    RefreshPricesButton.tsx
    EmptyTrips.tsx
  /nav
    TopBar.tsx
    MobileMenu.tsx
  /journal
    ArticleCard.tsx
    ArticleBody.tsx             ← react-markdown renderer

/lib
  /state
    tripStore.ts                ← Zustand: current trip being planned
    uiStore.ts                  ← Zustand: loading, modals, toasts
    userStore.ts                ← Zustand: auth user, currency pref
  /api
    searchClient.ts             ← POST /api/search-trip
    streamClient.ts             ← EventSource wrapper hook (useSSEStream)
    tripsClient.ts
    airportsClient.ts
    currencyClient.ts
  /ai
    flightPrompt.ts             ← Builds prompt from prompt_flight_pricing.md
    hotelPrompt.ts
    carPrompt.ts
    excursionPrompt.ts
    aiClient.ts                 ← Groq → Gemini → Nvidia sequential failover
  /server
    auth.ts                     ← NextAuth v5 config export
    db.ts                       ← Prisma client singleton
    session.ts                  ← sessionId cookie helpers
    currency.ts                 ← currencyapi.com server-side fetch + cache
  /utils
    formatPrice.ts              ← EUR → display currency
    formatDate.ts
    cn.ts                       ← clsx + tailwind-merge
    airportSearch.ts            ← In-memory search against airports.csv
    riskLabel.ts                ← Risk detector (non-refundable, tight transfer)

/server
  /services
    searchService.ts            ← Orchestrates provider calls + AI ranking
    tripService.ts              ← CRUD for trips
    journalService.ts           ← AI article generation
    sessionService.ts           ← Anonymous session management
    mergeService.ts             ← Merge anonymous → authenticated trips
  /providers
    /flights
      travelPayoutsProvider.ts
      duffelProvider.ts
      amadeusProvider.ts        ← Disabled unless AMADEUS_ENABLED=true
      flightNormalizer.ts       ← Unified FlightResult → NormalizedResult
    /hotels
      travelPayoutsHotelProvider.ts
      hotelNormalizer.ts
    /cars
      travelPayoutsCarProvider.ts
      carNormalizer.ts
    /excursions
      excursionProvider.ts
      excursionNormalizer.ts

/db
  schema.prisma                 ← Prisma schema (MySQL)
  schema.sql                    ← Raw MySQL DDL (kept in sync, for Plesk import)
  seed.ts                       ← Seed airports table from source/airports.csv

/source                         ← Read-only reference material
  /guidelines
    PLAN.md
    SITEMAP.md
    SPECIFICATION.md
    ENV.md
    CLAUDE_PLAN.md              ← This file
  /prompts
    prompt_flight_pricing.md
    prompt_hotel_pricing.md
    prompt_car_rental_pricing.md
    prompt_excursion_booking.md
  airports.csv                  ← Airport master data (~70k rows, OurAirports format)
  datepicker.html               ← UI prototype (pixel-accurate spec)
  avolo_logo.svg
  Credentials.md

/public
  favicon.ico
  og-image.png

middleware.ts                   ← Anonymous session cookie + route protection
.env.local                      ← Never committed
.env.example                    ← Committed template
docker-compose.yml
tailwind.config.ts
next.config.ts
prisma/schema.prisma
tsconfig.json
```

---

## 6. Environment Variables

Copy `.env.example` to `.env.local` for local development. Production variables are set in Plesk environment panel.

```env
# Database
DATABASE_URL="mysql://avolo_user:password@localhost:3306/avolo"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"   # override to https://www.avolo.app in production
SITE_URL="https://www.avolo.app"       # always production URL (used in robots.txt, sitemap)

# OAuth — Google configured, Facebook + Microsoft placeholders
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_TENANT_ID="common"

# AI providers — sequential failover (Groq primary)
GROQ_API_KEY=""
GEMINI_API_KEY=""
NVIDIA_API_KEY=""

# Travel APIs
TRAVELPAYOUTS_API_KEY=""
TRAVELPAYOUTS_MARKER=""
DUFFEL_ACCESS_TOKEN=""
AMADEUS_CLIENT_ID=""
AMADEUS_CLIENT_SECRET=""
AMADEUS_ENABLED="false"     # Set "true" only to explicitly enable Amadeus

# Email (Nodemailer)
SMTP_HOST="father.wurk.dk"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@avolo.app"

# Currency
CURRENCY_API_KEY=""          # currencyapi.com

# Translation
GOOGLE_TRANSLATE_API_KEY=""  # Google Translate API (auto-translate for DE/DA/SV/NO)

# Cron security
CRON_SECRET=""               # Bearer token for POST /api/cron/refresh
```

### Local Docker MySQL

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: avolo
      MYSQL_USER: avolo_user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - avolo_mysql:/var/lib/mysql
volumes:
  avolo_mysql:
```

**Start**: `docker-compose up -d`  
**Apply schema**: `npx prisma db push`  
**Seed airports**: `npx ts-node db/seed.ts`

---

## 7. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // bcrypt hash; null for OAuth-only users
  role          Role      @default(USER)
  currency      Currency  @default(EUR)
  language      Language  @default(EN)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  trips         Trip[]
  preferences   Preferences?
  notifications NotificationSettings?

  @@map("users")
}

enum Role {
  USER
  ADMIN
}

enum Currency {
  EUR
  USD
  GBP
  DKK
  SEK
  NOK
}

enum Language {
  EN
  DE
  DA
  SV
  NO
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// Anonymous session (httpOnly cookie)
model AnonymousSession {
  id        String   @id @default(cuid())  // = cookie value (avolo_sid)
  createdAt DateTime @default(now())
  expiresAt DateTime
  trips     Trip[]

  @@map("anonymous_sessions")
}

model Trip {
  id                 String      @id @default(cuid())
  userId             String?
  anonymousSessionId String?
  departure          String      // IATA code
  destination        String      // IATA code
  departureName      String
  destinationName    String
  departureDate      DateTime
  returnDate         DateTime?
  isOneWay           Boolean     @default(false)
  flexibility        Flexibility @default(EXACT)
  adults             Int         @default(1)
  children           Json        // int[] — ages of each child
  hasDisability      Boolean     @default(false)
  handLuggage        Int         @default(1)
  checkedLuggage     Int         @default(0)
  specialLuggage     Boolean     @default(false)
  totalPriceEur      Float?
  status             TripStatus  @default(DRAFT)
  lastRefreshedAt    DateTime?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  user              User?             @relation(fields: [userId], references: [id])
  anonymousSession  AnonymousSession? @relation(fields: [anonymousSessionId], references: [id])
  services          TripService[]
  results           CachedResult[]
  searches          Search[]

  @@index([userId])
  @@index([anonymousSessionId])
  @@map("trips")
}

enum TripStatus {
  DRAFT
  SEARCHING
  COMPLETE
  STALE
}

enum Flexibility {
  EXACT
  PLUS_MINUS_1
  PLUS_MINUS_3
  PLUS_MINUS_7
}

model TripService {
  id     String      @id @default(cuid())
  tripId String
  type   ServiceType
  trip   Trip        @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@map("trip_services")
}

enum ServiceType {
  FLIGHT
  HOTEL
  CAR
  EXCURSION
}

model CachedResult {
  id              String      @id @default(cuid())
  tripId          String
  serviceType     ServiceType
  provider        String
  rawData         Json
  normalizedData  Json
  priceEur        Float
  rank            Int
  riskLevel       RiskLevel
  riskReasons     Json        // string[]
  isRefundable    Boolean     @default(true)
  deepLinkUrl     String      @db.Text
  fetchedAt       DateTime    @default(now())
  expiresAt       DateTime

  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@index([tripId, serviceType])
  @@map("cached_results")
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}

model Search {
  id         String   @id @default(cuid())
  tripId     String
  query      Json
  providers  Json     // string[] providers called
  durationMs Int
  success    Boolean
  errorLog   Json?
  createdAt  DateTime @default(now())

  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@map("searches")
}

model Preferences {
  id     String @id @default(cuid())
  userId String @unique

  // Flight
  preferredAirports Json   // string[] IATA codes
  maxStops          Int    @default(2)
  travelType        String @default("any")    // direct | one-stop | multi | any
  cabin             String @default("economy")
  preferredAirlines Json   // string[]
  flightStyle       String @default("cheapest") // cheapest | fastest | balanced

  // Hotel
  hotelType         String @default("any")    // budget | boutique | luxury | any
  hotelLocation     String @default("any")    // central | transit | any

  // Car
  carType           String @default("economy") // economy | compact | suv | any
  carInsurance      String @default("basic")   // basic | full | credit-card
  carPickupType     String @default("any")     // airport | city | any

  // Excursion
  excursionStyle    Json   // string[] e.g. ["culture","food","nature"]
  excursionBudget   String @default("medium")  // budget | medium | premium

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("preferences")
}

model NotificationSettings {
  id              String  @id @default(cuid())
  userId          String  @unique
  priceDropAlerts Boolean @default(true)
  tripUpdates     Boolean @default(true)
  systemEmails    Boolean @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_settings")
}

model Airport {
  id               Int     @id
  ident            String  @unique
  type             String
  name             String
  latitude         Float
  longitude        Float
  country          String
  region           String
  municipality     String?
  iataCode         String?
  scheduledService Boolean @default(false)

  @@index([iataCode])
  @@index([municipality])
  @@map("airports")
}

model JournalArticle {
  id          String   @id @default(cuid())
  slug        String   @unique
  destination String
  iataCode    String
  title       String
  body        String   @db.LongText
  aiModel     String
  generatedAt DateTime @default(now())
  publishedAt DateTime?

  @@index([iataCode])
  @@map("journal_articles")
}
```

---

## 8. Critical Architectural Rules

These rules encode decisions made before code was written. They are non-negotiable.

### 8.1 AI Provider Failover

**Order**: Groq → Gemini → Nvidia

- Sequential `try/catch` only. Never call providers in parallel.
- If Groq succeeds: use it, return immediately.
- If Groq throws: catch, log the error, try Gemini.
- If Gemini throws: catch, log the error, try Nvidia.
- If all three fail: return a structured error; do not crash the SSE stream.

```typescript
// lib/ai/aiClient.ts — canonical pattern
export async function callAI(prompt: string): Promise<string> {
  const providers = [
    () => callGroq(prompt),
    () => callGemini(prompt),
    () => callNvidia(prompt),
  ];
  for (const provider of providers) {
    try {
      return await provider();
    } catch (err) {
      console.error('[AI failover]', err);
    }
  }
  throw new Error('All AI providers failed');
}
```

### 8.2 Travel API Failover

**Order**: TravelPayouts → Duffel → Amadeus (disabled by default)

- Amadeus is only called when `process.env.AMADEUS_ENABLED === 'true'`.
- The four service categories (flights, hotels, cars, excursions) run in parallel via `Promise.allSettled`.
- Within each category the provider chain is sequential.
- All provider responses are normalized to `NormalizedResult` before ranking.

```typescript
// server/services/searchService.ts — canonical pattern
const [flightsResult, hotelsResult, carsResult, excursionsResult] =
  await Promise.allSettled([
    fetchFlights(trip),   // TravelPayouts → Duffel → Amadeus?
    fetchHotels(trip),    // TravelPayouts only
    fetchCars(trip),      // TravelPayouts only
    fetchExcursions(trip),// TravelPayouts only
  ]);
```

### 8.3 SSE Streaming

- Endpoint: `GET /api/search/stream?tripId=<id>`
- Uses Next.js App Router `ReadableStream` response with `text/event-stream`.
- Client uses native `EventSource` (not a library).

**SSE event protocol**:
```
data: {"event":"status","message":"Searching for flights..."}

data: {"event":"category","type":"FLIGHT","results":[...NormalizedResult[]]}

data: {"event":"category","type":"HOTEL","results":[...]}

data: {"event":"category","type":"CAR","results":[...]}

data: {"event":"category","type":"EXCURSION","results":[...]}

data: {"event":"done"}
```

- Each `category` event contains all results for that type (not just top 3). Slot assignment happens client-side.
- Always emit `event: done` before closing, even on failure.
- Cache results in `CachedResult` table as they arrive.

### 8.4 Currency

- **Always store prices as EUR** (`Float`) in the database.
- **Never store display currency** in the database.
- Convert at display using the `useCurrency` hook, which reads `userStore.currency`.
- Exchange rates from currencyapi.com, cached server-side 1 hour.
- `GET /api/currency` responds with `Cache-Control: max-age=3600`.

### 8.5 Anonymous Session Persistence

- On first visit (no auth): generate `cuid()`, set as `httpOnly; SameSite=Lax; Path=/` cookie named `avolo_sid`, expiring 30 days.
- All trip writes associate `anonymousSessionId` when `userId` is null.
- On login/signup: call `mergeService.mergeAnonymousToUser(sessionId, userId)` — reassigns all anonymous trips to the authenticated user, deletes the `AnonymousSession` record.
- After merge: invalidate `avolo_sid` cookie by setting `maxAge=0`.
- Never expose `avolo_sid` to client JavaScript.

### 8.6 Price Refresh

- Prices are **never automatically refreshed**.
- "Refresh prices" button on `TripCard` calls `POST /api/trips/[id]/refresh`.
- Server re-runs the provider chain for the trip's selected services.
- Updates `CachedResult` rows (upsert on `tripId + serviceType + provider`) and `Trip.lastRefreshedAt`.
- Button shows spinner during refresh and is disabled to prevent double-submit.
- Client invalidates the trip query via TanStack Query on completion.

### 8.7 Search Results Slot Assignment

Results per category on the results page:

| Category | Slots |
|---|---|
| Flights | Best value / Cheapest / Shortest travel time |
| Hotels | Best value / Cheapest / Best rating / Most central |
| Cars | Best value / Cheapest / Closest pickup / Best covered |
| Excursions | Best experience / Must-see / Hidden gem / Best budget |

"See more results" links to paginated category pages with sidebar filters.

### 8.8 TypeScript Rules

- `strict: true` in `tsconfig.json` — no exceptions.
- No `any`. Use `unknown` and narrow with type guards.
- All API route handlers must type their `Request` and return typed `Response`.
- All Zustand stores must be typed with explicit interface definitions.
- Prisma generated types are the source of truth for DB shapes.

### 8.9 Error Handling

- API routes return `{ error: string; code: string }` on failure with appropriate HTTP status.
- Client errors surface via the Zustand `uiStore` toast queue, not `alert()` or bare `console.error`.
- SSE errors emit `event: error` with a JSON payload; the client displays a non-blocking toast.
- Unhandled promise rejections must be caught and logged; never swallowed silently.

### 8.10 Tailwind Config

The `tailwind.config.ts` must replicate the complete token set from `/source/datepicker.html`. No colour, spacing, or typography value is invented — they all come from that spec file.

---

## 9. Development Phases

Each phase begins with `/plan` and ends with `/optimize`. Tick each checkbox when complete.

---

### Phase 1: Foundation

**Goal**: Runnable Next.js project with correct tooling, design tokens, and database connection.

#### Files to Create

- `package.json`
- `tsconfig.json` — strict mode
- `next.config.ts` — image domains, env exposure
- `tailwind.config.ts` — full token set from `/source/datepicker.html`
- `app/layout.tsx` — root layout: Google Fonts (Manrope + Inter), Zustand providers, TanStack Query provider, TopBar
- `app/globals.css`
- `app/page.tsx` — Home hero (placeholder)
- `components/nav/TopBar.tsx`
- `components/nav/MobileMenu.tsx`
- `components/ui/Button.tsx` — variant: primary | secondary | ghost | destructive
- `components/ui/Input.tsx`
- `lib/utils/cn.ts` — clsx + tailwind-merge
- `lib/server/db.ts` — Prisma client singleton with global caching
- `prisma/schema.prisma`
- `db/schema.sql`
- `.env.example`
- `docker-compose.yml`
- `middleware.ts` — anonymous session cookie skeleton

#### Dependencies

```
next@14 react@18 react-dom@18 typescript
@types/node @types/react @types/react-dom
tailwindcss postcss autoprefixer
prisma @prisma/client
zustand @tanstack/react-query
clsx tailwind-merge
next-auth @auth/prisma-adapter
bcryptjs @types/bcryptjs
nodemailer @types/nodemailer
react-markdown remark-gfm
```

#### Key Decisions

- Use `next/font/google` — do not load fonts from `<link>` tags. Configure `Manrope` and `Inter` as CSS variables and apply via `tailwind.config.ts` `fontFamily`.
- Prisma client singleton: check `global.__prisma` before creating a new instance to avoid connection exhaustion in dev hot-reload.
- `cn()` is the only way to compose class names. Never raw string concatenation.

#### Verification

- [ ] `docker-compose up -d` starts MySQL; `npx prisma db push` applies schema without errors
- [ ] `npm run dev` serves at `localhost:3000` with correct fonts rendered
- [ ] TopBar shows correct brand colours (`primary: #843ca1`)
- [ ] Container is exactly 720px max-width, centred
- [ ] Tailwind `bg-primary` resolves to `#843ca1` in browser dev tools

---

### Phase 2: Authentication

**Goal**: NextAuth.js v5 with magic link email, Google OAuth, and anonymous session cookie.

#### Files to Create / Modify

- `lib/server/auth.ts` — NextAuth v5 config (providers, callbacks, adapter)
- `app/api/auth/[...nextauth]/route.ts` — re-export handlers
- `app/(auth)/login/page.tsx` — email magic link input + Google button
- `app/(auth)/verify/page.tsx` — "Check your email" screen
- `lib/server/session.ts` — `getOrCreateAnonymousSession(request, response)` helper
- `server/services/mergeService.ts` — `mergeAnonymousToUser(sessionId, userId)`
- `middleware.ts` — set anonymous session cookie; protect `/profile/*` and `/admin/*`

#### Key Decisions

- Use `@auth/prisma-adapter` for the NextAuth Prisma adapter.
- Magic link via Nodemailer, `SMTP_HOST=father.wurk.dk`, `SMTP_PORT=587`.
- Email template: plain HTML matching design system colours — no third-party email service.
- Google OAuth is active. Facebook and Microsoft OAuth providers are wired up but show a configuration error in the UI until their env vars are populated.
- The `signIn` callback in NextAuth calls `mergeService.mergeAnonymousToUser` using the `avolo_sid` cookie from the incoming request.
- Session strategy: `"database"` (not JWT) to support server-side session lookup.

#### Middleware Logic

```
1. Read avolo_sid cookie
2. If missing: generate cuid(), set httpOnly cookie, create AnonymousSession DB record
3. If /profile/* and unauthenticated: redirect to /login
4. If /admin/* and not role ADMIN: redirect to /
5. Pass through
```

#### Verification

- [ ] Magic link email arrives via father.wurk.dk SMTP
- [ ] Clicking link creates a `Session` DB row and redirects to `/explore`
- [ ] Google OAuth completes and creates `Account` + `User` DB rows
- [ ] `avolo_sid` cookie is `httpOnly` and not visible in `document.cookie`
- [ ] Visiting `/profile/settings` unauthenticated redirects to `/login`
- [ ] After login, anonymous trips appear in My Trips (merge working)

---

### Phase 3: Explore Wizard

**Goal**: 5-step Typeform-style search wizard + home page departure/destination fields.

#### Files to Create / Modify

- `app/page.tsx` — hero: "Let's Fly Away", departure + destination `AutocompleteInput`, microphone icon
- `app/explore/layout.tsx` — step shell: top progress bar (5 steps), back button
- `app/explore/page.tsx` — Step 1: confirm destination (skip when data comes from Home)
- `app/explore/services/page.tsx` — Step 2: service checkboxes + AI streaming confirmation
- `app/explore/dates/page.tsx` — Step 3: date picker (one-way/return toggle, flexibility select)
- `app/explore/travelers/page.tsx` — Step 4: adult counter, children with per-child age selects, disability flag
- `app/explore/luggage/page.tsx` — Step 5: hand luggage, checked luggage, special luggage checkbox
- `components/explore/StepWrapper.tsx`
- `components/explore/AutocompleteInput.tsx`
- `components/explore/MicButton.tsx`
- `components/explore/ServiceCheckbox.tsx`
- `components/explore/DatePicker.tsx`
- `components/explore/TravelerCounter.tsx`
- `components/explore/LuggageSelector.tsx`
- `lib/state/tripStore.ts`
- `lib/api/airportsClient.ts`
- `app/api/airports/route.ts` — GET `?q=` query param
- `db/seed.ts` — parse `source/airports.csv` and upsert into `airports` table

#### Typeform-Style UX Rules

- One question visible at a time. Full-screen vertical centering.
- Keyboard: Enter or Space advances; Escape goes back.
- Question headline: `text-headline-lg` (Manrope 48px).
- Sub-copy: `text-body-lg` (Inter 20px, `text-on-surface-variant`).
- Progress bar at top: `h-1 bg-primary` growing linearly across 5 steps.
- Transition between steps: slide-up enter, slide-down exit (`transform: translateY`, no animation library).
- Step does not auto-advance — user presses Enter or the Continue button explicitly.

#### Autocomplete Input

- Debounce: 200ms. Min characters: 2.
- Source: `GET /api/airports?q=` (searches Airport table).
- Dropdown: IATA code (bold) + city name + country.
- Keyboard navigable (arrow keys, Enter to select).
- On mobile: `inputMode="text"` + `autocomplete="off"`.

#### DatePicker

- Based on `/source/datepicker.html` prototype — pixel-accurate reproduction.
- Two calendar months side by side on desktop, stacked on mobile.
- One-way: single date. Return: range (departure purple, return lighter).
- Flexibility select below: Exact / ±1 day / ±3 days / ±7 days.
- Past dates disabled (grey, not clickable).

#### Zustand tripStore Shape

```typescript
interface TripState {
  departure: { iata: string; name: string } | null;
  destination: { iata: string; name: string } | null;
  services: ServiceType[];
  departureDate: string | null;       // ISO date string
  returnDate: string | null;
  isOneWay: boolean;
  flexibility: Flexibility;
  adults: number;
  children: number[];                 // array of ages
  hasDisability: boolean;
  handLuggage: number;
  checkedLuggage: number;
  specialLuggage: boolean;
  currentStep: number;
  // actions
  setDeparture: (v: TripState['departure']) => void;
  setDestination: (v: TripState['destination']) => void;
  toggleService: (s: ServiceType) => void;
  setDates: (dep: string, ret: string | null, oneWay: boolean) => void;
  setFlexibility: (f: Flexibility) => void;
  setTravelers: (adults: number, children: number[], disability: boolean) => void;
  setLuggage: (hand: number, checked: number, special: boolean) => void;
  reset: () => void;
}
```

#### Verification

- [ ] Typing 2+ characters in departure field shows dropdown within 300ms
- [ ] Selecting an airport populates the field and closes dropdown
- [ ] Pressing Enter on the home page navigates to `/explore/services`
- [ ] All 5 steps are reachable and back-navigable
- [ ] DatePicker shows current month, past dates disabled, range selection highlights correctly
- [ ] Adding a child creates an age select for that child
- [ ] Zustand store persists across steps (no data loss on back navigation)
- [ ] Step progress bar advances correctly

---

### Phase 4: Search Backend

**Goal**: `POST /api/search-trip`, `GET /api/search/stream` SSE endpoint, provider chain, AI ranking.

#### Files to Create / Modify

- `app/api/search-trip/route.ts`
- `app/api/search/stream/route.ts`
- `server/services/searchService.ts`
- `server/providers/flights/travelPayoutsProvider.ts`
- `server/providers/flights/duffelProvider.ts`
- `server/providers/flights/amadeusProvider.ts`
- `server/providers/flights/flightNormalizer.ts`
- `server/providers/hotels/travelPayoutsHotelProvider.ts`
- `server/providers/hotels/hotelNormalizer.ts`
- `server/providers/cars/travelPayoutsCarProvider.ts`
- `server/providers/cars/carNormalizer.ts`
- `server/providers/excursions/excursionProvider.ts`
- `server/providers/excursions/excursionNormalizer.ts`
- `lib/ai/aiClient.ts`
- `lib/ai/flightPrompt.ts`
- `lib/ai/hotelPrompt.ts`
- `lib/ai/carPrompt.ts`
- `lib/ai/excursionPrompt.ts`

#### NormalizedResult Interface

Every provider normalizer must output this exact shape. No provider-specific fields leak into the ranking layer.

```typescript
interface NormalizedResult {
  id: string;
  provider: string;
  serviceType: ServiceType;
  priceEur: number;
  title: string;
  subtitle: string;
  durationMinutes?: number;     // flights, excursions
  rating?: number;              // hotels, excursions
  distanceKm?: number;          // hotels (to centre), cars (to pickup)
  riskLevel: RiskLevel;
  riskReasons: string[];
  isRefundable: boolean;
  rawData: unknown;
  deepLinkUrl: string;
}
```

#### AI Integration Pattern

1. Raw results arrive from providers.
2. Build prompt using `lib/ai/flightPrompt.ts` (inject trip params + raw results).
3. Call `lib/ai/aiClient.ts`.
4. Parse AI response (structured JSON requested in prompt via "Respond only with valid JSON" instruction).
5. Merge AI annotations (risk explanations, ranking hints) back into `NormalizedResult`.
6. Sort by slot assignment.

Each `*Prompt.ts` file exports:
```typescript
export function buildFlightPrompt(trip: Trip, rawResults: NormalizedResult[]): string
```

#### Risk Detection (AI-independent fallbacks)

Even if AI fails, flag automatically:
- `isRefundable: false` → riskLevel at least MEDIUM
- Transfer time < 60 min → riskLevel HIGH, riskReasons: `["Tight transfer — less than 60 minutes"]`
- Price > 40% below median → riskReasons: `["Unusually low price — verify inclusions"]`

#### Verification

- [ ] `POST /api/search-trip` with valid body creates a `Trip` row and returns `tripId`
- [ ] `GET /api/search/stream?tripId=<id>` returns 200 with `Content-Type: text/event-stream`
- [ ] `status` events stream before `category` events
- [ ] `done` event always arrives (even on provider failure)
- [ ] If TravelPayouts fails, Duffel is tried (test by setting a bad TP API key)
- [ ] If all AI providers fail, results still arrive (no AI annotation, but results present)
- [ ] Amadeus is NOT called when `AMADEUS_ENABLED` is absent or `"false"`
- [ ] `CachedResult` rows exist in DB after stream completes

---

### Phase 5: Results Display

**Goal**: Results page consuming SSE stream, category sections, slot cards, paginated filter pages.

#### Files to Create / Modify

- `app/results/page.tsx`
- `components/results/ResultsGrid.tsx`
- `components/results/CategorySection.tsx`
- `components/results/FlightCard.tsx`
- `components/results/HotelCard.tsx`
- `components/results/CarCard.tsx`
- `components/results/ExcursionCard.tsx`
- `components/results/SSEStatus.tsx`
- `components/results/SeeMoreButton.tsx`
- `app/results/flights/page.tsx`
- `app/results/hotels/page.tsx`
- `app/results/cars/page.tsx`
- `app/results/excursions/page.tsx`
- `components/results/FilterSidebar.tsx`
- `lib/api/streamClient.ts` — `useSSEStream(tripId)` hook

#### Card Design Rules

- White card (`bg-surface-container-low`) with 1px `outline-variant` border.
- Slot label (e.g., "Best value") as `label-caps` badge, colour `primary`.
- Price in EUR equivalent + display currency below (smaller, `text-on-surface-variant`).
- Risk badge: LOW (green), MEDIUM (amber), HIGH (red).
- Risk reasons in tooltip on hover of the risk badge.
- "Book now" opens deep link in new tab.
- Non-refundable shown as a warning label.

#### SSE Client Hook

```typescript
function useSSEStream(tripId: string): {
  status: string;
  results: Record<ServiceType, NormalizedResult[]>;
  isDone: boolean;
  hasError: boolean;
}
```

- `useEffect` opens `EventSource`, cleans up on unmount.
- Retries once after 2 seconds on `onerror`, then marks `hasError`.
- Updates Zustand `uiStore` with loading state.

#### Paginated Category Pages

- `GET /api/trips/[id]/results?type=FLIGHT&page=1&limit=20` serves results from `CachedResult` table.
- Right sidebar filters applied client-side against the full results array.
- No re-streaming — all from DB cache.

#### Verification

- [ ] Results page shows "Searching flights..." before results arrive
- [ ] Category sections appear as each `category` SSE event arrives
- [ ] Slot labels correctly assigned per the table in Section 8.7
- [ ] "See more" navigates to paginated page with 20 results visible
- [ ] Filter sidebar narrows results without page reload
- [ ] Stream error state shows a toast, not a blank page
- [ ] Each card's "Book now" opens the correct provider deeplink

---

### Phase 6: My Trips

**Goal**: Authenticated and anonymous trip list, TripCard, price refresh, trip detail page.

#### Files to Create / Modify

- `app/trips/page.tsx`
- `components/trips/TripCard.tsx`
- `components/trips/RefreshPricesButton.tsx`
- `components/trips/EmptyTrips.tsx`
- `app/trip/[id]/page.tsx`
- `app/api/trips/route.ts`
- `app/api/trips/[id]/route.ts`
- `app/api/trips/[id]/refresh/route.ts`
- `server/services/tripService.ts`

#### TripCard Contents

- Destination name + departure date + return date
- Thumbnail summary: flight info / hotel name / car class / excursion count
- Total price in display currency via `useCurrency`
- "Last refreshed" as relative time ("2 hours ago")
- "Refresh prices" button (spinner while active, disabled during)
- "View details" → `/trip/[id]`
- "Remove" with confirmation modal

#### Price Refresh Flow

```
1. User clicks "Refresh prices"
2. POST /api/trips/[id]/refresh
3. Server re-runs searchService for trip's selected services
4. Upserts CachedResult rows, updates Trip.lastRefreshedAt
5. Returns updated summary prices
6. Client invalidates trip query (TanStack Query)
```

#### Anonymous Trip Display

- `GET /api/trips` reads `avolo_sid` cookie if no authenticated session.
- Banner above list: "Sign in to save your trips permanently." with Login button.

#### Verification

- [ ] Anonymous user sees their trips after closing and reopening browser
- [ ] Authenticated user sees merged trips after login
- [ ] "Refresh prices" shows spinner and updates prices on completion
- [ ] "Remove" shows a confirmation modal before deleting
- [ ] Trip detail page shows all selected service results with correct slot labels
- [ ] Empty state shows purposeful copy

---

### Phase 7: Profile & Preferences

**Goal**: Settings, travel preferences, and notification toggles.

#### Files to Create / Modify

- `app/profile/settings/page.tsx`
- `app/profile/preferences/page.tsx`
- `app/profile/notifications/page.tsx`
- `app/api/profile/route.ts`
- `app/api/profile/preferences/route.ts`
- `app/api/profile/notifications/route.ts`
- `app/api/profile/export/route.ts`

#### Currency & Language

- Dropdown: EUR / USD / GBP / DKK / SEK / NOK
- Language: EN / DE / DA / SV / NO
- On save: update `User.currency` + `User.language` in DB, update Zustand `userStore`.
- Currency change re-renders all prices immediately.
- Language: stored in DB for future i18n; display remains English in MVP.

#### GDPR

- "Export my data" → `POST /api/profile/export` → returns JSON of all user data.
- "Delete my account" → confirmation modal requiring re-entered email → `DELETE /api/profile` → hard-delete cascade.

#### Preferences Form

- Auto-saved on change (debounced PATCH, 500ms). No explicit Save button.
- Flight: preferred departure airports (multi-select autocomplete), max stops, travel type, cabin class, preferred airlines, pricing style.
- Hotel: hotel type, preferred location.
- Car: car type, insurance, pickup location type.
- Excursion: experience style (multi-select), budget sensitivity.

#### Verification

- [ ] Changing currency updates all prices in UI without page reload
- [ ] Preferences are auto-saved (verify in DB via Prisma Studio)
- [ ] GDPR export produces valid JSON with all user data
- [ ] Account deletion removes all DB records (cascade verify)
- [ ] Unauthenticated access to `/profile/*` redirects to `/login`

---

### Phase 8: Travel Journal

**Goal**: AI-generated destination articles displayed as a travel journal.

#### Files to Create / Modify

- `app/journal/page.tsx`
- `app/journal/[slug]/page.tsx`
- `components/journal/ArticleCard.tsx`
- `components/journal/ArticleBody.tsx` — react-markdown + remark-gfm renderer
- `server/services/journalService.ts` — `generateArticle(iataCode, destination)`
- `app/api/journal/route.ts`
- `app/api/journal/[slug]/route.ts` — generates on-demand if not in DB

#### Article Generation

- Triggered on first request to `/journal/[slug]` if no DB record exists.
- Calls `aiClient.ts` with prompt: local recommendations, car rental warnings, public transport, hidden fees.
- AI response requested as markdown; stored in `JournalArticle.body`.
- Second request serves from DB instantly.

#### Slug Format

`[iata-code]-[destination-slug]` — e.g., `cdg-paris`, `bkk-bangkok`. Generated deterministically from IATA code + municipality name.

#### Display Rules

- Renders with `react-markdown` + `remark-gfm`.
- Max reading width: 720px.
- Headings: Manrope. Body: Inter.
- No AI-generated images. Use a colour block (`primary-fixed` gradient) as a hero.

#### Verification

- [ ] `/journal` shows a grid of available articles
- [ ] Visiting a new slug triggers generation and eventually renders the article
- [ ] Second visit serves from DB instantly
- [ ] Markdown renders correctly (headings, lists, bold)
- [ ] Article body stays within 720px container

---

### Phase 9: Admin Dashboard

**Goal**: Protected admin area with search statistics and user demographics.

#### Files to Create / Modify

- `app/admin/layout.tsx` — role guard (redirect non-ADMIN to `/`)
- `app/admin/page.tsx` — overview metrics
- `app/admin/demographics/page.tsx`
- `app/admin/searches/page.tsx`
- `app/api/admin/stats/route.ts` — requires ADMIN role

#### Metrics

- Total users (7d / 30d / all-time)
- Total searches (7d / 30d)
- Top departure and destination airports
- Average trip value (EUR)
- AI provider usage breakdown (from `Search.providers` JSON)
- Provider failure rates

#### Verification

- [ ] USER role redirected from `/admin`
- [ ] ADMIN role can access all admin pages
- [ ] Stats reflect actual DB data (verify with known test records)

---

### Phase 10: Deployment

**Goal**: Production deployment on Plesk Obsidian Ubuntu, https://www.avolo.app.

#### Checklist

- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] `package.json` has `"start": "node .next/standalone/server.js"`
- [ ] All environment variables set in Plesk environment panel (not `.env` files)
- [ ] Run `npx prisma migrate deploy` against production MySQL on first deploy
- [ ] Run airport seed: `npx ts-node db/seed.ts` on production after migration
- [ ] Confirm `NEXTAUTH_URL=https://www.avolo.app` in production env
- [ ] Confirm `AMADEUS_ENABLED` is absent or `"false"` in production
- [ ] SMTP test: trigger magic link from production, verify delivery
- [ ] SSL: confirm HTTPS enforced via Plesk (no mixed content)
- [ ] Add Plesk scheduled task for `POST /api/cron/refresh` with `Authorization: Bearer <CRON_SECRET>`

#### Plesk Build Command

```
npm install && npx prisma generate && npm run build
```

#### Plesk Start Command

```
node .next/standalone/server.js
```

#### Cron Endpoint

```
POST /api/cron/refresh
Authorization: Bearer <CRON_SECRET>
```

Logic: find `Trip` records where `lastRefreshedAt` > 24 hours old and user has `priceDropAlerts = true`. Re-fetch prices. If price changed > 5%, send email via Nodemailer.

---

## 10. AI Prompt Reference

The files in `/source/prompts/` define the analytical framework each AI agent applies. They are read-only reference material. The `lib/ai/*Prompt.ts` files translate live trip data into the input format those prompts expect.

| Prompt File | Prompt Builder | Input Fields |
|---|---|---|
| `/source/prompts/prompt_flight_pricing.md` | `lib/ai/flightPrompt.ts` | Route, dates, flexibility, travelers, baggage, priority |
| `/source/prompts/prompt_hotel_pricing.md` | `lib/ai/hotelPrompt.ts` | Destination, dates, guests, room type, priority |
| `/source/prompts/prompt_car_rental_pricing.md` | `lib/ai/carPrompt.ts` | Location, pickup/dropoff dates, driver age, car type, insurance |
| `/source/prompts/prompt_excursion_booking.md` | `lib/ai/excursionPrompt.ts` | Destination, dates, guests, preferences, priority |

Each `*Prompt.ts` file exports a single function:

```typescript
export function buildFlightPrompt(trip: Trip, rawResults: NormalizedResult[]): string
```

The returned string is passed directly to `aiClient.callAI()`. Always include `"Respond only with valid JSON"` as the final instruction in every built prompt.

---

## 11. Airport Data

**Source**: `/source/airports.csv` (~70k rows, OurAirports format)

**Seed filter** (apply in `db/seed.ts`):
- Include: `type` is `large_airport` or `medium_airport` OR `scheduled_service === 'yes'`
- Must have a non-empty `iata_code`
- Estimated result: ~4,000–8,000 usable airports

**CSV columns used**:
```
id, ident, type, name, latitude_deg, longitude_deg,
iso_country, iso_region, municipality, scheduled_service, iata_code
```

**Search query** (`GET /api/airports?q=<term>`):
```sql
SELECT iataCode, name, municipality, country
FROM airports
WHERE iataCode LIKE :q OR municipality LIKE :q OR name LIKE :q
ORDER BY
  CASE WHEN iataCode = :exact THEN 0
       WHEN iataCode LIKE :prefix THEN 1
       WHEN municipality LIKE :prefix THEN 2
       ELSE 3 END,
  name ASC
LIMIT 10
```

Cache the full airport list in memory on server start for autocomplete performance. The set is static and ~8k rows is acceptable in RAM.

---

*End of CLAUDE_PLAN.md — Avolo AI Travel Planner*
