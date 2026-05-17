# Project Design System

## Stack
[React + Tailwind / Next.js / plain HTML+CSS — fill in]
Dev server: http://localhost:[PORT]

## Design System
Full spec: @docs/DESIGN.md

## Fonts (load via Google Fonts or local)
- PP Editorial Old → display headings (hero, h1, stat)
- Inter → all UI text
- JetBrains Mono → code blocks

## Core Tokens (always use these, never invent values)
Primary CTA: #fa520f
Cream surface: #fff8e0
Ink text: #1f1f1f
Canvas white: #ffffff

## Layout References (screenshots)
- Sidebar + main panel: @docs/screenshots/ai_chat.jpg
- Icon rail + centered content: @docs/screenshots/AI_Prompt.jpg  
- Editorial hero + card grid: @docs/screenshots/travel.jpg

## Rules
- Use DESIGN.md component names verbatim when referencing specs
- Buttons: rounded-md (8px) only — never pill-shaped
- Cards: rounded-lg (12px)
- Primary orange confined to CTAs and the sunset stripe band
- Every page MUST end with the sunset-stripe-band component
- Mobile-first. Breakpoints: 480 / 768 / 1024 / 1280px

## Visual Review
After any UI work → invoke the design-review skill

## Approved (do not restyle)
- tokens.css ✅
- AppShell ✅
- Sidebar ✅
- WelcomeHero ✅
- InputBar ✅
- SunsetStripeBand ✅