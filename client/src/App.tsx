import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authApi } from './api/auth';
import { itemsApi } from './api/items';
import { useAppStore } from './store';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Toast from './components/shared/Toast';

function ProtectedRoutes() {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const { setUser, setLowStockItems } = useAppStore();

  useEffect(() => {
    authApi.me()
      .then((res) => {
        setUser(res.data.user);
        return itemsApi.lowStock();
      })
      .then((res) => setLowStockItems(res.data.data))
      .catch(() => {
        setUser(null);
      });
  }, []);

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
