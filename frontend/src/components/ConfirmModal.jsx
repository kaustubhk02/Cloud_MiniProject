const ConfirmModal = ({ isOpen, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-sm p-6 animate-fade-in">
        <h3 className="section-title mb-2">{title}</h3>
        <p className="text-sm text-surface-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
