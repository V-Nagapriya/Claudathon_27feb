import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '../../types';

interface LowStockAlertProps {
  items: InventoryItem[];
}

export default function LowStockAlert({ items }: LowStockAlertProps) {
  const navigate = useNavigate();
  if (items.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="font-semibold text-red-800">
          {items.length} Item{items.length !== 1 ? 's' : ''} Need Restocking
        </h3>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
            <div>
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
              <span className="text-xs text-gray-400 ml-2">{item.sku}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-red-600">{item.quantity}</span>
              <span className="text-xs text-gray-400">/ {item.low_stock_threshold} min</span>
            </div>
          </div>
        ))}
      </div>
      {items.length > 8 && (
        <button
          onClick={() => navigate('/inventory?lowStock=true')}
          className="mt-2 text-sm text-red-600 hover:underline font-medium"
        >
          View all {items.length} low-stock items
        </button>
      )}
    </div>
  );
}
