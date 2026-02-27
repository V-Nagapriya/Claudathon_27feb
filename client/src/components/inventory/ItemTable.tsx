import { InventoryItem } from '../../types';

interface ItemTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  isAdmin: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'badge-green',
    inactive: 'badge-yellow',
    discontinued: 'badge-gray',
  };
  return <span className={map[status] ?? 'badge-gray'}>{status}</span>;
}

function SortIcon({ active, order }: { active: boolean; order: 'asc' | 'desc' }) {
  if (!active) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="text-blue-500 ml-1">{order === 'asc' ? '↑' : '↓'}</span>;
}

export default function ItemTable({ items, onEdit, onDelete, isAdmin, sortBy, sortOrder, onSort }: ItemTableProps) {
  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit_price', label: 'Unit Price' },
    { key: 'status', label: 'Status' },
  ];

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="font-medium">No items found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {cols.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
              >
                {col.label}
                <SortIcon active={sortBy === col.key} order={sortOrder} />
              </th>
            ))}
            <th className="text-left px-4 py-3 font-medium text-gray-500">Supplier</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
            {isAdmin && <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isLow = item.quantity <= item.low_stock_threshold;
            return (
              <tr
                key={item.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isLow ? 'bg-red-50/40' : ''}`}
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {item.name}
                  {isLow && (
                    <span className="ml-2 text-red-500 text-xs font-normal" title="Low stock">⚠</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-gray-600 text-xs">{item.sku}</td>
                <td className="px-4 py-3 text-gray-600">{item.category}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.quantity}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">/ {item.low_stock_threshold}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">${item.unit_price.toFixed(2)}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-gray-600">{item.supplier ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{item.location ?? '—'}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
