# CLAUDE.md

## Project
**PathFinder (Career OS)** - AI-powered career discovery platform with voice onboarding (ElevenLabs) and multi-agent career analysis.

## Workflow
Check `PRD.json` for product requirements → `.claude/skills/` → `.claude/agents/` → `.claude/plans/`.

**Agents:** clerk (auth), convex (backend), deployment (Vercel), nextjs (frontend), shadcn (UI), error-fixer (systematic fixes), status-reporter (area analysis)

## Stack & Patterns
Next.js 15 • Tailwind 4 + shadcn/ui • Clerk → JWT → Convex • TypeScript strict • `@/*` imports

Auth: `ConvexProviderWithClerk` | Schema: `convex/schema.ts` | Protection: `middleware.ts`

**Clerk+Convex:** Create "convex" JWT in Clerk → set `CLERK_JWT_ISSUER_DOMAIN` → config `convex/auth.config.ts`

## Structure
`/app/(auth|protected)` `/components` `/convex` `/docs` (all docs + `CHANGELOG.md` + `/reports` + `/human-only-DONOTMODIFY`) `/.claude` (agents, commands, skills, plans)

## Reference Docs (Read for Specific Tasks)

**Creating/modifying pages or routes:**
- Read `docs/frontend-architecture.md` - App Router structure, routing patterns, file locations

**Creating/modifying components:**
- Read `docs/component-patterns.md` - Component structure, props, hooks, patterns
- Read `docs/icon-usage.md` - Icon selection, sizing, colors from lucide-react

**Styling components:**
- Read `docs/styling-guide.md` - Tailwind 4 colors, spacing, animations, responsive patterns

**Convex queries/mutations:**
- Read `docs/convex-patterns.md` - Schema, auth, queries, mutations, security patterns

**Creating/modifying API routes:**
- Read `docs/api-routes-guide.md` - Route structure, AI integration, validation, error handling

**Managing state:**
- Read `docs/state-management.md` - Local state, Convex, Context, localStorage patterns

**TypeScript types/interfaces:**
- Read `docs/type-definitions.md` - Type patterns, interfaces, generics, Convex types

**Always update docs/** when making significant changes. Update the above files in the `docs/` folder when patterns, APIs, or architecture changes significantly.

## Rules
**TS:** Strict, no `any`, `@/*` imports | **React:** Functional, `"use client"`, Convex hooks, <200 LOC | **Style:** Tailwind, mobile-first | **Security:** OWASP Top 10, row-level filter, secrets in `.env.local` | **Quality:** >80% coverage, lint clean, build pass

**Convex:** Follow `docs/convex-patterns.md` exactly | **Env:** Get key from user → add to `.env.local` | **Impl:** UI first → functionality. Modular code.

**Pre-commit:** Build + tests + lint, >80% coverage, no vulnerabilities

## Key Commands
- `/execute-plan [plan.md]` - Execute implementation plans with todo tracking
- `/full-ui-test` - Test entire app with Playwright, log errors to `/docs/errors`
- `/identify-cause` - Deep root cause analysis before fixing
- `/double-check` - Review generated work from multiple perspectives
- `/update-docs` - Update docs/ using parallel agents
- `/PR [title/description]` - Create GitHub pull request
- `/npmrundev` - Run dev server and fix blocking errors
- `/init [PRD.json]` - Initialize new project from PRD
- `/plans-setup [CHANGELOG/PRD/features]` - Create implementation plans
- `/agents-setup [PRD/description]` - Create agents for tech stack

## Recent Updates (Updated: 2025-01-22)
- **New Project:** PathFinder (Career OS) - voice-based career discovery platform with ElevenLabs integration and multi-agent analysis (SpoonOS)
- **New Agents:** `agent-error-fixer` (systematic fixes), `agent-status-reporter` (area analysis), `agent-shadcn` (UI components)
- **Removed Agents:** agent-microlink, agent-openai, agent-unfurl (old bookmark-related agents)
- **New Commands:** `/execute-plan`, `/identify-cause`, `/double-check`, `/update-docs`, `/init`
- **Documentation:** Added `/docs/reports` for status reports, `/docs/human-only-DONOTMODIFY` for human-only instructions
- **Enhanced Error Analysis:** Commands now emphasize identifying root cause over surface-level fixes

## Important Notes
- Never add backwards compatibility
- Always sacrifice grammar for the sake of conciseness in your responses
- **MANDATORY:** Git commit after every change (small, medium, or big). No exceptions. Commit immediately after completing any change, fix, or update.
- Always constantly update /docs/CHANGELOG.md after pulling in new commits or making new commits. Keep logs concise. Only log information critical information my engineers need to know.
- When a plan finishes executing, update the plan folder itself (`.claude/plans/`) in addition to /docs/CHANGELOG.md