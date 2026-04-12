import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReimbursements,
  approveReimbursement,
  rejectReimbursement,
} from '../redux/slices/reimbursementsSlice';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import StatusBadge from '../components/StatusBadge';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import Spinner, { PageSpinner } from '../components/Spinner';
import ReceiptCell from '../components/ReceiptCell';
import {
  formatCurrency,
  formatDate,
  CATEGORY_ICONS,
  capitalize,
  hasReimbursementReceipt,
  openReimbursementReceipt,
} from '../utils/helpers';

const ActionModal = ({ item, action, onClose, onConfirm, loading }) => {
  const [comment, setComment] = useState('');
  if (!item) return null;
  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isApprove ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {isApprove ? '✅' : '❌'}
          </div>
          <div>
            <h3 className="section-title">{isApprove ? 'Approve Request' : 'Reject Request'}</h3>
            <p className="text-xs text-surface-400">{item.userId?.name} · {formatCurrency(item.amount)}</p>
          </div>
        </div>

        <div className="bg-surface-50 rounded-xl p-3 mb-4 text-sm text-surface-600">
          <p className="font-500 mb-1">{capitalize(item.category)}</p>
          <p className="text-surface-500">{item.description}</p>
          {hasReimbursementReceipt(item) && (
            <button
              type="button"
              className="mt-2 text-xs text-brand-600 font-600 hover:text-brand-700"
              onClick={async () => {
                try {
                  await openReimbursementReceipt(item._id);
                } catch {
                  toast.error('Could not open receipt');
                }
              }}
            >
              Open receipt
            </button>
          )}
        </div>

        <div className="mb-5">
          <label className="label">
            Comment <span className="text-surface-400 font-400">(optional)</span>
          </label>
          <textarea
            className="input resize-none h-24"
            placeholder={isApprove ? 'e.g. Approved as per policy.' : 'e.g. Missing receipt, please resubmit.'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`flex-1 ${isApprove ? 'btn-success' : 'btn-danger'}`}
            onClick={() => onConfirm(comment)}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ManagerRequests = () => {
  const dispatch = useDispatch();
  const { items, loading, pagination, actionLoading } = useSelector((s) => s.reimbursements);

  const [filters, setFilters] = useState({
    status: 'all', category: 'all', search: '', startDate: '', endDate: '', page: 1, limit: 10,
  });
  const [modal, setModal] = useState({ open: false, item: null, action: null });

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

  const openModal = (item, action) => setModal({ open: true, item, action });
  const closeModal = () => setModal({ open: false, item: null, action: null });

  const handleAction = async (comment) => {
    const { item, action } = modal;
    const thunk = action === 'approve' ? approveReimbursement : rejectReimbursement;
    const result = await dispatch(thunk({ id: item._id, managerComments: comment }));
    if (thunk.fulfilled.match(result)) {
      toast.success(action === 'approve' ? 'Request approved!' : 'Request rejected.');
    } else {
      toast.error(result.payload || 'Action failed');
    }
    closeModal();
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">All Requests</h1>
        <p className="text-surface-500 mt-1">Requests assigned to you by employees. Approve or reject from here.</p>
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
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 border-b border-surface-100">
                  <tr>
                    {['Employee', 'Category', 'Description', 'Receipt', 'Amount', 'Date', 'Status', 'Actions'].map((h) => (
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
                        <div>
                          <p className="text-sm font-600 text-surface-800">{item.userId?.name}</p>
                          <p className="text-xs text-surface-400">{item.userId?.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span>{CATEGORY_ICONS[item.category]}</span>
                          <span className="text-sm text-surface-700 capitalize">{capitalize(item.category)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="text-sm text-surface-700 truncate">{item.description}</p>
                        {item.managerComments && (
                          <p className="text-xs text-surface-400 italic truncate">"{item.managerComments}"</p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <ReceiptCell item={item} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-700 text-surface-900">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-surface-500 whitespace-nowrap">{formatDate(item.date)}</td>
                      <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-4">
                        {item.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal(item, 'approve')}
                              className="btn-success text-xs px-3 py-1.5"
                              disabled={actionLoading}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openModal(item, 'reject')}
                              className="btn-danger text-xs px-3 py-1.5"
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-surface-400">
                            <p>By {item.reviewedBy?.name || 'Manager'}</p>
                            <p>{formatDate(item.reviewedAt)}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-surface-50">
              {items.map((item) => (
                <div key={item._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-600 text-surface-800">{item.userId?.name}</p>
                      <p className="text-xs text-surface-400">{item.userId?.email}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <span>{CATEGORY_ICONS[item.category]}</span>
                    <span className="capitalize">{capitalize(item.category)}</span>
                    <span className="text-surface-300">·</span>
                    <span className="font-mono font-700 text-surface-900">{formatCurrency(item.amount)}</span>
                  </div>
                  <p className="text-sm text-surface-500 line-clamp-2">{item.description}</p>
                  {hasReimbursementReceipt(item) && (
                    <div className="flex items-center gap-2">
                      <ReceiptCell item={item} />
                    </div>
                  )}
                  {item.managerComments && (
                    <p className="text-xs text-surface-400 italic">Comment: "{item.managerComments}"</p>
                  )}
                  {item.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openModal(item, 'approve')} className="btn-success text-xs flex-1">Approve</button>
                      <button onClick={() => openModal(item, 'reject')} className="btn-danger text-xs flex-1">Reject</button>
                    </div>
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

      {/* Action Modal */}
      <ActionModal
        item={modal.item}
        action={modal.action}
        onClose={closeModal}
        onConfirm={handleAction}
        loading={actionLoading}
      />
    </AppLayout>
  );
};

export default ManagerRequests;
