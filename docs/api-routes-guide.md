# API Routes Guide

## Current Status

**API Routes:** None currently implemented
**Location:** `/app/api/` directory does not exist

**Note:** This project uses Convex for backend operations. API routes are only needed for:
- Third-party webhooks (Stripe, GitHub, etc.)
- External integrations requiring HTTP endpoints
- Custom server-side logic not supported by Convex

## Route Structure (Next.js 15 App Router)

### File Location
```
/app/api/
├── route.ts          # GET /api
├── users/
│   └── route.ts      # /api/users
└── todos/
    ├── route.ts      # /api/todos
    └── [id]/
        └── route.ts  # /api/todos/:id
```

## Basic Route Handler
```ts
// app/api/hello/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ data: body });
}
```

## HTTP Methods
```ts
export async function GET(request: Request) {}
export async function POST(request: Request) {}
export async function PUT(request: Request) {}
export async function PATCH(request: Request) {}
export async function DELETE(request: Request) {}
export async function HEAD(request: Request) {}
export async function OPTIONS(request: Request) {}
```

## Request Handling

### Reading Body
```ts
const body = await request.json();
const formData = await request.formData();
const text = await request.text();
```

### Query Parameters
```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const filter = searchParams.get("filter");

  return NextResponse.json({ id, filter });
}
```

### Dynamic Routes
```ts
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ id });
}
```

### Headers
```ts
const token = request.headers.get("authorization");
const contentType = request.headers.get("content-type");
```

## Response Patterns

### JSON Response
```ts
return NextResponse.json({ data: "value" });
return NextResponse.json({ error: "Error message" }, { status: 400 });
```

### Custom Headers
```ts
return NextResponse.json(
  { data: "value" },
  {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Custom-Header": "value",
    },
  }
);
```

### Redirects
```ts
return NextResponse.redirect(new URL("/dashboard", request.url));
```

## Authentication with Clerk
```ts
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({ userId });
}
```

## AI Integration Pattern
```ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 500 }
    );
  }
}
```

## Validation
```ts
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    // Process valid data
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
```

## Error Handling
```ts
export async function POST(request: Request) {
  try {
    // Your logic
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## CORS (if needed)
```ts
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

## Best Practices
- Prefer Convex for database operations (use API routes for third-party integrations)
- Always validate input
- Handle errors gracefully
- Use TypeScript for type safety
- Keep routes focused and simple
- Use environment variables for secrets
