import { ItemStatus } from '../../types';

interface FilterPanelProps {
  category: string;
  status: ItemStatus | '';
  lowStock: boolean;
  onCategory: (v: string) => void;
  onStatus: (v: ItemStatus | '') => void;
  onLowStock: (v: boolean) => void;
}

const CATEGORIES = ['', 'Electronics', 'Furniture', 'Accessories', 'Stationery', 'Clothing', 'Food & Beverage', 'Other'];

export default function FilterPanel({ category, status, lowStock, onCategory, onStatus, onLowStock }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Category filter */}
      <select
        className="input w-auto text-sm"
        value={category}
        onChange={(e) => onCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.filter(Boolean).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        className="input w-auto text-sm"
        value={status}
        onChange={(e) => onStatus(e.target.value as ItemStatus | '')}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="discontinued">Discontinued</option>
      </select>

      {/* Low stock toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={lowStock}
          onChange={(e) => onLowStock(e.target.checked)}
          className="w-4 h-4 rounded text-red-500 cursor-pointer"
        />
        <span className="text-sm text-gray-600 font-medium">Low Stock Only</span>
      </label>
    </div>
  );
}
