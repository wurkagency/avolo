
## Natural Language Input + AI Parser
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Build conversational input system:
- Use existing API connection to GROQ
- Text input from homepage
- POST /api/interpret-query
- AI parses natural language into structured TripState
- Return JSON only

/build Implement:
- app/api/interpret-query/route.ts
- lib/ai/queryPrompt.ts
- integrate Groq API

Requirements:
- Input: raw text string
- Output: structured JSON matching tripStore
- Must include fallback for missing values

## API Route
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Create interpret-query API route

/build Implement server route:
POST /api/interpret-query
- calls aiClient
- parses response safely
- returns JSON
- validates types

## Hook into Homepage Input
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Connect homepage input to AI parser and route to /explore

/build Implement:

- on submit:
  call /api/interpret-query
  update tripStore
  redirect to /explore/services

- show loading state
- handle error toast

### VOICE INPUT (FREE)
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Add voice input using Web Speech API

/build Implement MicButton:
- start speech recognition on click
- continuous listening false
- language en-US (configurable later)
- on result:
    append transcript to input field
    optionally auto-submit

- handle:
  no browser support
  permission denied

## STREAM USER INPUT (LIKE CHAT FEEL)
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Stream interpretation feedback to UI

/build Implement:
- temporary streaming state:
  "Understanding your trip..."
  "Detecting destination..."
  "Checking dates..."

- simulate streaming until API returns

## AUTO-PREFILL WIZARD
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Prefill tripStore from AI output

/build Implement:
- map API response → tripStore fields
- skip steps if data is already filled
- navigate to next missing step

## HANDLE PARTIAL INPUT (VERY IMPORTANT)
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Handle incomplete parsed results

/build Implement:
- if missing departure → ask in step 1
- if missing date → jump to date step
- never block flow

## OPTIONAL (HIGH IMPACT)
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Add AI confirmation step before wizard

## Microphone activation button
You are in SELF-HEALING DEVELOPMENT MODE.

You must internally execute:
PLAN → BUILD → REVIEW → FIX → RE-REVIEW → FIX → OPTIMIZE → VALIDATE

Do NOT stop early.

VALIDATION must confirm:
- No TypeScript errors
- No runtime edge cases
- No architectural violations (CLAUDE_PLAN.md)
- No incomplete flows
- No undefined/null risks

CRITICAL CHECKS:
- SSE always ends with "done"
- AI failover is sequential (Groq → Gemini → Nvidia)
- No parallel failover calls
- Currency stored only as EUR
- Cookies are httpOnly
- Zustand state consistent
- API responses match contracts

If ANY issue exists → continue fixing until stable.

Fix any issues before we move to the next component.
Only use token values from DESIGN.md — no hex values outside the palette

Only stop when production-safe.

/plan Add Microphone button left to current in input area. Style Microphone button with button-primary styling and change current button with arrow to button-dark. Microphone button shall trigger request to activate device microphone and be used as speech-to-text source for input.
