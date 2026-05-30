import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as provider from '@/lib/ai/provider';

// Mock the provider to prevent actual API calls
vi.mock('@/lib/ai/provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/provider')>();
  return {
    ...actual,
    chatCompletion: vi.fn(),
    chatCompletionStream: vi.fn(),
  };
});

describe('POST /api/ai/fill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if existingData is missing', async () => {
    const req = new NextRequest('http://localhost/api/ai/fill', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    
    const data = await res.json();
    expect(data.error).toBe('existingData is required');
  });

  it('should process non-streaming request successfully', async () => {
    // Mock the AI response to return a valid JSON string
    vi.mocked(provider.chatCompletion).mockResolvedValue({
      content: '{"firstName": "Алексей"}',
      usage: { promptTokens: 10, completionTokens: 5 },
    });

    const req = new NextRequest('http://localhost/api/ai/fill', {
      method: 'POST',
      body: JSON.stringify({
        existingData: { lastName: 'Иванов' },
        stream: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data).toEqual({ firstName: 'Алексей' });
    expect(data.filledCount).toBe(1);
  });

  it('should handle streaming request successfully', async () => {
    // Mock a readable stream
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"delta": "{\\"firstName\\": "}'));
        controller.enqueue(new TextEncoder().encode('\n{"delta": "\\"Алексей\\"}"}'));
        controller.close();
      }
    });

    vi.mocked(provider.chatCompletionStream).mockResolvedValue(mockStream);

    const req = new NextRequest('http://localhost/api/ai/fill', {
      method: 'POST',
      body: JSON.stringify({
        existingData: { lastName: 'Иванов' },
        stream: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    
    // We can't easily consume the whole SSE stream here without a custom reader,
    // but verifying the status and headers is a solid smoke test.
  });
});
