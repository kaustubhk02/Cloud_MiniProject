import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NotFound = () => {
  const { user } = useSelector((s) => s.auth);
  const home = user ? (user.role === 'manager' ? '/manager' : '/dashboard') : '/login';

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center text-center p-6">
      <p className="font-display text-[8rem] font-800 text-brand-600 leading-none mb-4">404</p>
      <h1 className="font-display text-3xl font-700 text-white mb-3">Page Not Found</h1>
      <p className="text-surface-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <Link to={home} className="btn-primary px-8 py-3 text-base">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
