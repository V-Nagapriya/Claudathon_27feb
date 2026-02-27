import { A2UIMessage } from '../a2ui/types';

/**
 * Streams A2UI messages from the server via SSE.
 * Calls onMessage for each valid A2UI protocol message received.
 * Calls onDone when the stream ends (type: 'done').
 * Calls onError on network or server errors.
 */
export async function streamA2UI(
  query: string,
  onMessage: (msg: A2UIMessage) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/ai/surface', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  } catch {
    onError('Network error — could not reach the server');
    return;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    onError(body.error ?? `Server error ${response.status}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('No response body');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE format: "data: {...}\n\n"
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const line = event.replace(/^data: /, '').trim();
      if (!line) continue;
      try {
        const msg = JSON.parse(line) as A2UIMessage;
        if (msg.type === 'done') {
          onDone();
          return;
        }
        if (msg.type === 'error') {
          onError((msg as { type: 'error'; message: string }).message);
          return;
        }
        onMessage(msg);
      } catch {
        // Skip malformed event
      }
    }
  }

  onDone();
}
