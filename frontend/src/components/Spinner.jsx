const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} ${className} animate-spin rounded-full border-2 border-surface-200 border-t-brand-600`} />
  );
};

export const PageSpinner = () => (
  <div className="flex items-center justify-center h-60">
    <Spinner size="lg" />
  </div>
);

export default Spinner;
