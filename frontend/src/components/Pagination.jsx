const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-surface-500">
        Page <span className="font-600 text-surface-800">{page}</span> of{' '}
        <span className="font-600 text-surface-800">{pages}</span>
      </p>
      <div className="flex gap-2">
        <button
          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-colors ${p === page ? 'bg-brand-600 text-white' : 'btn-secondary'}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          );
        })}
        <button
          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
