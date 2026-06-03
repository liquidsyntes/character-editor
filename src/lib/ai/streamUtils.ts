export function sseResponse(aiStream: ReadableStream<Uint8Array>): Response {
  const encoder = new TextEncoder();
  const sseStream = new ReadableStream({
    async start(controller) {
      const reader = aiStream.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              try {
                const parsed = JSON.parse(buffer);
                if (parsed.delta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta })}\n\n`));
                }
                if (parsed.usage) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: parsed.usage })}\n\n`));
                }
              } catch (e) {}
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            break;
          }
          
          buffer += new TextDecoder().decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta })}\n\n`));
              }
              if (parsed.usage) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: parsed.usage })}\n\n`));
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
