import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReimbursements, deleteReimbursement } from '../redux/slices/reimbursementsSlice';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import StatusBadge from '../components/StatusBadge';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import { PageSpinner } from '../components/Spinner';
import { formatCurrency, formatDate, CATEGORY_ICONS, capitalize } from '../utils/helpers';

const MyRequests = () => {
  const dispatch = useDispatch();
  const { items, loading, pagination, actionLoading } = useSelector((s) => s.reimbursements);

  const [filters, setFilters] = useState({
    status: 'all', category: 'all', search: '', startDate: '', endDate: '', page: 1, limit: 10,
  });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const params = {};
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.category !== 'all') params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    params.page = filters.page;
    params.limit = filters.limit;
    dispatch(fetchReimbursements(params));
  }, [filters, dispatch]);

  const handleDelete = async () => {
    const result = await dispatch(deleteReimbursement(deleteId));
    if (deleteReimbursement.fulfilled.match(result)) {
      toast.success('Request deleted');
    } else {
      toast.error('Failed to delete');
    }
    setDeleteId(null);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">My Requests</h1>
          <p className="text-surface-500 mt-1">Track all your reimbursement submissions</p>
        </div>
        <Link to="/submit" className="btn-primary">
          + New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8"><PageSpinner /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-surface-400">
            <p className="text-5xl mb-3">🔍</p>
            <p className="font-500 text-surface-600">No requests found</p>
            <p className="text-sm mt-1">Try adjusting your filters or submit a new request</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>
                    {['Category', 'Description', 'Amount', 'Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-600 text-surface-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span>{CATEGORY_ICONS[item.category]}</span>
                          <span className="text-sm font-500 text-surface-700 capitalize">{capitalize(item.category)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-sm text-surface-700 truncate">{item.description}</p>
                        {item.managerComments && (
                          <p className="text-xs text-surface-400 mt-0.5 italic truncate">"{item.managerComments}"</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-600 text-surface-900">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-surface-500">{formatDate(item.date)}</td>
                      <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-4">
                        {item.status === 'pending' && (
                          <div className="flex gap-2">
                            <Link
                              to={`/submit/${item._id}`}
                              className="text-xs btn-secondary px-2 py-1"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => setDeleteId(item._id)}
                              className="text-xs btn-danger px-2 py-1"
                              disabled={actionLoading}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-surface-50">
              {items.map((item) => (
                <div key={item._id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
                      <span className="text-sm font-600 text-surface-800 capitalize">{capitalize(item.category)}</span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-surface-600 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-700 text-surface-900">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-surface-400">{formatDate(item.date)}</p>
                    </div>
                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <Link to={`/submit/${item._id}`} className="text-xs btn-secondary px-2 py-1">Edit</Link>
                        <button onClick={() => setDeleteId(item._id)} className="text-xs btn-danger px-2 py-1">Delete</button>
                      </div>
                    )}
                  </div>
                  {item.managerComments && (
                    <p className="text-xs text-surface-400 mt-2 italic">Comment: "{item.managerComments}"</p>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 pb-4">
              <Pagination pagination={pagination} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
            </div>
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Request"
        message="Are you sure you want to delete this reimbursement request? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
};

export default MyRequests;
