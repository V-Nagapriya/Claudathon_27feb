export type ItemStatus = 'active' | 'inactive' | 'discontinued';

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit_price: number;
  supplier: string | null;
  location: string | null;
  low_stock_threshold: number;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ItemFormData {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  location: string;
  low_stock_threshold: number;
  status: ItemStatus;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiSingleResponse<T> {
  data: T;
}

export interface AnalyticsSummary {
  totalItems: number;
  lowStockCount: number;
  totalValue: number;
  outOfStock: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  total_value: number;
  total_qty: number;
}

export interface SupplierStat {
  supplier: string;
  count: number;
  total_value: number;
}

export interface StockHistoryEntry {
  id: number;
  item_id: number;
  item_name: string;
  sku: string;
  quantity: number;
  changed_by: string;
  note: string;
  recorded_at: string;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  byCategory: CategoryStat[];
  bySupplier: SupplierStat[];
  recentHistory: StockHistoryEntry[];
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ItemStatus | '';
  sort?: string;
  order?: 'asc' | 'desc';
  lowStock?: boolean;
}
