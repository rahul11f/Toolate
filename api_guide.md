# Developer API Guide — Toolate Platform

This guide outlines the architecture of Next.js App Router API endpoints in the Toolate project. It describes how to create, validate, secure, and document API routes.

---

## 📂 API Directory Structure

API routes are located inside the `src/app/api` directory. They follow the standard Next.js App Router structure:
```text
src/app/api/
├── admin/
│   ├── listings/
│   │   ├── [id]/
│   │   │   ├── approve/route.ts
│   │   │   ├── feature/route.ts
│   │   │   └── reject/route.ts
│   │   └── route.ts
│   ├── feedback/
│   │   └── [id]/
│   │       └── reply/route.ts
│   └── settings/
│       └── route.ts
├── feedback/
│   └── route.ts
└── listings/
    ├── [id]/
    │   ├── reviews/route.ts
    │   └── route.ts
    └── route.ts
```

---

## 🛠️ API Endpoint Patterns

Every API endpoint should conform to the following architectural checklist:
1. **Authentication & Authorization**:
   - Secure admin-only paths (`/api/admin/...`) by checking the user session role using `getServerSession(authOptions)`.
   - Protect private user actions (e.g. creating/editing listings, submitting reviews).
2. **Request Validation**:
   - Define a schema using `zod` for validating request payloads.
   - Return a `400 Bad Request` with a helpful validation message if validation fails.
3. **Database Access**:
   - Use the shared `prisma` client (`import prisma from '@/lib/prisma'`).
4. **Error Handling**:
   - Wrap logic inside `try/catch` blocks.
   - Catch database and runtime errors, log them on the server, and return clean `500 Internal Server Error` responses.

---

## 📝 Code Templates

### 1. Protected Admin Endpoint (e.g. `api/admin/feedback/[id]/reply/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';
import { z } from 'zod';

// Define input validation schema
const replySchema = z.object({
  reply: z.string().min(5, 'Reply must be at least 5 characters long.'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Session check
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    // 2. Request body validation
    const body = await req.json();
    const result = replySchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // 3. Database operations
    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: {
        reply: result.data.reply,
        repliedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully.',
      feedback: updatedFeedback,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
```

### 2. Public / Semi-Protected Endpoint (e.g. Submitting feedback)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed.' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: result.data,
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
```

---

## ⚡ Database Synchronization

If you modify models in `prisma/schema.prisma` (e.g., adding database fields or tables):
1. **Apply Schema**: Run `npx prisma db push --accept-data-loss` (suitable for SQLite development).
2. **Regenerate Client**: The above command automatically updates the generated Prisma client in `node_modules/@prisma/client`.
3. **Seed Database (Optional)**: If you updated the seed script, run `npx prisma db seed`.
