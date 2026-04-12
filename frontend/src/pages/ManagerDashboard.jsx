import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStats, fetchReimbursements } from '../redux/slices/reimbursementsSlice';
import AppLayout from '../layouts/AppLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { PageSpinner } from '../components/Spinner';
import { formatCurrency, formatDate, CATEGORY_ICONS, capitalize } from '../utils/helpers';

const ManagerDashboard = () => {
  const dispatch = useDispatch();
  const { stats, statsLoading, items, loading } = useSelector((s) => s.reimbursements);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchReimbursements({ limit: 6, sort: '-createdAt', status: 'pending' }));
  }, [dispatch]);

  const summary = stats?.summary;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Manager Dashboard</h1>
        <p className="text-surface-500 mt-1">Review and manage all employee reimbursement requests.</p>
      </div>

      {/* Stats */}
      {statsLoading ? <PageSpinner /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Requests" count={summary?.total?.count ?? 0} amount={summary?.total?.totalAmount ?? 0} color="brand" />
          <StatCard label="Pending Review" count={summary?.pending?.count ?? 0} amount={summary?.pending?.totalAmount ?? 0} color="amber" />
          <StatCard label="Approved" count={summary?.approved?.count ?? 0} amount={summary?.approved?.totalAmount ?? 0} color="emerald" />
          <StatCard label="Rejected" count={summary?.rejected?.count ?? 0} amount={summary?.rejected?.totalAmount ?? 0} color="red" />
        </div>
      )}

      {/* Category breakdown */}
      {stats?.categoryBreakdown?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="card p-5">
            <h2 className="section-title mb-4">Approved Spend by Category</h2>
            <div className="space-y-3">
              {stats.categoryBreakdown.map((c) => {
                const pct = summary?.approved?.totalAmount
                  ? Math.round((c.totalAmount / summary.approved.totalAmount) * 100)
                  : 0;
                return (
                  <div key={c._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 text-surface-600 font-500">
                        <span>{CATEGORY_ICONS[c._id]}</span>
                        <span className="capitalize">{c._id.replace('_', ' ')}</span>
                        <span className="text-surface-400">({c.count})</span>
                      </span>
                      <span className="font-mono font-600 text-surface-800">{formatCurrency(c.totalAmount)}</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approval rate */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Approval Overview</h2>
            <div className="space-y-4">
              {['approved', 'rejected', 'pending'].map((s) => {
                const count = summary?.[s]?.count ?? 0;
                const total = summary?.total?.count ?? 1;
                const pct = Math.round((count / total) * 100);
                const colors = { approved: 'bg-emerald-500', rejected: 'bg-red-500', pending: 'bg-amber-400' };
                return (
                  <div key={s}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-500 text-surface-600">{s}</span>
                      <span className="text-surface-800 font-600">{count} <span className="text-surface-400 font-400">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[s]} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pending requests */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div>
            <h2 className="section-title">Pending Requests</h2>
            <p className="text-xs text-surface-400 mt-0.5">Requests awaiting your review</p>
          </div>
          <Link to="/manager/requests" className="text-sm text-brand-600 hover:text-brand-700 font-600">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-8"><PageSpinner /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-surface-400">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-500 text-surface-600">All caught up!</p>
            <p className="text-sm">No pending requests to review.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-50">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-lg flex-shrink-0">
                  {CATEGORY_ICONS[item.category] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-600 text-surface-800 text-sm truncate">{item.userId?.name}</p>
                    <span className="text-surface-300">·</span>
                    <span className="text-xs text-surface-400 capitalize">{capitalize(item.category)}</span>
                  </div>
                  <p className="text-xs text-surface-500 truncate">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="font-mono font-700 text-surface-900">{formatCurrency(item.amount)}</p>
                  <p className="text-xs text-surface-400">{formatDate(item.date)}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ManagerDashboard;
