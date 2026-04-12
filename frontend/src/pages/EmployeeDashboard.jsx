import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStats, fetchReimbursements } from '../redux/slices/reimbursementsSlice';
import AppLayout from '../layouts/AppLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { PageSpinner } from '../components/Spinner';
import {
  formatCurrency,
  formatDate,
  CATEGORY_ICONS,
  capitalize,
  hasReimbursementReceipt,
  openReimbursementReceipt,
} from '../utils/helpers';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { stats, statsLoading, items, loading } = useSelector((s) => s.reimbursements);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchReimbursements({ limit: 5, sort: '-createdAt' }));
  }, [dispatch]);

  const summary = stats?.summary;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">
          Good {getGreeting()},{' '}
          <span className="text-brand-600">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-surface-500 mt-1">Here's a snapshot of your reimbursement activity.</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <PageSpinner />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Requests"
            count={summary?.total?.count ?? 0}
            amount={summary?.total?.totalAmount ?? 0}
            color="brand"
          />
          <StatCard
            label="Pending"
            count={summary?.pending?.count ?? 0}
            amount={summary?.pending?.totalAmount ?? 0}
            color="amber"
          />
          <StatCard
            label="Approved"
            count={summary?.approved?.count ?? 0}
            amount={summary?.approved?.totalAmount ?? 0}
            color="emerald"
          />
          <StatCard
            label="Rejected"
            count={summary?.rejected?.count ?? 0}
            amount={summary?.rejected?.totalAmount ?? 0}
            color="red"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/submit"
          className="card p-6 flex items-center gap-4 hover:shadow-elevated transition-shadow group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            ➕
          </div>
          <div>
            <p className="font-display font-600 text-surface-900">New Request</p>
            <p className="text-sm text-surface-500">Submit a reimbursement claim</p>
          </div>
          <span className="ml-auto text-surface-300 group-hover:text-brand-500 transition-colors text-xl">→</span>
        </Link>

        <Link
          to="/my-requests"
          className="card p-6 flex items-center gap-4 hover:shadow-elevated transition-shadow group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📋
          </div>
          <div>
            <p className="font-display font-600 text-surface-900">My Requests</p>
            <p className="text-sm text-surface-500">View & manage your submissions</p>
          </div>
          <span className="ml-auto text-surface-300 group-hover:text-brand-500 transition-colors text-xl">→</span>
        </Link>
      </div>

      {/* Recent requests */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="section-title">Recent Requests</h2>
          <Link to="/my-requests" className="text-sm text-brand-600 hover:text-brand-700 font-600">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-8"><PageSpinner /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-surface-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-500">No requests yet.</p>
            <Link to="/submit" className="text-brand-600 text-sm hover:underline">Submit your first request →</Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-50">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-lg flex-shrink-0">
                  {CATEGORY_ICONS[item.category] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-500 text-surface-800 truncate">{item.description}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{capitalize(item.category)} · {formatDate(item.date)}</p>
                  {hasReimbursementReceipt(item) && (
                    <button
                      type="button"
                      className="text-[10px] text-brand-600 font-600 mt-0.5"
                      onClick={async () => {
                        try {
                          await openReimbursementReceipt(item._id);
                        } catch {
                          toast.error('Could not open receipt');
                        }
                      }}
                    >
                      Receipt
                    </button>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-600 font-mono text-surface-900">{formatCurrency(item.amount)}</p>
                  <div className="mt-1"><StatusBadge status={item.status} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {stats?.categoryBreakdown?.length > 0 && (
        <div className="card mt-4">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="section-title">Approved by Category</h2>
          </div>
          <div className="p-6 space-y-3">
            {stats.categoryBreakdown.map((c) => {
              const pct = summary?.approved?.totalAmount
                ? Math.round((c.totalAmount / summary.approved.totalAmount) * 100)
                : 0;
              return (
                <div key={c._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-600 font-500 capitalize">{c._id.replace('_', ' ')}</span>
                    <span className="font-mono font-600 text-surface-800">{formatCurrency(c.totalAmount)}</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default EmployeeDashboard;
