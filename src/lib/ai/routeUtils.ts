import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Checks rate limits for the given request.
 * Returns a NextResponse with 429 status if limit exceeded, otherwise null.
 */
export async function checkApiRateLimit(req: Request | NextRequest, limit = 10, windowMs = 60000): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await checkRateLimit(ip, limit, windowMs);
  if (!success) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Подождите немного.' },
      { status: 429 }
    );
  }
  return null;
}

/**
 * Common error handler for AI routes (timeouts, general errors).
 */
export function handleAiError(err: unknown, context: string): NextResponse {
  console.error(`[${context}] Error:`, err);
  const message = err instanceof Error ? err.message : 'Unknown error';

  if (message.includes('timeout') || message.includes('abort')) {
    return NextResponse.json(
      { error: 'AI не успел ответить (таймаут). Попробуйте ещё раз.' },
      { status: 504 }
    );
  }

  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

/**
 * Validates that existingData is present and is an object.
 */
export function validateExistingData(body: Record<string, unknown> | null | undefined): NextResponse | null {
  if (!body?.existingData || typeof body.existingData !== 'object') {
    return NextResponse.json(
      { error: 'existingData is required and must be an object' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validates that the request has a valid NextAuth session.
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}


/**
 * Higher Order Function to wrap AI routes with Auth and Rate Limiting
 */
export function withAiMiddleware(
  handler: (req: NextRequest, params?: any) => Promise<Response | NextResponse>,
  options: { limit?: number; windowMs?: number } = {}
) {
  return async (req: NextRequest, params?: any) => {
    const authError = await requireAuth();
    if (authError) return authError;

    const rateLimitError = await checkApiRateLimit(req, options.limit || 10, options.windowMs || 60000);
    if (rateLimitError) return rateLimitError;

    return handler(req, params);
  };
}
