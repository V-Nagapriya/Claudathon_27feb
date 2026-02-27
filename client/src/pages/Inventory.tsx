import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { itemsApi } from '../api/items';
import { useAppStore } from '../store';
import { InventoryItem, ItemFormData, ItemStatus, PaginationMeta, ListParams } from '../types';
import ItemTable from '../components/inventory/ItemTable';
import ItemForm from '../components/inventory/ItemForm';
import FilterPanel from '../components/inventory/FilterPanel';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';

export default function Inventory() {
  const { user, showToast, setLowStockItems } = useAppStore();
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [status, setStatus] = useState<ItemStatus | ''>(searchParams.get('status') as ItemStatus | '' ?? '');
  const [lowStock, setLowStock] = useState(searchParams.get('lowStock') === 'true');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // CSV
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListParams = { page, limit: 20, sort: sortBy, order: sortOrder };
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      if (lowStock) params.lowStock = true;

      const res = await itemsApi.list(params);
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      showToast('error', 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status, lowStock, sortBy, sortOrder]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleCreate = async (data: ItemFormData) => {
    try {
      await itemsApi.create(data);
      showToast('success', `Item "${data.name}" created successfully`);
      setShowForm(false);
      fetchItems();
      refreshLowStock();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create item';
      showToast('error', msg);
      throw err;
    }
  };

  const handleUpdate = async (data: ItemFormData) => {
    if (!editItem) return;
    try {
      await itemsApi.update(editItem.id, data);
      showToast('success', `Item "${data.name}" updated`);
      setEditItem(null);
      fetchItems();
      refreshLowStock();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update item';
      showToast('error', msg);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await itemsApi.delete(deleteTarget.id);
      showToast('success', `Item "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchItems();
      refreshLowStock();
    } catch {
      showToast('error', 'Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const refreshLowStock = () => {
    itemsApi.lowStock().then((res) => setLowStockItems(res.data.data)).catch(() => {});
  };

  const handleExport = async () => {
    try {
      const res = await itemsApi.exportCsv();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'CSV exported successfully');
    } catch {
      showToast('error', 'Export failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await itemsApi.importCsv(file);
      const { inserted, skipped, errors } = res.data;
      showToast('success', `Imported ${inserted} items${skipped > 0 ? `, ${skipped} skipped` : ''}`);
      if (errors.length > 0) console.warn('Import errors:', errors);
      fetchItems();
      refreshLowStock();
    } catch {
      showToast('error', 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pagination.total} total items</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV buttons */}
          <button className="btn-secondary text-xs" onClick={handleExport}>
            Export CSV
          </button>
          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
              <button
                className="btn-secondary text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import CSV'}
              </button>
              <button
                className="btn-primary"
                onClick={() => { setEditItem(null); setShowForm(true); }}
              >
                + Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card py-4 px-5 space-y-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, SKU, or supplier..."
        />
        <FilterPanel
          category={category}
          status={status}
          lowStock={lowStock}
          onCategory={(v) => { setCategory(v); setPage(1); }}
          onStatus={(v) => { setStatus(v); setPage(1); }}
          onLowStock={(v) => { setLowStock(v); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading...</div>
        ) : (
          <ItemTable
            items={items}
            onEdit={(item) => { setEditItem(item); setShowForm(true); }}
            onDelete={setDeleteTarget}
            isAdmin={isAdmin}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="flex items-center text-sm text-gray-600 px-3">
              Page {page} of {pagination.pages}
            </span>
            <button
              className="btn-secondary text-xs"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? `Edit: ${editItem.name}` : 'Add New Item'}
        size="lg"
      >
        <ItemForm
          item={editItem}
          onSubmit={editItem ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}
