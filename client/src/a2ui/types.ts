// A2UI Protocol v0.9 — Type Definitions
// https://a2ui.org/specification/v0.9-a2ui/

export interface A2UIComponentDef {
  id: string;
  type: string;
  parentId?: string;
  data: Record<string, unknown>;
}

// ── Server → Client message types ────────────────────────────────────────────

export interface CreateSurfaceMessage {
  type: 'createSurface';
  surfaceId: string;
}

export interface UpdateComponentsMessage {
  type: 'updateComponents';
  surfaceId: string;
  components: A2UIComponentDef[];
}

export interface UpdateDataModelMessage {
  type: 'updateDataModel';
  surfaceId: string;
  data: Record<string, unknown>;
}

export interface DeleteSurfaceMessage {
  type: 'deleteSurface';
  surfaceId: string;
}

export interface DoneMessage {
  type: 'done';
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type A2UIMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage
  | DoneMessage
  | ErrorMessage;

// ── Surface state ─────────────────────────────────────────────────────────────

export interface A2UISurface {
  surfaceId: string;
  components: A2UIComponentDef[];
  dataModel: Record<string, unknown>;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export type A2UICatalogComponent = React.ComponentType<Record<string, unknown>>;

export interface A2UICatalog {
  [componentType: string]: A2UICatalogComponent;
}
