import { useState, useRef, useEffect, FormEvent } from 'react';
import { streamA2UI } from '../../api/ai';
import { useSurface } from '../../a2ui/useSurface';
import A2UISurfaceRenderer from '../../a2ui/A2UISurfaceRenderer';
import { a2uiCatalog } from '../../a2ui/catalog';

const SUGGESTED_QUERIES = [
  'Show me all low stock items',
  'Summarise inventory value by category',
  'Which items are out of stock?',
  'Show electronics with quantity below 10',
  'Which supplier has the highest total inventory value?',
];

interface AIAssistantPanelProps {
  onClose: () => void;
}

export default function AIAssistantPanel({ onClose }: AIAssistantPanelProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { surfaces, status, error, processMessage, reset } = useSurface();
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when panel opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to surface content when it starts rendering
  useEffect(() => {
    if (status === 'streaming' && surfaceRef.current) {
      surfaceRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [status]);

  const handleSubmit = async (e: FormEvent | null, overrideQuery?: string) => {
    e?.preventDefault();
    const q = overrideQuery ?? query.trim();
    if (!q || isLoading) return;

    reset();
    setIsLoading(true);

    await streamA2UI(
      q,
      processMessage,
      () => setIsLoading(false),
      (_err) => setIsLoading(false)
    );
  };

  const surface = surfaces.get('ai-panel');
  const hasContent = surface && surface.components.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative flex flex-col bg-white shadow-2xl w-full max-w-xl h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-2 text-white">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">InvenTrack AI</p>
              <p className="text-xs text-blue-200">Powered by Claude + A2UI Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors"
            aria-label="Close AI panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* A2UI Protocol badge */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
              A2UI v0.9
            </span>
            <span>Agent-to-UI protocol — Claude renders live UI surfaces</span>
          </div>

          {/* Suggested queries */}
          {!hasContent && !isLoading && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Suggested queries</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); handleSubmit(null, q); }}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-full px-3 py-1.5 transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              Claude is generating an A2UI surface…
            </div>
          )}

          {/* A2UI Surface rendering */}
          {surface && (
            <div ref={surfaceRef} className="space-y-3">
              {/* A2UI protocol trace (developer insight) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600 font-mono select-none">
                  A2UI surface: {surface.surfaceId} · {surface.components.length} component{surface.components.length !== 1 ? 's' : ''}
                </summary>
                <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-40">
                  {JSON.stringify(surface.components, null, 2)}
                </pre>
              </details>

              <A2UISurfaceRenderer surface={surface} catalog={a2uiCatalog} />
            </div>
          )}

          {/* Error state */}
          {status === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              {error.includes('ANTHROPIC_API_KEY') && (
                <p className="text-xs text-red-500 mt-2">
                  Set <code className="bg-red-100 px-1 rounded">ANTHROPIC_API_KEY</code> in your server environment.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Query input */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              className="input flex-1 text-sm"
              placeholder="Ask anything about your inventory…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn-primary px-4"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          {hasContent && !isLoading && (
            <button
              onClick={() => { reset(); setQuery(''); }}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear and ask a new question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
