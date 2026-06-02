import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { Role } from "@/lib/auth";

export type ApiFieldErrors = Record<string, string[] | undefined>;

export type ApiErrorResponse = {
  error: string;
  fieldErrors?: ApiFieldErrors;
  code?: string;
};

export class ApiRouteError extends Error {
  status: number;
  code?: string;
  fieldErrors?: ApiFieldErrors;

  constructor(status: number, error: string, options?: { code?: string; fieldErrors?: ApiFieldErrors; [key: string]: any }) {
    super(error);
    this.status = status;
    this.code = options?.code;
    this.fieldErrors = options?.fieldErrors;
  }
}

export function errorResponse(status: number, error: string, options?: { code?: string; fieldErrors?: ApiFieldErrors }) {
  const payload: ApiErrorResponse = {
    error,
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options?.code ? { code: options.code } : {}),
  };
  return NextResponse.json(payload, { status });
}

function fromZodError(error: ZodError) {
  return new ApiRouteError(400, "Validation failed", {
    code: "VALIDATION_ERROR",
    fieldErrors: error.flatten().fieldErrors,
  });
}

export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    throw new ApiRouteError(400, "Invalid JSON payload", { code: "INVALID_JSON", fieldErrors: {} });
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    throw fromZodError(parsed.error);
  }
  return parsed.data;
}

export function parseQuery<T>(req: Request, schema: z.ZodType<T>): T {
  const query = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    throw fromZodError(parsed.error);
  }
  return parsed.data;
}

export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new ApiRouteError(401, "Unauthorized", { code: "UNAUTHORIZED" });
  }
  return userId;
}

export async function requireUser() {
  const userId = await requireAuth();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    throw new ApiRouteError(404, "User not found", { code: "USER_NOT_FOUND" });
  }
  return user;
}

export async function requireRole(allowedRoles: string | string[]) {
  const user = await requireUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!user.role || !roles.includes(user.role)) {
    throw new ApiRouteError(403, "Forbidden", { code: "FORBIDDEN" });
  }
  return user;
}

export function withRouteErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiRouteError) {
        return errorResponse(error.status, error.message, {
          code: error.code,
          fieldErrors: error.fieldErrors,
        });
      }

      console.error("Unhandled API route error:", error);
      return errorResponse(500, "Internal server error", { code: "INTERNAL_ERROR" });
    }
  };
}

