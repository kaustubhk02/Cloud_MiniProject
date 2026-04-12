import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createReimbursement,
  updateReimbursement,
  fetchReimbursements,
  deleteReceiptAttachment,
  fetchManagers,
} from '../redux/slices/reimbursementsSlice';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import Spinner from '../components/Spinner';
import { CATEGORIES, openReimbursementReceipt, hasReimbursementReceipt } from '../utils/helpers';

const SubmitRequest = () => {
  const { id } = useParams(); // id means edit mode
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { actionLoading, items, managers, managersLoading } = useSelector((s) => s.reimbursements);

  const existingItem = id ? items.find((i) => String(i._id) === String(id)) : null;

  const [form, setForm] = useState({
    amount: '',
    category: 'travel',
    description: '',
    date: new Date().toISOString().split('T')[0],
    assignedManagerId: '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);

  // Populate form in edit mode
  useEffect(() => {
    if (existingItem) {
      setForm({
        amount: existingItem.amount,
        category: existingItem.category,
        description: existingItem.description,
        date: new Date(existingItem.date).toISOString().split('T')[0],
        assignedManagerId: existingItem.assignedManagerId != null ? String(existingItem.assignedManagerId) : '',
      });
    }
  }, [existingItem]);

  useEffect(() => {
    dispatch(fetchManagers());
  }, [dispatch]);

  // If editing but item not loaded yet, fetch
  useEffect(() => {
    if (id && items.length === 0) {
      dispatch(fetchReimbursements({ limit: 100 }));
    }
  }, [id, items.length, dispatch]);

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a valid positive amount';
    if (!form.category) e.category = 'Category is required';
    if (!form.description || form.description.trim().length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.date) e.date = 'Date is required';
    if (!form.assignedManagerId) e.assignedManager = 'Choose a manager who will review this request';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append('amount', form.amount);
    fd.append('category', form.category);
    fd.append('description', form.description);
    fd.append('date', form.date);
    fd.append('assigned_manager_id', form.assignedManagerId);
    if (file) fd.append('receipt', file);

    let result;
    if (id) {
      result = await dispatch(updateReimbursement({ id, formData: fd }));
      if (updateReimbursement.fulfilled.match(result)) {
        toast.success('Request updated successfully!');
        navigate('/my-requests');
      } else {
        toast.error(result.payload || 'Update failed');
      }
    } else {
      result = await dispatch(createReimbursement(fd));
      if (createReimbursement.fulfilled.match(result)) {
        toast.success('Reimbursement request submitted!');
        navigate('/my-requests');
      } else {
        toast.error(result.payload || 'Submission failed');
      }
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-sm text-surface-500 hover:text-surface-700 mb-3 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="page-title">{id ? 'Edit Request' : 'Submit Reimbursement'}</h1>
          <p className="text-surface-500 mt-1">
            {id ? 'Update your pending reimbursement request.' : 'Fill in the details of your expense claim.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-6" noValidate>
          {/* Assigned manager */}
          <div>
            <label className="label">Reviewing manager</label>
            <p className="text-xs text-surface-500 mb-2">Only this manager will see and approve or reject this request.</p>
            {managersLoading ? (
              <div className="py-2"><Spinner size="sm" /></div>
            ) : (
              <select
                className={`input ${errors.assignedManager ? 'input-error' : ''}`}
                value={form.assignedManagerId}
                onChange={(e) => setForm({ ...form, assignedManagerId: e.target.value })}
                required
              >
                <option value="">Select a manager…</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            )}
            {errors.assignedManager && <p className="text-red-500 text-xs mt-1">{errors.assignedManager}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 font-mono">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input pl-8 font-mono ${errors.amount ? 'input-error' : ''}`}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`py-2 px-3 rounded-xl text-xs font-600 border transition-all text-center
                    ${form.category === cat.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-surface-200 text-surface-600 hover:border-brand-300 hover:text-brand-600'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="label">Expense Date</label>
            <input
              type="date"
              className={`input ${errors.date ? 'input-error' : ''}`}
              value={form.date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              className={`input resize-none h-28 ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the expense in detail (min. 10 characters)…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex justify-between mt-1">
              {errors.description
                ? <p className="text-red-500 text-xs">{errors.description}</p>
                : <span />}
              <p className="text-xs text-surface-400">{form.description.length}/500</p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="label">Attachment <span className="text-surface-400 font-400">(optional)</span></label>
            {id && existingItem && hasReimbursementReceipt(existingItem) && !file && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  type="button"
                  className="text-xs btn-secondary px-3 py-1.5"
                  onClick={async () => {
                    try {
                      await openReimbursementReceipt(existingItem._id);
                    } catch {
                      toast.error('Could not open receipt');
                    }
                  }}
                >
                  View current receipt
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700 font-600 px-2"
                  disabled={actionLoading}
                  onClick={async () => {
                    const r = await dispatch(deleteReceiptAttachment(existingItem._id));
                    if (deleteReceiptAttachment.fulfilled.match(r)) toast.success('Attachment removed');
                    else toast.error(r.payload || 'Failed to remove');
                  }}
                >
                  Remove attachment
                </button>
              </div>
            )}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-surface-200 hover:border-surface-300'}`}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-surface-700">
                  <span className="text-xl">📎</span>
                  <span className="font-500">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-red-400 hover:text-red-600 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-3xl mb-2">📂</p>
                  <p className="text-sm text-surface-500">
                    Drag & drop or <span className="text-brand-600 font-600">browse</span>
                  </p>
                  <p className="text-xs text-surface-400 mt-1">JPG, PNG, PDF up to 5MB</p>
                </>
              )}
              {id && existingItem && hasReimbursementReceipt(existingItem) && !file && (
                <p className="text-xs text-emerald-600 mt-2">✓ Upload a new file below to replace the current receipt</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={actionLoading}>
              {actionLoading ? <Spinner size="sm" /> : id ? 'Update Request' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default SubmitRequest;
