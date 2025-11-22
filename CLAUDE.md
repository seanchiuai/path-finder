# CLAUDE.md

## Workflow
Check `PRD.json` for product requirements → `.claude/skills/` → `.claude/agents/` → `.claude/plans/`.

**Agents:** clerk (auth), convex (backend), deployment (Vercel), nextjs (frontend)

## Stack & Patterns
Next.js 15 • Tailwind 4 + shadcn/ui • Clerk → JWT → Convex • TypeScript strict • `@/*` imports

**Hybrid Backend:** Convex (database, realtime, auth) + Python FastAPI (ElevenLabs, Spoon OS, ML)

Auth: `ConvexProviderWithClerk` | Schema: `convex/schema.ts` | Protection: `middleware.ts`

**Clerk+Convex:** Create "convex" JWT in Clerk → set `CLERK_JWT_ISSUER_DOMAIN` → config `convex/auth.config.ts`

**Python Backend:** `python-backend/main.py` (FastAPI) • Proxy via `convex/voice.ts`, `convex/spoonos.ts`

## Structure
`/app/(auth|protected)` `/components` `/convex` `/docs` (all docs here, `CHANGELOG.md` for critical notes) `/.claude`

## Python Backend Integration
**Python microservice for ElevenLabs voice + Spoon OS:**
- Read `docs/python-backend-integration.md` - Setup, deployment, custom integrations
- Read `python-backend/README.md` - Quick start, API endpoints, testing

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
- **MANDATORY:** Git commit after every change (small, medium, or big). No exceptions. Commit immediately after completing any change, fix, or update.
- Always constantly update /docs/CHANGELOG.md after pulling in new commits or making new commits. Keep logs concise. Only log information critical information my engineers need to know.
- When a plan finishes executing, update the plan folder itself (`.claude/plans/`) in addition to /docs/CHANGELOG.md


# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

Use gemini as a bouncing board for thoughts
gemini -p "@x I am planning to make {y} change to counterattack {z} issue, is this a good approach? what are your thoughts after analyzing this file"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results