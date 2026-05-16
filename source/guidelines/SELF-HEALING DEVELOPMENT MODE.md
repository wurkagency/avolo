-----------------------------------------------------------------------
SELF-HEALING DEVELOPMENT MODE
-----------------------------------------------------------------------

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

Only stop when production-safe.