import { useState, useCallback } from 'react';
import api from '../services/api';
import { hasReimbursementReceipt, getReimbursementReceiptUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

function isImageReceipt(item) {
  const k = String(item.receiptKey || item.receipt_key || '').toLowerCase();
  const u = String(item.receiptUrl || item.receipt_url || '').toLowerCase();
  return /\.(jpe?g|png)$/i.test(k) || /\.(jpe?g|png)(\?|$)/i.test(u);
}

export default function ReceiptCell({ item }) {
  const [thumb, setThumb] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadThumb = useCallback(async () => {
    if (thumb || loading || !hasReimbursementReceipt(item) || !isImageReceipt(item)) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/reimbursements/${item._id}/receipt`);
      if (data?.url) setThumb(data.url);
    } catch {
      /* ignore thumb errors */
    } finally {
      setLoading(false);
    }
  }, [item, thumb, loading]);

  const open = async () => {
    try {
      const url = await getReimbursementReceiptUrl(item._id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Could not open receipt');
    }
  };

  if (!hasReimbursementReceipt(item)) {
    return <span className="text-xs text-surface-400">—</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1 min-w-[3.5rem]">
      <button
        type="button"
        className="h-14 w-14 rounded-lg border border-surface-200 bg-surface-50 overflow-hidden flex items-center justify-center hover:border-brand-300 transition-colors"
        onMouseEnter={loadThumb}
        onClick={open}
        title="View receipt"
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl" aria-hidden>
            {isImageReceipt(item) ? '🖼' : '📄'}
          </span>
        )}
      </button>
      <button type="button" className="text-[10px] text-brand-600 font-600 hover:text-brand-700" onClick={open}>
        View
      </button>
    </div>
  );
}
