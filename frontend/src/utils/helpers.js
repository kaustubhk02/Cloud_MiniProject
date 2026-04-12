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
