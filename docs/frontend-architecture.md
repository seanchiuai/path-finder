# Frontend Architecture

## App Router Structure (Next.js 15)

### Directory Layout
```text
/app
├── layout.tsx           # Root layout (ClerkProvider + ConvexClientProvider)
├── page.tsx             # Landing page (auth gate)
├── tasks/
│   ├── layout.tsx       # Tasks layout with AppSidebar + ChatSidebar
│   ├── page.tsx         # Todo dashboard
│   └── data.json        # 🗑️ Unused sample data
├── bookmarks/
│   ├── layout.tsx       # Bookmarks layout with folder/project sidebar
│   └── page.tsx         # 🚧 Incomplete bookmark UI (placeholder only)
├── search-demo/
│   └── page.tsx         # Vector search demo (semantic bookmarks)
├── server/
│   ├── page.tsx         # SSR demo with Convex preloadQuery
│   └── inner.tsx        # Server component with usePreloadedQuery
└── font-test/
    └── page.tsx         # ⚠️ Dev-only font testing page (no auth)
```

### Route Groups
**Note:** No route groups used. Auth handled via:
- Component-level `<Authenticated>` wrappers (tasks, bookmarks)
- Middleware protection (only `/server` route)
- Manual `useUser()` checks (search-demo)

### File Conventions
- `page.tsx`: Route UI
- `layout.tsx`: Shared layout for route segment
- `loading.tsx`: Loading UI
- `error.tsx`: Error UI
- `not-found.tsx`: 404 UI

### Routing Patterns
- Use `@/*` imports for all internal modules
- Server components by default, add `"use client"` when needed
- Client components required for:
  - Event handlers (onClick, onChange, etc.)
  - Hooks (useState, useEffect, etc.)
  - Browser APIs
  - Convex hooks (useQuery, useMutation, useAction)

### Navigation
```tsx
import Link from "next/link";
import { useRouter } from "next/navigation";

// Declarative
<Link href="/dashboard">Dashboard</Link>

// Programmatic
const router = useRouter();
router.push("/dashboard");
```

### Data Fetching
- Use Convex hooks in client components
- Server components can fetch directly (use client components for Convex)
- Streaming with Suspense boundaries

## File Locations
- Pages: `/app/**/*.tsx`
- Components: `/components/**/*.tsx`
- UI Components: `/components/ui/**/*.tsx` (23 shadcn/ui primitives)
- Features: `/components/features/**/*.tsx` (chat, folders, projects, search)
- Hooks: `/hooks/**/*.ts`
- Utils: `/lib/**/*.ts`
- Backend: `/convex/**/*.ts`

## Current Route Status

| Route | Status | Auth | Notes |
|-------|--------|------|-------|
| `/` | ✅ | Public/Gate | Landing with sign-in/sign-up, auto-redirects authenticated users to `/tasks` |
| `/tasks` | ✅ | `<Authenticated>` | Todo dashboard with CRUD, tabs, real-time sync |
| `/bookmarks` | 🚧 | `<Authenticated>` | Folder/project sidebar works, main UI shows placeholders only |
| `/search-demo` | ✅ | `useUser()` | Vector search demo with OpenAI embeddings |
| `/server` | ✅ | Middleware | SSR demo with Convex preloadQuery |
| `/font-test` | ⚠️ | None | Dev page - should be removed or protected |

## Known Issues

1. **⚠️ TypeScript Build Error** - `folder-tree.tsx:13` - Unused `FolderNode` interface blocks production builds
2. **🚧 Incomplete Bookmarks UI** - `/bookmarks/page.tsx` needs actual bookmark list/card implementation
3. **🗑️ Unused Data** - `/tasks/data.json` - 68 sample tasks not used by TodoDashboard
4. **⚠️ Unprotected Dev Page** - `/font-test` has no auth protection

## Authentication Pattern

**Root page (`/`):**
```tsx
<Authenticated>
  <RedirectToTasks />
</Authenticated>
<Unauthenticated>
  <SignInForm />
</Unauthenticated>
```

**Protected layouts:**
```tsx
<Authenticated>
  {children}
</Authenticated>
```

**Middleware (`middleware.ts`):**
```tsx
clerkMiddleware()
// Only protects: /server
```
