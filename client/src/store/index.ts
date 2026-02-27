import { create } from 'zustand';
import { User, InventoryItem } from '../types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;

  lowStockItems: InventoryItem[];
  setLowStockItems: (items: InventoryItem[]) => void;

  toast: { type: 'success' | 'error' | 'info'; message: string } | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  lowStockItems: [],
  setLowStockItems: (items) => set({ lowStockItems: items }),

  toast: null,
  showToast: (type, message) => {
    set({ toast: { type, message } });
    setTimeout(() => set({ toast: null }), 4000);
  },
  clearToast: () => set({ toast: null }),
}));
