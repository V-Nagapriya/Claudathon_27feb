import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { itemsApi } from '../api/items';
import { useAppStore } from '../store';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setLowStockItems, showToast } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      setUser(res.data.user);
      const ls = await itemsApi.lowStock();
      setLowStockItems(ls.data.data);
      showToast('success', `Welcome back, ${res.data.user.username}!`);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">InvenTrack</h1>
            <p className="text-xs text-gray-500">Inventory Management System</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the dashboard</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin or viewer"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-2">Demo accounts:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-left transition-colors"
              onClick={() => { setUsername('admin'); setPassword('admin123'); }}
            >
              <span className="font-medium text-gray-900">admin</span>
              <span className="text-gray-400 ml-1">/ admin123</span>
              <br /><span className="text-blue-600">Full access</span>
            </button>
            <button
              className="text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-left transition-colors"
              onClick={() => { setUsername('viewer'); setPassword('viewer123'); }}
            >
              <span className="font-medium text-gray-900">viewer</span>
              <span className="text-gray-400 ml-1">/ viewer123</span>
              <br /><span className="text-gray-500">Read-only</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
