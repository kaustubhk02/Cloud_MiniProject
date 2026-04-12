import { CATEGORIES, STATUSES } from '../utils/helpers';

const FilterBar = ({ filters, onChange, showSearch = true }) => {
  const handleChange = (field, value) => onChange({ ...filters, [field]: value, page: 1 });

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {showSearch && (
        <div className="flex-1 min-w-[180px]">
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Search description, category…"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>
      )}

      <div className="min-w-[140px]">
        <label className="label">Status</label>
        <select className="input" value={filters.status || 'all'} onChange={(e) => handleChange('status', e.target.value)}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="min-w-[160px]">
        <label className="label">Category</label>
        <select className="input" value={filters.category || 'all'} onChange={(e) => handleChange('category', e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div>
        <label className="label">From</label>
        <input type="date" className="input" value={filters.startDate || ''} onChange={(e) => handleChange('startDate', e.target.value)} />
      </div>

      <div>
        <label className="label">To</label>
        <input type="date" className="input" value={filters.endDate || ''} onChange={(e) => handleChange('endDate', e.target.value)} />
      </div>

      <button
        className="btn-secondary"
        onClick={() => onChange({ status: 'all', category: 'all', search: '', startDate: '', endDate: '', page: 1 })}
      >
        Reset
      </button>
    </div>
  );
};

export default FilterBar;
