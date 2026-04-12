import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

const NAV_EMPLOYEE = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { path: '/submit', label: 'Submit Request', icon: '+' },
  { path: '/my-requests', label: 'My Requests', icon: '≡' },
];

const NAV_MANAGER = [
  { path: '/manager', label: 'Dashboard', icon: '⬡' },
  { path: '/manager/requests', label: 'All Requests', icon: '≡' },
];

const AppLayout = ({ children }) => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = user?.role === 'manager' ? NAV_MANAGER : NAV_EMPLOYEE;

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-surface-950 text-white">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-800">
        <span className="font-display text-xl font-700 text-white tracking-tight">
          Reimburse<span className="text-brand-400">Pro</span>
        </span>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-700 font-display text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-600 text-white truncate">{user?.name}</p>
            <p className="text-xs text-surface-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ path, label, icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 transition-all duration-150
                ${active
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-surface-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-500 text-surface-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <span className="text-base w-5 text-center">↩</span>
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-60 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 h-full flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-950 text-white">
          <span className="font-display text-lg font-700">
            Reimburse<span className="text-brand-400">Pro</span>
          </span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800"
          >
            ☰
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
