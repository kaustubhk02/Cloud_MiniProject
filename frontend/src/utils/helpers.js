import api from '../services/api';

/** Opens receipt in a new tab (presigned S3 or local/proxied URL). */
export async function openReimbursementReceipt(id) {
  const { data } = await api.get(`/reimbursements/${id}/receipt`);
  if (data?.url) {
    window.open(data.url, '_blank', 'noopener,noreferrer');
    return;
  }
  throw new Error(data?.message || 'Could not open receipt');
}

export const hasReimbursementReceipt = (item) =>
  Boolean(item?.receiptUrl || item?.receiptKey || item?.receipt_url || item?.receipt_key);

// Format currency in INR or USD
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date to readable string
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format datetime
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Capitalize first letter
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');

// Category options
export const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food & Meals' },
  { value: 'medical', label: 'Medical' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'training', label: 'Training & Courses' },
  { value: 'other', label: 'Other' },
];

// Status options
export const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// Category icon map (emoji fallback)
export const CATEGORY_ICONS = {
  travel: '✈️',
  food: '🍽️',
  medical: '🏥',
  accommodation: '🏨',
  office_supplies: '📎',
  training: '📚',
  other: '📌',
};
