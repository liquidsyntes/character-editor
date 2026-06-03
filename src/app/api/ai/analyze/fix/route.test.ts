import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as provider from '@/lib/ai/provider';

vi.mock('@/lib/ai/provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/provider')>();
  return {
    ...actual,
    chatCompletion: vi.fn(),
  };
});

vi.mock('@/lib/ai/routeUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/routeUtils')>();
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue(null),
    checkApiRateLimit: vi.fn().mockReturnValue(null),
  };
});

describe('POST /api/ai/analyze/fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if issues array is missing', async () => {
    const req = new NextRequest('http://localhost/api/ai/analyze/fix', {
      method: 'POST',
      body: JSON.stringify({ existingData: { name: 'Test' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing issues array');
  });

  it('should process request and return fixed data', async () => {
    vi.mocked(provider.chatCompletion).mockResolvedValue({
      content: '{"age": "25"}',
      usage: { promptTokens: 10, completionTokens: 5 },
    });

    const req = new NextRequest('http://localhost/api/ai/analyze/fix', {
      method: 'POST',
      body: JSON.stringify({
        existingData: { name: 'Test' },
        issues: [{ title: 'Fix age', description: 'Desc', severity: 'low', fields: ['age'] }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toEqual({ age: '25' });
  });
});
