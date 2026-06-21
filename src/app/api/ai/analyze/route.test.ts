import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import * as provider from '@/lib/ai/provider';

vi.mock('@/lib/ai/provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/provider')>();
  return {
    ...actual,
    chatCompletionStream: vi.fn(),
  };
});

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
}));

describe('POST /api/ai/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if existingData is missing', async () => {
    const req = new NextRequest('http://localhost/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('existingData is required and must be an object');
  });

  it('should return 429 if rate limit is exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, limit: 10, remaining: 0, reset: 0 });

    const req = new NextRequest('http://localhost/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ existingData: { name: 'Test' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('Слишком много запросов. Подождите немного.');
  });

  it('should process request and return a stream', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"delta": "{\\"summary\\": \\"ok\\"}"}'));
        controller.close();
      }
    });

    vi.mocked(provider.chatCompletionStream).mockResolvedValue(mockStream);

    const req = new NextRequest('http://localhost/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        existingData: { name: 'Test' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
  });
});
