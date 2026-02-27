// A2UI Surface hook — processes A2UI protocol messages and maintains surface state
import { useState, useCallback } from 'react';
import { A2UIMessage, A2UISurface, A2UIComponentDef } from './types';

export function useSurface() {
  const [surfaces, setSurfaces] = useState<Map<string, A2UISurface>>(new Map());
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const processMessage = useCallback((msg: A2UIMessage) => {
    switch (msg.type) {
      case 'createSurface':
        setSurfaces((prev) => {
          const next = new Map(prev);
          next.set(msg.surfaceId, {
            surfaceId: msg.surfaceId,
            components: [],
            dataModel: {},
          });
          return next;
        });
        setStatus('streaming');
        setError(null);
        break;

      case 'updateComponents':
        setSurfaces((prev) => {
          const next = new Map(prev);
          const surface = next.get(msg.surfaceId);
          if (!surface) return prev;

          // Upsert components
          const componentMap = new Map(surface.components.map((c) => [c.id, c]));
          for (const component of msg.components) {
            componentMap.set(component.id, component);
          }
          next.set(msg.surfaceId, {
            ...surface,
            components: Array.from(componentMap.values()),
          });
          return next;
        });
        break;

      case 'updateDataModel':
        setSurfaces((prev) => {
          const next = new Map(prev);
          const surface = next.get(msg.surfaceId);
          if (!surface) return prev;
          next.set(msg.surfaceId, {
            ...surface,
            dataModel: { ...surface.dataModel, ...msg.data },
          });
          return next;
        });
        break;

      case 'deleteSurface':
        setSurfaces((prev) => {
          const next = new Map(prev);
          next.delete(msg.surfaceId);
          return next;
        });
        break;

      case 'done':
        setStatus('done');
        break;

      case 'error':
        setStatus('error');
        setError(msg.message);
        break;
    }
  }, []);

  const reset = useCallback(() => {
    setSurfaces(new Map());
    setStatus('idle');
    setError(null);
  }, []);

  return { surfaces, status, error, processMessage, reset };
}

// Builds a tree from flat A2UIComponentDef list (root = no parentId)
export function buildComponentTree(components: A2UIComponentDef[]): A2UIComponentDef[] {
  const roots: A2UIComponentDef[] = [];
  const childMap = new Map<string, A2UIComponentDef[]>();

  for (const c of components) {
    if (!c.parentId) {
      roots.push(c);
    } else {
      if (!childMap.has(c.parentId)) childMap.set(c.parentId, []);
      childMap.get(c.parentId)!.push(c);
    }
  }

  return roots;
}
