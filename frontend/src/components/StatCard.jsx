import { formatCurrency } from '../utils/helpers';

const StatCard = ({ label, count, amount, color = 'brand' }) => {
  const colors = {
    brand: 'from-brand-500 to-brand-700',
    amber: 'from-amber-400 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-700',
    red: 'from-red-500 to-red-700',
  };
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-10 rounded-bl-[4rem]`} />
      <p className="text-xs font-600 text-surface-500 uppercase tracking-widest mb-3">{label}</p>
      <p className="font-display text-3xl font-700 text-surface-900">{count}</p>
      {amount !== undefined && (
        <p className="text-sm text-surface-500 mt-1 font-mono">{formatCurrency(amount)}</p>
      )}
    </div>
  );
};

export default StatCard;
