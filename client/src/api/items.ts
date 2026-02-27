import api from './client';
import {
  InventoryItem,
  ItemFormData,
  ApiListResponse,
  ApiSingleResponse,
  AnalyticsResponse,
  ListParams,
} from '../types';

export const itemsApi = {
  list(params: ListParams = {}) {
    return api.get<ApiListResponse<InventoryItem>>('/items', { params });
  },

  get(id: number) {
    return api.get<ApiSingleResponse<InventoryItem>>(`/items/${id}`);
  },

  create(data: ItemFormData) {
    return api.post<ApiSingleResponse<InventoryItem>>('/items', data);
  },

  update(id: number, data: Partial<ItemFormData>) {
    return api.put<ApiSingleResponse<InventoryItem>>(`/items/${id}`, data);
  },

  delete(id: number) {
    return api.delete<{ message: string }>(`/items/${id}`);
  },

  lowStock() {
    return api.get<{ data: InventoryItem[]; count: number }>('/items/low-stock');
  },

  analytics() {
    return api.get<AnalyticsResponse>('/items/analytics');
  },

  exportCsv() {
    return api.get('/csv/export', { responseType: 'blob' });
  },

  importCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ message: string; inserted: number; skipped: number; errors: string[] }>(
      '/csv/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};
