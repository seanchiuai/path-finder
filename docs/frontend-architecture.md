# Frontend Architecture

## App Router Structure (Next.js 15)

### Directory Layout
```text
/app
├── (auth)/          # Public routes (login, signup)
├── (protected)/     # Protected routes (require auth)
├── layout.tsx       # Root layout
└── page.tsx         # Home page
```

### Route Groups
- `(auth)`: Public authentication pages
- `(protected)`: Pages requiring authentication (protected by middleware)

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
- UI Components: `/components/ui/**/*.tsx`
- Hooks: `/hooks/**/*.ts`
- Utils: `/lib/**/*.ts`
- Backend: `/convex/**/*.ts`
