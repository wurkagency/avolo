PLAN.md — Avolo MVP Build Plan

🧠 1. PROJECT OVERVIEW
Avolo is an AI-first, minimalistic travel planning platform with:

Dialogue-based UX (Typeform style)
Multi-service trip aggregation:

Flights
Hotels
Cars
Excursions


External booking only (no payments)
AI optimization + explanation layer


⚙️ 2. TECH STACK (CONFIRMED)
Frontend

Next.js (App Router ✅)
Tailwind CSS
Zustand (state)
React Query (data)

Backend

Next.js API routes (MVP ✅ → later extractable)
Node.js services inside /lib/server

Database

MySQL (Docker locally + Plesk production)

AI Layer

Groq (primary)
Gemini (fallback)

Hosting

Plesk Node.js app (single app ✅)


🧱 3. ARCHITECTURE

📁 Project Structure
/app
  /explore
  /results
  /trip
  /api

/components
  /ui
  /explore
  /results

/lib
  /state
  /api
  /ai
  /server
  /utils

/server
  /services
  /providers

/db
  schema.sql


🧠 Core Principle
👉 EVERYTHING revolves around Trip Object

🧩 4. MVP DEVELOPMENT PHASES

✅ PHASE 1 — FOUNDATION (Day 1–2)

Step 1 — Setup Project
Claude Command
/build

Task

Create Next.js app
Install Tailwind
Setup Zustand
Setup API routes
Setup MySQL connection


Step 2 — Trip State
👉 CRITICAL
/build

Create:

Global trip store
Persistent state


✅ Output Requirement:

Zustand store
Trip interface
LocalStorage persistence


✅ PHASE 2 — EXPLORE FLOW (Day 2–4)

Step 3 — Home Page
/build

Features:

Hero: “Let’s Fly Away”
Input:

Departure
Destination


Voice trigger


Step 4 — Explore Steps
Build individually using Claude flow:

Step 2 — Services Selection
/plan → /build → /review → /fix → /optimize


Step 3 — Dates

Flexible dates logic
Store duration


Step 4 — Travellers

Dynamic children ages


Step 5 — Luggage

Influences pricing


✅ Output:

Fully working multi-step UI
State flows correctly


✅ PHASE 3 — SEARCH ENGINE (Day 4–6)

Step 6 — Backend API
/build

Create:
POST /api/search-trip


Logic:

Read trip object
Detect selected services
Call providers:

TravelPayouts
Duffel


Normalize data
Rank results


✅ IMPORTANT:
Start with real APIs immediately (you chose A)


✅ PHASE 4 — RESULTS PAGE (Day 6–8)

Step 7 — Results UI
/build


Must include:
Sections

Flights
Hotels
Cars
Excursions


Each shows:

Best
Cheapest
Best value


Features:

Total trip cost
AI explanation
Risk flags:

Non-refundable
Transfers





✅ PHASE 5 — AI LAYER (Day 8–9)

Step 8 — Prompt System
/build


Create:
/lib/ai/flightPrompt.ts
/lib/ai/hotelPrompt.ts
/lib/ai/carPrompt.ts
/lib/ai/excursionPrompt.ts


Logic:

Optimize results
Explain choices
Detect risks



✅ PHASE 6 — DATABASE (Day 9–10)

Step 9 — MySQL Setup
/build


Tables:

users
trips
searches
cached_results
preferences



✅ PHASE 7 — MY TRIPS (Day 10–11)

Step 10 — Trip Persistence
/build


Features:

Save searches
Refresh pricing
Edit trips
Recalculate totals



✅ PHASE 8 — DEPLOYMENT (Day 11–12)

Step 11 — Docker Local
Setup:
Shelldocker run --name avolo-mysql \-e MYSQL_ROOT_PASSWORD=root \-e MYSQL_DATABASE=avolo \-p 3306:3306 -d mysql:8Vis flere linjer

Step 12 — Environment Variables
DB_HOST=localhost
DB_USER=root
DB_PASS=root
DB_NAME=avolo

GROQ_API_KEY=xxx



🚀 5. DEPLOYMENT FLOW

✅ Step 1 — Push to GitHub
Shellgit initgit add .git commit -m "Initial MVP"git remote add origin https://github.com/wurkagency/avologit push -u origin mainVis flere linjer

✅ Step 2 — Build Project
Shellnpm run buildnpm start``Vis flere linjer

✅ Step 3 — Plesk Setup

Create Node.js app
Set root to /app
Set:

npm install
npm run build
npm start




✅ Step 4 — MySQL (Production)

Create DB in Plesk
Update connection credentials


✅ Step 5 — Domain

Point to:

https://www.avolo.app


🧠 6. CLAUDE WORKFLOW (MANDATORY)

For EVERY feature:

1
/plan


2
/build


3
/review


4
/fix


5
/optimize


🎨 7. DESIGN SYSTEM (ALWAYS APPLY)

Use:

tasteskill → layout
impeccable → polish
emilkowalski → structure


Rules:

One decision per screen
Minimal UI
Large spacing
Clear CTA


⚠️ 8. CRITICAL RULES

✅ ALWAYS

Reuse trip data
Show total trip price
Explain choices
Highlight risks


❌ NEVER

Build complex filters first
Overload UI
Skip AI explanation


🏁 9. MVP DEFINITION (DONE WHEN…)

✅ User can:

Enter trip via Home
Complete Explore steps
See aggregated results
Understand best options
Click out to book


✅ System can:

Aggregate APIs
Rank results
Explain decisions
Persist trips