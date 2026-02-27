import { useState, useEffect } from 'react';
import { InventoryItem, ItemFormData, ItemStatus } from '../../types';

const CATEGORIES = ['Electronics', 'Furniture', 'Accessories', 'Stationery', 'Clothing', 'Food & Beverage', 'Other'];
const STATUSES: ItemStatus[] = ['active', 'inactive', 'discontinued'];

const EMPTY_FORM: ItemFormData = {
  name: '',
  sku: '',
  category: 'Electronics',
  quantity: 0,
  unit_price: 0,
  supplier: '',
  location: '',
  low_stock_threshold: 10,
  status: 'active',
};

interface ItemFormProps {
  item?: InventoryItem | null;
  onSubmit: (data: ItemFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ItemForm({ item, onSubmit, onCancel }: ItemFormProps) {
  const [form, setForm] = useState<ItemFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormData, string>>>({});

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        unit_price: item.unit_price,
        supplier: item.supplier ?? '',
        location: item.location ?? '',
        low_stock_threshold: item.low_stock_threshold,
        status: item.status,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [item]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ItemFormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.category) errs.category = 'Category is required';
    if (form.quantity < 0) errs.quantity = 'Quantity cannot be negative';
    if (form.unit_price <= 0) errs.unit_price = 'Price must be positive';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof ItemFormData, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2">
          <label className="label">Name *</label>
          <input className={`input ${errors.name ? 'border-red-400' : ''}`}
            value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Product name" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* SKU */}
        <div>
          <label className="label">SKU *</label>
          <input className={`input uppercase ${errors.sku ? 'border-red-400' : ''}`}
            value={form.sku}
            onChange={(e) => set('sku', e.target.value.toUpperCase())}
            placeholder="e.g. PROD-001"
            disabled={!!item}
          />
          {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
          {item && <p className="text-xs text-gray-400 mt-1">SKU cannot be changed after creation</p>}
        </div>

        {/* Category */}
        <div>
          <label className="label">Category *</label>
          <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="label">Quantity *</label>
          <input className={`input ${errors.quantity ? 'border-red-400' : ''}`}
            type="number" min={0}
            value={form.quantity} onChange={(e) => set('quantity', parseInt(e.target.value) || 0)} />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
        </div>

        {/* Unit Price */}
        <div>
          <label className="label">Unit Price ($) *</label>
          <input className={`input ${errors.unit_price ? 'border-red-400' : ''}`}
            type="number" min={0.01} step={0.01}
            value={form.unit_price} onChange={(e) => set('unit_price', parseFloat(e.target.value) || 0)} />
          {errors.unit_price && <p className="text-xs text-red-500 mt-1">{errors.unit_price}</p>}
        </div>

        {/* Supplier */}
        <div>
          <label className="label">Supplier</label>
          <input className="input" value={form.supplier}
            onChange={(e) => set('supplier', e.target.value)} placeholder="Supplier name" />
        </div>

        {/* Location */}
        <div>
          <label className="label">Location</label>
          <input className="input" value={form.location}
            onChange={(e) => set('location', e.target.value)} placeholder="e.g. Warehouse A" />
        </div>

        {/* Low Stock Threshold */}
        <div>
          <label className="label">Low Stock Threshold</label>
          <input className="input" type="number" min={0}
            value={form.low_stock_threshold}
            onChange={(e) => set('low_stock_threshold', parseInt(e.target.value) || 0)} />
        </div>

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status}
            onChange={(e) => set('status', e.target.value as ItemStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : item ? 'Save Changes' : 'Create Item'}
        </button>
      </div>
    </form>
  );
}
