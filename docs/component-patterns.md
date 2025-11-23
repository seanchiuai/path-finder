# Component Patterns

## Component Organization

**Structure:**
- `/components/ui/` - 23 shadcn/ui primitives (button, card, dialog, etc.)
- `/components/features/` - Feature-specific components (chat, folders, projects, search)
- `/components/` root - Layout/navigation components

## Component Structure

### Functional Components (Required)
```tsx
"use client"; // Only if needed

import { ComponentProps } from "@/types";

export function MyComponent({ prop1, prop2 }: ComponentProps) {
  return <div>Content</div>;
}
```

### Standard Pattern
```tsx
"use client"
// Imports (React, Convex, UI components, icons)
// TypeScript interfaces
// Component function with destructured props
// Convex hooks (queries, mutations, actions)
// Local state hooks
// Event handlers
// Return JSX with Tailwind classes
```

### Props Patterns
```tsx
// Interface for props
interface ButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}

// With HTML attributes
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

## Hooks Usage

### Convex Hooks (Client Only)
```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function TodoList() {
  const todos = useQuery(api.todos.list);
  const addTodo = useMutation(api.todos.create);

  if (todos === undefined) return <div>Loading...</div>;

  return <div>{/* UI */}</div>;
}
```

### React Hooks
```tsx
import { useState, useEffect, useMemo, useCallback } from "react";

// State
const [count, setCount] = useState(0);

// Effects
useEffect(() => {
  // Side effects
}, [dependencies]);

// Memoization
const value = useMemo(() => expensiveCalc(), [deps]);
const callback = useCallback(() => {}, [deps]);
```

## Component Size
- Keep components <200 LOC
- Extract logic to custom hooks
- Split large components into smaller ones

## Patterns

### Composition
```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
}

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Conditional Rendering
```tsx
// Ternary
{isLoading ? <Spinner /> : <Content />}

// AND operator
{error && <ErrorMessage error={error} />}

// Early return
if (!data) return <Loading />;
return <Content data={data} />;
```

### Event Handlers
```tsx
"use client";

function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submit
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## shadcn/ui Patterns
- Use pre-built components from `/components/ui`
- Customize via className prop
- Compose components for complex UI

## Icon Libraries

**Primary:** `@tabler/icons-react`
- IconPlus, IconFolder, IconTrash, IconEdit, etc.

**Secondary:** `lucide-react`
- Send, Loader2, Search, X, ChevronRight, etc.

**Sizing:**
- `h-4 w-4` - Small icons (buttons)
- `h-5 w-5` - Medium icons (navigation)

## Current Component Status

### ✅ Working Components
- All 23 shadcn/ui primitives (button, card, dialog, dropdown-menu, input, select, sidebar, table, tooltip, etc.)
- Chat system (chat-sidebar, chat-input, chat-message, chat-header, memory-panel)
- Folder/project management (folder-tree, folder-tree-item, project-switcher, new/rename dialogs)
- Search (semantic-search with vector embeddings)
- Layout (app-sidebar, nav-main, nav-secondary, nav-user, nav-documents)
- TodoDashboard (complete CRUD with filtering)

### ⚠️ Known Issues
- **folder-tree.tsx:13** - Unused `FolderNode` interface (TypeScript linting error, blocks production builds)

### 🗑️ Deprecated/Example Components
- add-bookmark-example.tsx (example only)
- section-cards.tsx (demo data)
- chart-area-interactive.tsx (mock data)

## Accessibility Patterns

```tsx
// Icon-only buttons
<Button size="icon" aria-label="Add item" type="button">
  <Plus className="h-4 w-4" />
</Button>

// Collapsible elements
<div aria-expanded={isOpen}>

// Keyboard handlers
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    // Submit
  }
  if (e.key === "Escape") {
    // Close
  }
}
```

**Best Practices:**
- `type="button"` on all non-submit buttons
- `aria-label` on icon-only buttons
- Keyboard support: Enter, Escape, Shift+Enter
- Screen reader text: `<span className="sr-only">`
