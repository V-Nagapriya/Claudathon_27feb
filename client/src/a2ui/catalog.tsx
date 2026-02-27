// A2UI Catalog — maps component type strings to React components
// These are the components Claude can reference in its A2UI responses.
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { InventoryItem, CategoryStat, SupplierStat } from '../types';
import { A2UICatalog } from './types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ── Heading ──────────────────────────────────────────────────────────────────
function Heading({ text, level = 2 }: { text: string; level?: number }) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeMap: Record<number, string> = { 1: 'text-2xl font-bold', 2: 'text-xl font-semibold', 3: 'text-lg font-medium' };
  return <Tag className={`${sizeMap[level] ?? 'text-lg font-medium'} text-gray-900 mb-3`}>{text}</Tag>;
}

// ── TextBlock ────────────────────────────────────────────────────────────────
function TextBlock({ content }: { content: string }) {
  return <p className="text-sm text-gray-600 leading-relaxed">{content}</p>;
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <hr className="border-gray-100 my-4" />;
}

// ── AlertBanner ──────────────────────────────────────────────────────────────
function AlertBanner({ message, variant = 'info' }: { message: string; variant?: string }) {
  const styles: Record<string, string> = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };
  const icons: Record<string, string> = {
    info: 'ℹ', warning: '⚠', error: '✕', success: '✓',
  };
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${styles[variant] ?? styles.info}`}>
      <span className="font-bold">{icons[variant] ?? 'ℹ'}</span>
      <span>{message}</span>
    </div>
  );
}

// ── StatsGrid ────────────────────────────────────────────────────────────────
interface StatItem {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

function StatsGrid({ stats = [] }: { stats?: StatItem[] }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700' },
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => {
        const c = colorMap[stat.color ?? 'blue'];
        return (
          <div key={i} className={`rounded-xl p-4 ${c.bg}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
            <p className={`text-2xl font-bold mt-1 ${c.text}`}>{stat.value}</p>
            {stat.subtitle && <p className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── InventoryTable ────────────────────────────────────────────────────────────
function InventoryTable({ items = [], caption }: { items?: InventoryItem[]; caption?: string }) {
  if (!items.length) return <p className="text-sm text-gray-400 italic">No items to display.</p>;
  return (
    <div>
      {caption && <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{caption}</p>}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'SKU', 'Category', 'Qty', 'Unit Price', 'Supplier', 'Status'].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.quantity <= item.low_stock_threshold;
              return (
                <tr key={item.id} className={`border-t border-gray-50 ${isLow ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="px-3 py-2 text-gray-600">{item.category}</td>
                  <td className={`px-3 py-2 font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-gray-600">${item.unit_price?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-500">{item.supplier ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${item.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CategoryChart ─────────────────────────────────────────────────────────────
function CategoryChart({ data = [] }: { data?: CategoryStat[] }) {
  if (!data.length) return <p className="text-sm text-gray-400 italic">No category data.</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Value']} />
        <Bar dataKey="total_value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── SupplierChart ─────────────────────────────────────────────────────────────
function SupplierChart({ data = [] }: { data?: SupplierStat[] }) {
  if (!data.length) return <p className="text-sm text-gray-400 italic">No supplier data.</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <YAxis dataKey="supplier" type="category" width={100} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Value']} />
        <Bar dataKey="total_value" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Catalog export ────────────────────────────────────────────────────────────
export const a2uiCatalog: A2UICatalog = {
  Heading:       Heading as A2UICatalog['Heading'],
  TextBlock:     TextBlock as A2UICatalog['TextBlock'],
  Divider:       Divider as A2UICatalog['Divider'],
  AlertBanner:   AlertBanner as A2UICatalog['AlertBanner'],
  StatsGrid:     StatsGrid as A2UICatalog['StatsGrid'],
  InventoryTable: InventoryTable as A2UICatalog['InventoryTable'],
  CategoryChart: CategoryChart as A2UICatalog['CategoryChart'],
  SupplierChart: SupplierChart as A2UICatalog['SupplierChart'],
};
