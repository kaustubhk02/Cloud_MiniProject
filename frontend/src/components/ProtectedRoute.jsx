import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Protects routes from unauthenticated access.
 * Optionally restricts to specific roles.
 */
const ProtectedRoute = ({ roles }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    return <Navigate to={user.role === 'manager' ? '/manager' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
