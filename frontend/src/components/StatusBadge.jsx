const StatusBadge = ({ status }) => {
  const classes = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  };
  const dots = {
    pending: '●',
    approved: '●',
    rejected: '●',
  };
  return (
    <span className={classes[status] || 'badge bg-surface-100 text-surface-600'}>
      {dots[status]} {status}
    </span>
  );
};

export default StatusBadge;
