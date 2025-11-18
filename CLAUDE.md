# CLAUDE.md

## Workflow
Check `PRD.json` for product requirements → `.claude/skills/` → `.claude/agents/` → `.claude/plans/`.

**Agents:** clerk (auth), convex (backend), deployment (Vercel), nextjs (frontend)

## Stack & Patterns
Next.js 15 • Tailwind 4 + shadcn/ui • Clerk → JWT → Convex • TypeScript strict • `@/*` imports

Auth: `ConvexProviderWithClerk` | Schema: `convex/schema.ts` | Protection: `middleware.ts`

**Clerk+Convex:** Create "convex" JWT in Clerk → set `CLERK_JWT_ISSUER_DOMAIN` → config `convex/auth.config.ts`

## Structure
`/app/(auth|protected)` `/components` `/convex` `/docs` (all docs here, `CHANGELOG.md` for critical notes) `/.claude`

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

## Important Notes
- Never add backwards compatibility
- Always sacrifice grammar for the sake of conciseness in your responses
- Always constantly commit changes after finishing the smallest fix.
- Always constantly update /docs/CHANGELOG.md after pulling in new commits or making new commits. Keep logs concise. Only log information critical information my engineers need to know.
- When a plan finishes executing, update the plan folder itself (`.claude/plans/`) in addition to /docs/CHANGELOG.md