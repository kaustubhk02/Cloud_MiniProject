import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(user.role === 'manager' ? '/manager' : '/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      const role = result.payload.user.role;
      navigate(role === 'manager' ? '/manager' : '/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-surface-950 via-surface-900 to-brand-900">
        <div>
          <span className="font-display text-2xl font-700 text-white">
            Reimburse<span className="text-brand-400">Pro</span>
          </span>
        </div>
        <div>
          <h1 className="font-display text-5xl font-800 text-white leading-tight mb-4">
            Expense claims,<br />
            <span className="text-brand-400">simplified.</span>
          </h1>
          <p className="text-surface-400 text-lg leading-relaxed max-w-md">
            Submit, track, and manage employee reimbursements with full role-based access control.
          </p>
        </div>
        <div className="flex gap-8 text-surface-500 text-sm">
          <span>🔒 JWT Secured</span>
          <span>📊 Role-based Access</span>
          <span>⚡ Real-time Updates</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display text-2xl font-700 text-white">
              Reimburse<span className="text-brand-400">Pro</span>
            </span>
          </div>

          <h2 className="font-display text-3xl font-700 text-white mb-2">Sign in</h2>
          <p className="text-surface-400 mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="label text-surface-300">Email</label>
              <input
                type="email"
                className={`input bg-surface-800 border-surface-700 text-white placeholder:text-surface-500 focus:border-brand-500 ${errors.email ? 'input-error' : ''}`}
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label text-surface-300">Password</label>
              <input
                type="password"
                className={`input bg-surface-800 border-surface-700 text-white placeholder:text-surface-500 focus:border-brand-500 ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-surface-400 text-sm text-center mt-6">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-600 transition-colors">
              Register here
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl border border-surface-700 bg-surface-800/50">
            <p className="text-xs text-surface-400 font-600 uppercase tracking-widest mb-3">Demo Credentials</p>
            <div className="space-y-2 text-xs font-mono text-surface-300">
              <div className="flex justify-between">
                <span className="text-surface-500">Employee:</span>
                <span>employee@demo.com / password123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Manager:</span>
                <span>manager@demo.com / password123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
