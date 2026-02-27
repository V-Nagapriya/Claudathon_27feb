import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { itemsApi } from '../api/items';
import { AnalyticsResponse } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function fmt(v: number) {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    itemsApi.analytics()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading analytics...</div>
      </div>
    );
  }

  const byCategory = data?.byCategory ?? [];
  const bySupplier = data?.bySupplier ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Inventory insights and trends</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total SKUs', value: data?.summary.totalItems ?? 0, color: 'text-blue-600' },
          { label: 'Total Value', value: fmt(data?.summary.totalValue ?? 0), color: 'text-green-600' },
          { label: 'Low Stock', value: data?.summary.lowStockCount ?? 0, color: 'text-yellow-600' },
          { label: 'Out of Stock', value: data?.summary.outOfStock ?? 0, color: 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="card text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-sm text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Value Bar */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Inventory Value by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [fmt(v), 'Value']} />
              <Bar dataKey="total_value" radius={[4, 4, 0, 0]}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quantity Pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Total Quantity by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="total_qty"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={3}
              >
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Units']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Bar */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Value by Supplier (Top 10)</h3>
          {bySupplier.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No supplier data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bySupplier} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="supplier" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Value']} />
                <Bar dataKey="total_value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Radar */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Category Overview (Items vs Qty)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={byCategory}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
              <Radar name="Item Count" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Table */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">SKUs</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total Qty</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total Value</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Avg Unit Value</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map((row) => (
                <tr key={row.category} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.category}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.count}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.total_qty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-800 font-medium">{fmt(row.total_value)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.total_qty > 0 ? fmt(row.total_value / row.total_qty) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
