// A2UISurfaceRenderer — renders an A2UI surface using the registered catalog
import { A2UISurface, A2UICatalog, A2UIComponentDef } from './types';

interface Props {
  surface: A2UISurface;
  catalog: A2UICatalog;
}

function RenderComponent({
  component,
  allComponents,
  catalog,
}: {
  component: A2UIComponentDef;
  allComponents: A2UIComponentDef[];
  catalog: A2UICatalog;
}) {
  const Component = catalog[component.type];

  if (!Component) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
        Unknown component type: <code>{component.type}</code>
      </div>
    );
  }

  const children = allComponents.filter((c) => c.parentId === component.id);

  return (
    <div className="a2ui-component">
      <Component {...(component.data as Record<string, unknown>)} />
      {children.length > 0 && (
        <div className="a2ui-children mt-2 space-y-2">
          {children.map((child) => (
            <RenderComponent
              key={child.id}
              component={child}
              allComponents={allComponents}
              catalog={catalog}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function A2UISurfaceRenderer({ surface, catalog }: Props) {
  const roots = surface.components.filter((c) => !c.parentId);

  if (roots.length === 0) return null;

  return (
    <div className="a2ui-surface space-y-4">
      {roots.map((component) => (
        <RenderComponent
          key={component.id}
          component={component}
          allComponents={surface.components}
          catalog={catalog}
        />
      ))}
    </div>
  );
}
